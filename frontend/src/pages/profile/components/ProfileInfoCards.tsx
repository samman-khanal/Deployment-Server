import { Calendar, Crown, Mail, ShieldCheck, UserCircle2 } from "lucide-react";
import type { UserProfile } from "../../../services/user.service";
import { useSubscription } from "../../../context/SubscriptionContext";

interface ProfileInfoCardsProps {
  profile: UserProfile;
}

function InfoCard({
  icon,
  label,
  value,
  iconColor,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{value}</div>
      </div>
    </div>
  );
}

export function ProfileInfoCards({ profile }: ProfileInfoCardsProps) {
  const { subscription, isPro } = useSubscription();

  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const planLabel = isPro
    ? "Pro Plan"
    : subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) + " Plan"
    : "Free Plan";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InfoCard
        icon={<Mail className="w-5 h-5" />}
        label="Email Address"
        iconColor="text-indigo-600 dark:text-indigo-400"
        iconBg="bg-indigo-50 dark:bg-indigo-900/30"
        value={profile.email}
      />

      <InfoCard
        icon={<Calendar className="w-5 h-5" />}
        label="Member Since"
        iconColor="text-emerald-600 dark:text-emerald-400"
        iconBg="bg-emerald-50 dark:bg-emerald-900/30"
        value={joinDate}
      />

      <InfoCard
        icon={<UserCircle2 className="w-5 h-5" />}
        label="Account Role"
        iconColor="text-violet-600 dark:text-violet-400"
        iconBg="bg-violet-50 dark:bg-violet-900/30"
        value={
          <span className="capitalize">{profile.role}</span>
        }
      />

      <InfoCard
        icon={
          isPro
            ? <Crown className="w-5 h-5" />
            : <ShieldCheck className="w-5 h-5" />
        }
        label="Subscription"
        iconColor={isPro ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}
        iconBg={isPro ? "bg-amber-50 dark:bg-amber-900/30" : "bg-slate-100 dark:bg-slate-700"}
        value={
          <span className={isPro ? "text-amber-600 dark:text-amber-400" : undefined}>
            {planLabel}
          </span>
        }
      />
    </div>
  );
}
