import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables.");
    }

    return secret;
}

export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SALT_ROUNDS)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash)
}

export const generateToken = (userId: string, role: string): string => {
    return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: "24h" })
}

export const generateResetToken = (): string => {
    const crypto = require("crypto");
    return crypto.randomBytes(32).toString("hex");
}

export const hashToken = (token: string): string => {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(token).digest("hex");
}
