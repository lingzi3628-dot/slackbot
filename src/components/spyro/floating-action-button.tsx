"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MessageSquare, FolderPlus, Bot, Upload, Globe,
  Inbox, Zap, X,
} from "lucide-react";
import { useUIStore, type View } from "@/store/ui-store";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  icon: typeof Plus;
  color: string;
  action: (setView: (v: View) => void, createConversation: () => void) => void;
}

const ACTIONS: QuickAction[] = [
  { label: "New Chat", icon: MessageSquare, color: "text-violet-400", action: (setView, create) => { create(); setView("chat"); } },
  { label: "New Project", icon: FolderPlus, color: "text-cyan-400", action: (setView) => setView("projects") },
  { label: "New Agent", icon: Bot, color: "text-emerald-400", action: (setView) => setView("agents") },
  { label: "Upload File", icon: Upload, color: "text-amber-400", action: (setView) => setView("apps") },
  { label: "Research Topic", icon: Globe, color: "text-pink-400", action: (setView) => setView("chat") },
  { label: "Connect WhatsApp", icon: Inbox, color: "text-teal-400", action: (setView) => setView("communication") },
  { label: "Automation", icon: Zap, color: "text-orange-400", action: (setView) => setView("apps") },
];

/**
 * Floating Action Button — accessible from every page.
 * Opens a radial menu of quick-create actions.
 */
export function FloatingActionButton() {
  const [open, setOpen] = React.useState(false);
  const setView = useUIStore((s) => s.setView);
  const createConversation = useChatStore((s) => s.createConversation);
  const fabRef = React.useRef<HTMLDivElement>(null);

  // Close on Escape
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={fabRef} className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Action items (radial) */}
            <div className="absolute bottom-16 right-0 z-50 flex flex-col items-end gap-2">
              {ACTIONS.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => { action.action(setView, createConversation); setOpen(false); }}
                  className="group flex items-center gap-3"
                >
                  <span className="rounded-lg border border-border bg-popover px-3 py-1.5 text-xs font-medium text-foreground shadow-soft opacity-0 transition-opacity group-hover:opacity-100">
                    {action.label}
                  </span>
                  <span className={cn("grid h-10 w-10 place-items-center rounded-xl border border-border bg-popover shadow-soft transition-transform group-hover:scale-110", action.color)}>
                    <action.icon className="h-4 w-4" />
                  </span>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative z-50 grid h-14 w-14 place-items-center rounded-full shadow-elevated transition-colors",
          open ? "bg-destructive text-white" : "spyro-bg-gradient text-white"
        )}
        aria-label={open ? "Close quick create" : "Quick create"}
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
}
