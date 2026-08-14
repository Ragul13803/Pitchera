"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
// Remove AuthRequest interface - use Express.Request directly
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        (0, response_1.sendError)(res, "Authentication required", 401);
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload; // Now TypeScript knows about this property
        next();
    }
    catch {
        (0, response_1.sendError)(res, "Invalid or expired token", 401);
    }
}
//# sourceMappingURL=auth.middleware.js.map