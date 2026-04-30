"use client";

import React from "react";

interface WoodenFrameProps {
  children: React.ReactNode;
  innerPadding?: number;
}

export default function WoodenFrame({ children, innerPadding = 24 }: WoodenFrameProps) {
  return (
    <div
      style={{
        background: "linear-gradient(145deg, #8B6914 0%, #A0782C 20%, #6B4E0A 50%, #8B6914 80%, #A0782C 100%)",
        borderRadius: 12,
        padding: 6,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
        position: "relative",
      }}
    >
      {/* Inner border groove */}
      <div
        style={{
          border: "2px solid rgba(0,0,0,0.3)",
          borderRadius: 8,
          padding: innerPadding,
          background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.08) 100%)",
          position: "relative",
        }}
      >
        {/* Wood grain texture overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 6,
            opacity: 0.06,
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 8px,
              rgba(0,0,0,0.3) 8px,
              rgba(0,0,0,0.3) 9px
            )`,
            pointerEvents: "none",
          }}
        />
        {children}
      </div>
    </div>
  );
}

interface WoodenSignProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function WoodenSign({ children, style }: WoodenSignProps) {
  return (
    <div
      style={{
        display: "inline-block",
        position: "relative",
        ...style,
      }}
    >
      {/* Rope left */}
      <div
        style={{
          position: "absolute",
          top: -8,
          left: 12,
          width: 2,
          height: 10,
          background: "#5C4A1E",
          borderRadius: 1,
        }}
      />
      {/* Rope right */}
      <div
        style={{
          position: "absolute",
          top: -8,
          right: 12,
          width: 2,
          height: 10,
          background: "#5C4A1E",
          borderRadius: 1,
        }}
      />
      {/* Sign body */}
      <div
        style={{
          background: "linear-gradient(180deg, #A0782C 0%, #8B6914 50%, #6B4E0A 100%)",
          borderRadius: 6,
          padding: "6px 14px",
          boxShadow: "0 3px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          border: "1px solid rgba(0,0,0,0.2)",
          fontSize: "0.65rem",
          fontFamily: '"Press Start 2P", monospace',
          color: "#FFF8E7",
          textShadow: "1px 1px 0 rgba(0,0,0,0.4)",
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
