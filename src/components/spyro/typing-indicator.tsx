import { cn } from "@/lib/utils";

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-1.5 py-1", className)}
      aria-label="SPYRO V1 is thinking"
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="flame-dot inline-block h-2 w-2 rounded-full spyro-bg-gradient"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}
