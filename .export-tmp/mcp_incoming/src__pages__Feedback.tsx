import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Star, Send, Sparkles, Smile, Meh, Frown, CheckCircle } from "lucide-react";
import GlassCard from "@/components/auth/GlassCard";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const FloatingParticle = (_props: any) => null;
const GlowingOrb = ({ className, color }: { className?: string; color: string }) => (
  <motion.div className={`absolute rounded-full blur-3xl ${className}`} style={{ background: color }} animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
);
const HolographicShine = () => (
  <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" initial={{ x: "-200%" }} animate={{ x: "200%" }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }} />
);
type Mood = "happy" | "neutral" | "sad" | null;
const Feedback = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [mood, setMood] = useState<Mood>(null);
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const categories = [
    { id: "games", label: "Games", emoji: "🎮" },
    { id: "payments", label: "Payments", emoji: "💳" },
    { id: "support", label: "Support", emoji: "💬" },
    { id: "app", label: "App Experience", emoji: "📱" },
    { id: "other", label: "Other", emoji: "📝" },
  ];
  const moods = [
    { id: "happy" as Mood, icon: Smile, label: "Happy", color: "from-green-500 to-emerald-500" },
    { id: "neutral" as Mood, icon: Meh, label: "Okay", color: "from-amber-500 to-yellow-500" },
    { id: "sad" as Mood, icon: Frown, label: "Unhappy", color: "from-red-500 to-rose-500" },
  ];
  const handleSubmit = async () => {
    if (rating === 0) return toast.error("Please give a star rating");
    if (!feedback.trim()) return toast.error("Please write your feedback");
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Thank you for your feedback! 🎉");
  };
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center max-w-md w-full">
          <CheckCircle size={48} className="text-white mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Thank You!</h2>
          <button onClick={() => navigate(-1)} className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-2xl">Back to Account</button>
        </GlassCard>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="relative pt-6 pb-6 px-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white"><ArrowLeft size={22} /></button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3"><MessageSquare size={20} /> Feedback</h1>
      </div>
      <div className="px-4 space-y-5">
        <GlassCard className="p-5">
          <div className="flex justify-center gap-3">
            {[1,2,3,4,5].map((star) => <button key={star} onClick={() => setRating(star)}><Star size={36} className={star <= rating ? "text-amber-400" : "text-white/20"} fill={star <= rating ? "currentColor" : "none"} /></button>)}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="w-full h-32 bg-white/5 text-white" />
        </GlassCard>
        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white font-bold">Submit Feedback</button>
      </div>
    </div>
  );
};
export default Feedback;
