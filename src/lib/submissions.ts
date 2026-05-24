export interface Submission {
  id: string;
  name: string;
  extractedName?: string;
  docType: "cnh" | "rg";
  front: string;
  back: string;
  date: string;
}

const STORAGE_KEY = "carrefour_submissions";

export const saveSubmission = (sub: Omit<Submission, "id" | "date">) => {
  const submissions = getSubmissions();
  submissions.push({
    ...sub,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
};

export const getSubmissions = (): Submission[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

export const updateSubmissionImage = (id: string, side: "front" | "back", dataUrl: string) => {
  const subs = getSubmissions();
  const found = subs.find((s) => s.id === id);
  if (!found) return;
  found[side] = dataUrl;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
};

export const deleteSubmission = (id: string) => {
  const subs = getSubmissions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
};

export const deleteAllSubmissions = () => {
  localStorage.setItem(STORAGE_KEY, "[]");
};

export const deleteSubmissions = (ids: string[]) => {
  const subs = getSubmissions().filter((s) => !ids.includes(s.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
};
