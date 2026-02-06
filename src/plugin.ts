import streamDeck, { LogLevel } from "@elgato/streamdeck";

import "./actions/pr-list.js";

const LOG_LEVELS: Record<string, LogLevel> = {
	debug: LogLevel.DEBUG,
	info: LogLevel.INFO,
	warn: LogLevel.WARN,
	error: LogLevel.ERROR,
};
const configuredLogLevel = process.env.STREAMDECK_LOG_LEVEL?.toLowerCase();
streamDeck.logger.setLevel(LOG_LEVELS[configuredLogLevel ?? ""] ?? LogLevel.INFO);

process.on("uncaughtException", (error) => {
	streamDeck.logger.error(
		`Uncaught exception: ${error instanceof Error ? error.message : String(error)}`
	);
	streamDeck.logger.error("Uncaught exception is unrecoverable. Exiting process.");
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	streamDeck.logger.error(
		`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`
	);
	streamDeck.logger.error("Unhandled rejection is unrecoverable. Exiting process.");
	process.exit(1);
});

try {
	streamDeck.connect();
} catch (error) {
	streamDeck.logger.error(
		`Failed to connect to Stream Deck: ${
			error instanceof Error ? error.message : String(error)
		}`
	);
}
