import { searchNews } from "./tavily";

export async function getCompanyOverview(ticker: string, companyName: string) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.warn("ALPHA_VANTAGE_API_KEY not found. Falling back to Tavily for financials.");
    return await fallbackFinancialSearch(companyName);
  }

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Alpha Vantage HTTP error: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.Information) {
      console.warn("Alpha Vantage rate limit reached. Falling back to Tavily for financials.");
      return await fallbackFinancialSearch(companyName);
    }

    if (!data.Symbol) {
      console.warn(`No financial data found for ticker ${ticker}. Falling back to Tavily.`);
      return await fallbackFinancialSearch(companyName);
    }

    return {
      source: "Alpha Vantage",
      symbol: data.Symbol,
      name: data.Name,
      description: data.Description,
      industry: data.Industry,
      peRatio: data.PERatio,
      pegRatio: data.PEGRatio,
      dividendYield: data.DividendYield,
      eps: data.EPS,
      revenueTTM: data.RevenueTTM,
      grossProfitTTM: data.GrossProfitTTM,
      profitMargin: data.ProfitMargin,
      operatingMarginTTM: data.OperatingMarginTTM,
      quarterlyRevenueGrowthYOY: data.QuarterlyRevenueGrowthYOY,
      quarterlyEarningsGrowthYOY: data.QuarterlyEarningsGrowthYOY,
    };
  } catch (error: any) {
    console.error(`Error fetching financials from Alpha Vantage: ${error.message}. Falling back to Tavily.`);
    return await fallbackFinancialSearch(companyName);
  }
}

async function fallbackFinancialSearch(companyName: string) {
  try {
    const query = `${companyName} financial fundamentals revenue growth profit margins balance sheet`;
    const searchResults = await searchNews(query);
    
    return {
      source: "Tavily Search (Fallback)",
      searchData: searchResults.map((r: any) => ({
        title: r.title,
        content: r.content,
        url: r.url
      }))
    };
  } catch (e: any) {
    console.error("Fallback financial search failed:", e.message);
    return {
      source: "None",
      error: "Unable to retrieve financial data via API or search."
    };
  }
}
