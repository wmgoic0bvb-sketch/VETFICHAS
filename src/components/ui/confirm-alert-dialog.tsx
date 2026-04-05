"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";

export function ConfirmAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  destructive = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[230] bg-black/45" />
        <AlertDialog.Content className="fixed left-[50%] top-[50%] z-[231] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white px-6 py-6 shadow-xl outline-none">
          <AlertDialog.Title className="text-lg font-bold text-[#1a1a1a]">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-[#555]">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="w-full rounded-xl border-[1.5px] border-[#e8e0d8] bg-transparent py-2.5 text-sm font-medium text-[#555] hover:bg-[#f5f0eb] sm:w-auto sm:min-w-[100px]"
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={onConfirm}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white sm:w-auto sm:min-w-[100px] ${
                  destructive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#5c1838] hover:bg-[#401127]"
                }`}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
