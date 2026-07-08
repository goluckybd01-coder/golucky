import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, QrCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AgentQRCodeProps {
  referralLink: string;
  agentCode: string;
  tierName: string;
  tierIcon: string;
}

export default function AgentQRCode({ referralLink, agentCode, tierName, tierIcon }: AgentQRCodeProps) {
  const [showModal, setShowModal] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = async () => {
    if (!qrRef.current) return;

    try {
      // Create a canvas from the QR code
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size with padding for branding
      const size = 400;
      const padding = 60;
      canvas.width = size + padding * 2;
      canvas.height = size + padding * 2 + 80;

      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw border
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 4;
      ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 20);
      ctx.stroke();

      // Draw QR code
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // White background for QR
        ctx.fillStyle = '#ffffff';
        ctx.roundRect(padding, padding, size, size, 12);
        ctx.fill();

        ctx.drawImage(img, padding, padding, size, size);
        URL.revokeObjectURL(svgUrl);

        // Draw branding text
        ctx.fillStyle = '#14b8a6';
        ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('GoLucky', canvas.width / 2, size + padding + 45);

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px system-ui';
        ctx.fillText(`Agent: ${agentCode}`, canvas.width / 2, size + padding + 75);

        ctx.fillStyle = '#888888';
        ctx.font = '14px system-ui';
        ctx.fillText('Scan to join & get bonus!', canvas.width / 2, size + padding + 100);

        // Download
        const link = document.createElement('a');
        link.download = `golucky-agent-${agentCode}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('QR code downloaded!');
      };
      img.src = svgUrl;
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast.error('Failed to download QR code');
    }
  };

  const shareQRCode = async () => {
    if (!navigator.share) {
      toast.error('Sharing not supported on this device');
      return;
    }

    try {
      await navigator.share({
        title: 'Join GoLucky',
        text: `Join GoLucky using my agent code: ${agentCode} and get extra bonus!`,
        url: referralLink,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
        className="gap-2"
      >
        <QrCode className="h-4 w-4" />
        QR Code
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Your Referral QR Code
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4">
            {/* QR Code Display */}
            <div
              ref={qrRef}
              className="bg-white p-4 rounded-xl shadow-lg"
            >
              <QRCodeSVG
                value={referralLink}
                size={200}
                level="H"
                includeMargin={false}
                fgColor="#1a1a2e"
                bgColor="#ffffff"
              />
            </div>

            {/* Agent Info */}
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{tierIcon}</span>
                <span className="font-semibold text-lg">{tierName}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Code: <span className="font-mono font-bold text-primary">{agentCode}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Scan to join & get bonus!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              <Button
                onClick={downloadQRCode}
                className="flex-1 bg-gradient-to-r from-primary to-accent"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={shareQRCode}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
