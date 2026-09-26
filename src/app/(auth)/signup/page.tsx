"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);
  }, []);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (!agreedToTerms) {
      errors.terms = "You must agree to the Terms & Conditions to continue.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSignup(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    if (!validate()) return;

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setAuthError(body.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f2eb] px-6 py-12">
        <Link
          href="/"
          className="flex flex-col items-center gap-2 mb-10 no-underline"
        >
          <div className="flex items-center justify-center gap-2">
            <span
              className="w-3 h-3 rounded-full bg-[#e8500a] flex-shrink-0"
              style={{ animation: "blink 2.4s ease-in-out infinite" }}
            />
            <span
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 900,
                fontSize: "1.7rem",
                letterSpacing: "-0.04em",
                color: "#1a1714",
              }}
            >
              Statsy
            </span>
          </div>
          <span
            className="text-xs font-medium tracking-[0.06em] uppercase text-center"
            style={{ color: "#8a8070" }}
          >
            Status pages for everyone
          </span>
        </Link>
        <div
          className="w-full max-w-md bg-white rounded-[4px] px-8 py-12 text-center"
          style={{
            border: "1.5px solid #1a1714",
            boxShadow: "6px 6px 0 #1a1714",
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto mb-5"
            style={{
              background: "#e8f5ee",
              border: "1px solid rgba(26,122,74,0.3)",
            }}
          >
            ✉️
          </div>
          <h1
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 900,
              fontSize: "1.6rem",
              letterSpacing: "-0.04em",
            }}
          >
            Check your email
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: "#8a8070" }}
          >
            We sent a confirmation link to{" "}
            <strong style={{ color: "#1a1714" }}>{email}</strong>.<br />
            Click it to activate your account.
          </p>
        </div>
        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f2eb] px-6 py-12">
      <Link
        href="/"
        className="flex flex-col items-center gap-2 mb-10 no-underline"
      >
        <div className="flex items-center justify-center gap-2">
          <span
            className="w-3 h-3 rounded-full bg-[#e8500a] flex-shrink-0"
            style={{ animation: "blink 2.4s ease-in-out infinite" }}
          />
          <span
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 900,
              fontSize: "1.7rem",
              letterSpacing: "-0.04em",
              color: "#1a1714",
            }}
          >
            Statsy
          </span>
        </div>
        <span
          className="text-xs font-medium tracking-[0.06em] uppercase text-center"
          style={{ color: "#8a8070" }}
        >
          Status pages for everyone
        </span>
      </Link>

      <div
        className="w-full max-w-md bg-white rounded-[4px]"
        style={{
          border: "1.5px solid #1a1714",
          boxShadow: "6px 6px 0 #1a1714",
        }}
      >
        <div
          className="px-8 pt-10 pb-8"
          style={{ borderBottom: "1.5px solid #e4dfd4" }}
        >
          <div
            className="inline-flex items-center gap-2 mb-4 px-2.5 py-1 rounded-[2px] text-xs font-semibold uppercase tracking-[0.08em]"
            style={{
              background: "rgba(232,80,10,0.08)",
              border: "1px solid rgba(232,80,10,0.2)",
              color: "#e8500a",
            }}
          >
            Free to start
          </div>
          <h1
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 900,
              fontSize: "1.9rem",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            Create your account
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#8a8070" }}>
            No credit card needed. Up in minutes.
          </p>
        </div>

        <form
          onSubmit={handleSignup}
          noValidate
          className="px-8 py-8 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              autoFocus
              placeholder="you@yoursite.com"
              className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4]"
              style={{
                border: `1.5px solid ${fieldErrors.email ? "#e8500a" : "#e4dfd4"}`,
                color: "#1a1714",
                fontFamily: "var(--font-body)",
              }}
              onFocus={(e) => {
                if (!fieldErrors.email) e.target.style.borderColor = "#1a1714";
              }}
              onBlur={(e) => {
                if (!fieldErrors.email) e.target.style.borderColor = "#e4dfd4";
              }}
            />
            {fieldErrors.email && (
              <p className="text-xs" style={{ color: "#e8500a" }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Minimum 6 characters"
                className="w-full rounded-[4px] px-4 py-3 pr-11 text-sm outline-none bg-white placeholder:text-[#c4bfb4]"
                style={{
                  border: `1.5px solid ${fieldErrors.password ? "#e8500a" : "#e4dfd4"}`,
                  color: "#1a1714",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.password)
                    e.target.style.borderColor = "#1a1714";
                }}
                onBlur={(e) => {
                  if (!fieldErrors.password)
                    e.target.style.borderColor = "#e4dfd4";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                style={{ color: "#c4bfb4" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1714")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#c4bfb4")}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs" style={{ color: "#e8500a" }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }}
                placeholder="Repeat your password"
                className="w-full rounded-[4px] px-4 py-3 pr-11 text-sm outline-none bg-white placeholder:text-[#c4bfb4]"
                style={{
                  border: `1.5px solid ${fieldErrors.confirmPassword ? "#e8500a" : "#e4dfd4"}`,
                  color: "#1a1714",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.confirmPassword)
                    e.target.style.borderColor = "#1a1714";
                }}
                onBlur={(e) => {
                  if (!fieldErrors.confirmPassword)
                    e.target.style.borderColor = "#e4dfd4";
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                style={{ color: "#c4bfb4" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1714")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#c4bfb4")}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs" style={{ color: "#e8500a" }}>
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    if (e.target.checked) setFieldErrors((prev) => ({ ...prev, terms: undefined }));
                  }}
                  className="sr-only"
                />
                <div
                  className="w-4 h-4 rounded-[3px] flex items-center justify-center transition-all"
                  style={{
                    border: `1.5px solid ${fieldErrors.terms ? "#e8500a" : agreedToTerms ? "#1a1714" : "#e4dfd4"}`,
                    background: agreedToTerms ? "#1a1714" : "white",
                  }}
                >
                  {agreedToTerms && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm leading-snug" style={{ color: "#3d3830" }}>
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline underline-offset-2"
                  style={{ color: "#e8500a" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms &amp; Conditions and Privacy Policy
                </a>
              </span>
            </label>
            {fieldErrors.terms && (
              <p className="text-xs" style={{ color: "#e8500a" }}>
                {fieldErrors.terms}
              </p>
            )}
          </div>

          {authError && (
            <p
              className="text-sm px-4 py-2.5 rounded-[4px]"
              style={{
                color: "#e8500a",
                background: "rgba(232,80,10,0.06)",
                border: "1.5px solid rgba(232,80,10,0.2)",
              }}
            >
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-[4px] py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{
              background: "#1a1714",
              color: "#f5f2eb",
              border: "1.5px solid #1a1714",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#e8500a";
                e.currentTarget.style.borderColor = "#e8500a";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1a1714";
              e.currentTarget.style.borderColor = "#1a1714";
            }}
          >
            {loading ? "Creating account…" : "Create account →"}
          </button>

          <OAuthButtons />
        </form>

        <div
          className="px-8 py-7 text-center"
          style={{ borderTop: "1.5px solid #e4dfd4" }}
        >
          <p className="text-sm" style={{ color: "#8a8070" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold"
              style={{ color: "#1a1714" }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
