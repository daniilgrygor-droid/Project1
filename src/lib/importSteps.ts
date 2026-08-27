import { supabase } from "./supabase";

export interface ImportRow {
  note: string;
  category?: string | null;
  mood?: number | null;
  created_at?: string | null;
}

export function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const noteIdx = header.indexOf("note");
  if (noteIdx === -1) throw new Error("CSV needs a 'note' column");
  const catIdx = header.indexOf("category");
  const moodIdx = header.indexOf("mood");
  const dateIdx = header.indexOf("created_at");
  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const note = cols[noteIdx]?.trim();
    if (!note) continue;
    rows.push({
      note: note.slice(0, 2000),
      category: catIdx >= 0 ? cols[catIdx] || null : null,
      mood: moodIdx >= 0 ? (parseInt(cols[moodIdx], 10) || null) : null,
      created_at: dateIdx >= 0 ? cols[dateIdx] || null : null,
    });
  }
  return rows;
}

export function parseDayOne(text: string): ImportRow[] {
  const data = JSON.parse(text);
  const entries: unknown[] = Array.isArray(data) ? data : (data as { entries?: unknown[] }).entries ?? [];
  return entries
    .map((e: unknown) => {
      const entry = e as Record<string, unknown>;
      const note = (entry.text as string) || (entry.body as string) || "";
      if (!note.trim()) return null;
      return {
        note: note.trim().slice(0, 2000),
        created_at: (entry.creationDate as string) || (entry.date as string) || null,
      } as ImportRow;
    })
    .filter(Boolean) as ImportRow[];
}

export async function importRows(rows: ImportRow[]): Promise<{ imported: number; error?: string }> {
  if (!supabase) return { imported: 0, error: "Not configured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { imported: 0, error: "Not signed in" };
  let imported = 0;
  for (const row of rows) {
    const { error } = await supabase.from("steps").insert({
      note: row.note,
      category: row.category ?? null,
      mood: row.mood ?? null,
      user_id: user.id,
      created_at: row.created_at || undefined,
    });
    if (!error) imported++;
  }
  return { imported };
}
