"use client";

import { useEffect, useRef } from "react";
import styles from "./particle-background.module.css";

type Dot = {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  velocityX: number;
  velocityY: number;
  depth: number;
  phase: number;
  color: string;
};

type Spark = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
};

type Ripple = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
};

const COLORS = ["#ffffff", "#d3ebff", "#a8e9ff", "#c5c4ff"];
const FRAME_DURATION = 1000 / 60;

function noise(x: number, y: number, seed: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

export default function ParticleBackground() {
  const backgroundRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const background = backgroundRef.current;
    const cursorCanvas = cursorRef.current;
    const backgroundContext = background?.getContext("2d");
    const cursorContext = cursorCanvas?.getContext("2d");

    if (!background || !cursorCanvas || !backgroundContext || !cursorContext) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const pointer = {
      x: 0,
      y: 0,
      easedX: 0,
      easedY: 0,
      active: false,
    };

    let width = 0;
    let height = 0;
    let mobile = false;
    let dots: Dot[] = [];
    let sparks: Spark[] = [];
    let ripples: Ripple[] = [];
    let frameId = 0;
    let lastFrame = 0;
    let running = false;

    const drawDots = (time: number, delta: number, staticOnly = false) => {
      backgroundContext.clearRect(0, 0, width, height);
      backgroundContext.globalCompositeOperation = "lighter";

      const parallaxX = pointer.active && !staticOnly ? (pointer.easedX / width - 0.5) * 18 : 0;
      const parallaxY = pointer.active && !staticOnly ? (pointer.easedY / height - 0.5) * 18 : 0;

      for (const dot of dots) {
        if (!staticOnly) {
          const driftX = Math.sin(time * 0.00038 + dot.phase) * dot.depth * 1.7;
          const driftY = Math.cos(time * 0.00032 + dot.phase) * dot.depth * 1.7;
          const targetX = driftX - parallaxX * dot.depth;
          const targetY = driftY - parallaxY * dot.depth;

          let forceX = (targetX - dot.offsetX) * 0.085;
          let forceY = (targetY - dot.offsetY) * 0.085;

          if (pointer.active) {
            const differenceX = dot.x + dot.offsetX - pointer.easedX;
            const differenceY = dot.y + dot.offsetY - pointer.easedY;
            const distance = Math.hypot(differenceX, differenceY);
            const range = 155;

            if (distance < range) {
              const influence = (1 - distance / range) ** 2 * dot.depth;
              const directionX = distance > 0.01 ? differenceX / distance : Math.cos(dot.phase);
              const directionY = distance > 0.01 ? differenceY / distance : Math.sin(dot.phase);
              forceX += directionX * influence * 1.85;
              forceY += directionY * influence * 1.85;
            }
          }

          const damping = Math.pow(0.84, delta);
          dot.velocityX = (dot.velocityX + forceX * delta) * damping;
          dot.velocityY = (dot.velocityY + forceY * delta) * damping;
          dot.offsetX = Math.max(-52, Math.min(52, dot.offsetX + dot.velocityX * delta));
          dot.offsetY = Math.max(-52, Math.min(52, dot.offsetY + dot.velocityY * delta));
        }

        const x = Math.round(dot.x + (staticOnly ? 0 : dot.offsetX));
        const y = Math.round(dot.y + (staticOnly ? 0 : dot.offsetY));
        const size = dot.depth > 0.78 ? 3 : dot.depth > 0.43 ? 2 : 1;
        const shimmer = staticOnly ? 1 : 0.88 + Math.sin(time * 0.0011 + dot.phase) * 0.12;

        backgroundContext.fillStyle = dot.color;

        if (dot.depth > 0.7) {
          backgroundContext.globalAlpha = 0.075 * dot.depth * shimmer;
          backgroundContext.fillRect(x - size * 2, y - size * 2, size * 5, size * 5);
        }

        backgroundContext.globalAlpha = (0.26 + dot.depth * 0.66) * shimmer;
        backgroundContext.fillRect(x - Math.floor(size / 2), y - Math.floor(size / 2), size, size);
      }

      backgroundContext.globalCompositeOperation = "source-over";
      backgroundContext.globalAlpha = 1;
    };

    const drawCursor = (time: number, delta: number) => {
      cursorContext.clearRect(0, 0, width, height);
      cursorContext.globalCompositeOperation = "lighter";

      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.life -= delta * 0.025;

        if (spark.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        spark.x += spark.velocityX * delta;
        spark.y += spark.velocityY * delta;
        spark.velocityX *= Math.pow(0.985, delta);
        spark.velocityY *= Math.pow(0.985, delta);
        const size = spark.life > 0.7 ? 3 : 2;

        cursorContext.fillStyle = spark.life > 0.5 ? "#ffffff" : "#9fe7ff";
        cursorContext.globalAlpha = spark.life * 0.56;
        cursorContext.fillRect(Math.round(spark.x), Math.round(spark.y), size, size);
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.radius += delta * 3.3;
        ripple.opacity -= delta * 0.024;

        if (ripple.opacity <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        cursorContext.strokeStyle = "#b1f5ff";
        cursorContext.lineWidth = 1.3;
        cursorContext.globalAlpha = ripple.opacity;
        cursorContext.beginPath();
        cursorContext.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        cursorContext.stroke();
      }

      if (pointer.active) {
        const x = pointer.easedX;
        const y = pointer.easedY;
        const radius = 12 + Math.sin(time * 0.004) * 1.5;
        const halo = cursorContext.createRadialGradient(x, y, 0, x, y, 44);

        halo.addColorStop(0, "rgba(151, 228, 255, 0.19)");
        halo.addColorStop(1, "rgba(151, 228, 255, 0)");
        cursorContext.globalAlpha = 1;
        cursorContext.fillStyle = halo;
        cursorContext.fillRect(x - 44, y - 44, 88, 88);

        cursorContext.strokeStyle = "#b4f2ff";
        cursorContext.lineWidth = 1;
        cursorContext.globalAlpha = 0.6;
        cursorContext.beginPath();
        cursorContext.arc(x, y, radius, 0, Math.PI * 2);
        cursorContext.stroke();

        cursorContext.fillStyle = "#ffffff";
        cursorContext.globalAlpha = 0.5;
        cursorContext.fillRect(Math.round(pointer.x) - 1, Math.round(pointer.y) - 1, 3, 3);

        cursorContext.strokeStyle = "#d2f5ff";
        cursorContext.globalAlpha = 0.35;
        cursorContext.beginPath();
        cursorContext.moveTo(x - radius - 7, y);
        cursorContext.lineTo(x - radius - 3, y);
        cursorContext.moveTo(x + radius + 3, y);
        cursorContext.lineTo(x + radius + 7, y);
        cursorContext.moveTo(x, y - radius - 7);
        cursorContext.lineTo(x, y - radius - 3);
        cursorContext.moveTo(x, y + radius + 3);
        cursorContext.lineTo(x, y + radius + 7);
        cursorContext.stroke();
      }

      cursorContext.globalCompositeOperation = "source-over";
      cursorContext.globalAlpha = 1;
    };

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      mobile = width < 640 || coarsePointer.matches;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

      for (const canvas of [background, cursorCanvas]) {
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
      }

      backgroundContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      cursorContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const spacing = mobile ? 46 : 39;
      const columns = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);
      const cellWidth = width / columns;
      const cellHeight = height / rows;

      dots = [];
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const depth = 0.2 + noise(column, row, 0) * 0.8;
          const colorIndex = Math.floor(noise(column, row, 1) * COLORS.length);

          dots.push({
            x: (column + 0.5) * cellWidth,
            y: (row + 0.5) * cellHeight,
            offsetX: 0,
            offsetY: 0,
            velocityX: 0,
            velocityY: 0,
            depth,
            phase: noise(column, row, 2) * Math.PI * 2,
            color: COLORS[colorIndex],
          });
        }
      }

      if (motionPreference.matches) drawDots(0, 0, true);
    };

    const animate = (time: number) => {
      if (!running) return;
      frameId = window.requestAnimationFrame(animate);

      if (lastFrame && time - lastFrame < (mobile ? 32 : 15)) return;
      const delta = lastFrame ? Math.min((time - lastFrame) / FRAME_DURATION, 2) : 1;
      lastFrame = time;

      if (pointer.active) {
        const smoothing = 1 - Math.pow(0.68, delta);
        pointer.easedX += (pointer.x - pointer.easedX) * smoothing;
        pointer.easedY += (pointer.y - pointer.easedY) * smoothing;
      }

      drawDots(time, delta);
      drawCursor(time, delta);
    };

    const stop = () => {
      running = false;
      window.cancelAnimationFrame(frameId);
      lastFrame = 0;
      backgroundContext.clearRect(0, 0, width, height);
      cursorContext.clearRect(0, 0, width, height);
      sparks = [];
      ripples = [];
    };

    const start = () => {
      if (running || document.hidden) return;
      if (motionPreference.matches) {
        drawDots(0, 0, true);
        return;
      }
      running = true;
      frameId = window.requestAnimationFrame(animate);
    };

    const updatePointer = (event: PointerEvent) => {
      if (motionPreference.matches || event.pointerType === "touch") return;

      const wasActive = pointer.active;
      const oldX = pointer.x;
      const oldY = pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;

      if (!wasActive) {
        pointer.easedX = pointer.x;
        pointer.easedY = pointer.y;
        return;
      }

      const distance = Math.hypot(pointer.x - oldX, pointer.y - oldY);
      const count = Math.min(4, Math.floor(distance / 9));
      for (let i = 0; i < count; i++) {
        const fraction = (i + 1) / (count + 1);
        sparks.push({
          x: oldX + (pointer.x - oldX) * fraction,
          y: oldY + (pointer.y - oldY) * fraction,
          velocityX: (Math.random() - 0.5) * 1.4,
          velocityY: (Math.random() - 0.5) * 1.4,
          life: 0.65 + Math.random() * 0.35,
        });
      }

      if (sparks.length > 85) sparks.splice(0, sparks.length - 85);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (motionPreference.matches || event.pointerType === "touch") return;
      updatePointer(event);
      ripples.push({ x: event.clientX, y: event.clientY, radius: 5, opacity: 0.75 });
      if (ripples.length > 6) ripples.shift();
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) pointer.active = false;
    };

    const releasePointer = () => {
      pointer.active = false;
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
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerout", handlePointerOut);
    window.addEventListener("blur", releasePointer);
    document.addEventListener("visibilitychange", updateVisibility);
    motionPreference.addEventListener("change", updateMotion);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("blur", releasePointer);
      document.removeEventListener("visibilitychange", updateVisibility);
      motionPreference.removeEventListener("change", updateMotion);
    };
  }, []);

  return (
    <>
      <canvas ref={backgroundRef} className={styles.canvas} aria-hidden="true" />
      <canvas ref={cursorRef} className={styles.cursorCanvas} aria-hidden="true" />
    </>
  );
}
