"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
function errorHandler(err, req, res, next) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    if (err instanceof zod_1.ZodError) {
        (0, response_1.sendError)(res, "Validation failed", 422, err.errors.map((e) => ({ field: e.path.join("."), message: e.message })));
        return;
    }
    if (err.message === "Not allowed by CORS") {
        (0, response_1.sendError)(res, "CORS error", 403);
        return;
    }
    (0, response_1.sendError)(res, err.message || "Internal server error", 500);
}
function notFoundHandler(req, res) {
    (0, response_1.sendError)(res, `Route ${req.method} ${req.path} not found`, 404);
}
//# sourceMappingURL=errorHandler.js.map