import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, CheckCircle2, X, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddReferralCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  hasReferrer: boolean;
  onSuccess?: () => void;
}

const AddReferralCodeModal = ({
  open,
  onOpenChange,
  userId,
  hasReferrer,
  onSuccess,
}: AddReferralCodeModalProps) => {
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validateCode = (code: string) => {
    const isAgent = /^AG-[A-Z0-9]{6}$/.test(code);
    const isUserRef = /^REF-U-[0-9]{6}$/.test(code);
    const isStandardCode = /^[A-Z0-9]{6,12}$/.test(code);
    return isAgent || isUserRef || isStandardCode;
  };

  const handleCodeChange = (value: string) => {
    const upperCode = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setReferralCode(upperCode);
    setIsValid(validateCode(upperCode));
  };

  const handleSubmit = async () => {
    if (!isValid || !referralCode) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/referral-bonus`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            newUserId: userId,
            referralCode: referralCode,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        if (result.isAgentReferral) {
          toast.success(`🎉 Agent referral applied! You received ৳${result.newUserBonus || 50} bonus!`);
        } else {
          toast.success(`🎉 Referral applied! You received ৳${result.newUserBonus || 50} bonus!`);
        }
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Invalid referral code. Please try again.");
      }
    } catch (error) {
      console.error("Error applying referral code:", error);
      toast.error("Failed to apply referral code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCodeType = (code: string) => {
    if (code.startsWith("AG-") && code.length === 9) {
      return { type: "agent", label: "🏆 Agent Code", color: "text-orange-400" };
    }
    if (code.startsWith("REF-U-")) {
      return { type: "user", label: "👥 User Referral", color: "text-cyan-400" };
    }
    if (code.length >= 6) {
      return { type: "standard", label: "✨ Referral Code", color: "text-purple-400" };
    }
    return null;
  };

  const codeType = getCodeType(referralCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-orange-500/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Gift className="text-orange-400" size={24} />
            Add Referral Code
          </DialogTitle>
        </DialogHeader>

        {hasReferrer ? (
          <div className="py-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <CheckCircle2 className="text-green-400" size={40} />
            </motion.div>
            <p className="text-white font-medium">You already have a referrer!</p>
            <p className="text-gray-400 text-sm mt-2">
              Referral codes can only be applied once per account.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-gray-400 text-sm">
              Enter a referral code from a friend or agent to receive bonus rewards!
            </p>

            <div className="relative">
              <Input
                type="text"
                placeholder="Enter referral code (e.g., REF-U-000001)"
                value={referralCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="h-14 bg-white/5 border-white/20 text-white placeholder:text-gray-500 text-center text-lg font-mono tracking-wider focus:border-orange-500"
                maxLength={15}
                disabled={isLoading}
              />
              {referralCode && (
                <button
                  onClick={() => setReferralCode("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {codeType && isValid && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 ${codeType.color}`}
                >
                  <Sparkles size={16} />
                  <span className="text-sm font-medium">{codeType.label} Detected!</span>
                  <CheckCircle2 size={16} className="ml-auto text-green-400" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={!isValid || isLoading}
                className="h-12 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Applying...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2" size={20} />
                    Apply Referral Code
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-white"
              >
                Skip for now
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              You can only add a referral code once. Make sure it's correct!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddReferralCodeModal;
