"use client";

import { ClientOnlySpiral } from "@/components/ClientOnlySpiral";
import { useEffect, useRef, useState } from "react";

export default function AuthPage() {
  const PIN_LENGTH = 6;
  const [digits, setDigits] = useState(Array(PIN_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputsRef = useRef([]);

  // Prevent any redirects by stopping event propagation
  useEffect(() => {
    const preventRedirect = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Override location changes
    const originalReplace = window.location.replace;
    const originalAssign = window.location.assign;

    window.location.replace = () => {};
    window.location.assign = () => {};

    return () => {
      window.location.replace = originalReplace;
      window.location.assign = originalAssign;
    };
  }, []);

  useEffect(() => {
    const first = inputsRef.current?.[0];
    if (first && typeof first.focus === "function") first.focus();
  }, []);

  const handleChange = (idx, value) => {
    const v = (value || "").replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < PIN_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === "ArrowRight" && idx < PIN_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (idx, e) => {
    const pasted = (e.clipboardData?.getData("text") || "").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = [...digits];
    for (let i = 0; i < pasted.length && idx + i < PIN_LENGTH; i++) {
      next[idx + i] = pasted[i];
    }
    setDigits(next);
    const jumpTo = Math.min(idx + pasted.length, PIN_LENGTH - 1);
    inputsRef.current[jumpTo]?.focus();
  };

  const isComplete = digits.every((d) => d !== "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isComplete || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 800);
  };

  return (
    <main className="fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-black text-white">
      <ClientOnlySpiral />
      <div className="relative z-10 h-full w-full flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 select-none">
              <div className="h-9 w-9 rounded-xl bg-emerald-600/90 shadow-sm" />
              <span className="text-2xl font-semibold tracking-tight text-white">
                SizeWise
              </span>
            </div>
            <h1 className="mt-6 text-xl font-semibold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-white/70">Enter your PIN to continue</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl shadow-sm ring-1 ring-white/20 p-5 backdrop-blur-md bg-white/10">
            <label className="block text-sm font-medium text-white/90 mb-3">
              PIN
            </label>

            <div className="flex items-center justify-between gap-2 mb-5">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digits[i]}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={(e) => handlePaste(i, e)}
                  className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl tracking-widest rounded-xl border border-white/30 bg-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 backdrop-blur-sm text-white placeholder-transparent"
                  aria-label={`PIN digit ${i + 1}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={!isComplete || isSubmitting}
              className="w-full h-11 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition backdrop-blur-md bg-white/20 border border-white/30 hover:bg-white/30 shadow-[0_4px_20px_rgba(255,255,255,0.1)]">
              {isSubmitting ? "Verifying…" : "Login"}
            </button>

            <div className="mt-3 text-center">
              <button
                type="button"
                className="text-sm text-white/70 hover:text-white underline underline-offset-4">
                Forgot PIN?
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-white/50">
            © 2025 SizeWise. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}

