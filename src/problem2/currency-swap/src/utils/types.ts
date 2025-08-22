export interface TokenPrice {
    currency: string;
    date: string;
    price: number;
  }
  
  export interface SwapFormData {
    fromCurrency: string;
    toCurrency: string;
    fromAmount: string;
    toAmount: string;
  }
  