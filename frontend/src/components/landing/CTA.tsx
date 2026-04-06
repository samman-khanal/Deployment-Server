export function CTA() {
  return (
    <section className="py-10 sm:py-20 bg-linear-to-r from-indigo-800 to-purple-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
          Ready to Transform Your Team's Collaboration?
        </h2>
        <p className="text-base sm:text-lg text-indigo-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Join thousands of teams already using CollabSpace to work smarter and
          faster
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button className="px-6 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl">
            Start Free Trial
          </button>
          <button className="px-6 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all">
            Contact Sales
          </button>
        </div>
        <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-indigo-200">No credit card required · Free 14-day trial · Cancel anytime</p>
      </div>
    </section>
  );
}
