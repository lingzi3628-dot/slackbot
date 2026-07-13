/**
 * Syncs conversations to Supabase when the user is logged in.
 * Falls back to localStorage when not logged in (or Supabase not configured).
 *
 * Tables (see docs/SUPABASE_SCHEMA.sql):
 *   - conversations (id, user_id, title, created_at, updated_at)
 *   - messages (id, conversation_id, role, content, type, image_url, created_at)
 */
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore, type Conversation } from "@/store/chat-store";
import { getSupabase } from "@/lib/supabase-client";

export function useSupabaseSync() {
  const user = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const lastSyncRef = useRef<string>("");

  // Load conversations from Supabase on login.
  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    (async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id, title, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!convos || convos.length === 0) return;

      // Fetch messages for each conversation.
      const fullConvos: Conversation[] = [];
      for (const c of convos) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, role, content, type, image_url, created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: true });

        fullConvos.push({
          id: c.id,
          title: c.title,
          messages: (msgs ?? []).map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            type: m.type ?? "text",
            imageUrl: m.image_url ?? undefined,
            createdAt: new Date(m.created_at).getTime(),
          })),
          createdAt: new Date(c.created_at).getTime(),
          updatedAt: new Date(c.updated_at).getTime(),
        });
      }

      // Only replace if we got data.
      if (fullConvos.length > 0) {
        useChatStore.setState((s) => ({
          conversations: fullConvos,
          activeId: fullConvos[0]?.id ?? null,
        }));
      }
    })();
  }, [user]);

  // Debounced sync: save conversations to Supabase when they change.
  useEffect(() => {
    if (!user) return; // Only sync when logged in.
    const supabase = getSupabase();
    if (!supabase) return;

    const snapshot = JSON.stringify({ conversations, activeId });
    if (snapshot === lastSyncRef.current) return; // No changes.
    lastSyncRef.current = snapshot;

    const timer = setTimeout(async () => {
      for (const convo of conversations) {
        // Upsert conversation.
        await supabase.from("conversations").upsert({
          id: convo.id,
          user_id: user.id,
          title: convo.title,
          updated_at: new Date(convo.updatedAt).toISOString(),
        });

        // Upsert messages (only new ones — check if any messages exist first).
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", convo.id);

        if ((count ?? 0) < convo.messages.length) {
          // Insert only the missing messages.
          const existing = await supabase
            .from("messages")
            .select("id")
            .eq("conversation_id", convo.id);

          const existingIds = new Set(existing.data?.map((m: { id: string }) => m.id) ?? []);
          const newMessages = convo.messages
            .filter((m) => !existingIds.has(m.id))
            .map((m) => ({
              id: m.id,
              conversation_id: convo.id,
              role: m.role,
              content: m.content,
              type: m.type ?? "text",
              image_url: m.imageUrl ?? null,
              created_at: new Date(m.createdAt).toISOString(),
            }));

          if (newMessages.length > 0) {
            await supabase.from("messages").insert(newMessages);
          }
        }
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [conversations, activeId, user]);
}
