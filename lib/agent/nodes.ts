import { AgentState } from "./schema";

export async function resolveCompany(state: typeof AgentState.State) {
  console.log("Running resolveCompany node...");
  return {
    resolvedName: state.companyName + " Inc.",
    isPublic: true,
    ticker: state.companyName.substring(0, 4).toUpperCase(),
  };
}

export async function gatherNews(state: typeof AgentState.State) {
  console.log("Running gatherNews node...");
  return {
    news: [
      { title: "Great quarter for " + state.resolvedName, url: "https://example.com/news1", date: "2024-01-01" },
      { title: "New product launched", url: "https://example.com/news2", date: "2024-02-01" }
    ]
  };
}

export async function gatherFinancials(state: typeof AgentState.State) {
  console.log("Running gatherFinancials node...");
  if (state.isPublic) {
    return {
      financials: {
        revenue: "$10B",
        growth: "15% YoY",
        margins: "25%",
      }
    };
  } else {
    return { financials: { info: "Private company, no public financials available." } };
  }
}

export async function analyzeMarket(state: typeof AgentState.State) {
  console.log("Running analyzeMarket node...");
  return {
    marketAnalysis: "The company operates in a highly competitive market but has strong tailwinds."
  };
}

export async function assessRisk(state: typeof AgentState.State) {
  console.log("Running assessRisk node...");
  return {
    riskAssessment: {
      risks: [
        { type: "Regulatory", description: "Pending legislation could impact margins.", severity: "medium", source: "gatherNews" }
      ]
    }
  };
}

export async function synthesizeDecision(state: typeof AgentState.State) {
  console.log("Running synthesizeDecision node...");
  return {
    finalDecision: {
      verdict: "WATCH",
      confidenceScore: "medium",
      reasons: [
        { text: "Strong revenue growth", sourceNode: "gatherFinancials" },
        { text: "Regulatory headwinds", sourceNode: "assessRisk" }
      ],
      keyRisks: ["Regulatory changes"],
      sourcesUsed: ["https://example.com/news1", "https://example.com/news2"]
    }
  };
}
