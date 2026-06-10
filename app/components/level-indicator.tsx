import { cn } from "~/lib/utils";

interface MaxwellLevel {
  level: number;
  name: string;
  description: string;
}

interface LevelIndicatorProps {
  currentLevel: number | null;
  maxwellLevels: MaxwellLevel[];
  compact?: boolean;
}

const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "#64748b", text: "#ffffff", border: "#64748b" },
  2: { bg: "#4A8FA8", text: "#ffffff", border: "#4A8FA8" },
  3: { bg: "#16a34a", text: "#ffffff", border: "#16a34a" },
  4: { bg: "#C9A84C", text: "#ffffff", border: "#C9A84C" },
  5: { bg: "#1A2B4A", text: "#ffffff", border: "#1A2B4A" },
};

export function LevelIndicator({
  currentLevel,
  maxwellLevels,
  compact = false,
}: LevelIndicatorProps) {
  const levels =
    maxwellLevels.length > 0
      ? maxwellLevels
      : [
          { level: 1, name: "Position", description: "" },
          { level: 2, name: "Permission", description: "" },
          { level: 3, name: "Production", description: "" },
          { level: 4, name: "People Dev.", description: "" },
          { level: 5, name: "Pinnacle", description: "" },
        ];

  if (compact) {
    if (currentLevel == null) return null;
    const lvl = levels.find((l) => l.level === currentLevel);
    const color = LEVEL_COLORS[currentLevel] ?? LEVEL_COLORS[1];
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2"
        style={{
          backgroundColor: color.bg,
          color: color.text,
          borderColor: color.border,
        }}
      >
        <span>L{currentLevel}</span>
        <span className="hidden sm:inline">{lvl?.name ?? ""}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {levels.map((lvl, idx) => {
        const isActive = currentLevel != null && lvl.level <= currentLevel;
        const isCurrent = currentLevel === lvl.level;
        const color = LEVEL_COLORS[lvl.level] ?? LEVEL_COLORS[1];

        return (
          <div key={lvl.level} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <div
                className={cn(
                  "w-full h-2 rounded-full transition-all duration-500",
                  isCurrent && "ring-2 ring-offset-1"
                )}
                style={{
                  backgroundColor: isActive ? color.bg : "#DDD8CE",
                  ringColor: isCurrent ? color.bg : undefined,
                }}
                title={`Level ${lvl.level}: ${lvl.name}`}
              />
              <span
                className={cn(
                  "text-[9px] font-medium truncate max-w-full",
                  isActive ? "font-semibold" : "text-muted-foreground"
                )}
                style={isActive ? { color: color.bg } : undefined}
              >
                {lvl.name}
              </span>
            </div>
            {idx < levels.length - 1 && (
              <div
                className="h-2 w-1 rounded-full flex-shrink-0"
                style={{ backgroundColor: "#DDD8CE" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
