"use client";

import { useEffect, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  size: number;
  color: string;
  offsetX: number;
  offsetY: number;
  velocityX: number;
  velocityY: number;
};

type DirtyRect = { left: number; top: number; right: number; bottom: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smoothstep = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};

function glow(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  return Math.exp(-2 * (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));
}

export default function ParticleBackground() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    const stillCanvas = document.createElement("canvas");
    const stillContext = stillCanvas.getContext("2d", { alpha: false });
    if (!field || !canvas || !context || !stillContext) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: -1000, y: -1000, active: false };
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let lastTime = 0;
    let spacing = 8;
    let startX = 0;
    let startY = 0;
    let previousDirty: DirtyRect | null = null;

    function drawDot(target: CanvasRenderingContext2D, dot: Dot, displaced: boolean) {
      const x = dot.x + (displaced ? dot.offsetX : 0);
      const y = dot.y + (displaced ? dot.offsetY : 0);
      target.fillStyle = dot.color;
      target.beginPath();
      target.arc(x, y, dot.size / 2, 0, Math.PI * 2);
      target.fill();
    }

    function restore(rect: DirtyRect) {
      if (!context) return;
      const rectWidth = rect.right - rect.left;
      const rectHeight = rect.bottom - rect.top;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.drawImage(stillCanvas, rect.left, rect.top, rectWidth, rectHeight, rect.left, rect.top, rectWidth, rectHeight);
    }

    function drawMoving(rect: DirtyRect) {
      if (!context) return;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = "#000";
      context.fillRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const left = rect.left / dpr;
      const top = rect.top / dpr;
      const right = rect.right / dpr;
      const bottom = rect.bottom / dpr;
      for (const dot of dots) {
        if (dot.x < left || dot.x > right || dot.y < top || dot.y > bottom) continue;
        drawDot(context, dot, true);
      }
    }

    function dirtyRect(minX: number, minY: number, maxX: number, maxY: number): DirtyRect {
      const left = Math.max(0, Math.floor(((Math.floor((minX - startX) / spacing) * spacing + startX - spacing / 2) * dpr)));
      const top = Math.max(0, Math.floor(((Math.floor((minY - startY) / spacing) * spacing + startY - spacing / 2) * dpr)));
      const right = Math.min(canvas!.width, Math.ceil(((Math.ceil((maxX - startX) / spacing) * spacing + startX + spacing / 2) * dpr)));
      const bottom = Math.min(canvas!.height, Math.ceil(((Math.ceil((maxY - startY) / spacing) * spacing + startY + spacing / 2) * dpr)));
      return { left, top, right, bottom };
    }

    function buildGrid() {
      const bounds = field!.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      if (!width || !height) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      stillCanvas.width = canvas!.width;
      stillCanvas.height = canvas!.height;
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      previousDirty = null;

      spacing = clamp(width / 160, 7, 8);
      const nextDots: Dot[] = [];
      const columns = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);
      startX = (width - columns * spacing) / 2;
      startY = (height - rows * spacing) / 2;

      for (let row = 0; row <= rows; row++) {
        for (let column = 0; column <= columns; column++) {
          const x = startX + column * spacing;
          const y = startY + row * spacing;
          const nx = x / width;
          const ny = y / height;
          const warmLeft = glow(nx, ny, 0.21, 1.02, 0.56, 0.49);
          const warmRight = glow(nx, ny, 1.03, -0.08, 0.38, 0.36);
          const whiteTop = glow(nx, ny, 0.68, -0.04, 0.42, 0.46);
          const whiteLeft = glow(nx, ny, -0.08, 0.62, 0.52, 0.42);
          const whiteRight = glow(nx, ny, 1.19, 0.82, 0.45, 0.43);
          const blueRight = glow(nx, ny, 1.05, 0.45, 0.3, 0.28);
          const blueTop = glow(nx, ny, 0.7, 0.14, 0.28, 0.22);
          const blueLowerLeft = glow(nx, ny, -0.15, 1.11, 0.48, 0.33);
          const centerWidth = nx < 0.58 ? 0.64 : 0.48;
          const opening = width < 700
            ? smoothstep(0.34, 0.91, Math.hypot((nx - 0.5) / 0.85, (ny - 0.49) / 0.56))
            : smoothstep(
                0.3,
                1.08,
                Math.hypot((nx - 0.58) / centerWidth, (ny - 0.55) / 0.6),
              ) *
              (1 - 0.96 * glow(nx, ny, 0.72, 1.03, 0.5, 0.45)) *
              (1 - 0.83 * glow(nx, ny, 0.16, 0.16, 0.3, 0.29));
          const brightness = clamp(
            (
              0.06 + warmLeft * 0.95 + warmRight * 0.75 + whiteTop * 0.8 +
              whiteLeft * 0.9 + whiteRight * 0.8 + blueRight * 0.9 +
              blueTop * 0.35 + blueLowerLeft * 0.35
            ) * opening,
            0,
            1,
          );
          if (brightness < 0.035) continue;

          const blueWeight = blueRight * 2 + blueTop * 1.2 + blueLowerLeft * 0.45;
          const creamWeight = warmLeft * 1.3 + warmRight * 1.2;
          const whiteWeight = whiteTop + whiteLeft + whiteRight + 0.16;
          const blueMix = smoothstep(0.22, 0.77, blueWeight / (blueWeight + creamWeight + whiteWeight));
          const creamMix = (creamWeight / (creamWeight + whiteWeight)) * (1 - blueMix);
          const red = Math.round(248 + creamMix * 7 - blueMix * 158);
          const green = Math.round(249 - creamMix * 9 - blueMix * 68);
          const blue = Math.round(255 - creamMix * 50 - blueMix * 14);
          const alpha = clamp(0.08 + brightness * 0.91, 0, 1);

          nextDots.push({
            x,
            y,
            size: 0.6 + brightness * 5.6,
            color: `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`,
            offsetX: 0,
            offsetY: 0,
            velocityX: 0,
            velocityY: 0,
          });
        }
      }

      dots = nextDots;
      stillContext!.setTransform(dpr, 0, 0, dpr, 0, 0);
      stillContext!.fillStyle = "#000";
      stillContext!.fillRect(0, 0, width, height);
      for (const dot of dots) drawDot(stillContext!, dot, false);
      context!.setTransform(1, 0, 0, 1, 0, 0);
      context!.drawImage(stillCanvas, 0, 0);
      if (pointer.active) schedule();
    }

    function animate(time: number) {
      frame = 0;
      if (document.hidden || reducedMotion.matches) return;

      const step = Math.min((time - (lastTime || time)) / 16.67, 2);
      lastTime = time;
      const radius = 75;
      let needsFrame = false;
      let hasDisplacedDots = false;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const dot of dots) {
        let targetX = 0;
        let targetY = 0;
        if (pointer.active) {
          const dx = dot.x - pointer.x;
          const dy = dot.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < radius && distance > 0.01) {
            const force = (1 - distance / radius) ** 2 * 33.5;
            targetX = (dx / distance) * force;
            targetY = (dy / distance) * force;
          }
        }

        dot.velocityX = (dot.velocityX + (targetX - dot.offsetX) * 0.12 * step) * 0.74 ** step;
        dot.velocityY = (dot.velocityY + (targetY - dot.offsetY) * 0.12 * step) * 0.74 ** step;
        dot.offsetX += dot.velocityX * step;
        dot.offsetY += dot.velocityY * step;
        const speed = Math.abs(dot.velocityX) + Math.abs(dot.velocityY);
        if (Math.abs(targetX - dot.offsetX) + Math.abs(targetY - dot.offsetY) + speed > 0.12) needsFrame = true;
        if (Math.abs(dot.offsetX) + Math.abs(dot.offsetY) + speed + Math.abs(targetX) + Math.abs(targetY) > 0.12) {
          hasDisplacedDots = true;
          const halfSize = dot.size / 2;
          minX = Math.min(minX, dot.x - halfSize, dot.x + dot.offsetX - halfSize);
          minY = Math.min(minY, dot.y - halfSize, dot.y + dot.offsetY - halfSize);
          maxX = Math.max(maxX, dot.x + halfSize, dot.x + dot.offsetX + halfSize);
          maxY = Math.max(maxY, dot.y + halfSize, dot.y + dot.offsetY + halfSize);
        }
      }

      if (previousDirty) restore(previousDirty);
      previousDirty = hasDisplacedDots ? dirtyRect(minX, minY, maxX, maxY) : null;
      if (previousDirty) drawMoving(previousDirty);
      if (needsFrame) frame = requestAnimationFrame(animate);
      else lastTime = 0;
    }

    function schedule() {
      if (!frame && !reducedMotion.matches && !document.hidden) {
        lastTime = 0;
        frame = requestAnimationFrame(animate);
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      const bounds = field!.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = pointer.x >= 0 && pointer.x <= width && pointer.y >= 0 && pointer.y <= height;
      schedule();
    }

    function onPointerLeave() {
      pointer.active = false;
      schedule();
    }

    function onVisibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        pointer.active = false;
      } else {
        schedule();
      }
    }

    const observer = new ResizeObserver(buildGrid);
    observer.observe(field);
    buildGrid();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onPointerLeave);
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div className="figma-particle-field" ref={fieldRef} aria-hidden="true">
      <canvas className="figma-particle-canvas" ref={canvasRef} />
    </div>
  );
}
