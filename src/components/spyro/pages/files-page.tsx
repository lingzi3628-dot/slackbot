"use client";

import { FileText, Upload, Image, FileSearch } from "lucide-react";
import { PlaceholderPage } from "./placeholder-page";

export function FilesPage() {
  return (
    <PlaceholderPage
      icon={FileText}
      title="Files"
      description="Everything you upload, organized. Folders, tags, previews, OCR, transcription and AI analysis — all in one place."
      bullets={[
        "Folders, tags & pinned files",
        "Preview images, docs, audio & video",
        "OCR for images & transcription for audio",
        "Duplicate detection & bulk actions",
        "Version history & restore",
        "Encrypted storage with signed URLs",
      ]}
      ctaLabel="Open Image Studio"
      ctaView="apps"
      accent="from-amber-500 to-orange-500"
    />
  );
}
