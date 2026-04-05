"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
import { DbLoadingOverlay, LottieSpinner } from "@/components/ui/lottie-loading";

export type AdminUserRow = {
  id: string;
  dni: string;
  name: string | null;
  role: "user" | "admin" | "vet";
  createdAt: string | null;
  updatedAt: string | null;
};

export function AdminUsersPanel() {
  const { data: session, update } = useSession();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "Error al cargar");
      }
      const data = (await res.json()) as { users: AdminUserRow[] };
      setUsers(data.users);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selfId = session?.user?.id;

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">
            Administración de usuarios
          </h1>
          <p className="mt-1 text-sm text-[#666]">
            Alta, baja y edición de cuentas (DNI y contraseña).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-full bg-[#2d6a4f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1b4332]"
        >
          Nuevo usuario
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white shadow-sm">
        {loading ? (
          <div
            className="flex flex-col items-center justify-center gap-3 p-10"
            role="status"
            aria-label="Cargando usuarios"
          >
            <LottieSpinner size={120} />
            <span className="text-sm text-[#888]">Cargando…</span>
          </div>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-[#888]">No hay usuarios.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[#e8e0d8] bg-[#f5f0eb]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#333]">DNI</th>
                  <th className="px-4 py-3 font-semibold text-[#333]">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-[#333]">Rol</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#333]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[#f0ebe4] last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-[#333]">{u.dni}</td>
                    <td className="px-4 py-3 text-[#555]">
                      {u.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.role === "admin"
                            ? "rounded-full bg-[#d8f3dc] px-2.5 py-0.5 text-xs font-medium text-[#1b4332]"
                            : u.role === "vet"
                              ? "rounded-full bg-[#cce5ff] px-2.5 py-0.5 text-xs font-medium text-[#1a4d7a]"
                              : "rounded-full bg-[#e8e0d8] px-2.5 py-0.5 text-xs font-medium text-[#555]"
                        }
                      >
                        {u.role === "admin"
                          ? "Admin"
                          : u.role === "vet"
                            ? "Veterinario"
                            : "Usuario"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditUser(u)}
                        className="mr-2 text-[#2d6a4f] hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={u.id === selfId}
                        onClick={() => setDeleteUser(u)}
                        className={
                          u.id === selfId
                            ? "cursor-not-allowed text-[#ccc]"
                            : "text-red-600 hover:underline"
                        }
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        labelledBy="admin-create-title"
      >
        <h2 id="admin-create-title" className="text-lg font-semibold text-[#1a1a1a]">
          Nuevo usuario
        </h2>
        <UserForm
          mode="create"
          onCancel={() => setCreateOpen(false)}
          onSaved={async () => {
            setCreateOpen(false);
            await load();
            toast.success("Usuario creado");
          }}
        />
      </Modal>

      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        labelledBy="admin-edit-title"
      >
        <h2 id="admin-edit-title" className="text-lg font-semibold text-[#1a1a1a]">
          Editar usuario
        </h2>
        {editUser ? (
          <UserForm
            key={editUser.id}
            mode="edit"
            initial={editUser}
            onCancel={() => setEditUser(null)}
            onSaved={async (opts) => {
              const editedId = editUser.id;
              setEditUser(null);
              await load();
              if (opts?.changedRole && editedId === selfId) {
                await update();
              }
              toast.success("Usuario actualizado");
            }}
          />
        ) : null}
      </Modal>

      <ConfirmAlertDialog
        open={!!deleteUser}
        onOpenChange={(o) => !o && setDeleteUser(null)}
        title="Eliminar usuario"
        description={
          deleteUser
            ? `¿Seguro que querés eliminar al DNI ${deleteUser.dni}? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          void (async () => {
            if (!deleteUser) return;
            setDeleteInProgress(true);
            try {
              const res = await fetch(`/api/admin/users/${deleteUser.id}`, {
                method: "DELETE",
              });
              if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                toast.error(
                  typeof j.error === "string" ? j.error : "No se pudo eliminar",
                );
                return;
              }
              setDeleteUser(null);
              await load();
              toast.success("Usuario eliminado");
            } finally {
              setDeleteInProgress(false);
            }
          })();
        }}
      />

      <DbLoadingOverlay show={deleteInProgress} />
    </div>
  );
}

function UserForm({
  mode,
  initial,
  onCancel,
  onSaved,
}: {
  mode: "create" | "edit";
  initial?: AdminUserRow;
  onCancel: () => void;
  onSaved: (opts?: { changedRole?: boolean }) => void | Promise<void>;
}) {
  const [dni, setDni] = useState(initial?.dni ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin" | "vet">(
    initial?.role ?? "user",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dni: dni.trim(),
            password,
            name: name.trim() || undefined,
            role,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof j.error === "string" ? j.error : "Error al crear");
          return;
        }
        await onSaved({});
        return;
      }

      if (!initial) return;
      const body: Record<string, unknown> = {
        name: name.trim() === "" ? null : name.trim(),
        role,
      };
      if (password.trim() !== "") {
        body.password = password;
      }
      const res = await fetch(`/api/admin/users/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Error al guardar");
        return;
      }
      const changedRole = initial.role !== role;
      await onSaved({ changedRole });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DbLoadingOverlay show={submitting} className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-black/35 backdrop-blur-[1px]" />
    <form onSubmit={handleSubmit} className="relative mt-5 space-y-4">
      {mode === "create" ? (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#444]">DNI</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-2 text-[#333] outline-none ring-[#2d6a4f]/30 focus:ring-2"
          />
        </label>
      ) : (
        <p className="text-sm text-[#666]">
          DNI: <span className="font-mono font-medium text-[#333]">{initial?.dni}</span>
        </p>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[#444]">
          Nombre (opcional)
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-2 text-[#333] outline-none ring-[#2d6a4f]/30 focus:ring-2"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[#444]">
          {mode === "create" ? "Contraseña" : "Nueva contraseña (opcional)"}
        </span>
        <input
          type="password"
          autoComplete="new-password"
          required={mode === "create"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-2 text-[#333] outline-none ring-[#2d6a4f]/30 focus:ring-2"
        />
        {mode === "edit" ? (
          <span className="mt-1 block text-xs text-[#888]">
            Dejá en blanco para no cambiar la contraseña.
          </span>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[#444]">Rol</span>
        <select
          value={role}
          onChange={(e) => {
            const v = e.target.value;
            setRole(v === "admin" ? "admin" : v === "vet" ? "vet" : "user");
          }}
          className="w-full rounded-xl border border-[#e8e0d8] bg-white px-3 py-2 text-[#333] outline-none ring-[#2d6a4f]/30 focus:ring-2"
        >
          <option value="user">Usuario</option>
          <option value="vet">Veterinario</option>
          <option value="admin">Administrador</option>
        </select>
      </label>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[#e8e0d8] px-4 py-2 text-sm font-medium text-[#555] hover:bg-[#f5f0eb]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#2d6a4f] px-5 py-2 text-sm font-medium text-white hover:bg-[#1b4332] disabled:opacity-60"
        >
          {submitting ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
    </>
  );
}
