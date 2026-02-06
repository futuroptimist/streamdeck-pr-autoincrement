import streamDeck, { LogLevel } from "@elgato/streamdeck";

import "./actions/pr-list.js";

streamDeck.logger.setLevel(LogLevel.DEBUG);

process.on("uncaughtException", (error) => {
	const message = `Uncaught exception in plugin process on ${process.platform}: ${
		error.stack || error
	}`;
	streamDeck.logger.error(message);
});

process.on("unhandledRejection", (reason) => {
	const message = `Unhandled rejection in plugin process on ${process.platform}: ${reason}`;
	streamDeck.logger.error(message);
});

try {
	streamDeck.connect();
} catch (error) {
	const message = `Failed to connect Stream Deck plugin on ${process.platform}: ${error}`;
	streamDeck.logger.error(message);
}
