'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import UpcomingEvents from '@/components/UpcomingEvents';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isSignUp = mode === 'sign-up';
  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password';
  const submitLabel = useMemo(
    () =>
      isSubmitting
        ? '處理中...'
        : isSignUp
          ? '建立帳號'
          : isForgotPassword
            ? '寄送重設密碼連結'
            : isResetPassword
              ? '更新密碼'
              : '登入',
    [isForgotPassword, isResetPassword, isSignUp, isSubmitting]
  );

  const resetFeedback = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetFeedback();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncRecoveryMode = () => {
      const hash = window.location.hash;
      const isRecoveryLink = hash.includes('type=recovery');

      if (isRecoveryLink) {
        setMode('reset-password');
        resetFeedback();
      }
    };

    syncRecoveryMode();
    window.addEventListener('hashchange', syncRecoveryMode);

    return () => window.removeEventListener('hashchange', syncRecoveryMode);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();

    if (isForgotPassword) {
      if (!email.trim()) {
        setErrorMessage('請輸入 Email。');
        return;
      }
    } else if (!isResetPassword && (!email.trim() || !password.trim())) {
      setErrorMessage('請輸入 Email 和密碼。');
      return;
    }

    if (isResetPassword && !password.trim()) {
      setErrorMessage('請輸入新密碼。');
      return;
    }

    if (isSignUp || isResetPassword) {
      if (password.length < 6) {
        setErrorMessage('密碼至少需要 6 個字元。');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('兩次輸入的密碼不一致。');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isForgotPassword) {
        const redirectTo =
          typeof window === 'undefined' ? undefined : `${window.location.origin}`;

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });

        if (error) throw error;

        setSuccessMessage('重設密碼連結已寄出，請到你的 Email 收信。');
        return;
      }

      if (isResetPassword) {
        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) throw error;

        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        setSuccessMessage('密碼已更新，正在返回你的看板...');
        setConfirmPassword('');
        return;
      }

      if (isSignUp) {
        const emailRedirectTo =
          typeof window === 'undefined' ? undefined : `${window.location.origin}`;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo,
          },
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMessage('註冊成功，正在進入你的看板...');
          return;
        }

        setSuccessMessage('註冊成功，請到你的 Email 完成驗證後再登入。');
        setMode('sign-in');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      setSuccessMessage('登入成功，正在進入你的看板...');
    } catch (error) {
      const message = error instanceof Error ? error.message : '登入失敗，請稍後再試。';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#4f46e5_0%,#1e1b4b_42%,#09090f_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_28%,transparent_72%,rgba(255,255,255,0.08))]" />
      <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-white/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-md">
            <GraduationCap className="h-4 w-4" />
            KiDays 童步
          </div>
          <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:text-4xl">
            開始您的申請之旅
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/70 sm:text-base">
            把每間學校的申請進度、重要日期與面試安排收進同一個看板，一步步從容準備。
          </p>
        </motion.div>

        <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="flex w-full flex-col rounded-[2rem] bg-white p-5 shadow-2xl lg:p-6"
          >
              <div className="flex rounded-2xl bg-slate-100 p-1">
                <button
                  onClick={() => handleModeChange('sign-in')}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    !isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  登入
                </button>
                <button
                  onClick={() => handleModeChange('sign-up')}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  註冊
                </button>
              </div>

              <div className="mt-3">
                <h2 className="text-2xl font-black text-slate-900">
                  {isSignUp
                    ? '建立你的 KiDays 帳號'
                    : isForgotPassword
                      ? '重設你的密碼'
                      : isResetPassword
                        ? '設定新密碼'
                        : '歡迎回來'}
                </h2>
              </div>

              <form className="mt-3 flex flex-1 flex-col justify-evenly gap-3" onSubmit={handleSubmit}>
                <label className={`block ${isResetPassword ? 'hidden' : ''}`}>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-indigo-500 focus-within:bg-white">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      disabled={isResetPassword}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="ml-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                {/* 密碼列：登入時單欄全寬；註冊/重設時與「再輸入一次」並排各半寬，高度保持不變 */}
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`block ${isForgotPassword ? 'hidden' : ''} ${
                      isSignUp || isResetPassword ? '' : 'col-span-2'
                    }`}
                  >
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-indigo-500 focus-within:bg-white">
                      <LockKeyhole className="h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        autoComplete={isSignUp || isResetPassword ? 'new-password' : 'current-password'}
                        value={password}
                        disabled={isForgotPassword}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={
                          isSignUp || isResetPassword ? '至少 6 個字元' : '輸入你的密碼'
                        }
                        className="ml-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>

                  <label className={`block ${isSignUp || isResetPassword ? '' : 'hidden'}`}>
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-indigo-500 focus-within:bg-white">
                      <LockKeyhole className="h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        disabled={!(isSignUp || isResetPassword)}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="再輸入一次密碼"
                        className="ml-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>
                </div>

                {errorMessage && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitLabel}
                </button>
              </form>

              <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-500">
                {isForgotPassword ? (
                  <>
                    想起密碼了？
                    <button
                      onClick={() => handleModeChange('sign-in')}
                      className="ml-2 font-bold text-indigo-600 transition-colors hover:text-indigo-500"
                    >
                      返回登入
                    </button>
                  </>
                ) : isResetPassword ? (
                  <span>已更新密碼後會自動套用目前登入狀態。</span>
                ) : (
                  <span>
                    {isSignUp ? '已經有帳號了？' : '還沒有帳號？'}
                    <button
                      onClick={() => handleModeChange(isSignUp ? 'sign-in' : 'sign-up')}
                      className="ml-2 font-bold text-indigo-600 transition-colors hover:text-indigo-500"
                    >
                      {isSignUp ? '改用登入' : '立即註冊'}
                    </button>
                  </span>
                )}

                {mode === 'sign-in' && (
                  <span>
                    忘記密碼？
                    <button
                      onClick={() => handleModeChange('forgot-password')}
                      className="ml-2 font-bold text-indigo-600 transition-colors hover:text-indigo-500"
                    >
                      重設密碼
                    </button>
                  </span>
                )}
              </div>
          </motion.section>

          <UpcomingEvents />
        </div>
      </div>
    </div>
  );
}
