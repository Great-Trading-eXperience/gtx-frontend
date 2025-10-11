export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class OrderValidationService {
  static validateQuantity(quantity: string, maxBalance?: string): ValidationResult {
    const qty = parseFloat(quantity);

    if (!quantity || isNaN(qty)) {
      return { valid: false, error: 'Quantity is required' };
    }

    if (qty <= 0) {
      return { valid: false, error: 'Quantity must be positive' };
    }

    if (maxBalance && qty > parseFloat(maxBalance)) {
      return { valid: false, error: 'Insufficient balance' };
    }

    return { valid: true };
  }

  static validatePrice(price: string, orderType: 'limit' | 'market'): ValidationResult {
    if (orderType === 'market') {
      return { valid: true };
    }

    const priceNum = parseFloat(price);

    if (!price || isNaN(priceNum)) {
      return { valid: false, error: 'Price is required for limit orders' };
    }

    if (priceNum <= 0) {
      return { valid: false, error: 'Price must be positive' };
    }

    return { valid: true };
  }

  static validateSlippage(slippage: string): ValidationResult {
    const slippageNum = parseFloat(slippage);

    if (isNaN(slippageNum)) {
      return { valid: false, error: 'Invalid slippage value' };
    }

    if (slippageNum < 0 || slippageNum > 99) {
      return { valid: false, error: 'Slippage must be between 0 and 99%' };
    }

    return { valid: true };
  }
}
