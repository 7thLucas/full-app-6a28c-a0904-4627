import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowLeft, TrendingUp, Calendar } from "lucide-react";
import { useConfigurables } from "~/modules/configurables";
import {
  useInfluenceTimeline,
  type InfluenceSnapshotView,
} from "~/hooks/use-influence-timeline";

const LEVEL_COLORS: Record<number, string> = {
  1: "#4B4B4B",
  2: "#1f1f1f",
  3: "#2f8f48",
  4: "#38aa56",
  5: "#111111",
};

const DEFAULT_LEVEL_NAMES: Record<number, string> = {
  1: "Position",
  2: "Permission",
  3: "Production",
  4: "People Development",
  5: "Pinnacle",
};

function levelColor(level: number): string {
  return LEVEL_COLORS[level] ?? "#38aa56";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TimelinePage() {
  const { config, loading: configLoading } = useConfigurables();
  const { snapshots, loading, error } = useInfluenceTimeline();

  const appName = config.appName ?? "Influence Coach";
  const levelNames = useMemo<Record<number, string>>(() => {
    const fromConfig = (config.maxwellLevels ?? []) as Array<{ level: number; name: string }>;
    if (fromConfig.length === 0) return DEFAULT_LEVEL_NAMES;
    return fromConfig.reduce<Record<number, string>>((acc, l) => {
      acc[l.level] = l.name;
      return acc;
    }, {});
  }, [config.maxwellLevels]);

  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const first = snapshots.length > 0 ? snapshots[0] : null;
  const delta = latest && first ? latest.level - first.level : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-4 text-white shadow-sm flex-shrink-0"
        style={{ backgroundColor: "var(--primary)" }}
      >
        <Link
          to="/"
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Back to coach"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight font-serif">Influence Growth Timeline</p>
          <p className="text-white/60 text-xs truncate">{appName}</p>
        </div>
        <TrendingUp className="w-5 h-5 flex-shrink-0 text-white/80" />
      </header>

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {(loading || configLoading) && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-accent border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">Loading your journey...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <p className="text-sm" style={{ color: "var(--foreground)" }}>{error}</p>
          </div>
        )}

        {!loading && !error && snapshots.length === 0 && <EmptyState />}

        {!loading && !error && snapshots.length > 0 && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard
                label="Current"
                value={`L${latest?.level ?? "-"}`}
                sub={latest ? levelNames[latest.level] ?? latest.levelName : ""}
                color={latest ? levelColor(latest.level) : "var(--accent)"}
              />
              <StatCard
                label="Sessions"
                value={String(snapshots.length)}
                sub="snapshots"
                color="var(--foreground)"
              />
              <StatCard
                label="Growth"
                value={delta > 0 ? `+${delta}` : String(delta)}
                sub={delta === 1 || delta === -1 ? "level" : "levels"}
                color={delta >= 0 ? "var(--accent)" : "#b91c1c"}
              />
            </div>

            {/* Chart */}
            <div className="p-4 rounded-2xl border border-border bg-card shadow-sm mb-6">
              <h2 className="text-sm font-semibold mb-4 font-serif" style={{ color: "var(--foreground)" }}>
                Level Progression
              </h2>
              <TimelineChart snapshots={snapshots} levelNames={levelNames} />
            </div>

            {/* Session list */}
            <h2 className="text-sm font-semibold mb-3 font-serif" style={{ color: "var(--foreground)" }}>
              Session History
            </h2>
            <div className="space-y-3">
              {[...snapshots].reverse().map((s) => (
                <SnapshotCard key={s.id} snapshot={s} levelNames={levelNames} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-xl border border-border bg-card shadow-sm text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold font-serif leading-none" style={{ color }}>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</p>
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

function TimelineChart({
  snapshots,
  levelNames,
}: {
  snapshots: InfluenceSnapshotView[];
  levelNames: Record<number, string>;
}) {
  const width = 320;
  const height = 200;
  const padLeft = 28;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 28;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // y: level 1 (bottom) → 5 (top)
  const yFor = (level: number) => padTop + plotH - ((level - 1) / 4) * plotH;
  const xFor = (i: number) => {
    if (snapshots.length === 1) return padLeft + plotW / 2;
    return padLeft + (i / (snapshots.length - 1)) * plotW;
  };

  const points = snapshots.map((s, i) => ({ x: xFor(i), y: yFor(s.level), s }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="Influence level progression over time"
    >
      {/* Gridlines + level labels */}
      {[1, 2, 3, 4, 5].map((lvl) => {
        const y = yFor(lvl);
        return (
          <g key={lvl}>
            <line
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke="#E4E7E4"
              strokeWidth={1}
            />
            <text
              x={padLeft - 6}
              y={y + 3}
              textAnchor="end"
              fontSize={9}
              fill="#888"
            >
              {lvl}
            </text>
          </g>
        );
      })}

      {/* Progression line */}
      {points.length > 1 && (
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Points */}
      {points.map((p) => (
        <g key={p.s.id}>
          <circle
            cx={p.x}
            cy={p.y}
            r={5}
            fill={levelColor(p.s.level)}
            stroke="#ffffff"
            strokeWidth={2}
          >
            <title>
              {`${levelNames[p.s.level] ?? p.s.levelName} (L${p.s.level}) — ${formatDate(
                p.s.capturedAt,
              )}`}
            </title>
          </circle>
        </g>
      ))}
    </svg>
  );
}

// ─── Snapshot card ──────────────────────────────────────────────────────────────

function SnapshotCard({
  snapshot,
  levelNames,
}: {
  snapshot: InfluenceSnapshotView;
  levelNames: Record<number, string>;
}) {
  const name = levelNames[snapshot.level] ?? snapshot.levelName;
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 font-serif"
        style={{ backgroundColor: levelColor(snapshot.level) }}
      >
        {snapshot.level}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            {name}
          </p>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground flex-shrink-0">
            <Calendar className="w-3 h-3" />
            {formatDate(snapshot.capturedAt)}
          </span>
        </div>
        {snapshot.summary ? (
          <p className="text-xs text-muted-foreground leading-relaxed">{snapshot.summary}</p>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic">No summary recorded</p>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: "var(--accent)" }}
      >
        <TrendingUp className="w-7 h-7 text-white" />
      </div>
      <h2 className="text-lg font-semibold font-serif mb-2" style={{ color: "var(--foreground)" }}>
        Your journey starts here
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Finish a coaching session and save a snapshot to start tracking how your influence grows over time.
      </p>
      <Link
        to="/"
        className="py-3 px-6 rounded-2xl font-semibold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
        style={{ backgroundColor: "var(--accent)", color: "var(--primary)" }}
      >
        Start a session
      </Link>
    </div>
  );
}
