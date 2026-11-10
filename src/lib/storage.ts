import { useEffect, useState } from "react";
import { routineDate } from "./date";

export interface AppData {
  version: 1;
  startDate: string;
  logs: Record<string, string[]>; // তারিখ → শেষ করা task id
  notes: Record<string, string>; // তারিখ → আজ কী শিখলাম
  targets: Record<string, Record<string, number>>; // সপ্তাহের শুরু → লক্ষ্যের সংখ্যা
}

const KEY = "routine-tracker-v1";

function fresh(): AppData {
  return { version: 1, startDate: routineDate(), logs: {}, notes: {}, targets: {} };
}

export function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const data = JSON.parse(raw) as AppData;
    return { ...fresh(), ...data };
  } catch {
    return fresh();
  }
}

function save(data: AppData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage বন্ধ থাকলে শুধু এই সেশনে থাকবে */
  }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(load);
  useEffect(() => save(data), [data]);
  return [data, setData] as const;
}

export function exportJSON(data: AppData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `routine-backup-${routineDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJSON(file: File): Promise<AppData> {
  const data = JSON.parse(await file.text()) as AppData;
  if (!data.logs || !data.startDate) throw new Error("ফাইলটা এই অ্যাপের backup না।");
  return { ...fresh(), ...data };
}
