import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, ExternalLink, Shield, AlertTriangle, Copy, CheckCircle2, Clock, RefreshCw, QrCode } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/context/WalletContext";
import { apiFetch } from "@/lib/apiFetch";
import TxProgress, { TxStage } from "@/components/wallet/TxProgress";
import { QRCodeSVG } from "qrcode.react";

// USDT to BDT rate
const USDT_TO_BDT_RATE = 130;

// Preset amounts
const PRESET_AMOUNTS = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
  { value: 200, label: "200" },
  { value: 500, label: "500" },
  { value: 1000, label: "1k" },
  { value: 5000, label: "5k" },
  { value: 10000, label: "10k" },
];

interface USDTDepositFlowProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface OrderData {
  order_id: string;
  invoice_url: string;
  deposit_address: string;
  expires_at: string;
  amount_usdt: number;
}

interface OrderStatus {
  order_id: string;
  status: string;
  amount_usdt: number;
  txid?: string;
  confirmations?: number;
  credited_amount_bdt?: number;
}

// Glowing USDT Logo Component
const GlowingUSDTLogo = ({ size = "lg" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeConfig = {
    sm: { outer: "w-10 h-10", inner: "w-6 h-6", img: "w-5 h-5" },
    md: { outer: "w-14 h-14", inner: "w-10 h-10", img: "w-8 h-8" },
    lg: { outer: "w-16 h-16", inner: "w-12 h-12", img: "w-9 h-9" },
  };

  const { outer, inner, img } = sizeConfig[size];

  return (
    <div className={`relative ${outer} flex items-center justify-center`}>
      <motion.div
        className={`absolute ${inner} rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-40 blur-md`}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className={`relative ${inner} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg`}>
        <img src="/assets/usdt-trc20.png" alt="USDT payment method" className={`${img} object-contain`} />
      </div>
    </div>
  );
};

// Mini USDT Icon for buttons
const MiniUSDTIcon = ({ isActive }: { isActive: boolean }) => (
  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-emerald-500/20'}`}>
    <img src="/assets/usdt-trc20.png" alt="" className="w-3 h-3 object-contain" />
  </div>
);

// Countdown Timer Component
const CountdownTimer = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = timeLeft === "Expired";

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
      <Clock size={14} />
      <span className="text-sm font-mono font-bold">{timeLeft}</span>
    </div>
  );
};

// Status Chip Component
const StatusChip = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Pending Payment" },
    confirming: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Confirming..." },
    confirmed: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Confirmed" },
    credited: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Credited ✓" },
    expired: { bg: "bg-red-500/20", text: "text-red-400", label: "Expired" },
    failed: { bg: "bg-red-500/20", text: "text-red-400", label: "Failed" },
  };

  const { bg, text, label } = config[status] || config.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${bg} ${text}`}>
      {label}
    </span>
  );
};

const USDTDepositFlow = ({ onBack, onSuccess }: USDTDepositFlowProps) => {
  const { refresh: refreshWallet } = useWalletContext();
  const [amount, setAmount] = useState("");
  const [userBalance, setUserBalance] = useState<{ bdt: number; usdt: number }>({ bdt: 0, usdt: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch user balance
  const fetchBalance = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", user.id)
          .single();
        
        if (wallet) {
          setUserBalance({
            bdt: wallet.balance || 0,
            usdt: (wallet.balance || 0) / USDT_TO_BDT_RATE
          });
        }
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Subscribe to order status updates via realtime
  useEffect(() => {
    if (!orderData?.order_id) return;

    const channel = supabase
      .channel(`usdt-order-${orderData.order_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "usdt_orders",
          filter: `order_id=eq.${orderData.order_id}`,
        },
        (payload) => {
          console.log("[USDT] Realtime update:", payload);
          const newStatus = payload.new as OrderStatus;
          setOrderStatus(newStatus);
          
          if (newStatus.status === "credited") {
            toast.success(`৳${newStatus.credited_amount_bdt?.toLocaleString()} credited to your wallet!`);
            fetchBalance();
            refreshWallet();
            setTimeout(() => onSuccess(), 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderData?.order_id, fetchBalance, onSuccess]);

  // Create order with gateway
  const handleCreateOrder = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1 || numAmount > 100000) {
      toast.error("Amount must be between 1 - 100,000 USDT");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch<OrderData>("/usdt-create-order", {
        method: "POST",
        body: { amount_usdt: numAmount },
      });

      if (!response.success || !response.data) {
        toast.error(response.error || "Failed to create order");
        return;
      }

      setOrderData(response.data);
      setOrderStatus({ 
        order_id: response.data.order_id, 
        status: "pending", 
        amount_usdt: response.data.amount_usdt 
      });
      
      toast.success("Order created! Send USDT to the address below.");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Check order status
  const handleCheckStatus = async () => {
    if (!orderData?.order_id) return;

    setIsCheckingStatus(true);

    try {
      const response = await apiFetch<OrderStatus>(`/usdt-status?order_id=${orderData.order_id}`, {
        method: "GET",
      });

      if (response.success && response.data) {
        setOrderStatus(response.data);
        
        if (response.data.status === "credited") {
          toast.success(`৳${response.data.credited_amount_bdt?.toLocaleString()} credited!`);
          fetchBalance();
          refreshWallet();
          setTimeout(() => onSuccess(), 2000);
        } else if (response.data.status === "confirming") {
          toast.info(`Transaction confirming... (${response.data.confirmations || 0}/20 confirmations)`);
        } else if (response.data.status === "pending") {
          toast.info("Waiting for payment...");
        }
      }
    } catch (error) {
      console.error("Error checking status:", error);
      toast.error("Failed to check status");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!orderData?.deposit_address) return;
    
    try {
      await navigator.clipboard.writeText(orderData.deposit_address);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Open invoice URL in new tab
  const openInvoice = () => {
    if (orderData?.invoice_url) {
      window.open(orderData.invoice_url, "_blank");
    }
  };

  // If order exists, show payment details
  if (orderData) {
    return (
      <motion.div
        className="space-y-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => {
              setOrderData(null);
              setOrderStatus(null);
            }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft size={20} className="text-white/80" />
          </motion.button>
          
          <div className="flex items-center gap-4 flex-1">
            <GlowingUSDTLogo size="lg" />
            <div>
              <h2 className="text-xl font-bold text-white">Complete Payment</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusChip status={orderStatus?.status || "pending"} />
              </div>
            </div>
          </div>
        </div>


        {/* Transaction progress: Pending → Credited → Vault Updated */}
        <TxProgress
          stage={
            orderStatus?.status === "credited"
              ? "refreshed"
              : orderStatus?.status === "confirming"
              ? "approved"
              : orderStatus?.status === "failed" || orderStatus?.status === "expired"
              ? "failed"
              : "pending"
          }
          failedAt={orderStatus?.status === "failed" && (orderStatus as any)?.confirmed_at ? "approved" : "pending"}
          failedMessage={
            orderStatus?.status === "expired"
              ? "Payment window expired — no funds credited."
              : undefined
          }
          labels={{ approved: "Credited", refreshed: "Vault Updated" }}
        />


        {/* Order Info Card */}
        <motion.div 
          className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-5 border border-white/10 space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Amount & Timer */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/50 text-xs mb-1">Amount to Send</p>
              <div className="flex items-center gap-2">
                <GlowingUSDTLogo size="sm" />
                <span className="text-2xl font-bold text-white">{orderData.amount_usdt}</span>
                <span className="text-white/50">USDT</span>
              </div>
            </div>
            <CountdownTimer expiresAt={orderData.expires_at} />
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-4">
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeSVG 
                value={orderData.deposit_address} 
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Deposit Address */}
          <div className="space-y-2">
            <p className="text-white/50 text-xs font-medium flex items-center gap-2">
              <QrCode size={12} className="text-teal-400" />
              TRC-20 Deposit Address
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-teal-300 break-all">
                {orderData.deposit_address}
              </div>
              <motion.button
                onClick={copyAddress}
                className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'} border`}
                whileTap={{ scale: 0.9 }}
              >
                {copied ? (
                  <CheckCircle2 size={20} className="text-emerald-400" />
                ) : (
                  <Copy size={20} className="text-white/60" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Order ID */}
          <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/5">
            <span>Order ID</span>
            <span className="font-mono">{orderData.order_id}</span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            onClick={handleCheckStatus}
            disabled={isCheckingStatus}
            className="flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw size={18} className={isCheckingStatus ? "animate-spin" : ""} />
            {isCheckingStatus ? "Checking..." : "Check Status"}
          </motion.button>
          
          <motion.button
            onClick={openInvoice}
            className="flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ExternalLink size={18} />
            Open Gateway
          </motion.button>
        </div>

        {/* Warning */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-200/90 space-y-1">
              <p>Send <span className="font-bold">exactly {orderData.amount_usdt} USDT</span> via TRC-20 network only.</p>
              <p className="text-white/50">Balance will be credited automatically after 20 confirmations.</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Initial amount selection view
  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <motion.button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft size={20} className="text-white/80" />
        </motion.button>
        
        <div className="flex items-center gap-4 flex-1">
          <GlowingUSDTLogo size="lg" />
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              USDT Deposit
              <span className="text-[10px] bg-gradient-to-r from-teal-500/30 to-emerald-500/30 text-teal-300 px-2.5 py-0.5 rounded-full font-semibold border border-teal-400/40">
                TRC-20
              </span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-amber-400 text-sm font-semibold flex items-center gap-1.5">
                <span className="text-white/50">1 USDT =</span> ৳{USDT_TO_BDT_RATE}
              </p>
              <span className="text-[9px] font-bold uppercase bg-gradient-to-r from-rose-500 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(255,59,59,0.5)]">
                +2% Bonus
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Balance Card */}
      <motion.div 
        className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 rounded-2xl p-4 border border-white/10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs mb-1">Your Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">৳{userBalance.bdt.toLocaleString("en-IN")}</span>
              <span className="text-white/40 text-sm">BDT</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs mb-1">≈ USDT</p>
            <div className="flex items-center gap-1.5">
              <GlowingUSDTLogo size="sm" />
              <span className="text-lg font-bold text-emerald-400">{userBalance.usdt.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Amount Input */}
      <div className="space-y-3">
        <label className="text-white/70 text-sm font-medium">Amount (USDT)</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter USDT amount"
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 text-lg py-4 px-4 pr-32 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 focus:outline-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30">
            <GlowingUSDTLogo size="sm" />
            <span className="text-emerald-300 font-bold text-sm">USDT</span>
          </div>
        </div>
        {amount && !isNaN(parseFloat(amount)) && (
          <motion.p
            className="text-amber-400 text-sm font-semibold flex items-center gap-2"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-white/50">≈</span> ৳{(parseFloat(amount) * USDT_TO_BDT_RATE).toLocaleString("en-IN")} 
            <span className="text-white/40 text-xs">BDT</span>
            <span className="text-emerald-400 text-xs ml-2">(+2% bonus)</span>
          </motion.p>
        )}
      </div>

      {/* Preset Amounts */}
      <div className="space-y-3">
        <label className="text-white/50 text-xs font-medium flex items-center gap-2">
          <Sparkles size={12} className="text-amber-400" />
          Quick Select
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map((preset) => {
            const isSelected = amount === preset.value.toString();
            return (
              <motion.button
                key={preset.value}
                onClick={() => setAmount(preset.value.toString())}
                className={`py-2.5 px-2 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? "bg-gradient-to-br from-emerald-500/90 to-teal-600/90 text-white border-2 border-emerald-300/60"
                    : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40"
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <MiniUSDTIcon isActive={isSelected} />
                <span className="text-sm font-bold">{preset.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Warning Notice */}
      <motion.div
        className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-200/90 space-y-1">
            <p className="font-semibold">Important:</p>
            <ul className="list-disc list-inside text-white/60 space-y-0.5">
              <li>Send only USDT via <span className="text-teal-400 font-semibold">TRC-20</span> network</li>
              <li>Minimum: 1 USDT | Maximum: 100,000 USDT</li>
              <li>+2% bonus will be added automatically</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
        <Shield size={14} className="text-emerald-400" />
        <span>Secured by PayFastUSDT Gateway</span>
      </div>

      {/* Deposit Button */}
      <motion.button
        onClick={handleCreateOrder}
        disabled={!amount || isLoading}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
          amount && !isLoading
            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
            : "bg-white/10 text-white/40 cursor-not-allowed"
        }`}
        whileHover={amount && !isLoading ? { scale: 1.02 } : {}}
        whileTap={amount && !isLoading ? { scale: 0.98 } : {}}
      >
        {isLoading ? (
          <>
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Creating Order...
          </>
        ) : (
          <>
            <ExternalLink size={20} />
            Generate Deposit Address
          </>
        )}
      </motion.button>
    </motion.div>
  );
};

export default USDTDepositFlow;
