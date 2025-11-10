import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Stock, InvestmentResult } from '../types';

/**
 * Initializes GoogleGenAI and sends a text prompt to the Gemini model.
 * @param prompt The user's query for Gemini.
 * @param model The Gemini model to use ('gemini-2.5-flash' or 'gemini-2.5-pro').
 * @returns The text response from the Gemini model.
 */
export const getGeminiResponse = async (prompt: string, model: 'gemini-2.5-flash' | 'gemini-2.5-pro' = 'gemini-2.5-flash'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 256 },
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes("Requested entity was not found.")) {
      // This usually means the API key is invalid or permissions are incorrect.
      throw new Error("API key might be invalid or unauthorized. Please check your setup.");
    }
    throw new Error("Failed to get a response from Gemini. Please try again later.");
  }
};

/**
 * Generates stock ideas based on a brief description using Gemini API.
 * @param description A brief description for stock ideas (e.g., "tech stocks", "eco-friendly companies").
 * @returns A promise that resolves to a string containing stock ideas or an error message.
 */
export const getStockIdeas = async (description: string): Promise<string> => {
  const prompt = `Generate a list of 5 fictional stock names with realistic-sounding prices (e.g., $50-$1000) and expected returns (e.g., 5-25%) based on the theme "${description}". Provide the output in a markdown list format, like:
- StockName1 (Price: $XXX, Return: Y%)
- StockName2 (Price: $XXX, Return: Y%)
...
`;
  return getGeminiResponse(prompt, 'gemini-2.5-flash');
};


/**
 * Analyzes market data for given stocks using Gemini API.
 * @param stocks An array of stock objects.
 * @returns A promise that resolves to a string containing market analysis or an error message.
 */
export const analyzeMarketData = async (stocks: Stock[]): Promise<string> => {
  if (stocks.length === 0) {
    return "Please add some stocks to analyze market data.";
  }
  const stockDetails = stocks.map(s => `${s.name} (Price: $${s.price}, Return: ${s.expectedReturn}%)`).join(', ');
  const prompt = `For educational purposes, analyze the market outlook for the following fictional stocks and provide brief insights: ${stockDetails}. Consider general market conditions and potential trends. This is a hypothetical scenario.`;
  return getGeminiResponse(prompt, 'gemini-2.5-pro'); // Use Pro for complex analysis
};

/**
 * Provides comprehensive portfolio advice based on current investments using Gemini API.
 * @param initialBudget The user's initial investment budget.
 * @param stocks An array of all available stock objects.
 * @param investmentResults An array of current investment allocations.
 * @returns A promise that resolves to a string containing portfolio advice or an error message.
 */
export const getPortfolioAdvice = async (initialBudget: number, stocks: Stock[], investmentResults: InvestmentResult[]): Promise<string> => {
  if (stocks.length === 0 || investmentResults.length === 0) {
    return "Please add stocks and calculate your investment to get portfolio advice.";
  }

  const totalInvestedAmount = investmentResults.reduce((sum, res) => sum + res.investedAmount, 0);
  const totalActualReturn = investmentResults.reduce((sum, res) => sum + res.actualReturn, 0);
  const remainingBudget = initialBudget - totalInvestedAmount;

  const prompt = `You are an AI assistant designed to analyze hypothetical investment scenarios for educational purposes. **This is not financial advice.**

I have a hypothetical initial investment budget of $${initialBudget.toFixed(2)}.

Here are the fictional stocks I am considering:
${stocks.map(s => `- ${s.name} (Price: $${s.price.toFixed(2)}, Expected Return: ${s.expectedReturn.toFixed(2)}%)`).join('\n')}

My current hypothetical investment allocations are:
${investmentResults.map(r => `- ${r.stockName}: Invested $${r.investedAmount.toFixed(2)} (Fraction: ${r.fraction.toFixed(4)}), Actual Return: $${r.actualReturn.toFixed(2)}`).join('\n')}

Total Invested: $${totalInvestedAmount.toFixed(2)}
Total Actual Return: $${totalActualReturn.toFixed(2)}
Remaining Budget: $${remainingBudget.toFixed(2)}

Please provide a comprehensive analysis of this hypothetical portfolio for educational discussion.
Specifically, consider:
1.  **Diversification**: How well-diversified is this hypothetical portfolio? What are potential gaps?
2.  **Risk Assessment**: What are the potential risks and opportunities associated with this portfolio composition in a hypothetical market?
3.  **Optimization/Rebalancing**: What are some theoretical strategies for rebalancing or adjusting these investments to explore different risk/return profiles?
4.  **Next Steps**: What are some general concepts an investor might study next to improve their understanding of investment strategy?

Provide your analysis in a well-structured, easy-to-read markdown format with clear headings. Conclude with a clear disclaimer that this is a fictional analysis for educational purposes only and not financial advice.`;

  return getGeminiResponse(prompt, 'gemini-2.5-pro'); // Use Pro for complex financial advice
};