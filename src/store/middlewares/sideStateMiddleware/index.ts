/**
 * This file avoids circular dependency by importing the other files in this directory.
 */

// register all effects before exporting the middleware
import "./globalFlags";
import "./lifecycleGuards";
import "./modalState";
import "./seekingMode";
import "./courseExpansion";
import "./domEffects";

export { middleware as default } from "./core";
