"use client";

import React, { useRef, useEffect } from "react";
import type { LandmarkPoint } from "@/lib/input/useHandTracking";

const MINI_W = 280;
const MINI_H = 158;

// ── Hand connections ──────────────────────────────────────────────────
const HAND_PALM   = [[0,1],[0,5],[0,17],[5,9],[9,13],[13,17]];
const HAND_THUMB  = [[1,2],[2,3],[3,4]];
const HAND_INDEX  = [[5,6],[6,7],[7,8]];
const HAND_MIDDLE = [[9,10],[10,11],[11,12]];
const HAND_RING   = [[13,14],[14,15],[15,16]];
const HAND_PINKY  = [[17,18],[18,19],[19,20]];
const ALL_HAND_LINKS = [...HAND_PALM,...HAND_THUMB,...HAND_INDEX,...HAND_MIDDLE,...HAND_RING,...HAND_PINKY];

// ── Face landmark groups ──────────────────────────────────────────────
const FACE_OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109,10];
const EYE_LEFT  = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246,33];
const EYE_RIGHT = [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398,362];
const MOUTH_UPPER = [61,185,40,39,37,0,267,269,270,409,291];
const MOUTH_LOWER = [61,146,91,181,84,17,314,405,321,375,291];

interface ClinicalMiniPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  handLandmarksRef: React.MutableRefObject<LandmarkPoint[] | null>;
  faceLandmarksRef: React.MutableRefObject<LandmarkPoint[] | null>;
}

/**
 * Mini camera preview (bottom-left during gameplay) showing the webcam feed
 * with hand and face landmarks — same as clinical view but miniaturized.
 * 
 * Does NOT open its own camera. Uses the same videoRef and landmark data
 * that useHandTracking already produces for the game.
 */
export default function ClinicalMiniPreview({ videoRef, handLandmarksRef, faceLandmarksRef }: ClinicalMiniPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    const render = () => {
      if (!isMounted) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(render); return; }

      ctx.clearRect(0, 0, MINI_W, MINI_H);

      // Draw video frame (mirrored for selfie effect)
      ctx.save();
      ctx.translate(MINI_W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, MINI_W, MINI_H);
      ctx.restore();

      // Slight dark overlay for contrast with landmarks
      ctx.fillStyle = "rgba(0, 10, 20, 0.1)";
      ctx.fillRect(0, 0, MINI_W, MINI_H);

      // Draw hand landmarks (mirrored — same as clinical view)
      const handLm = handLandmarksRef.current;
      if (handLm && handLm.length >= 21) {
        // Draw connections
        ALL_HAND_LINKS.forEach(([a, b]) => {
          const p1 = handLm[a], p2 = handLm[b];
          const x1 = (1 - p1.x) * MINI_W, y1 = p1.y * MINI_H;
          const x2 = (1 - p2.x) * MINI_W, y2 = p2.y * MINI_H;
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, "#00D4FF");
          grad.addColorStop(1, "#7C3AED");
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = grad;
          ctx.globalAlpha = 0.85;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        });
        // Draw joints
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#00D4FF";
        handLm.forEach((lm) => {
          ctx.beginPath();
          ctx.arc((1 - lm.x) * MINI_W, lm.y * MINI_H, 2.5, 0, 2 * Math.PI);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      }

      // Draw face landmarks (mirrored)
      const faceLm = faceLandmarksRef.current;
      if (faceLm && faceLm.length >= 468) {
        const drawLine = (pts: number[], color: string, width: number) => {
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          pts.forEach((idx, i) => {
            const p = faceLm[idx];
            if (!p) return;
            const px = (1 - p.x) * MINI_W;
            const py = p.y * MINI_H;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
        };

        drawLine(FACE_OVAL, "rgba(255,255,255,0.6)", 1);
        drawLine(EYE_LEFT, "#FF4444", 1.5);
        drawLine(EYE_RIGHT, "#22C55E", 1.5);
        drawLine(MOUTH_UPPER, "rgba(255,255,255,0.8)", 1);
        drawLine(MOUTH_LOWER, "rgba(255,255,255,0.8)", 1);

        // Mouth corner dots
        [[61, "#FF4444"], [291, "#22C55E"]].forEach(([idx, color]) => {
          const p = faceLm[idx as number];
          if (!p) return;
          ctx.beginPath();
          ctx.arc((1 - p.x) * MINI_W, p.y * MINI_H, 3, 0, 2 * Math.PI);
          ctx.fillStyle = color as string;
          ctx.shadowBlur = 4;
          ctx.shadowColor = color as string;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // Scanline effect (subtle CRT look)
      ctx.fillStyle = "rgba(0, 255, 200, 0.015)";
      for (let y = 0; y < MINI_H; y += 3) {
        ctx.fillRect(0, y, MINI_W, 1);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef, handLandmarksRef, faceLandmarksRef]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        zIndex: 9998,
        borderRadius: "6px",
        overflow: "hidden",
        border: "2px solid rgba(0, 212, 255, 0.7)",
        boxShadow: "0 0 16px rgba(0, 212, 255, 0.4), inset 0 0 30px rgba(0,0,0,0.4)",
        background: "#0a1428",
      }}
    >
      <canvas
        ref={canvasRef}
        width={MINI_W}
        height={MINI_H}
        style={{ display: "block", width: `${MINI_W}px`, height: `${MINI_H}px` }}
      />
      {/* Label overlay */}
      <div
        style={{
          position: "absolute",
          top: "4px",
          left: "6px",
          fontSize: "0.35rem",
          fontFamily: '"Press Start 2P", monospace',
          color: "#00D4FF",
          textShadow: "1px 1px 2px #000",
          opacity: 0.9,
          pointerEvents: "none",
          letterSpacing: "0.05em",
        }}
      >
        ● CLINICAL CAM
      </div>
      {/* Bottom status */}
      <div
        style={{
          position: "absolute",
          bottom: "3px",
          left: "6px",
          fontSize: "0.3rem",
          fontFamily: '"Press Start 2P", monospace',
          color: "#00ff88",
          textShadow: "1px 1px 2px #000",
          opacity: 0.7,
          pointerEvents: "none",
        }}
      >
        TRACKING OK
      </div>
    </div>
  );
}
