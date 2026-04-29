"use client";

import React, { useRef, useState, useCallback } from "react";
import { useGestureRecognition } from "@/lib/cv/useGestureRecognition";
import { AnatomicalDashboard, type ClinicalData, type AnchorMap } from "./AnatomicalDashboard";

// --- Constants ---
const VIDEO_WIDTH = 960;
const VIDEO_HEIGHT = 540;
const THROTTLE_MS = 40;
const POS_BUFFER_SIZE = 60;
const TREMOR_BUFFER_SIZE = 30;
const PX_TO_MM_BASE = 80;

interface ClinicalViewProps {
  onBack: () => void;
}

export default function ClinicalView({ onBack }: ClinicalViewProps) {
  const videoElement = useRef<HTMLVideoElement>(null);
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const lastUpdateTime = useRef<number>(0);
  const posBuffer = useRef<{ x: number; y: number; t: number }[]>([]);
  const maxSpanObserved = useRef<number>(1);
  const baselineSmileVertical = useRef<number>(0);

  const [metrics, setMetrics] = useState<ClinicalData>({
    cri: 0,
    pinchActive: false,
    pinchMm: 0,
    handOpenPct: 0,
    fingers: 0,
    palmSpeed: 0,
    smoothness: 1.0,
    romDeg: 0,
    tremorAmp: 0.1,
    faceSymmetry: 1.0,
    smiling: false,
  });

  const [anchors, setAnchors] = useState<AnchorMap>({});

  const onResultsCallback = useCallback((res: any) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < THROTTLE_MS) return;
    lastUpdateTime.current = now;

    const lm = res.multiHandLandmarks?.[0];
    const flm = res.latestFaceResults?.multiFaceLandmarks?.[0];

    const gDist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
      Math.sqrt(
        Math.pow((p1.x - p2.x) * VIDEO_WIDTH, 2) + Math.pow((p1.y - p2.y) * VIDEO_HEIGHT, 2)
      );

    // Using functional state update to prevent stale closures and ESLint warnings
    setMetrics((prev) => {
      const next: ClinicalData = {
        cri: 0,
        pinchActive: false,
        pinchMm: 0,
        handOpenPct: 0,
        fingers: 0,
        palmSpeed: 0,
        smoothness: 1.0,
        romDeg: 0,
        tremorAmp: prev.tremorAmp,
        faceSymmetry: prev.faceSymmetry,
        smiling: prev.smiling,
      };

      // ── Hand Metrics ─────────────────────────────────────────────
      if (lm) {
        const hSize = gDist(lm[0], lm[9]);
        const palmScale = gDist(lm[5], lm[17]);
        const pxToMm = PX_TO_MM_BASE / (palmScale + 0.001);

        const dPinchPx = gDist(lm[4], lm[8]);
        next.pinchMm = Math.round(dPinchPx * pxToMm);
        next.pinchActive = dPinchPx / hSize < 0.15;

        const tips = [4, 8, 12, 16, 20];
        const avgDistTips = tips.reduce((s, idx) => s + gDist(lm[idx], lm[9]), 0) / tips.length;
        maxSpanObserved.current = Math.max(maxSpanObserved.current, avgDistTips);
        next.handOpenPct = Math.round((avgDistTips / maxSpanObserved.current) * 100);

        let extended = 0;
        [8, 12, 16, 20].forEach((tip, i) => {
          const joint = [6, 10, 14, 18][i];
          if (gDist(lm[tip], lm[0]) > gDist(lm[joint], lm[0])) extended++;
        });
        if (gDist(lm[4], lm[17]) > gDist(lm[3], lm[17])) extended++;
        next.fingers = extended;

        posBuffer.current.push({ x: lm[0].x, y: lm[0].y, t: now });
        if (posBuffer.current.length > POS_BUFFER_SIZE) posBuffer.current.shift();

        if (posBuffer.current.length > 2) {
          const p1 = posBuffer.current[posBuffer.current.length - 1];
          const p2 = posBuffer.current[posBuffer.current.length - 2];
          const dt = (p1.t - p2.t) / 1000;
          next.palmSpeed = Math.round((gDist(p1, p2) * pxToMm) / (dt + 0.001));

          // Smoothness: 1.0 = fluid, 0 = highly fragmented
          let inversions = 0;
          for (let i = 2; i < posBuffer.current.length; i++) {
            const v1 = posBuffer.current[i - 1].y - posBuffer.current[i - 2].y;
            const v2 = posBuffer.current[i].y - posBuffer.current[i - 1].y;
            if (v1 * v2 < 0) inversions++;
          }
          next.smoothness = Math.max(0, 1 - inversions / TREMOR_BUFFER_SIZE);
        }

        const v1 = { x: lm[0].x - lm[9].x, y: lm[0].y - lm[9].y };
        const v2 = { x: lm[5].x - lm[0].x, y: lm[5].y - lm[0].y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const m1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
        const m2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
        next.romDeg = Math.round(
          (Math.acos(Math.min(1, Math.max(-1, dot / (m1 * m2 + 0.001)))) * 180) / Math.PI
        );

        // Tremor Amplitude — normalized stdX [0,1]: 0.002→low, 0.005→high
        if (next.palmSpeed < 20 && posBuffer.current.length >= TREMOR_BUFFER_SIZE) {
          const recentPos = posBuffer.current.slice(-TREMOR_BUFFER_SIZE);
          const meanX = recentPos.reduce((a, b) => a + b.x, 0) / TREMOR_BUFFER_SIZE;
          const stdX = Math.sqrt(
            recentPos.reduce((a, b) => a + Math.pow(b.x - meanX, 2), 0) / TREMOR_BUFFER_SIZE
          );
          next.tremorAmp = Math.min(1, stdX * 100);
        } else {
          next.tremorAmp = prev.tremorAmp;
        }
      }

      // ── Facial Metrics ────────────────────────────────────────────
      if (flm) {
        const midX = (flm[234].x + flm[454].x) / 2;
        const midY = (flm[234].y + flm[454].y) / 2;
        const dL = Math.sqrt((flm[61].x - midX) ** 2 + (flm[61].y - midY) ** 2);
        const dR = Math.sqrt((flm[291].x - midX) ** 2 + (flm[291].y - midY) ** 2);
        next.faceSymmetry = Math.min(dL, dR) / (Math.max(dL, dR) + 0.001);

        const smileV = gDist(flm[13], flm[14]);
        if (baselineSmileVertical.current === 0) baselineSmileVertical.current = smileV;
        next.smiling = smileV > baselineSmileVertical.current * 1.2;
      }

      // ── CRI Calculation ────────────────────────────────────────────
      next.cri =
        next.handOpenPct * 0.3 +
        (next.fingers / 5) * 100 * 0.2 +
        (next.romDeg / 180) * 100 * 0.2 +
        next.faceSymmetry * 100 * 0.3;

      return next;
    });

    // ── Anchors Update ─────────────────────────────────────────────
    const newAnchors: AnchorMap = {};
    if (lm) {
      newAnchors.M1 = { x: 1 - (lm[4].x + lm[8].x) / 2, y: (lm[4].y + lm[8].y) / 2 };
      newAnchors.M2 = { x: 1 - lm[9].x, y: lm[9].y };
      newAnchors.M3 = { x: 1 - lm[0].x, y: lm[0].y };
    }
    if (flm) {
      newAnchors.F1 = { x: 1 - flm[234].x, y: flm[234].y };
      newAnchors.F2 = { x: 1 - flm[454].x, y: flm[454].y };
      newAnchors.F3 = { x: 1 - (flm[61].x + flm[291].x) / 2, y: (flm[61].y + flm[291].y) / 2 };
    }

    setAnchors(newAnchors);
  }, []);

  const { maxVideoWidth, maxVideoHeight } = useGestureRecognition({
    videoElement,
    canvasEl,
    onResultsCallback,
  });

  return (
    <div
      role="main"
      aria-label="Clinical Analysis Dashboard"
      style={{
        position: "fixed",
        inset: 0,
        background: "#F2E8D5",
        overflowY: "auto",
        zIndex: 100,
      }}
    >
      {/* Hidden Video Source for MediaPipe */}
      <video
        ref={videoElement}
        style={{ display: "none" }}
        playsInline
        muted
        aria-hidden="true"
      />

      <AnatomicalDashboard
        data={metrics}
        anchors={anchors}
        cameraSlot={
          <canvas
            ref={canvasEl}
            width={maxVideoWidth}
            height={maxVideoHeight}
            style={{ transform: "scaleX(-1)" }}
            aria-label="Patient tracking camera view"
            role="img"
          />
        }
      />

      {/* Back Navigation Button */}
      <button
        onClick={onBack}
        aria-label="Return to Game Mode"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
          background: "rgba(10,20,40,0.92)",
          border: "2px solid #00ff88",
          color: "#00ff88",
          padding: "8px 18px",
          borderRadius: "6px",
          fontSize: "0.6rem",
          cursor: "pointer",
          fontFamily: '"Press Start 2P", monospace',
          letterSpacing: "0.05em",
          boxShadow: "0 0 12px rgba(0,255,136,0.2)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 0 16px rgba(0,255,136,0.4)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 0 12px rgba(0,255,136,0.2)";
        }}
        onFocus={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 0 16px rgba(0,255,136,0.4)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 0 12px rgba(0,255,136,0.2)";
        }}
      >
        ▶ GAME MODE
      </button>
    </div>
  );
}
