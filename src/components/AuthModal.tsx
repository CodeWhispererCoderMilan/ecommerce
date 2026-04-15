"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  onClose: () => void;
}

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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AuthModal({ onClose }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [view, setView] = useState<"form" | "forgot">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function switchTab(t: "login" | "register") {
    setTab(t);
    setView("form");
    setError(null);
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
  }

  function openForgot() {
    setView("forgot");
    setError(null);
    setMessage(null);
    setPassword("");
  }

  function backToLogin() {
    setView("form");
    setTab("login");
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (tab === "register") {
      if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
      const validationError = validatePassword(password);
      if (validationError) { setError(validationError); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setError(error.message);
      else setMessage("We've sent a verification link to your email. Click it to activate your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else if (!rememberMe) {
        window.addEventListener("beforeunload", () => {
          Object.keys(localStorage)
            .filter((k) => k.startsWith("sb-"))
            .forEach((k) => localStorage.removeItem(k));
        });
      }
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setMessage("Recovery email sent. Check your inbox.");
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* ── FORGOT PASSWORD VIEW ── */}
        {view === "forgot" ? (
          <>
            <button onClick={backToLogin} className="mb-5 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to login
            </button>
            <h2 className="text-base font-semibold mb-1">Reset your password</h2>
            <p className="text-xs text-zinc-500 mb-5">Enter your email and we'll send you a recovery link.</p>
            <form onSubmit={handleForgot} className="space-y-3">
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-black placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition-colors"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
              >
                Send recovery email
              </button>
            </form>
            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
            {message && <p className="mt-3 text-xs text-green-600">{message}</p>}
          </>
        ) : (
          <>
            {/* ── TABS ── */}
            <div className="flex border-b mb-6">
              <button
                onClick={() => switchTab("login")}
                className={`pb-3 px-1 mr-6 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === "login" ? "border-black text-black" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => switchTab("register")}
                className={`pb-3 px-1 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === "register" ? "border-black text-black" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Register
              </button>
            </div>

            {/* ── FORM ── */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-black placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition-colors"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 pr-10 text-sm text-black placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800">
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {/* Password strength — register only */}
              {tab === "register" && (() => {
                const strength = getStrength(password);
                return strength ? (
                  <div className="space-y-1">
                    <div className="h-1 w-full rounded-full bg-zinc-100">
                      <div className={`h-1 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className={`text-xs font-medium ${
                      strength.label === "Strong" ? "text-green-600" :
                      strength.label === "Mediocre" ? "text-yellow-500" : "text-red-500"
                    }`}>{strength.label}</p>
                  </div>
                ) : null;
              })()}

              {/* Confirm password — register only */}
              {tab === "register" && (
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Retype password"
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
              )}

              {/* Remember me + forgot — login only */}
              {tab === "login" && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-300 accent-black cursor-pointer"
                    />
                    <span className="text-xs text-zinc-600">Remember me</span>
                  </label>
                  <button type="button" onClick={openForgot} className="text-xs text-zinc-500 hover:text-black transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={tab === "register" && password !== confirmPassword}
                className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {tab === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
            {message && <p className="mt-3 text-xs text-green-600">{message}</p>}

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-300" />
              </div>
              <div className="relative flex justify-center text-xs text-zinc-400">
                <span className="bg-white px-2">or</span>
              </div>
            </div>

            <button
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition-colors"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          </>
        )}
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

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
