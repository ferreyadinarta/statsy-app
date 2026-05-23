"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

type FieldErrors = {
  email?: string;
  password?: string;
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    if (!validate()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setAuthError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f5f2eb] px-6">
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
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#8a8070" }}>
            Log in to your Statsy account.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          noValidate
          className="px-8 py-6 flex flex-col gap-5"
        >
          {callbackError === "auth_callback_failed" && (
            <p
              className="text-sm px-4 py-2.5 rounded-[4px]"
              style={{
                color: "#e8500a",
                background: "rgba(232,80,10,0.06)",
                border: "1.5px solid rgba(232,80,10,0.2)",
              }}
            >
              Email confirmation failed. The link may have expired, request a new one.
            </p>
          )}
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
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-semibold uppercase tracking-[0.08em]"
                style={{ color: "#3d3830" }}
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                tabIndex={-1}
                className="text-xs font-medium"
                style={{ color: "#8a8070" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1714")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8a8070")}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Your password"
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

          {/* <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              className="relative w-4 h-4 rounded-[2px] flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                border: "1.5px solid " + (rememberMe ? "#1a1714" : "#c4bfb4"),
                background: rememberMe ? "#1a1714" : "white",
              }}
              onClick={() => setRememberMe(!rememberMe)}
            >
              {rememberMe && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path
                    d="M1 3.5L3.5 6L8 1"
                    stroke="#f5f2eb"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              className="text-sm"
              style={{ color: "#3d3830" }}
              onClick={() => setRememberMe(!rememberMe)}
            >
              Remember me
            </span>
          </label> */}

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
            {loading ? "Logging in…" : "Log in →"}
          </button>

          <OAuthButtons />
        </form>

        <div
          className="px-8 py-5 text-center"
          style={{ borderTop: "1.5px solid #e4dfd4" }}
        >
          <p className="text-sm" style={{ color: "#8a8070" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold"
              style={{ color: "#1a1714" }}
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
