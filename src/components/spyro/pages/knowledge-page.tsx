"use client";

import { BookOpen, FileText, Globe, Mic } from "lucide-react";
import { PlaceholderPage } from "./placeholder-page";

export function KnowledgePage() {
  return (
    <PlaceholderPage
      icon={BookOpen}
      title="Knowledge"
      description="SPYRO remembers everything important. Upload documents, save notes, clip web pages — your second brain, fully searchable."
      bullets={[
        "Semantic search with vector retrieval",
        "Upload PDFs, docs, images, audio & more",
        "Automatic summarization & deduplication",
        "Knowledge graph with citations",
        "Collections, tags & permissions",
        "Refresh indexing on demand",
      ]}
      ctaLabel="Ask SPYRO anything"
      ctaView="chat"
      accent="from-cyan-500 to-blue-500"
    />
  );
}
