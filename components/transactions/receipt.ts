import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface ReceiptTransaction {
  id: string;
  hash: string;
  amount: string;
  counterparty: string;
  timestamp: string; // ISO date string
}

// Update this to match how you build a transaction detail URL elsewhere in the app.
function getVerificationUrl(transactionId: string) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/transactions/${transactionId}`;
}

async function loadImageAsDataUrl(path: string): Promise<string> {
  const res = await fetch(path);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateTransactionReceiptPdf(
  transaction: ReceiptTransaction,
  logoPath: string = "/logos/stellopay-logo.png"
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo
  try {
    const logoDataUrl = await loadImageAsDataUrl(logoPath);
    doc.addImage(logoDataUrl, "PNG", 40, 40, 120, 40);
  } catch {
    // If the logo can't load, fall back to text so the PDF still generates.
    doc.setFontSize(16);
    doc.text("StelloPay", 40, 60);
  }

  doc.setFontSize(18);
  doc.text("Transaction Receipt", 40, 110);

  doc.setFontSize(11);
  doc.setTextColor(90);
  const details: [string, string][] = [
    ["Transaction hash", transaction.hash],
    ["Amount", transaction.amount],
    ["Counterparty", transaction.counterparty],
    ["Date", new Date(transaction.timestamp).toLocaleString()],
  ];

  let y = 150;
  details.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 40, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 180, y);
    y += 24;
  });

  // QR code linking to the verification URL
  const verificationUrl = getVerificationUrl(transaction.id);
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 160 });
  doc.addImage(qrDataUrl, "PNG", pageWidth - 200, 150, 120, 120);

  doc.setFontSize(9);
  doc.setTextColor(130);
  doc.text("Scan to verify this transaction", pageWidth - 200, 285);

  doc.save(`receipt-${transaction.hash}.pdf`);
}