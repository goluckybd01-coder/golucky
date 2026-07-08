import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Headphones, MessageCircle, Mail, Phone, Clock, Send, Sparkles, ExternalLink, ChevronRight, HelpCircle, CreditCard, Shield, Gift } from "lucide-react";
import GlassCard from "@/components/auth/GlassCard";
import Seo from "@/components/seo/Seo";

const FloatingParticle = (_props: any) => null;
const GlowingOrb = ({ className, color }: { className?: string; color: string }) => (
  <motion.div className={`absolute rounded-full blur-3xl ${className}`} style={{ background: color }} animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
);
const HolographicShine = () => (
  <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" initial={{ x: "-200%" }} animate={{ x: "200%" }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }} />
);

const faqItems = [
  { icon: CreditCard, question: "How do I deposit?", answer: "Go to Wallet > Deposit, select your payment method, enter the amount, and follow the instructions." },
  { icon: Gift, question: "How to claim bonuses?", answer: "Visit the Gifts page to see available bonuses. Tap on any bonus to claim it instantly." },
  { icon: Shield, question: "Is my money safe?", answer: "Yes! We use bank-grade encryption and your funds are held in secure accounts." },
  { icon: HelpCircle, question: "Withdrawal taking long?", answer: "Withdrawals are usually processed within 30 minutes. For large amounts, it may take up to 24 hours." },
];

const contactOptions = [
  { icon: MessageCircle, label: "Live Chat", sublabel: "Average reply: 2 mins", gradient: "from-green-500 to-emerald-500", action: "chat", path: "/support/chat" },
  { icon: Send, label: "Telegram", sublabel: "@GoLuckySupport", gradient: "from-blue-500 to-cyan-500", action: "telegram" },
  { icon: Mail, label: "Email Us", sublabel: "support@golucky.com", gradient: "from-purple-500 to-pink-500", action: "email" },
  { icon: Phone, label: "WhatsApp", sublabel: "+880 1XXX-XXXXXX", gradient: "from-green-500 to-teal-500", action: "whatsapp" },
];

const Support = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const handleContactAction = (action: string, path?: string) => {
    switch (action) {
      case "chat": if (path) navigate(path); break;
      case "telegram": window.open("https://t.me/GoLuckySupport", "_blank"); break;
      case "email": window.open("mailto:support@golucky.com"); break;
      case "whatsapp": window.open("https://wa.me/8801XXXXXXXXX", "_blank"); break;
    }
  };
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 overflow-hidden">
      <Seo title="GoLucky Support — 24/7 Help, Live Chat & FAQs" description="Get help from GoLucky support 24/7." path="/support" jsonLd={faqJsonLd} />
      <div className="relative pt-6 pb-6 px-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white"><ArrowLeft size={22} /></button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Headphones size={20} /> Support</h1>
      </div>
      <div className="px-4 space-y-5">
        <GlassCard className="p-5"><span className="text-white font-medium">Support team is online</span></GlassCard>
        <div className="grid grid-cols-2 gap-3">
          {contactOptions.map((option) => (
            <button key={option.label} onClick={() => handleContactAction(option.action, (option as any).path)} className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <option.icon size={26} className="text-white mx-auto" />
              <p className="text-white font-bold text-sm mt-2">{option.label}</p>
            </button>
          ))}
        </div>
        <GlassCard className="p-5">
          {faqItems.map((faq, index) => (
            <button key={index} onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl mb-2">
              <faq.icon size={18} className="text-purple-400" />
              <span className="flex-1 text-left text-white text-sm">{faq.question}</span>
              <ChevronRight size={18} className="text-white/40" />
            </button>
          ))}
        </GlassCard>
      </div>
    </div>
  );
};
export default Support;
