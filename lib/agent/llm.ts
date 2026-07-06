import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export function getLLM(temperature = 0): BaseChatModel {
  const provider = process.env.LLM_PROVIDER?.toLowerCase() || "openai";

  if (provider === "google") {
    return new ChatGoogleGenerativeAI({
      modelName: "gemini-1.5-flash",
      temperature,
    });
  }

  // Default to OpenAI
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature,
  });
}
