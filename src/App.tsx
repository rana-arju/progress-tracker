import { useRef, useState } from "react";
import { Today } from "./components/Today";
import { Lifetime, Missed, Monthly, Weekly } from "./components/Progress";
import { Targets } from "./components/Targets";
import { routineDate } from "./lib/date";
import { exportJSON, importJSON, useAppData } from "./lib/storage";

const TABS = [
  { k: "today", l: "আজ" },
  { k: "week", l: "সপ্তাহ" },
  { k: "month", l: "মাস" },
  { k: "life", l: "সারাজীবন" },
  { k: "missed", l: "বাদ পড়া" },
  { k: "targets", l: "লক্ষ্য" },
] as const;
type TabKey = (typeof TABS)[number]["k"];

export default function App() {
  const [data, setData] = useAppData();
  const [tab, setTab] = useState<TabKey>("today");
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (f?: File) => {
    if (!f) return;
    try {
      const d = await importJSON(f);
      setData(() => d);
      setMsg("Backup থেকে সব ডেটা ফিরে এসেছে।");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "ফাইলটা পড়া গেল না।");
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-16 pt-6">
      <header>
        <h1 className="text-2xl font-bold">রুটিন ট্র্যাকার</h1>
        <p className="text-sm text-muted">English · AI Engineer প্রজেক্ট · ইন্টারভিউ · চাকরির আবেদন</p>
      </header>

      <nav className="sticky top-0 z-10 -mx-4 flex gap-1.5 overflow-x-auto bg-bg/95 px-4 py-2 backdrop-blur" aria-label="ভিউ">
        {TABS.map((t) => (
          <button key={t.k} type="button" onClick={() => setTab(t.k)} aria-current={tab === t.k ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold ${tab === t.k ? "border-accent bg-accent text-on-accent" : "border-line bg-surface"}`}>
            {t.l}
          </button>
        ))}
      </nav>

      <main>
        {tab === "today" && <Today data={data} setData={setData} />}
        {tab === "week" && <Weekly data={data} />}
        {tab === "month" && <Monthly data={data} />}
        {tab === "life" && <Lifetime data={data} />}
        {tab === "missed" && <Missed data={data} />}
        {tab === "targets" && <Targets data={data} setData={setData} />}
      </main>

      <footer className="mt-4 flex flex-col gap-3 border-t border-line pt-4 text-sm text-muted">
        <p>সব ডেটা শুধু এই ব্রাউজারে সেভ থাকে। মাঝে মাঝে backup নিয়ে রাখো, ব্রাউজারের ডেটা মুছলে হারিয়ে যাবে।</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportJSON(data)} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-fg">Backup ডাউনলোড</button>
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-fg">Backup থেকে ফেরাও</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
          {!confirmReset ? (
            <button type="button" onClick={() => setConfirmReset(true)} className="rounded-lg border border-red-400 px-3 py-1.5 text-red-700 dark:text-red-300">সব মুছে নতুন করে শুরু</button>
          ) : (
            <>
              <button type="button" onClick={() => { setData(() => ({ version: 1, startDate: routineDate(), logs: {}, notes: {}, targets: {} })); setConfirmReset(false); setMsg("সব মুছে নতুন করে শুরু হয়েছে।"); }}
                className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white">হ্যাঁ, সব মুছে ফেলো</button>
              <button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg border border-line px-3 py-1.5 text-fg">বাতিল</button>
            </>
          )}
        </div>
        {msg && <p role="status" className="text-fg">{msg}</p>}
      </footer>
    </div>
  );
}
