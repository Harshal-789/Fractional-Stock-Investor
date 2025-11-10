import React, { useCallback } from 'react';
import { Stock } from '../types';

interface StockListProps {
  stocks: Stock[];
  onRemoveStock: (id: string) => void;
}

const StockList: React.FC<StockListProps> = React.memo(({ stocks, onRemoveStock }) => {
  const handleRemoveClick = useCallback((id: string) => {
    onRemoveStock(id);
  }, [onRemoveStock]);

  if (stocks.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-6 text-center text-gray-400">
        No stocks added yet. Use the form above to add some!
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-6">
      <h2 className="text-2xl font-semibold mb-6 text-center text-blue-300">Available Stocks</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Price ($)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Expected Return (%)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Return/Price Ratio
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {stocks.map((stock) => (
              <tr key={stock.id} className="hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                  {stock.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  ${stock.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {stock.expectedReturn.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {(stock.expectedReturn / stock.price).toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleRemoveClick(stock.id)}
                    className="text-red-500 hover:text-red-400 transition duration-150 ease-in-out font-semibold text-sm"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default StockList;