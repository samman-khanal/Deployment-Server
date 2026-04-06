import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    company: "TechFlow Inc.",
    quote: "CollabSpace completely transformed how our remote team collaborates. The integration of chat and project boards is seamless and intuitive.",
    avatar: "SC",
    avatarBg: "bg-indigo-600",
  },
  {
    name: "Marcus Rodriguez",
    role: "Engineering Lead",
    company: "DevStudio",
    quote: "Finally, a platform that combines communication and task management without feeling bloated. Our team's productivity has increased by 40%.",
    avatar: "MR",
    avatarBg: "bg-purple-600",
  },
  {
    name: "Emily Watson",
    role: "Startup Founder",
    company: "GrowthLabs",
    quote: "The onboarding was incredibly smooth, and within hours our entire team was up and running. Best collaboration tool we've ever used!",
    avatar: "EW",
    avatarBg: "bg-green-600",
  },
];

export function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((p) => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-10 sm:py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Loved by Teams Worldwide
          </h2>
        </div>

        {/* Desktop: 3-card grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </div>

        {/* Mobile: carousel */}
        <div className="md:hidden">
          <TestimonialCard {...testimonials[active]} />
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setActive((p) => (p - 1 + testimonials.length) % testimonials.length)}
              className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === active ? "bg-indigo-600" : "bg-slate-300"}`}
                />
              ))}
            </div>
            <button
              onClick={() => setActive((p) => (p + 1) % testimonials.length)}
              className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar: string;
  avatarBg: string;
}

function TestimonialCard({
  name,
  role,
  company,
  quote,
  avatar,
  avatarBg,
}: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow border border-slate-100">
      {/* Avatar and Info */}
      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div
          className={`w-9 h-9 sm:w-12 sm:h-12 ${avatarBg} rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold shrink-0`}
        >
          {avatar}
        </div>
        <div>
          <div className="text-sm sm:text-base font-semibold text-slate-900">{name}</div>
          <div className="text-xs sm:text-sm text-slate-600">{role}</div>
        </div>
      </div>

      {/* Company */}
      <div className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">{company}</div>

      {/* Quote */}
      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{quote}</p>

      {/* Stars */}
      <div className="flex gap-1 mt-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    </div>
  );
}
