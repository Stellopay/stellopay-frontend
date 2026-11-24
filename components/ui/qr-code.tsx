"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { cn } from "@/utils/commonUtils";

interface QrCodeProps {
  /** The content to encode in the QR code (e.g., a SEP-0007 URI). */
  value: string;
  /** Optional filename for the downloaded PNG. Defaults to "qr-code.png". */
  downloadFileName?: string;
  /** Optional CSS class name for the container. */
  className?: string;
  /** Optional size of the QR code in pixels. Defaults to 256. */
  size?: number;
}

/**
 * A client-side QR code renderer with download functionality.
 *
 * Renders QR codes using the qrcode library entirely on the client side.
 * No external QR service is used, ensuring addresses are never sent to third parties.
 * The QR code can be downloaded as a PNG image.
 *
 * @example
 * <QrCode value="web+stellar:pay?destination=GD5..." />
 */
export function QrCode({ value, downloadFileName = "qr-code.png", className, size = 256 }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;
    let isMounted = true;

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })
      .then(() => {
        if (isMounted) {
          const dataUrl = canvas.toDataURL("image/png");
          setQrDataUrl(dataUrl);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to generate QR code:", err);
          setError("Failed to generate QR code");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative bg-white p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <canvas ref={canvasRef} className="block" aria-label={`QR code for ${value}`} />
        {error && (
          <div role="alert" className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-zinc-900/90">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
      </div>

      {qrDataUrl && (
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Download QR code as PNG"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </button>
      )}
    </div>
  );
}
