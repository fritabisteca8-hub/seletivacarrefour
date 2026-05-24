import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_INTERVAL_MS = 10000;
const ONLINE_WINDOW_MS = 30000;
const INACTIVE_OFFSET_MS = 60000;

const getInactiveTimestamp = () =>
  new Date(Date.now() - INACTIVE_OFFSET_MS).toISOString();

const upsertVisit = async (sessionId: string, lastSeenAt = new Date().toISOString()) => {
  const { error } = await supabase
    .from("page_visits")
    .upsert(
      {
        session_id: sessionId,
        last_seen_at: lastSeenAt,
      },
      { onConflict: "session_id" }
    );

  if (error) {
    console.error("Erro ao registrar acesso:", error);
  }
};

const markVisitInactive = async (sessionId: string) => {
  const { error } = await supabase
    .from("page_visits")
    .update({ last_seen_at: getInactiveTimestamp() })
    .eq("session_id", sessionId);

  if (error) {
    console.error("Erro ao encerrar acesso:", error);
  }
};

export const startHeartbeat = () => {
  const sessionId = crypto.randomUUID();

  const beat = () => {
    void upsertVisit(sessionId);
  };

  const handlePageHide = () => {
    void markVisitInactive(sessionId);
  };

  beat();
  const interval = window.setInterval(beat, HEARTBEAT_INTERVAL_MS);
  window.addEventListener("pagehide", handlePageHide);

  return () => {
    window.clearInterval(interval);
    window.removeEventListener("pagehide", handlePageHide);
    void markVisitInactive(sessionId);
  };
};

export const getOnlineCount = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from("page_visits")
    .select("id", { count: "exact", head: true })
    .gte("last_seen_at", cutoff);

  if (error) {
    console.error("Erro ao buscar acessos online:", error);
    return 0;
  }

  return count || 0;
};

export const getTotalVisits = async (): Promise<number> => {
  const { count, error } = await supabase
    .from("page_visits")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("Erro ao buscar total de acessos:", error);
    return 0;
  }

  return count || 0;
};
