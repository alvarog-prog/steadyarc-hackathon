"use client";

import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  color2?: string;
}

export function PixelFish({ size = 16, color = "#1F4C9C", color2 = "#4A90D9" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="4" y="6" width="2" height="2" fill={color} />
      <rect x="6" y="4" width="2" height="2" fill={color} />
      <rect x="6" y="8" width="2" height="2" fill={color} />
      <rect x="8" y="3" width="2" height="2" fill={color2} />
      <rect x="8" y="5" width="4" height="4" fill={color} />
      <rect x="8" y="9" width="2" height="2" fill={color2} />
      <rect x="12" y="5" width="2" height="4" fill={color2} />
      <rect x="10" y="6" width="1" height="1" fill="#FFF" />
    </svg>
  );
}

export function PixelHook({ size = 16, color = "#1F4C9C" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="7" y="1" width="2" height="6" fill={color} />
      <rect x="7" y="7" width="2" height="2" fill={color} />
      <rect x="5" y="9" width="2" height="2" fill={color} />
      <rect x="5" y="11" width="2" height="2" fill={color} />
      <rect x="7" y="12" width="2" height="2" fill={color} />
      <rect x="9" y="10" width="2" height="2" fill={color} />
    </svg>
  );
}

export function PixelCross({ size = 16, color = "#DC2626", color2 = "#FFF" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" fill={color2} />
      <rect x="7" y="4" width="2" height="8" fill={color} />
      <rect x="4" y="7" width="8" height="2" fill={color} />
    </svg>
  );
}

export function PixelInfo({ size = 16, color = "#1F4C9C" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" fill="none" />
      <rect x="7" y="4" width="2" height="2" fill={color} />
      <rect x="7" y="7" width="2" height="5" fill={color} />
    </svg>
  );
}

export function PixelPlay({ size = 16, color = "#1F7A4D" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M5 3 L13 8 L5 13 Z" fill={color} />
    </svg>
  );
}

export function PixelHand({ size = 16, color = "#1F4C9C" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="7" y="1" width="2" height="6" fill={color} />
      <rect x="5" y="2" width="2" height="5" fill={color} />
      <rect x="9" y="2" width="2" height="5" fill={color} />
      <rect x="11" y="3" width="2" height="4" fill={color} />
      <rect x="3" y="5" width="2" height="4" fill={color} />
      <rect x="4" y="7" width="8" height="4" fill={color} />
      <rect x="5" y="11" width="6" height="3" fill={color} />
    </svg>
  );
}

export function PixelFace({ size = 16, color = "#1F4C9C" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" fill="none" />
      <rect x="5" y="6" width="2" height="2" fill={color} />
      <rect x="9" y="6" width="2" height="2" fill={color} />
      <path d="M5 10 Q8 13 11 10" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function PixelVoice({ size = 16, color = "#1F4C9C" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="6" y="2" width="4" height="7" rx="2" fill={color} />
      <path d="M4 8 Q4 12 8 12 Q12 12 12 8" stroke={color} strokeWidth="1.5" fill="none" />
      <rect x="7" y="12" width="2" height="2" fill={color} />
      <rect x="5" y="14" width="6" height="1" fill={color} />
    </svg>
  );
}

export function PixelWave({ size = 16, color = "#1F4C9C" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M1 8 Q3 4 5 8 Q7 12 9 8 Q11 4 13 8 Q15 12 16 8" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}
