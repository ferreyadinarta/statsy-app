"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Zap, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/use-toast";

declare global {
  interface Window {
    Paddle?: {
      Initialize: (opts: { token: string }) => void;
      Environment: { set: (env: string) => void };
      Checkout: {
        open: (opts: Record<string, unknown>) => void;
      };
    };
  }
}

type Subscription = {
  plan: "free" | "pro";
  status: string;
  paddle_subscription_id: string | null;
  current_period_end: string | null;
} | null;

type Props = {
  userId: string;
  userEmail: string;
  subscription: Subscription;
};

const PRO_FEATURES = [
  { text: "3 status pages", note: "vs 1 on Free" },
  { text: "10 services per page", note: "vs 3 on Free" },
  { text: "500 subscribers per page", note: "vs 30 on Free" },
  { text: "90-day incident history", note: "vs 7 days on Free" },
  { text: "Custom domain support", note: null },
  { text: "Embeddable status badge", note: null },
  { text: "Remove Statsy branding", note: null },
];

export default function BillingClient({
  userId,
  userEmail,
  subscription,
}: Props) {
  const plan =
    subscription?.status === "active" || subscription?.status === "trialing"
      ? (subscription.plan ?? "free")
      : "free";
  const isPro = plan === "pro";
  const isCancelling = subscription?.status === "cancelled";

  const [paddleReady, setPaddleReady] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { success, error: showError } = useToast();
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      if (window.Paddle) {
        if (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox") {
          window.Paddle.Environment.set("sandbox");
        }
        window.Paddle.Initialize({
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        });
        setPaddleReady(true);
      }
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  function handleUpgrade() {
    if (!window.Paddle) return;
    window.Paddle.Checkout.open({
      items: [
        { priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID, quantity: 1 },
      ],
      customer: { email: userEmail },
      customData: { user_id: userId },
    });
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch("/api/paddle/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error ?? "Failed to cancel. Please try again.");
        return;
      }
      success(
        "Subscription cancelled. You'll stay on Pro until the end of your billing period.",
      );
      setShowCancelConfirm(false);
      router.refresh();
    } catch {
      showError("Something went wrong. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // ── PRO VIEW ──────────────────────────────────────────────────────────────
  if (isPro) {
    return (
      <>
        <div
          className="rounded-[4px] p-8"
          style={{ background: "white", border: "1.5px solid #1a7a4a" }}
        >
          <div className="flex items-start justify-between mb-8">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "#8a8070" }}
              >
                Current plan
              </p>
              <div className="flex items-center gap-3 mb-1">
                <h2
                  style={{
                    fontFamily: "var(--font-head)",
                    fontWeight: 900,
                    fontSize: "2.4rem",
                    letterSpacing: "-0.04em",
                    color: "#1a1714",
                  }}
                >
                  Pro
                </h2>
                {!isCancelling && (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-[2px]"
                    style={{
                      background: "#e8f5ee",
                      color: "#1a7a4a",
                      border: "1.5px solid #1a7a4a",
                    }}
                  >
                    Active
                  </span>
                )}
                {isCancelling && (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-[2px]"
                    style={{
                      background: "rgba(232,80,10,0.08)",
                      color: "#e8500a",
                      border: "1.5px solid #e8500a",
                    }}
                  >
                    Cancels{" "}
                    {formatDate(subscription?.current_period_end ?? null)}
                  </span>
                )}
              </div>
              {!isCancelling && subscription?.current_period_end && (
                <p className="text-sm" style={{ color: "#8a8070" }}>
                  Renews {formatDate(subscription.current_period_end)}
                </p>
              )}
              {isCancelling && (
                <p className="text-sm" style={{ color: "#8a8070" }}>
                  Access continues until{" "}
                  {formatDate(subscription?.current_period_end ?? null)}
                </p>
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 900,
                fontSize: "2rem",
                color: "#1a7a4a",
              }}
            >
              $15/mo
            </div>
          </div>

          {/* What's included */}
          <div
            className="rounded-[4px] p-6 mb-6"
            style={{ background: "#f5f2eb", border: "1.5px solid #e4dfd4" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: "#8a8070" }}
            >
              Your plan includes
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
              {PRO_FEATURES.map(({ text }) => (
                <div key={text} className="flex items-center gap-2">
                  <CheckCircle
                    size={14}
                    style={{ color: "#1a7a4a", flexShrink: 0 }}
                  />
                  <span className="text-sm" style={{ color: "#3d3830" }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!isCancelling && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-xs font-medium transition-colors cursor-pointer text-[#8a8070] hover:text-[#d32f2f]"
                style={{ color: "#8a8070" }}
              >
                Cancel subscription
              </button>
            </div>
          )}
        </div>

        {/* Cancel confirm modal */}
        {showCancelConfirm && (
          <CancelModal
            cancelling={cancelling}
            onKeep={() => setShowCancelConfirm(false)}
            onCancel={handleCancel}
          />
        )}
      </>
    );
  }

  // ── FREE VIEW ─────────────────────────────────────────────────────────────
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left — current plan (2/5 width) */}
        <div
          className="lg:col-span-2 rounded-[4px] p-6"
          style={{ background: "white", border: "1.5px solid #e4dfd4" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: "#8a8070" }}
          >
            Current plan
          </p>
          <div className="flex items-baseline justify-between mb-6">
            <h2
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 900,
                fontSize: "2.4rem",
                letterSpacing: "-0.04em",
                color: "#1a1714",
              }}
            >
              Free
            </h2>
            <span
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 900,
                fontSize: "1.4rem",
                color: "#8a8070",
              }}
            >
              $0/mo
            </span>
          </div>

          {/* Limits */}
          <div
            className="flex flex-col gap-0"
            style={{ borderTop: "1px solid #f0ece4" }}
          >
            {[
              ["Status pages", "1"],
              ["Services per page", "3"],
              ["Subscribers", "30"],
              ["Incident history", "7 days"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: "1px solid #f0ece4" }}
              >
                <span className="text-sm" style={{ color: "#8a8070" }}>
                  {label}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "#1a1714" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — upgrade card (3/5 width) */}
        <div
          className="lg:col-span-3 rounded-[4px] overflow-hidden"
          style={{
            border: "1.5px solid #1a1714",
            boxShadow: "4px 4px 0 #1a1714",
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{ background: "#1a1714" }}
          >
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-0.5"
                style={{ color: "#8a8070" }}
              >
                Upgrade to
              </p>
              <p
                style={{
                  fontFamily: "var(--font-head)",
                  fontWeight: 900,
                  fontSize: "1.4rem",
                  letterSpacing: "-0.03em",
                  color: "#f5f2eb",
                }}
              >
                Statsy Pro
              </p>
            </div>
            <div className="text-right">
              <p
                style={{
                  fontFamily: "var(--font-head)",
                  fontWeight: 900,
                  fontSize: "1.8rem",
                  letterSpacing: "-0.03em",
                  color: "#f5f2eb",
                }}
              >
                $15
              </p>
              <p className="text-xs" style={{ color: "#8a8070" }}>
                per month
              </p>
            </div>
          </div>

          {/* Features list */}
          <div className="px-6 pt-3 pb-2" style={{ background: "white" }}>
            {PRO_FEATURES.map(({ text, note }) => (
              <div
                key={text}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: "1px solid #f0ece4" }}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle
                    size={14}
                    style={{ color: "#1a7a4a", flexShrink: 0 }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#1a1714" }}
                  >
                    {text}
                  </span>
                </div>
                {note && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-[2px]"
                    style={{ background: "#f5f2eb", color: "#8a8070" }}
                  >
                    {note}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 py-5" style={{ background: "white" }}>
            <button
              onClick={handleUpgrade}
              disabled={!paddleReady}
              className="w-full flex items-center justify-center gap-2 rounded-[4px] px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "#e8500a",
                color: "white",
                border: "1.5px solid #e8500a",
                boxShadow: "3px 3px 0 #1a1714",
              }}
            >
              <Zap size={15} strokeWidth={2.5} />
              Upgrade to Pro — $15/mo
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
            <p
              className="text-xs text-center mt-3"
              style={{ color: "#8a8070" }}
            >
              Cancel anytime. No contracts.
            </p>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <CancelModal
          cancelling={cancelling}
          onKeep={() => setShowCancelConfirm(false)}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

// ── Shared cancel modal ────────────────────────────────────────────────────
function CancelModal({
  cancelling,
  onKeep,
  onCancel,
}: {
  cancelling: boolean;
  onKeep: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,23,20,0.5)" }}
    >
      <div
        className="w-full max-w-sm rounded-[4px] p-8"
        style={{ background: "#f5f2eb", border: "1.5px solid #1a1714" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={20} style={{ color: "#d32f2f" }} />
          <h3
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 900,
              fontSize: "1.1rem",
              color: "#1a1714",
            }}
          >
            Cancel subscription?
          </h3>
        </div>
        <p
          className="text-sm mb-6 leading-relaxed"
          style={{ color: "#3d3830" }}
        >
          You'll stay on Pro until the end of your billing period. After that,
          you'll be moved to the Free plan and some features will be restricted.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onKeep}
            disabled={cancelling}
            className="flex-1 rounded-[4px] px-4 py-2.5 text-sm font-semibold cursor-pointer"
            style={{
              border: "1.5px solid #e4dfd4",
              color: "#3d3830",
              background: "white",
            }}
          >
            Keep Pro
          </button>
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="flex-1 rounded-[4px] px-4 py-2.5 text-sm font-semibold cursor-pointer"
            style={{
              background: cancelling ? "#e4dfd4" : "#d32f2f",
              color: cancelling ? "#8a8070" : "white",
              border: `1.5px solid ${cancelling ? "#e4dfd4" : "#d32f2f"}`,
            }}
          >
            {cancelling ? "Cancelling..." : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
