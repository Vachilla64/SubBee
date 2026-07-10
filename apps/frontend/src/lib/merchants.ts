export interface Merchant {
  id: string;
  name: string;
  domain: string;
  defaultPriceNaira: number;
}

export const MERCHANTS: Merchant[] = [
  // Existing
  { id: 'netflix', name: 'Netflix', domain: 'netflix.com', defaultPriceNaira: 4500 },
  { id: 'spotify', name: 'Spotify', domain: 'spotify.com', defaultPriceNaira: 900 },
  { id: 'amazon_prime', name: 'Amazon Prime Video', domain: 'primevideo.com', defaultPriceNaira: 2300 },
  { id: 'disney', name: 'Disney+', domain: 'disneyplus.com', defaultPriceNaira: 3500 },
  { id: 'apple', name: 'Apple Music', domain: 'apple.com', defaultPriceNaira: 1500 },
  { id: 'tidal', name: 'Tidal', domain: 'tidal.com', defaultPriceNaira: 1200 },
  { id: 'hulu', name: 'Hulu', domain: 'hulu.com', defaultPriceNaira: 3000 },
  { id: 'hbo', name: 'HBO Max', domain: 'max.com', defaultPriceNaira: 4000 },
  { id: 'dstv', name: 'DStv', domain: 'dstv.com', defaultPriceNaira: 19800 },
  { id: 'youtube', name: 'YouTube Premium', domain: 'youtube.com', defaultPriceNaira: 1300 },
  { id: 'github', name: 'GitHub Copilot', domain: 'github.com', defaultPriceNaira: 8500 },
  { id: 'openai', name: 'OpenAI ChatGPT Plus', domain: 'openai.com', defaultPriceNaira: 17000 },
  { id: 'zoom', name: 'Zoom Premium', domain: 'zoom.us', defaultPriceNaira: 12500 },
  { id: 'linkedin', name: 'LinkedIn', domain: 'linkedin.com', defaultPriceNaira: 12000 },

  // Foreign additions
  { id: 'canva', name: 'Canva Pro', domain: 'canva.com', defaultPriceNaira: 8000 },
  { id: 'adobe', name: 'Adobe Creative Cloud', domain: 'adobe.com', defaultPriceNaira: 35000 },

  // Nigerian additions
  { id: 'showmax', name: 'Showmax', domain: 'showmax.com', defaultPriceNaira: 2900 },
  { id: 'mtn', name: 'MTN', domain: 'mtn.com', defaultPriceNaira: 5000 },
  { id: 'airtel', name: 'Airtel', domain: 'airtel.com', defaultPriceNaira: 5000 },
  { id: 'boomplay', name: 'Boomplay', domain: 'boomplay.com', defaultPriceNaira: 1200 },
  { id: 'piggyvest', name: 'PiggyVest', domain: 'piggyvest.com', defaultPriceNaira: 1000 },
];

export function merchantById(id: string): Merchant | undefined {
  return MERCHANTS.find((m) => m.id === id);
}
