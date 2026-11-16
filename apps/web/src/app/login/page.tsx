import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../../components/auth/auth-shell";
import { LoginForm } from "../../components/auth/login-form";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <AuthShell
      footer={
        <>
          New here? <Link href="/register">Create an account</Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
