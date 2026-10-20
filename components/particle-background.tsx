"use client";

import { useEffect, useRef } from "react";
import styles from "./particle-background.module.css";

type Point = { x: number; y: number };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  depth: number;
  color: string;
  history: Point[];
  sparkle: boolean;
};

const COLORS = ["#f7fbff", "#9bf9f0", "#9db6ff", "#f7a8e5"];
const FRAME_MS = 1000 / 60;

function createParticle(width: number, height: number): Particle {
  const depth = 0.4 + Math.random() * 0.6;
  const angle = Math.random() * Math.PI * 2;
  const speed = 1.1 + Math.random() * 1.8 * depth;

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 0.75 + depth * 1.8,
    mass: 0.7 + depth * 1.3,
    depth,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    history: [],
    sparkle: Math.random() < 0.14,
  };
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const pointer = { x: -1000, y: -1000, active: false };

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frameId = 0;
    let lastFrame = 0;
    let running = false;
    let mobile = false;

    const resize = () => {
      const oldWidth = width;
      const oldHeight = height;
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      mobile = width < 640 || coarsePointer.matches;

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      if (oldWidth && oldHeight) {
        for (const particle of particles) {
          particle.x *= width / oldWidth;
          particle.y *= height / oldHeight;
          particle.history = [];
        }
      }

      const count = mobile
        ? Math.min(42, Math.max(24, Math.floor((width * height) / 12000)))
        : Math.min(125, Math.max(45, Math.floor((width * height) / 11500)));

      if (particles.length > count) particles.length = count;
      while (particles.length < count) particles.push(createParticle(width, height));
    };

    const render = (time: number) => {
      if (!running) return;
      frameId = window.requestAnimationFrame(render);

      if (lastFrame && time - lastFrame < (mobile ? 30 : 15)) return;
      const dt = lastFrame ? Math.min((time - lastFrame) / FRAME_MS, 2.25) : 1;
      lastFrame = time;
      context.clearRect(0, 0, width, height);

      const wells = [
        {
          x: width * (0.5 + 0.28 * Math.sin(time * 0.00017)),
          y: height * (0.5 + 0.3 * Math.cos(time * 0.00021)),
          spin: 0.062,
        },
        {
          x: width * (0.5 + 0.35 * Math.cos(time * 0.00013)),
          y: height * (0.5 + 0.32 * Math.sin(time * 0.00019)),
          spin: -0.051,
        },
      ];

      for (const particle of particles) {
        let ax = Math.sin(particle.y * 0.012 + time * 0.0007) * 0.012;
        let ay = Math.cos(particle.x * 0.011 - time * 0.0005) * 0.012;

        for (const well of wells) {
          const dx = well.x - particle.x;
          const dy = well.y - particle.y;
          const distance = Math.hypot(dx, dy) || 1;
          const influence = Math.max(0, 1 - distance / (Math.max(width, height) * 0.66));
          const strength = influence * particle.depth;
          ax += ((dx / distance) * 0.027 - (dy / distance) * well.spin) * strength;
          ay += ((dy / distance) * 0.027 + (dx / distance) * well.spin) * strength;
        }

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < 205) {
            const influence = (1 - distance / 205) ** 2;
            const force = distance < 95 ? 0.82 : -0.095;
            ax += ((dx / distance) * force - (dy / distance) * 0.22) * influence;
            ay += ((dy / distance) * force + (dx / distance) * 0.22) * influence;
          }
        }

        const drag = Math.pow(0.997, dt);
        particle.vx = (particle.vx + ax * dt) * drag;
        particle.vy = (particle.vy + ay * dt) * drag;

        const maxSpeed = 2.5 + particle.depth * 3.1;
        const speed = Math.hypot(particle.vx, particle.vy);
        if (speed > maxSpeed) {
          particle.vx = (particle.vx / speed) * maxSpeed;
          particle.vy = (particle.vy / speed) * maxSpeed;
        }

        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;

        if (particle.x < 0 || particle.x > width) {
          particle.x = Math.max(0, Math.min(width, particle.x));
          particle.vx *= -0.92;
        }
        if (particle.y < 0 || particle.y > height) {
          particle.y = Math.max(0, Math.min(height, particle.y));
          particle.vy *= -0.92;
        }
      }

      context.globalCompositeOperation = "lighter";

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distanceSquared = dx * dx + dy * dy;
          const separation = a.radius + b.radius + 8;

          if (distanceSquared < separation * separation && distanceSquared > 0.0001) {
            const distance = Math.sqrt(distanceSquared);
            const nx = dx / distance;
            const ny = dy / distance;
            const overlap = separation - distance;
            const totalMass = a.mass + b.mass;
            a.x -= nx * overlap * (b.mass / totalMass);
            a.y -= ny * overlap * (b.mass / totalMass);
            b.x += nx * overlap * (a.mass / totalMass);
            b.y += ny * overlap * (a.mass / totalMass);

            const relativeSpeed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (relativeSpeed < 0) {
              const impulse = (-(1 + 0.86) * relativeSpeed) / (1 / a.mass + 1 / b.mass);
              a.vx -= (impulse * nx) / a.mass;
              a.vy -= (impulse * ny) / a.mass;
              b.vx += (impulse * nx) / b.mass;
              b.vy += (impulse * ny) / b.mass;
            }
          } else if (!mobile && distanceSquared < 72 * 72) {
            const distance = Math.sqrt(distanceSquared);
            context.globalAlpha = (1 - distance / 72) * 0.16;
            context.strokeStyle = "#9bf9f0";
            context.lineWidth = 0.65;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }

      for (const particle of particles) {
        particle.history.unshift({ x: particle.x, y: particle.y });
        const trailLength = Math.round(5 + particle.depth * (mobile ? 5 : 9));
        if (particle.history.length > trailLength) particle.history.length = trailLength;

        context.strokeStyle = particle.color;
        context.lineCap = "square";

        for (let i = particle.history.length - 1; i > 0; i--) {
          const fade = 1 - i / particle.history.length;
          context.globalAlpha = fade * 0.42 * particle.depth;
          context.lineWidth = Math.max(0.6, particle.radius * fade);
          context.beginPath();
          context.moveTo(particle.history[i].x, particle.history[i].y);
          context.lineTo(particle.history[i - 1].x, particle.history[i - 1].y);
          context.stroke();
        }

        const x = Math.round(particle.x);
        const y = Math.round(particle.y);
        const size = Math.max(1, Math.round(particle.radius * 1.4));

        context.fillStyle = particle.color;
        context.globalAlpha = 0.13;
        context.fillRect(x - size * 2, y - size * 2, size * 5, size * 5);
        context.globalAlpha = 0.88;
        context.fillRect(x, y, size, size);

        if (particle.sparkle && Math.sin(time * 0.003 + particle.mass * 12) > 0.8) {
          context.globalAlpha = 0.38;
          context.fillRect(x - size * 3, y, size * 2, 1);
          context.fillRect(x + size * 2, y, size * 2, 1);
          context.fillRect(x, y - size * 3, 1, size * 2);
          context.fillRect(x, y + size * 2, 1, size * 2);
        }
      }

      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };

    const stop = () => {
      running = false;
      window.cancelAnimationFrame(frameId);
      lastFrame = 0;
      context.clearRect(0, 0, width, height);
    };

    const start = () => {
      if (running || reducedMotion.matches || document.hidden) return;
      running = true;
      frameId = window.requestAnimationFrame(render);
    };

    const updateMotion = () => {
      if (reducedMotion.matches) stop();
      else start();
    };

    const updateVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const updatePointer = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const releasePointer = () => {
      pointer.active = false;
    };

    resize();
    start();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerdown", updatePointer, { passive: true });
    window.addEventListener("pointerup", releasePointer);
    window.addEventListener("pointercancel", releasePointer);
    window.addEventListener("blur", releasePointer);
    document.addEventListener("visibilitychange", updateVisibility);
    reducedMotion.addEventListener("change", updateMotion);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", updatePointer);
      window.removeEventListener("pointerup", releasePointer);
      window.removeEventListener("pointercancel", releasePointer);
      window.removeEventListener("blur", releasePointer);
      document.removeEventListener("visibilitychange", updateVisibility);
      reducedMotion.removeEventListener("change", updateMotion);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
