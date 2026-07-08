import { toast } from "sonner";

export interface ReceiptData {
  order_id: string;
  amount: number;
  payment_method: string;
  txn_id?: string | null;
  agent_number?: string | null;
  status: string;
  created_at: string;
  user_label?: string;
}

const STATUS_COLOR: Record<string, string> = {
  approved: "#10b981",
  pending: "#f59e0b",
  rejected: "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  approved: "APPROVED",
  pending: "PENDING",
  rejected: "REJECTED",
};

/**
 * Generate and trigger download of a deposit receipt as a PNG image.
 * Uses pure Canvas API — no external dependencies required.
 */
export function downloadDepositReceipt(data: ReceiptData): Promise<void> {
  return new Promise((resolve, reject) => {
   try {
    const W = 720;
    const H = 980;
    const canvas = document.createElement("canvas");

    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#1e293b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Top accent
    const accent = ctx.createLinearGradient(0, 0, W, 0);
    accent.addColorStop(0, "#f59e0b");
    accent.addColorStop(1, "#ef4444");
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, 8);

    // Brand
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
    ctx.fillText("GoLucky", 48, 90);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Deposit Receipt", 48, 118);

    // Status badge
    const status = (data.status || "pending").toLowerCase();
    const badgeColor = STATUS_COLOR[status] || "#64748b";
    const badgeLabel = STATUS_LABEL[status] || status.toUpperCase();
    ctx.fillStyle = badgeColor;
    const badgeW = ctx.measureText(badgeLabel).width + 80;
    const badgeX = W - badgeW - 48;
    roundRect(ctx, badgeX, 70, badgeW, 44, 22);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(badgeLabel, badgeX + badgeW / 2, 99);
    ctx.textAlign = "left";

    // Divider
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, 160);
    ctx.lineTo(W - 48, 160);
    ctx.stroke();

    // Amount card
    ctx.fillStyle = "#0b1220";
    roundRect(ctx, 48, 190, W - 96, 150, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(251,191,36,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("AMOUNT", 72, 230);

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 64px system-ui, sans-serif";
    ctx.fillText(`৳ ${data.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 72, 305);

    // Detail rows
    const rows: Array<[string, string]> = [
      ["Order ID", data.order_id],
      ["Payment Method", data.payment_method.toUpperCase()],
      ["Transaction ID", data.txn_id || "—"],
      ["Agent Number", data.agent_number || "—"],
      ["Date", new Date(data.created_at).toLocaleString("en-GB")],
    ];
    if (data.user_label) rows.unshift(["Account", data.user_label]);

    let y = 400;
    rows.forEach(([k, v]) => {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText(k, 48, y);

      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "right";
      ctx.fillText(truncate(v, 32), W - 48, y);
      ctx.textAlign = "left";

      ctx.strokeStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(48, y + 16);
      ctx.lineTo(W - 48, y + 16);
      ctx.stroke();

      y += 56;
    });

    // Footer
    ctx.fillStyle = "#475569";
    ctx.font = "13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "This is a system-generated receipt. Keep it for your records.",
      W / 2,
      H - 90
    );
    ctx.fillText("GoLucky • Bangladesh • support@golucky", W / 2, H - 65);

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`#${data.order_id}`, W / 2, H - 35);

    // Download
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas toBlob returned null"));
        return;
      }
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `GoLucky-Receipt-${data.order_id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      } catch (err) {
        reject(err);
      }
    }, "image/png");
   } catch (e) {
    console.error("[Receipt] download error", e);
    reject(e instanceof Error ? e : new Error(String(e)));
   }
  });
}


function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(v: string, n: number) {
  if (!v) return "—";
  return v.length > n ? v.slice(0, n - 1) + "…" : v;
}

/**
 * Generate and trigger download of a deposit receipt as a PDF document.
 * Uses jsPDF — produces a vector A4 receipt suitable for printing.
 */
export async function downloadDepositReceiptPDF(data: ReceiptData) {
  try {
    // Lazy-load heavy deps (jspdf + pako + qrcode ~170 KB gzip) only on demand
    const [{ jsPDF }, { default: QRCode }] = await Promise.all([
      import("jspdf"),
      import("qrcode"),
    ]);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const margin = 48;

    // Background band
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 140, "F");
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, W, 6, "F");

    // Brand
    doc.setTextColor(251, 191, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("GoLucky", margin, 60);
    doc.setTextColor(203, 213, 225);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Deposit Receipt", margin, 80);

    // Status badge
    const status = (data.status || "pending").toLowerCase();
    const c = STATUS_COLOR[status] || "#64748b";
    const rgb = hexToRgb(c);
    const label = STATUS_LABEL[status] || status.toUpperCase();
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    const bw = doc.getTextWidth(label) + 30;
    doc.roundedRect(W - margin - bw, 44, bw, 26, 13, 13, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(label, W - margin - bw / 2, 61, { align: "center" });

    // Amount card
    doc.setDrawColor(251, 191, 36);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, 170, W - margin * 2, 90, 12, 12, "FD");
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("AMOUNT", margin + 18, 195);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text(
      `BDT ${data.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      margin + 18,
      235
    );

    // Detail rows
    const rows: Array<[string, string]> = [
      ["Order ID", data.order_id],
      ["Payment Method", data.payment_method.toUpperCase()],
      ["Transaction ID", data.txn_id || "—"],
      ["Agent Number", data.agent_number || "—"],
      ["Date", new Date(data.created_at).toLocaleString("en-GB")],
    ];
    if (data.user_label) rows.unshift(["Account", data.user_label]);

    let y = 300;
    rows.forEach(([k, v]) => {
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(k, margin, y);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(truncate(v, 48), W - margin, y, { align: "right" });
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 8, W - margin, y + 8);
      y += 32;
    });

    // Footer
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "This is a system-generated receipt. Keep it for your records.",
      W / 2,
      y + 40,
      { align: "center" }
    );
    doc.text("GoLucky • Bangladesh • support@golucky", W / 2, y + 56, { align: "center" });
    doc.setTextColor(245, 158, 11);
    doc.setFont("courier", "bold");
    doc.text(`#${data.order_id}`, W / 2, y + 76, { align: "center" });

    // QR code embeds a verification URL so the user can confirm the
    // deposit status by simply scanning and opening the page.
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://goluckybd.com";
    const verifyUrl =
      `${origin}/verify/deposit/${encodeURIComponent(data.order_id)}` +
      `?amount=${encodeURIComponent(String(data.amount))}` +
      (data.txn_id ? `&txn=${encodeURIComponent(data.txn_id)}` : "");
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 320,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    const qrSize = 110;
    const qrX = W - margin - qrSize;
    const qrY = y + 24;
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Scan to verify", qrX + qrSize / 2, qrY + qrSize + 12, { align: "center" });
    doc.setFontSize(7);
    doc.text(truncate(verifyUrl, 60), qrX + qrSize / 2, qrY + qrSize + 22, { align: "center" });

    doc.save(`GoLucky-Receipt-${data.order_id}.pdf`);
    toast.success("PDF রসিদ ডাউনলোড হয়েছে!");
  } catch (e) {
    console.error("[Receipt PDF] error", e);
    toast.error("PDF তৈরি করতে সমস্যা হয়েছে");
  }
}

function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}
