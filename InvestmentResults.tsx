import React, { useState, useCallback, useRef } from 'react';
import { InvestmentResult, Stock } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface InvestmentResultsProps {
  initialBudget: number;
  investmentResults: InvestmentResult[];
  totalInvestedAmount: number;
  totalActualReturn: number;
  onAdjustInvestment: (stockId: string, newAmount: string) => void;
  allStocks: Stock[]; // Pass all stocks to look up price/return for adjustments
}

const COLORS = ['#00B9F1', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#A0A0A0', '#FF6B6B', '#1ABC9C']; // Updated colors

const InvestmentResults: React.FC<InvestmentResultsProps> = React.memo(({
  initialBudget,
  investmentResults,
  totalInvestedAmount,
  totalActualReturn,
  onAdjustInvestment,
  allStocks,
}) => {
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  if (investmentResults.length === 0 && initialBudget === 0) {
    return null; // Don't render if no calculations have been made and budget is zero
  }

  const remainingBudget = initialBudget - totalInvestedAmount;

  const handleAdjustClick = useCallback((stockId: string, currentAmount: number) => {
    setEditingStockId(stockId);
    setEditAmount(currentAmount.toFixed(2));
    // Focus on the input field after it renders
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, []);

  const handleSaveClick = useCallback((stockId: string) => {
    onAdjustInvestment(stockId, editAmount);
    setEditingStockId(null);
    setEditAmount('');
  }, [onAdjustInvestment, editAmount]);

  const handleCancelClick = useCallback(() => {
    setEditingStockId(null);
    setEditAmount('');
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>, stockId: string) => {
    if (event.key === 'Enter') {
      handleSaveClick(stockId);
    } else if (event.key === 'Escape') {
      handleCancelClick();
    }
  }, [handleSaveClick, handleCancelClick]);


  const pieChartData = investmentResults
    .filter(result => result.investedAmount > 0) // Only show stocks actually invested in for the pie chart
    .map(result => ({
      name: result.stockName,
      value: parseFloat(result.investedAmount.toFixed(2)),
    }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-2xl font-semibold mb-6 text-center text-blue-900">Investment Results</h2>

      {investmentResults.length === 0 && allStocks.length > 0 ? (
        <p className="text-center text-gray-500">No investment results to display. Calculate your optimal investment or manually adjust below!</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-600">Initial Budget</p>
              <p className="text-2xl font-bold text-blue-800">${initialBudget.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-600">Total Invested</p>
              <p className="text-2xl font-bold text-green-800">${totalInvestedAmount.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-600">Remaining Budget</p>
              <p className="text-2xl font-bold text-yellow-800">${remainingBudget.toFixed(2)}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-4 text-blue-800">Allocations</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stock Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fraction
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Invested Amount ($)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actual Return ($)
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {investmentResults
                    // Removed filter, now show all stocks to allow manual adjustment even if invested amount is 0
                    .map((result) => (
                      <tr key={result.stockId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.stockName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {result.fraction.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {editingStockId === result.stockId ? (
                            <div className="flex items-center space-x-2">
                              <input
                                ref={inputRef}
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, result.stockId)}
                                min="0"
                                step="0.01"
                                className="w-24 p-1 border border-gray-300 rounded-md text-sm focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-900 placeholder-gray-500"
                                aria-label={`Adjust invested amount for ${result.stockName}`}
                              />
                              <button
                                onClick={() => handleSaveClick(result.stockId)}
                                className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700 transition"
                                aria-label="Save investment adjustment"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelClick}
                                className="px-3 py-1 bg-gray-400 text-gray-800 rounded-md text-xs font-semibold hover:bg-gray-500 transition"
                                aria-label="Cancel investment adjustment"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>${result.investedAmount.toFixed(2)}</span>
                              <button
                                onClick={() => handleAdjustClick(result.stockId, result.investedAmount)}
                                className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-md text-xs font-semibold hover:bg-blue-600 transition"
                                aria-label={`Adjust investment for ${result.stockName}`}
                              >
                                Adjust
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          ${result.actualReturn.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {/* Actions can be added here if needed, but adjusting is inline */}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 text-center">
            <h3 className="text-xl font-medium mb-3 text-blue-800">Summary</h3>
            <div className="p-4 bg-green-50 rounded-lg shadow-sm inline-block min-w-[250px]">
              <p className="text-sm font-medium text-gray-700">Total Expected Return from Investment</p>
              <p className="text-3xl font-extrabold text-green-800">${totalActualReturn.toFixed(2)}</p>
            </div>
          </div>

          {pieChartData.length > 0 && (
            <div className="mt-8 pt-4 border-t border-gray-100">
              <h3 className="text-xl font-medium mb-4 text-blue-800 text-center">Investment Distribution</h3>
              <div className="h-64 sm:h-80 md:h-96"> {/* Responsive height for the chart */}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {pieChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`}/>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default InvestmentResults;