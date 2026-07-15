"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Image, Trash2, HelpCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlashCommand {
  command: string;
  label: string;
  description: string;
  icon: typeof Search;
  action: () => void;
}

interface SlashMenuProps {
  open: boolean;
  commands: SlashCommand[];
  onSelect: (cmd: SlashCommand) => void;
  onClose: () => void;
}

/** Autocomplete menu that appears when the user types "/" in the input. */
export function SlashMenu({ open, commands, onSelect, onClose }: SlashMenuProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className="glass absolute bottom-full left-0 right-0 z-30 mb-2 overflow-hidden rounded-xl border border-border/60 shadow-2xl"
      >
        <div className="border-b border-border/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Commands
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {commands.map((cmd, i) => (
            <button
              key={cmd.command}
              onClick={() => {
                onSelect(cmd);
                onClose();
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                i === activeIndex ? "bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <cmd.icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{cmd.command}</span>
                  <span className="text-xs text-muted-foreground">{cmd.label}</span>
                </div>
                <p className="truncate text-[11px] text-muted-foreground/70">
                  {cmd.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
