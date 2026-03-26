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
        setMessage({
          type: "success",
          text: "You're subscribed! We'll notify you of any incidents.",
        });
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
      style={{
        borderTop: "1.5px solid #1a1714",
        marginTop: "40px",
        paddingTop: "32px",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-head, sans-serif)",
          fontSize: "1rem",
          fontWeight: 700,
          margin: "0 0 4px",
          color: "#1a1714",
        }}
      >
        Get incident notifications
      </h2>
      <p style={{ fontSize: "0.85rem", color: "#8a8070", margin: "0 0 16px" }}>
        Subscribe to receive email updates when incidents are posted or
        resolved.
      </p>

      {message?.type === "success" ? (
        <div
          style={{
            background: "#f0faf5",
            border: "1.5px solid #1a7a4a",
            borderRadius: "4px",
            padding: "12px 16px",
            fontSize: "0.85rem",
            color: "#1a7a4a",
          }}
        >
          ✓ {message.text}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
        >
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{
              flex: "1",
              minWidth: "200px",
              padding: "8px 12px",
              border: "1.5px solid #1a1714",
              borderRadius: "4px",
              fontSize: "0.875rem",
              background: "white",
              color: "#1a1714",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 18px",
              background: loading ? "#8a8070" : "#1a1714",
              color: "#f5f2eb",
              border: "1.5px solid #1a1714",
              borderRadius: "4px",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Subscribing…" : "Notify me"}
          </button>
        </form>
      )}

      {message?.type === "error" && (
        <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "#d32f2f" }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
