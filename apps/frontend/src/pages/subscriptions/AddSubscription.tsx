import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/layout/TopBar";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import { MERCHANTS, type Merchant } from "../../lib/merchants";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { useWalletData } from "../../lib/useWalletData";

export default function AddSubscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscriptions } = useWalletData();
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    if (!user?.isPro && subscriptions.length >= 7) {
      navigate("/app/upgrade", { replace: true });
    }
  }, [subscriptions.length, navigate, user?.isPro]);

  // Selection Phase State
  const [search, setSearch] = useState("");
  const [tempSelection, setTempSelection] = useState<Merchant | null>(null);

  // Billing Phase State
  const [amount, setAmount] = useState("");
  const [billingDay, setBillingDay] = useState("5");
  const [reminders, setReminders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom Subscription State
  const [customName, setCustomName] = useState("");

  // Group existing merchants into categories
  const categories = useMemo(() => {
    if (search.trim()) {
      return [
        {
          label: "RESULTS",
          items: MERCHANTS.filter((m) =>
            m.name.toLowerCase().includes(search.toLowerCase()),
          ),
        },
      ];
    }
    return [
      {
        label: "POPULAR",
        items: MERCHANTS.filter((m) =>
          ["netflix", "spotify", "amazon_prime"].includes(m.id),
        ),
      },
      {
        label: "MUSIC",
        items: MERCHANTS.filter((m) => ["apple"].includes(m.id)),
      },
      {
        label: "VIDEO",
        items: MERCHANTS.filter((m) => ["youtube", "dstv"].includes(m.id)),
      },
      {
        label: "PRODUCTIVITY",
        items: MERCHANTS.filter((m) =>
          ["github", "openai", "zoom", "linkedin"].includes(m.id),
        ),
      },
      {
        label: "OTHER",
        items: [
          {
            id: "custom",
            name: "Custom Service",
            defaultPriceNaira: 0,
            color: "#E7B84F",
            logoText: "C",
          },
        ],
      },
    ];
  }, [search]);

  // Shorten names to match the clean look of the image
  const formatName = (name: string) => {
    if (name === "Custom Service") return "Custom";
    return name
      .replace(" Video", "")
      .replace(" / iCloud", "")
      .replace(" Premium", "")
      .replace(" Plus", "");
  };

  const proceedToSetup = () => {
    if (tempSelection) {
      setMerchant(tempSelection);
      setAmount(
        tempSelection.id === "custom"
          ? ""
          : String(tempSelection.defaultPriceNaira),
      );
    }
  };

  const submit = async (isAutoDetect: boolean) => {
    if (!user || !merchant) return;
    if (merchant.id === "custom" && !customName.trim()) {
      setError("Please enter a name for your custom subscription.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await api.addSubscription({
        email: user.email,
        merchantId: merchant.id,
        merchantName:
          merchant.id === "custom" ? customName.trim() : merchant.name,
        amountNaira: isAutoDetect ? 1 : Number(amount),
        billingDay: isAutoDetect ? 1 : Number(billingDay),
        remindersEnabled: reminders,
        autoDetect: isAutoDetect,
      });
      navigate(`/app/subscriptions/${data.id}`, { replace: true });
    } catch {
      setError("Could not add this subscription. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FDF7EC] relative">
      <TopBar
        title={merchant ? "Setup Subscription" : "Add New Subscription"}
        back={!merchant}
      />

      {!merchant && (
        <div className="flex flex-1 flex-col pb-28">
          {/* Search Bar */}
          <div className="px-5 pt-2">
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search for popular services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[14px] bg-white border border-[#EAE7DF] py-[14px] pl-4 pr-10 text-[15px] font-semibold text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-teal shadow-[0_2px_8px_rgba(20,40,45,0.04)]"
              />
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted/60"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
          </div>

          {/* Categories */}
          <div className="flex-1 overflow-y-auto px-5 space-y-7 pb-6">
            {categories.map((cat) => (
              <div key={cat.label}>
                <p className="text-[13px] font-black tracking-widest text-ink mb-3.5">
                  {cat.label}
                </p>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {cat.items.map((m) => {
                    const selected = tempSelection?.id === m.id;
                    return (
                      <button
                        key={m.id + cat.label}
                        onClick={() => setTempSelection(m as Merchant)}
                        className="flex-shrink-0 flex flex-col items-center gap-2 w-[76px] group outline-none"
                      >
                        <div
                          className={`relative w-[72px] h-[72px] rounded-[22px] overflow-hidden flex items-center justify-center transition-all duration-300 ${
                            selected
                              ? "bg-gradient-to-br from-[#E7C97E] to-[#C9A545] shadow-[0_8px_16px_-6px_rgba(201,165,69,0.5)] scale-[1.05]"
                              : "bg-transparent border border-[#EAE7DF] hover:border-[#E7C97E]/40 hover:bg-[#E7C97E]/10"
                          }`}
                        >
                          {m.id === "custom" ? (
                            <span className={`text-3xl ${selected ? "text-white" : "text-ink"}`}>➕</span>
                          ) : (
                            <img
                              src={`/icons/${m.id}.png`}
                              alt={m.name}
                              className="w-full h-full object-contain p-2 drop-shadow-sm"
                            />
                          )}
                        </div>
                        <span
                          className={`text-[12.5px] font-bold leading-tight text-center w-full truncate transition-colors ${selected ? "text-gold-dark" : "text-ink-muted"}`}
                        >
                          {formatName(m.name)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Fixed Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 w-full max-w-[480px] mx-auto pb-8 pt-10 px-5 bg-gradient-to-t from-[#FDF7EC] via-[#FDF7EC] to-transparent pointer-events-none">
            <Button
              fullWidth
              className="!h-[56px] !text-[13px] !font-black tracking-wide !rounded-[20px] !bg-[#F4F1E5] hover:!bg-[#e8e4d3] !text-ink shadow-[0_4px_16px_rgba(20,40,45,0.06)] pointer-events-auto transition-all"
              onClick={proceedToSetup}
              disabled={!tempSelection}
            >
              {tempSelection
                ? "CONTINUE TO SETUP"
                : "SELECT A SERVICE TO BEGIN SETUP"}
            </Button>
          </div>
        </div>
      )}

      {merchant && (
        <div className="px-5">
          <button
            onClick={() => setMerchant(null)}
            className="mb-3 flex items-center gap-2 text-sm font-extrabold text-teal"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1C4042"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Choose a different service
          </button>

          <div className="rounded-[24px] bg-white p-5 shadow-[0_4px_16px_rgba(20,40,45,0.05)] mb-4">
            <div className="flex items-center gap-3">
              {merchant.id === "custom" ? (
                <div className="h-[46px] w-[46px] shrink-0 rounded-2xl bg-[#E7B84F]/20 flex items-center justify-center p-1.5">
                  <span className="text-xl">➕</span>
                </div>
              ) : (
                <img
                  src={`/icons/${merchant.id}.png`}
                  alt=""
                  onError={(e) =>
                    ((e.currentTarget as HTMLElement).style.visibility =
                      "hidden")
                  }
                  className="h-[46px] w-[46px] shrink-0 rounded-2xl bg-ink/5 object-contain p-1.5"
                />
              )}
              <div>
                <div className="text-[17px] font-black text-ink">
                  {merchant.name}
                </div>
                <div className="text-[12.5px] font-bold text-ink-muted">
                  Set up your billing
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
              {/* Custom Name field (only if custom merchant) */}
              {merchant.id === "custom" && (
                <div className="rounded-[24px] bg-white p-5 shadow-[0_4px_16px_rgba(20,40,45,0.05)]">
                  <TextField
                    label="Subscription name"
                    type="text"
                    required
                    placeholder="e.g. Gym Membership"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
              )}

              {/* Auto-Detect Card */}
              <div className="rounded-[24px] border-2 border-[#1C4042] p-5 bg-[#F4F9F9] shadow-[0_4px_16px_rgba(20,40,45,0.05)]">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[16px] font-black text-[#1C4042]">Auto-Detect (Recommended)</h3>
                  <span className="text-xl leading-none">✨</span>
                </div>
                <p className="text-[13.5px] font-medium text-[#1C4042]/80 leading-relaxed mb-5">
                  Skip the form! We'll automatically lock in the exact amount and billing cycle when this service charges your card for the first time.
                </p>
                <Button
                  type="button"
                  fullWidth
                  disabled={submitting || (merchant.id === "custom" && !customName)}
                  onClick={() => submit(true)}
                  className="!h-12 !text-[15px] !bg-[#1C4042]"
                >
                  {submitting ? "Adding…" : "Enable Auto-Detect"}
                </Button>
              </div>

              <div className="flex items-center gap-4 my-1.5 opacity-50">
                <div className="h-px bg-ink/20 flex-1"></div>
                <div className="text-[11px] font-black tracking-widest text-ink">OR</div>
                <div className="h-px bg-ink/20 flex-1"></div>
              </div>

              {/* Manual Setup Card */}
              <div className="rounded-[24px] border border-[#EAE7DF] p-5 bg-white shadow-[0_4px_16px_rgba(20,40,45,0.05)]">
                <h3 className="text-[16px] font-black text-ink mb-4">Manual Setup</h3>
                <div className="flex flex-col gap-3.5">
                  <TextField
                    label="Billing amount (₦)"
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <TextField
                    label="Billing day of month"
                    type="number"
                    min={1}
                    max={28}
                    value={billingDay}
                    onChange={(e) => setBillingDay(e.target.value)}
                  />
                  
                  <button
                    type="button"
                    onClick={() => setReminders((r) => !r)}
                    className="flex items-center justify-between rounded-[14px] bg-cream-bg px-4 py-3.5 mt-1"
                  >
                    <div className="text-left">
                      <div className="text-sm font-extrabold text-ink">Reminders</div>
                      <div className="text-[11.5px] font-bold text-ink-muted">Alert me before this bill charges</div>
                    </div>
                    <span className={`relative h-[27px] w-[46px] shrink-0 rounded-full transition-colors ${reminders ? "bg-gold-mid" : "bg-paused-bg"}`}>
                      <span className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all ${reminders ? "right-[3px]" : "left-[3px]"}`} />
                    </span>
                  </button>

                  {error && <p className="text-sm font-semibold text-salmon-text mt-1">{error}</p>}
                  
                  <Button
                    type="button"
                    fullWidth
                    variant="secondary"
                    disabled={submitting || !amount || !billingDay || (merchant.id === "custom" && !customName)}
                    onClick={() => submit(false)}
                    className="mt-2 !h-12 !text-[15px]"
                  >
                    {submitting ? "Adding…" : `Add Manually`}
                  </Button>
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}
