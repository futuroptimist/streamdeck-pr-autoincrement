import streamDeck, { LogLevel } from "@elgato/streamdeck";
import fs from "node:fs";
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

const PACKAGE_JSON_PATH = path.resolve(process.cwd(), "package.json");

const readPackageVersion = (): string | undefined => {
	try {
		const raw = fs.readFileSync(PACKAGE_JSON_PATH, "utf8");
		const parsed = JSON.parse(raw) as { version?: string };
		return parsed.version;
	} catch (error) {
		streamDeck.logger.error(
			`Failed to read package.json version: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
		return undefined;
	}
};

streamDeck.logger.info("plugin.ts loaded");
streamDeck.logger.info(`Plugin version: ${readPackageVersion() ?? "unknown"}`);
streamDeck.logger.info(
	`Environment: platform=${process.platform} node=${process.version} cwd=${process.cwd()}`
);

process.on("uncaughtException", (error) => {
	const message = error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error && error.stack ? error.stack : "no stack";
	streamDeck.logger.error(
		`Uncaught exception: ${message}`
	);
	streamDeck.logger.error(`Uncaught exception stack: ${stack}`);
	streamDeck.logger.error("Uncaught exception is unrecoverable. Exiting process.");
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	const message = reason instanceof Error ? reason.message : String(reason);
	const stack = reason instanceof Error && reason.stack ? reason.stack : "no stack";
	streamDeck.logger.error(
		`Unhandled rejection: ${message}`
	);
	streamDeck.logger.error(`Unhandled rejection stack: ${stack}`);
	streamDeck.logger.error("Unhandled rejection is unrecoverable. Exiting process.");
	process.exit(1);
});

try {
	streamDeck.logger.info("Connecting to Stream Deck...");
	streamDeck.connect();
	streamDeck.logger.info("Connected to Stream Deck.");
} catch (error) {
	streamDeck.logger.error(
		`Failed to connect to Stream Deck: ${
			error instanceof Error ? error.message : String(error)
		}`
	);
	if (error instanceof Error && error.stack) {
		streamDeck.logger.error(`Stream Deck connect stack: ${error.stack}`);
	}
}
