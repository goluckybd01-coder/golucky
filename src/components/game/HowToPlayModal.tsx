import { X } from "lucide-react";

interface HowToPlaySection {
  title: string;
  lines: string[];
}

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
  content: HowToPlaySection[];
  title?: string;
}

export default function HowToPlayModal({ 
  open, 
  onClose, 
  content, 
  title = "How to play" 
}: HowToPlayModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl mx-4 max-w-sm w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div 
          className="flex items-center justify-between px-5 py-4"
          style={{ background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)" }}
        >
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X className="text-white" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto max-h-[55vh] space-y-4">
          {content.map((sec, secIdx) => (
            <div key={secIdx}>
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                {sec.title}
              </h4>
              <div className="space-y-1.5 pl-2">
                {sec.lines.map((line, idx) => (
                  <p 
                    key={idx} 
                    className="text-gray-600 text-xs leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full text-white font-medium text-sm"
            style={{ background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)" }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
