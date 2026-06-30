import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

function normalizeEmail(email: string): string{
    return email.trim().toLowerCase();
}

function normalizeDisplayName(displayName?: string): string | undefined{
    if( typeof displayName !== "string"){
        return undefined;
    }

    const normalized = displayName.trim();
    return normalized ? normalized: undefined;
}

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
    sid?: string;
}

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; 


function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function buildRefreshExpiry():Date{
    return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
} 

async function generateTokens(userId: string) {
    
    const ACCESS_SECRET = getEnv("JWT_ACCESS_SECRET");
    const REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
    const sessionId = crypto.randomUUID();

    const accessToken = jwt.sign(
        {sub: userId, type: "access"},
        ACCESS_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL}
    );
    const refreshToken = jwt.sign(
        { sub: userId, type: "refresh", sid: sessionId},
        REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_TTL}
    );

    await prisma.refreshSession.create({
        data:{
            id: sessionId, 
            userId,
            tokenHash: hashToken(refreshToken),
            expiresAt: buildRefreshExpiry(),

        },
    });
    return { accessToken, refreshToken};
}

export async function registerUser(
    email: string,
    password: string,
    displayName?: string
) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedDisplayName = normalizeDisplayName(displayName);
    const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail }
    });

    if (existing) throw new Error("EMAIL_TAKEN");

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email: normalizedEmail,
            passwordHash,
            ...(normalizedDisplayName !== undefined ? { displayName: normalizedDisplayName }: {}),
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

    return { user, tokens: await generateTokens(user.id) };
} 
//exactOptionalPropertyTypes en el tsconfig hace que displayName: undefined y displayName ausente sean tipos diferentes. Así evitamos el error.

export async function loginUser(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ 
        where: { email: normalizedEmail }
    });

    if (!user) throw new Error("INVALID_CREDENTIALS");

    const valid = await bcrypt.compare( password, user.passwordHash);
    if (!valid) throw new Error("INVALID_CREDENTIALS");

    const { passwordHash: _hash, ...safeUser } = user;
    return { user: safeUser, tokens: await generateTokens(user.id)};
} 
//el mismo error para "usuario no existe" y "contraseña incorrecta" — nunca revelar cuál falló (evita user enumeration).

export async function refreshAccessToken(token: string) {
    
    const REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
    const ACCESS_SECRET = getEnv("JWT_ACCESS_SECRET");

    const payload = jwt.verify(token, REFRESH_SECRET) as TokenPayload;

    if (payload.type !== "refresh" || !payload.sub || !payload.sid
    ){
        throw new Error("INVALID_TOKEN");
    } 

    const session = await prisma.refreshSession.findUnique({
        where: { id: payload.sid },
    });

    if (!session || session.userId !== payload.sub) {
        throw new Error("INVALID_TOKEN");
    }

     if (session.revokedAt || session.expiresAt <= new Date()) {
        throw new Error("INVALID_TOKEN");
    }

    if (session.tokenHash !== hashToken(token)) {
        throw new Error("INVALID_TOKEN");
    }


    const accessToken = jwt.sign(
        {sub: payload.sub, type: "access"},
        ACCESS_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL }
    );

    const newRefreshToken = jwt.sign(
        { sub: payload.sub, type: "refresh", sid: session.id },
        REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_TTL }
    );

    await prisma.refreshSession.update({
        where: { id: session.id },
        data: {
            tokenHash: hashToken(newRefreshToken),
            expiresAt: buildRefreshExpiry(),
            lastUsedAt: new Date(),
        },
    });



    return { accessToken, refreshToken: newRefreshToken, };
}


// Arriba: Qué hace ahora:
// exige sid
// busca sesión real
// valida que no esté revocada ni expirada
// valida hash del token actual
// rota el refresh token
// actualiza el hash guardado


export async function revokeRefreshToken(token: string): Promise<void> {
    const REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");

    try {
        const payload = jwt.verify(token, REFRESH_SECRET) as TokenPayload;

        if (payload.type !== "refresh" || !payload.sid) {
            return;
        }

        await prisma.refreshSession.updateMany({
            where: {
                id: payload.sid,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    } catch {
        // Si el token ya es inválido o expiró, igual queremos limpiar la cookie.
    }
}




