import { useState, useCallback } from "react";
import { Shield, Copy, Check, Eye, EyeOff, Calculator, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

interface MinesProvablyFairModalProps {
  seedHash: string;
  clientSeed: string;
  nonce: number;
  serverSeed: string;
  minePositions: number[];
  gridSize: number;
  mineCount: number;
  isRoundComplete: boolean; // true when game ended (won/lost/cashed_out)
  roundId: string | null;
}

const translations = {
  title: { en: "Provably Fair", bn: "প্রমাণযোগ্য ন্যায্য" },
  verified: { en: "Verified", bn: "যাচাইকৃত" },
  seedHash: { en: "Seed Hash", bn: "সিড হ্যাশ" },
  hidden: { en: "Hidden", bn: "গোপন" },
  revealed: { en: "Revealed", bn: "প্রকাশিত" },
  serverSeed: { en: "Server Seed", bn: "সার্ভার সিড" },
  clientSeed: { en: "Client Seed", bn: "ক্লায়েন্ট সিড" },
  nonce: { en: "Nonce (Round)", bn: "ননস (রাউন্ড)" },
  minePositions: { en: "Mine Positions", bn: "মাইন অবস্থান" },
  copySuccess: { en: "Copied to clipboard!", bn: "ক্লিপবোর্ডে কপি হয়েছে!" },
  verifyResults: { en: "Verify Results", bn: "ফলাফল যাচাই করুন" },
  verifyTitle: { en: "Verify Mine Positions", bn: "মাইন অবস্থান যাচাই করুন" },
  enterServerSeed: { en: "Enter server seed...", bn: "সার্ভার সিড লিখুন..." },
  enterClientSeed: { en: "Enter client seed...", bn: "ক্লায়েন্ট সিড লিখুন..." },
  enterNonce: { en: "Enter nonce...", bn: "ননস লিখুন..." },
  gridSizeLabel: { en: "Grid Size", bn: "গ্রিড সাইজ" },
  mineCountLabel: { en: "Mine Count", bn: "মাইন সংখ্যা" },
  expectedHash: { en: "Expected Hash (optional)", bn: "প্রত্যাশিত হ্যাশ (ঐচ্ছিক)" },
  verifyButton: { en: "Calculate & Verify", bn: "গণনা ও যাচাই করুন" },
  verifying: { en: "Verifying...", bn: "যাচাই হচ্ছে..." },
  computedHash: { en: "Computed Hash", bn: "গণনাকৃত হ্যাশ" },
  calculatedMines: { en: "Calculated Mine Positions", bn: "গণনাকৃত মাইন অবস্থান" },
  hashMatch: { en: "Hash Match", bn: "হ্যাশ মিলেছে" },
  hashMismatch: { en: "Hash Mismatch", bn: "হ্যাশ মেলেনি" },
  fillAllFields: { en: "Please fill all required fields", bn: "সব প্রয়োজনীয় ফিল্ড পূরণ করুন" },
  verificationFailed: { en: "Verification failed", bn: "যাচাই ব্যর্থ হয়েছে" },
  roundComplete: { en: "Round Complete - Seeds Revealed", bn: "রাউন্ড সম্পন্ন - সিড প্রকাশিত" },
  activeRound: { en: "Active Round - Hash Only", bn: "সক্রিয় রাউন্ড - শুধু হ্যাশ" },
};

const t = (key: keyof typeof translations, lang: 'en' | 'bn') => translations[key][lang];

const MinesProvablyFairModal = ({
  seedHash,
  clientSeed,
  nonce,
  serverSeed,
  minePositions,
  gridSize,
  mineCount,
  isRoundComplete,
  roundId,
}: MinesProvablyFairModalProps) => {
  const { language } = useLanguage();
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showVerifier, setShowVerifier] = useState(false);
  
  // Verification form state
  const [verifyServerSeed, setVerifyServerSeed] = useState("");
  const [verifyClientSeed, setVerifyClientSeed] = useState("");
  const [verifyNonce, setVerifyNonce] = useState("");
  const [verifyGridSize, setVerifyGridSize] = useState("25");
  const [verifyMineCount, setVerifyMineCount] = useState("5");
  const [verifyExpectedHash, setVerifyExpectedHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    isValid: boolean;
    computedHash: string;
    expectedHash: string;
    minePositions: number[];
  } | null>(null);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(t('copySuccess', language));
    setTimeout(() => setCopied(null), 2000);
  }, [language]);

  const handleVerify = useCallback(async () => {
    if (!verifyServerSeed || !verifyClientSeed || !verifyNonce) {
      toast.error(t('fillAllFields', language));
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('mines-verify', {
        body: {
          serverSeed: verifyServerSeed,
          clientSeed: verifyClientSeed,
          nonce: parseInt(verifyNonce),
          gridSize: parseInt(verifyGridSize),
          mineCount: parseInt(verifyMineCount),
          expectedHash: verifyExpectedHash || undefined,
        },
      });

      if (error) throw error;
      setVerifyResult(data);
    } catch (err) {
      console.error('Verification error:', err);
      toast.error(t('verificationFailed', language));
    } finally {
      setIsVerifying(false);
    }
  }, [verifyServerSeed, verifyClientSeed, verifyNonce, verifyGridSize, verifyMineCount, verifyExpectedHash, language]);

  // Pre-fill verification form with current round data
  const handleOpenVerifier = useCallback(() => {
    if (isRoundComplete && serverSeed) {
      setVerifyServerSeed(serverSeed);
      setVerifyClientSeed(clientSeed);
      setVerifyNonce(nonce.toString());
      setVerifyGridSize(gridSize.toString());
      setVerifyMineCount(mineCount.toString());
      setVerifyExpectedHash(seedHash);
    }
    setShowVerifier(true);
  }, [isRoundComplete, serverSeed, clientSeed, nonce, gridSize, mineCount, seedHash]);

  if (!seedHash) return null;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header - Clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-3 flex items-center justify-between"
      >
        <h3 className="text-white font-bold flex items-center gap-2 text-sm">
          <Shield className="text-emerald-400" size={16} />
          {t('title', language)}
          <Badge className="bg-emerald-500/30 text-emerald-300 text-xs ml-1">
            {t('verified', language)}
          </Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Badge className={isRoundComplete ? "bg-amber-500/20 text-amber-400 text-xs" : "bg-cyan-500/20 text-cyan-400 text-xs"}>
            {isRoundComplete ? <Eye size={10} className="mr-1" /> : <EyeOff size={10} className="mr-1" />}
            {isRoundComplete ? t('revealed', language) : t('hidden', language)}
          </Badge>
          {expanded ? (
            <ChevronUp className="text-slate-400" size={16} />
          ) : (
            <ChevronDown className="text-slate-400" size={16} />
          )}
        </div>
      </button>

      {/* Collapsed View - Just hash */}
      {!expanded && (
        <div className="px-4 py-2 border-t border-slate-700/50">
          <p className="text-slate-500 text-xs font-mono truncate">{seedHash.slice(0, 32)}...</p>
        </div>
      )}

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 space-y-4 border-t border-slate-700/50">
          {/* Status Badge */}
          <div className={`rounded-lg p-2 text-center text-xs font-medium ${
            isRoundComplete 
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" 
              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
          }`}>
            {isRoundComplete ? t('roundComplete', language) : t('activeRound', language)}
          </div>

          {/* Seed Hash */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">{t('seedHash', language)}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(seedHash, 'hash')}
                className="h-6 px-2 text-xs"
              >
                {copied === 'hash' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              </Button>
            </div>
            <code className="block bg-slate-900/50 rounded-lg p-2 text-xs font-mono text-emerald-400 break-all border border-slate-700">
              {seedHash}
            </code>
          </div>

          {/* Revealed Data (only after round ends) */}
          {isRoundComplete && serverSeed && (
            <div className="bg-slate-900/50 rounded-lg p-3 space-y-3 border border-amber-500/30">
              {/* Server Seed */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">{t('serverSeed', language)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(serverSeed, 'server')}
                    className="h-5 px-2 text-xs"
                  >
                    {copied === 'server' ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                  </Button>
                </div>
                <code className="block text-amber-400 font-mono text-xs break-all bg-slate-800 rounded p-1.5">
                  {serverSeed}
                </code>
              </div>

              {/* Client Seed */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">{t('clientSeed', language)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(clientSeed, 'client')}
                    className="h-5 px-2 text-xs"
                  >
                    {copied === 'client' ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                  </Button>
                </div>
                <code className="block text-cyan-400 font-mono text-xs break-all bg-slate-800 rounded p-1.5">
                  {clientSeed}
                </code>
              </div>

              {/* Nonce */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">{t('nonce', language)}</span>
                <Badge className="bg-purple-500/20 text-purple-400 text-xs font-mono">
                  #{nonce}
                </Badge>
              </div>

              {/* Mine Positions */}
              <div className="space-y-1 pt-2 border-t border-slate-700">
                <span className="text-slate-400 text-xs">{t('minePositions', language)}</span>
                <div className="flex flex-wrap gap-1">
                  {minePositions.map((pos, idx) => (
                    <Badge key={idx} className="bg-red-500/20 text-red-400 text-xs font-mono px-2">
                      {pos}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Verify Button */}
          <Dialog open={showVerifier} onOpenChange={setShowVerifier}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={handleOpenVerifier}
                className="w-full bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
              >
                <Calculator size={14} className="mr-2" />
                {t('verifyResults', language)}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="text-emerald-400" />
                  {t('verifyTitle', language)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                {/* Server Seed */}
                <div className="space-y-1">
                  <label className="text-sm text-slate-400">{t('serverSeed', language)}</label>
                  <Input
                    value={verifyServerSeed}
                    onChange={(e) => setVerifyServerSeed(e.target.value)}
                    placeholder={t('enterServerSeed', language)}
                    className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  />
                </div>

                {/* Client Seed */}
                <div className="space-y-1">
                  <label className="text-sm text-slate-400">{t('clientSeed', language)}</label>
                  <Input
                    value={verifyClientSeed}
                    onChange={(e) => setVerifyClientSeed(e.target.value)}
                    placeholder={t('enterClientSeed', language)}
                    className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  />
                </div>

                {/* Nonce */}
                <div className="space-y-1">
                  <label className="text-sm text-slate-400">{t('nonce', language)}</label>
                  <Input
                    type="number"
                    value={verifyNonce}
                    onChange={(e) => setVerifyNonce(e.target.value)}
                    placeholder={t('enterNonce', language)}
                    className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  />
                </div>

                {/* Grid Size & Mine Count */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm text-slate-400">{t('gridSizeLabel', language)}</label>
                    <Input
                      type="number"
                      value={verifyGridSize}
                      onChange={(e) => setVerifyGridSize(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-slate-400">{t('mineCountLabel', language)}</label>
                    <Input
                      type="number"
                      value={verifyMineCount}
                      onChange={(e) => setVerifyMineCount(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Expected Hash (optional) */}
                <div className="space-y-1">
                  <label className="text-sm text-slate-400">{t('expectedHash', language)}</label>
                  <Input
                    value={verifyExpectedHash}
                    onChange={(e) => setVerifyExpectedHash(e.target.value)}
                    placeholder="SHA-256 hash..."
                    className="bg-slate-700 border-slate-600 text-white font-mono text-xs"
                  />
                </div>

                {/* Verify Button */}
                <Button
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  {isVerifying ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {t('verifying', language)}
                    </>
                  ) : (
                    <>
                      <Calculator size={14} className="mr-2" />
                      {t('verifyButton', language)}
                    </>
                  )}
                </Button>

                {/* Verification Result */}
                {verifyResult && (
                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-3 border border-emerald-500/30">
                    {/* Computed Hash */}
                    <div className="space-y-1">
                      <span className="text-slate-400 text-xs">{t('computedHash', language)}</span>
                      <code className="block text-emerald-400 font-mono text-xs break-all">
                        {verifyResult.computedHash}
                      </code>
                    </div>

                    {/* Hash Match Status */}
                    {verifyResult.expectedHash && (
                      <div className={`flex items-center gap-2 p-2 rounded ${
                        verifyResult.isValid 
                          ? "bg-green-500/10 border border-green-500/30" 
                          : "bg-red-500/10 border border-red-500/30"
                      }`}>
                        {verifyResult.isValid ? (
                          <Check size={14} className="text-green-400" />
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                        <span className={`text-sm font-medium ${
                          verifyResult.isValid ? "text-green-400" : "text-red-400"
                        }`}>
                          {verifyResult.isValid ? t('hashMatch', language) : t('hashMismatch', language)}
                        </span>
                      </div>
                    )}

                    {/* Calculated Mine Positions */}
                    <div className="space-y-2 pt-2 border-t border-slate-700">
                      <span className="text-slate-400 text-xs">{t('calculatedMines', language)}</span>
                      <div className="flex flex-wrap gap-1">
                        {verifyResult.minePositions.map((pos, idx) => (
                          <Badge key={idx} className="bg-red-500/20 text-red-400 text-xs font-mono px-2">
                            {pos}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default MinesProvablyFairModal;
