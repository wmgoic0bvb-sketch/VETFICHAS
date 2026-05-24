import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Veterinary paw-print background pattern */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%235c1838' fill-opacity='0.035'%3E%3Cellipse cx='20' cy='18' rx='5' ry='6'/%3E%3Cellipse cx='32' cy='13' rx='4' ry='5'/%3E%3Cellipse cx='44' cy='13' rx='4' ry='5'/%3E%3Cellipse cx='56' cy='18' rx='5' ry='6'/%3E%3Cpath d='M38 22 C28 22 22 30 24 40 C26 50 34 56 38 56 C42 56 50 50 52 40 C54 30 48 22 38 22 Z'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(160deg, #f5ede3 0%, #ecddd0 100%)`,
          backgroundSize: "80px 80px, cover",
        }}
      />

      <div className="w-full max-w-[390px] rounded-2xl border border-[#e8e0d8] bg-white/90 p-8 shadow-md backdrop-blur-sm">
        {/* Logo + brand */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image
            src="/only_logo_png.png"
            alt="VetFichas logo"
            width={64}
            height={64}
            className="object-contain"
            priority
          />
          <h1 className="text-2xl font-bold text-[#5c1838]">VetFichas</h1>
          <p className="text-sm text-[#777]">Ingresá con tu usuario y contraseña</p>
        </div>

        <Suspense fallback={<p className="text-center text-sm text-[#888]">Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
