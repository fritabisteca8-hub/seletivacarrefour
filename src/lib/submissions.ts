import { supabase } from "@/integrations/supabase/client";

export interface Submission {
  id: string;
  name: string;
  extractedName?: string;
  docType: "cnh" | "rg";
  front: string;
  back: string;
  date: string;
  updatedAt?: number;
}

type Row = {
  id: string;
  name: string;
  extracted_name: string | null;
  doc_type: string;
  front: string;
  back: string;
  created_at: string;
  updated_at: string;
};

const rowToSub = (r: Row): Submission => ({
  id: r.id,
  name: r.name,
  extractedName: r.extracted_name || undefined,
  docType: (r.doc_type as "cnh" | "rg") || "rg",
  front: r.front,
  back: r.back,
  date: r.created_at,
  updatedAt: new Date(r.updated_at).getTime(),
});

export const saveSubmission = async (sub: Omit<Submission, "id" | "date">) => {
  const { error } = await supabase.from("submissions").insert({
    name: sub.name,
    extracted_name: sub.extractedName ?? null,
    doc_type: sub.docType,
    front: sub.front,
    back: sub.back,
  });
  if (error) throw error;
};

export const getSubmissions = async (): Promise<Submission[]> => {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error(error);
    throw error;
  }
  return (data as Row[]).map(rowToSub);
};

export const getSubmissionImages = async (id: string): Promise<{ front: string; back: string } | null> => {
  const { data, error } = await supabase
    .from("submissions")
    .select("front,back")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return { front: (data as any).front, back: (data as any).back };
};

export const getSubmissionsMeta = async (): Promise<Submission[]> => {
  const { data, error } = await supabase
    .from("submissions")
    .select("id,name,extracted_name,doc_type,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    extractedName: r.extracted_name || undefined,
    docType: (r.doc_type as "cnh" | "rg") || "rg",
    front: "",
    back: "",
    date: r.created_at,
    updatedAt: new Date(r.updated_at).getTime(),
  }));
};

export const updateSubmissionImage = async (
  id: string,
  side: "front" | "back",
  dataUrl: string
): Promise<Submission | null> => {
  const payload = side === "front" ? { front: dataUrl } : { back: dataUrl };
  const { data, error } = await supabase
    .from("submissions")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return rowToSub(data as Row);
};


export const updateSubmissionName = async (id: string, name: string): Promise<Submission | null> => {
  const { data, error } = await supabase
    .from("submissions")
    .update({ extracted_name: name })
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return rowToSub(data as Row);
};

export const deleteSubmission = async (id: string) => {
  const { error } = await supabase.from("submissions").delete().eq("id", id);
  if (error) throw error;
};

export const deleteAllSubmissions = async () => {
  const { error } = await supabase
    .from("submissions")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
};

export const deleteSubmissions = async (ids: string[]) => {
  if (ids.length === 0) return;
  // apaga em lotes para não estourar o limite da URL
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const { error } = await supabase.from("submissions").delete().in("id", chunk);
    if (error) throw error;
  }
};
