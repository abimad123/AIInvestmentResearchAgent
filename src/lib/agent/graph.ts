import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./schema";
import { 
  resolveCompany, 
  gatherNews, 
  gatherFinancials, 
  analyzeMarket, 
  assessRisk, 
  synthesizeDecision 
} from "./nodes";

const workflow = new StateGraph(AgentState)
  .addNode("resolveCompany", resolveCompany)
  .addNode("gatherNews", gatherNews)
  .addNode("gatherFinancials", gatherFinancials)
  .addNode("analyzeMarket", analyzeMarket)
  .addNode("assessRisk", assessRisk)
  .addNode("synthesizeDecision", synthesizeDecision)
  .addEdge(START, "resolveCompany")
  .addEdge("resolveCompany", "gatherNews")
  .addEdge("resolveCompany", "gatherFinancials")
  .addEdge("gatherNews", "analyzeMarket")
  .addEdge("gatherFinancials", "analyzeMarket")
  .addEdge("analyzeMarket", "assessRisk")
  .addEdge("assessRisk", "synthesizeDecision")
  .addEdge("synthesizeDecision", END);

export const app = workflow.compile();
