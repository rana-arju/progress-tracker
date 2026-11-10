import { useState } from "react";
import { CATEGORIES, SUCCESS_THRESHOLD, type Category } from "../data/routine";
import { addDays, BN_MONTHS, bn, fmtDate, fromISO, planFor, routineDate, toISO, weekStart } from "../lib/date";
import { dayStat, rangeStat, streaks, type RangeStat } from "../lib/stats";
import type { AppData } from "../lib/storage";
import { Bar, Card, NavBtn, Pct, Stat, toneFor } from "./ui";

function CategoryBars({ s }: { s: RangeStat }) {
  const cats = (Object.keys(CATEGORIES) as Category[]).filter((c) => s.byCat[c].total > 0);
  return (
    <div className="flex flex-col gap-2.5">
      {cats.map((c) => {
        const v = s.byCat[c], pct = Math.round((v.done / v.total) * 100);
        return (
          <div key={c} className="grid grid-cols-[88px_1fr_70px] items-center gap-3 text-sm">
            <span>{CATEGORIES[c].label}</span>
            <Bar pct={pct} tone={toneFor(pct)} />
            <span className="num text-right text-muted">{bn(v.done)}/{bn(v.total)}</span>
          </div>
        );
      })}
    </div>
  );
}

function TopMissed({ s }: { s: RangeStat }) {
  if (!s.topMissed.length) return <p className="text-sm text-muted">এই সময়ে কোনো কাজ বাদ পড়েনি। চমৎকার!</p>;
  return (
    <ol className="flex flex-col gap-2 text-sm">
      {s.topMissed.map((m) => (
        <li key={m.title} className="flex justify-between gap-3 border-b border-line pb-2 last:border-0">
          <span className="min-w-0">{m.title}</span>
          <span className="num shrink-0 font-semibold text-red-600 dark:text-red-400">{bn(m.count)} বার</span>
        </li>
      ))}
    </ol>
  );
}

export function Weekly({ data }: { data: AppData }) {
  const today = routineDate();
  const [start, setStart] = useState(weekStart(today));
  const end = addDays(start, 6);
  const s = rangeStat(data, start, end);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="flex flex-col gap-4">
      <Card title="সাপ্তাহিক অগ্রগতি" sub={`${fmtDate(start)} – ${fmtDate(end)}`}
        right={<div className="flex gap-2">
          <NavBtn label="আগের সপ্তাহ" onClick={() => setStart(addDays(start, -7))} disabled={end < data.startDate}>←</NavBtn>
          <NavBtn label="পরের সপ্তাহ" onClick={() => setStart(addDays(start, 7))} disabled={addDays(start, 7) > today}>→</NavBtn>
        </div>}>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="মোট কাজ শেষ" value={<Pct v={s.pct} />} hint={`${bn(s.done)}/${bn(s.total)}`} />
          <Stat label="সফল দিন" value={bn(s.successDays)} hint={`${bn(SUCCESS_THRESHOLD)}% বা বেশি`} />
          <Stat label="বাদ পড়া কাজ" value={bn(s.days.reduce((a, d) => a + d.missed.length, 0))} />
        </div>
        <div className="flex items-end gap-2" style={{ height: 150 }}>
          {days.map((d) => {
            const ds = dayStat(data, d);
            const show = !ds.future && !ds.beforeStart;
            return (
              <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="num text-xs text-muted">{show ? `${bn(ds.pct)}%` : ""}</span>
                <div className="flex w-full flex-1 items-end overflow-hidden rounded-md bg-line">
                  <div className={`w-full ${ds.pct >= 80 ? "bg-accent" : ds.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ height: show ? `${Math.max(ds.pct, 3)}%` : 0 }} />
                </div>
                <span className={`text-xs ${ds.isToday ? "font-bold text-accent" : "text-muted"}`}>{planFor(d).short}</span>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="ধরন অনুযায়ী"><CategoryBars s={s} /></Card>
      <Card title="এই সপ্তাহে সবচেয়ে বেশি বাদ পড়েছে"><TopMissed s={s} /></Card>
    </div>
  );
}

export function Monthly({ data }: { data: AppData }) {
  const today = routineDate();
  const t = fromISO(today);
  const [ym, setYm] = useState({ y: t.getFullYear(), m: t.getMonth() });
  const first = toISO(new Date(ym.y, ym.m, 1));
  const last = toISO(new Date(ym.y, ym.m + 1, 0));
  const s = rangeStat(data, first, last);
  const lead = (fromISO(first).getDay() + 1) % 7; // শনিবার থেকে কলাম শুরু
  const daysInMonth = fromISO(last).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(ym.y, ym.m, i + 1)))];
  const shift = (n: number) => setYm(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const startD = fromISO(data.startDate);
  const canPrev = new Date(ym.y, ym.m, 1) > new Date(startD.getFullYear(), startD.getMonth(), 1);
  const canNext = new Date(ym.y, ym.m + 1, 1) <= t;
  const heads = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র"];

  return (
    <div className="flex flex-col gap-4">
      <Card title={`${BN_MONTHS[ym.m]} ${bn(ym.y)}`} sub="প্রতিটা ঘরের রং সেই দিনের কাজ শেষের হার"
        right={<div className="flex gap-2">
          <NavBtn label="আগের মাস" onClick={() => shift(-1)} disabled={!canPrev}>←</NavBtn>
          <NavBtn label="পরের মাস" onClick={() => shift(1)} disabled={!canNext}>→</NavBtn>
        </div>}>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="মোট কাজ শেষ" value={<Pct v={s.pct} />} hint={`${bn(s.done)}/${bn(s.total)}`} />
          <Stat label="সফল দিন" value={`${bn(s.successDays)}/${bn(s.countedDays)}`} />
          <Stat label="বাদ পড়া কাজ" value={bn(s.days.reduce((a, d) => a + d.missed.length, 0))} />
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {heads.map((h) => <div key={h} className="pb-1 text-xs text-muted">{h}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const ds = dayStat(data, d);
            const show = !ds.future && !ds.beforeStart;
            const bg = !show ? "bg-bg text-muted" : ds.pct >= 80 ? "bg-accent text-on-accent" : ds.pct >= 50 ? "bg-amber-400 text-amber-950" : ds.pct > 0 ? "bg-red-400 text-red-950" : "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200";
            return (
              <div key={d} title={show ? `${fmtDate(d)}: ${ds.pct}%` : fmtDate(d)}
                className={`num flex aspect-square flex-col items-center justify-center rounded-lg text-sm ${bg} ${ds.isToday ? "ring-2 ring-fg" : ""}`}>
                <span className="font-semibold">{bn(fromISO(d).getDate())}</span>
                {show && <span className="text-[10px] opacity-80">{bn(ds.pct)}%</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
          <span><i className="mr-1 inline-block size-3 rounded bg-accent align-middle" />৮০%+</span>
          <span><i className="mr-1 inline-block size-3 rounded bg-amber-400 align-middle" />৫০–৭৯%</span>
          <span><i className="mr-1 inline-block size-3 rounded bg-red-400 align-middle" />৫০%-এর কম</span>
        </div>
      </Card>
      <Card title="ধরন অনুযায়ী"><CategoryBars s={s} /></Card>
      <Card title="এই মাসে সবচেয়ে বেশি বাদ পড়েছে"><TopMissed s={s} /></Card>
    </div>
  );
}

export function Lifetime({ data }: { data: AppData }) {
  const today = routineDate();
  const s = rangeStat(data, data.startDate, today);
  const st = streaks(data);
  const totalDays = s.days.length;
  const notes = Object.entries(data.notes).filter(([, v]) => v.trim()).sort(([a], [b]) => (a < b ? 1 : -1));
  return (
    <div className="flex flex-col gap-4">
      <Card title="শুরু থেকে এখন পর্যন্ত" sub={`শুরু: ${fmtDate(data.startDate)} ${bn(fromISO(data.startDate).getFullYear())}`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="মোট দিন" value={bn(totalDays)} />
          <Stat label="মোট কাজ শেষ" value={<Pct v={s.pct} />} hint={`${bn(s.done)}/${bn(s.total)}`} />
          <Stat label="সফল দিন" value={`${bn(s.successDays)}/${bn(s.countedDays)}`} hint={`${bn(SUCCESS_THRESHOLD)}% বা বেশি`} />
          <Stat label="এখনকার streak" value={`${bn(st.current)} দিন`} />
          <Stat label="সেরা streak" value={`${bn(st.best)} দিন`} />
          <Stat label="মোট বাদ পড়া কাজ" value={bn(s.days.reduce((a, d) => a + d.missed.length, 0))} />
        </div>
      </Card>
      <Card title="ধরন অনুযায়ী"><CategoryBars s={s} /></Card>
      <Card title="সবচেয়ে বেশি যে কাজ বাদ পড়ে" sub="এগুলোর সময় বা পরিমাণ বদলানোর কথা ভাবো"><TopMissed s={s} /></Card>
      <Card title="শেখার নোট" sub="ইন্টারভিউয়ের আগে এগুলো পড়ে নাও">
        {notes.length ? (
          <ul className="flex flex-col gap-3 text-sm">
            {notes.slice(0, 30).map(([d, v]) => (
              <li key={d} className="border-b border-line pb-2 last:border-0">
                <div className="text-xs text-muted">{fmtDate(d)}</div>
                <div className="whitespace-pre-wrap">{v}</div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">এখনো কোনো নোট নেই। "আজ" ট্যাব থেকে প্রতিদিন এক লাইন লেখো।</p>}
      </Card>
    </div>
  );
}

export function Missed({ data }: { data: AppData }) {
  const today = routineDate();
  const [span, setSpan] = useState(14);
  const from = addDays(today, -(span - 1));
  const s = rangeStat(data, from, today);
  const days = [...s.days].reverse().filter((d) => d.missed.length);
  return (
    <Card title="বাদ পড়া কাজ" sub="কবে কোন কাজ বাদ গেছে"
      right={<div className="flex gap-1.5">
        {[7, 14, 30, 90].map((n) => (
          <button key={n} type="button" onClick={() => setSpan(n)}
            className={`rounded-lg border px-2.5 py-1 text-sm ${span === n ? "border-accent bg-accent text-on-accent" : "border-line"}`}>{bn(n)} দিন</button>
        ))}
      </div>}>
      {days.length ? (
        <ul className="flex flex-col gap-3">
          {days.map((d) => (
            <li key={d.date} className="border-b border-line pb-3 last:border-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-semibold">{planFor(d.date).name}, {fmtDate(d.date)}</span>
                <span className="num text-sm text-muted">{bn(d.pct)}% শেষ</span>
              </div>
              <ul className="flex flex-col gap-0.5 text-sm">
                {d.missed.map((t) => <li key={t.id} className="text-red-700 dark:text-red-300">✗ {t.title}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">এই সময়ে কোনো কাজ বাদ পড়েনি।</p>}
    </Card>
  );
}
