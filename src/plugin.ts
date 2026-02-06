import streamDeck, { LogLevel } from "@elgato/streamdeck";
import { readFileSync } from "node:fs";
import path from "node:path";

import "./actions/pr-list.js";

const LOG_LEVELS: Record<string, LogLevel> = {
	debug: LogLevel.DEBUG,
	info: LogLevel.INFO,
	warn: LogLevel.WARN,
	error: LogLevel.ERROR,
};
const configuredLogLevel = process.env.STREAMDECK_LOG_LEVEL?.toLowerCase();
streamDeck.logger.setLevel(LOG_LEVELS[configuredLogLevel ?? ""] ?? LogLevel.INFO);

const PLUGIN_VERSION = (() => {
	try {
		const packagePath = path.resolve(process.cwd(), "package.json");
		const pkg = JSON.parse(readFileSync(packagePath, "utf8")) as { version?: string };
		return pkg.version ?? "unknown";
	} catch (error) {
		streamDeck.logger.warn(
			`Unable to read package.json for version: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
		return "unknown";
	}
})();

streamDeck.logger.info("plugin.ts loaded");
streamDeck.logger.info(
	`Startup info: version=${PLUGIN_VERSION} platform=${process.platform} node=${
		process.version
	} cwd=${process.cwd()}`
);

process.on("uncaughtException", (error) => {
	const stack = error instanceof Error ? error.stack ?? error.message : String(error);
	streamDeck.logger.error(
		`Uncaught exception: ${error instanceof Error ? error.message : String(error)}`
	);
	streamDeck.logger.error(`Uncaught exception stack: ${stack}`);
	streamDeck.logger.error("Uncaught exception is unrecoverable. Exiting process.");
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	const stack = reason instanceof Error ? reason.stack ?? reason.message : String(reason);
	streamDeck.logger.error(
		`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`
	);
	streamDeck.logger.error(`Unhandled rejection stack: ${stack}`);
	streamDeck.logger.error("Unhandled rejection is unrecoverable. Exiting process.");
	process.exit(1);
});

try {
	streamDeck.logger.info("Connecting to Stream Deck...");
	streamDeck.connect();
} catch (error) {
	streamDeck.logger.error(
		`Failed to connect to Stream Deck: ${
			error instanceof Error ? error.message : String(error)
		}`
	);
	streamDeck.logger.error(
		`Stream Deck connect failure stack: ${
			error instanceof Error ? error.stack ?? error.message : String(error)
		}`
	);
}
