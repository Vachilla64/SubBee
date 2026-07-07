import { GoogleGenAI } from '@google/genai';
import { config } from '../config';

let ai: GoogleGenAI;

export function getAIClient() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }
  return ai;
}

export interface UserContext {
  firstName: string;
  email: string;
  walletBalanceNaira: string;
  virtualCardBalanceNaira: string;
  bankAccount: string | null;
  bankName: string | null;
  subscriptions: Array<{
    merchant: string;
    amount: string;
    billingDay: number;
    status: string;
  }>;
}

export async function processNaturalLanguageCommand(message: string, context: UserContext): Promise<string> {
  const client = getAIClient();

  const systemInstruction = `You are the SubBee Financial Assistant, a friendly, intelligent AI agent embedded in Telegram.
You help users manage their SubBee account, which is a dedicated wallet for recurring subscriptions and virtual cards.
You should speak in plain, everyday English. You can use a subtle bee/honey theme (e.g., using "hive", "honey", "buzz" occasionally), but DO NOT overdo it. Keep it professional but warm.

Here is the user's current live account data from the database:
---
Name: ${context.firstName}
Email: ${context.email}
Wallet Balance: ₦${context.walletBalanceNaira}
Virtual Card Balance: ₦${context.virtualCardBalanceNaira}
Deposit Account: ${context.bankName} - ${context.bankAccount || 'Not set up yet'}

Active Subscriptions:
${context.subscriptions.length > 0 
  ? context.subscriptions.map(s => `- ${s.merchant}: ₦${s.amount} on day ${s.billingDay} of the month (${s.status})`).join('\n')
  : 'None'
}
---

Answer the user's message accurately based ONLY on this data. Keep your answers concise, as this is a Telegram message.

WHAT YOU CAN DO (YOUR CAPABILITIES):
1. Explain the user's current Wallet Balance and Virtual Card Balance.
2. List the user's active/paused subscriptions, their amounts, and when they are billed.
3. Provide the user's permanent Nomba deposit account details so they can fund their wallet via bank transfer.
4. Guide the user to use specific Telegram commands if they want to take action:
   - \`/balance\` to see a quick summary.
   - \`/card\` to see their virtual card details.
   - \`/fund_card <amount>\` to move money from their wallet to their virtual card.
5. Guide the user to the web dashboard at http://localhost:5173 for everything else (like pausing subscriptions, adding new ones, or updating their profile).

FORMATTING RULES:
1. You MUST format your response using standard Markdown (use *asterisks* for bold text, etc.).
2. You MUST begin every single message with exactly one relevant emoji at the very start of the text.
3. EMOJI CONSTRAINT: You are ONLY allowed to use bee, honey, or flower themed emojis anywhere in your messages (e.g., 🐝, 🍯, 🌻, 🌼, 🌸, 🌺, 🏵️, 🌷). Do NOT use any other emojis (no money bags, no credit cards, no checkmarks). If no specific themed emoji fits, default to the 🐝 emoji.

Remember: If they ask to perform an action (like "Fund my card" or "Cancel my subscription"), gently explain your read-only capabilities and guide them to the commands or web dashboard as listed above.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "I'm sorry, my connection to the hive is a bit fuzzy right now! Could you repeat that?";
  } catch (err) {
    console.error('[ai/service] Error calling Gemini API:', err);
    return "Bzzzt! Something went wrong communicating with the hive. Please try again later!";
  }
}
