/**
 * This file avoids circular dependency by importing the other files in this directory.
 */

// register all effects before exporting the middleware
import "./markDirty";
import "./updateDep";

export { middleware as default } from "./core";
