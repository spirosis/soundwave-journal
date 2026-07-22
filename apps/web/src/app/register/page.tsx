import Link from "next/link";
import { RegisterForm } from "../../components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center">
        <div className="flex w-full flex-col items-center gap-6">
          <RegisterForm />
          <p className="text-sm text-stone-600">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-stone-950 underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}