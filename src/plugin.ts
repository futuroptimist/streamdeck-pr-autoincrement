import streamDeck, { LogLevel } from "@elgato/streamdeck";

import "./actions/pr-list.js";

streamDeck.logger.setLevel(LogLevel.DEBUG);

process.on("uncaughtException", (error) => {
	const message = error instanceof Error ? error.message : String(error);
	streamDeck.logger.error(`Uncaught exception: ${message}`);
});

process.on("unhandledRejection", (reason) => {
	const message = reason instanceof Error ? reason.message : String(reason);
	streamDeck.logger.error(`Unhandled rejection: ${message}`);
});

try {
	streamDeck.connect();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	streamDeck.logger.error(`Failed to connect to Stream Deck: ${message}`);
}
