import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Crown,
  Users,
  MessageSquare,
  BarChart3,
  Headphones,
  Loader2,
  CreditCard,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { PlanCardsGrid } from "../../components/ui/PlanCard";
import { PlanComparisonTable } from "../../components/ui/PlanFeatureList";
import { useSubscription } from "../../context/SubscriptionContext";
import type { PlanInfo, SubscriptionPlan } from "../../types/subscription.types";
import { Footer } from "../../layout/Footer";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const BENEFITS = [
  {
    icon: MessageSquare,
    title: "Unlimited Workspaces",
    description: "Create as many workspaces as you need for different projects and teams.",
  },
  {
    icon: Users,
    title: "Unlimited Boards",
    description: "Organize your work with unlimited task boards and columns.",
  },
  {
    icon: MessageSquare,
    title: "Permanent Message History",
    description: "Keep all your conversations forever. Never lose important context.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Get insights into your team's productivity and collaboration patterns.",
  },
  {
    icon: Headphones,
    title: "Priority Support",
    description: "Get help faster with dedicated support for Pro members.",
  },
  {
    icon: Crown,
    title: "Enhanced Security",
    description: "Advanced security features to protect your team's data.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-900">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-600 text-left">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function UpgradePage() {
  useDocumentTitle("Upgrade Plan");
  const navigate = useNavigate();
  const location = useLocation();

  const navState = (location.state ?? {}) as {
    from?: "overview" | "dashboard";
    workspaceId?: string;
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const { subscription, plans, isPro, isPlus, isLoading, redirectToCheckout, redirectToKhaltiCheckout, khaltiPrices } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "khalti">("stripe");

  const handleSelectPlan = async (plan: PlanInfo) => {
    if (plan.id === "free") {
      navigate("/dashboard");
      return;
    }

    if (plan.id === "plus" || plan.id === "pro") {
      setLoadingPlan(plan.id);
      try {
        if (paymentMethod === "khalti") {
          await redirectToKhaltiCheckout(plan.id);
        } else {
          await redirectToCheckout(plan.id);
        }
      } catch (err: any) {
        console.error("Checkout error:", err);
        
        // Provide helpful error messages
        let errorMessage = "Failed to start checkout";
        
        if (err?.response?.status === 401) {
          errorMessage = "Please login to upgrade your plan";
        } else if (err?.response?.status === 400) {
          errorMessage = err?.response?.data?.error || "Invalid plan selected";
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        toast.error(errorMessage);
        setLoadingPlan(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading plans...</span>
        </div>
      </div>
    );
  }

  if (isPro || isPlus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 max-w-lg w-full">
          {/* Icon */}
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-3 text-center">
            {isPro ? "You're Already on Pro!" : "You're on Plus!"}
          </h1>
          
          {/* Description */}
          <p className="text-slate-600 text-center mb-8 text-base leading-relaxed">
            {isPro
              ? "You have full access to all features. Enjoy unlimited workspaces, boards, and permanent message history."
              : "You're on the Plus plan. Upgrade to Pro for unlimited workspaces, boards, and permanent message history."}
          </p>

          {/* Feature List */}
          <div className="space-y-3 mb-8 bg-slate-50 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Unlimited Workspaces</p>
                <p className="text-xs text-slate-500">Create as many workspaces as you need</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Permanent Message History</p>
                <p className="text-xs text-slate-500">Never lose your conversations</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Priority Support</p>
                <p className="text-xs text-slate-500">Get help faster when you need it</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/subscription")} 
              className="flex-1"
            >
              Manage Subscription
            </Button>
            {isPlus && !isPro ? (
              <Button 
                onClick={() => handleSelectPlan(plans.find((p) => p.id === "pro")!)}
                className="flex-1"
              >
                Upgrade to Pro
              </Button>
            ) : (
              <Button 
                onClick={handleBackToDashboard} 
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <span className="font-semibold text-slate-900 tracking-tight">
                CollabSpace
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-700 text-sm mb-6 font-medium">
            <Crown className="w-4 h-4" />
            <span>Choose a plan</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Unlock the Full Power of CollabSpace
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Get unlimited workspaces, boards, and permanent message history. Take your team collaboration to the next level.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        {/* Payment Method Selector */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-700 mb-3 text-center">
              Choose Payment Method
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod("stripe")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  paymentMethod === "stripe"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Card (Stripe)</span>
              </button>
              <button
                onClick={() => setPaymentMethod("khalti")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  paymentMethod === "khalti"
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v10h-2V5z"/>
                </svg>
                <span className="font-medium">Khalti (NPR)</span>
              </button>
            </div>
            {paymentMethod === "khalti" && khaltiPrices && (
              <p className="text-xs text-slate-500 text-center mt-3">
                Pay in Nepalese Rupees via Khalti wallet or mobile banking
              </p>
            )}
          </div>
        </div>

        <PlanCardsGrid
          plans={plans}
          currentPlan={subscription?.plan}
          onSelectPlan={handleSelectPlan}
          loadingPlan={loadingPlan ?? undefined}
          paymentMethod={paymentMethod}
          khaltiPrices={khaltiPrices ?? undefined}
        />
      </section>

      {/* Benefits Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Why Upgrade?
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Unlock more power for your team with expanded limits, permanent message history, and priority support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BENEFITS.map((benefit, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Compare Plans
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              See exactly what's included in each plan.
            </p>
          </div>

          <PlanComparisonTable />

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() =>
                handleSelectPlan(plans.find((p) => p.id === "plus")!)
              }
              loading={loadingPlan === "plus"}
              variant="outline"
              className="gap-2 px-8 py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Get Plus — $4.99/mo
            </Button>
            <Button
              onClick={() =>
                handleSelectPlan(plans.find((p) => p.id === "pro")!)
              }
              loading={loadingPlan === "pro"}
              className="gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Crown className="w-5 h-5" />
              Get Pro — $9.99/mo
            </Button>
          </div>
          <p className="text-center text-sm text-slate-500 mt-4">
            Starts at $4.99/mo · Cancel anytime · No hidden fees
          </p>
          {/* Money-back guarantee */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
            <span className="text-base">🛡️</span>
            <span className="font-medium">30-day money-back guarantee</span>
            <span className="text-slate-400">—</span>
            <span className="text-slate-500">If you're not satisfied, we'll refund you. No questions asked.</span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-center mb-12">
            Quick answers to questions you may have
          </p>
          <div className="space-y-6 max-w-4xl mx-auto">
            <FAQItem
              question="Can I cancel anytime?"
              answer="We don't lock you in — you can cancel your subscription at any time and you'll keep access until the end of your billing period."
            />
            <FAQItem
              question="What happens to my data if I downgrade?"
              answer="Your data is always safe. If you downgrade, you'll keep all your workspaces and boards, but won't be able to create new ones beyond the free limit."
            />
            <FAQItem
              question="Is there a free trial?"
              answer="We don't offer a traditional free trial, but the Free plan lets you use CollabSpace indefinitely to decide if Pro is right for you."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards (Visa, MasterCard, American Express) through Stripe. For users in Nepal, we also support Khalti digital wallet and mobile banking payments in Nepalese Rupees (NPR)."
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
