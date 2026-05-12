"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

type FieldErrors = {
  password?: string;
  confirmPassword?: string;
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/forgot-password");
    });
  }, []);

  function validate(): boolean {
    const errors: FieldErrors = {};
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
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    if (!validate()) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f2eb] px-6">
      <Logo />
      <div
        className="w-full max-w-md bg-white rounded-[4px]"
        style={{
          border: "1.5px solid #1a1714",
          boxShadow: "6px 6px 0 #1a1714",
        }}
      >
        <div
          className="px-8 pt-8 pb-6"
          style={{ borderBottom: "1.5px solid #e4dfd4" }}
        >
          <h1
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 900,
              fontSize: "1.9rem",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            Choose new password
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#8a8070" }}>
            Pick something strong you&apos;ll remember.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                autoFocus
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
                  if (!fieldErrors.password) e.target.style.borderColor = "#1a1714";
                }}
                onBlur={(e) => {
                  if (!fieldErrors.password) e.target.style.borderColor = "#e4dfd4";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                placeholder="Repeat your password"
                className="w-full rounded-[4px] px-4 py-3 pr-11 text-sm outline-none bg-white placeholder:text-[#c4bfb4]"
                style={{
                  border: `1.5px solid ${fieldErrors.confirmPassword ? "#e8500a" : "#e4dfd4"}`,
                  color: "#1a1714",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.confirmPassword) e.target.style.borderColor = "#1a1714";
                }}
                onBlur={(e) => {
                  if (!fieldErrors.confirmPassword) e.target.style.borderColor = "#e4dfd4";
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
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
            {loading ? "Saving…" : "Set new password →"}
          </button>
        </form>
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex flex-col items-center gap-2 mb-10 no-underline">
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
  );
}
