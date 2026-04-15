"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getStrength(password: string): { label: string; color: string; width: string } | null {
  if (!password) return null;
  const hasLength = password.length >= 8;
  const hasCapital = /[A-Z]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  if (hasLength && hasCapital && hasSymbol) return { label: "Strong", color: "bg-green-500", width: "w-full" };
  if (hasLength && (hasCapital || hasSymbol)) return { label: "Mediocre", color: "bg-yellow-400", width: "w-2/3" };
  return { label: "Weak", color: "bg-red-500", width: "w-1/3" };
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(password))
    return "Password must contain at least one capital letter and a special symbol.";
  return null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validatePassword(password);
    if (validationError) { setError(validationError); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setMessage("Password updated. Redirecting...");
      setTimeout(() => router.replace("/"), 1500);
    }
  }

  const strength = getStrength(password);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-400">Waiting for recovery link...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold">Set a new password</h1>
        <p className="mb-6 text-xs text-zinc-500">Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 pr-10 text-sm text-black placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition-colors"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800">
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          {strength && (
            <div className="space-y-1">
              <div className="h-1 w-full rounded-full bg-zinc-100">
                <div className={`h-1 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
              </div>
              <p className={`text-xs font-medium ${
                strength.label === "Strong" ? "text-green-600" :
                strength.label === "Mediocre" ? "text-yellow-500" : "text-red-500"
              }`}>{strength.label}</p>
            </div>
          )}

          <div className="space-y-1">
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 pr-10 text-sm text-black placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition-colors"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800">
                {showConfirm ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={password !== confirmPassword}
            className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Update password
          </button>
        </form>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
        {message && <p className="mt-3 text-xs text-green-600">{message}</p>}
      </div>
    </div>
  );
}

function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
