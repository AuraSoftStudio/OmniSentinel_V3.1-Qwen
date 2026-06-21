// src/utils/currency.js

export const CURRENCY_CONFIG = {
  USD: { symbol: '$', code: 'USD', locale: 'en-US', rate: 1 },
  CLP: { symbol: '$', code: 'CLP', locale: 'es-CL', rate: 950 }, // Ejemplo base, sobreescribible por store
  EUR: { symbol: '€', code: 'EUR', locale: 'de-DE', rate: 0.92 }
};

export const formatCurrency = (amountUSD, currency, userRate = 1) => {
  if (amountUSD == null || isNaN(amountUSD)) return 'N/A';
  const converted = amountUSD * userRate;
  
  const formatter = new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return formatter.format(converted);
};

export const getCurrencySymbol = (currency) => {
  return CURRENCY_CONFIG[currency]?.symbol || '$';
};