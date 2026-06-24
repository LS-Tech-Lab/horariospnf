/**
 * useRegistroSound.js
 * Genera un sonido suave de confirmación usando la Web Audio API,
 * sin archivos externos. Exporta también el hook useFlashFeed para
 * animar el feed cuando llega un nuevo registro.
 */

import { useRef, useCallback, useState } from "react";

// Tono suave de "ping" (dos notas cortas ascendentes)
export function playRegistroSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notas = [
      { freq: 660, start: 0,    dur: 0.12, gain: 0.25 },
      { freq: 880, start: 0.13, dur: 0.18, gain: 0.20 },
    ];
    notas.forEach(({ freq, start, dur, gain }) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type      = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
      g.gain.linearRampToValueAtTime(0,    ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime  + start + dur + 0.05);
    });
  } catch { /* contexto de audio no disponible */ }
}

// Hook: devuelve `flash` (true brevemente) cuando llega un nuevo registro
export function useFlashFeed() {
  const [flash, setFlash] = useState(false);
  const timerRef = useRef(null);

  const trigger = useCallback(() => {
    setFlash(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFlash(false), 800);
  }, []);

  return { flash, trigger };
}
