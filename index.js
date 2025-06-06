"use strict";

// basic CLI that dictates which module to use (API manager or distributed worker)
if (process.argv.includes("manager")) require("./manager.mjs");
else if (process.argv.includes("worker")) require("./worker.mjs");
