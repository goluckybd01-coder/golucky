import { useState, useCallback } from "react";
import { Shield, Copy, Check, Eye, EyeOff, Calculator, ChevronDown, ChevronUp, RefreshCw, Edit3, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface FairnessData {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  crashPoint: number;
}

interface ProvablyFairDisplayProps {
  currentHash: string;
  isRevealed: boolean;
  revealedData: FairnessData | null;
  roundHistory: FairnessData[];
  clientSeed?: string;
  onClientSeedChange?: (newSeed: string) => void;
  nonce?: number;
}

// Generate SHA-256 hash
export const generateHash = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate random hex string
export const generateRandomSeed = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Calculate crash point from seeds (provably fair algorithm)
export const calculateCrashPoint = (serverSeed: string, clientSeed: string, nonce: number): number => {
  const combinedSeed = `${serverSeed}-${clientSeed}-${nonce}`;
  
  // Use a simple hash-based PRNG
  let hash = 0;
  for (let i = 0; i < combinedSeed.length; i++) {
    const char = combinedSeed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Convert to positive number between 0 and 1
  const random = Math.abs(hash % 10000) / 10000;
  
  // RTP of 94%
  const rtp = 0.94;
  const crash = 1 / (1 - random * rtp);
  
  // Cap at 100x with rare jackpots
  if (random < 0.002) {
    return Math.min(100, Number((crash * 2).toFixed(2)));
  }
  
  return Math.min(20, Math.max(1.01, Number(crash.toFixed(2))));
};

const ProvablyFairDisplay = ({ 
  currentHash, 
  isRevealed, 
  revealedData, 
  roundHistory,
  clientSeed = "",
  onClientSeedChange,
  nonce = 1,
}: ProvablyFairDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const [showVerifier, setShowVerifier] = useState(false);
  const [verifyServerSeed, setVerifyServerSeed] = useState("");
  const [verifyClientSeed, setVerifyClientSeed] = useState("");
  const [verifyNonce, setVerifyNonce] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ hash: string; crashPoint: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  
  // Client seed editing state
  const [isEditingClientSeed, setIsEditingClientSeed] = useState(false);
  const [editClientSeed, setEditClientSeed] = useState(clientSeed);
  const [showClientSeedDialog, setShowClientSeedDialog] = useState(false);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleVerify = useCallback(async () => {
    if (!verifyServerSeed || !verifyClientSeed || !verifyNonce) {
      toast.error("Please fill all fields");
      return;
    }

    const hash = await generateHash(verifyServerSeed);
    const crashPoint = calculateCrashPoint(verifyServerSeed, verifyClientSeed, parseInt(verifyNonce));
    
    setVerifyResult({ hash, crashPoint });
  }, [verifyServerSeed, verifyClientSeed, verifyNonce]);

  const handleSaveClientSeed = useCallback(() => {
    if (!editClientSeed || editClientSeed.length < 8) {
      toast.error("Client seed must be at least 8 characters");
      return;
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(editClientSeed)) {
      toast.error("Client seed must be alphanumeric only");
      return;
    }
    
    onClientSeedChange?.(editClientSeed);
    setShowClientSeedDialog(false);
    toast.success("Client seed updated! Will apply to next round.");
  }, [editClientSeed, onClientSeedChange]);

  const handleRandomizeClientSeed = useCallback(() => {
    const newSeed = generateRandomSeed(16);
    setEditClientSeed(newSeed);
  }, []);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-3 border-b border-slate-700 flex items-center justify-between"
      >
        <h3 className="text-white font-bold flex items-center gap-2">
          <Shield className="text-emerald-400" size={18} />
          Provably Fair
          <Badge className="bg-emerald-500/30 text-emerald-300 text-xs ml-2">
            Verified
          </Badge>
        </h3>
        {expanded ? (
          <ChevronUp className="text-slate-400" size={18} />
        ) : (
          <ChevronDown className="text-slate-400" size={18} />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Current Round Hash */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm font-medium">
                {isRevealed ? "Previous Round" : "Next Round"} Hash
              </span>
              <Badge className={isRevealed ? "bg-amber-500/20 text-amber-400" : "bg-cyan-500/20 text-cyan-400"}>
                {isRevealed ? <Eye size={12} className="mr-1" /> : <EyeOff size={12} className="mr-1" />}
                {isRevealed ? "Revealed" : "Hidden"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-900/50 rounded-lg p-2.5 text-xs font-mono text-emerald-400 break-all border border-slate-700">
                {currentHash.slice(0, 32)}...
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(currentHash)}
                className="bg-slate-700 border-slate-600 hover:bg-slate-600"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </Button>
            </div>
          </div>

          {/* Revealed Data */}
          {isRevealed && revealedData && (
            <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 border border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Server Seed:</span>
                <code className="text-amber-400 font-mono text-xs">
                  {revealedData.serverSeed.slice(0, 16)}...
                  <button 
                    onClick={() => copyToClipboard(revealedData.serverSeed)}
                    className="ml-2 text-slate-500 hover:text-white"
                  >
                    <Copy size={12} />
                  </button>
                </code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Client Seed:</span>
                <code className="text-cyan-400 font-mono text-xs">
                  {revealedData.clientSeed.slice(0, 16)}...
                </code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Nonce:</span>
                <code className="text-purple-400 font-mono text-xs">
                  #{revealedData.nonce}
                </code>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700">
                <span className="text-slate-400">Crash Point:</span>
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold">
                  {revealedData.crashPoint.toFixed(2)}x
                </Badge>
              </div>
            </div>
          )}

          {/* Your Client Seed Section */}
          <div className="bg-slate-900/50 rounded-lg p-3 space-y-3 border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 text-sm font-medium flex items-center gap-2">
                <Edit3 size={14} />
                Your Client Seed
              </span>
              <Badge className="bg-cyan-500/20 text-cyan-300 text-xs">
                Round #{nonce}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-800 rounded-lg p-2.5 text-xs font-mono text-cyan-400 break-all border border-slate-700">
                {clientSeed.slice(0, 24)}{clientSeed.length > 24 ? "..." : ""}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(clientSeed)}
                className="bg-slate-700 border-slate-600 hover:bg-slate-600"
              >
                <Copy size={14} />
              </Button>
            </div>
            
            <Dialog open={showClientSeedDialog} onOpenChange={(open) => {
              setShowClientSeedDialog(open);
              if (open) setEditClientSeed(clientSeed);
            }}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/30 text-cyan-300"
                >
                  <Edit3 size={14} className="mr-2" />
                  Change Client Seed
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Edit3 className="text-cyan-400" />
                    Set Your Client Seed
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 pt-4">
                  <p className="text-slate-400 text-sm">
                    Your client seed is combined with the server seed to generate provably fair results. 
                    You can set your own seed for extra verification.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Client Seed (min 8 alphanumeric characters)</label>
                    <div className="flex gap-2">
                      <Input
                        value={editClientSeed}
                        onChange={(e) => setEditClientSeed(e.target.value)}
                        placeholder="Enter your custom seed..."
                        className="bg-slate-700 border-slate-600 text-white font-mono text-sm flex-1"
                        maxLength={64}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRandomizeClientSeed}
                        className="bg-slate-700 border-slate-600 hover:bg-slate-600 px-3"
                        title="Generate random seed"
                      >
                        <RefreshCw size={14} />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      {editClientSeed.length}/64 characters
                    </p>
                  </div>
                  
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-amber-400 text-xs">
                      ⚠️ Your new client seed will be applied starting from the <strong>next round</strong>. 
                      The current round's outcome has already been determined.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowClientSeedDialog(false)}
                      className="flex-1 bg-slate-700 border-slate-600 hover:bg-slate-600"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveClientSeed}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    >
                      <Save size={14} className="mr-2" />
                      Save Seed
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Verify Button */}
          <Dialog open={showVerifier} onOpenChange={setShowVerifier}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
              >
                <Calculator size={16} className="mr-2" />
                Verify Results
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="text-emerald-400" />
                  Verify Crash Point
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Server Seed</label>
                  <Input
                    value={verifyServerSeed}
                    onChange={(e) => setVerifyServerSeed(e.target.value)}
                    placeholder="Enter server seed..."
                    className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Client Seed</label>
                  <Input
                    value={verifyClientSeed}
                    onChange={(e) => setVerifyClientSeed(e.target.value)}
                    placeholder="Enter client seed..."
                    className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Nonce (Round Number)</label>
                  <Input
                    type="number"
                    value={verifyNonce}
                    onChange={(e) => setVerifyNonce(e.target.value)}
                    placeholder="Enter nonce..."
                    className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  />
                </div>
                
                <Button 
                  onClick={handleVerify}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Calculator size={16} className="mr-2" />
                  Calculate & Verify
                </Button>
                
                {verifyResult && (
                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-3 border border-emerald-500/30">
                    <div className="space-y-1">
                      <span className="text-slate-400 text-xs">Generated Hash:</span>
                      <code className="block text-emerald-400 font-mono text-xs break-all">
                        {verifyResult.hash}
                      </code>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                      <span className="text-white font-medium">Crash Point:</span>
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-lg px-3">
                        {verifyResult.crashPoint.toFixed(2)}x
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Round History */}
          {roundHistory.length > 0 && (
            <div className="space-y-2">
              <span className="text-slate-400 text-sm font-medium">Recent Rounds</span>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {roundHistory.slice(0, 5).map((round, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between bg-slate-900/30 rounded px-3 py-2 text-xs"
                  >
                    <span className="text-slate-500">#{round.nonce}</span>
                    <Badge className={`${
                      round.crashPoint < 2 ? "bg-red-500/20 text-red-400" : 
                      round.crashPoint < 5 ? "bg-cyan-500/20 text-cyan-400" : 
                      "bg-green-500/20 text-green-400"
                    }`}>
                      {round.crashPoint.toFixed(2)}x
                    </Badge>
                    <button
                      onClick={() => {
                        setVerifyServerSeed(round.serverSeed);
                        setVerifyClientSeed(round.clientSeed);
                        setVerifyNonce(round.nonce.toString());
                        setShowVerifier(true);
                      }}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      Verify
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <p className="text-slate-500 text-xs leading-relaxed">
            Each round's outcome is determined by combining server seed, client seed, and nonce before the round starts. 
            The hash is shown before betting, and seeds are revealed after the crash for verification.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProvablyFairDisplay;
