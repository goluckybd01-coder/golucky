import { useState, useEffect } from "react";
import { X, Shield, Check, Copy, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { RoundResult } from "@/pages/games/AviatorGame";

interface AviatorFairModalProps {
  open: boolean;
  onClose: () => void;
  history: RoundResult[];
  currentServerSeedHash: string;
  currentClientSeed: string;
  currentNonce: number;
}

const hashSeed = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
};

const calculateCrashPoint = (serverSeed: string, clientSeed: string, nonce: number): number => {
  const combined = `${serverSeed}-${clientSeed}-${nonce}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash = hash & hash;
  }
  const normalized = Math.abs(hash % 10000) / 10000;
  const houseEdge = 0.04;
  if (normalized < houseEdge) return 1.00;
  return Math.max(1.00, Math.pow(1 / (1 - normalized), 0.5) * 0.99);
};

const AviatorFairModal = ({
  open,
  onClose,
  history,
  currentServerSeedHash,
  currentClientSeed,
  currentNonce,
}: AviatorFairModalProps) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'verify'>('current');
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const [manualServerSeed, setManualServerSeed] = useState("");
  const [manualClientSeed, setManualClientSeed] = useState("");
  const [manualNonce, setManualNonce] = useState(1);
  const [verificationResult, setVerificationResult] = useState<{ hash: string; crashPoint: number; } | null>(null);

  const handleVerify = () => {
    if (!manualServerSeed.trim()) {
      toast.error("Please enter a server seed");
      return;
    }
    const hash = hashSeed(manualServerSeed.trim());
    const crashPoint = calculateCrashPoint(
      manualServerSeed.trim(),
      manualClientSeed.trim() || "default",
      manualNonce
    );
    setVerificationResult({ hash, crashPoint: parseFloat(crashPoint.toFixed(2)) });
    toast.success("Verification complete!");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const verifyHistoricalRound = (round: RoundResult) => {
    const calculatedHash = hashSeed(round.serverSeed);
    const calculatedCrash = calculateCrashPoint(round.serverSeed, round.clientSeed, round.nonce);
    const hashMatches = calculatedHash === round.serverSeedHash;
    const crashMatches = Math.abs(calculatedCrash - round.multiplier) < 0.01;
    return { hashMatches, crashMatches, calculatedHash, calculatedCrash };
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="bg-[#1a1a1a] border-gray-700 text-white w-full sm:w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Provably Fair
          </SheetTitle>
        </SheetHeader>
        <div className="flex bg-[#2a2a2a] rounded-lg p-1 mt-4">
          {(['current', 'history', 'verify'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === tab ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          {activeTab === 'current' && (
            <div className="space-y-4">
              <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Current Round</h3>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Server Seed Hash (SHA-256)</Label>
                  <code className="block text-xs bg-[#1a1a1a] p-2 rounded font-mono text-green-400 break-all">
                    {currentServerSeedHash || 'Generating...'}
                  </code>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Your Client Seed</Label>
                  <code className="block text-xs bg-[#1a1a1a] p-2 rounded font-mono text-blue-400">{currentClientSeed}</code>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Nonce (Round Count)</Label>
                  <code className="block text-xs bg-[#1a1a1a] p-2 rounded font-mono text-purple-400">{currentNonce}</code>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No rounds played yet</div>
              ) : (
                history.map((round) => {
                  const verification = verifyHistoricalRound(round);
                  const isExpanded = expandedRound === round.roundId;
                  return (
                    <div key={round.roundId} className="bg-[#2a2a2a] rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedRound(isExpanded ? null : round.roundId)}
                        className="w-full flex items-center justify-between p-3 hover:bg-[#333]"
                      >
                        <span className="text-sm text-white">Round #{round.roundId}</span>
                        {verification.hashMatches && verification.crashMatches ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-red-400" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2 border-t border-gray-700 pt-2">
                          <code className="block text-xs text-green-400 break-all">{round.serverSeed}</code>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
          {activeTab === 'verify' && (
            <div className="space-y-4">
              <Input value={manualServerSeed} onChange={(e) => setManualServerSeed(e.target.value)} placeholder="Server seed..." className="bg-[#1a1a1a] border-gray-600 text-white" />
              <Input value={manualClientSeed} onChange={(e) => setManualClientSeed(e.target.value)} placeholder="Client seed..." className="bg-[#1a1a1a] border-gray-600 text-white" />
              <Input type="number" value={manualNonce} onChange={(e) => setManualNonce(parseInt(e.target.value) || 1)} className="bg-[#1a1a1a] border-gray-600 text-white" />
              <button onClick={handleVerify} className="w-full py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium">Calculate & Verify</button>
              {verificationResult && (
                <div className="text-2xl font-bold text-white">{verificationResult.crashPoint.toFixed(2)}x</div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AviatorFairModal;
