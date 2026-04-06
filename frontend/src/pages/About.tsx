import React from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";
import {
  Users,
  Target,
  Lightbulb,
  Heart,
  Rocket,
  Shield,
  Globe,
  Zap,
  Code2,
  Server,
  Palette,
  Database,
} from "lucide-react";

export default function About() {
  useDocumentTitle("About");
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white pt-8 pb-10 sm:pt-10 sm:pb-12 lg:pt-12 lg:pb-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6">
              Built for Teams Who{" "}
              <span className="text-indigo-600">Dream Big</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              We're on a mission to transform how teams collaborate. CollabSpace
              brings together the power of real-time communication and intuitive
              project management to help your team achieve extraordinary
              results.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <StatCard number="50K+" label="Active Teams" />
            <StatCard number="2M+" label="Tasks Completed" />
            <StatCard number="150+" label="Countries" />
            <StatCard number="99.9%" label="Uptime" />
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-10 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Mission */}
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full mb-4 sm:mb-6">
                <Target className="w-4 h-4" />
                <span className="text-sm font-semibold">Our Mission</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">
                Empowering Teams to Work Smarter
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mb-4 text-justify">
                At CollabSpace, we believe that great things happen when teams
                work together without barriers. Our mission is to break down
                silos and create a unified workspace where communication flows
                naturally and productivity thrives.
              </p>
              <p className="text-sm sm:text-base text-slate-600 text-justify">
                We're committed to building tools that are intuitive, powerful,
                and accessible to teams of all sizes—from startups to enterprise
                organizations.
              </p>
            </div>

            {/* Right - Visual Element */}
            <div className="relative">
              <div className="bg-linear-to-br from-indigo-800 to-purple-800 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded w-2/3 mb-2"></div>
                      <div className="h-2 bg-slate-100 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded w-4/5 mb-2"></div>
                      <div className="h-2 bg-slate-100 rounded w-2/5"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-yellow-400 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -top-4 -left-4 w-40 h-40 bg-blue-400 rounded-full opacity-20 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-10 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Our Core Values
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <ValueCard
              icon={<Users className="w-8 h-8 text-blue-600" />}
              iconBg="bg-blue-100"
              title="Collaboration First"
              description="We believe in the power of teamwork and building features that bring people together."
            />
            <ValueCard
              icon={<Lightbulb className="w-8 h-8 text-purple-600" />}
              iconBg="bg-purple-100"
              title="Innovation"
              description="We constantly push boundaries to deliver cutting-edge solutions for modern teams."
            />
            <ValueCard
              icon={<Heart className="w-8 h-8 text-green-600" />}
              iconBg="bg-green-100"
              title="Customer Focus"
              description="Your success is our success. We listen, learn, and adapt to serve you better."
            />
            <ValueCard
              icon={<Shield className="w-8 h-8 text-orange-600" />}
              iconBg="bg-orange-100"
              title="Trust & Security"
              description="We protect your data with enterprise-grade security and transparent practices."
            />
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-10 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Image/Visual */}
            <div className="relative order-2 lg:order-1">
              <div className="bg-linear-to-br from-blue-700 to-indigo-700 rounded-2xl p-1">
                <div className="bg-white rounded-xl p-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900 mb-2">
                          2023 - The Beginning
                        </div>
                        <div className="h-2 bg-slate-300 rounded w-full mb-1"></div>
                        <div className="h-2 bg-slate-300 rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900 mb-2">
                          2024 - Growth
                        </div>
                        <div className="h-2 bg-slate-300 rounded w-full mb-1"></div>
                        <div className="h-2 bg-slate-300 rounded w-4/5"></div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900 mb-2">
                          2025 - Expansion
                        </div>
                        <div className="h-2 bg-slate-300 rounded w-full mb-1"></div>
                        <div className="h-2 bg-slate-300 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4 sm:mb-6">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-semibold">Our Journey</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-6">
                From Frustration to Innovation
              </h2>
              <div className="space-y-3 text-justify">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  CollabSpace was born from a simple frustration: switching
                  between too many tools to get work done. Our founders
                  experienced firsthand the inefficiency of juggling multiple
                  platforms for chat, tasks, and project management.
                </p>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  In 2023, we set out to create a solution that would unify team
                  collaboration under one roof. We combined the best aspects of
                  communication tools like Slack with the organizational power
                  of project management platforms like Trello.
                </p>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Today, thousands of teams worldwide trust CollabSpace to keep
                  their work organized, their conversations flowing, and their
                  projects on track. We're just getting started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Meet the Team ─── */}
      <section className="py-10 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-14">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full mb-4">
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">The Builders</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">Meet the Team</h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              The passionate engineers and designers who built CollabSpace from the ground up.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {[
              {
                name: "Samman Khanal",
                role: "Full-Stack Lead",
                icon: <Code2 className="w-7 h-7 text-indigo-600" />,
                bg: "bg-indigo-50",
                skills: ["React", "Node.js", "Socket.io"],
              },
              {
                name: "Samman Khanal",
                role: "Backend Engineer",
                icon: <Server className="w-7 h-7 text-emerald-600" />,
                bg: "bg-emerald-50",
                skills: ["MongoDB", "REST APIs", "Auth"],
              },
              {
                name: "Samman Khanal",
                role: "Frontend Engineer",
                icon: <Palette className="w-7 h-7 text-pink-600" />,
                bg: "bg-pink-50",
                skills: ["TypeScript", "Tailwind", "UX"],
              },
              {
                name: "Samman Khanal",
                role: "DevOps & DB",
                icon: <Database className="w-7 h-7 text-amber-600" />,
                bg: "bg-amber-50",
                skills: ["Docker", "CI/CD", "Schema design"],
              },
            ].map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className={`w-16 h-16 ${member.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  {member.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-0.5">{member.name}</h3>
                <p className="text-xs font-semibold text-indigo-600 mb-3">{member.role}</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {member.skills.map((s) => (
                    <span key={s} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Milestones Timeline ─── */}
      <section className="py-10 sm:py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-14">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4">
              <Rocket className="w-4 h-4" />
              <span className="text-sm font-semibold">Milestones</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">Our Journey</h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Key milestones in building CollabSpace.
            </p>
          </div>

          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-indigo-200" />

            <div className="space-y-8">
              {[
                { date: "Q3 2024", title: "Project Kickoff", desc: "Team formed and project scope defined. Tech stack selected: React, Node.js, MongoDB, Socket.io." },
                { date: "Q4 2024", title: "Core Features", desc: "Workspace creation, channels, real-time messaging, and authentication all shipped." },
                { date: "Q1 2025", title: "Kanban Boards", desc: "Drag-and-drop task management with multiple board methodologies and real-time collaboration." },
                { date: "Q2 2025", title: "Subscriptions & Payments", desc: "Khalti payment integration, subscription plans, and premium feature gating launched." },
                { date: "Q2 2025", title: "FYP Submission", desc: "Project completed and submitted as Final Year Project for Bachelor's in Computer Science." },
              ].map((m, i) => (
                <div key={i} className="flex gap-6 pl-12 relative">
                  <div className="absolute left-3 top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-sm shrink-0 -translate-x-1/2" />
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex-1 hover:shadow-md transition-shadow">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{m.date}</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5 mb-1">{m.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-10 sm:py-20 bg-linear-to-br from-indigo-800 to-purple-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              Why Teams Choose CollabSpace
            </h2>
            <p className="text-sm sm:text-base text-indigo-100 max-w-2xl mx-auto">
              We're more than just a tool—we're your partner in productivity
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            <WhyCard
              icon={<Zap className="w-6 h-6 text-yellow-100" />}
              title="Lightning Fast"
              description="Built for speed with real-time updates that keep your team in sync."
            />
            <WhyCard
              icon={<Shield className="w-6 h-6 text-green-100" />}
              title="Enterprise Security"
              description="Bank-level encryption and compliance with global security standards."
            />
            <WhyCard
              icon={<Heart className="w-6 h-6 text-red-100" />}
              title="24/7 Support"
              description="Our dedicated team is always here to help you succeed."
            />
            <WhyCard
              icon={<Globe className="w-6 h-6 text-blue-100" />}
              title="Global Reach"
              description="Teams in 150+ countries collaborate seamlessly on CollabSpace."
            />
            <WhyCard
              icon={<Rocket className="w-6 h-6 text-purple-100" />}
              title="Always Improving"
              description="Regular updates with new features based on your feedback."
            />
            <WhyCard
              icon={<Users className="w-6 h-6 text-indigo-100" />}
              title="Scales With You"
              description="From 5 to 5,000 team members, CollabSpace grows with your business."
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-10 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8">
            See our plans or reach out — we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/#pricing"
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View Pricing
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

interface StatCardProps {
  number: string;
  label: string;
}

function StatCard({ number, label }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-8 text-center shadow-sm hover:shadow-lg transition-shadow">
      <div className="text-xl sm:text-3xl font-bold text-indigo-600 mb-1 sm:mb-2">{number}</div>
      <div className="text-xs sm:text-sm text-slate-600">{label}</div>
    </div>
  );
}

interface ValueCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

function ValueCard({ icon, iconBg, title, description }: ValueCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1">
      <div
        className={`w-12 h-12 sm:w-16 sm:h-16 ${iconBg} rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1 sm:mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

interface WhyCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function WhyCard({ icon, title, description }: WhyCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 transition-all">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
        {icon}
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">{description}</p>
    </div>
  );
}
