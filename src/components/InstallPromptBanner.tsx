import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPromptBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem("pwa-banner-dismissed");
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) return; // Don't show for 24 hours after dismissal
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show banner for iOS after a delay
      setTimeout(() => setShowBanner(true), 2000);
    }

    // Listen for install prompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS, show instructions
      alert("📱 iOS ইন্সটল করতে:\n\n1. Safari এর Share বাটনে ট্যাপ করুন\n2. 'Add to Home Screen' সিলেক্ট করুন\n3. 'Add' চাপুন");
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="mx-3 mb-2 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 rounded-xl p-3 shadow-lg relative overflow-hidden animate-fade-in">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10" />
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-white rounded-full translate-x-8 translate-y-8" />
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        <X size={14} className="text-white" />
      </button>

      <div className="flex items-center gap-3 relative z-10">
        {/* Icon */}
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <div className="relative">
            <Smartphone className="text-orange-500" size={24} />
            <Download className="absolute -bottom-1 -right-1 text-green-500 bg-white rounded-full p-0.5" size={12} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm">
            📲 অ্যাপ ইন্সটল করুন!
          </h3>
          <p className="text-white/90 text-xs mt-0.5 line-clamp-2">
            দ্রুত অ্যাক্সেস ও সেরা অভিজ্ঞতার জন্য GoLucky অ্যাপ ইন্সটল করুন
          </p>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstallClick}
          className="flex-shrink-0 bg-white text-orange-600 font-bold text-xs px-4 py-2 rounded-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Download size={14} />
          ইন্সটল
        </button>
      </div>
    </div>
  );
};

export default InstallPromptBanner;
