import { Check, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  "Real-time team collaboration",
  "Intuitive task & project boards",
  "Seamless file sharing",
  "Enterprise-grade security",
];

const stats = [
  { value: "10k+", label: "Teams" },
  { value: "99.9%", label: "Uptime" },
  { value: "50M+", label: "Tasks Done" },
];

export function Hero() {
  return (
    <section className="relative flex items-center bg-linear-to-br from-slate-50 via-white to-indigo-50/50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-175 h-175 bg-linear-to-bl from-indigo-100/70 via-violet-50/50 to-transparent rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-125 h-125 bg-linear-to-tr from-blue-50/60 to-transparent rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.025)_1px,transparent_1px)] bg-size-[56px_56px]" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">

          {/* ── Left: Text ── */}
          <div className="flex flex-col">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 self-start bg-white border border-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 shadow-sm shadow-indigo-100/60">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              All-in-one team workspace
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              <span className="text-slate-900">Where Teams </span>
              <br />
              <span className="bg-linear-to-r from-indigo-600 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                Collaborate
              </span>
              <span className="text-slate-900"> &amp; </span>
              <br />
              <span className="bg-linear-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                Communicate
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-slate-500 text-sm sm:text-base lg:text-lg leading-relaxed mb-10 max-w-115">
              Bring your entire team together — real-time messaging, smart task
              boards, and file sharing in one beautiful, unified workspace.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              {features.map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-xl px-4 py-3 shadow-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-linear-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 shadow shadow-indigo-200">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-slate-700 font-medium leading-snug">{f}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3 flex-wrap mb-12">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-linear-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-300/50 active:scale-95"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all border border-slate-200 shadow-sm active:scale-95"
              >
                Sign In
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8 pt-8 border-t border-slate-100/80">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: App Mockup ── */}
          <div className="relative hidden lg:block">

            {/* Glow halo */}
            <div className="absolute inset-8 bg-linear-to-br from-indigo-400/25 to-violet-400/25 rounded-3xl blur-3xl" />

            {/* Browser window */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-indigo-200/50 border border-slate-200/60 bg-white">

              {/* Title bar */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-linear-to-r from-indigo-700 to-violet-700">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-400/90" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/90" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/90" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white/15 rounded-md px-4 py-1.5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    <div className="h-2 w-32 bg-white/30 rounded-full" />
                  </div>
                </div>
              </div>

              {/* App body */}
              <div className="flex" style={{ height: 340 }}>

                {/* Sidebar */}
                <div className="w-12 bg-linear-to-b from-indigo-700 to-violet-800 flex flex-col items-center pt-4 gap-2 shrink-0">
                  <div className="w-7 h-7 bg-white/25 rounded-lg mb-2 flex items-center justify-center">
                    <div className="w-3.5 h-3.5 bg-white rounded-sm opacity-90" />
                  </div>
                  {[
                    "M4 6h16M4 12h16M4 18h7",
                    "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
                    "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
                    "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
                  ].map((d, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? "bg-white/20 ring-1 ring-white/30" : ""}`}
                    >
                      <svg className="w-3.5 h-3.5 text-white/75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                      </svg>
                    </div>
                  ))}
                </div>

                {/* Main content area */}
                <div className="flex-1 bg-slate-50 p-4 flex flex-col gap-3 overflow-hidden">

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 bg-slate-800 rounded-full" />
                      <div className="h-2 w-16 bg-slate-300 rounded-full" />
                    </div>
                    <div className="h-7 w-20 bg-linear-to-r from-indigo-500 to-violet-500 rounded-lg shadow-sm shadow-indigo-200" />
                  </div>

                  {/* Kanban */}
                  <div className="grid grid-cols-3 gap-2.5 flex-1 min-h-0">

                    {/* To Do */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2.5 overflow-hidden">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <div className="h-2 w-10 bg-slate-200 rounded-full" />
                      </div>
                      {[
                        { tag: "UI", tagColor: "bg-blue-100 text-blue-700", lines: [100, 75] },
                        { tag: null as null, tagColor: "", lines: [100, 55] },
                        { tag: null as null, tagColor: "", lines: [100] },
                      ].map((card, i) => (
                        <div key={i} className="bg-slate-50 rounded-lg p-2 border border-slate-100 space-y-1.5 mb-1.5">
                          {card.lines.map((w, j) => (
                            <div key={j} className="h-1.5 bg-slate-200 rounded-full" style={{ width: `${w}%` }} />
                          ))}
                          {card.tag && (
                            <div className={`inline-flex h-4 px-1.5 rounded text-[7px] font-bold items-center mt-0.5 ${card.tagColor}`}>{card.tag}</div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* In Progress */}
                    <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-2.5 overflow-hidden">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <div className="h-2 w-14 bg-slate-200 rounded-full" />
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2 border border-amber-100 space-y-1.5 mb-1.5">
                        <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                        <div className="h-1.5 w-2/3 bg-slate-200 rounded-full" />
                        <div className="h-1.5 bg-amber-100 rounded-full w-full mt-1 overflow-hidden">
                          <div className="h-full w-[65%] bg-linear-to-r from-amber-400 to-orange-400 rounded-full" />
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2 border border-amber-100 space-y-1.5 mb-1.5">
                        <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                        <div className="inline-flex h-4 px-1.5 rounded text-[7px] font-bold items-center bg-amber-100 text-amber-700 mt-0.5">High</div>
                      </div>
                    </div>

                    {/* Done */}
                    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-2.5 overflow-hidden">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <div className="h-2 w-8 bg-slate-200 rounded-full" />
                      </div>
                      {[
                        { lines: [100, 75], tag: "Done ✓" },
                        { lines: [100, 55], tag: null as null },
                      ].map((card, i) => (
                        <div key={i} className="bg-emerald-50 rounded-lg p-2 border border-emerald-100 space-y-1.5 mb-1.5 opacity-80">
                          {card.lines.map((w, j) => (
                            <div key={j} className="h-1.5 bg-emerald-200 rounded-full" style={{ width: `${w}%` }} />
                          ))}
                          {card.tag && (
                            <div className="inline-flex h-4 px-1.5 rounded text-[7px] font-bold items-center bg-emerald-100 text-emerald-700 mt-0.5">{card.tag}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity chart */}
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-3 py-2 flex items-end gap-1" style={{ height: 52 }}>
                    {[28, 48, 36, 62, 44, 78, 55, 68, 40, 85].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-all"
                        style={{
                          height: `${h}%`,
                          background: i >= 6
                            ? "linear-gradient(to top, #6366f1, #8b5cf6)"
                            : "#e0e7ff",
                        }}
                      />
                    ))}
                  </div>

                </div>
              </div>
            </div>

            {/* Floating pill: Task completed */}
            <div className="absolute -top-5 -right-5 bg-white rounded-2xl shadow-xl border border-slate-100/80 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200/60">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">Task completed</p>
                <p className="text-[10px] text-slate-400 mt-1">Sprint 3 · Just now</p>
              </div>
            </div>

            {/* Floating pill: Sprint progress */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-6 bg-white rounded-2xl shadow-xl border border-slate-100/80 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                <p className="text-[10px] font-bold text-slate-700">Sprint Progress</p>
              </div>
              <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-[72%] bg-linear-to-r from-indigo-500 to-violet-500 rounded-full" />
              </div>
              <p className="text-right text-[10px] font-semibold text-indigo-600 mt-1">72%</p>
            </div>

            {/* Floating pill: Team */}
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl border border-slate-100/80 px-4 py-3 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  "from-indigo-400 to-indigo-600",
                  "from-pink-400 to-rose-500",
                  "from-amber-400 to-orange-400",
                  "from-emerald-400 to-teal-500",
                ].map((g, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full bg-linear-to-br ${g} border-2 border-white shadow-sm`} />
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">4 active now</p>
                <p className="text-[10px] text-slate-400 mt-1">Collaborating live</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
