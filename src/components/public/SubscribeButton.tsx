"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Bell } from "lucide-react";

interface Props {
  statusPageId: string;
}

export default function SubscribeButton({ statusPageId }: Props) {
  const [showModal, setShowModal] = useState(false);
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setLoading(true);

    try {
      const host = window.location.hostname;
      const parts = host.split(".");
      const apiBase = parts.length > 2
        ? `${window.location.protocol}//${parts.slice(1).join(".")}`
        : window.location.origin;
      const res = await fetch(`${apiBase}/api/subscribe`, {
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
          text: "You're subscribed! We'll email you when incidents are posted.",
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

  function handleClose() {
    if (loading) return;
    setShowModal(false);
    setMessage(null);
    setEmail("");
  }

  return (
    <>
      {/* Subscribe button */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all cursor-pointer"
        style={{
          background: "white",
          border: "1.5px solid #1a1714",
          color: "#1a1714",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#1a1714";
          e.currentTarget.style.color = "#f5f2eb";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "white";
          e.currentTarget.style.color = "#1a1714";
        }}
      >
        <Bell size={12} />
        Subscribe
      </button>

      {/* Modal via portal — renders at document.body, outside header */}
      {showModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: "rgba(26,23,20,0.5)" }}
            onClick={handleClose}
          >
            <div
              className="w-full max-w-sm bg-white rounded-[4px]"
              style={{
                border: "1.5px solid #1a1714",
                boxShadow: "6px 6px 0 #1a1714",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div
                className="flex items-start justify-between px-6 pt-6 pb-5"
                style={{ borderBottom: "1.5px solid #e4dfd4" }}
              >
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-head)",
                      fontWeight: 900,
                      fontSize: "1.2rem",
                      letterSpacing: "-0.03em",
                      color: "#1a1714",
                      margin: 0,
                    }}
                  >
                    Get incident notifications
                  </h2>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#8a8070",
                      margin: "4px 0 0",
                    }}
                  >
                    We'll email you when incidents are posted or updated.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-[4px] cursor-pointer transition-colors flex-shrink-0 ml-4"
                  style={{ color: "#8a8070" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#1a1714")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#8a8070")
                  }
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5">
                {message?.type === "success" ? (
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-[4px]"
                    style={{
                      background: "#e8f5ee",
                      border: "1.5px solid #1a7a4a",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#1a7a4a",
                        fontWeight: 500,
                      }}
                    >
                      ✓ {message.text}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setMessage(null);
                      }}
                      disabled={loading}
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: `1.5px solid ${
                          message?.type === "error" ? "#d32f2f" : "#e4dfd4"
                        }`,
                        borderRadius: "4px",
                        fontSize: "0.875rem",
                        background: "white",
                        color: "#1a1714",
                        outline: "none",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                      }}
                    />
                    {message?.type === "error" && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.75rem",
                          color: "#d32f2f",
                        }}
                      >
                        {message.text}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: loading ? "#8a8070" : "#1a1714",
                        color: "#f5f2eb",
                        border: `1.5px solid ${
                          loading ? "#8a8070" : "#1a1714"
                        }`,
                        borderRadius: "4px",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
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
                      {loading ? "Subscribing..." : "Notify me"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
