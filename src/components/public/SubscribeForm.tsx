"use client";

import { useState } from "react";

interface SubscribeFormProps {
  statusPageId: string;
}

export default function SubscribeForm({ statusPageId }: SubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter your email address." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          status_page_id: statusPageId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error ?? "Something went wrong.",
        });
      } else {
        setMessage({ type: "success", text: "Subscribed!" });
        setEmail("");
      }
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center justify-between gap-4 px-6 py-3 rounded-[4px] mt-2"
      style={{
        background: "#faf9f6",
        border: "1.5px solid #e4dfd4",
        borderTop: "none",
        borderRadius: "0 0 4px 4px",
        marginTop: "-2px", // pulls flush against last service row
      }}
    >
      {/* Left — label */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: "#e8500a" }}
        />
        <span className="text-sm font-semibold" style={{ color: "#1a1714" }}>
          Get notified of incidents
        </span>
      </div>

      {/* Right — form or success */}
      {message?.type === "success" ? (
        <span className="text-sm font-medium" style={{ color: "#1a7a4a" }}>
          ✓ You're subscribed
        </span>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 flex-1 justify-end"
        >
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{
              width: "220px",
              padding: "7px 12px",
              border: `1.5px solid ${message?.type === "error" ? "#d32f2f" : "#e4dfd4"}`,
              borderRadius: "4px",
              fontSize: "0.8rem",
              background: "#faf9f6",
              color: "#1a1714",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "7px 14px",
              background: loading ? "#8a8070" : "#1a1714",
              color: "#f5f2eb",
              border: "1.5px solid #1a1714",
              borderRadius: "4px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#e8500a";
                e.currentTarget.style.borderColor = "#e8500a";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#1a1714";
                e.currentTarget.style.borderColor = "#1a1714";
              }
            }}
          >
            {loading ? "..." : "Notify me"}
          </button>
        </form>
      )}

      {message?.type === "error" && (
        <span className="text-xs flex-shrink-0" style={{ color: "#d32f2f" }}>
          {message.text}
        </span>
      )}
    </div>
  );
}
