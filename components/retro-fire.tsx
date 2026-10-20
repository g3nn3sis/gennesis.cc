"use client";

import { useEffect, useRef } from "react";

const MAX_HEAT = 36;
const FRAME_INTERVAL = 1000 / 24;

const COLOR_STOPS = [
  { level: 0, color: [0, 0, 0, 0] },
  { level: 5, color: [84, 8, 7, 34] },
  { level: 12, color: [188, 22, 5, 165] },
  { level: 20, color: [255, 73, 8, 232] },
  { level: 28, color: [255, 156, 28, 250] },
  { level: 34, color: [255, 220, 92, 255] },
  { level: MAX_HEAT, color: [255, 247, 179, 255] },
];

const PALETTE = Array.from({ length: MAX_HEAT + 1 }, (_, heat) => {
  const upperIndex = COLOR_STOPS.findIndex((stop) => stop.level >= heat);
  const upper = COLOR_STOPS[upperIndex];
  const lower = COLOR_STOPS[Math.max(0, upperIndex - 1)];
  const fraction = upper.level === lower.level ? 0 : (heat - lower.level) / (upper.level - lower.level);

  return upper.color.map((channel, index) =>
    Math.round(lower.color[index] + (channel - lower.color[index]) * fraction),
  );
});

export default function RetroFire() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let columns = 0;
    let rows = 0;
    let current = new Uint8Array(0);
    let next = new Uint8Array(0);
    let image = context.createImageData(1, 1);
    let frameId = 0;
    let lastFrame = 0;
    let tick = 0;

    const advance = () => {
      for (let y = 0; y < rows - 1; y++) {
        const row = y * columns;
        const below = (y + 1) * columns;

        for (let x = 0; x < columns; x++) {
          const sourceX = Math.max(0, Math.min(columns - 1, x + Math.floor(Math.random() * 3) - 1));
          const cooling = Math.floor(Math.random() * 3);
          next[row + x] = Math.max(0, current[below + sourceX] - cooling);
        }
      }

      const bottom = (rows - 1) * columns;
      for (let x = 0; x < columns; x++) {
        const wave = Math.sin(x * 0.085 + tick * 0.14) * 2.5;
        const flicker = (Math.random() - 0.5) * 8;
        next[bottom + x] = Math.max(24, Math.min(MAX_HEAT, Math.round(32 + wave + flicker)));
      }

      [current, next] = [next, current];
      tick++;
    };

    const draw = () => {
      const pixels = image.data;

      for (let index = 0; index < current.length; index++) {
        const color = PALETTE[current[index]];
        const offset = index * 4;
        pixels[offset] = color[0];
        pixels[offset + 1] = color[1];
        pixels[offset + 2] = color[2];
        pixels[offset + 3] = color[3];
      }

      context.putImageData(image, 0, 0);
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelSize = Math.max(4, Math.ceil(bounds.width / 480));

      columns = Math.max(1, Math.ceil(bounds.width / pixelSize));
      rows = Math.max(2, Math.ceil(bounds.height / pixelSize));
      canvas.width = columns;
      canvas.height = rows;
      context.imageSmoothingEnabled = false;

      current = new Uint8Array(columns * rows);
      next = new Uint8Array(columns * rows);
      image = context.createImageData(columns, rows);
      tick = 0;

      for (let step = 0; step < rows + 12; step++) advance();
      draw();
    };

    const animate = (time: number) => {
      frameId = window.requestAnimationFrame(animate);
      if (time - lastFrame < FRAME_INTERVAL) return;

      lastFrame = time;
      advance();
      draw();
    };

    const stop = () => {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      lastFrame = 0;
    };

    const start = () => {
      if (!frameId && !document.hidden && !motionPreference.matches) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    const updateMotion = () => {
      stop();
      start();
    };

    const updateVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    resize();
    start();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", updateVisibility);
    motionPreference.addEventListener("change", updateMotion);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", updateVisibility);
      motionPreference.removeEventListener("change", updateMotion);
    };
  }, []);

  return <canvas ref={canvasRef} className="fire" aria-hidden="true" />;
}
