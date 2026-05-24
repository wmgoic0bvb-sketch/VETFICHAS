"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Modal } from "@/components/ui/modal";
import { getCroppedImgBlob } from "@/lib/get-cropped-img";

const OUTPUT_SIZE = 256;

export function PatientFotoModal({
  open,
  onClose,
  imageFile,
  patientNombre,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  imageFile: File | null;
  patientNombre: string;
  onSave: (blob: Blob) => Promise<void>;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !imageFile) {
      setImgUrl(null);
      return;
    }
    const u = URL.createObjectURL(imageFile);
    setImgUrl(u);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPixels(null);
    return () => {
      URL.revokeObjectURL(u);
    };
  }, [open, imageFile]);

  const onComplete = useCallback((_area: Area, croppedPixels: Area) => {
    setPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!imgUrl || !pixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedImgBlob(imgUrl, pixels, OUTPUT_SIZE);
      await onSave(blob);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const requestClose = () => {
    if (!busy) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={requestClose}
      labelledBy="patient-foto-modal-title"
      overlayClassName="z-[220]"
    >
      <h2 id="patient-foto-modal-title" className="mb-1 text-xl font-bold text-[#1a1a1a]">
        Foto de {patientNombre}
      </h2>
      <p className="mb-4 text-sm text-[#666]">
        Mové y ampliá la imagen; el recorte es circular en la ficha.
      </p>

      {imgUrl ? (
        <div className="relative mb-4 h-[260px] w-full overflow-hidden rounded-2xl bg-[#1a1a1a]">
          <Cropper
            image={imgUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>
      ) : (
        <div className="mb-4 flex h-[260px] items-center justify-center rounded-2xl bg-[#f0ebe4] text-sm text-[#888]">
          Elegí una imagen…
        </div>
      )}

      <label className="mb-4 flex flex-col gap-1 text-sm">
        <span className="text-[#555]">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-[#5c1838]"
          disabled={!imgUrl || busy}
        />
      </label>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={requestClose}
          disabled={busy}
          className="rounded-xl border border-[#e0d9cf] bg-white px-4 py-2.5 text-sm font-semibold text-[#444] transition-colors hover:bg-[#faf8f5] disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!imgUrl || !pixels || busy}
          className="rounded-xl bg-[#5c1838] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4a1430] disabled:pointer-events-none disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar foto"}
        </button>
      </div>
    </Modal>
  );
}
