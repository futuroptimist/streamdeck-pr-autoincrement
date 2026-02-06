import streamDeck, { action, SingletonAction, type KeyDownEvent } from "@elgato/streamdeck";
import { spawn } from "child_process";

/**
 * Regex to match a GitHub PR URL ending with /pull/<number> with optional trailing slash/whitespace.
 * Captures the PR number.
 */
const PR_URL_REGEX = /\/pull\/(\d+)\/?\s*$/;
const DEBUG_UI_ENABLED = process.env.PR_AUTOINC_DEBUG_UI === "1";
const MAX_PREVIEW_LENGTH = 120;
const DEBUG_TITLE_MAX_LENGTH = 12;

type ParsedPrUrl = {
	prNumber: number;
	prefix: string;
};

function sanitizePreview(value: string): string {
	return value.replace(/\s+/g, " ").trim().slice(0, MAX_PREVIEW_LENGTH);
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
	return { prNumber, prefix };
}

export function buildPrListFromUrl(url: string, count = 4): string {
	const { prNumber, prefix } = parsePrUrl(url);
	const urls: string[] = [];
	for (let i = 0; i < count; i++) {
		urls.push(`- ${prefix}${prNumber + i}`);
	}

	return urls.join("\n");
}

function logStage(stage: string, details?: string): void {
	const suffix = details ? ` ${details}` : "";
	streamDeck.logger.info(`[PRListAction] STAGE=${stage}${suffix}`);
}

function truncateTitle(title: string): string {
	return title.length <= DEBUG_TITLE_MAX_LENGTH ? title : title.slice(0, DEBUG_TITLE_MAX_LENGTH);
}

async function setDebugTitle(
	actionInstance: KeyDownEvent["action"],
	title: string
): Promise<void> {
	if (!DEBUG_UI_ENABLED) {
		return;
	}
	await actionInstance.setTitle(title);
}

function formatError(error: unknown): { message: string; stack?: string } {
	if (error instanceof Error) {
		return { message: `${error.name}: ${error.message}`, stack: error.stack };
	}
	return { message: String(error) };
}

/**
 * Reads text from the system clipboard.
 * Uses pbpaste on macOS, PowerShell Get-Clipboard on Windows.
 */
async function readClipboard(): Promise<string> {
	const isMac = process.platform === "darwin";
	return new Promise((resolve, reject) => {
		const commandDescription = isMac
			? "pbpaste"
			: "powershell.exe -NoProfile -Command Get-Clipboard -Raw";
		streamDeck.logger.info(`[PRListAction] Clipboard read command=${commandDescription}`);
		const proc = isMac
			? spawn("pbpaste", [], { shell: false })
			: spawn("powershell.exe", ["-NoProfile", "-Command", "Get-Clipboard -Raw"], {
					shell: false,
				});
		let output = "";
		let stderrOutput = "";

		proc.stdout.on("data", (chunk: Buffer | string) => {
			output += chunk.toString();
		});
		proc.stderr.on("data", (chunk: Buffer | string) => {
			stderrOutput += chunk.toString();
		});

		proc.on("error", reject);
		proc.on("close", (code) => {
			streamDeck.logger.info(
				`[PRListAction] Clipboard read exit code=${code ?? "unknown"}`
			);
			if (stderrOutput) {
				streamDeck.logger.warn(
					`[PRListAction] Clipboard read stderr=${sanitizePreview(stderrOutput)}`
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

	return new Promise((resolve, reject) => {
		let proc;
		if (isMac) {
			streamDeck.logger.info("[PRListAction] Clipboard write command=pbcopy");
			proc = spawn("pbcopy", [], { shell: false });
		} else {
			// On Windows, use PowerShell with stdin input
			streamDeck.logger.info(
				"[PRListAction] Clipboard write command=powershell.exe -NoProfile -Command Set-Clipboard"
			);
			proc = spawn(
				"powershell.exe",
				["-NoProfile", "-Command", "Set-Clipboard -Value ([Console]::In.ReadToEnd())"],
				{ shell: false }
			);
		}
		let stderrOutput = "";

		proc.on("error", reject);
		proc.stderr.on("data", (chunk: Buffer | string) => {
			stderrOutput += chunk.toString();
		});
		proc.on("close", (code) => {
			streamDeck.logger.info(
				`[PRListAction] Clipboard write exit code=${code ?? "unknown"}`
			);
			if (stderrOutput) {
				streamDeck.logger.warn(
					`[PRListAction] Clipboard write stderr=${sanitizePreview(stderrOutput)}`
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

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const actionMetadata = ev.action as { UUID?: string; id?: string };
		const actionId = actionMetadata.UUID ?? actionMetadata.id ?? "unknown";
		streamDeck.logger.info(
			`[PRListAction] onKeyDown fired at ${new Date().toISOString()} action=${actionId}`
		);
		let stage = "READ_CLIPBOARD_START";
		let stageTitle = "READ";
		try {
			// Read clipboard content
			logStage("READ_CLIPBOARD_START");
			await setDebugTitle(ev.action, "READ");
			const clipboardContent = await readClipboard();
			logStage(
				"READ_CLIPBOARD_DONE",
				`length=${clipboardContent.length} preview="${sanitizePreview(clipboardContent)}"`
			);
			stage = "PARSE_START";
			stageTitle = "PARSE";
			logStage("PARSE_START");
			await setDebugTitle(ev.action, "PARSE");
			const { prNumber, prefix } = parsePrUrl(clipboardContent);
			logStage("PARSE_DONE", `prNumber=${prNumber} prefix="${prefix}"`);
			const output = buildPrListFromUrl(clipboardContent, 4);

			// Write to clipboard
			stage = "WRITE_CLIPBOARD_START";
			stageTitle = "WRITE";
			logStage("WRITE_CLIPBOARD_START");
			await setDebugTitle(ev.action, "WRITE");
			await writeClipboard(output);
			logStage("WRITE_CLIPBOARD_DONE", `length=${output.length}`);

			// Show success feedback
			await ev.action.showOk();
			await setDebugTitle(ev.action, "OK");
			logStage("SUCCESS");

			streamDeck.logger.info(
				"[PRListAction] Successfully generated PR list from clipboard content"
			);
		} catch (error) {
			const formattedError = formatError(error);
			streamDeck.logger.error(
				`[PRListAction] Failed to process clipboard at stage=${stage} on ${process.platform}: ` +
					formattedError.message
			);
			if (formattedError.stack) {
				streamDeck.logger.error(
					`[PRListAction] Error stack at stage=${stage}: ${formattedError.stack}`
				);
			}
			await ev.action.showAlert();
			const errorTitle = DEBUG_UI_ENABLED
				? truncateTitle(`ERR:${stageTitle}`)
				: "ERR";
			await ev.action.setTitle(errorTitle);
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
