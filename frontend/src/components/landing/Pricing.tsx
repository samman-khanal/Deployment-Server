import { Check } from 'lucide-react';

export function Pricing() {
  return (
    <section id="pricing" className="py-10 sm:py-20 bg-white scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Choose the plan that fits your team's needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 sm:gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <PricingCard
            title="Starter"
            price="$0"
            period="Forever free"
            description="Perfect for small teams getting started"
            features={[
              'Up to 10 team members',
              'Basic chat & channels',
              'Simple task boards',
              '5GB file storage',
              'Email support'
            ]}
            buttonText="Get Started"
            buttonVariant="outline"
          />

          {/* Teams Plan */}
          <PricingCard
            title="Teams"
            price="$12"
            period="per user/month"
            description="For growing teams that need more power"
            features={[
              'Unlimited team members',
              'Advanced chat features',
              'Unlimited task boards',
              '100GB file storage',
              'Priority support',
              'Advanced analytics',
              'Custom integrations'
            ]}
            buttonText="Start Free Trial"
            buttonVariant="primary"
            highlighted
          />

          {/* Enterprise Plan */}
          <PricingCard
            title="Enterprise"
            price="Custom"
            period="Contact us for pricing"
            description="For large organizations with specific needs"
            features={[
              'Everything in Teams',
              'Unlimited storage',
              'Dedicated support',
              'Advanced security',
              'Custom contracts',
              'SLA guarantees'
            ]}
            buttonText="Contact Sales"
            buttonVariant="outline"
          />
        </div>
      </div>
    </section>
  );
}

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: 'primary' | 'outline';
  highlighted?: boolean;
}

function PricingCard({ title, price, period, description, features, buttonText, highlighted }: PricingCardProps) {
  return (
    <div className={`
      group relative bg-white rounded-xl p-4 sm:p-8
      ${highlighted ? 'border-2 border-indigo-600 shadow-xl' : 'border border-slate-200'} 
      transition-all duration-300
      hover:shadow-2xl hover:-translate-y-2
      hover:border-indigo-400
      ${!highlighted && 'hover:border-2'}
      cursor-pointer
      flex flex-col h-full
    `}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
      
      {/* Content wrapper with relative positioning */}
      <div className="relative z-10 flex flex-col grow">
        {highlighted && (
          <div className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4 group-hover:bg-indigo-700 transition-colors">
            MOST POPULAR
          </div>
        )}
        
        <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2 group-hover:text-indigo-600 transition-colors">{title}</h3>
        <div className="mb-2 sm:mb-4">
          <span className="text-2xl sm:text-4xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{price}</span>
          {price !== 'Custom' && <span className="text-slate-600 text-xs sm:text-sm ml-1">/user</span>}
        </div>
        <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-6">{period}</p>
        <p className="text-slate-700 text-xs sm:text-sm mb-3 sm:mb-6">{description}</p>

        {/* Features */}
        <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-8 grow">
          {features.map((feature, index) => (
            <li 
              key={index} 
              className="flex items-start gap-3 transform group-hover:translate-x-1 transition-transform duration-200"
              style={{ transitionDelay: `${index * 30}ms` }}
            >
              <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-green-600 shrink-0 mt-0.5 group-hover:text-green-700 group-hover:scale-110 transition-all" />
              <span className="text-slate-700 text-xs sm:text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Button */}
        <button className="w-full py-2 sm:py-3 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-xl group-hover:scale-105 group-hover:ring-2 group-hover:ring-indigo-300">
          {buttonText}
        </button>
      </div>

      {/* Decorative corner accent - appears on hover */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-linear-to-tr from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300 blur-2xl" />
    </div>
  );
}