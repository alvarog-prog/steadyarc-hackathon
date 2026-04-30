"use client";

import { CSSProperties, useMemo } from "react";
import WoodenFrame, { WoodenSign } from "./WoodenFrame";
import {
  PixelFish,
  PixelHook,
  PixelCross,
  PixelInfo,
  PixelPlay,
  PixelHand,
  PixelFace,
  PixelVoice,
  PixelWave,
} from "./PixelIcons";
import {
  PixelSpectrogram,
  WeeklyAdherence,
  WaxSeal,
  PixelToast,
} from "./SessionExtras";

export interface SessionMetrics {
  challenges: {
    type: "SMILE_CHALLENGE" | "HOLD_HAND_OPEN" | "REPEATED_PINCH" | "VOCAL";
    completionMs: number;
    succeeded: boolean;
  }[];
  vocalStability: number;
  vocalDurationMs: number;
  vocalPauseCount: number;
  vocalMeanAmplitude: number;
  vocalJitter?: number;
  vocalShimmer?: number;
  vocalHNR?: number;
  vocalF0Mean?: number;
  vocalF0Sd?: number;
  motorPinchScore: number;
  motorOpenScore: number;
  facialSmileScore: number;
  vocalScore: number;
  cri: number;
  motorHeatmap?: number[][];
}

interface Props {
  score: number;
  metrics: SessionMetrics;
  onReplay: () => void;
  patientId?: string;
  sessionId?: string;
}

const C = {
  bg: "#F1F4F8",
  surface: "#FFFFFF",
  surfaceAlt: "#F7F9FC",
  paper: "#FBFCFD",
  border: "#DCE2EC",
  borderSoft: "#E8ECF3",
  ink: "#0B1220",
  inkMid: "#3F4A5E",
  inkSoft: "#6B7689",
  inkFaint: "#98A2B3",
  rule: "#C9D2DF",
  brand: "#1F4C9C",
  brandSoft: "#EAF0FA",
  good: "#1F7A4D",
  goodSoft: "#E8F3EC",
  mid: "#B26A00",
  midSoft: "#FBF1DE",
  bad: "#A8261C",
  badSoft: "#F7E5E2",
  na: "#8A95A8",
  naSoft: "#EEF1F6",
  heatLow: "#EAF0FA",
  heatHigh: "#1F4C9C",
};

const SANS: CSSProperties = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};
const SERIF: CSSProperties = {
  fontFamily: '"Source Serif 4", "Source Serif Pro", "Charter", Georgia, "Times New Roman", serif',
};
const MONO: CSSProperties = {
  fontFamily: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace',
  fontVariantNumeric: "tabular-nums",
};

const isNA = (v: number | undefined | null) =>
  v === undefined || v === null || (typeof v === "number" && v < 0);

function levelOf(score: number): "good" | "mid" | "bad" | "na" {
  if (isNA(score)) return "na";
  if (score >= 70) return "good";
  if (score >= 45) return "mid";
  return "bad";
}

const colorOf = (s: number) =>
  ({ good: C.good, mid: C.mid, bad: C.bad, na: C.na }[levelOf(s)]);
const softOf = (s: number) =>
  ({ good: C.goodSoft, mid: C.midSoft, bad: C.badSoft, na: C.naSoft }[levelOf(s)]);

function criLevel(cri: number) {
  if (isNA(cri)) return { label: "No data", color: C.na, soft: C.naSoft };
  if (cri >= 75) return { label: "Functionally preserved", color: C.good, soft: C.goodSoft };
  if (cri >= 50) return { label: "Moderate impairment", color: C.mid, soft: C.midSoft };
  return { label: "Severe impairment", color: C.bad, soft: C.badSoft };
}

const fmtMs = (ms: number) => ms < 1000 ? `${Math.round(ms)}` : `${(ms / 1000).toFixed(2)}`;
const fmtMsUnit = (ms: number) => (ms < 1000 ? "ms" : "s");
const fmtPct = (v: number, d = 0) => `${(v * 100).toFixed(d)}`;

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const CHALLENGE_LABEL: Record<SessionMetrics["challenges"][0]["type"], string> = {
  SMILE_CHALLENGE: "Facial activation (smile)",
  HOLD_HAND_OPEN: "Sustained hand opening",
  REPEATED_PINCH: "Repeated thumb–index pinch",
  VOCAL: "Sustained /a/ phonation",
};

export default function SessionResultsDashboard({
  score,
  metrics,
  onReplay,
  patientId = "P-0001",
  sessionId = "S-2026-04-29-001",
}: Props) {
  const fishCount = Math.floor(score / 100);

  const challengeSummary = useMemo(() => {
    const groups: Record<string, { count: number; totalMs: number; ok: number }> = {};
    metrics.challenges.forEach((c) => {
      if (!groups[c.type]) groups[c.type] = { count: 0, totalMs: 0, ok: 0 };
      groups[c.type].count += 1;
      groups[c.type].totalMs += c.completionMs;
      if (c.succeeded) groups[c.type].ok += 1;
    });
    return Object.entries(groups).map(([type, g]) => ({
      type: type as SessionMetrics["challenges"][0]["type"],
      count: g.count,
      avgMs: g.totalMs / g.count,
      successRate: g.ok / g.count,
    }));
  }, [metrics.challenges]);

  const totalChallenges = metrics.challenges.length;
  const avgTimeMs = totalChallenges > 0
    ? metrics.challenges.reduce((s, c) => s + c.completionMs, 0) / totalChallenges
    : 0;

  const pinchAvg = useMemo(() => {
    const a = metrics.challenges.filter((c) => c.type === "REPEATED_PINCH");
    return a.length ? a.reduce((s, c) => s + c.completionMs, 0) / a.length : 0;
  }, [metrics.challenges]);

  const openAvg = useMemo(() => {
    const a = metrics.challenges.filter((c) => c.type === "HOLD_HAND_OPEN");
    return a.length ? a.reduce((s, c) => s + c.completionMs, 0) / a.length : 0;
  }, [metrics.challenges]);

  const smileArr = metrics.challenges.filter((c) => c.type === "SMILE_CHALLENGE");
  const smileAvg = smileArr.length
    ? smileArr.reduce((s, c) => s + c.completionMs, 0) / smileArr.length
    : 0;
  const smileFails = smileArr.filter((c) => !c.succeeded).length;

  const cri = criLevel(metrics.cri);
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const heatmap = useMemo(() => metrics.motorHeatmap ?? synthHeatmap(14, 10), [metrics.motorHeatmap]);
  const reportNo = `SA-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-001`;

  return (
    <main style={{ minHeight: "100vh", width: "100%", background: `radial-gradient(circle at 20% 0%, #EFE7D2 0%, transparent 50%), radial-gradient(circle at 80% 100%, #E5DDC8 0%, transparent 60%), ${C.bg}`, padding: "28px 20px 64px", ...SANS, color: C.ink, position: "fixed", inset: 0, overflowY: "auto", zIndex: 200 }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <WoodenFrame innerPadding={24}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* HEADER */}
            <header style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 22, alignItems: "flex-start", paddingBottom: 18, borderBottom: `2px dashed ${C.border}` }}>
              <div>
                <WoodenSign style={{ marginBottom: 14 }}>
                  <PixelFish size={18} color="#1F4C9C" color2="#3D6BB8" />
                  <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: "#3A2A14", letterSpacing: "0.18em", textTransform: "uppercase" }}>SteadyArc · Clinical fishing log</span>
                </WoodenSign>
                <h1 style={{ ...SERIF, margin: 0, fontSize: 30, fontWeight: 600, color: C.ink, letterSpacing: "-0.015em", lineHeight: 1.1 }}>Session report</h1>
                <div style={{ fontSize: 13.5, color: C.inkMid, marginTop: 8, maxWidth: 560, lineHeight: 1.55 }}>
                  A snapshot of today&apos;s fishing session — how your hand moved, how your face responded, and how your voice sounded — translated into metrics your therapist can read.
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 14, rowGap: 4, fontSize: 12, ...MONO, color: C.inkMid, background: C.paper, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.brand}`, padding: "12px 16px", minWidth: 240, borderRadius: 4 }}>
                <Meta k="Report" v={reportNo} />
                <Meta k="Patient" v={patientId} />
                <Meta k="Session" v={sessionId} />
                <Meta k="Date" v={dateStr} />
                <Meta k="Time" v={timeStr} />
              </div>
            </header>

            {/* §1 EXECUTIVE SUMMARY */}
            <Section number="1" title="Executive summary">
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 14 }}>
                <Card>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <Eyebrow><PixelCross size={11} color={C.brand} color2="#FFFFFF" /><span style={{ marginLeft: 7 }}>1.1 · Global functional health</span></Eyebrow>
                    <Pill color={cri.color} soft={cri.soft}>{cri.label}</Pill>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 16, flexWrap: "wrap" }}>
                    <CRIRing value={metrics.cri} color={cri.color} />
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <p style={{ margin: 0, fontSize: 13.5, color: C.inkMid, lineHeight: 1.65 }}>A global 0–100 score summarising how the hand, face and voice are performing together today.</p>
                      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 14, rowGap: 6, fontSize: 12.5, ...MONO, color: C.inkMid }}>
                        <span style={{ color: C.inkSoft }}>Ref. range</span><span>0 – 100</span>
                        <span style={{ color: C.inkSoft }}>Cutoffs</span><span>≥75 preserved · 50–74 moderate · &lt;50 severe</span>
                        <span style={{ color: C.inkSoft }}>Domains n</span><span>{[metrics.motorPinchScore, metrics.motorOpenScore, metrics.facialSmileScore, metrics.vocalScore].filter((s) => !isNA(s)).length} / 4</span>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card>
                  <Eyebrow><PixelHook size={11} color={C.brand} /><span style={{ marginLeft: 7 }}>1.2 · What you caught today</span></Eyebrow>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                    <Stat label="Challenges completed" value={String(totalChallenges)} unit="n" />
                    <Stat label="Average time / challenge" value={totalChallenges ? fmtMs(avgTimeMs) : "—"} unit={totalChallenges ? fmtMsUnit(avgTimeMs) : ""} />
                    <Stat label="In-game score" value={score.toLocaleString()} unit="pts" />
                    <Stat label="Catches (fish)" value={String(fishCount)} unit="n" />
                  </div>
                </Card>
              </div>
              <div style={{ marginTop: 14 }}>
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <Eyebrow><PixelFish size={11} color={C.brand} color2="#3D6BB8" /><span style={{ marginLeft: 7 }}>1.3 · Consistency this week</span></Eyebrow>
                    <span style={{ ...MONO, fontSize: 11, color: C.inkSoft }}>Week {getWeekNumber(today)} · {today.getFullYear()}</span>
                  </div>
                  <WeeklyAdherence />
                </Card>
              </div>
            </Section>

            {/* §2 FUNCTIONAL DOMAINS */}
            <Section number="2" title="Functional domains" subtitle="0–100 score per domain. Green ≥70 · Amber 45–69 · Red <45.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                <DomainCard code="M1" title="Fine pinch" subtitle="Thumb and index" score={metrics.motorPinchScore} proxy="≈ FMA-UE item H" icon={<PixelHand size={20} color={C.brand} />} />
                <DomainCard code="M2" title="Hand opening" subtitle="Extending the fingers" score={metrics.motorOpenScore} proxy="≈ FMA-UE item F" icon={<PixelHand size={20} color={C.brand} />} />
                <DomainCard code="M6" title="Symmetric smile" subtitle="Facial activation" score={metrics.facialSmileScore} proxy="≈ House-Brackmann" icon={<PixelFace size={20} color={C.brand} />} />
                <DomainCard code="V1" title="Sustained voice" subtitle="Continuous /a/ sound" score={metrics.vocalScore} proxy="Dysarthria proxy" icon={<PixelVoice size={20} color={C.brand} />} />
              </div>
            </Section>

            {/* §3 MOTOR ANALYSIS */}
            <Section number="3" title="Motor analysis" subtitle="Execution times and spatial coverage of the hand.">
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: 14 }}>
                <Card>
                  <Eyebrow><PixelHand size={11} color={C.brand} /><span style={{ marginLeft: 7 }}>3.1 · Where the hand moved</span></Eyebrow>
                  <div style={{ fontSize: 12.5, color: C.inkMid, marginBottom: 12, marginTop: 10 }}>Temporal density of hand presence in the field of view (normalised 0–1).</div>
                  <Heatmap matrix={heatmap} />
                  <HeatmapLegend />
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.borderSoft}`, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, ...MONO, fontSize: 11.5 }}>
                    <MicroStat label="Coverage" value={`${Math.round(coverage(heatmap) * 100)}%`} />
                    <MicroStat label="Centroid x̄" value={centroid(heatmap).x.toFixed(2)} />
                    <MicroStat label="Centroid ȳ" value={centroid(heatmap).y.toFixed(2)} />
                  </div>
                </Card>
                <Card>
                  <Eyebrow>3.2 · Execution times</Eyebrow>
                  <Table>
                    <thead><tr><Th>Task</Th><Th align="right">x̄ (s)</Th><Th align="right">n</Th><Th align="right">Score</Th></tr></thead>
                    <tbody>
                      <Tr><Td><strong style={{ color: C.ink }}>M1</strong> · Pinch</Td><TdMono align="right">{pinchAvg ? (pinchAvg / 1000).toFixed(2) : "—"}</TdMono><TdMono align="right">{metrics.challenges.filter((c) => c.type === "REPEATED_PINCH").length}</TdMono><TdMono align="right" color={colorOf(metrics.motorPinchScore)}>{isNA(metrics.motorPinchScore) ? "N/A" : Math.round(metrics.motorPinchScore)}</TdMono></Tr>
                      <Tr><Td><strong style={{ color: C.ink }}>M2</strong> · Opening</Td><TdMono align="right">{openAvg ? (openAvg / 1000).toFixed(2) : "—"}</TdMono><TdMono align="right">{metrics.challenges.filter((c) => c.type === "HOLD_HAND_OPEN").length}</TdMono><TdMono align="right" color={colorOf(metrics.motorOpenScore)}>{isNA(metrics.motorOpenScore) ? "N/A" : Math.round(metrics.motorOpenScore)}</TdMono></Tr>
                    </tbody>
                  </Table>
                  <Eyebrow style={{ marginTop: 18 }}>3.3 · Facial analysis</Eyebrow>
                  <DetailRow label="Mean smile time (s)" value={smileAvg ? (smileAvg / 1000).toFixed(2) : "N/A"} />
                  <DetailRow label="Failed attempts" value={smileArr.length ? `${smileFails} / ${smileArr.length}` : "N/A"} valueColor={smileFails > 0 ? C.mid : C.good} />
                  <DetailRow label="Symmetry score" value={isNA(metrics.facialSmileScore) ? "N/A" : `${Math.round(metrics.facialSmileScore)} / 100`} valueColor={colorOf(metrics.facialSmileScore)} isLast />
                </Card>
              </div>
            </Section>

            {/* §4 ACOUSTIC BIOMARKERS */}
            <Section number="4" title="Acoustic biomarkers" subtitle="Sustained /a/ phonation analysis from the microphone signal.">
              <Card>
                <Eyebrow><PixelVoice size={11} color={C.brand} /><span style={{ marginLeft: 7 }}>4.1 · F₀ spectrogram during /a/</span></Eyebrow>
                <div style={{ fontSize: 12.5, color: C.inkMid, marginBottom: 12, marginTop: 10 }}>Fundamental frequency trace over time. A stable line indicates phonatory control.</div>
                <PixelSpectrogram f0Mean={metrics.vocalF0Mean ?? 132} f0Sd={metrics.vocalF0Sd ?? 4.2} durationMs={metrics.vocalDurationMs} color={C.brand} bg={C.surfaceAlt} grid={C.borderSoft} />
              </Card>
              <div style={{ height: 12 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
                <BiomarkerCard code="MPT" name="Maximum Phonation Time" value={(metrics.vocalDurationMs / 1000).toFixed(2)} unit="s" refRange="♂ ≥ 18 · ♀ ≥ 15" status={metrics.vocalDurationMs >= 15000 ? "good" : metrics.vocalDurationMs >= 10000 ? "mid" : "bad"} />
                <BiomarkerCard code="STAB" name="Amplitude stability" value={fmtPct(metrics.vocalStability, 1)} unit="%" refRange="≥ 70%" status={metrics.vocalStability >= 0.7 ? "good" : metrics.vocalStability >= 0.45 ? "mid" : "bad"} />
                <BiomarkerCard code="JITTER" name="Jitter (T₀ perturbation)" value={metrics.vocalJitter !== undefined ? metrics.vocalJitter.toFixed(2) : "—"} unit="%" refRange="< 1.04 %" status={metrics.vocalJitter === undefined ? "na" : metrics.vocalJitter < 1.04 ? "good" : metrics.vocalJitter < 2 ? "mid" : "bad"} />
                <BiomarkerCard code="SHIM" name="Shimmer (A perturbation)" value={metrics.vocalShimmer !== undefined ? metrics.vocalShimmer.toFixed(2) : "—"} unit="%" refRange="< 3.81 %" status={metrics.vocalShimmer === undefined ? "na" : metrics.vocalShimmer < 3.81 ? "good" : metrics.vocalShimmer < 6 ? "mid" : "bad"} />
                <BiomarkerCard code="HNR" name="Harmonic-to-Noise Ratio" value={metrics.vocalHNR !== undefined ? metrics.vocalHNR.toFixed(1) : "—"} unit="dB" refRange="≥ 20 dB" status={metrics.vocalHNR === undefined ? "na" : metrics.vocalHNR >= 20 ? "good" : metrics.vocalHNR >= 15 ? "mid" : "bad"} />
                <BiomarkerCard code="F₀" name="Fundamental frequency" value={metrics.vocalF0Mean !== undefined ? metrics.vocalF0Mean.toFixed(0) : "—"} unit="Hz" refRange="♂ 85–180 · ♀ 165–255" status="neutral" extra={metrics.vocalF0Sd !== undefined ? `σ ${metrics.vocalF0Sd.toFixed(1)} Hz` : undefined} />
                <BiomarkerCard code="PAUS" name="Pauses during phonation" value={String(metrics.vocalPauseCount)} unit="n" refRange="≤ 2" status={metrics.vocalPauseCount <= 2 ? "good" : metrics.vocalPauseCount <= 5 ? "mid" : "bad"} />
                <BiomarkerCard code="A" name="Mean amplitude" value={metrics.vocalMeanAmplitude.toFixed(2)} unit="rel." refRange="—" status="neutral" />
              </div>
            </Section>

            {/* §5 ACTIVITY LOG */}
            <Section number="5" title="Activity log" subtitle="Breakdown per task type during the session.">
              <Card padding={0}>
                <Table>
                  <thead><tr><Th>Task</Th><Th align="right">n</Th><Th align="right">x̄ (s)</Th><Th align="right">% success</Th></tr></thead>
                  <tbody>
                    {challengeSummary.length === 0 && (<tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: C.inkSoft, fontSize: 13 }}>No activities recorded in this session.</td></tr>)}
                    {challengeSummary.map((c) => (
                      <Tr key={c.type}><Td><span style={{ color: C.ink, fontWeight: 600 }}>{CHALLENGE_LABEL[c.type]}</span></Td><TdMono align="right">{c.count}</TdMono><TdMono align="right">{(c.avgMs / 1000).toFixed(2)}</TdMono><TdMono align="right" color={c.successRate >= 0.7 ? C.good : c.successRate >= 0.45 ? C.mid : C.bad}>{(c.successRate * 100).toFixed(0)}%</TdMono></Tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </Section>

            {/* §6 METHODOLOGY */}
            <Section number="6" title="How these metrics are obtained">
              <Card>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <PixelInfo size={28} color={C.brand} color2="#FFFFFF" />
                  <div>
                    <p style={{ margin: 0, color: C.inkMid, fontSize: 13, lineHeight: 1.75 }}>
                      The camera tracks 21 hand landmarks and 468 face landmarks while you play; the microphone captures your voice when you hold a sustained sound. <strong style={{ color: C.brand }}>M1</strong> and <strong style={{ color: C.brand }}>M2</strong> are inspired by the hand items of the Fugl-Meyer assessment (FMA-UE). <strong style={{ color: C.brand }}>M6</strong> measures smile symmetry, in line with the House-Brackmann scale. <strong style={{ color: C.brand }}>V1</strong> combines how long you sustain the sound (MPT), how stable it is, and classical acoustic metrics (jitter, shimmer, HNR) used in speech therapy clinics.
                    </p>
                    <p style={{ margin: "12px 0 0", color: C.inkSoft, fontSize: 12, lineHeight: 1.65, fontStyle: "italic" }}>
                      This is a snapshot of how you are doing today, useful for tracking progress between sessions — it does not replace your therapist&apos;s assessment.
                    </p>
                  </div>
                </div>
              </Card>
            </Section>

            {/* FOOTER */}
            <footer style={{ marginTop: 6, paddingTop: 16, borderTop: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, ...MONO, fontSize: 11, color: C.inkSoft }}>
                <PixelFish size={14} color={C.brand} color2="#3D6BB8" />
                <span>SteadyArc · v0.1 · {reportNo} · {dateStr} {timeStr}</span>
              </div>
              <button onClick={onReplay} style={{ ...SANS, fontSize: 14, fontWeight: 600, padding: "12px 22px", background: C.brand, color: "#fff", border: "1px solid #173E80", borderRadius: 8, cursor: "pointer", boxShadow: "0 2px 0 #173E80, 0 4px 10px rgba(31,76,156,0.25)", display: "inline-flex", alignItems: "center", gap: 10, transition: "transform 0.1s, box-shadow 0.1s" }}
                onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(2px)"; e.currentTarget.style.boxShadow = "0 0 0 #173E80, 0 2px 6px rgba(31,76,156,0.25)"; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 0 #173E80, 0 4px 10px rgba(31,76,156,0.25)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 0 #173E80, 0 4px 10px rgba(31,76,156,0.25)"; }}
              >
                <PixelPlay size={14} color="#fff" />
                <span>Back to fishing</span>
              </button>
            </footer>
          </div>
        </WoodenFrame>

        <div style={{ position: "absolute", right: 28, bottom: -28, zIndex: 5, pointerEvents: "none" }}>
          <WaxSeal doctorName="DR. M. GARCÍA" date={dateStr} size={118} />
        </div>
      </div>

      <PixelToast title="Summary sent to your care team" message="Today's report is now available to Dr. García in the medical record." doctor="Dr. M. García" delayMs={1000} durationMs={5000} />
      <style>{`@media (max-width: 860px) { .srd-hero-grid, .srd-motor-grid { grid-template-columns: 1fr !important; } }`}</style>
    </main>
  );
}

/* Sub-components */

function Card({ children, padding = 18 }: { children: React.ReactNode; padding?: number }) {
  return (<div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding, boxShadow: "0 1px 0 rgba(15,23,42,0.02)" }}>{children}</div>);
}

function Section({ number, title, subtitle, children }: { number: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
        <span style={{ ...MONO, fontSize: 10, color: "#FFFFFF", fontWeight: 700, letterSpacing: "0.06em", background: C.brand, padding: "3px 7px", borderRadius: 3 }}>{number.padStart(2, "0")}</span>
        <h2 style={{ ...SERIF, margin: 0, fontSize: 19, fontWeight: 600, color: C.ink }}>{title}</h2>
        {subtitle && <span style={{ fontSize: 12, color: C.inkSoft, marginLeft: "auto", fontStyle: "italic" }}>{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

function Eyebrow({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (<div style={{ ...MONO, fontSize: 10.5, fontWeight: 600, color: C.inkSoft, textTransform: "uppercase", letterSpacing: "0.10em", display: "inline-flex", alignItems: "center", ...style }}>{children}</div>);
}

function Meta({ k, v }: { k: string; v: string }) {
  return (<><span style={{ color: C.inkSoft }}>{k}</span><span style={{ color: C.ink, fontWeight: 500 }}>{v}</span></>);
}

function Pill({ children, color, soft }: { children: React.ReactNode; color: string; soft: string }) {
  return (<span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, padding: "3px 9px", background: soft, color, borderRadius: 4, border: `1px solid ${color}33` }}><span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />{children}</span>);
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.borderSoft}`, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 11.5, color: C.inkMid, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ ...MONO, fontSize: 20, fontWeight: 600, color: C.ink }}>{value}</span>
        {unit && <span style={{ ...MONO, fontSize: 11, color: C.inkSoft }}>{unit}</span>}
      </div>
    </div>
  );
}

function MicroStat({ label, value }: { label: string; value: string }) {
  return (<div><div style={{ color: C.inkSoft, fontSize: 10.5, marginBottom: 2 }}>{label}</div><div style={{ color: C.ink, fontSize: 12.5, fontWeight: 600 }}>{value}</div></div>);
}

function CRIRing({ value, color }: { value: number; color: string }) {
  const size = 168, stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const v = isNA(value) ? 0 : Math.max(0, Math.min(100, value));
  const offset = c - (v / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.borderSoft} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="butt" transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 700ms ease-out" }} />
        {[25, 50, 75].map((m) => { const a = (m / 100) * 2 * Math.PI - Math.PI / 2; return <line key={m} x1={size / 2 + Math.cos(a) * (r - stroke / 2 - 2)} y1={size / 2 + Math.sin(a) * (r - stroke / 2 - 2)} x2={size / 2 + Math.cos(a) * (r + stroke / 2 + 2)} y2={size / 2 + Math.sin(a) * (r + stroke / 2 + 2)} stroke={C.rule} strokeWidth={1} />; })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ ...SERIF, fontSize: 46, fontWeight: 600, color: C.ink, lineHeight: 1 }}>{isNA(value) ? "—" : Math.round(value)}</div>
        <div style={{ ...MONO, fontSize: 11, color: C.inkSoft, marginTop: 6 }}>/ 100</div>
      </div>
    </div>
  );
}

function DomainCard({ code, title, subtitle, score, proxy, icon }: { code: string; title: string; subtitle: string; score: number; proxy: string; icon?: React.ReactNode }) {
  const color = colorOf(score), soft = softOf(score), na = isNA(score), pct = na ? 0 : Math.max(0, Math.min(100, score));
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && <div style={{ width: 28, height: 28, background: C.brandSoft, border: `1px solid ${C.border}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>}
          <span style={{ ...MONO, fontSize: 10.5, fontWeight: 700, padding: "2px 7px", background: C.brandSoft, color: C.brand, borderRadius: 4 }}>{code}</span>
        </div>
        <Pill color={color} soft={soft}>{na ? "N/A" : levelOf(score) === "good" ? "Bien" : levelOf(score) === "mid" ? "Mejorable" : "Bajo"}</Pill>
      </div>
      <div style={{ ...SERIF, fontSize: 16, fontWeight: 600, color: C.ink }}>{title}</div>
      <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2, marginBottom: 14 }}>{subtitle}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 10 }}>
        <span style={{ ...MONO, fontSize: 32, fontWeight: 600, color: na ? C.inkSoft : C.ink, lineHeight: 1 }}>{na ? "—" : Math.round(score)}</span>
        <span style={{ ...MONO, fontSize: 12, color: C.inkSoft }}>/ 100</span>
      </div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <div style={{ height: 6, background: C.surfaceAlt, borderRadius: 2, overflow: "hidden", border: `1px solid ${C.borderSoft}` }}>
          <div style={{ height: "100%", width: `${pct}%`, background: na ? C.na : color, transition: "width 700ms ease-out" }} />
        </div>
        {[45, 70].map((t) => <div key={t} style={{ position: "absolute", top: -2, bottom: -2, left: `${t}%`, width: 1, background: C.rule }} />)}
      </div>
      <div style={{ ...MONO, fontSize: 10.5, color: C.inkSoft }}>{proxy}</div>
    </div>
  );
}

function BiomarkerCard({ code, name, value, unit, refRange, status, extra }: { code: string; name: string; value: string; unit: string; refRange: string; status: "good" | "mid" | "bad" | "na" | "neutral"; extra?: string }) {
  const color = status === "good" ? C.good : status === "mid" ? C.mid : status === "bad" ? C.bad : status === "na" ? C.na : C.inkMid;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 3, background: status === "neutral" ? C.borderSoft : color, borderRadius: 2 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, paddingLeft: 8 }}>
        <span style={{ ...MONO, fontSize: 10.5, color: C.brand, fontWeight: 700 }}>{code}</span>
        <span style={{ ...MONO, fontSize: 9.5, color: C.inkFaint, textTransform: "uppercase" }}>ref. {refRange}</span>
      </div>
      <div style={{ fontSize: 12, color: C.inkMid, marginBottom: 10, paddingLeft: 8, lineHeight: 1.35 }}>{name}</div>
      <div style={{ paddingLeft: 8, display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ ...MONO, fontSize: 24, fontWeight: 600, color: status === "neutral" ? C.ink : color, lineHeight: 1 }}>{value}</span>
        <span style={{ ...MONO, fontSize: 11.5, color: C.inkSoft }}>{unit}</span>
      </div>
      {extra && <div style={{ ...MONO, fontSize: 10.5, color: C.inkSoft, marginTop: 6, paddingLeft: 8 }}>{extra}</div>}
    </div>
  );
}

function Heatmap({ matrix }: { matrix: number[][] }) {
  const rows = matrix.length, cols = matrix[0]?.length ?? 0;
  return (
    <div style={{ position: "relative", background: C.paper, border: `1px solid ${C.borderSoft}`, borderRadius: 6, padding: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, aspectRatio: `${cols} / ${rows}` }}>
        {matrix.flatMap((row, y) => row.map((v, x) => <div key={`${y}-${x}`} style={{ background: lerpColor(C.heatLow, C.heatHigh, Math.max(0, Math.min(1, v))), borderRadius: 2 }} />))}
      </div>
      <div style={{ ...MONO, fontSize: 9.5, color: C.inkFaint, marginTop: 6, display: "flex", justifyContent: "space-between" }}><span>← izquierda</span><span>centro</span><span>derecha →</span></div>
    </div>
  );
}

function HeatmapLegend() {
  return (<div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, ...MONO, fontSize: 10.5, color: C.inkSoft }}><span>0.0</span><div style={{ flex: 1, height: 6, borderRadius: 2, background: `linear-gradient(90deg, ${C.heatLow} 0%, ${C.heatHigh} 100%)`, border: `1px solid ${C.borderSoft}` }} /><span>1.0</span><span style={{ color: C.inkFaint, marginLeft: 6 }}>densidad norm.</span></div>);
}

function Table({ children }: { children: React.ReactNode }) {
  return (<div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 10 }}>{children}</table></div>);
}
function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (<th style={{ padding: "9px 12px", textAlign: align, fontSize: 10.5, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}`, background: C.paper, ...MONO }}>{children}</th>);
}
function Tr({ children }: { children: React.ReactNode }) {
  return (<tr style={{ borderBottom: `1px solid ${C.borderSoft}` }}>{children}</tr>);
}
function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (<td style={{ padding: "10px 12px", textAlign: align, color: C.inkMid, fontSize: 13 }}>{children}</td>);
}
function TdMono({ children, align = "left", color }: { children: React.ReactNode; align?: "left" | "right"; color?: string }) {
  return (<td style={{ padding: "10px 12px", textAlign: align, color: color ?? C.ink, fontSize: 13, fontWeight: 600, ...MONO }}>{children}</td>);
}
function DetailRow({ label, value, valueColor, isLast }: { label: string; value: string; valueColor?: string; isLast?: boolean }) {
  return (<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: isLast ? "none" : `1px dashed ${C.borderSoft}` }}><span style={{ fontSize: 13, color: C.inkMid }}>{label}</span><span style={{ ...MONO, fontSize: 13, fontWeight: 600, color: valueColor ?? C.ink }}>{value}</span></div>);
}

/* Heatmap helpers */
function lerpColor(a: string, b: string, t: number) {
  const ah = hexToRgb(a), bh = hexToRgb(b);
  return `rgb(${Math.round(ah.r + (bh.r - ah.r) * t)},${Math.round(ah.g + (bh.g - ah.g) * t)},${Math.round(ah.b + (bh.b - ah.b) * t)})`;
}
function hexToRgb(h: string) { const x = h.replace("#", ""); return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) }; }
function synthHeatmap(cols: number, rows: number): number[][] {
  const cx = cols * 0.55, cy = rows * 0.5, sx = cols * 0.28, sy = rows * 0.32;
  const m: number[][] = [];
  for (let y = 0; y < rows; y++) { const row: number[] = []; for (let x = 0; x < cols; x++) { const dx = (x - cx) / sx, dy = (y - cy) / sy; row.push(Math.min(1, Math.exp(-(dx * dx + dy * dy) / 2) + (Math.sin(x * 1.3 + y * 0.7) + 1) * 0.05)); } m.push(row); }
  return m;
}
function coverage(m: number[][]) { let a = 0, t = 0; m.forEach(r => r.forEach(v => { t++; if (v > 0.15) a++; })); return t ? a / t : 0; }
function centroid(m: number[][]) { let sx = 0, sy = 0, sw = 0; m.forEach((r, y) => r.forEach((v, x) => { sx += x * v; sy += y * v; sw += v; })); const cols = m[0]?.length ?? 1, rows = m.length || 1; return sw ? { x: sx / sw / (cols - 1 || 1), y: sy / sw / (rows - 1 || 1) } : { x: 0, y: 0 }; }
