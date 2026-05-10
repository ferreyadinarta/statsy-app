"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    function validate(): boolean {
        if (!email.trim()) {
            setEmailError("Email is required.");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("Enter a valid email address.");
            return false;
        }
        setEmailError(null);
        return true;
    }

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        setLoading(false);
        setSent(true);
    }

    if (sent) {
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
                    <div className="px-8 py-12 text-center">
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
                            If{" "}
                            <strong style={{ color: "#1a1714" }}>
                                {email}
                            </strong>{" "}
                            is linked to an account, a reset link is on its way.
                        </p>
                    </div>
                    <div
                        className="px-8 py-5 text-center"
                        style={{ borderTop: "1.5px solid #e4dfd4" }}
                    >
                        <p className="text-sm text-[#8a8070]">
                            Remember it?{" "}
                            <Link
                                href="/login"
                                className="font-semibold text-[#1a1714] hover:text-[#e8500a]"
                            >
                                Back to login
                            </Link>
                        </p>
                    </div>
                </div>
                <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
            </div>
        );
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
                        Reset password
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: "#8a8070" }}>
                        Enter your email and we&apos;ll send a reset link.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="px-8 py-6 flex flex-col gap-5"
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
                            autoFocus
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailError(null);
                            }}
                            placeholder="you@yoursite.com"
                            className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4]"
                            style={{
                                border: `1.5px solid ${emailError ? "#e8500a" : "#e4dfd4"}`,
                                color: "#1a1714",
                                fontFamily: "var(--font-body)",
                            }}
                            onFocus={(e) => {
                                if (!emailError)
                                    e.target.style.borderColor = "#1a1714";
                            }}
                            onBlur={(e) => {
                                if (!emailError)
                                    e.target.style.borderColor = "#e4dfd4";
                            }}
                        />
                        {emailError && (
                            <p className="text-xs" style={{ color: "#e8500a" }}>
                                {emailError}
                            </p>
                        )}
                    </div>

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
                        {loading ? "Sending…" : "Send reset link →"}
                    </button>
                </form>

                <div
                    className="px-8 py-5 text-center"
                    style={{ borderTop: "1.5px solid #e4dfd4" }}
                >
                    <p className="text-sm" style={{ color: "#8a8070" }}>
                        Remember it?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-[#1a1714] hover:text-[#e8500a]"
                        >
                            Back to login
                        </Link>
                    </p>
                </div>
            </div>
            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
        </div>
    );
}

function Logo() {
    return (
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
    );
}
