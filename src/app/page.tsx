"use client";

import React, { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AgentTrail, AgentStep } from "@/components/AgentTrail";
import { VerdictCard } from "@/components/VerdictCard";
import { ResultSections } from "@/components/ResultSections";
import { Cpu, ShieldAlert, CheckCircle2, FileText, BarChart3, HelpCircle, X, Menu, ArrowRight, Terminal, ExternalLink } from "lucide-react";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stepElapsedSeconds, setStepElapsedSeconds] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    setElapsedSeconds(0);
    setStepElapsedSeconds(0);

    const abortController = new AbortController();
    let timerInterval: NodeJS.Timeout | undefined;

    try {
      let stepStartTime = Date.now();
      let currentStepId = "resolveCompany";

      timerInterval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        
        const stepElapsedMs = Date.now() - stepStartTime;
        const stepSec = Math.floor(stepElapsedMs / 1000);
        setStepElapsedSeconds(stepSec);

        // Watchdog timeout limit: 60 seconds (60000ms)
        const watchdogLimitMs = 60000;

        if (stepElapsedMs > watchdogLimitMs) {
          if (timerInterval) clearInterval(timerInterval);
          abortController.abort();
          
          const timeoutMsg = `The research step "${currentStepId}" timed out after 60 seconds.`;
          setError(timeoutMsg);
          
          // Helper to set error on current step
          setSteps((prev) =>
            prev.map((step) => {
              if (step.id === currentStepId) {
                return { ...step, status: "error", details: "Timed out after 60s" };
              }
              return step;
            })
          );
          
          setIsLoading(false);
        }
      }, 1000);

      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
        signal: abortController.signal,
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
                const rawError = data.error || "";
                const isRateLimit = /429|quota|exhausted|limit|rate limit/i.test(rawError);
                const userFriendlyError = isRateLimit
                  ? "Daily research quota reached — please try again tomorrow, or the demo will use a backup provider."
                  : rawError;

                setError(userFriendlyError);
                updateStepStatus(currentStepId, "error", userFriendlyError);
                if (timerInterval) clearInterval(timerInterval);
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
                  currentStepId = "gatherNews";
                  stepStartTime = Date.now();
                  setStepElapsedSeconds(0);
                  updateStepStatus("gatherNews", "running");
                  break;

                case "gatherNews":
                  setNews(data.news || []);
                  updateStepStatus(
                    "gatherNews",
                    "completed",
                    `Gathered ${data.news?.length || 0} news items`
                  );
                  currentStepId = "gatherFinancials";
                  stepStartTime = Date.now();
                  setStepElapsedSeconds(0);
                  updateStepStatus("gatherFinancials", "running");
                  break;

                case "gatherFinancials":
                  setFinancials(data.financials || "");
                  updateStepStatus(
                    "gatherFinancials",
                    "completed",
                    data.financials ? "Financial overview fetched" : "No financials available"
                  );
                  currentStepId = "analyzeMarket";
                  stepStartTime = Date.now();
                  setStepElapsedSeconds(0);
                  updateStepStatus("analyzeMarket", "running");
                  break;

                case "analyzeMarket":
                  setMarketAnalysis(data.marketAnalysis);
                  updateStepStatus(
                    "analyzeMarket",
                    "completed",
                    "SWOT & Market analysis generated"
                  );
                  currentStepId = "assessRisk";
                  stepStartTime = Date.now();
                  setStepElapsedSeconds(0);
                  updateStepStatus("assessRisk", "running");
                  break;

                case "assessRisk":
                  setRiskAssessment(data.riskAssessment);
                  updateStepStatus(
                    "assessRisk",
                    "completed",
                    `Loaded ${data.riskAssessment?.risks?.length || 0} pre-computed key risks`
                  );
                  currentStepId = "synthesizeDecision";
                  stepStartTime = Date.now();
                  setStepElapsedSeconds(0);
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

    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Fetch request aborted due to step timeout.");
      } else {
        console.error("Execution error:", err);
        const rawError = err.message || "";
        const isRateLimit = /429|quota|exhausted|limit|rate limit/i.test(rawError);
        const userFriendlyError = isRateLimit
          ? "Daily research quota reached — please try again tomorrow, or the demo will use a backup provider."
          : (rawError || "An unexpected error occurred");
        setError(userFriendlyError);
      }
    } finally {
      if (timerInterval) clearInterval(timerInterval);
      setIsLoading(false);
    }
  };


  const handleFeaturesClick = () => {
    resetState();
    setTimeout(() => {
      const element = document.getElementById("features");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  const handleHowItWorksClick = () => {
    resetState();
    setTimeout(() => {
      const element = document.getElementById("how-it-works");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  const handleTryItFreeClick = () => {
    resetState();
    setTimeout(() => {
      const element = document.getElementById("search-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        const input = document.querySelector("input[type='text']") as HTMLInputElement;
        if (input) input.focus();
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-zinc-50/30 pb-20 font-sans relative overflow-x-clip">
      {/* Decorative subtle top gradient blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-soft/80 via-transparent to-transparent -z-10 pointer-events-none blur-3xl" />

      {/* Premium Glassmorphic Header */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? "bg-zinc-50/95 border-b border-zinc-200/90 shadow-md backdrop-blur-md" 
          : "bg-zinc-50/90 border-b border-zinc-200/50 shadow-sm backdrop-blur-sm"
      }`}>
        <div className={`max-w-[1400px] mx-auto px-6 flex items-center justify-between transition-all duration-300 ${
          scrolled ? "h-16" : "h-20"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`bg-brand text-white rounded-2xl shadow-md shadow-brand-soft flex items-center justify-center transition-all duration-300 ${
              scrolled ? "p-2.5" : "p-3"
            }`}>
              <Cpu className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg md:text-xl font-black text-zinc-950 tracking-tight leading-none flex items-center gap-0.5">
                  <span className="text-brand">FinSight</span>
                  <span>AI</span>
                </h1>
                <span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase hidden lg:inline-block border-l border-zinc-200 pl-2">
                  Autonomous Engine
                </span>
              </div>
            </div>
          </div>

          {/* Navigation links & action CTA */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-2">
              <button 
                onClick={handleFeaturesClick} 
                className="text-xs font-bold text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
              >
                Features
              </button>
              <button 
                onClick={handleHowItWorksClick} 
                className="text-xs font-bold text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
              >
                How it works
              </button>
            </nav>

            <div className="hidden md:block h-5 w-[1px] bg-zinc-200" />

            <button 
              onClick={handleTryItFreeClick}
              className="hidden md:flex h-9 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs items-center justify-center transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
            >
              Try it free
            </button>

            {/* Hamburger menu button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -mr-2 text-zinc-500 hover:text-zinc-950 transition-colors md:hidden cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 animate-spin-once" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Slide-down mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-zinc-50/95 backdrop-blur-md border-t border-zinc-200/80 px-6 py-6 space-y-4 shadow-inner animate-fadeIn">
            <nav className="flex flex-col gap-4">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleFeaturesClick();
                }}
                className="text-left text-sm font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
              >
                Features
              </button>
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleHowItWorksClick();
                }}
                className="text-left text-sm font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
              >
                How it works
              </button>
              <div className="h-[1px] bg-zinc-200 my-2" />
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleTryItFreeClick();
                }}
                className="w-full h-10 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Try it free
              </button>
            </nav>
          </div>
        )}
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
            <div id="features" className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-fadeIn">
              <div className="bg-white border border-zinc-200/60 rounded-3xl p-7 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-zinc-300/80 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-brand-soft/80 transition-all duration-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mb-2">Company Verification</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                  Resolves brand names to official registered entities, verify public vs private structures, and locate stock tickers automatically.
                </p>
              </div>

              <div className="bg-white border border-zinc-200/60 rounded-3xl p-7 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-zinc-300/80 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-brand-soft/80 transition-all duration-300">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mb-2">Financials & Market SWOT</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                  Pulls full financial statements, aggregates recent web news, and builds a comprehensive SWOT grid mapping market positioning.
                </p>
              </div>

              <div className="bg-white border border-zinc-200/60 rounded-3xl p-7 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-zinc-300/80 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-brand-soft/80 transition-all duration-300">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mb-2">Risk & Decision Synthesis</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                  Identifies strategic, operational and liquidity risks, weighs arguments, and computes a confidence-graded Invest/Pass/Watch verdict.
                </p>
              </div>
            </div>

            {/* How it Works Section */}
            <div id="how-it-works" className="mt-28 border-t border-zinc-200/50 pt-20 pb-10 max-w-[1400px] mx-auto animate-fadeIn">
              <div className="text-center mb-16">
                <span className="text-xs font-bold text-brand bg-brand-soft/80 px-3.5 py-1.5 rounded-full border border-brand-soft uppercase tracking-widest">
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
                  <div className="text-2xl font-black text-brand-soft flex-shrink-0 select-none">01</div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 mb-1">Company Resolution</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">Standardizes the query, identifies the formal corporate name, and maps stock tickers.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white border border-zinc-200/50 p-6 rounded-2xl flex gap-4 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
                  <div className="text-2xl font-black text-brand-soft flex-shrink-0 select-none">02</div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 mb-1">News Aggregation</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">Gathers recent news, press releases, and articles using weighted web search engines.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white border border-zinc-200/50 p-6 rounded-2xl flex gap-4 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
                  <div className="text-2xl font-black text-brand-soft flex-shrink-0 select-none">03</div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 mb-1">Financial Audit</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">Extracts earnings growth, profit margins, balance sheets, and key valuation metrics.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-white border border-zinc-200/50 p-6 rounded-2xl flex gap-4 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
                  <div className="text-2xl font-black text-brand-soft flex-shrink-0 select-none">04</div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 mb-1">SWOT Analysis</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">Generates a detailed SWOT report assessing market positioning and opportunities.</p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="bg-white border border-zinc-200/50 p-6 rounded-2xl flex gap-4 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
                  <div className="text-2xl font-black text-brand-soft flex-shrink-0 select-none">05</div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 mb-1">Risk Assessment</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed font-semibold">Audits operational, leadership, concentration, and regulatory risk categories.</p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="bg-white border border-zinc-200/50 p-6 rounded-2xl flex gap-4 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
                  <div className="text-2xl font-black text-brand-soft flex-shrink-0 select-none">06</div>
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
                <div className="bg-white border border-zinc-200/60 rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[300px] animate-fadeIn">
                  {/* Status header */}
                  <div className="flex items-start justify-between border-b border-zinc-100 pb-5">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">Active Research Session</h4>
                      <p className="text-[11px] text-zinc-400 font-bold tracking-wider uppercase mt-1">Autonomous Agent Pipeline</p>
                    </div>
                    {/* Pulsing state dot */}
                    <div className="flex items-center gap-2 bg-brand-soft/60 px-3 py-1.5 rounded-full border border-brand-soft">
                      <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                      <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Running</span>
                    </div>
                  </div>

                  {/* Core Status Message & Stopwatch */}
                  <div className="py-8 flex flex-col items-center text-center">
                    {/* Large stopwatch-like timer design */}
                    <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-zinc-50 border border-zinc-200/50 mb-4 shadow-inner">
                      <span className="text-2xl font-black text-zinc-950 tabular-nums">
                        {elapsedSeconds}s
                      </span>
                    </div>
                    
                    {/* Active Step Label */}
                    <p className="text-xs font-semibold text-zinc-800 mt-2">
                      Current Stage: <span className="text-brand font-bold">
                        {steps.find(s => s.status === "running")?.label || "Processing..."}
                      </span>
                    </p>
                    
                    {/* Stage Specific Elapsed timer */}
                    <p className="text-[10px] text-zinc-400 font-semibold tracking-wide uppercase mt-1">
                      Stage Time: <span className="tabular-nums font-bold text-zinc-600">{stepElapsedSeconds}s</span> / 60s limit
                    </p>
                  </div>

                  {/* Pipeline Progress Bar */}
                  <div className="border-t border-zinc-100 pt-5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-2">
                      <span>Pipeline Progress</span>
                      <span className="text-zinc-700">
                        {Math.round(
                          (steps.filter(s => s.status === "completed").length / steps.length) * 100
                        )}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-zinc-950 rounded-full transition-all duration-500 ease-out"
                        style={{ 
                          width: `${(steps.filter(s => s.status === "completed").length / steps.length) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
