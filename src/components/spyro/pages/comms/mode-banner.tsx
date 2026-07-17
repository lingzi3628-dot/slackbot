"use client";

import * as React from "react";
import { Clock, X } from "lucide-react";

/**
 * Mode banner — shows a "Simulation mode — real-time coming soon" message
 * on the Communication Center. Dismissible per session.
 */
export function ModeBanner() {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-400">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">
        Simulation mode — Real-time WhatsApp messaging coming soon. Preview the full connection flow now.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="grid h-5 w-5 shrink-0 place-items-center rounded hover:bg-amber-500/20"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
