import { getLLM } from "./llm";
import { ResolveCompanySchema, RiskAssessmentSchema, FinalDecisionSchema, MarketAndRiskAnalysisSchema } from "./schema";
import { searchNews } from "./tools/tavily";
import { getCompanyOverview } from "./tools/financials";

export async function resolveCompany(state: any) {
  const startTime = Date.now();
  console.log(`Running resolveCompany node for: ${state.companyName}...`);
  const llm = getLLM(0);
  
  // Search Tavily to get basic info about the company name
  const searchResults = await searchNews(`${state.companyName} company profile wiki public or private`);
  const searchContext = searchResults.map((r: any) => r.content).join("\n\n");
  
  const structuredLlm = llm.withStructuredOutput(ResolveCompanySchema);
  
  const prompt = `You are an investment research assistant. Your task is to resolve the company input into its official company name and determine if it is a public company or a private company. If it is public, provide its ticker symbol (e.g. TSLA, MSFT).
  
Input: ${state.companyName}

Search Results about the company:
${searchContext}

Determine:
1. Official resolved company name.
2. Is it public or private?
3. What is the stock ticker (if public)?`;

  const result = await structuredLlm.invoke(prompt);
  
  const latency = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Resolved company to: ${result.resolvedName} (Public: ${result.isPublic}, Ticker: ${result.ticker || "N/A"})`);
  console.log(`[BENCHMARK] Node resolveCompany took ${latency}s`);
  
  return {
    resolvedName: result.resolvedName,
    isPublic: result.isPublic,
    ticker: result.ticker || undefined,
  };
}

export async function gatherNews(state: any) {
  const startTime = Date.now();
  console.log(`Running gatherNews node for: ${state.resolvedName || state.companyName}...`);
  const companyName = state.resolvedName || state.companyName;
  const query = `${companyName} recent news controversies funding rounds leadership changes 2025 2026`;
  
  const results = await searchNews(query);
  const news = results.map((r: any) => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }));
  
  const latency = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Gathered ${news.length} news items.`);
  console.log(`[BENCHMARK] Node gatherNews took ${latency}s`);
  return { news };
}

export async function gatherFinancials(state: any) {
  const startTime = Date.now();
  console.log(`Running gatherFinancials node for: ${state.resolvedName}...`);
  const companyName = state.resolvedName;
  
  let financialsResult: any;
  if (state.isPublic && state.ticker) {
    const financials = await getCompanyOverview(state.ticker, companyName);
    financialsResult = { financials };
  } else {
    // Private company financials
    console.log(`Company ${companyName} is private. Searching for private financial estimates/funding...`);
    try {
      const results = await searchNews(`${companyName} revenue funding valuation financial estimates private company`);
      financialsResult = {
        financials: {
          source: "Tavily Search (Private)",
          searchData: results.map((r: any) => ({
            title: r.title,
            content: r.content,
            url: r.url
          }))
        }
      };
    } catch (e: any) {
      financialsResult = {
        financials: {
          source: "None",
          error: `Failed to search private financials: ${e.message}`
        }
      };
    }
  }

  const latency = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[BENCHMARK] Node gatherFinancials took ${latency}s`);
  return financialsResult;
}

export async function analyzeMarket(state: any) {
  const startTime = Date.now();
  console.log(`Running analyzeMarket node for: ${state.resolvedName}...`);
  const llm = getLLM(0);
  
  const newsContext = state.news ? state.news.map((n: any) => `- ${n.title} (Source: ${n.url}): ${n.content}`).join("\n") : "No news gathered.";
  const finContext = JSON.stringify(state.financials, null, 2);
  
  const structuredLlm = llm.withStructuredOutput(MarketAndRiskAnalysisSchema);

  const prompt = `You are a combined market analyst and risk management officer. Your task is to perform both a market analysis and a structured risk assessment for ${state.resolvedName}.

GATHERED CONTEXT:
---
News:
${newsContext}

Financials:
${finContext}
---

Your response MUST fulfill both of the following:
1. marketAnalysis: Fulfill this text covering competitive landscape, industry tailwinds and headwinds, and Total Addressable Market (TAM) commentary.
2. riskAssessment: Fulfill this list of risks evaluating Regulatory risks, Key-person risks, Balance sheet / financial risks, and Concentration risks. Ground every risk in a specific fact from the context, and cite the source (URL or 'gatherFinancials').

Provide the output strictly matching the structured schema.`;

  const result = await structuredLlm.invoke(prompt);
  
  const latency = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[BENCHMARK] Node analyzeMarket took ${latency}s`);
  return { 
    marketAnalysis: result.marketAnalysis,
    riskAssessment: result.riskAssessment
  };
}

export async function assessRisk(state: any) {
  const startTime = Date.now();
  console.log(`Running assessRisk node for: ${state.resolvedName}...`);
  
  // Pass-through the pre-calculated riskAssessment
  const result = state.riskAssessment || { risks: [] };
  
  const latency = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[BENCHMARK] Node assessRisk took ${latency}s (Pass-through)`);
  return { riskAssessment: result };
}

export async function synthesizeDecision(state: any) {
  const startTime = Date.now();
  console.log(`Running synthesizeDecision node for: ${state.resolvedName}...`);
  const llm = getLLM(0);

  const newsContext = state.news ? state.news.map((n: any) => `- ${n.title} (${n.url})`).join("\n") : "";
  const finContext = JSON.stringify(state.financials, null, 2);
  const marketContext = state.marketAnalysis || "";
  const riskContext = JSON.stringify(state.riskAssessment, null, 2);

  const structuredLlm = llm.withStructuredOutput(FinalDecisionSchema);

  const prompt = `You are the Investment Committee Chair. Review all the gathered intelligence for ${state.resolvedName} and make a final investment decision.
  
GATHERED INTELLIGENCE:
---
Company Name: ${state.resolvedName} (Ticker: ${state.ticker || "N/A"}, Public: ${state.isPublic})

News Sources:
${newsContext}

Financial Snapshot:
${finContext}

Market Analysis:
${marketContext}

Risk Assessment:
${riskContext}
---

Produce the final investment recommendation:
1. Verdict: Must be one of INVEST, PASS, WATCH.
2. Confidence Score: low, medium, or high.
3. Why Reasons: 3-5 bullet points explaining the decision, each tagged with which upstream node/source it came from (e.g., "gatherFinancials", "assessRisk", "analyzeMarket").
4. Key Risks: 1-2 bullet points of risks to watch.
5. Sources Used: A list of unique URLs actually cited/used in the research. Make sure they are extracted from the News or Financials contexts above. Do not include placeholder URLs.`;

  const result = await structuredLlm.invoke(prompt);
  
  const latency = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[BENCHMARK] Node synthesizeDecision took ${latency}s`);
  return { finalDecision: result };
}
