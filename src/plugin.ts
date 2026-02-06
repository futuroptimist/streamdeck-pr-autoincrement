import streamDeck, { LogLevel } from "@elgato/streamdeck";

import "./actions/pr-list.js";

streamDeck.logger.setLevel(LogLevel.DEBUG);

const formatError = (label: string, error: unknown): string => {
	const detail = error instanceof Error ? error.stack ?? error.message : String(error);
	return `${label}: ${detail}`;
};

process.on("uncaughtException", (error) => {
	streamDeck.logger.error(formatError("Uncaught exception in plugin process", error));
});

process.on("unhandledRejection", (reason) => {
	streamDeck.logger.error(
		formatError("Unhandled promise rejection in plugin process", reason)
	);
});

try {
	streamDeck.connect();
} catch (error) {
	streamDeck.logger.error(formatError("Failed to connect to Stream Deck", error));
}
