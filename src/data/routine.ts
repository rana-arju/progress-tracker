// তোমার রুটিন এখানে বদলাও। সময় ২৪-ঘণ্টা ফরম্যাটে।
// রাত ১২টার পরের সময় ২৪-এর বেশি লেখো (যেমন রাত ১টা = "25:00"),
// কারণ সেটা আগের দিনের রুটিনেরই অংশ।

export type Category = "en" | "pr" | "iq" | "ap" | "re";
export type DayKey = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

export interface Task {
  id: string;
  start?: string; // "HH:MM"; না থাকলে দিনের যেকোনো সময়
  end?: string;
  title: string;
  detail?: string;
  cat: Category;
  track?: boolean; // false হলে টিক দেওয়া বা হিসাবে আসবে না (বিশ্রাম)
}

export interface DayPlan {
  key: DayKey;
  name: string;
  short: string;
  focus: string;
  kind: "work" | "light" | "off";
  tasks: Task[];
}

export const CATEGORIES: Record<Category, { label: string; cls: string }> = {
  en: { label: "English", cls: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  pr: { label: "প্রজেক্ট", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  iq: { label: "ইন্টারভিউ", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  ap: { label: "আবেদন", cls: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  re: { label: "বিশ্রাম", cls: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
};

const commute: Task[] = [
  { id: "commute", title: "যাতায়াতে ইংরেজি tech podcast বা YouTube শোনো", cat: "en" },
  { id: "lunch", title: "লাঞ্চের পর ১৫ মিনিট quick-fire প্রশ্ন", detail: "গাইডের Part 23–25", cat: "iq" },
];

function workday(topic: string, parts: string): Task[] {
  return [
    ...commute,
    { id: "home", start: "17:30", end: "19:30", title: "বাসায় ফেরা, ১ ঘণ্টা ঘুম, খাওয়া", cat: "re", track: false },
    { id: "english", start: "20:00", end: "20:45", title: "ইংরেজিতে জোরে উত্তর দাও", detail: "আজকের টপিক থেকে ৮–১০টা প্রশ্ন, ১টা রেকর্ড করে শোনো", cat: "en" },
    { id: "project", start: "21:00", end: "23:30", title: "Nishchit প্রজেক্ট", detail: "দিনের সবচেয়ে কঠিন কাজ। ফোন দূরে, ছোট ছোট commit", cat: "pr" },
    { id: "break", start: "23:30", end: "23:45", title: "বিরতি", cat: "re", track: false },
    { id: "study", start: "23:45", end: "24:30", title: `টেকনিক্যাল প্রশ্ন: ${topic}`, detail: `গাইডের ${parts}`, cat: "iq" },
    { id: "apply", start: "24:30", end: "25:00", title: "২–৩টা চাকরির আবেদন", detail: "রোল অনুযায়ী CV, বা LinkedIn-এ referral মেসেজ", cat: "ap" },
    { id: "plan", start: "25:00", end: "25:30", title: "কালকের ৩টা কাজ লিখে ঘুম", cat: "re" },
  ];
}

export const ROUTINE: DayPlan[] = [
  { key: "sat", name: "শনিবার", short: "শনি", focus: "Frontend", kind: "work",
    tasks: workday("Frontend", "Part 1–6 (HTML, CSS, JS, TS, React, Redux, Next.js)") },
  { key: "sun", name: "রবিবার", short: "রবি", focus: "Backend ও Database", kind: "work",
    tasks: workday("Backend ও Database", "Part 7–8") },
  { key: "mon", name: "সোমবার", short: "সোম", focus: "Python, FastAPI ও DevOps", kind: "work",
    tasks: workday("Python, FastAPI ও DevOps", "Part 9–11") },
  { key: "tue", name: "মঙ্গলবার", short: "মঙ্গল", focus: "LLM ও RAG", kind: "work",
    tasks: workday("LLM ও RAG", "Part 12–13") },
  { key: "wed", name: "বুধবার", short: "বুধ", focus: "Agent, Eval, Safety", kind: "work",
    tasks: workday("Agent, Eval, Safety ও AI Design", "Part 14–16") },
  { key: "thu", name: "বৃহস্পতিবার", short: "বৃহঃ", focus: "হালকা দিন: Behavioral আর আবেদন", kind: "light",
    tasks: [
      ...commute,
      { id: "home", start: "17:30", end: "19:30", title: "বাসায় ফেরা, ১ ঘণ্টা ঘুম, খাওয়া", cat: "re", track: false },
      { id: "behavioral", start: "20:00", end: "21:00", title: "Behavioral উত্তর ইংরেজিতে", detail: "Part 21–22: Tell me about yourself, project walkthrough, STAR গল্প", cat: "en" },
      { id: "apply-week", start: "21:00", end: "22:00", title: "সপ্তাহের বাকি আবেদন", detail: "ফলো-আপ ইমেইল, tracking sheet আপডেট", cat: "ap" },
      { id: "coding", start: "22:00", end: "23:00", title: "Coding প্রশ্ন অনুশীলন", detail: "Part 18 থেকে ২–৩টা সমস্যা নিজে লেখো", cat: "iq" },
      { id: "rest", start: "23:00", end: "24:00", title: "বিশ্রাম, তাড়াতাড়ি ঘুম", cat: "re", track: false },
    ] },
  { key: "fri", name: "শুক্রবার", short: "শুক্র", focus: "ছুটি: বড় কাজ আর বিশ্রাম", kind: "off",
    tasks: [
      { id: "big-feature", start: "10:00", end: "13:00", title: "Nishchit-এর বড় ফিচার বা deploy", detail: "সপ্তাহে একটা ফিচার শেষ করার লক্ষ্য", cat: "pr" },
      { id: "mock", start: "15:00", end: "16:00", title: "ইংরেজিতে mock interview", detail: "Claude বা বন্ধুর সাথে ২০–৩০ মিনিট, তারপর ফিডব্যাক", cat: "en" },
      { id: "review", start: "17:00", end: "18:00", title: "সাপ্তাহিক রিভিউ", detail: "লক্ষ্য দেখো, CV আপডেট, পরের সপ্তাহের ৩টা মূল কাজ", cat: "ap" },
      { id: "family", start: "18:00", end: "23:00", title: "বিশ্রাম, পরিবার, ঘোরাঘুরি", detail: "এটা বাদ দিলে ২–৩ সপ্তাহে সব থেমে যাবে", cat: "re", track: false },
    ] },
];

export interface TargetDef { key: string; label: string; goal: number; step?: number }

export const WEEKLY_TARGETS: TargetDef[] = [
  { key: "feat", label: "Nishchit ফিচার শেষ", goal: 1 },
  { key: "q", label: "প্রশ্ন জোরে বলে অনুশীলন", goal: 100, step: 10 },
  { key: "apply", label: "মানসম্পন্ন আবেদন", goal: 15 },
  { key: "rec", label: "ইংরেজি রেকর্ডিং", goal: 5 },
  { key: "mock", label: "Mock interview", goal: 1 },
];

// রাত ৪টার আগে পর্যন্ত আগের দিনের রুটিন চলছে বলে ধরা হয়
export const DAY_ROLLOVER_HOUR = 4;

// এই শতাংশ বা তার বেশি কাজ হলে দিনটা "সফল" (streak-এর জন্য)
export const SUCCESS_THRESHOLD = 80;
