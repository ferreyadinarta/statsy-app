"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f2eb] px-6">
      <div className="bg-white border border-[#1a1714] rounded p-12 w-full max-w-md">
        <div className="font-black text-lg tracking-tight text-[#e8500a] mb-8">
          ● Statsy
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1714] mb-2">
          Welcome back
        </h1>
        <p className="text-[#8a8070] text-sm mb-8">
          Log in to your Statsy account.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#3d3830]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yoursite.com"
              required
              className="border border-[#e4dfd4] rounded px-3.5 py-3 text-sm text-[#1a1714] outline-none focus:border-[#1a1714] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#3d3830]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              className="border border-[#e4dfd4] rounded px-3.5 py-3 text-sm text-[#1a1714] outline-none focus:border-[#1a1714] transition-colors"
            />
          </div>

          {error && <p className="text-[#e8500a] text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#1a1714] text-[#f5f2eb] rounded py-3 text-sm font-medium cursor-pointer hover:bg-[#e8500a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in…" : "Log in →"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#8a8070]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[#1a1714] font-semibold hover:text-[#e8500a] transition-colors"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
