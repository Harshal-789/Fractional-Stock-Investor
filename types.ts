export interface Stock {
  id: string;
  name: string;
  price: number;
  expectedReturn: number;
}

export interface InvestmentResult {
  stockId: string;
  stockName: string;
  fraction: number;
  investedAmount: number;
  actualReturn: number;
}
