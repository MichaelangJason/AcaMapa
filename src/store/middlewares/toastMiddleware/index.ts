/**
 * This file avoids circular dependency by importing the other files in this directory.
 */

// register all effects before exporting the middleware
import "./system";
import "./seek";
import "./export";
import "./fetchData";
import "./programActions";
import "./planActions";
import "./courseActions";
import "./courseTakenActions";
import "./termActions";
import "./equivRulesActions";

export { middleware as default } from "./core";
