import streamDeck, { LogLevel } from "@elgato/streamdeck";

import packageInfo from "../package.json";
import "./actions/pr-list.js";

const LOG_LEVELS: Record<string, LogLevel> = {
	debug: LogLevel.DEBUG,
	info: LogLevel.INFO,
	warn: LogLevel.WARN,
	error: LogLevel.ERROR,
};
const configuredLogLevel = process.env.STREAMDECK_LOG_LEVEL?.toLowerCase();
streamDeck.logger.setLevel(LOG_LEVELS[configuredLogLevel ?? ""] ?? LogLevel.INFO);

streamDeck.logger.info("plugin.ts loaded");
streamDeck.logger.info(`Plugin version: ${packageInfo.version}`);
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
