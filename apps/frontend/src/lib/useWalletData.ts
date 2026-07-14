import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth';

export interface Subscription {
  id: string;
  merchantId: string;
  merchantName: string;
  amountKobo: bigint;
  billingDay: number;
  remindersEnabled: boolean;
  isActive: boolean;
  needsConfirmation?: boolean;
}

export interface CardData {
  status: 'inactive' | 'active' | 'frozen' | 'creating';
  cardId?: string;
  last4?: string;
  brand?: string;
  balanceKobo?: bigint;
}

export interface WalletData {
  loading: boolean;
  walletKobo: bigint;
  card: CardData;
  subscriptions: Subscription[];
  accountNumber: string | null;
  bankName: string | null;
  telegramConnected: boolean;
  telegramBotUsername: string;
  refetch: () => Promise<void>;
}

const POLL_MS = 60_000;

export function useWalletData(): WalletData {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [walletKobo, setWalletKobo] = useState<bigint>(0n);
  const [card, setCard] = useState<CardData>({ status: 'inactive' });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramBotUsername, setTelegramBotUsername] = useState('SubBeeBot');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [balance, cardData, subs, deposit] = await Promise.all([
        api.getBalance(user.email),
        api.getCard(user.email),
        api.getSubscriptions(user.email),
        api.getDepositInfo(user.email).catch(() => ({ accountNumber: null, bankName: null })),
      ]);
      setWalletKobo(balance.balanceKobo ?? 0n);
      setTelegramConnected(!!balance.telegramConnected);
      if (balance.telegramBotUsername) setTelegramBotUsername(balance.telegramBotUsername);
      if (balance.kycStatus && balance.kycStatus !== user.kycStatus) updateUser({ kycStatus: balance.kycStatus });
      setCard(cardData);
      if (Array.isArray(subs)) setSubscriptions(subs);
      setAccountNumber(deposit?.accountNumber ?? null);
      setBankName(deposit?.bankName ?? null);
    } catch (e) {
      console.error('[useWalletData] failed to load wallet data:', e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return {
    loading,
    walletKobo,
    card,
    subscriptions,
    accountNumber,
    bankName,
    telegramConnected,
    telegramBotUsername,
    refetch: load,
  };
}
