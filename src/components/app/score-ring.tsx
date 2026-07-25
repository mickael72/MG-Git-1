import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
}

function bandColor(score: number): string {
  if (score >= 80) return "hsl(152 60% 45%)";
  if (score >= 60) return "hsl(200 70% 50%)";
  if (score >= 40) return "hsl(38 92% 50%)";
  return "hsl(0 72% 55%)";
}

export function ScoreRing({ score, size = 140, label }: ScoreRingProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color = bandColor(clamped);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-3xl font-bold")}>{clamped}</span>
        <span className="text-xs text-muted-foreground">
          {label ?? "/ 100"}
        </span>
      </div>
    </div>
  );
}
