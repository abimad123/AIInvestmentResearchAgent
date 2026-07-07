"use client";

import React, { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AgentTrail, AgentStep } from "@/components/AgentTrail";
import { VerdictCard } from "@/components/VerdictCard";
import { ResultSections } from "@/components/ResultSections";
import { Cpu, ShieldAlert, CheckCircle2, FileText, BarChart3, HelpCircle, X, ArrowRight, Terminal, ExternalLink } from "lucide-react";

const INITIAL_STEPS: AgentStep[] = [
  { id: "resolveCompany", label: "Resolving Company Identity", status: "idle" },
  { id: "gatherNews", label: "Gathering News Articles", status: "idle" },
  { id: "gatherFinancials", label: "Gathering Financial Statements", status: "idle" },
  { id: "analyzeMarket", label: "Analyzing Market Position", status: "idle" },
  { id: "assessRisk", label: "Assessing Financial & Strategic Risks", status: "idle" },
  { id: "synthesizeDecision", label: "Synthesizing Investment Verdict", status: "idle" },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isApiOpen, setIsApiOpen] = useState(false);

  // Final outputs
  const [resolvedCompany, setResolvedCompany] = useState<{
    resolvedName: string;
    isPublic: boolean;
    ticker?: string;
  } | null>(null);
  
  const [verdictData, setVerdictData] = useState<{
    verdict: "INVEST" | "PASS" | "WATCH";
    confidence: "high" | "medium" | "low";
    reasons: string[];
  } | null>(null);

  const [financials, setFinancials] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [sourcesUsed, setSourcesUsed] = useState<string[]>([]);

  const resetState = () => {
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: "idle", details: undefined })));
    setError(null);
    setResolvedCompany(null);
    setVerdictData(null);
    setFinancials("");
    setNews([]);
    setMarketAnalysis(null);
    setRiskAssessment(null);
    setSourcesUsed([]);
  };

  const handleSearch = async (companyName: string) => {
    setIsLoading(true);
    resetState();

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize agent: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error("No readable stream in response");
      }

      let buffer = "";
      
      // Keep track of the active step ID
      let currentActiveId = "resolveCompany";

      // Helper to update a specific step
      const updateStepStatus = (id: string, status: AgentStep["status"], details?: string) => {
        setSteps((prev) =>
          prev.map((step) => {
            if (step.id === id) {
              return { ...step, status, details: details || step.details };
            }
            // Auto-complete previous steps when a new one starts
            const stepOrder = ["resolveCompany", "gatherNews", "gatherFinancials", "analyzeMarket", "assessRisk", "synthesizeDecision"];
            const currentIdx = stepOrder.indexOf(id);
            const thisIdx = stepOrder.indexOf(step.id);
            if (thisIdx < currentIdx && step.status !== "completed") {
              return { ...step, status: "completed" };
            }
            return step;
          })
        );
      };

      // Set the first step to running
      updateStepStatus("resolveCompany", "running");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.replace("event: ", "").trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            try {
              const data = JSON.parse(dataStr);
              
              if (currentEvent === "error") {
                setError(data.error);
                updateStepStatus(currentActiveId, "error", data.error);
                setIsLoading(false);
                return;
              }

              // Process each node event
              switch (currentEvent) {
                case "resolveCompany":
                  setResolvedCompany(data);
                  updateStepStatus(
                    "resolveCompany",
                    "completed",
                    `Resolved to: ${data.resolvedName}${data.ticker ? ` (${data.ticker})` : ""}`
                  );
                  currentActiveId = "gatherNews";
                  updateStepStatus("gatherNews", "running");
                  break;

                case "gatherNews":
                  setNews(data.news || []);
                  updateStepStatus(
                    "gatherNews",
                    "completed",
                    `Gathered ${data.news?.length || 0} news items`
                  );
                  currentActiveId = "gatherFinancials";
                  updateStepStatus("gatherFinancials", "running");
                  break;

                case "gatherFinancials":
                  setFinancials(data.financials || "");
                  updateStepStatus(
                    "gatherFinancials",
                    "completed",
                    data.financials ? "Financial overview fetched" : "No financials available"
                  );
                  currentActiveId = "analyzeMarket";
                  updateStepStatus("analyzeMarket", "running");
                  break;

                case "analyzeMarket":
                  setMarketAnalysis(data.marketAnalysis);
                  updateStepStatus(
                    "analyzeMarket",
                    "completed",
                    "SWOT & Market analysis generated"
                  );
                  currentActiveId = "assessRisk";
                  updateStepStatus("assessRisk", "running");
                  break;

                case "assessRisk":
                  setRiskAssessment(data.riskAssessment);
                  updateStepStatus(
                    "assessRisk",
                    "completed",
                    `Loaded ${data.riskAssessment?.risks?.length || 0} pre-computed key risks`
                  );
                  currentActiveId = "synthesizeDecision";
                  updateStepStatus("synthesizeDecision", "running");
                  break;

                case "synthesizeDecision":
                  const decision = data.finalDecision;
                  if (decision) {
                    setVerdictData({
                      verdict: decision.verdict,
                      confidence: decision.confidenceScore,
                      reasons: decision.reasons.map((r: any) => r.text),
                    });
                    setSourcesUsed(decision.sourcesUsed || []);
                    updateStepStatus(
                      "synthesizeDecision",
                      "completed",
                      `Verdict: ${decision.verdict} (${decision.confidenceScore} confidence)`
                    );
                  }
                  break;
              }
            } catch (err) {
              console.error("Error parsing event data:", err);
            }
          }
        }
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error("Execution error:", err);
      setError(err.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/30 pb-20 font-sans relative overflow-x-hidden">
      {/* Decorative subtle top gradient blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/30 via-transparent to-transparent -z-10 pointer-events-none blur-3xl" />

      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200/50 transition-all">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-md shadow-indigo-100 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-zinc-950 tracking-tight flex items-center gap-0.5">
                  <span className="text-indigo-600 font-black">FinSight</span>
                  <span>AI</span>
                </h1>
                <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-100/50 uppercase tracking-wide">
                  Research Agent
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-semibold tracking-wide uppercase">Autonomous investment engine</p>
            </div>
          </div>

          {/* Navigation links & action button */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={resetState} className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors">Platform</button>
              <button onClick={() => setIsDocsOpen(true)} className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors">Documentation</button>
              <button onClick={() => setIsApiOpen(true)} className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors">API Pricing</button>
            </nav>
            <div className="h-4 w-[1px] bg-zinc-200 hidden md:block" />
            <button 
              onClick={() => setIsApiOpen(true)}
              className="h-9 px-4 rounded-xl bg-white hover:bg-zinc-55 hover:border-zinc-300 text-zinc-900 border border-zinc-200/80 font-bold text-xs transition-all shadow-sm hover:shadow active:scale-95"
            >
              Connect API
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 pt-16">
        {/* Search section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-zinc-950 tracking-tight mb-3 sm:text-5xl leading-none">
            Evaluate Any Company Instantly
          </h2>
          <p className="text-base text-zinc-500 font-normal max-w-xl mx-auto leading-relaxed tracking-wide">
            Input a name. Our multi-step LangGraph agent will research news, fundamentals, analyze markets, and synthesize a clear verdict.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {/* Error notification */}
        {error && (
          <div className="w-full max-w-2xl mx-auto mb-8 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-5 flex items-start gap-3 shadow-sm animate-fadeIn">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Research Run Failed</h4>
              <p className="text-xs text-rose-600/90 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Dashboard Area */}
        {!isLoading && !verdictData && !error && (
          <>
            /* Blank state cards */
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-fadeIn">
              <div className="bg-white border border-zinc-200/60 rounded-3xl p-7 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-zinc-300/80 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mb-2">Company Verification</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                  Resolves brand names to official registered entities, verify public vs private structures, and locate stock tickers automatically.
                </p>
              </div>

              <div className="bg-white border border-zinc-200/60 rounded-3xl p-7 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-zinc-300/80 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mb-2">Financials & Market SWOT</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                  Pulls full financial statements, aggregates recent web news, and builds a comprehensive SWOT grid mapping market positioning.
                </p>
              </div>

              <div className="bg-white border border-zinc-200/60 rounded-3xl p-7 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-zinc-300/80 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mb-2">Risk & Decision Synthesis</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                  Identifies strategic, operational and liquidity risks, weighs arguments, and computes a confidence-graded Invest/Pass/Watch verdict.
                </p>
              </div>
            </div>

            {/* How it Works Section */}
            <div className="mt-28 border-t border-zinc-200/50 pt-20 pb-10 max-w-[1400px] mx-auto animate-fadeIn">
              <div className="text-center mb-16">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50/80 px-3.5 py-1.5 rounded-full border border-indigo-100/30 uppercase tracking-widest">
                  Execution Pipeline
                </span>
                <h3 className="text-3xl font-extrabold text-zinc-950 mt-4 tracking-tight">
                  Autonomous Research Pipeline
                </h3>
                <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto font-semibold">
                  Six coordinated stages execute sequentially within LangGraph to verify details and analyze data.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="bg-white border border-zinc-200/50 p-6 rounded-2xl flex gap-4 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
                  <div className="text-2xl font-black text-indigo-100 flex-shrink-0 select-none">01</div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 mb-1">Company Resolution</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">Standardizes the query, identifies the formal corporate name, and maps stock tickers.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white border border-zinc-200/50 p-6 rounded-2xl flex gap-4 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
                  <div className="text-2xl font-black text-indigo-100 flex-shrink-0 select-none">02</div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 mb-1">News Aggregation</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">Gathers recent news, press releases, and articles using weighted web search engines.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white border border-zinc-200/50 p-6 rounded-2xl flex gap-4 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
                  <div className="text-2xl font-black text-indigo-100 flex-shrink-0 select-none">03</div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 mb-1">Financial Audit</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">Extracts earnings growth, profit margins, balance sheets, and key valuation metrics.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-white border border-zinc-200/50 p-6 rounded-2xl flex gap-4 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
                  <div className="text-2xl font-black text-indigo-100 flex-shrink-0 select-none">04</div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 mb-1">SWOT Analysis</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">Generates a detailed SWOT report assessing market positioning and opportunities.</p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="bg-white border border-zinc-200/50 p-6 rounded-2xl flex gap-4 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
                  <div className="text-2xl font-black text-indigo-100 flex-shrink-0 select-none">05</div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 mb-1">Risk Assessment</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">Audits operational, leadership, concentration, and regulatory risk categories.</p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="bg-white border border-zinc-200/50 p-6 rounded-2xl flex gap-4 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
                  <div className="text-2xl font-black text-indigo-100 flex-shrink-0 select-none">06</div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 mb-1">Decision Synthesis</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">Weighs evidence to produce a confidence-graded Invest/Pass/Watch verdict.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {(isLoading || verdictData) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
            {/* Left sidebar: Trail timeline */}
            <div className="lg:col-span-1">
              <AgentTrail steps={steps} />
            </div>

            {/* Right content: Results & verdict */}
            <div className="lg:col-span-2 space-y-8">
              {verdictData && resolvedCompany && (
                <div className="animate-fadeIn">
                  <VerdictCard
                    companyName={resolvedCompany.resolvedName}
                    ticker={resolvedCompany.ticker}
                    verdict={verdictData.verdict}
                    confidence={verdictData.confidence}
                    reasons={verdictData.reasons}
                  />
                </div>
              )}

              {verdictData && (
                <div className="animate-fadeIn">
                  <ResultSections
                    financials={financials}
                    news={news}
                    marketAnalysis={marketAnalysis}
                    riskAssessment={riskAssessment}
                    sourcesUsed={sourcesUsed}
                  />
                </div>
              )}

              {isLoading && !verdictData && (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-zinc-100 rounded-3xl shadow-sm text-center">
                  <div className="w-12 h-12 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin mb-4" />
                  <h4 className="text-sm font-semibold text-zinc-800">Agent Researching...</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed font-medium">
                    Please stand by as the agent performs searches, parses financial models, and completes the risk audit.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Documentation Modal */}
      {isDocsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-zinc-200/80 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-8 relative">
            <button 
              onClick={() => setIsDocsOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-2xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900">Agent Documentation</h3>
                <p className="text-xs text-zinc-400 font-semibold tracking-wide uppercase mt-0.5">Under the hood of FinSight AI</p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-zinc-600 leading-relaxed font-semibold">
              <section>
                <h4 className="font-bold text-zinc-900 mb-2">Workflow Graph Architecture</h4>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  The agent runs a stateful LangGraph workflow containing parallel branches. News aggregation and financials audit execute in parallel (fan-out) to optimize latency, then compile into a combined market SWOT and risk assessment module (fan-in) before generating the final synthesized investment verdict.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-zinc-900 mb-2">Model Configuration & Quotas</h4>
                <ul className="list-disc pl-5 text-xs text-zinc-500 space-y-1.5 font-medium leading-relaxed">
                  <li><strong>LLM Provider:</strong> Google Gemini API (gemini-2.5-flash)</li>
                  <li><strong>Rate limits:</strong> 15 requests per minute (RPM)</li>
                  <li><strong>Daily allowance:</strong> 1,500 requests per day (RPD)</li>
                </ul>
              </section>

              <section>
                <h4 className="font-bold text-zinc-900 mb-2">TLS Interception Troubleshooting</h4>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  When deployed behind decrypting enterprise or campus firewalls, set the <code>NODE_EXTRA_CA_CERTS</code> env variable pointing to your network's root CA certificate (PEM format) to validate secure handshakes.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-end">
              <button 
                onClick={() => setIsDocsOpen(false)}
                className="h-10 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
              >
                Close Documentation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Pricing / Connection Modal */}
      {isApiOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-zinc-200/80 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-8 relative">
            <button 
              onClick={() => setIsApiOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-2xl">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900">API Connection & Pricing</h3>
                <p className="text-xs text-zinc-400 font-semibold tracking-wide uppercase mt-0.5">Integrate research into your workflow</p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-zinc-600 leading-relaxed font-semibold">
              <section>
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-3 text-indigo-900">
                  <Cpu className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold">Free Integration Tier</h5>
                    <p className="text-[11px] text-indigo-700/90 mt-0.5 font-medium leading-relaxed">
                      FinSight AI is built open-source. Using the integration endpoint is free under local network deployments.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="font-bold text-zinc-900 mb-2">1. cURL Example</h4>
                <pre className="bg-zinc-950 text-zinc-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-zinc-800">
{`curl -X POST http://localhost:3000/api/research \\
  -H "Content-Type: application/json" \\
  -d '{"companyName": "Apple"}'`}
                </pre>
              </section>

              <section>
                <h4 className="font-bold text-zinc-900 mb-2">2. JavaScript Example</h4>
                <pre className="bg-zinc-950 text-zinc-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-zinc-800">
{`const response = await fetch('/api/research', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ companyName: 'NVIDIA' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value)); // SSE chunks
}`}
                </pre>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-end">
              <button 
                onClick={() => setIsApiOpen(false)}
                className="h-10 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
