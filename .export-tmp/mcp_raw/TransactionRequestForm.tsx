import { useState, useEffect } from "react";
import { X, Loader2, Clock, CheckCircle, XCircle, AlertCircle, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import bkashLogo from "@/assets/payment/bkash-logo.png";
import nagadLogo from "@/assets/payment/nagad-logo.png";
import usdtLogo from "@/assets/payment/usdt-logo.png";

const PAYMENT_METHODS = [
  { id: "nagad", name: "Nagad", logo: nagadLogo, color: "bg-orange-500" },
  { id: "bkash", name: "bKash", logo: bkashLogo, color: "bg-pink-500" },
  { id: "rocket", name: "Rocket", icon: "🟣", color: "bg-purple-600" },
  { id: "upay", name: "Upay", icon: "🟢", color: "bg-green-500" },
  { id: "usdt", name: "USDT", logo: usdtLogo, color: "bg-teal-500" },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

interface TransactionRequest {
  id: string;
  type: string;
  amount: number;
  status: string;
  payment_method: string | null;
  payment_details: { account_number?: string } | null;
  created_at: string;
  admin_notes: string | null;
}

interface TransactionRequestFormProps {
  type: "deposit" | "withdraw";
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onSuccess: () => void;
}

const TransactionRequestForm = ({ type, isOpen, onClose, balance, onSuccess }: TransactionRequestFormProps) => {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<TransactionRequest[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [allRequests, setAllRequests] = useState<TransactionRequest[]>([]);

  const fetchPendingRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("transaction_requests").select("*").eq("user_id", user.id).eq("type", type).eq("status", "pending").order("created_at", { ascending: false });
      if (error) throw error;
      setPendingRequests((data || []).map(item => ({ id: item.id, type: item.type, amount: item.amount, status: item.status, payment_method: item.payment_method, payment_details: item.payment_details as { account_number?: string } | null, created_at: item.created_at, admin_notes: item.admin_notes })));
    } catch (error) { console.error("Error fetching pending requests:", error); }
  };

  const fetchAllRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("transaction_requests").select("*").eq("user_id", user.id).eq("type", type).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      setAllRequests((data || []).map(item => ({ id: item.id, type: item.type, amount: item.amount, status: item.status, payment_method: item.payment_method, payment_details: item.payment_details as { account_number?: string } | null, created_at: item.created_at, admin_notes: item.admin_notes })));
    } catch (error) { console.error("Error fetching all requests:", error); }
  };

  useEffect(() => { if (isOpen) { fetchPendingRequests(); fetchAllRequests(); } }, [isOpen, type]);

  const handleSubmit = async () => {
    if (!selectedMethod || !amount) { toast.error("Please select payment method and enter amount"); return; }
    const numAmount = parseFloat(amount);
    if (numAmount < 100) { toast.error("Minimum amount is ৳100"); return; }
    if (type === "withdraw") {
      if (numAmount > balance) { toast.error("Insufficient balance"); return; }
      if (!accountNumber || accountNumber.length < 11) { toast.error("Please enter a valid account number"); return; }
    }
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please login"); return; }
      const { error } = await supabase.from("transaction_requests").insert({ user_id: user.id, type, amount: numAmount, payment_method: selectedMethod, payment_details: type === "withdraw" ? { account_number: accountNumber } : null, status: "pending" });
      if (error) throw error;
      supabase.functions.invoke("notify-admin-transaction", { body: { type, amount: numAmount, payment_method: selectedMethod, user_id: user.id } }).catch((err) => console.error("Failed to send admin notification:", err));
      toast.success(type === "deposit" ? "Deposit request submitted! Waiting for admin approval." : "Withdrawal request submitted! Waiting for admin approval.");
      setAmount(""); setAccountNumber(""); setSelectedMethod("");
      fetchPendingRequests(); fetchAllRequests(); onSuccess();
    } catch (error) { console.error("Submit error:", error); toast.error("Failed to submit request. Please try again."); }
    finally { setIsProcessing(false); }
  };

  const formatDate = (timestamp: string) => new Date(timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const getStatusIcon = (status: string) => { switch (status) { case "pending": return <Clock className="text-amber-500" size={16} />; case "approved": return <CheckCircle className="text-emerald-500" size={16} />; case "rejected": return <XCircle className="text-rose-500" size={16} />; default: return <AlertCircle className="text-gray-500" size={16} />; } };
  const getStatusColor = (status: string) => { switch (status) { case "pending": return "bg-amber-100 text-amber-700"; case "approved": return "bg-emerald-100 text-emerald-700"; case "rejected": return "bg-rose-100 text-rose-700"; default: return "bg-gray-100 text-gray-700"; } };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-800">{showHistory ? `${type === "deposit" ? "Deposit" : "Withdrawal"} History` : `${type === "deposit" ? "Deposit" : "Withdraw"} Request`}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-teal-500 font-medium">{showHistory ? "New Request" : "View History"}</button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
          </div>
        </div>
        {showHistory ? (
          <div className="p-4">
            {allRequests.length === 0 ? (<div className="text-center py-8 text-gray-400"><Clock className="mx-auto mb-3" size={40} /><p>No {type} requests yet</p></div>) : (
              <div className="space-y-3">{allRequests.map((request) => { const method = PAYMENT_METHODS.find(m => m.id === request.payment_method); return (
                <div key={request.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden p-1 flex-shrink-0 border border-gray-100">
                      {method?.logo ? <img src={method.logo} alt={method.name} className="w-full h-full object-contain" /> : method?.icon ? <span className="text-xl">{method.icon}</span> : <Wallet className="text-gray-400" size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">{getStatusIcon(request.status)}<span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(request.status)}`}>{request.status}</span></div>
                        <p className={`font-bold ${type === "deposit" ? "text-emerald-600" : "text-cyan-600"}`}>৳{request.amount.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1"><span className="text-gray-500 uppercase text-xs">{request.payment_method}</span><span className="text-gray-400 text-xs">{formatDate(request.created_at)}</span></div>
                    </div>
                  </div>
                  {request.admin_notes && <p className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded">Note: {request.admin_notes}</p>}
                </div>
              ); })}</div>
            )}
          </div>
        ) : (
          <div className="p-4">
            {pendingRequests.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 text-amber-700"><Clock size={16} /><span className="text-sm font-medium">{pendingRequests.length} pending {type} request{pendingRequests.length > 1 ? "s" : ""}</span></div>
                <p className="text-xs text-amber-600 mt-1">Total: ৳{pendingRequests.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}</p>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">{PAYMENT_METHODS.map((method) => (
                <button key={method.id} onClick={() => setSelectedMethod(method.id)} className={`p-3 rounded-xl border-2 transition-all ${selectedMethod === method.id ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="w-8 h-8 mx-auto mb-1 bg-white rounded-lg flex items-center justify-center overflow-hidden p-0.5">{method.logo ? <img src={method.logo} alt={method.name} className="w-full h-full object-contain" /> : <span className="text-xl">{method.icon}</span>}</div>
                  <span className="text-xs font-medium text-gray-700">{method.name}</span>
                </button>
              ))}</div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (৳)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg" />
              <div className="grid grid-cols-3 gap-2 mt-2">{QUICK_AMOUNTS.map((quickAmount) => (
                <button key={quickAmount} onClick={() => setAmount(quickAmount.toString())} className={`py-2 rounded-lg text-sm font-medium transition-all ${amount === quickAmount.toString() ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>৳{quickAmount.toLocaleString()}</button>
              ))}</div>
            </div>
            {type === "withdraw" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{selectedMethod?.toUpperCase() || "Payment"} Account Number</label>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))} placeholder="Enter account number" maxLength={15} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <p className="text-xs text-gray-500 mt-1">Available balance: ৳{balance.toLocaleString()}</p>
              </div>
            )}
            {type === "deposit" && selectedMethod && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-blue-700 font-medium mb-1">How to deposit:</p>
                <ol className="text-xs text-blue-600 space-y-1"><li>1. Submit this deposit request</li><li>2. Send money to our {selectedMethod.toUpperCase()} merchant number</li><li>3. Admin will verify and approve your deposit</li><li>4. Funds will be credited to your wallet</li></ol>
              </div>
            )}
            <button onClick={handleSubmit} disabled={!selectedMethod || !amount || isProcessing || (type === "withdraw" && !accountNumber)} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {isProcessing ? (<><Loader2 className="animate-spin" size={18} />Submitting...</>) : (`Submit ${type === "deposit" ? "Deposit" : "Withdrawal"} Request`)}
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">{type === "deposit" ? "Deposits are processed within 1-2 hours after verification" : "Withdrawals are processed within 24 hours after verification"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionRequestForm;
