import streamDeck, {
	action,
	SingletonAction,
	type KeyDownEvent,
	type WillAppearEvent
} from "@elgato/streamdeck";
import { spawn } from "child_process";

/**
 * Regex to match a GitHub PR URL ending with /pull/<number> with optional trailing slash/whitespace.
 * Captures the PR number.
 */
const PR_URL_REGEX = /\/pull\/(\d+)\/?\s*$/;
const MAX_PREVIEW_LENGTH = 120;
const DEBUG_UI_ENABLED = process.env.PR_AUTOINC_DEBUG_UI === "1";

const formatPreview = (value: string): string => {
	const compact = value.replace(/\s+/g, " ").trim();
	if (!compact) {
		return "(empty)";
	}
	return compact.length > MAX_PREVIEW_LENGTH
		? `${compact.slice(0, MAX_PREVIEW_LENGTH)}…`
		: compact;
};

const parsePrUrl = (url: string): { prefix: string; prNumber: number } => {
	const trimmedUrl = url.trim();
	const match = trimmedUrl.match(PR_URL_REGEX);

	if (!match) {
		throw new Error("Invalid PR URL");
	}

	const prNumber = Number.parseInt(match[1], 10);
	if (Number.isNaN(prNumber) || prNumber < 0) {
		throw new Error("Invalid PR number");
	}

	const prefix = trimmedUrl.replace(PR_URL_REGEX, "/pull/");
	return { prefix, prNumber };
};

const buildPrListFromParts = (prefix: string, prNumber: number, count = 4): string => {
	const urls: string[] = [];
	for (let i = 0; i < count; i++) {
		urls.push(`- ${prefix}${prNumber + i}`);
	}

	return urls.join("\n");
};

export function buildPrListFromUrl(url: string, count = 4): string {
	const { prefix, prNumber } = parsePrUrl(url);
	return buildPrListFromParts(prefix, prNumber, count);
}

/**
 * Reads text from the system clipboard.
 * Uses pbpaste on macOS, PowerShell Get-Clipboard on Windows.
 */
async function readClipboard(): Promise<string> {
	const isMac = process.platform === "darwin";
	const commandDescription = isMac
		? "pbpaste"
		: ["powershell.exe", "-NoProfile", "-Command", "Get-Clipboard -Raw"].join(" ");
	streamDeck.logger.info(`readClipboard using command: ${commandDescription}`);
	return new Promise((resolve, reject) => {
		const commandArgs = ["-NoProfile", "-Command", "Get-Clipboard -Raw"];
		const proc = isMac
			? spawn("pbpaste", [], { shell: false })
			: spawn("powershell.exe", commandArgs, { shell: false });
		let output = "";
		let stderrOutput = "";

		proc.stdout.on("data", (chunk: Buffer | string) => {
			output += chunk.toString();
		});
		proc.stderr?.on("data", (chunk: Buffer | string) => {
			stderrOutput += chunk.toString();
		});

		proc.on("error", reject);
		proc.on("close", (code) => {
			if (typeof code === "number") {
				streamDeck.logger.info(`readClipboard exit code: ${code}`);
			}
			if (stderrOutput.trim()) {
				streamDeck.logger.info(
					`readClipboard stderr: ${formatPreview(stderrOutput)}`
				);
			}
			if (code === 0) {
				resolve(output);
			} else {
				reject(new Error(`Clipboard read failed with exit code ${code}`));
			}
		});
	});
}

/**
 * Writes text to the system clipboard safely without shell interpolation.
 * Uses pbcopy on macOS, PowerShell Set-Clipboard on Windows.
 * Data is passed via stdin to avoid command injection.
 */
async function writeClipboard(text: string): Promise<void> {
	const isMac = process.platform === "darwin";
	const commandDescription = isMac
		? "pbcopy"
		: [
				"powershell.exe",
				"-NoProfile",
				"-Command",
				"Set-Clipboard -Value ([Console]::In.ReadToEnd())"
			].join(" ");
	streamDeck.logger.info(`writeClipboard using command: ${commandDescription}`);

	return new Promise((resolve, reject) => {
		let proc;
		if (isMac) {
			proc = spawn("pbcopy", [], { shell: false });
		} else {
			// On Windows, use PowerShell with stdin input
			const commandArgs = [
				"-NoProfile",
				"-Command",
				"Set-Clipboard -Value ([Console]::In.ReadToEnd())"
			];
			proc = spawn("powershell.exe", commandArgs, { shell: false });
		}

		let stderrOutput = "";
		proc.stderr?.on("data", (chunk: Buffer | string) => {
			stderrOutput += chunk.toString();
		});

		proc.on("error", reject);
		proc.on("close", (code) => {
			if (typeof code === "number") {
				streamDeck.logger.info(`writeClipboard exit code: ${code}`);
			}
			if (stderrOutput.trim()) {
				streamDeck.logger.info(
					`writeClipboard stderr: ${formatPreview(stderrOutput)}`
				);
			}
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Clipboard write failed with exit code ${code}`));
			}
		});

		if (!proc.stdin) {
			reject(new Error("stdin not available"));
			return;
		}

		proc.stdin.on("error", reject);

		try {
			proc.stdin.write(text);
			proc.stdin.end();
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * Action that reads a GitHub PR URL from clipboard and rewrites it
 * to a 4-line bullet list of incrementing PR URLs.
 */
@action({ UUID: "com.futuroptimist.prlist.fromclipboard" })
export class PRListAction extends SingletonAction {
	private clearTitleTimeout?: NodeJS.Timeout;

	override onWillAppear(ev: WillAppearEvent): void {
		streamDeck.logger.info(
			`PRListAction ready action=${ev.action.manifestId} instance=${ev.action.id}`
		);
	}

	private async setTitleSafe(action: KeyDownEvent["action"], title?: string): Promise<void> {
		try {
			await action.setTitle(title);
		} catch (error) {
			streamDeck.logger.error(
				`Failed to set title "${title ?? ""}" on ${process.platform}: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	private scheduleTitleClear(action: KeyDownEvent["action"], delayMs = 1500): void {
		if (this.clearTitleTimeout) {
			clearTimeout(this.clearTitleTimeout);
		}
		this.clearTitleTimeout = setTimeout(() => {
			void this.setTitleSafe(action, "");
			this.clearTitleTimeout = undefined;
		}, delayMs);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const timestamp = new Date().toISOString();
		streamDeck.logger.info(
			`PRListAction onKeyDown fired at ${timestamp} action=${
				ev.action.manifestId
			} instance=${ev.action.id}`
		);
		let stage = "READ_CLIPBOARD_START";
		let lastStage = stage;
		try {
			// Read clipboard content
			streamDeck.logger.info("PRListAction STAGE=READ_CLIPBOARD_START");
			if (DEBUG_UI_ENABLED) {
				await this.setTitleSafe(ev.action, "READ");
			}
			const clipboardContent = await readClipboard();
			streamDeck.logger.info(
				`PRListAction STAGE=READ_CLIPBOARD_DONE length=${clipboardContent.length} ` +
					`preview="${formatPreview(clipboardContent)}"`
			);

			stage = "PARSE_START";
			lastStage = stage;
			streamDeck.logger.info("PRListAction STAGE=PARSE_START");
			if (DEBUG_UI_ENABLED) {
				await this.setTitleSafe(ev.action, "PARSE");
			}
			const { prefix, prNumber } = parsePrUrl(clipboardContent);
			streamDeck.logger.info(
				`PRListAction STAGE=PARSE_DONE prNumber=${prNumber} prefix="${prefix}"`
			);
			const output = buildPrListFromParts(prefix, prNumber, 4);

			// Write to clipboard
			stage = "WRITE_CLIPBOARD_START";
			lastStage = stage;
			streamDeck.logger.info("PRListAction STAGE=WRITE_CLIPBOARD_START");
			if (DEBUG_UI_ENABLED) {
				await this.setTitleSafe(ev.action, "WRITE");
			}
			await writeClipboard(output);
			streamDeck.logger.info("PRListAction STAGE=WRITE_CLIPBOARD_DONE");

			// Show success feedback
			await ev.action.showOk();
			if (DEBUG_UI_ENABLED) {
				await this.setTitleSafe(ev.action, "OK");
				this.scheduleTitleClear(ev.action);
			}
			streamDeck.logger.info("PRListAction STAGE=SUCCESS");

			streamDeck.logger.info("Successfully generated PR list from clipboard content");
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const errorStack = error instanceof Error && error.stack ? error.stack : "no stack";
			streamDeck.logger.error(
				`Failed to process clipboard at ${stage} on ${process.platform}: ${errorMessage}`
			);
			streamDeck.logger.error(`PRListAction failure stage=${lastStage} stack=${errorStack}`);
			await ev.action.showAlert();
			const errorTitle = DEBUG_UI_ENABLED ? `ERR:${lastStage}` : "ERR";
			await this.setTitleSafe(ev.action, errorTitle.slice(0, 12));
			this.scheduleTitleClear(ev.action);
		}
	}
}

streamDeck.logger.info(
	`PRListAction module loaded (debug UI ${DEBUG_UI_ENABLED ? "enabled" : "disabled"})`
);
