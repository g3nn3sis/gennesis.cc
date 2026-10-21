"use client";

import { useEffect, useRef } from "react";

type FireGlyph = readonly [character: string, className: string];

type Ember = {
  x: number;
  y: number;
  intensity: number;
  velocityX: number;
  velocityY: number;
};

const TICK_INTERVAL = 30;
const MOBILE_QUERY = "(hover: none) and (pointer: coarse)";

const FIRE: ReadonlyArray<readonly [number, string, string]> = [
  [0, " ", ""],
  [0.14, ".", "c1"],
  [0.30, ":", "c1"],
  [0.45, ";", "c2"],
  [0.60, "i", "c3"],
  [0.72, "|", "c3"],
  [0.82, "I", "c4"],
  [0.90, "#", "c4"],
  [0.97, "&", "c5"],
  [1.01, "@", "c5"],
];

function glyphFor(heat: number): FireGlyph {
  for (let index = FIRE.length - 1; index >= 0; index--) {
    if (heat >= FIRE[index][0]) {
      return [FIRE[index][1], FIRE[index][2]];
    }
  }

  return [" ", ""];
}

function makeEmber(x: number, y: number, intensity: number): Ember {
  return {
    x,
    y,
    intensity,
    velocityX: (Math.random() - 0.5) * 0.35,
    velocityY: -0.25 - Math.random() * 0.65,
  };
}

export default function RetroFire() {
  const stageRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileDevice = window.matchMedia(MOBILE_QUERY);

    let columns = 1;
    let rows = 1;
    let grid: Float32Array[] = [];
    let embers: Ember[] = [];
    let intervalId: number | undefined;

    const updateFire = () => {
      const bottom = grid[rows - 1];

      for (let x = 0; x < columns; x++) {
        let heat = bottom[x] * 0.8;
        if (Math.random() < 0.24) heat = Math.max(heat, 0.9 + Math.random() * 0.1);
        if (Math.random() < 0.03) heat = 1;
        bottom[x] = Math.max(0, heat);
      }

      for (let y = rows - 2; y >= 0; y--) {
        const current = grid[y];
        const below = grid[y + 1];

        for (let x = 0; x < columns; x++) {
          const left = x === 0 ? columns - 1 : x - 1;
          const right = x === columns - 1 ? 0 : x + 1;
          const averagedHeat = (below[left] + below[x] + below[right]) / 3;
          const heat = averagedHeat * (0.86 + Math.random() * 0.28) - 0.01;
          current[x] = Math.max(0, heat);
        }
      }
    };

    const updateEmbers = () => {
      if (Math.random() < 0.5) {
        embers.push(
          makeEmber(
            Math.floor(Math.random() * columns),
            rows - 1 - Math.floor(Math.random() * Math.max(1, Math.floor(rows * 0.12))),
            0.85 + Math.random() * 0.15,
          ),
        );
      }

      if (Math.random() < 0.5) {
        embers.push(
          makeEmber(
            Math.floor(Math.random() * columns),
            Math.floor(Math.random() * Math.max(1, rows - Math.floor(rows * 0.15))),
            0.25 + Math.random() * 0.5,
          ),
        );
      }

      for (let index = embers.length - 1; index >= 0; index--) {
        const ember = embers[index];
        ember.intensity -= Math.random() * 0.06;
        ember.x += ember.velocityX;
        ember.y += ember.velocityY;

        if (ember.intensity <= 0 || ember.y < 0 || ember.x < 0 || ember.x >= columns) {
          embers.splice(index, 1);
        }
      }

      if (embers.length > 300) embers.splice(0, embers.length - 300);
    };

    const render = () => {
      const emberCells = new Map<number, FireGlyph>();

      for (const ember of embers) {
        const x = Math.round(ember.x);
        const y = Math.round(ember.y);

        if (x < 0 || x >= columns || y < 0 || y >= rows) continue;

        const className = ember.intensity > 0.7 ? "c4" : ember.intensity > 0.4 ? "c3" : "c2";
        emberCells.set(y * columns + x, [ember.intensity > 0.5 ? "*" : ".", className]);
      }

      const lines: string[] = [];

      for (let y = 0; y < rows; y++) {
        const parts: string[] = [];
        let openClass = "";

        for (let x = 0; x < columns; x++) {
          const [character, className] = emberCells.get(y * columns + x) ?? glyphFor(grid[y][x]);

          if (className !== openClass) {
            if (openClass) parts.push("</span>");
            if (className) parts.push('<span class="' + className + '">');
            openClass = className;
          }

          parts.push(character === "&" ? "&amp;" : character);
        }

        if (openClass) parts.push("</span>");
        lines.push(parts.join(""));
      }

      stage.innerHTML = lines.join("\n");
    };

    const layout = () => {
      if (mobileDevice.matches) return;

      const fontSize = Math.max(12, Math.min(32, Math.round(window.innerWidth / 150)));
      stage.style.fontSize = String(fontSize) + "px";

      const probe = document.createElement("span");
      probe.textContent = "W";
      probe.style.cssText =
        'position:absolute;visibility:hidden;font-size:' +
        fontSize +
        'px;line-height:1;font-family:"Courier New",Courier,monospace;white-space:pre;';
      document.body.appendChild(probe);
      const characterWidth = Math.max(1, probe.getBoundingClientRect().width);
      probe.remove();

      columns = Math.max(1, Math.floor(stage.clientWidth / characterWidth));
      rows = Math.max(2, Math.floor(stage.clientHeight / fontSize));
      grid = Array.from({ length: rows }, () => new Float32Array(columns));
      embers = [];

      for (let index = 0; index < rows + 12; index++) updateFire();
      render();
    };

    const tick = () => {
      updateFire();
      updateEmbers();
      render();
    };

    const stop = () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
      intervalId = undefined;
    };

    const start = () => {
      if (intervalId !== undefined || document.hidden || motionPreference.matches || mobileDevice.matches) return;
      intervalId = window.setInterval(tick, TICK_INTERVAL);
    };

    const updateMotion = () => {
      stop();
      start();
    };

    const updateDevice = () => {
      stop();
      layout();
      start();
    };

    const updateVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    layout();
    start();

    window.addEventListener("resize", layout);
    document.addEventListener("visibilitychange", updateVisibility);
    motionPreference.addEventListener("change", updateMotion);
    mobileDevice.addEventListener("change", updateDevice);

    return () => {
      stop();
      window.removeEventListener("resize", layout);
      document.removeEventListener("visibilitychange", updateVisibility);
      motionPreference.removeEventListener("change", updateMotion);
      mobileDevice.removeEventListener("change", updateDevice);
    };
  }, []);

  return (
    <>
      <pre ref={stageRef} className="fire" aria-hidden="true" />
      <div className="fire-burn" aria-hidden="true" />
    </>
  );
}
