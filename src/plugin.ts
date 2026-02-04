import streamDeck, { LogLevel } from "@elgato/streamdeck";

// Import actions to register them
import { PRListAction } from "./actions/pr-list.js";

// Set log level
streamDeck.logger.setLevel(LogLevel.DEBUG);

// Register the action
streamDeck.actions.registerAction(new PRListAction());

// Connect to Stream Deck
streamDeck.connect();
