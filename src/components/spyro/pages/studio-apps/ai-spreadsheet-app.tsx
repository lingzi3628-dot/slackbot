"use client";

import * as React from "react";
import { Sparkles, Download, Table2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const ROWS = 20;
const COLS = 10;
const COL_LABELS = "ABCDEFGHIJ".split("");

export function AISpreadsheetApp() {
  const [cells, setCells] = React.useState<Record<string, string>>({
    A1: "Product", B1: "Price", C1: "Quantity", D1: "Total",
    A2: "Widget", B2: "10", C2: "5", D2: "=B2*C2",
    A3: "Gadget", B3: "25", C3: "3", D3: "=B3*C3",
    A4: "Gizmo", B4: "15", C4: "8", D4: "=B4*C4",
    A5: "Total", B5: "", C5: "", D5: "=D2+D3+D4",
  });
  const [activeCell, setActiveCell] = React.useState("A1");
  const [formulaBar, setFormulaBar] = React.useState("");
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);

  // Evaluate a formula (e.g. =B2*C2, =SUM(D2:D4), =D2+D3+D4)
  const evalFormula = (formula: string, allCells: Record<string, string>): string => {
    if (!formula.startsWith("=")) return formula;
    let expr = formula.slice(1);

    // Replace cell references with values
    expr = expr.replace(/([A-Z]+\d+)/g, (_, ref) => {
      const val = allCells[ref];
      if (!val) return "0";
      if (val.startsWith("=")) return evalFormula(val, allCells);
      return parseFloat(val) || `"${val}"`;
    });

    // Handle SUM(range)
    expr = expr.replace(/SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/g, (_, start, end) => {
      let sum = 0;
      const startCol = start.match(/[A-Z]+/)[0];
      const startRow = parseInt(start.match(/\d+/)[0]);
      const endRow = parseInt(end.match(/\d+/)[0]);
      for (let r = startRow; r <= endRow; r++) {
        const v = allCells[`${startCol}${r}`];
        sum += parseFloat(v) || 0;
      }
      return String(sum);
    });

    try {
      
      const result = Function(`"use strict"; return (${expr})`)();
      return String(result);
    } catch {
      return "#ERROR";
    }
  };

  const getDisplayValue = (ref: string): string => {
    const val = cells[ref];
    if (!val) return "";
    if (val.startsWith("=")) return evalFormula(val, cells);
    return val;
  };

  const setCell = (ref: string, value: string) => {
    setCells((prev) => ({ ...prev, [ref]: value }));
  };

  const onCellClick = (ref: string) => {
    setActiveCell(ref);
    setFormulaBar(cells[ref] || "");
  };

  const onFormulaChange = (value: string) => {
    setFormulaBar(value);
    setCell(activeCell, value);
  };

  const askAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    // Build a text representation of the spreadsheet
    const csv = COL_LABELS.slice(0, COLS).map(col =>
      Array.from({ length: ROWS }, (_, i) => cells[`${col}${i + 1}`] || "").join(",")
    ).join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are an AI spreadsheet assistant. Here is the current spreadsheet (CSV):\n\n${csv}\n\nRequest: ${aiPrompt}\n\nRespond with the full updated spreadsheet as CSV (no explanations). Keep the same column count.`,
          }],
        }),
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        const reply = data.choices?.[0]?.message?.content || data.reply || text;
        // Parse CSV and update cells
        const lines = reply.trim().split("\n");
        const newCells: Record<string, string> = {};
        lines.forEach((line: string, rowIdx: number) => {
          if (rowIdx >= ROWS) return;
          const values = line.split(",");
          values.forEach((val: string, colIdx: number) => {
            if (colIdx < COLS) {
              const ref = `${COL_LABELS[colIdx]}${rowIdx + 1}`;
              newCells[ref] = val.trim();
            }
          });
        });
        setCells(newCells);
      } catch {}
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
      setAiPrompt("");
    }
  };

  const exportCSV = () => {
    const csv = Array.from({ length: ROWS }, (_, r) =>
      COL_LABELS.slice(0, COLS).map(col => cells[`${col}${r + 1}`] || "").join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spreadsheet.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/40 px-3 py-2">
        <Table2 className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">AI Spreadsheet</span>
        <div className="mx-1 flex items-center gap-1">
          <span className="text-[10px] font-mono font-bold text-muted-foreground">{activeCell}</span>
          <input
            value={formulaBar}
            onChange={(e) => onFormulaChange(e.target.value)}
            placeholder="Enter value or =formula"
            className="w-48 rounded-lg border border-border bg-background px-2 py-1 font-mono text-[11px] focus:border-primary/30 focus:outline-none"
          />
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium hover:bg-secondary">
          <Download className="h-3 w-3" /> Export CSV
        </button>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-400">
          <Sparkles className="h-2.5 w-2.5" /> AI enabled
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Grid */}
        <div className="min-w-0 flex-1 overflow-auto bg-background">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 h-7 w-10 border border-border bg-card/80 text-[10px] text-muted-foreground">#</th>
                {COL_LABELS.slice(0, COLS).map((col) => (
                  <th key={col} className="sticky top-0 z-10 h-7 min-w-24 border border-border bg-card/80 px-2 text-[10px] font-medium text-muted-foreground">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, r) => r + 1).map((row) => (
                <tr key={row}>
                  <td className="sticky left-0 z-10 h-7 w-10 border border-border bg-card/80 text-center text-[10px] text-muted-foreground">{row}</td>
                  {COL_LABELS.slice(0, COLS).map((col) => {
                    const ref = `${col}${row}`;
                    const isActive = activeCell === ref;
                    return (
                      <td
                        key={ref}
                        onClick={() => onCellClick(ref)}
                        className={cn(
                          "h-7 min-w-24 cursor-cell border border-border px-2 text-xs",
                          isActive ? "ring-2 ring-primary ring-inset" : "hover:bg-secondary/30"
                        )}
                        contentEditable={isActive}
                        suppressContentEditableWarning
                        onBlur={(e) => setCell(ref, e.currentTarget.textContent || "")}
                      >
                        {getDisplayValue(ref)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI panel */}
        <div className="w-72 shrink-0 border-l border-border bg-card/40 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" /> AI Assistant
          </div>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ask AI to generate formulas, analyze trends, fill data, create charts…"
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
          />
          <button
            onClick={askAI}
            disabled={!aiPrompt.trim() || aiLoading}
            className="mt-2 w-full rounded-lg spyro-bg-gradient py-1.5 text-[11px] font-medium text-white disabled:opacity-40"
          >
            {aiLoading ? "Processing…" : "Apply AI"}
          </button>
          <div className="mt-3 space-y-1">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</p>
            {["Add a total row", "Calculate averages", "Sort by price", "Add 5 more products"].map((q) => (
              <button key={q} onClick={() => setAiPrompt(q)} className="block w-full rounded-lg border border-border bg-card px-2 py-1.5 text-left text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground">
                {q}
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-border bg-background p-2 text-[10px] text-muted-foreground">
            <p className="font-medium text-foreground">Formula support:</p>
            <p>• =B2*C2 (multiply)</p>
            <p>• =SUM(D2:D4) (sum range)</p>
            <p>• =B2+D3 (add cells)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
