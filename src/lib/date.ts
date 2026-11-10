import { DAY_ROLLOVER_HOUR, ROUTINE, type DayKey, type DayPlan } from "../data/routine";

const JS_TO_KEY: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

export const bn = (v: number | string) => String(v).replace(/\d/g, (d) => BN_DIGITS[+d]);

export function toISO(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// রাত ৪টার আগে হলে আগের দিনের রুটিন
export function routineDate(now = new Date()): string {
  const d = new Date(now);
  if (d.getHours() < DAY_ROLLOVER_HOUR) d.setDate(d.getDate() - 1);
  return toISO(d);
}

// রুটিন-দিনের শুরু থেকে কত মিনিট (রাত ১টা = ২৫×৬০)
export function minutesInRoutineDay(now = new Date()): number {
  const m = now.getHours() * 60 + now.getMinutes();
  return now.getHours() < DAY_ROLLOVER_HOUR ? m + 1440 : m;
}

export function planFor(iso: string): DayPlan {
  const key = JS_TO_KEY[fromISO(iso).getDay()];
  return ROUTINE.find((p) => p.key === key)!;
}

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function fmtTime(hhmm?: string): string {
  if (!hhmm) return "";
  let [h, m] = hhmm.split(":").map(Number);
  h = h % 24;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return bn(`${h12}:${String(m).padStart(2, "0")}`);
}

export function fmtDate(iso: string): string {
  const d = fromISO(iso);
  return `${bn(d.getDate())} ${BN_MONTHS[d.getMonth()]}`;
}

// শনিবার থেকে সপ্তাহ শুরু
export function weekStart(iso: string): string {
  const day = fromISO(iso).getDay(); // 6 = শনি
  const diff = (day + 1) % 7;
  return addDays(iso, -diff);
}

export function range(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}
