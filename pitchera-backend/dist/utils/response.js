"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, data = null, message = "Success", statusCode = 200) {
    res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}
function sendError(res, message = "An error occurred", statusCode = 400, errors) {
    const body = {
        success: false,
        message,
    };
    if (errors !== undefined) {
        body.errors = errors;
    }
    res.status(statusCode).json(body);
}
//# sourceMappingURL=response.js.map