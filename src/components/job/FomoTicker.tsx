"use client";

import { useEffect, useState } from "react";
import { Flame, Eye, Zap } from "lucide-react";

const messages = [
  { icon: Zap, text: (n: number) => `${n} jobs posted in the last 24 hours` },
  { icon: Eye, text: (n: number) => `${n} candidates browsing jobs right now` },
  { icon: Flame, text: (n: number) => `${n} applications submitted in the last hour` },
];

export default function FomoTicker() {
  const [idx, setIdx] = useState(0);
  const [seed] = useState(() => 120 + Math.floor(Math.random() * 80));

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 3500);
    return () => clearInterval(t);
  }, []);

  const Item = messages[idx];
  const Icon = Item.icon;
  const n = seed + idx * 37;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
      </span>
      <Icon size={15} />
      <span>{Item.text(n)}</span>
    </div>
  );
}
