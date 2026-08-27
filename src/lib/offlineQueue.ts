interface QueuedStep {
  id: string;
  note: string;
  showedUpOnly: boolean;
  category: string | null;
  mood: number | null;
  queuedAt: string;
}

const KEY = "ss-offline-queue";

function load(): QueuedStep[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedStep[];
  } catch {
    return [];
  }
}

function save(queue: QueuedStep[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(queue));
  } catch {}
}

export function enqueue(note: string, showedUpOnly: boolean, category: string | null, mood: number | null) {
  const q = load();
  q.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    note,
    showedUpOnly,
    category,
    mood,
    queuedAt: new Date().toISOString(),
  });
  save(q);
  return q.length;
}

export function getQueue(): QueuedStep[] {
  return load();
}

export function clearQueue() {
  save([]);
}

export function dequeue(id: string) {
  save(load().filter((item) => item.id !== id));
}

export async function flushQueue(
  saver: (item: QueuedStep) => Promise<{ ok: boolean }>,
): Promise<number> {
  const q = load();
  let flushed = 0;
  for (const item of [...q]) {
    try {
      const res = await saver(item);
      if (res.ok) {
        dequeue(item.id);
        flushed++;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return flushed;
}

export function hasQueued(): boolean {
  return load().length > 0;
}
