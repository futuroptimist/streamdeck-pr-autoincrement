import streamDeck, { LogLevel } from "@elgato/streamdeck";

import "./actions/pr-list.js";

streamDeck.logger.setLevel(LogLevel.DEBUG);

process.on("uncaughtException", (error) => {
	streamDeck.logger.error(
		`Uncaught exception: ${error instanceof Error ? error.message : String(error)}`
	);
});

process.on("unhandledRejection", (reason) => {
	streamDeck.logger.error(
		`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`
	);
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
