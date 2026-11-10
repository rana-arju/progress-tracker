import { useEffect, useRef, useState } from "react";
import type { Task } from "../data/routine";
import { quoteFor } from "../data/quotes";
import { addDays, bn, fmtDate, fmtTime, minutesInRoutineDay, planFor, routineDate, toMin } from "../lib/date";
import { dayStat, tracked } from "../lib/stats";
import type { AppData } from "../lib/storage";
import { Bar, Card, NavBtn, Pct, Tag, toneFor } from "./ui";

function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

const fmtDur = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${bn(h)} ঘণ্টা ${m ? bn(m) + " মিনিট" : ""}` : `${bn(m)} মিনিট`;
};

export function Today({ data, setData }: { data: AppData; setData: (f: (d: AppData) => AppData) => void }) {
  const now = useNow();
  const today = routineDate(now);
  const [date, setDate] = useState(today);
  const plan = planFor(date);
  const stat = dayStat(data, date, now);
  const doneIds = new Set(data.logs[date] ?? []);
  const missedIds = new Set(stat.missed.map((t) => t.id));
  const isToday = date === today;
  const nowMin = minutesInRoutineDay(now);

  const timed = plan.tasks.filter((t) => t.start && t.end);
  const current = isToday ? timed.find((t) => toMin(t.start!) <= nowMin && nowMin < toMin(t.end!)) : undefined;
  const next = isToday ? timed.find((t) => toMin(t.start!) > nowMin) : undefined;

  const toggle = (id: string) =>
    setData((d) => {
      const set = new Set(d.logs[date] ?? []);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...d, logs: { ...d.logs, [date]: [...set] } };
    });

  // ব্রাউজার নোটিফিকেশন: প্রতিটা কাজ শুরুর সময় (ট্যাব খোলা থাকলে)
  const [notify, setNotify] = useState(() => typeof Notification !== "undefined" && Notification.permission === "granted");
  const lastNotified = useRef<string>("");
  useEffect(() => {
    if (!notify || !isToday) return;
    const starting = timed.find((t) => toMin(t.start!) === nowMin);
    if (starting && lastNotified.current !== starting.id + today) {
      lastNotified.current = starting.id + today;
      try { new Notification("এখন শুরু করার সময়", { body: starting.title }); } catch { /* ignore */ }
    }
  }, [nowMin, notify, isToday, timed, today]);
  const askNotify = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setNotify(p === "granted");
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-lg font-semibold leading-relaxed text-balance">“{quoteFor(now)}”</p>
      </Card>

      {isToday && (
        <Card title={current ? "এখন যা করার সময়" : "পরের কাজ"}
          right={<button type="button" onClick={askNotify} disabled={notify}
            className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-60">
            {notify ? "রিমাইন্ডার চালু" : "রিমাইন্ডার চালু করো"}</button>}>
          {current ? (
            <div className="flex flex-col gap-2">
              <div className="text-xl font-bold">{current.title}<Tag cat={current.cat} /></div>
              <div className="text-sm text-muted">
                {fmtTime(current.start)}–{fmtTime(current.end)} · আর {fmtDur(toMin(current.end!) - nowMin)} বাকি
              </div>
              {current.track !== false && !doneIds.has(current.id) && (
                <button type="button" onClick={() => toggle(current.id)}
                  className="mt-1 self-start rounded-lg bg-accent px-4 py-2 font-semibold text-on-accent">শেষ করেছি ✓</button>
              )}
              {current.track !== false && doneIds.has(current.id) && <div className="font-semibold text-accent">শেষ হয়েছে। দারুণ!</div>}
            </div>
          ) : next ? (
            <div>
              <div className="text-lg font-semibold">{next.title}<Tag cat={next.cat} /></div>
              <div className="text-sm text-muted">{fmtTime(next.start)}-এ শুরু · আর {fmtDur(toMin(next.start!) - nowMin)}</div>
            </div>
          ) : (
            <p className="text-muted">আজকের নির্ধারিত সময়ের কাজ শেষ। এখন ঘুম।</p>
          )}
        </Card>
      )}

      <Card
        title={`${plan.name}, ${fmtDate(date)}`}
        sub={<>আজকের ফোকাস: <b className="text-fg">{plan.focus}</b></>}
        right={
          <div className="flex gap-2">
            <NavBtn label="আগের দিন" onClick={() => setDate(addDays(date, -1))} disabled={date <= data.startDate}>← আগের</NavBtn>
            <NavBtn label="পরের দিন" onClick={() => setDate(addDays(date, 1))} disabled={date >= today}>পরের →</NavBtn>
          </div>
        }
      >
        {!isToday && <p className="mb-3 rounded-lg bg-bg px-3 py-2 text-sm text-muted">আগের দিন দেখছ। ভুলে টিক না দিয়ে থাকলে এখন দিতে পারো।</p>}
        <ul className="flex flex-col">
          {plan.tasks.map((t: Task) => {
            const done = doneIds.has(t.id), missed = missedIds.has(t.id), canTick = t.track !== false;
            const active = current?.id === t.id;
            return (
              <li key={t.id} className={`grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-t border-line py-3 first:border-t-0 sm:grid-cols-[auto_96px_1fr] ${active ? "rounded-lg bg-accent-soft px-2" : ""}`}>
                {canTick ? (
                  <input id={`t-${t.id}`} type="checkbox" checked={done} onChange={() => toggle(t.id)}
                    className="mt-1 size-5 cursor-pointer accent-[var(--accent)]" aria-label={t.title} />
                ) : <span className="mt-1 size-5" aria-hidden />}
                <label htmlFor={`t-${t.id}`} className="num text-sm text-muted sm:pt-0.5">
                  {t.start ? `${fmtTime(t.start)}–${fmtTime(t.end)}` : "দিনের মাঝে"}
                </label>
                <div className="col-start-2 min-w-0 sm:col-start-3 sm:row-start-1">
                  <span className={`font-semibold ${done ? "text-muted line-through" : ""}`}>{t.title}</span>
                  <Tag cat={t.cat} />
                  {missed && <span className="ml-2 text-xs font-semibold text-red-600 dark:text-red-400">বাদ পড়েছে</span>}
                  {t.detail && <p className="text-sm text-muted">{t.detail}</p>}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center gap-3 text-sm text-muted">
          <span className="num shrink-0">{bn(stat.done)}/{bn(stat.total)} · <Pct v={stat.pct} /></span>
          <Bar pct={stat.pct} tone={toneFor(stat.pct)} />
        </div>
      </Card>

      <Card title="আজ কী শিখলাম বা কী সমস্যা সমাধান করলাম" sub="এক-দুই লাইন। এগুলোই পরে ইন্টারভিউয়ের গল্প হবে।">
        <textarea id={`note-${date}`} rows={3} value={data.notes[date] ?? ""}
          onChange={(e) => setData((d) => ({ ...d, notes: { ...d.notes, [date]: e.target.value } }))}
          className="w-full rounded-lg border border-line bg-bg p-3 text-base outline-none focus:border-accent"
          placeholder="যেমন: RAG-এ reranker যোগ করে ভুল উত্তর কমালাম…" />
      </Card>

      {tracked(plan.tasks).length > 0 && isToday && stat.missed.length > 0 && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          আজ এখন পর্যন্ত {bn(stat.missed.length)}টা কাজের সময় পার হয়ে গেছে। বাকি সময়টা কাজে লাগাও।
        </p>
      )}
    </div>
  );
}
