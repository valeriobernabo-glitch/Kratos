"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? "Registration failed");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-cta shadow-lg shadow-primary/30">
            <span className="text-3xl font-bold text-white font-[family-name:var(--font-headline)]">
              K
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Get started with Kratos WMS
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-8 crystalline-edge">
          {error && (
            <div className="mb-4 rounded-xl bg-error-container/20 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              placeholder="Your name"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl gradient-cta py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="mt-4 text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-primary hover:text-primary-dim">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
