import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../../components/auth/auth-shell";
import { RegisterForm } from "../../components/auth/register-form";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <AuthShell
      footer={
        <>
          Already have an account? <Link href="/login">Login</Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
