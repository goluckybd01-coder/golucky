import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Smartphone, Share, MoreVertical, Plus, Check } from "lucide-react";
import pwaIcon from "@/assets/pwa-icon.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-orange-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-4 py-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
          <ArrowLeft className="text-white" size={22} />
        </button>
        <span className="text-white font-bold text-lg tracking-wide">অ্যাপ ইন্সটল</span>
        <div className="w-10" />
      </header>

      <div className="relative px-5 py-6 z-10">
        {/* App Icon with Glow */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[28px] blur-xl opacity-60 scale-110" />
            <div className="relative w-28 h-28 rounded-[28px] shadow-2xl overflow-hidden ring-4 ring-white/30">
              <img src={pwaIcon} alt="GoLucky" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* App Name */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span 
              className="text-3xl font-black tracking-tight"
              style={{ 
                background: "linear-gradient(135deg, #fef08a 0%, #fbbf24 50%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 20px rgba(251, 191, 36, 0.4)"
              }}
            >
              Go<span style={{ 
                background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Lucky</span>
            </span>
            <span className="text-2xl animate-bounce">🍀</span>
          </div>
          <p className="text-white/70 text-xs font-medium tracking-widest uppercase">Play • Win • Repeat</p>
        </div>

        {/* Status */}
        {isInstalled ? (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 rounded-2xl p-5 mb-5 text-center backdrop-blur-sm">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/30">
              <Check className="text-white" size={28} />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">ইন্সটল সম্পন্ন! ✨</h3>
            <p className="text-white/60 text-sm">
              GoLucky আপনার হোম স্ক্রিনে যোগ হয়েছে
            </p>
          </div>
        ) : (
          <>
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-white to-gray-50 text-orange-600 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl mb-5 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Download size={20} className="text-white" />
                </div>
                <span className="text-lg">এখনই ইন্সটল করুন</span>
              </button>
            )}

            {isIOS && !deferredPrompt && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-5 border border-white/20">
                <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Smartphone size={18} className="text-white" />
                  </div>
                  iPhone/iPad এ ইন্সটল
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">1</div>
                    <div>
                      <p className="text-white font-medium text-sm flex items-center gap-2">
                        <Share size={14} /> Share বাটনে ট্যাপ করুন
                      </p>
                      <p className="text-white/50 text-xs">Safari ব্রাউজারের নিচে</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">2</div>
                    <div>
                      <p className="text-white font-medium text-sm flex items-center gap-2">
                        <Plus size={14} /> "Add to Home Screen"
                      </p>
                      <p className="text-white/50 text-xs">স্ক্রল করে খুঁজুন</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">3</div>
                    <div>
                      <p className="text-white font-medium text-sm flex items-center gap-2">
                        <Check size={14} /> "Add" ট্যাপ করুন
                      </p>
                      <p className="text-white/50 text-xs">হোম স্ক্রিনে অ্যাপ যোগ হবে</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isAndroid && !deferredPrompt && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-5 border border-white/20">
                <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Smartphone size={18} className="text-white" />
                  </div>
                  Android এ ইন্সটল
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">1</div>
                    <div>
                      <p className="text-white font-medium text-sm flex items-center gap-2">
                        <MoreVertical size={14} /> মেনু বাটনে ট্যাপ করুন
                      </p>
                      <p className="text-white/50 text-xs">ব্রাউজারের উপরে ⋮ আইকন</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">2</div>
                    <div>
                      <p className="text-white font-medium text-sm flex items-center gap-2">
                        <Download size={14} /> "Install App" সিলেক্ট করুন
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">3</div>
                    <div>
                      <p className="text-white font-medium text-sm flex items-center gap-2">
                        <Check size={14} /> "Install" ট্যাপ করুন
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isIOS && !isAndroid && !deferredPrompt && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-5 border border-white/20">
                <h3 className="text-white font-bold text-base mb-3">🖥️ Desktop এ ইন্সটল</h3>
                <p className="text-white/60 text-sm">
                  Chrome বা Edge ব্রাউজারে অ্যাড্রেস বারের ডানে ইন্সটল আইকন ক্লিক করুন।
                </p>
              </div>
            )}
          </>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
          <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <span className="text-xl">✨</span> অ্যাপ ইন্সটলের সুবিধা
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-white/80 text-xs font-medium">দ্রুত লোডিং</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">📱</div>
              <p className="text-white/80 text-xs font-medium">ফুল স্ক্রিন</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">🏠</div>
              <p className="text-white/80 text-xs font-medium">হোম শর্টকাট</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">📴</div>
              <p className="text-white/80 text-xs font-medium">অফলাইন মোড</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/home")}
          className="w-full mt-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white/80 text-sm font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} />
          হোমে ফিরে যান
        </button>
      </div>
    </div>
  );
};

export default Install;
