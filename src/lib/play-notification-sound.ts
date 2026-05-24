/**
 * Campanilla tipo mensajería (Web Audio API): tres notas, más fuerte que un pitido suave.
 * No es el sonido de WhatsApp (protegido); es un patrón original similar en idea (corto y llamativo).
 * Puede fallar en silencio si el navegador bloquea audio hasta una interacción del usuario.
 */
function chimeNote(
  ctx: AudioContext,
  start: number,
  freqHz: number,
  durationSec: number,
  peakGain: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freqHz, start);
  const attack = 0.014;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peakGain, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationSec + 0.04);
}

export function playNotificationSound(): void {
  if (typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ||
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  if (!Ctx) return;

  try {
    const ctx = new Ctx();
    void ctx.resume().then(() => {
      const t0 = ctx.currentTime;
      chimeNote(ctx, t0, 1047, 0.1, 0.22);
      chimeNote(ctx, t0 + 0.12, 784, 0.1, 0.2);
      chimeNote(ctx, t0 + 0.26, 659, 0.16, 0.24);
    });
  } catch {
    /* ignore */
  }
}
