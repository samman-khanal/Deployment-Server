import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, LayoutGrid, Upload, Bell } from 'lucide-react';

export function Features() {
  return (
    <section id="features" className="py-10 sm:py-20 bg-slate-50 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Powerful Features for Modern Teams
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          <FeatureCard
            icon={<MessageSquare className="w-8 h-8 text-blue-600" />}
            iconBg="bg-blue-100"
            title="Real-Time Chat"
            description="Instant messaging with channels, threads, and direct messages for seamless communication."
          />
          <FeatureCard
            icon={<LayoutGrid className="w-8 h-8 text-purple-600" />}
            iconBg="bg-purple-100"
            title="Advanced Task Boards"
            description="Visual kanban boards with drag-and-drop to organize and track your team's work."
          />
          <FeatureCard
            icon={<Upload className="w-8 h-8 text-green-600" />}
            iconBg="bg-green-100"
            title="File Sharing"
            description="Upload, share, and collaborate on files with built-in version control and previews."
          />
          <FeatureCard
            icon={<Bell className="w-8 h-8 text-orange-600" />}
            iconBg="bg-orange-100"
            title="Smart Notifications"
            description="Stay updated with intelligent alerts that keep you informed without overwhelming you."
          />
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, iconBg, title, description }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className={`w-10 h-10 sm:w-16 sm:h-16 ${iconBg} rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
        {icon}
      </div>
      <h3 className="text-xs sm:text-base font-semibold text-slate-900 mb-1 sm:mb-2">{title}</h3>
      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{description}</p>
    </div>
  );
}