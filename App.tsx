import React, { useState, useEffect, useCallback, useRef } from 'react';
import StockInputForm from './components/StockInputForm';
import StockList from './components/StockList';
import InvestmentResults from './components/InvestmentResults';
import { Stock, InvestmentResult } from './types';
import { getGeminiResponse, getStockIdeas, analyzeMarketData, getPortfolioAdvice } from './services/geminiService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const App: React.FC = () => {
  const [budget, setBudget] = useState<number>(10000);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [investmentResults, setInvestmentResults] = useState<InvestmentResult[]>([]);
  const [totalInvestedAmount, setTotalInvestedAmount] = useState<number>(0);
  const [totalActualReturn, setTotalActualReturn] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const [geminiPrompt, setGeminiPrompt] = useState<string>('');
  const [geminiResponse, setGeminiResponse] = useState<string>('');
  const [isQueryingGemini, setIsQueryingGemini] = useState<boolean>(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);
  const [isAnalyzingMarket, setIsAnalyzingMarket] = useState<boolean>(false);
  const [isGettingPortfolioAdvice, setIsGettingPortfolioAdvice] = useState<boolean>(false);

  const handleCalculateInvestment = useCallback(() => {
    if (budget <= 0 || stocks.length === 0) {
      // Ensure all stocks are represented even if no budget or no calculation is made
      setInvestmentResults(stocks.map(stock => ({
        stockId: stock.id,
        stockName: stock.name,
        fraction: 0,
        investedAmount: 0,
        actualReturn: 0,
      })));
      setTotalInvestedAmount(0);
      setTotalActualReturn(0);
      alert('Please enter a positive budget and add at least one stock.');
      return;
    }

    setIsCalculating(true);
    let currentBudget = budget;
    let currentTotalReturn = 0;
    let currentTotalInvestedAmount = 0;
    const resultsMap = new Map<string, InvestmentResult>();

    // Initialize all stocks in resultsMap with 0 investment to ensure they are present
    stocks.forEach(stock => {
      resultsMap.set(stock.id, {
        stockId: stock.id,
        stockName: stock.name,
        fraction: 0,
        investedAmount: 0,
        actualReturn: 0,
      });
    });

    // Sort stocks by return-to-price ratio in descending order
    const sortedStocks = [...stocks].sort((a, b) =>
      (b.expectedReturn / b.price) - (a.expectedReturn / a.price)
    );

    for (const stock of sortedStocks) {
      if (currentBudget <= 0) break;

      let fraction = 0;
      let investedAmount = 0;
      let actualReturn = 0;

      // Check if we can buy full share(s) or only a fraction
      if (currentBudget >= stock.price) {
        // Buy as many full shares as possible
        const numShares = Math.floor(currentBudget / stock.price);
        investedAmount = numShares * stock.price;
        fraction = numShares; // For simplicity, fraction represents number of shares in this context
        actualReturn = (numShares * stock.price) * (stock.expectedReturn / 100);
      } else {
        // Buy a fraction of the stock
        investedAmount = currentBudget;
        fraction = currentBudget / stock.price;
        actualReturn = currentBudget * (stock.expectedReturn / 100);
      }

      const existingResult = resultsMap.get(stock.id);
      if (existingResult) {
        existingResult.fraction = fraction;
        existingResult.investedAmount = investedAmount;
        existingResult.actualReturn = actualReturn;
      }

      currentBudget -= investedAmount;
      currentTotalReturn += actualReturn;
      currentTotalInvestedAmount += investedAmount;
    }

    const finalResults = Array.from(resultsMap.values());
    setInvestmentResults(finalResults);
    setTotalInvestedAmount(currentTotalInvestedAmount);
    setTotalActualReturn(currentTotalReturn);
    setIsCalculating(false);
  }, [budget, stocks]);

  const handleRemoveStock = useCallback((id: string) => {
    setStocks((prevStocks) => prevStocks.filter((stock) => stock.id !== id));
    // Also remove from investment results if present
    setInvestmentResults((prevResults) => prevResults.filter((result) => result.stockId !== id));

    // Recalculate if results are already displayed or to update totals
    // A small delay to ensure state updates propagate before recalculation
    setTimeout(() => {
      handleCalculateInvestment();
    }, 0);
  }, [handleCalculateInvestment]);

  const handleAdjustInvestment = useCallback((stockId: string, newAmountString: string) => {
    const newAmount = parseFloat(newAmountString);

    if (isNaN(newAmount) || newAmount < 0) {
      alert("Please enter a valid non-negative number for the invested amount.");
      return;
    }

    // Find the stock being adjusted
    const stockToAdjust = stocks.find(s => s.id === stockId);
    if (!stockToAdjust) {
      console.error("Stock not found for adjustment:", stockId);
      alert("Error: Stock details not found for this adjustment.");
      return;
    }

    // Calculate new total invested and check budget
    const currentInvestmentResult = investmentResults.find(r => r.stockId === stockId);
    const currentInvestmentAmount = currentInvestmentResult?.investedAmount || 0;
    const amountDifference = newAmount - currentInvestmentAmount;
    const newTotalInvested = totalInvestedAmount + amountDifference;

    if (newTotalInvested > budget) {
      alert(`Cannot invest $${newAmount.toFixed(2)}. This would exceed your total budget of $${budget.toFixed(2)} (Current total: $${totalInvestedAmount.toFixed(2)}).`);
      return;
    }

    // Update investment results
    setInvestmentResults(prevResults => {
      const updatedResults = prevResults.map(result => {
        if (result.stockId === stockId) {
          const fraction = newAmount / stockToAdjust.price;
          const actualReturn = newAmount * (stockToAdjust.expectedReturn / 100);
          return {
            ...result,
            fraction: fraction,
            investedAmount: newAmount,
            actualReturn: actualReturn,
          };
        }
        return result;
      });

      // Recalculate totals
      const calculatedTotalInvested = updatedResults.reduce((sum, res) => sum + res.investedAmount, 0);
      const calculatedTotalReturn = updatedResults.reduce((sum, res) => sum + res.actualReturn, 0);

      setTotalInvestedAmount(calculatedTotalInvested);
      setTotalActualReturn(calculatedTotalReturn);

      return updatedResults;
    });
  }, [budget, stocks, investmentResults, totalInvestedAmount]);


  const handleGeminiQuery = useCallback(async () => {
    if (geminiPrompt.trim() === '') {
      alert('Please enter a question for Gemini.');
      return;
    }

    setIsQueryingGemini(true);
    setGeminiResponse(''); // Clear previous response
    try {
      const response = await getGeminiResponse(geminiPrompt);
      setGeminiResponse(response);
    } catch (error) {
      console.error("Error during Gemini query:", error);
      if (error instanceof Error) {
        setGeminiResponse(error.message);
      } else {
        setGeminiResponse("An error occurred while fetching the response. Please try again.");
      }
    } finally {
      setIsQueryingGemini(false);
    }
  }, [geminiPrompt]);

  const handleGenerateIdeas = useCallback(async (description: string) => {
    setIsGeneratingIdeas(true);
    try {
      const response = await getStockIdeas(description);
      setGeminiResponse(`**Stock Ideas for "${description}":**\n${response}`);
    } catch (error) {
      console.error("Error generating stock ideas:", error);
      if (error instanceof Error) {
        setGeminiResponse(error.message);
      } else {
        setGeminiResponse("An error occurred while generating stock ideas. Please try again.");
      }
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, []);

  const handleAnalyzeMarket = useCallback(async () => {
    if (stocks.length === 0) {
      alert("Please add some stocks to analyze the market data.");
      return;
    }

    setIsAnalyzingMarket(true);
    setGeminiResponse(''); // Clear previous response
    try {
      const response = await analyzeMarketData(stocks);
      setGeminiResponse(`**Market Analysis for your selected stocks:**\n${response}`);
    } catch (error) {
      console.error("Error analyzing market data:", error);
      if (error instanceof Error) {
        setGeminiResponse(error.message);
      } else {
        setGeminiResponse("An error occurred while analyzing market data. Please try again.");
      }
    } finally {
      setIsAnalyzingMarket(false);
    }
  }, [stocks]);

  const handleGetPortfolioAdvice = useCallback(async () => {
    if (stocks.length === 0 || investmentResults.length === 0) {
      alert("Please add stocks and calculate your optimal investment before getting portfolio advice.");
      return;
    }

    setIsGettingPortfolioAdvice(true);
    setGeminiResponse(''); // Clear previous response
    try {
      const response = await getPortfolioAdvice(budget, stocks, investmentResults);
      setGeminiResponse(`**Portfolio Advice:**\n${response}`);
    } catch (error) {
      console.error("Error getting portfolio advice:", error);
      if (error instanceof Error) {
        setGeminiResponse(error.message);
      } else {
        setGeminiResponse("An error occurred while getting portfolio advice. Please try again.");
      }
    } finally {
      setIsGettingPortfolioAdvice(false);
    }
  }, [budget, stocks, investmentResults]);


  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-blue-400 mb-2">Fractional Stock Investor</h1>
        <p className="text-lg text-gray-300">
          Maximize your returns with a smart, fractional approach.
        </p>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        <StockInputForm
          budget={budget}
          setBudget={setBudget}
          stocks={stocks}
          setStocks={setStocks}
          onCalculate={handleCalculateInvestment}
          onGenerateIdeas={handleGenerateIdeas}
          isCalculating={isCalculating}
          isGeneratingIdeas={isGeneratingIdeas}
        />

        <StockList stocks={stocks} onRemoveStock={handleRemoveStock} />

        <InvestmentResults
          initialBudget={budget}
          investmentResults={investmentResults}
          totalInvestedAmount={totalInvestedAmount}
          totalActualReturn={totalActualReturn}
          onAdjustInvestment={handleAdjustInvestment}
          allStocks={stocks} // Pass all stocks for lookup in adjustment
        />

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-center text-blue-300">AI Assistant <span className="text-blue-400 text-lg">(Powered by Gemini)</span></h2>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              value={geminiPrompt}
              onChange={(e) => setGeminiPrompt(e.target.value)}
              placeholder="Ask Gemini about stocks, market trends, or investment strategies..."
              className="flex-grow p-3 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-gray-700 text-gray-100 placeholder-gray-400"
              disabled={isQueryingGemini}
              aria-label="Ask Gemini for general investment questions"
            />
            <button
              onClick={handleGeminiQuery}
              disabled={geminiPrompt.trim() === '' || isQueryingGemini}
              className={`px-6 py-3 font-semibold rounded-md transition duration-150 ease-in-out
                ${geminiPrompt.trim() === '' || isQueryingGemini
                  ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
              aria-label={isQueryingGemini ? 'Asking Gemini...' : 'Ask Gemini'}
            >
              {isQueryingGemini ? 'Asking...' : 'Ask Gemini'}
            </button>
          </div>
          <div className="flex flex-wrap justify-end mt-4 gap-2">
            <button
              onClick={handleAnalyzeMarket}
              disabled={stocks.length === 0 || isAnalyzingMarket}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition duration-150 ease-in-out
                ${stocks.length === 0 || isAnalyzingMarket
                  ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                  : 'bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2'
                }`}
              aria-label={isAnalyzingMarket ? 'Analyzing market...' : 'Analyze My Stocks (AI)'}
            >
              {isAnalyzingMarket ? 'Analyzing...' : 'Analyze My Stocks (AI)'}
            </button>
            <button
              onClick={handleGetPortfolioAdvice}
              disabled={stocks.length === 0 || investmentResults.length === 0 || isGettingPortfolioAdvice}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition duration-150 ease-in-out
                ${stocks.length === 0 || investmentResults.length === 0 || isGettingPortfolioAdvice
                  ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                  : 'bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
                }`}
              aria-label={isGettingPortfolioAdvice ? 'Getting portfolio advice...' : 'Get Portfolio Advice (AI)'}
            >
              {isGettingPortfolioAdvice ? 'Getting Advice...' : 'Get Portfolio Advice (AI)'}
            </button>
          </div>
          {geminiResponse && (
            <div className="mt-6 p-4 bg-blue-900/30 rounded-md border border-blue-700 text-gray-200" role="region" aria-live="polite">
              <h3 className="font-semibold text-blue-300 mb-2">Gemini's Response:</h3>
              <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{geminiResponse}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center mt-12 py-4 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Fractional Stock Investor. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
