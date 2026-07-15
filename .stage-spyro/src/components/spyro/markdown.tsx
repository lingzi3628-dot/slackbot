"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Markdown renderer tuned for SPYRO V1 assistant replies.
 * - GitHub-flavoured (tables, strikethrough, task lists)
 * - Code blocks get a language label + copy button
 * - Inline code is ember-tinted
 */
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="group/code my-3 overflow-hidden rounded-lg border border-border bg-black/40">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {language || "code"}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed">
        <code className="font-mono text-foreground/90">{code}</code>
      </pre>
    </div>
  );
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose-spyro text-[15px] leading-relaxed",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          h1: ({ children }) => (
            <h1 className="mb-3 mt-4 text-xl font-semibold tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-lg font-semibold tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 text-base font-semibold tracking-tight">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-5 list-disc space-y-1 marker:text-primary">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1 marker:text-primary marker:font-semibold">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-primary/60 pl-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-border" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted/40 px-3 py-1.5 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-1.5">{children}</td>
          ),
          code: ({ className: cls, children, ...props }) => {
            const isInline = !cls;
            const text = String(children).replace(/\n$/, "");
            if (isInline) {
              return (
                <code
                  className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[0.85em] text-primary-foreground/90"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            const lang = /language-(\w+)/.exec(cls || "")?.[1] ?? "";
            return <CodeBlock language={lang} code={text} />;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
