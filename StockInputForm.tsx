import React, { useState, useCallback } from 'react';
import { Stock } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StockInputFormProps {
  budget: number;
  setBudget: (budget: number) => void;
  stocks: Stock[];
  setStocks: (stocks: Stock[]) => void;
  onCalculate: () => void;
  onGenerateIdeas: (description: string) => void;
  isCalculating: boolean;
  isGeneratingIdeas: boolean;
}

const StockInputForm: React.FC<StockInputFormProps> = React.memo(({
  budget,
  setBudget,
  stocks,
  setStocks,
  onCalculate,
  onGenerateIdeas,
  isCalculating,
  isGeneratingIdeas,
}) => {
  const [newStockName, setNewStockName] = useState<string>('');
  const [newStockPrice, setNewStockPrice] = useState<string>('');
  const [newStockReturn, setNewStockReturn] = useState<string>('');
  const [ideaDescription, setIdeaDescription] = useState<string>('');

  const handleAddStock = useCallback(() => {
    const price = parseFloat(newStockPrice);
    const expectedReturn = parseFloat(newStockReturn);

    if (newStockName.trim() === '' || isNaN(price) || price <= 0 || isNaN(expectedReturn) || expectedReturn < 0) {
      alert('Please enter a valid stock name, positive price, and non-negative return.');
      return;
    }

    const newStock: Stock = {
      id: uuidv4(),
      name: newStockName.trim(),
      price: price,
      expectedReturn: expectedReturn,
    };

    setStocks([...stocks, newStock]);
    setNewStockName('');
    setNewStockPrice('');
    setNewStockReturn('');
  }, [newStockName, newStockPrice, newStockReturn, stocks, setStocks]);

  const handleBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setBudget(isNaN(value) ? 0 : value);
  }, [setBudget]);

  const handleIdeaDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIdeaDescription(e.target.value);
  }, []);

  const handleGenerateIdeasClick = useCallback(() => {
    if (ideaDescription.trim() === '') {
      alert('Please enter a description for stock ideas.');
      return;
    }
    onGenerateIdeas(ideaDescription);
  }, [ideaDescription, onGenerateIdeas]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-2xl font-semibold mb-6 text-center text-blue-900">Investment Configuration</h2>

      <div className="mb-6">
        <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
          Total Investment Budget ($)
        </label>
        <input
          type="number"
          id="budget"
          value={budget}
          onChange={handleBudgetChange}
          min="0"
          step="any"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-400 focus:border-blue-400 transition duration-150 ease-in-out bg-white text-gray-900 placeholder-gray-500"
          placeholder="e.g., 10000"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-medium mb-4 text-blue-800">Add New Stock</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="stockName" className="block text-xs font-medium text-gray-600 mb-1">
              Stock Name
            </label>
            <input
              type="text"
              id="stockName"
              value={newStockName}
              onChange={(e) => setNewStockName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-900 placeholder-gray-500"
              placeholder="e.g., GOOGL"
            />
          </div>
          <div>
            <label htmlFor="stockPrice" className="block text-xs font-medium text-gray-600 mb-1">
              Price per Share ($)
            </label>
            <input
              type="number"
              id="stockPrice"
              value={newStockPrice}
              onChange={(e) => setNewStockPrice(e.target.value)}
              min="0.01"
              step="any"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-900 placeholder-gray-500"
              placeholder="e.g., 150.75"
            />
          </div>
          <div>
            <label htmlFor="stockReturn" className="block text-xs font-medium text-gray-600 mb-1">
              Expected Return (%)
            </label>
            <input
              type="number"
              id="stockReturn"
              value={newStockReturn}
              onChange={(e) => setNewStockReturn(e.target.value)}
              min="0"
              step="any"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-900 placeholder-gray-500"
              placeholder="e.g., 10.5"
            />
          </div>
        </div>
        <button
          onClick={handleAddStock}
          className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        >
          Add Stock
        </button>
      </div>

      <div className="flex justify-center mt-8 pt-4 border-t border-gray-100">
        <button
          onClick={onCalculate}
          disabled={stocks.length === 0 || budget <= 0 || isCalculating}
          className={`w-full md:w-2/3 px-8 py-4 text-lg font-semibold rounded-md transition duration-300 ease-in-out
            ${stocks.length === 0 || budget <= 0 || isCalculating
              ? 'bg-gray-300 cursor-not-allowed text-gray-600'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
        >
          {isCalculating ? 'Calculating...' : 'Calculate Optimal Investment'}
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <h3 className="text-xl font-medium mb-4 text-blue-800">Generate Stock Ideas <span className="text-base text-gray-500">(AI Powered)</span></h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={ideaDescription}
            onChange={handleIdeaDescriptionChange}
            placeholder="e.g., 'sustainable energy stocks' or 'high-growth tech'"
            className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-purple-400 focus:border-purple-400 transition duration-150 ease-in-out bg-white text-gray-900 placeholder-gray-500"
            disabled={isGeneratingIdeas}
          />
          <button
            onClick={handleGenerateIdeasClick}
            disabled={ideaDescription.trim() === '' || isGeneratingIdeas}
            className={`px-6 py-3 font-semibold rounded-md transition duration-150 ease-in-out
              ${ideaDescription.trim() === '' || isGeneratingIdeas
                ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
              }`}
          >
            {isGeneratingIdeas ? 'Generating...' : 'Get Stock Ideas'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default StockInputForm;