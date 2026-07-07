import { z } from "zod";
import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  companyName: Annotation<string>,
  resolvedName: Annotation<string>,
  isPublic: Annotation<boolean>,
  ticker: Annotation<string>,
  news: Annotation<any[]>,
  financials: Annotation<any>,
  marketAnalysis: Annotation<any>,
  riskAssessment: Annotation<any>,
  finalDecision: Annotation<any>,
});

export const ResolveCompanySchema = z.object({
  resolvedName: z.string().describe("The official name of the company"),
  isPublic: z.boolean().describe("Whether the company is publicly traded"),
  ticker: z.string().optional().describe("The stock ticker if public, otherwise omit"),
});

export const RiskAssessmentSchema = z.object({
  risks: z.array(z.object({
    type: z.string(),
    description: z.string(),
    severity: z.enum(["low", "medium", "high"]),
    source: z.string()
  }))
});

export const MarketAndRiskAnalysisSchema = z.object({
  marketAnalysis: z.object({
    SWOT: z.object({
      strengths: z.array(z.string()).describe("List of internal strengths"),
      weaknesses: z.array(z.string()).describe("List of internal weaknesses"),
      opportunities: z.array(z.string()).describe("List of external opportunities"),
      threats: z.array(z.string()).describe("List of external threats"),
    }).describe("SWOT analysis components"),
    TAM: z.string().describe("TAM estimation and commentary"),
    tailwinds: z.array(z.string()).describe("Market tailwinds and drivers"),
    headwinds: z.array(z.string()).describe("Market headwinds and barriers"),
  }).describe("Structured market analysis"),
  riskAssessment: z.object({
    risks: z.array(z.object({
      type: z.string().describe("The type of risk, e.g., Regulatory, Leadership, Financial, Concentration, etc."),
      description: z.string().describe("A specific risk scenario description"),
      severity: z.enum(["low", "medium", "high"]),
      source: z.string().describe("The source citation (URL or 'gatherFinancials')")
    }))
  })
});

export const FinalDecisionSchema = z.object({
  verdict: z.enum(["INVEST", "PASS", "WATCH"]),
  confidenceScore: z.enum(["low", "medium", "high"]),
  reasons: z.array(z.object({
    text: z.string(),
    sourceNode: z.string()
  })),
  keyRisks: z.array(z.string()),
  sourcesUsed: z.array(z.string())
});
