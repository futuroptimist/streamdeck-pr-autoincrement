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
const DEBUG_UI_ENABLED = process.env.PR_AUTOINC_DEBUG_UI === "1";
const CLIPBOARD_PREVIEW_LENGTH = 120;

function sanitizePreview(text: string, maxLength = CLIPBOARD_PREVIEW_LENGTH): string {
	const normalized = text.replace(/\s+/g, " ").trim();
	if (normalized.length <= maxLength) {
		return normalized;
	}
	return `${normalized.slice(0, maxLength)}…`;
}

function formatErrorForLog(error: unknown): string {
	if (error instanceof Error) {
		return `${error.name}: ${error.message}\n${error.stack ?? ""}`.trim();
	}
	return String(error);
}

function logStage(stage: string, message?: string): void {
	const suffix = message ? ` ${message}` : "";
	streamDeck.logger.info(`[PRListAction] STAGE=${stage}${suffix}`);
}

async function setDebugTitle(
	actionInstance: { setTitle: (title: string) => Promise<void> },
	title: string
): Promise<void> {
	if (!DEBUG_UI_ENABLED) {
		return;
	}
	try {
		await actionInstance.setTitle(title);
	} catch (error) {
		streamDeck.logger.error(
			`[PRListAction] Failed to set debug title "${title}": ${formatErrorForLog(error)}`
		);
	}
}

function parsePrUrl(url: string): { prefix: string; prNumber: number } {
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
}

export function buildPrListFromUrl(url: string, count = 4): string {
	const { prefix, prNumber } = parsePrUrl(url);
	const urls: string[] = [];
	for (let i = 0; i < count; i++) {
		urls.push(`- ${prefix}${prNumber + i}`);
	}

	return urls.join("\n");
}

/**
 * Reads text from the system clipboard.
 * Uses pbpaste on macOS, PowerShell Get-Clipboard on Windows.
 */
async function readClipboard(): Promise<string> {
	const isMac = process.platform === "darwin";
	return new Promise((resolve, reject) => {
		const command = isMac ? "pbpaste" : "powershell.exe Get-Clipboard -Raw";
		streamDeck.logger.info(`[PRListAction] Clipboard read command: ${command}`);
		const proc = isMac
			? spawn("pbpaste", [], { shell: false })
			: spawn("powershell.exe", ["-NoProfile", "-Command", "Get-Clipboard -Raw"], { shell: false });
		let output = "";
		let stderr = "";

		proc.stdout.on("data", (chunk: Buffer | string) => {
			output += chunk.toString();
		});

		proc.stderr.on("data", (chunk: Buffer | string) => {
			stderr += chunk.toString();
		});

		proc.on("error", reject);
		proc.on("close", (code) => {
			if (stderr) {
				streamDeck.logger.warn(`[PRListAction] Clipboard read stderr: ${stderr.trim()}`);
			}
			if (code === 0) {
				resolve(output);
			} else {
				streamDeck.logger.error(`[PRListAction] Clipboard read exit code: ${code ?? "null"}`);
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
			streamDeck.logger.info("[PRListAction] Clipboard write command: pbcopy");
			proc = spawn("pbcopy", [], { shell: false });
		} else {
			// On Windows, use PowerShell with stdin input
			streamDeck.logger.info(
				"[PRListAction] Clipboard write command: powershell.exe Set-Clipboard -Value"
			);
			proc = spawn(
				"powershell.exe",
				["-NoProfile", "-Command", "Set-Clipboard -Value ([Console]::In.ReadToEnd())"],
				{ shell: false }
			);
		}
		let stderr = "";

		proc.stderr.on("data", (chunk: Buffer | string) => {
			stderr += chunk.toString();
		});

		proc.on("error", reject);
		proc.on("close", (code) => {
			if (stderr) {
				streamDeck.logger.warn(`[PRListAction] Clipboard write stderr: ${stderr.trim()}`);
			}
			if (code === 0) {
				resolve();
			} else {
				streamDeck.logger.error(`[PRListAction] Clipboard write exit code: ${code ?? "null"}`);
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
			`[PRListAction] Action ready: uuid=${ev.action.manifestId} id=${ev.action.id}`
		);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const timestamp = new Date().toISOString();
		streamDeck.logger.info(
			`[PRListAction] onKeyDown fired ts=${timestamp} uuid=${ev.action.manifestId} id=${ev.action.id}`
		);
		let stage = "READ_CLIPBOARD";
		try {
			logStage("READ_CLIPBOARD_START");
			await setDebugTitle(ev.action, "READ");
			const clipboardContent = await readClipboard();
			logStage(
				"READ_CLIPBOARD_DONE",
				`length=${clipboardContent.length} preview="${sanitizePreview(clipboardContent)}"`
			);

			stage = "PARSE";
			logStage("PARSE_START");
			await setDebugTitle(ev.action, "PARSE");
			const { prefix, prNumber } = parsePrUrl(clipboardContent);
			logStage("PARSE_DONE", `prNumber=${prNumber} prefix="${prefix}"`);
			const output = buildPrListFromUrl(clipboardContent, 4);

			// Write to clipboard
			stage = "WRITE_CLIPBOARD";
			logStage("WRITE_CLIPBOARD_START");
			await setDebugTitle(ev.action, "WRITE");
			await writeClipboard(output);
			logStage("WRITE_CLIPBOARD_DONE");

			// Show success feedback
			await ev.action.showOk();
			logStage("SUCCESS");
			await setDebugTitle(ev.action, "OK");

			streamDeck.logger.info("[PRListAction] Successfully generated PR list");
		} catch (error) {
			const errorMessage = formatErrorForLog(error);
			streamDeck.logger.error(
				`[PRListAction] Failed to process clipboard at ${stage} on ${process.platform}: ${errorMessage}`
			);
			await ev.action.showAlert();
			const errorTitle = `ERR:${stage}`.slice(0, 12);
			await setDebugTitle(ev.action, errorTitle);
			await ev.action.setTitle("ERR");
			if (this.clearTitleTimeout) {
				clearTimeout(this.clearTitleTimeout);
			}
			const currentAction = ev.action;
			this.clearTitleTimeout = setTimeout(() => {
				void currentAction.setTitle("").catch((titleError) => {
					streamDeck.logger.error(
						`[PRListAction] Failed to clear error title on ${process.platform}: ${formatErrorForLog(
							titleError
						)}`
					);
				});
				this.clearTitleTimeout = undefined;
			}, 1500);
		}
	}
}
