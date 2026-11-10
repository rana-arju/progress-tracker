import { SUCCESS_THRESHOLD, type Category, type Task } from "../data/routine";
import type { AppData } from "./storage";
import { addDays, minutesInRoutineDay, planFor, range, routineDate, toMin } from "./date";

export const tracked = (tasks: Task[]) => tasks.filter((t) => t.track !== false);

export interface DayStat {
  date: string;
  total: number;
  done: number;
  pct: number;
  missed: Task[];
  isToday: boolean;
  future: boolean;
  beforeStart: boolean;
}

export function dayStat(data: AppData, date: string, now = new Date()): DayStat {
  const today = routineDate(now);
  const tasks = tracked(planFor(date).tasks);
  const doneIds = new Set(data.logs[date] ?? []);
  const done = tasks.filter((t) => doneIds.has(t.id)).length;
  const isToday = date === today;
  const nowMin = minutesInRoutineDay(now);
  const missed =
    date > today || date < data.startDate
      ? []
      : tasks.filter((t) => {
          if (doneIds.has(t.id)) return false;
          if (!isToday) return true;
          // আজকের জন্য: সময় পার হয়ে গেছে এমন কাজই শুধু বাদ পড়া
          return t.end ? toMin(t.end) <= nowMin : false;
        });
  return {
    date, total: tasks.length, done,
    pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    missed, isToday, future: date > today, beforeStart: date < data.startDate,
  };
}

export interface RangeStat {
  days: DayStat[];
  total: number;
  done: number;
  pct: number;
  byCat: Record<Category, { total: number; done: number }>;
  topMissed: { title: string; count: number }[];
  successDays: number;
  countedDays: number;
}

export function rangeStat(data: AppData, from: string, to: string, now = new Date()): RangeStat {
  const today = routineDate(now);
  const start = from < data.startDate ? data.startDate : from;
  const end = to > today ? today : to;
  const days = start <= end ? range(start, end).map((d) => dayStat(data, d, now)) : [];
  const byCat = { en: { total: 0, done: 0 }, pr: { total: 0, done: 0 }, iq: { total: 0, done: 0 }, ap: { total: 0, done: 0 }, re: { total: 0, done: 0 } };
  const missedCount = new Map<string, number>();
  let total = 0, done = 0, successDays = 0, countedDays = 0;

  for (const ds of days) {
    const plan = planFor(ds.date);
    const doneIds = new Set(data.logs[ds.date] ?? []);
    for (const t of tracked(plan.tasks)) {
      byCat[t.cat].total++;
      if (doneIds.has(t.id)) byCat[t.cat].done++;
    }
    total += ds.total;
    done += ds.done;
    if (!ds.isToday) {
      countedDays++;
      if (ds.pct >= SUCCESS_THRESHOLD) successDays++;
    }
    for (const t of ds.missed) missedCount.set(t.title, (missedCount.get(t.title) ?? 0) + 1);
  }

  const topMissed = [...missedCount.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { days, total, done, pct: total ? Math.round((done / total) * 100) : 0, byCat, topMissed, successDays, countedDays };
}

// টানা কত দিন সফল (আজ বাদে, আজ সফল হলে আজও গোনা হয়)
export function streaks(data: AppData, now = new Date()) {
  const today = routineDate(now);
  const days = range(data.startDate, today).map((d) => dayStat(data, d, now));
  let best = 0, run = 0;
  for (const d of days) {
    if (d.isToday) continue;
    run = d.pct >= SUCCESS_THRESHOLD ? run + 1 : 0;
    best = Math.max(best, run);
  }
  let current = 0;
  const todayStat = days[days.length - 1];
  if (todayStat && todayStat.pct >= SUCCESS_THRESHOLD) current++;
  for (let d = addDays(today, -1); d >= data.startDate; d = addDays(d, -1)) {
    if (dayStat(data, d, now).pct >= SUCCESS_THRESHOLD) current++;
    else break;
  }
  return { current, best: Math.max(best, current) };
}
