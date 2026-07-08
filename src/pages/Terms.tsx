import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/60 border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" style={{ color: "#FDE68A" }} />
            <h1 className="font-display font-bold text-lg">Terms of Service</h1>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5 text-sm text-white/75 leading-relaxed">
        <section>
          <h2 className="font-display font-bold text-base text-white mb-1.5">1. Acceptance</h2>
          <p>By accessing GoLucky you agree to these Terms. You must be 18+ and legally allowed to gamble in your jurisdiction.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-base text-white mb-1.5">2. Account</h2>
          <p>You are responsible for keeping your credentials safe. One account per person. Fraudulent activity results in permanent suspension.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-base text-white mb-1.5">3. Deposits & Withdrawals</h2>
          <p>All financial transactions are processed via licensed gateways. Withdrawals require KYC verification and may take up to 24 hours.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-base text-white mb-1.5">4. Fair Play</h2>
          <p>All games are provably fair. Collusion, bots, and exploits are strictly prohibited.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-base text-white mb-1.5">5. Responsible Gaming</h2>
          <p>Gamble responsibly. Set limits and seek help if gambling becomes problematic. Contact support anytime.</p>
        </section>
        <p className="text-[11px] text-white/40 pt-4 border-t border-white/5">Last updated: 2026 · GoLucky Ltd.</p>
      </main>
    </div>
  );
};
export default Terms;
