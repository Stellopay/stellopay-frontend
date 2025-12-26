"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Image from "next/image";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  details: string;
}

interface ToastContextValue {
  showToast: (message: string, details: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, details: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type, details }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getIconSrc = (type: ToastType) => {
    switch (type) {
      case "success":
        return "/toast-assets/check-circle.svg";
      case "error":
        return "/toast-assets/cancel.svg";
      case "info":
        return "/toast-assets/info.svg";
      default:
        return "/toast-assets/check-circle.svg";
    }
  };

  const getGradientSrc = (type: ToastType) => {
    switch (type) {
      case "success":
        return "/toast-assets/gradient-success.png";
      case "error":
        return "/toast-assets/gradient-error.png";
      case "info":
        return "/toast-assets/gradient-info.png";
      default:
        return "/toast-assets/gradient-success.png";
    }
  };

  const getGradientPosition = (type: ToastType) => {
    switch (type) {
      case "success":
        return { left: "-74px", top: "-65px", width: "212px", height: "212px" };
      case "error":
        return { left: "-88px", top: "-88px", width: "240px", height: "240px" };
      case "info":
        return { left: "-74px", top: "-65px", width: "212px", height: "212px" };
      default:
        return { left: "-74px", top: "-65px", width: "212px", height: "212px" };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-[#242c32] flex items-center gap-4 px-4 py-3 rounded-[8px] shadow-[0px_16px_24px_0px_rgba(0,0,0,0.14),0px_6px_30px_0px_rgba(0,0,0,0.12),0px_8px_10px_0px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-5 overflow-clip relative"
          >
            {/* Gradient image overlay - matching Figma design */}
            <div
              className="absolute pointer-events-none"
              style={getGradientPosition(toast.type)}
            >
              <Image
                src={getGradientSrc(toast.type)}
                alt=""
                width={toast.type === "error" ? 240 : 212}
                height={toast.type === "error" ? 240 : 212}
                className="block max-w-none"
              />
            </div>
            {/* Icon container */}
            <div className="bg-[#303746] flex items-start p-1 rounded-[43px] shrink-0 relative z-10">
              <div className="relative shrink-0 w-6 h-6">
                <Image
                  src={getIconSrc(toast.type)}
                  alt=""
                  width={24}
                  height={24}
                  className="block max-w-none w-full h-full"
                />
              </div>
            </div>
            {/* Text block */}
            <div className="flex flex-1 flex-col items-start min-w-0 relative z-10 leading-[0]">
              <div className="flex flex-col font-semibold justify-center relative shrink-0 text-[17px] text-white tracking-[-0.408px] w-full">
                <p className="leading-[22px] whitespace-pre-wrap">{toast.message}</p>
              </div>
              <div className="flex flex-col font-normal justify-center relative shrink-0 text-[#c8c5c5] text-[13px] tracking-[-0.078px] w-full">
                <p className="leading-[18px] whitespace-pre-wrap">{toast.details}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}



