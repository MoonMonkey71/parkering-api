"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.createAuthResponse = createAuthResponse;
exports.validateEmail = validateEmail;
exports.validatePassword = validatePassword;
exports.sanitizeUser = sanitizeUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
async function hashPassword(password) {
    const saltRounds = 12;
    return await bcryptjs_1.default.hash(password, saltRounds);
}
async function comparePassword(password, hash) {
    return await bcryptjs_1.default.compare(password, hash);
}
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
function createAuthResponse(success, user, message) {
    const response = { success };
    if (success && user) {
        response.token = generateToken(user);
        response.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at
        };
    }
    if (message) {
        response.message = message;
    }
    return response;
}
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function validatePassword(password) {
    if (password.length < 6) {
        return { valid: false, message: 'Passordet må være minst 6 tegn' };
    }
    return { valid: true };
}
function sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
}
//# sourceMappingURL=auth.js.map