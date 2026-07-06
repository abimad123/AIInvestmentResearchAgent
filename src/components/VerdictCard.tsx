"use client";

import React from "react";
import { TrendingUp, AlertTriangle, HelpCircle } from "lucide-react";

interface VerdictCardProps {
  companyName: string;
  ticker?: string;
  verdict: "INVEST" | "PASS" | "WATCH";
  confidence: "high" | "medium" | "low";
  reasons: string[];
}

export function VerdictCard({ companyName, ticker, verdict, confidence, reasons }: VerdictCardProps) {
  const isInvest = verdict === "INVEST";
  const isPass = verdict === "PASS";
  const isWatch = verdict === "WATCH";

  // Color mapping based on verdict
  const theme = {
    bg: isInvest ? "bg-emerald-50/50" : isPass ? "bg-rose-50/50" : "bg-amber-50/50",
    border: isInvest ? "border-emerald-200" : isPass ? "border-rose-200" : "border-amber-200",
    text: isInvest ? "text-emerald-700" : isPass ? "text-rose-700" : "text-amber-700",
    badgeBg: isInvest ? "bg-emerald-600" : isPass ? "bg-rose-600" : "bg-amber-600",
    icon: isInvest ? TrendingUp : isPass ? AlertTriangle : HelpCircle,
  };

  const IconComponent = theme.icon;

  return (
    <div className={`w-full border rounded-3xl p-6 md:p-8 ${theme.bg} ${theme.border} shadow-sm transition-all duration-300`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-2xl font-bold text-zinc-900">{companyName}</h2>
            {ticker && (
              <span className="bg-zinc-200/60 text-zinc-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                {ticker}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 font-medium">AI Research Agent Investment Recommendation</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Verdict Badge */}
          <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl ${theme.badgeBg} text-white font-bold tracking-wide shadow-sm text-lg`}>
            <IconComponent className="w-5 h-5" />
            {verdict}
          </div>

          {/* Confidence Badge */}
          <div className="bg-white/80 backdrop-blur-sm border border-zinc-200/60 px-4 py-2 rounded-2xl text-center shadow-sm">
            <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Confidence</span>
            <span className="text-sm font-bold text-zinc-800 capitalize">{confidence}</span>
          </div>
        </div>
      </div>

      <hr className="my-6 border-zinc-200/60" />

      <div>
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Key Reasons Supporting Verdict</h4>
        <ul className="space-y-3">
          {reasons.map((reason, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-zinc-700 leading-relaxed">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-white border border-zinc-200/60 text-xs font-bold text-zinc-500 shadow-sm">
                {idx + 1}
              </span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
