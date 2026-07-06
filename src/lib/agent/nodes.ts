import { getLLM } from "./llm";
import { ResolveCompanySchema, RiskAssessmentSchema, FinalDecisionSchema } from "./schema";
import { searchNews } from "./tools/tavily";
import { getCompanyOverview } from "./tools/financials";

export async function resolveCompany(state: any) {
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
  
  console.log(`Resolved company to: ${result.resolvedName} (Public: ${result.isPublic}, Ticker: ${result.ticker || "N/A"})`);
  
  return {
    resolvedName: result.resolvedName,
    isPublic: result.isPublic,
    ticker: result.ticker || undefined,
  };
}

export async function gatherNews(state: any) {
  console.log(`Running gatherNews node for: ${state.resolvedName || state.companyName}...`);
  const companyName = state.resolvedName || state.companyName;
  const query = `${companyName} recent news controversies funding rounds leadership changes 2025 2026`;
  
  const results = await searchNews(query);
  const news = results.map((r: any) => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }));
  
  console.log(`Gathered ${news.length} news items.`);
  return { news };
}

export async function gatherFinancials(state: any) {
  console.log(`Running gatherFinancials node for: ${state.resolvedName}...`);
  const companyName = state.resolvedName;
  
  if (state.isPublic && state.ticker) {
    const financials = await getCompanyOverview(state.ticker, companyName);
    return { financials };
  } else {
    // Private company financials
    console.log(`Company ${companyName} is private. Searching for private financial estimates/funding...`);
    try {
      const results = await searchNews(`${companyName} revenue funding valuation financial estimates private company`);
      return {
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
      return {
        financials: {
          source: "None",
          error: `Failed to search private financials: ${e.message}`
        }
      };
    }
  }
}

export async function analyzeMarket(state: any) {
  console.log(`Running analyzeMarket node for: ${state.resolvedName}...`);
  const llm = getLLM(0);
  
  const newsContext = state.news ? state.news.map((n: any) => `- ${n.title}: ${n.content}`).join("\n") : "No news gathered.";
  const finContext = JSON.stringify(state.financials, null, 2);
  
  const prompt = `You are an investment research analyst. Synthesize a market analysis for ${state.resolvedName}.
Your analysis must cover:
1. Competitive landscape.
2. Industry tailwinds and headwinds.
3. Total Addressable Market (TAM) commentary.

You MUST ground your analysis strictly in the provided search results and financials. Do not hallucinate or use external prior knowledge unless it directly relates to and supports the facts below.

News & Web Context:
${newsContext}

Financials:
${finContext}

Provide a concise, professional market analysis.`;

  const response = await llm.invoke(prompt);
  const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
  return { marketAnalysis: text };
}

export async function assessRisk(state: any) {
  console.log(`Running assessRisk node for: ${state.resolvedName}...`);
  const llm = getLLM(0);
  
  const newsContext = state.news ? state.news.map((n: any) => `- ${n.title} (Source: ${n.url}): ${n.content}`).join("\n") : "";
  const finContext = JSON.stringify(state.financials, null, 2);
  const marketContext = state.marketAnalysis || "";

  const structuredLlm = llm.withStructuredOutput(RiskAssessmentSchema);

  const prompt = `You are a risk management officer at an investment fund. Assess the risks of investing in ${state.resolvedName}.
Specifically evaluate:
1. Regulatory risks.
2. Key-person risks.
3. Balance sheet / financial risks.
4. Concentration risks.

Ground every single risk in a specific fact from the context. Cite the source (URL or node name like "gatherFinancials").

Context:
---
News:
${newsContext}

Financials:
${finContext}

Market Analysis:
${marketContext}
---

Generate a structured list of risks. For each, specify:
- type (e.g. Regulatory, Financial, Leadership, etc.)
- description (specific risk scenario)
- severity (low, medium, or high)
- source (specific URL or "gatherFinancials")`;

  const result = await structuredLlm.invoke(prompt);
  return { riskAssessment: result };
}

export async function synthesizeDecision(state: any) {
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
  return { finalDecision: result };
}
