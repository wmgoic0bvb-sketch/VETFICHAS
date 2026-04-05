"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const cardClass = "rounded-2xl border border-[#ebe6df] bg-white p-6 shadow-sm";
const inputClass =
  "w-full rounded-lg border border-[#ddd] bg-white px-3 py-2 text-[15px] text-[#222] outline-none ring-[#5c1838]/30 focus:border-[#5c1838] focus:ring-2 disabled:bg-[#f5f2ee] disabled:text-[#999]";
const labelClass =
  "mb-1 block text-xs font-medium uppercase tracking-wide text-[#555]";
const sectionTitle =
  "mb-4 text-xs font-bold uppercase tracking-wider text-[#5c1838]";

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-12 w-12 text-[#bbb]"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
        aria-hidden
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round((h * maxSize) / w); w = maxSize; }
        else { w = Math.round((w * maxSize) / h); h = maxSize; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo comprimir la imagen"))),
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Imagen inválida")); };
    img.src = objectUrl;
  });
}

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${met ? "text-emerald-600" : "text-[#aaa]"}`}>
      <span aria-hidden>{met ? "✓" : "○"}</span>
      {label}
    </li>
  );
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  vet: "Veterinario",
  user: "Usuario",
};

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-10 ${error ? "border-red-400 ring-red-200 focus:border-red-500" : ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555]"
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SettingsPanel() {
  const { data: session, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Foto de perfil
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Nombre
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
  }>({});
  const [savingPassword, setSavingPassword] = useState(false);

  // Sincronizar estado local cuando carga la sesión
  useEffect(() => {
    if (!session?.user) return;
    setName((prev) => (prev === "" ? (session.user.name ?? "") : prev));
    setAvatarPreview((prev) => (prev === null ? (session.user.image ?? null) : prev));
  }, [session?.user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 4 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;
    setSavingAvatar(true);
    try {
      // Redimensionar a 256×256 en el cliente antes de enviar
      const resized = await resizeImage(avatarFile, 256);
      const form = new FormData();
      form.append("file", resized, "avatar.jpg");
      const res = await fetch("/api/blob/avatar", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo subir la foto.");
        return;
      }
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Cache-bust para forzar recarga del avatar en el nav
      const bustUrl = `${data.url}?v=${Date.now()}`;
      setAvatarPreview(bustUrl);
      await update({ picture: bustUrl });
      toast.success("Foto actualizada correctamente.");
    } catch {
      toast.error("Error de red al subir la foto.");
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error("El nombre no puede estar vacío.");
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = (await res.json()) as { name?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo actualizar el nombre.");
        return;
      }
      await update({ name: data.name ?? name.trim() });
      toast.success("Nombre actualizado correctamente.");
    } catch {
      toast.error("Error de red al guardar el nombre.");
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePassword = async () => {
    const errors: typeof passwordErrors = {};
    if (!currentPassword) errors.current = "Ingresá tu contraseña actual.";
    if (!newPassword) errors.new = "Ingresá la nueva contraseña.";
    else if (newPassword.length < 6)
      errors.new = "Debe tener al menos 6 caracteres.";
    else if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword))
      errors.new = "Debe contener letras y números.";
    if (!confirmPassword) errors.confirm = "Confirmá la nueva contraseña.";
    else if (newPassword !== confirmPassword)
      errors.confirm = "Las contraseñas no coinciden.";

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setPasswordErrors({});
    setSavingPassword(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (data.error?.toLowerCase().includes("actual")) {
          setPasswordErrors({ current: data.error });
        } else {
          toast.error(data.error ?? "No se pudo cambiar la contraseña.");
        }
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Contraseña actualizada correctamente.");
    } catch {
      toast.error("Error de red al cambiar la contraseña.");
    } finally {
      setSavingPassword(false);
    }
  };

  const user = session?.user;
  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : null;

  return (
    <div className="mx-auto w-full max-w-[560px] space-y-5 px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a]">Configuración de usuario</h1>

      {/* Foto de perfil */}
      <section className={cardClass} aria-labelledby="settings-foto-title">
        <h2 id="settings-foto-title" className={sectionTitle}>
          Foto de perfil
        </h2>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#e8e0d8] bg-[#f5f0eb]">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Foto de perfil"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <UserIcon />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Cambiar foto de perfil"
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-[#e8e0d8] bg-white shadow-sm hover:bg-[#f5f0eb] text-[#5c1838]"
            >
              <CameraIcon />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              aria-label="Seleccionar imagen de perfil"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[#555]">
              Subí una foto JPG, PNG o WebP de hasta 4 MB.
            </p>
            {avatarFile ? (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  disabled={savingAvatar}
                  className="rounded-lg bg-[#5c1838] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#401127] disabled:opacity-60"
                >
                  {savingAvatar ? "Guardando…" : "Guardar foto"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(session?.user?.image ?? null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="rounded-lg border border-[#ddd] px-4 py-1.5 text-sm font-medium text-[#555] hover:bg-[#f5f0eb]"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 rounded-lg border border-[#ddd] px-4 py-1.5 text-sm font-medium text-[#333] hover:bg-[#f5f0eb]"
              >
                Elegir imagen
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Datos personales */}
      <section className={cardClass} aria-labelledby="settings-perfil-title">
        <h2 id="settings-perfil-title" className={sectionTitle}>
          Datos personales
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="settings-name" className={labelClass}>
              Nombre
            </label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              autoComplete="name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelClass}>DNI</p>
              <p className="rounded-lg border border-[#ddd] bg-[#f5f2ee] px-3 py-2 text-[15px] text-[#999]">
                {user?.dni ?? "—"}
              </p>
            </div>
            <div>
              <p className={labelClass}>Rol</p>
              <p className="rounded-lg border border-[#ddd] bg-[#f5f2ee] px-3 py-2 text-[15px] text-[#999]">
                {roleLabel ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSaveName}
              disabled={savingName || !name.trim()}
              className="rounded-lg bg-[#5c1838] px-5 py-2 text-sm font-semibold text-white hover:bg-[#401127] disabled:opacity-60"
            >
              {savingName ? "Guardando…" : "Guardar nombre"}
            </button>
          </div>
        </div>
      </section>

      {/* Cambiar contraseña */}
      <section className={cardClass} aria-labelledby="settings-password-title">
        <h2 id="settings-password-title" className={sectionTitle}>
          Cambiar contraseña
        </h2>
        <div className="space-y-4">
          <PasswordInput
            id="settings-current-password"
            label="Contraseña actual"
            value={currentPassword}
            onChange={(v) => {
              setCurrentPassword(v);
              if (passwordErrors.current)
                setPasswordErrors((e) => ({ ...e, current: undefined }));
            }}
            autoComplete="current-password"
            error={passwordErrors.current}
          />
          <div>
            <PasswordInput
              id="settings-new-password"
              label="Nueva contraseña"
              value={newPassword}
              onChange={(v) => {
                setNewPassword(v);
                if (passwordErrors.new)
                  setPasswordErrors((e) => ({ ...e, new: undefined }));
              }}
              autoComplete="new-password"
              error={passwordErrors.new}
            />
            {newPassword.length > 0 && (
              <ul className="mt-2 space-y-1">
                <PasswordRule met={newPassword.length >= 6} label="Mínimo 6 caracteres" />
                <PasswordRule met={/[a-zA-Z]/.test(newPassword)} label="Al menos una letra" />
                <PasswordRule met={/[0-9]/.test(newPassword)} label="Al menos un número" />
              </ul>
            )}
          </div>
          <PasswordInput
            id="settings-confirm-password"
            label="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              if (passwordErrors.confirm)
                setPasswordErrors((e) => ({ ...e, confirm: undefined }));
            }}
            autoComplete="new-password"
            error={passwordErrors.confirm}
          />
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSavePassword}
              disabled={savingPassword}
              className="rounded-lg bg-[#5c1838] px-5 py-2 text-sm font-semibold text-white hover:bg-[#401127] disabled:opacity-60"
            >
              {savingPassword ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
