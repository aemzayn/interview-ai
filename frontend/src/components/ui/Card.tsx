import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export function Card({ className, glass, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 p-6",
        glass ? "bg-white/5 backdrop-blur-md" : "bg-gray-900",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
