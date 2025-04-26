"use client";

import { useState } from "react";

interface ToggleCardProps {
  title: string;
}

export default function ToggleCard({ title }: ToggleCardProps) {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl shadow-md bg-surface text-surface transition-all">
      <span className="text-base">{title}</span>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`w-14 h-8 flex items-center rounded-full p-1 duration-300 ease-in-out ${
          enabled ? "bg-green-500" : "bg-gray-400"
        }`}
      > 
        <div
          className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
