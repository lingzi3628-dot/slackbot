"use client";

import { FolderKanban, FolderPlus, Users, Pin, Archive } from "lucide-react";
import { PlaceholderPage } from "./placeholder-page";

export function ProjectsPage() {
  return (
    <PlaceholderPage
      icon={FolderKanban}
      title="Projects"
      description="Projects are the primary organizational unit in SPYRO. Conversations, files, agents, automations and knowledge all live inside a project."
      bullets={[
        "Grid, List, Kanban, Calendar & Timeline views",
        "Pin, archive, duplicate and share projects",
        "Invite collaborators with role-based access",
        "AI memory persists across every project asset",
        "Version history & full activity log",
        "Connect integrations per project",
      ]}
      ctaLabel="Start a conversation"
      ctaView="chat"
      accent="from-violet-500 to-fuchsia-500"
    />
  );
}
