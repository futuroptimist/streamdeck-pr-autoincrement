import streamDeck, { LogLevel } from "@elgato/streamdeck";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "./actions/pr-list.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readPluginVersion = (): string | undefined => {
	try {
		const manifestPath = path.resolve(__dirname, "..", "manifest.json");
		const manifestRaw = fs.readFileSync(manifestPath, "utf8");
		const manifest = JSON.parse(manifestRaw) as { Version?: string };
		if (typeof manifest.Version === "string" && manifest.Version.length > 0) {
			return manifest.Version;
		}
	} catch (error) {
		streamDeck.logger.warn(
			`Unable to read plugin manifest version: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
	return undefined;
};

const LOG_LEVELS: Record<string, LogLevel> = {
	debug: LogLevel.DEBUG,
	info: LogLevel.INFO,
	warn: LogLevel.WARN,
	error: LogLevel.ERROR,
};
const configuredLogLevel = process.env.STREAMDECK_LOG_LEVEL?.toLowerCase();
streamDeck.logger.setLevel(LOG_LEVELS[configuredLogLevel ?? ""] ?? LogLevel.INFO);

streamDeck.logger.info("plugin.ts loaded");
const pluginVersion = readPluginVersion() ?? "unknown";
streamDeck.logger.info(`Plugin version: ${pluginVersion}`);
streamDeck.logger.info(
	`Environment: platform=${process.platform} node=${process.version} cwd=${process.cwd()}`
);

process.on("uncaughtException", (error) => {
	const errorMessage = error instanceof Error ? error.message : String(error);
	streamDeck.logger.error(`Uncaught exception: ${errorMessage}`);
	if (error instanceof Error && error.stack) {
		streamDeck.logger.error(`Uncaught exception stack: ${error.stack}`);
	}
	streamDeck.logger.error("Uncaught exception is unrecoverable. Exiting process.");
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	const reasonMessage = reason instanceof Error ? reason.message : String(reason);
	streamDeck.logger.error(`Unhandled rejection: ${reasonMessage}`);
	if (reason instanceof Error && reason.stack) {
		streamDeck.logger.error(`Unhandled rejection stack: ${reason.stack}`);
	}
	streamDeck.logger.error("Unhandled rejection is unrecoverable. Exiting process.");
	process.exit(1);
});

try {
	streamDeck.logger.info("Connecting to Stream Deck...");
	streamDeck.connect();
	streamDeck.logger.info("Stream Deck connection established.");
} catch (error) {
	streamDeck.logger.error(
		`Failed to connect to Stream Deck: ${
			error instanceof Error ? error.message : String(error)
		}`
	);
	if (error instanceof Error && error.stack) {
		streamDeck.logger.error(`Stream Deck connection stack: ${error.stack}`);
	}
}
