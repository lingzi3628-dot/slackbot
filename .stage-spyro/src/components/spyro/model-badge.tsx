import { cn } from "@/lib/utils";
import { SpyroLogo } from "./spyro-logo";

interface ModelBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizeMap = {
  sm: { box: "h-7 w-7", text: "text-sm", sub: "text-[10px]" },
  md: { box: "h-10 w-10", text: "text-base", sub: "text-[11px]" },
  lg: { box: "h-14 w-14", text: "text-xl", sub: "text-xs" },
} as const;

export function ModelBadge({
  className,
  size = "md",
  showTagline = false,
}: ModelBadgeProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative grid place-items-center rounded-xl spyro-bg-gradient spyro-glow",
          s.box
        )}
      >
        <SpyroLogo className="h-3/4 w-3/4 [&_svg]:h-full [&_svg]:w-full" />
      </div>
      <div className="leading-tight">
        <div className={cn("font-semibold tracking-tight", s.text)}>
          <span className="spyro-text-gradient">SPYRO</span>{" "}
          <span className="text-foreground">V1</span>
        </div>
        {showTagline && (
          <div className={cn("text-muted-foreground", s.sub)}>
            Dragon-powered AI
          </div>
        )}
      </div>
    </div>
  );
}
