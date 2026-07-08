import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/60 border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" style={{ color: "#34D399" }} />
            <h1 className="font-display font-bold text-lg">Privacy Policy</h1>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5 text-sm text-white/75 leading-relaxed">
        <section>
          <h2 className="font-display font-bold text-base text-white mb-1.5">1. Data We Collect</h2>
          <p>Account details (name, email, phone), KYC documents, transaction history, and device metadata for security and fraud prevention.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-base text-white mb-1.5">2. How We Use It</h2>
          <p>To operate your account, process payments, comply with AML/KYC regulations, prevent fraud, and improve our services.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-base text-white mb-1.5">3. Data Security</h2>
          <p>All data is protected with 256-bit encryption at rest and in transit. Access is strictly role-based and audited.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-base text-white mb-1.5">4. Third Parties</h2>
          <p>We share data only with licensed payment processors, game providers, and regulators when legally required.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-base text-white mb-1.5">5. Your Rights</h2>
          <p>You may request access, correction, or deletion of your data at any time via <span className="text-white/90">support@goluckybd.com</span>.</p>
        </section>
        <p className="text-[11px] text-white/40 pt-4 border-t border-white/5">Last updated: 2026 · GoLucky Ltd.</p>
      </main>
    </div>
  );
};
export default Privacy;
