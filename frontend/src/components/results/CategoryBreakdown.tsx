"use client";

import type { CategoryScore } from "@/types";
import { Progress } from "@/components/ui/Progress";
import { scoreToColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CategoryBreakdownProps {
  categories: CategoryScore[];
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (!categories.length) return null;

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.category} className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">{cat.label || cat.category}</span>
            <span className={cn("font-semibold tabular-nums", scoreToColor(cat.score))}>
              {cat.score}%
            </span>
          </div>
          <Progress
            value={cat.score}
            barClassName={
              cat.score >= 80
                ? "bg-emerald-500"
                : cat.score >= 60
                ? "bg-amber-500"
                : "bg-red-500"
            }
          />
        </div>
      ))}
    </div>
  );
}
