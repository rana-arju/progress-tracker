import { WEEKLY_TARGETS } from "../data/routine";
import { addDays, bn, fmtDate, routineDate, weekStart } from "../lib/date";
import type { AppData } from "../lib/storage";
import { Bar, Card, toneFor } from "./ui";

export function Targets({ data, setData }: { data: AppData; setData: (f: (d: AppData) => AppData) => void }) {
  const wk = weekStart(routineDate());
  const cur = data.targets[wk] ?? {};
  const change = (key: string, delta: number) =>
    setData((d) => {
      const w = { ...(d.targets[wk] ?? {}) };
      w[key] = Math.max(0, (w[key] ?? 0) + delta);
      return { ...d, targets: { ...d.targets, [wk]: w } };
    });
  const past = Object.keys(data.targets).filter((w) => w < wk).sort().reverse();

  return (
    <div className="flex flex-col gap-4">
      <Card title="এই সপ্তাহের লক্ষ্য" sub={`${fmtDate(wk)} – ${fmtDate(addDays(wk, 6))} · কাজ শেষ হলে + চাপো`}>
        <div className="grid gap-3 sm:grid-cols-2">
          {WEEKLY_TARGETS.map((t) => {
            const v = cur[t.key] ?? 0, step = t.step ?? 1, pct = Math.round((v / t.goal) * 100);
            return (
              <div key={t.key} className="flex flex-col gap-2 rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{t.label}</span>
                  {v >= t.goal && <span className="text-sm font-semibold text-accent">✓ পূরণ</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label={`${t.label} কমাও`} onClick={() => change(t.key, -step)}
                    className="size-9 rounded-lg border border-line text-lg">−</button>
                  <output className="num min-w-20 text-center text-lg font-bold">{bn(v)}/{bn(t.goal)}</output>
                  <button type="button" aria-label={`${t.label} বাড়াও`} onClick={() => change(t.key, step)}
                    className="size-9 rounded-lg bg-accent text-lg text-on-accent">+</button>
                </div>
                <Bar pct={pct} tone={toneFor(pct)} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="আগের সপ্তাহগুলো">
        {past.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="py-2 pr-3 font-medium">সপ্তাহ</th>
                  {WEEKLY_TARGETS.map((t) => <th key={t.key} className="py-2 pr-3 font-medium">{t.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {past.map((w) => (
                  <tr key={w} className="border-t border-line">
                    <td className="py-2 pr-3">{fmtDate(w)}</td>
                    {WEEKLY_TARGETS.map((t) => {
                      const v = data.targets[w]?.[t.key] ?? 0;
                      return <td key={t.key} className={`num py-2 pr-3 ${v >= t.goal ? "font-semibold text-accent" : "text-red-700 dark:text-red-300"}`}>{bn(v)}/{bn(t.goal)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted">প্রথম সপ্তাহ শেষ হলে এখানে হিসাব দেখাবে।</p>}
      </Card>
    </div>
  );
}
