async function fetchWithRetry(url: string, options: RequestInit, retries = 5, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 502 || res.status === 429) {
        console.warn(`Fetch to ${url} returned status ${res.status}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5;
        continue;
      }
      return res;
    } catch (e: any) {
      console.warn(`Fetch to ${url} failed with error: ${e.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5;
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

export async function searchNews(query: string) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY not found in environment variables.");
  }

  const response = await fetchWithRetry("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      api_key: apiKey,
      max_results: 5,
      search_depth: "basic",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Tavily API request failed: ${errorData.error || response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}
