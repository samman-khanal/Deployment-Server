import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Trello,
  Zap,
  Users,
  LayoutGrid,
  CheckCircle,
} from "lucide-react";

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-indigo-800 via-indigo-800 to-purple-800 p-8 xl:p-12 flex-col justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-lg mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <div className="flex gap-0.5">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <Trello className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <span className="text-2xl font-semibold text-white">
              CollabSpace
            </span>
          </Link>

          {/* Tagline */}
          <div className="mb-10">
            <h1 className="text-3xl xl:text-4xl font-semibold text-white mb-3 leading-tight">
              Chat, plan, and ship — together.
            </h1>
            <p className="text-base text-indigo-100">
              The all-in-one workspace where teams communicate and collaborate
              seamlessly.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-10">
            <FeatureItem
              icon={<MessageSquare className="w-5 h-5" />}
              text="Real-time messaging & channels"
            />
            <FeatureItem
              icon={<LayoutGrid className="w-5 h-5" />}
              text="Visual boards & task management"
            />
            <FeatureItem
              icon={<Users className="w-5 h-5" />}
              text="Team collaboration tools"
            />
            <FeatureItem
              icon={<Zap className="w-5 h-5" />}
              text="Instant notifications & updates"
            />
          </div>

          {/* Social Proof */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5">
            <div className="flex items-center gap-1.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-amber-400 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <p className="text-white/90 text-sm mb-2 leading-relaxed">
              "CollabSpace transformed how our remote team works. It's like
              having Slack and Trello in perfect harmony."
            </p>
            <p className="text-white/70 text-xs">
              — Sarah Chen, Product Manager at TechFlow
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-linear-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <div className="flex gap-0.5">
                <MessageSquare className="w-4 h-4 text-white" />
                <Trello className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold text-slate-900">
              CollabSpace
            </span>
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-10">
            {title && subtitle && (
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                  {title}
                </h2>
                <p className="text-sm sm:text-base text-slate-600">{subtitle}</p>
              </div>
            )}

            {children}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Protected by enterprise-grade encryption • Not for storing PII or
            sensitive data
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-white">
      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-sm font-medium">{text}</span>
      <CheckCircle className="w-4 h-4 ml-auto text-green-300" />
    </div>
  );
}
