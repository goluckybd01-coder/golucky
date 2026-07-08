import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Share2, Gift, Crown, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ReferralShareCardProps {
  referralCode: string;
  referralLink: string;
  totalEarned?: number;
  teamSize?: number;
}

const ReferralShareCard = ({ 
  referralCode, 
  referralLink, 
  totalEarned = 0, 
  teamSize = 0 
}: ReferralShareCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    try {
      // Dynamic import for html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `GoLucky-Referral-${referralCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success("Share card downloaded!");
    } catch (error) {
      console.error("Error downloading card:", error);
      toast.error("Failed to download card");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    const shareData = {
      title: '🍀 Join GoLucky & Win Big!',
      text: `🎮 Join me on GoLucky and get ৳125 bonus!\n\n💰 Use my code: ${referralCode}\n🎁 Play exciting games & win real money!\n\n👉 Register now:`,
      url: referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
          toast.success("Link copied!");
        }
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="space-y-4">
      {/* Shareable Card */}
      <div 
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-1"
      >
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-400 to-transparent rounded-full blur-3xl" />
          </div>
          
          {/* Floating Icons */}
          <div className="absolute top-3 right-3 opacity-20">
            <Sparkles className="text-yellow-400 w-6 h-6" />
          </div>
          
          {/* Header */}
          <div className="relative flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-2xl">🍀</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">GoLucky</h3>
              <p className="text-emerald-300 text-xs">Play. Invest. Earn. 🚀</p>
            </div>
          </div>

          {/* Bonus Banner */}
          <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3 mb-4 text-center shadow-lg shadow-amber-500/20">
            <div className="flex items-center justify-center gap-2">
              <Gift className="text-white w-5 h-5" />
              <span className="text-white font-bold text-lg">Get ৳125 Bonus!</span>
            </div>
            <p className="text-amber-100 text-xs mt-1">Sign up & start winning today</p>
          </div>

          {/* QR Code & Code Section */}
          <div className="relative flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl p-4">
            {/* QR Code */}
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <QRCodeSVG
                value={referralLink}
                size={80}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>
            
            {/* Code & Stats */}
            <div className="flex-1">
              <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Referral Code</p>
              <p className="text-white font-mono font-bold text-xl tracking-widest mb-3">
                {referralCode}
              </p>
              
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-gray-300 text-xs">৳{totalEarned.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-gray-300 text-xs">{teamSize} members</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="relative mt-4 text-center">
            <p className="text-gray-400 text-xs">Scan QR or use code to join</p>
            <p className="text-emerald-400 text-xs font-medium mt-1 truncate">{referralLink}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleDownloadCard}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Download size={18} />
          {isDownloading ? "Saving..." : "Save Card"}
        </button>
        <button
          onClick={handleNativeShare}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Share2 size={18} />
          Share Now
        </button>
      </div>
    </div>
  );
};

export default ReferralShareCard;
