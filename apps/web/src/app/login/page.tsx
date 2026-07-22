import Link from "next/link";
import { LoginForm } from "../../components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center">
        <div className="flex w-full flex-col items-center gap-6">
          <LoginForm />
          <p className="text-sm text-stone-600">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-medium text-stone-950 underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}