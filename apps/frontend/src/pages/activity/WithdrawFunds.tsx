import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useWalletData } from '../../lib/useWalletData';
import { api } from '../../lib/api';
import { formatNaira } from '../../lib/format';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import SelectField from '../../components/ui/SelectField';
import BottomSheet from '../../components/ui/BottomSheet';

interface Bank {
  code: string;
  name: string;
}

export default function WithdrawFunds() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { walletKobo, refetch } = useWalletData();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksError, setBanksError] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amountNaira, setAmountNaira] = useState('');

  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [withdrawnAmount, setWithdrawnAmount] = useState<number | null>(null);

  useEffect(() => {
    api
      .getBanks()
      .then((res) => setBanks(res.banks ?? []))
      .catch(() => setBanksError(true));
  }, []);

  // Any change to the destination invalidates a prior name verification.
  const resetVerification = () => {
    setResolvedName(null);
    setVerifyError(null);
  };

  const verifyAccount = async () => {
    if (!bankCode || accountNumber.length < 10) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await api.lookupBankAccount(accountNumber, bankCode);
      setResolvedName(res.accountName);
    } catch (err: any) {
      let msg = "We couldn't verify that account. Double-check the number and bank.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) msg = parsed.error;
      } catch {
        // keep default message
      }
      setVerifyError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const amountKobo = Math.round((parseFloat(amountNaira) || 0) * 100);
  const insufficientFunds = amountKobo > 0 && BigInt(amountKobo) > walletKobo;
  const canSubmit = !!resolvedName && amountKobo > 0 && !insufficientFunds && !submitting;

  const submitWithdrawal = async () => {
    if (!user || !resolvedName || !canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.withdraw(user.email, parseFloat(amountNaira), accountNumber, bankCode, resolvedName);
      await refetch();
      setWithdrawnAmount(parseFloat(amountNaira));
    } catch (err: any) {
      let msg = 'Failed to send withdrawal. Please try again.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) msg = parsed.error;
      } catch {
        // keep default message
      }
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <TopBar title="Withdraw Funds" back />
      <div className="px-5 pb-8">
        <div className="honeycomb-gold rounded-2xl px-4.5 py-3.5">
          <span className="text-[11.5px] font-extrabold tracking-wide text-gold-label">WALLET BALANCE</span>
          <div className="tabular-nums text-[26px] font-black tracking-tight text-gold-text">{formatNaira(walletKobo)}</div>
        </div>

        <div className="mt-4.5 flex flex-col gap-3.5 rounded-[20px] bg-white p-4.5 shadow-[0_4px_16px_rgba(20,40,45,0.06)]">
          <TextField
            label="Amount (₦)"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amountNaira}
            onChange={(e) => setAmountNaira(e.target.value)}
          />
          {insufficientFunds && (
            <p className="text-xs font-bold text-salmon-text">That's more than your wallet balance.</p>
          )}

          {banksError ? (
            <p className="text-xs font-bold text-salmon-text">Couldn't load the bank list — check your connection and reopen this page.</p>
          ) : (
            <SelectField
              label="Bank"
              value={bankCode}
              onChange={(e) => {
                setBankCode(e.target.value);
                resetVerification();
              }}
              options={[{ value: '', label: banks.length ? 'Select a bank...' : 'Loading banks…' }, ...banks.map((b) => ({ value: b.code, label: b.name }))]}
            />
          )}

          <TextField
            label="Account number"
            inputMode="numeric"
            maxLength={10}
            placeholder="0123456789"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
              resetVerification();
            }}
          />

          {!resolvedName && (
            <Button
              variant="secondary"
              fullWidth
              onClick={verifyAccount}
              disabled={!bankCode || accountNumber.length < 10 || verifying}
            >
              {verifying ? 'Verifying…' : 'Verify Account'}
            </Button>
          )}

          {verifyError && <p className="text-xs font-bold text-salmon-text">{verifyError}</p>}

          {resolvedName && (
            <div className="flex items-center justify-between rounded-2xl border border-active-border bg-active-bg px-4 py-3">
              <div>
                <div className="text-[10.5px] font-extrabold tracking-wide text-active-text">ACCOUNT NAME</div>
                <div className="text-sm font-extrabold text-active-text">{resolvedName}</div>
              </div>
              <button onClick={resetVerification} className="text-xs font-bold text-active-text underline">
                Change
              </button>
            </div>
          )}
        </div>

        {submitError && <p className="mt-3 text-center text-sm font-semibold text-salmon-text">{submitError}</p>}

        <Button fullWidth onClick={submitWithdrawal} disabled={!canSubmit} className="mt-4.5">
          {submitting ? 'Sending…' : 'Withdraw'}
        </Button>

        <p className="mt-3 text-center text-xs font-semibold text-ink-faint">
          Sent straight to your bank account. Usually lands within a few minutes.
        </p>
      </div>

      <BottomSheet open={withdrawnAmount !== null} onClose={() => navigate('/app/dashboard')}>
        <div className="flex flex-col items-center text-center">
          <img src="/illustrations/subbee-logo.png" alt="" className="h-32 w-32 object-contain animate-float" />
          <div className="mt-4 flex items-center gap-1.5 rounded-full border border-[#B6E0BE] bg-[#EAF7ED] px-3 py-1 text-[12px] font-extrabold text-[#4A8A5C]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Sent
          </div>
          <h2 className="mt-5 text-[22px] font-black tracking-tight text-ink">Withdrawal on its way!</h2>
          <p className="mt-2 text-[14px] font-medium leading-relaxed text-ink-muted px-2">
            <span className="font-bold text-ink">{withdrawnAmount !== null ? formatNaira(withdrawnAmount * 100) : ''}</span> is headed to{' '}
            <span className="font-bold text-ink">{resolvedName}</span>. Usually lands within a few minutes.
          </p>
          <Button
            fullWidth
            onClick={() => navigate('/app/dashboard')}
            className="mt-8 !h-[54px] !bg-gradient-to-br !from-[#F2CE7C] !to-[#E7B84F] !text-[#3B2C12] shadow-[0_4px_14px_rgba(231,184,79,0.3)] !text-[16px]"
          >
            Back to Dashboard
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
