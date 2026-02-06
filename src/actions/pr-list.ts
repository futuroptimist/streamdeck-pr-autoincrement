import streamDeck, {
	action,
	SingletonAction,
	type KeyDownEvent,
	type WillAppearEvent,
} from "@elgato/streamdeck";
import { spawn } from "child_process";

/**
 * Regex to match a GitHub PR URL ending with /pull/<number> with optional trailing slash/whitespace.
 * Captures the PR number.
 */
const PR_URL_REGEX = /\/pull\/(\d+)\/?\s*$/;
const DEBUG_UI_ENABLED = process.env.PR_AUTOINC_DEBUG_UI === "1";
const PREVIEW_LIMIT = 120;
const MAX_ERROR_TITLE_LENGTH = 12;

type ParsedPrUrl = {
	prNumber: number;
	prefix: string;
	trimmedUrl: string;
};

function sanitizePreview(value: string): string {
	const normalized = value.replace(/\s+/g, " ").trim();
	if (normalized.length > PREVIEW_LIMIT) {
		return `${normalized.slice(0, PREVIEW_LIMIT)}…`;
	}
	return normalized;
}

function truncateTitle(value: string, maxLength = MAX_ERROR_TITLE_LENGTH): string {
	if (value.length <= maxLength) {
		return value;
	}
	return value.slice(0, maxLength);
}

async function setDebugTitle(actionInstance: KeyDownEvent["action"], title: string): Promise<void> {
	if (!DEBUG_UI_ENABLED) {
		return;
	}
	try {
		await actionInstance.setTitle(title);
	} catch (error) {
		streamDeck.logger.error(
			`Failed to set debug title "${title}": ${
				error instanceof Error ? error.message : String(error)
			}`
		);
		if (error instanceof Error && error.stack) {
			streamDeck.logger.error(`Debug title error stack: ${error.stack}`);
		}
	}
}

function parsePrUrl(url: string): ParsedPrUrl {
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
	return { prNumber, prefix, trimmedUrl };
}

function buildPrListFromParsed(parsed: ParsedPrUrl, count = 4): string {
	const urls: string[] = [];
	for (let i = 0; i < count; i++) {
		urls.push(`- ${parsed.prefix}${parsed.prNumber + i}`);
	}

	return urls.join("\n");
}

export function buildPrListFromUrl(url: string, count = 4): string {
	return buildPrListFromParsed(parsePrUrl(url), count);
}

/**
 * Reads text from the system clipboard.
 * Uses pbpaste on macOS, PowerShell Get-Clipboard on Windows.
 */
async function readClipboard(): Promise<string> {
	const isMac = process.platform === "darwin";
	return new Promise((resolve, reject) => {
		const command = isMac
			? { file: "pbpaste", args: [] }
			: { file: "powershell.exe", args: ["-NoProfile", "-Command", "Get-Clipboard -Raw"] };
		streamDeck.logger.info(
			`Clipboard read command: ${command.file} ${command.args.join(" ")}`
		);
		const proc = spawn(command.file, command.args, { shell: false });
		let output = "";
		let stderrOutput = "";

		proc.stdout.on("data", (chunk: Buffer | string) => {
			output += chunk.toString();
		});

		if (proc.stderr) {
			proc.stderr.on("data", (chunk: Buffer | string) => {
				stderrOutput += chunk.toString();
			});
		}

		proc.on("error", reject);
		proc.on("close", (code) => {
			if (stderrOutput) {
				streamDeck.logger.info(
					`Clipboard read stderr: ${sanitizePreview(stderrOutput)}`
				);
			}
			streamDeck.logger.info(`Clipboard read exit code: ${code ?? "unknown"}`);
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

	return new Promise((resolve, reject) => {
		let proc;
		let commandLabel = "";
		if (isMac) {
			proc = spawn("pbcopy", [], { shell: false });
			commandLabel = "pbcopy";
		} else {
			// On Windows, use PowerShell with stdin input
			proc = spawn(
				"powershell.exe",
				["-NoProfile", "-Command", "Set-Clipboard -Value ([Console]::In.ReadToEnd())"],
				{ shell: false }
			);
			commandLabel = "powershell.exe -NoProfile -Command Set-Clipboard -Value ([Console]::In.ReadToEnd())";
		}
		streamDeck.logger.info(`Clipboard write command: ${commandLabel}`);
		let stderrOutput = "";

		proc.on("error", reject);
		if (proc.stderr) {
			proc.stderr.on("data", (chunk: Buffer | string) => {
				stderrOutput += chunk.toString();
			});
		}
		proc.on("close", (code) => {
			if (stderrOutput) {
				streamDeck.logger.info(
					`Clipboard write stderr: ${sanitizePreview(stderrOutput)}`
				);
			}
			streamDeck.logger.info(`Clipboard write exit code: ${code ?? "unknown"}`);
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

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		streamDeck.logger.info(
			`PRListAction ready: actionUuid=${ev.action.manifestId} actionId=${ev.action.id}`
		);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		let stage = "READ_CLIPBOARD_START";
		const now = new Date().toISOString();
		streamDeck.logger.info(
			`onKeyDown fired at ${now} actionUuid=${ev.action.manifestId} actionId=${ev.action.id}`
		);
		try {
			// Read clipboard content
			streamDeck.logger.info(`STAGE=${stage}`);
			await setDebugTitle(ev.action, "READ");
			const clipboardContent = await readClipboard();
			streamDeck.logger.info(
				`STAGE=READ_CLIPBOARD_DONE length=${clipboardContent.length} preview="${sanitizePreview(
					clipboardContent
				)}"`
			);
			stage = "PARSE_START";
			streamDeck.logger.info(`STAGE=${stage}`);
			await setDebugTitle(ev.action, "PARSE");
			const parsed = parsePrUrl(clipboardContent);
			streamDeck.logger.info(
				`STAGE=PARSE_DONE prNumber=${parsed.prNumber} prefix="${parsed.prefix}"`
			);
			const output = buildPrListFromParsed(parsed, 4);

			// Write to clipboard
			stage = "WRITE_CLIPBOARD_START";
			streamDeck.logger.info(`STAGE=${stage}`);
			await setDebugTitle(ev.action, "WRITE");
			await writeClipboard(output);
			streamDeck.logger.info(`STAGE=WRITE_CLIPBOARD_DONE length=${output.length}`);

			// Show success feedback
			await ev.action.showOk();
			await setDebugTitle(ev.action, "OK");

			streamDeck.logger.info("STAGE=SUCCESS");
			streamDeck.logger.info("Successfully generated PR list from clipboard content");
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			streamDeck.logger.error(
				`Failed to process clipboard at STAGE=${stage} on ${process.platform}: ${errorMessage}`
			);
			if (error instanceof Error) {
				streamDeck.logger.error(`Error name: ${error.name}`);
				if (error.stack) {
					streamDeck.logger.error(`Error stack: ${error.stack}`);
				}
			}
			await ev.action.showAlert();
			const errorTitle = DEBUG_UI_ENABLED ? `ERR:${stage}` : "ERR";
			try {
				await ev.action.setTitle(truncateTitle(errorTitle));
			} catch (titleError) {
				streamDeck.logger.error(
					`Failed to set error title: ${
						titleError instanceof Error ? titleError.message : String(titleError)
					}`
				);
				if (titleError instanceof Error && titleError.stack) {
					streamDeck.logger.error(`Error title stack: ${titleError.stack}`);
				}
			}
			if (this.clearTitleTimeout) {
				clearTimeout(this.clearTitleTimeout);
			}
			const currentAction = ev.action;
			this.clearTitleTimeout = setTimeout(() => {
				void currentAction.setTitle("").catch((titleError) => {
					streamDeck.logger.error(
						`Failed to clear error title on ${process.platform}: ${
							titleError instanceof Error ? titleError.message : String(titleError)
						}`
					);
				});
				this.clearTitleTimeout = undefined;
			}, 1500);
		}
	}
}
