import { Router } from "express";
import type { Request, Response } from "express";
import { registerUser, loginUser, refreshAccessToken } from "../services/auth.service.js";

const router = Router();

const REFRESH_COOKIE = "refreshToken";
const cookieOptions = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body as {
    email?: string;
    password?: string;
    displayName?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const { user, tokens } = await registerUser(email, password, displayName);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions);
    res.status(201).json({ user, accessToken: tokens.accessToken });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    throw err;
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const { user, tokens } = await loginUser(email, password);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions);
    res.json({ user, accessToken: tokens.accessToken });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    } 
    throw err;
  }
});

router.post("/refresh", (req: Request, res: Response) => {
  const token: string | undefined = req.cookies[REFRESH_COOKIE];
  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  try {
    const { accessToken } = refreshAccessToken(token);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out" });
});

export default router;
