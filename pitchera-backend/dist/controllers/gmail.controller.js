"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateGmailAuth = initiateGmailAuth;
exports.gmailCallback = gmailCallback;
exports.getGmailStatus = getGmailStatus;
exports.disconnectGmail = disconnectGmail;
const googleService = __importStar(require("../services/google.service"));
const gmailService = __importStar(require("../services/gmail.service"));
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
function initiateGmailAuth(req, res) {
    const url = googleService.getGmailAuthUrl(req.user.userId);
    (0, response_1.sendSuccess)(res, { url }, "Gmail auth URL generated");
}
async function gmailCallback(req, res, next) {
    try {
        const { code, error, state } = req.query;
        if (error || !code) {
            res.redirect(`${env_1.env.frontendUrl}/connect-gmail?error=gmail_auth_failed`);
            return;
        }
        const userId = parseInt(state || "0", 10);
        if (!userId) {
            res.redirect(`${env_1.env.frontendUrl}/connect-gmail?error=invalid_state`);
            return;
        }
        const { accessToken, refreshToken, tokenExpiry, gmailAddress } = await googleService.exchangeGmailCode(String(code));
        await gmailService.saveGmailAccount(userId, gmailAddress, accessToken, refreshToken, tokenExpiry);
        res.redirect(`${env_1.env.frontendUrl}/connect-gmail?success=true&gmail=${encodeURIComponent(gmailAddress)}`);
    }
    catch (error) {
        console.error("Gmail callback error:", error);
        res.redirect(`${env_1.env.frontendUrl}/connect-gmail?error=${encodeURIComponent(error.message)}`);
    }
}
async function getGmailStatus(req, res, next) {
    try {
        const status = await gmailService.getGmailStatus(req.user.userId);
        (0, response_1.sendSuccess)(res, status);
    }
    catch (error) {
        next(error);
    }
}
async function disconnectGmail(req, res, next) {
    try {
        await gmailService.disconnectGmail(req.user.userId);
        (0, response_1.sendSuccess)(res, null, "Gmail disconnected");
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=gmail.controller.js.map