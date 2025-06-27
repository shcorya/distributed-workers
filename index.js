"use strict";

// basic CLI that dictates which module to use (API manager or distributed worker)
if (process.argv.includes("manager")) import("./manager.mjs");
else if (process.argv.includes("worker")) import("./worker.mjs");
