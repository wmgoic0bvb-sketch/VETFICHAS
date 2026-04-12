"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
import { DbLoadingOverlay, LottieSpinner } from "@/components/ui/lottie-loading";
import {
  AdminVacunaForm,
  type VacunaRow,
} from "@/components/admin/admin-vacuna-form";

export function AdminVacunasPanel() {
  const [vacunas, setVacunas] = useState<VacunaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<VacunaRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<VacunaRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vacunas");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "Error al cargar");
      }
      const data = (await res.json()) as { vacunas: VacunaRow[] };
      setVacunas(data.vacunas);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar vacunas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">
            Catálogo de vacunas
          </h2>
          <p className="mt-1 text-sm text-[#666]">
            Nombre y descripción de cada vacuna aplicable. Estas opciones
            alimentan las vacunaciones en fichas y, más adelante, el carnet
            exportable.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-[#e8e0d8] bg-white px-4 py-2 text-sm font-medium text-[#555] hover:bg-[#f5f0eb]"
          >
            Actualizar lista
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-[#5c1838] px-5 py-2 text-sm font-medium text-white hover:bg-[#401127]"
          >
            Nueva vacuna
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white shadow-sm">
        {loading ? (
          <div
            className="flex flex-col items-center justify-center gap-3 p-10"
            role="status"
            aria-label="Cargando vacunas"
          >
            <LottieSpinner size={120} />
            <span className="text-sm text-[#888]">Cargando…</span>
          </div>
        ) : vacunas.length === 0 ? (
          <p className="p-8 text-center text-[#888]">
            No hay vacunas cargadas. Usá &quot;Nueva vacuna&quot; para agregar la
            primera.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-[#e8e0d8] bg-[#f5f0eb]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#333]">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-[#333]">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-[#333]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {vacunas.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-[#f0ebe4] last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-[#333]">
                      {v.nombre}
                    </td>
                    <td
                      className="max-w-[280px] px-4 py-3 text-[#555]"
                      title={v.descripcion || undefined}
                    >
                      {v.descripcion ? (
                        <span className="line-clamp-2">{v.descripcion}</span>
                      ) : (
                        <span className="text-[#aaa]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditRow(v)}
                        className="mr-2 text-[#5c1838] hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteRow(v)}
                        className="text-red-600 hover:underline"
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
        labelledBy="admin-vacuna-create-title"
      >
        <h2
          id="admin-vacuna-create-title"
          className="text-lg font-semibold text-[#1a1a1a]"
        >
          Nueva vacuna
        </h2>
        <AdminVacunaForm
          mode="create"
          onCancel={() => setCreateOpen(false)}
          onSaved={async () => {
            setCreateOpen(false);
            await load();
            toast.success("Vacuna creada");
          }}
        />
      </Modal>

      <Modal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        labelledBy="admin-vacuna-edit-title"
      >
        <h2
          id="admin-vacuna-edit-title"
          className="text-lg font-semibold text-[#1a1a1a]"
        >
          Editar vacuna
        </h2>
        {editRow ? (
          <AdminVacunaForm
            key={editRow.id}
            mode="edit"
            initial={editRow}
            onCancel={() => setEditRow(null)}
            onSaved={async () => {
              setEditRow(null);
              await load();
              toast.success("Vacuna actualizada");
            }}
          />
        ) : null}
      </Modal>

      <ConfirmAlertDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        title="Eliminar vacuna"
        description={
          deleteRow
            ? `¿Eliminar «${deleteRow.nombre}» del catálogo? Las fichas que ya registren esta vacuna por nombre pueden quedar con texto histórico distinto.`
            : ""
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          void (async () => {
            if (!deleteRow) return;
            setDeleteInProgress(true);
            try {
              const res = await fetch(`/api/admin/vacunas/${deleteRow.id}`, {
                method: "DELETE",
              });
              const j = await res.json().catch(() => ({}));
              if (!res.ok) {
                toast.error(
                  typeof j.error === "string" ? j.error : "No se pudo eliminar",
                );
                return;
              }
              setDeleteRow(null);
              await load();
              toast.success("Vacuna eliminada");
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
