import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0–100
  className?: string;
  barClassName?: string;
}

export function Progress({ value, className, barClassName }: ProgressProps) {
  return (
    <div className={cn("h-2 w-full rounded-full bg-white/10 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full bg-blue-500 transition-all duration-500", barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
