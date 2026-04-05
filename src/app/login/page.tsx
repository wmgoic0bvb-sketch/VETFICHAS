import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f0eb] px-4">
      <div className="w-full max-w-[380px] rounded-2xl border border-[#e8e0d8] bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center text-xl font-bold text-[#5c1838]">
          VetFichas
        </h1>
        <p className="mb-6 text-center text-sm text-[#666]">
          Ingresá con tu DNI y contraseña
        </p>
        <Suspense fallback={<p className="text-center text-sm text-[#888]">Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
