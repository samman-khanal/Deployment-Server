import React, { useState } from "react";
import { Navbar } from "../layout/Navbar";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Footer } from "../layout/Footer";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  MessageSquare,
  Clock,
  HeadphonesIcon,
  ChevronDown,
  ArrowRight,
  User,
} from "lucide-react";
import { toast } from "sonner";

const SUBJECT_OPTIONS = [
  "General Inquiry",
  "Technical Support",
  "Billing",
  "Enterprise Sales",
  "Partnership",
  "Other",
];

export default function Contact() {
  useDocumentTitle("Contact");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ name: string; subject: string } | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.subject.trim()) newErrors.subject = "Please select a subject";
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = "Message must be 1000 characters or less";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/contact`,
        formData,
      );
      setSubmittedData({ name: formData.name, subject: formData.subject });
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "General Inquiry", message: "" });
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white pt-8 pb-10 sm:pt-10 sm:pb-12 lg:pt-12 lg:pb-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6">
              We'd love to{" "}
              <span className="text-indigo-600">hear</span> from you
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Have a question, feedback, or need help? Our team is here to help
              and will respond within 24 hours on business days.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-8 sm:py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <ContactCard
              icon={<Mail className="w-8 h-8 text-blue-600" />}
              iconBg="bg-blue-100"
              title="Email Us"
              value="support@collabspace.com"
            />
            <ContactCard
              icon={<Phone className="w-8 h-8 text-green-600" />}
              iconBg="bg-green-100"
              title="Call Us"
              value="+977 981-426-5591"
            />
            <ContactCard
              icon={<MapPin className="w-8 h-8 text-indigo-600" />}
              iconBg="bg-indigo-100"
              title="Visit Us"
              value="Kathmandu, Nepal"
            />
            <ContactCard
              icon={<Clock className="w-8 h-8 text-orange-600" />}
              iconBg="bg-orange-100"
              title="Working Hours"
              value="Mon–Fri, 9 AM–6 PM NPT"
            />
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-10 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* Left – Form */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
                Send Us a <span className="text-indigo-600">Message</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8">
                Fill out the form below and our team will get back to you within
                24 hours.
              </p>

              {isSubmitted && submittedData ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Thank you, {submittedData.name}!
                  </h3>
                  <p className="text-slate-600 mb-2">
                    Your message about <span className="font-semibold text-slate-800">"{submittedData.subject}"</span> has been received.
                  </p>
                  <p className="text-sm text-slate-500 mb-6">
                    We'll respond within 24 hours on business days.
                  </p>
                  <button
                    onClick={() => { setIsSubmitted(false); setSubmittedData(null); }}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <FormField label="Full Name" error={errors.name}>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className={inputClass(!!errors.name)}
                    />
                  </FormField>
                  <FormField label="Email Address" error={errors.email}>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      className={inputClass(!!errors.email)}
                    />
                  </FormField>
                </div>

                <FormField label="Subject" error={errors.subject}>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={inputClass(!!errors.subject)}
                  >
                    {SUBJECT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Message" error={errors.message}>
                  <div className="relative">
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      maxLength={1000}
                      placeholder="Tell us more about your inquiry…"
                      className={`${inputClass(!!errors.message)} resize-none`}
                    />
                    <span className={`absolute bottom-2 right-3 text-xs ${
                      formData.message.length > 900 ? "text-red-500" : "text-slate-400"
                    }`}>
                      {formData.message.length}/1000
                    </span>
                  </div>
                </FormField>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? "bg-indigo-400 text-white cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
              )}
            </div>

            {/* Right – Other Ways */}
            <div>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 sm:mb-4">
                Other Ways to <span className="text-indigo-600">Reach Us</span>
              </h2>
              <p className="text-xs sm:text-base text-slate-600 mb-4 sm:mb-8">
                Choose the option that works best for you.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-6">
                <ReachCard
                  icon={<HeadphonesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />}
                  iconBg="bg-blue-100"
                  title="Support Center"
                  description="Browse our help docs, tutorials, and FAQs for quick answers."
                  action="Visit Help Center"
                  href="#faq"
                />
                <ReachCard
                  icon={<MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />}
                  iconBg="bg-purple-100"
                  title="Live Chat"
                  description="Instant help from our team. Mon–Fri, 9 AM–6 PM NPT."
                  action="Start Live Chat"
                  onClick={() => toast.info("Live chat coming soon! For now, please use the form or email us.")}
                />
                <ReachCard
                  icon={<Mail className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />}
                  iconBg="bg-indigo-100"
                  title="Enterprise Sales"
                  description="Custom solutions for your organization. Let's talk."
                  action="Contact Sales"
                  href="mailto:sales@collabspace.com"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-10 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Quick answers to questions you may have about CollabSpace
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <FAQItem
              question="What is your response time?"
              answer="We typically respond to all inquiries within 24 hours during business days. For urgent matters, please call our support line directly."
            />
            <FAQItem
              question="Do you offer custom enterprise solutions?"
              answer="Yes! We work with enterprise clients to create custom solutions tailored to their specific needs. Contact our sales team to learn more."
            />
            <FAQItem
              question="Can I schedule a demo?"
              answer="Absolutely! You can request a personalized demo by filling out the contact form above or by calling our sales team directly."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards and Khalti for local payments. All transactions are processed securely with bank-level encryption."
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

function ContactCard({
  icon,
  iconBg,
  title,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1">
      <div
        className={`w-12 h-12 sm:w-16 sm:h-16 ${iconBg} rounded-xl flex items-center justify-center mx-auto mb-3`}
      >
        {icon}
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600">{value}</p>
    </div>
  );
}

function ReachCard({
  icon,
  iconBg,
  title,
  description,
  action,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  action: string;
  href?: string;
  onClick?: () => void;
}) {
  const actionElement = href ? (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
    >
      {action}
      <ArrowRight className="w-4 h-4" />
    </a>
  ) : (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
    >
      {action}
      <ArrowRight className="w-4 h-4" />
    </button>
  );

  return (
    <div className="bg-white rounded-xl p-3 sm:p-6 hover:shadow-lg transition-all hover:-translate-y-1 border-t-4 border-transparent hover:border-indigo-600">
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-5">
        <div
          className={`w-10 h-10 sm:w-14 sm:h-14 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xs sm:text-base font-semibold text-slate-900 mb-1 sm:mb-2">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2 sm:mb-3">
            {description}
          </p>
          {actionElement}
        </div>
      </div>
    </div>
  );
}

const inputClass = (hasError: boolean) =>
  `w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg outline-none transition-all
   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
   ${hasError ? "border-red-400 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"}`;

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-6 py-3.5 sm:py-5 text-left flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm sm:text-base font-semibold text-slate-900">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-t border-slate-100 bg-slate-50">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
