"use client";

import React, { useState } from "react";
import { DollarSign, ShieldAlert, BarChart3, Link2, Newspaper, TrendingUp, AlertTriangle } from "lucide-react";

interface ResultSectionsProps {
  financials?: string;
  news?: Array<{ title: string; url: string; description: string; time?: string; score?: number }>;
  marketAnalysis?: {
    SWOT?: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    TAM?: string;
    headwinds?: string[];
    tailwinds?: string[];
  };
  riskAssessment?: {
    risks: Array<{
      type: string;
      description: string;
      severity: "low" | "medium" | "high";
      source: string;
    }>;
  };
  sourcesUsed?: string[];
}

export function ResultSections({
  financials,
  news = [],
  marketAnalysis,
  riskAssessment,
  sourcesUsed = [],
}: ResultSectionsProps) {
  const [activeTab, setActiveTab] = useState<"financials" | "market" | "risks" | "sources">("financials");

  return (
    <div className="w-full bg-white border border-zinc-100 rounded-3xl p-6 md:p-8 shadow-sm">
      {/* Navigation tabs */}
      <div className="flex border-b border-zinc-100 pb-px mb-8 overflow-x-auto gap-4 scrollbar-none">
        <button
          onClick={() => setActiveTab("financials")}
          className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "financials"
              ? "border-zinc-900 text-zinc-950"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Financials & News
        </button>

        <button
          onClick={() => setActiveTab("market")}
          className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "market"
              ? "border-zinc-900 text-zinc-950"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Market & SWOT
        </button>

        <button
          onClick={() => setActiveTab("risks")}
          className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "risks"
              ? "border-zinc-900 text-zinc-950"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Risk Profile
        </button>

        <button
          onClick={() => setActiveTab("sources")}
          className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "sources"
              ? "border-zinc-900 text-zinc-950"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <Link2 className="w-4 h-4" />
          Sources ({sourcesUsed.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {/* FINANCIALS & NEWS */}
        {activeTab === "financials" && (
          <div className="space-y-8 animate-fadeIn">
            {financials && (
              <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-zinc-500" />
                  Financial Snapshot
                </h3>
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 text-sm text-zinc-700 leading-relaxed whitespace-pre-line font-mono overflow-x-auto">
                  {financials}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-zinc-500" />
                Recent News Highlights
              </h3>
              {news.length > 0 ? (
                <div className="space-y-4">
                  {news.map((item, idx) => (
                    <div key={idx} className="border border-zinc-100 rounded-2xl p-5 hover:border-zinc-200 transition-all bg-white">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-sm font-bold text-zinc-800 hover:text-zinc-900 transition-colors">
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            {item.title}
                          </a>
                        </h4>
                        {item.score && (
                          <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                            Relevance: {Math.round(item.score * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{item.description}</p>
                      {item.time && <span className="block text-[10px] text-zinc-400 mt-3 font-semibold">{item.time}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">No recent news available.</p>
              )}
            </div>
          </div>
        )}

        {/* MARKET ANALYSIS & SWOT */}
        {activeTab === "market" && marketAnalysis && (
          <div className="space-y-8 animate-fadeIn">
            {marketAnalysis.SWOT && (
              <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">SWOT Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {marketAnalysis.SWOT.strengths.map((s, idx) => (
                        <li key={idx} className="text-xs text-zinc-600 leading-relaxed flex gap-2">
                          <span className="text-emerald-500 font-bold">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-rose-50/20 border border-rose-100 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Weaknesses
                    </h4>
                    <ul className="space-y-2">
                      {marketAnalysis.SWOT.weaknesses.map((w, idx) => (
                        <li key={idx} className="text-xs text-zinc-600 leading-relaxed flex gap-2">
                          <span className="text-rose-500 font-bold">•</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="bg-blue-50/20 border border-blue-100 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Opportunities
                    </h4>
                    <ul className="space-y-2">
                      {marketAnalysis.SWOT.opportunities.map((o, idx) => (
                        <li key={idx} className="text-xs text-zinc-600 leading-relaxed flex gap-2">
                          <span className="text-blue-500 font-bold">•</span> {o}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Threats
                    </h4>
                    <ul className="space-y-2">
                      {marketAnalysis.SWOT.threats.map((t, idx) => (
                        <li key={idx} className="text-xs text-zinc-600 leading-relaxed flex gap-2">
                          <span className="text-amber-500 font-bold">•</span> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {marketAnalysis.TAM && (
              <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-2 uppercase tracking-wider">Total Addressable Market (TAM)</h3>
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 text-sm text-zinc-700 leading-relaxed">
                  {marketAnalysis.TAM}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {marketAnalysis.tailwinds && marketAnalysis.tailwinds.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Market Tailwinds
                  </h3>
                  <ul className="space-y-2 bg-zinc-50/50 border border-zinc-100 rounded-2xl p-5">
                    {marketAnalysis.tailwinds.map((t, idx) => (
                      <li key={idx} className="text-xs text-zinc-600 leading-relaxed flex gap-2">
                        <span className="text-emerald-500 font-bold">✓</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {marketAnalysis.headwinds && marketAnalysis.headwinds.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    Market Headwinds
                  </h3>
                  <ul className="space-y-2 bg-zinc-50/50 border border-zinc-100 rounded-2xl p-5">
                    {marketAnalysis.headwinds.map((h, idx) => (
                      <li key={idx} className="text-xs text-zinc-600 leading-relaxed flex gap-2">
                        <span className="text-rose-500 font-bold">✗</span> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RISK ASSESSMENT */}
        {activeTab === "risks" && riskAssessment && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Identified Risk Profile</h3>
            {riskAssessment.risks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {riskAssessment.risks.map((risk, idx) => {
                  const isHigh = risk.severity === "high";
                  const isMedium = risk.severity === "medium";
                  
                  const severityBadge = isHigh
                    ? "bg-red-50 text-red-700 border-red-200"
                    : isMedium
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-zinc-100 text-zinc-600 border-zinc-200";

                  return (
                    <div key={idx} className="border border-zinc-100 rounded-2xl p-5 bg-white">
                      <div className="flex items-center justify-between gap-4 mb-2.5">
                        <h4 className="text-sm font-bold text-zinc-800">{risk.type} Risk</h4>
                        <span className={`border text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${severityBadge}`}>
                          {risk.severity} Severity
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed">{risk.description}</p>
                      {risk.source && (
                        <div className="mt-3 flex items-center gap-1 text-[10px] text-zinc-400 font-medium truncate">
                          <Link2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">Source: {risk.source}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-400 italic">No risks analyzed yet.</p>
            )}
          </div>
        )}

        {/* SOURCES & CITATIONS */}
        {activeTab === "sources" && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Sources Consulted during Research</h3>
            {sourcesUsed.length > 0 ? (
              <div className="space-y-2.5">
                {sourcesUsed.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-3 border border-zinc-100 rounded-xl p-4 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                    <span className="w-6 h-6 flex items-center justify-center bg-white border border-zinc-100 rounded-lg text-xs font-bold text-zinc-500 shadow-sm">
                      {idx + 1}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-600 hover:text-zinc-900 hover:underline font-medium truncate flex-1"
                    >
                      {url}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400 italic">No sources cited.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
