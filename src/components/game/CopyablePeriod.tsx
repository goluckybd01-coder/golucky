import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyablePeriodProps {
  period: string;
  className?: string;
}

export const CopyablePeriod = ({ period, className = "" }: CopyablePeriodProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(period);
      setCopied(true);
      toast.success("Period copied!", { duration: 1500 });
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer group ${className}`}
      title="Click to copy"
    >
      <span className="font-mono text-xs">{period}</span>
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </button>
  );
};
