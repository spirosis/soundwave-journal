import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

function getEnv(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"){
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
}


interface TokenPayload extends jwt.JwtPayload {
    sub: string;
    type: "access" | "refresh";
}

function generateTokens(userId: string) {
    
    const ACCESS_SECRET = getEnv("JWT_ACCESS_SECRET");
    const REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
    
    const accessToken = jwt.sign(
        {sub: userId, type: "access"},
        ACCESS_SECRET,
        { expiresIn: "15m"}
    );
    const refreshToken = jwt.sign(
        { sub: userId, type: "refresh"},
        REFRESH_SECRET,
        { expiresIn: "7d"}
    );
    return { accessToken, refreshToken};
}

export async function registerUser(
    email: string,
    password: string,
    displayName?: string
) {
    const existing = await prisma.user.findUnique({
        where: { email }
    });

    if (existing) throw new Error("EMAIL_TAKEN");

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            ...(displayName !== undefined ? { displayName }: {}),
        },
        select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return { user, tokens: generateTokens(user.id) };
} 
//exactOptionalPropertyTypes en el tsconfig hace que displayName: undefined y displayName ausente sean tipos diferentes. Así evitamos el error.

export async function loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ 
        where: { email }
    });

    if (!user) throw new Error("INVALID_CREDENTIALS");

    const valid = await bcrypt.compare( password, user.passwordHash);
    if (!valid) throw new Error("INVALID_CREDENTIALS");

    const { passwordHash: _hash, ...safeUser } = user;
    return { user: safeUser, tokens: generateTokens(user.id)};
} 
//el mismo error para "usuario no existe" y "contraseña incorrecta" — nunca revelar cuál falló (evita user enumeration).

export function refreshAccessToken(token: string) {
    
    const REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
    const ACCESS_SECRET = getEnv("JWT_ACCESS_SECRET");

    const payload = jwt.verify(token, REFRESH_SECRET) as TokenPayload;

    if (payload.type !== "refresh" || !payload.sub){
        throw new Error("INVALID_TOKEN");
    } 

    const accessToken = jwt.sign(
        {sub: payload.sub, type: "access"},
        ACCESS_SECRET,
        { expiresIn: "15m" }
    );
    return { accessToken };
}




