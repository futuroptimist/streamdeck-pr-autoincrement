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

function formatError(error: unknown): { message: string; stack?: string } {
	if (error instanceof Error) {
		return { message: `${error.name}: ${error.message}`, stack: error.stack };
	}
	return { message: String(error) };
}

function resolvePackageVersion(): string {
	try {
		const packagePath = path.resolve(__dirname, "..", "..", "package.json");
		const raw = fs.readFileSync(packagePath, "utf8");
		const parsed = JSON.parse(raw) as { version?: string };
		return parsed.version ?? "unknown";
	} catch (error) {
		const formattedError = formatError(error);
		streamDeck.logger.warn(
			`Failed to read package.json for version: ${formattedError.message}`
		);
		return "unknown";
	}
}

streamDeck.logger.info("[plugin] plugin.ts loaded");
streamDeck.logger.info(`[plugin] version=${resolvePackageVersion()}`);
streamDeck.logger.info(`[plugin] platform=${process.platform}`);
streamDeck.logger.info(`[plugin] node=${process.version}`);
streamDeck.logger.info(`[plugin] cwd=${process.cwd()}`);

process.on("uncaughtException", (error) => {
	const formattedError = formatError(error);
	streamDeck.logger.error(`[plugin] Uncaught exception: ${formattedError.message}`);
	if (formattedError.stack) {
		streamDeck.logger.error(`[plugin] Uncaught exception stack: ${formattedError.stack}`);
	}
});

process.on("unhandledRejection", (reason) => {
	const formattedError = formatError(reason);
	streamDeck.logger.error(`[plugin] Unhandled rejection: ${formattedError.message}`);
	if (formattedError.stack) {
		streamDeck.logger.error(`[plugin] Unhandled rejection stack: ${formattedError.stack}`);
	}
});

try {
	streamDeck.logger.info("[plugin] connecting to Stream Deck...");
	streamDeck.connect();
	streamDeck.logger.info("[plugin] streamDeck.connect() completed");
} catch (error) {
	const formattedError = formatError(error);
	streamDeck.logger.error(
		`[plugin] Failed to connect to Stream Deck: ${formattedError.message}`
	);
	if (formattedError.stack) {
		streamDeck.logger.error(`[plugin] Connect failure stack: ${formattedError.stack}`);
	}
}
