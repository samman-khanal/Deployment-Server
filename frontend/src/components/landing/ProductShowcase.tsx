export function ProductShowcase() {
  return (
    <section className="py-10 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Designed for Teams of All Sizes
          </h2>
          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto">
            From startups to enterprises, CollabSpace scales with your team's needs
          </p>
        </div>

        {/* Product Screenshot - hidden on mobile to prevent overflow */}
        <div className="mb-10 sm:mb-16 hidden sm:block">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Browser Chrome */}
            <div className="bg-linear-to-r from-blue-600 to-blue-800 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
            </div>
            
            {/* App Interface Mockup */}
            <div className="flex bg-slate-50 min-h-100">
              {/* Sidebar */}
              <div className="w-64 bg-blue-900 p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold mb-6 px-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
                  <span className="text-sm">Team Workspace</span>
                </div>
                {['#general', '#design', '#development', '#marketing', '#sales', '#support'].map((channel, i) => (
                  <div key={i} className={`px-3 py-2.5 rounded-lg text-white/90 text-sm ${i === 0 ? 'bg-blue-800' : 'hover:bg-blue-800/50'} transition-colors`}>
                    {channel}
                  </div>
                ))}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-8 bg-white">
                {/* Task Board */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {/* To Do Column */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-700 mb-3">To Do</div>
                    <div className="bg-pink-300 rounded-lg p-4 h-24 shadow-sm"></div>
                    <div className="bg-pink-200 rounded-lg p-4 h-28 shadow-sm"></div>
                  </div>
                  {/* In Progress Column */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-700 mb-3">In Progress</div>
                    <div className="bg-yellow-300 rounded-lg p-4 h-28 shadow-sm"></div>
                    <div className="bg-yellow-200 rounded-lg p-4 h-24 shadow-sm"></div>
                  </div>
                  {/* Review Column */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-700 mb-3">Review</div>
                    <div className="bg-orange-300 rounded-lg p-4 h-24 shadow-sm"></div>
                    <div className="bg-orange-200 rounded-lg p-4 h-20 shadow-sm"></div>
                  </div>
                  {/* Done Column */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-700 mb-3">Done</div>
                    <div className="bg-green-300 rounded-lg p-4 h-28 shadow-sm"></div>
                  </div>
                </div>

                {/* Analytics Charts */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 h-32 border border-slate-200 flex items-end">
                    <div className="w-full h-20 bg-linear-to-t from-orange-400 to-orange-300 rounded"></div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 h-32 border border-slate-200 flex items-end">
                    <div className="w-full flex items-end justify-around gap-1">
                      {[60, 80, 50, 90, 70, 85, 95].map((height, i) => (
                        <div key={i} className="flex-1 bg-linear-to-t from-blue-400 to-blue-300 rounded-t" style={{ height: `${height}%` }}></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 h-32 border border-slate-200 flex items-end">
                    <div className="w-full h-24 bg-linear-to-t from-red-400 to-red-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto">
          <StatCard number="50k+" label="Active Users" />
          <StatCard number="98%" label="Satisfaction Rate" />
          <StatCard number="24/7" label="Support" />
        </div>
      </div>
    </section>
  );
}

interface StatCardProps {
  number: string;
  label: string;
}

function StatCard({ number, label }: StatCardProps) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-4xl font-bold text-indigo-600 mb-1 sm:mb-2">{number}</div>
      <div className="text-xs sm:text-base text-slate-600 font-medium">{label}</div>
    </div>
  );
}