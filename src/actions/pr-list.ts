import streamDeck, { action, SingletonAction, type KeyDownEvent } from "@elgato/streamdeck";
import { exec, execFile, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

/**
 * Regex to match a GitHub PR URL ending with /pull/<number> with optional trailing slash/whitespace.
 * Captures the PR number.
 */
const PR_URL_REGEX = /\/pull\/(\d+)\s*\/?\s*$/;

/**
 * Reads text from the system clipboard.
 * Uses pbpaste on macOS, PowerShell Get-Clipboard on Windows.
 */
async function readClipboard(): Promise<string> {
	const isMac = process.platform === "darwin";
	if (isMac) {
		const { stdout } = await execAsync("pbpaste");
		return stdout;
	}

	const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", "Get-Clipboard -Raw"]);
	return stdout;
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
			proc = spawn("pbcopy", [], { shell: false });
		} else {
			// On Windows, use PowerShell with stdin input
			proc = spawn(
				"powershell.exe",
				["-NoProfile", "-Command", "Set-Clipboard -Value ([Console]::In.ReadToEnd())"],
				{ shell: false }
			);
		}

		proc.on("error", reject);
		proc.on("close", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Clipboard write failed with exit code ${code}`));
			}
		});

		proc.stdin.write(text);
		proc.stdin.end();
	});
}

/**
 * Action that reads a GitHub PR URL from clipboard and rewrites it
 * to a 4-line bullet list of incrementing PR URLs.
 */
@action({ UUID: "com.futuroptimist.prlist.fromclipboard" })
export class PRListAction extends SingletonAction {
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		try {
			// Read clipboard content
			const clipboardContent = await readClipboard();
			const trimmedContent = clipboardContent.trim();

			// Check if it matches a PR URL pattern
			const match = trimmedContent.match(PR_URL_REGEX);

			if (!match) {
				streamDeck.logger.error(`Clipboard content does not match PR URL pattern: ${trimmedContent}`);
				await ev.action.showAlert();
				return;
			}

			// Extract the PR number
			const prNumber = parseInt(match[1], 10);

			// Build the URL prefix by removing the trailing number (and optional slash/space)
			const prefix = trimmedContent.replace(PR_URL_REGEX, "/pull/");

			// Generate 4 incrementing PR URLs
			const urls: string[] = [];
			for (let i = 0; i < 4; i++) {
				urls.push(`- ${prefix}${prNumber + i}`);
			}

			// Join with newlines
			const output = urls.join("\n");

			// Write to clipboard
			await writeClipboard(output);

			// Show success feedback
			await ev.action.showOk();

			streamDeck.logger.info(`Successfully generated PR list from PR #${prNumber}`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			streamDeck.logger.error(`Failed to process clipboard: ${errorMessage}`);
			await ev.action.showAlert();
		}
	}
}
