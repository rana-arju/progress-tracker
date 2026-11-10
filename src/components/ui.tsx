import type { ReactNode } from "react";
import { CATEGORIES, type Category } from "../data/routine";
import { bn } from "../lib/date";

export function Card({ title, sub, children, right }: { title?: string; sub?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      {(title || right) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {sub && <p className="text-sm text-muted">{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tag({ cat }: { cat: Category }) {
  const c = CATEGORIES[cat];
  return <span className={`ml-2 inline-block rounded-full px-2 py-0.5 align-middle text-xs font-semibold ${c.cls}`}>{c.label}</span>;
}

export function Bar({ pct, tone = "accent" }: { pct: number; tone?: "accent" | "warn" | "bad" }) {
  const color = tone === "bad" ? "bg-red-500" : tone === "warn" ? "bg-amber-500" : "bg-accent";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
      <div className={`h-full rounded-full ${color} transition-[width] motion-reduce:transition-none`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export const toneFor = (pct: number) => (pct >= 80 ? "accent" : pct >= 50 ? "warn" : "bad") as "accent" | "warn" | "bad";

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="text-sm text-muted">{label}</div>
      <div className="num mt-1 text-2xl font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Pct({ v }: { v: number }) {
  return <>{bn(v)}%</>;
}

export function NavBtn({ onClick, disabled, children, label }: { onClick: () => void; disabled?: boolean; children: ReactNode; label: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled}
      className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-bg disabled:opacity-40">
      {children}
    </button>
  );
}
