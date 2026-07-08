export interface Merchant {
  id: string;
  name: string;
  domain: string;
  defaultPriceNaira: number;
}

export const MERCHANTS: Merchant[] = [
  { id: 'netflix', name: 'Netflix', domain: 'netflix.com', defaultPriceNaira: 4500 },
  { id: 'linkedin', name: 'LinkedIn', domain: 'linkedin.com', defaultPriceNaira: 12000 },
  { id: 'spotify', name: 'Spotify', domain: 'spotify.com', defaultPriceNaira: 900 },
  { id: 'amazon_prime', name: 'Amazon Prime Video', domain: 'primevideo.com', defaultPriceNaira: 2300 },
  { id: 'dstv', name: 'DStv', domain: 'dstv.com', defaultPriceNaira: 19800 },
  { id: 'youtube', name: 'YouTube Premium', domain: 'youtube.com', defaultPriceNaira: 1300 },
  { id: 'github', name: 'GitHub Copilot', domain: 'github.com', defaultPriceNaira: 8500 },
  { id: 'apple', name: 'Apple Music / iCloud', domain: 'apple.com', defaultPriceNaira: 1500 },
  { id: 'openai', name: 'OpenAI ChatGPT Plus', domain: 'openai.com', defaultPriceNaira: 17000 },
  { id: 'zoom', name: 'Zoom Premium', domain: 'zoom.us', defaultPriceNaira: 12500 },
];

export function merchantById(id: string): Merchant | undefined {
  return MERCHANTS.find((m) => m.id === id);
}
