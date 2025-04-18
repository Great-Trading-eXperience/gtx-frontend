import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPrice = (price: string): string => {
  return Number(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatQuantity = (quantity: string): string => {
  return Number(quantity).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatAmount = (amount: string): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(Number(amount));
};

export const formatVolume = (value: number, decimals: number = 6) => {
  const num = parseFloat(value.toString())
  
  const config = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }
  
  if (num >= 1e9) {
    return (num / 1e9).toLocaleString('en-US', config) + 'B'
  } else if (num >= 1e6) {
    return (num / 1e6).toLocaleString('en-US', config) + 'M'
  } else if (num >= 1e3) {
    return (num / 1e3).toLocaleString('en-US', config) + 'K'
  } else {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })
  }
}

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString("en-US", { hour12: false })
}