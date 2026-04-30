"use client";

import React, { useRef, useEffect, useState } from "react";

// ── PixelSpectrogram ──────────────────────────────────────────────────────────

interface PixelSpectrogramProps {
  f0Mean: number;
  f0Sd: number;
  durationMs: number;
  color?: string;
  bg?: string;
  grid?: boolean | string;
}

export function PixelSpectrogram({
  f0Mean,
  f0Sd,
  durationMs,
  color = "#1F4C9C",
  bg = "#F1F4F8",
  grid = true,
}: PixelSpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    if (grid) {
      ctx.strokeStyle = typeof grid === "string" ? grid : "#DCE2EC";
      ctx.lineWidth = 0.5;
      for (let y = 0; y < H; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (let x = 0; x < W; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
    }

    // F0 line with gaussian noise
    const numPoints = Math.max(50, Math.round(durationMs / 20));
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Gaussian random using Box-Muller
    function gaussRandom(): number {
      const u1 = Math.random();
      const u2 = Math.random();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * W;
      const noise = gaussRandom() * f0Sd;
      const f0 = f0Mean + noise;
      // Map f0 to canvas Y (higher freq = higher on canvas)
      const minF = f0Mean - f0Sd * 4;
      const maxF = f0Mean + f0Sd * 4;
      const y = H - ((f0 - minF) / (maxF - minF)) * H;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#6B7689";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillText(`F0: ${f0Mean.toFixed(0)} Hz`, 4, 12);
    ctx.fillText(`SD: ${f0Sd.toFixed(1)} Hz`, 4, 24);
    ctx.fillText(`${(durationMs / 1000).toFixed(1)}s`, W - 30, H - 4);
  }, [f0Mean, f0Sd, durationMs, color, bg, grid]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={80}
      style={{ borderRadius: 6, border: "1px solid #DCE2EC", display: "block", width: "100%", height: "auto" }}
    />
  );
}

// ── WeeklyAdherence ───────────────────────────────────────────────────────────

export function WeeklyAdherence() {
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayIdx = today === 0 ? 6 : today - 1; // Convert to 0=Mon

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {days.map((day, i) => {
        let bg = "#DCE2EC"; // future
        let textColor = "#6B7689";
        if (i < todayIdx) {
          bg = "#1F7A4D"; // past (completed)
          textColor = "#FFF";
        } else if (i === todayIdx) {
          bg = "#1F4C9C"; // today
          textColor = "#FFF";
        }
        return (
          <div
            key={day}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.6rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              color: textColor,
            }}
          >
            {day}
          </div>
        );
      })}
    </div>
  );
}

// ── WaxSeal ───────────────────────────────────────────────────────────────────

interface WaxSealProps {
  doctorName?: string;
  date?: string;
  size?: number;
}

export function WaxSeal({ doctorName = "Dr. García", date, size = 64 }: WaxSealProps) {
  const displayDate = date || new Date().toISOString().slice(0, 10);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64">
        {/* Outer seal */}
        <circle cx="32" cy="32" r="30" fill="#8B1A1A" />
        <circle cx="32" cy="32" r="28" fill="#A52A2A" />
        <circle cx="32" cy="32" r="24" fill="none" stroke="#6B1010" strokeWidth="1" strokeDasharray="3 2" />
        {/* Inner circle */}
        <circle cx="32" cy="32" r="18" fill="#7A1515" />
        {/* Cross */}
        <rect x="30" y="22" width="4" height="20" fill="#C0A080" rx="1" />
        <rect x="22" y="30" width="20" height="4" fill="#C0A080" rx="1" />
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: -4,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "0.35rem",
          fontFamily: "'Source Serif 4', serif",
          color: "#6B7689",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {doctorName}
        <br />
        {displayDate}
      </div>
    </div>
  );
}

// ── PixelToast ────────────────────────────────────────────────────────────────

interface PixelToastProps {
  title: string;
  message: string;
  doctor?: string;
  delayMs?: number;
  durationMs?: number;
}

export function PixelToast({
  title,
  message,
  doctor = "Dr. García",
  delayMs = 2000,
  durationMs = 4000,
}: PixelToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delayMs);
    const hideTimer = setTimeout(() => setVisible(false), delayMs + durationMs);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [delayMs, durationMs]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 10000,
        background: "#FFF",
        border: "1px solid #DCE2EC",
        borderRadius: 10,
        padding: "12px 16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        maxWidth: 280,
        animation: "slideInRight 0.3s ease-out",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          color: "#0B1220",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "0.6rem",
          fontFamily: "'Inter', sans-serif",
          color: "#6B7689",
          lineHeight: 1.4,
        }}
      >
        {message}
      </div>
      <div
        style={{
          fontSize: "0.5rem",
          fontFamily: "'Source Serif 4', serif",
          color: "#1F4C9C",
          marginTop: 6,
          fontStyle: "italic",
        }}
      >
        — {doctor}
      </div>
    </div>
  );
}
