'use client';

import { FormEvent, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, GraduationCap, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';

type AuthMode = 'sign-in' | 'sign-up';

interface AuthPageProps {
  onBack: () => void;
}

export default function AuthPage({ onBack }: AuthPageProps) {
  const { setIsLoggedIn } = useApp();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isSignUp = mode === 'sign-up';
  const submitLabel = useMemo(
    () => (isSubmitting ? '處理中...' : isSignUp ? '建立帳號' : '登入'),
    [isSignUp, isSubmitting]
  );

  const resetFeedback = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetFeedback();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();

    if (!email.trim() || !password.trim()) {
      setErrorMessage('請輸入 Email 和密碼。');
      return;
    }

    if (isSignUp) {
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
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
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

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-md transition-all hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首頁
          </button>

          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-md">
            <GraduationCap className="h-5 w-5" />
            KiDays 童步
          </div>
        </div>

        <div className="flex flex-1 items-center py-10 lg:py-12">
          <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-[2rem] border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl lg:p-10"
            >
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white/75">
                Account Access
              </div>
              <h1 className="mt-6 text-4xl font-black leading-tight text-white">
                登入後，把你的學生資料和學校清單正式接上雲端。
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/75">
                註冊後可同步學生檔案、已添加學校與節點進度。若你現在只想先看介面，也可以先用樣品模式繼續體驗。
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  ['雲端同步', '學生與學校關聯'],
                  ['進度保存', '任務勾選回寫'],
                  ['多裝置接續', '換裝置也能接著看'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-white/10 bg-white/10 px-4 py-5"
                  >
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">{label}</div>
                    <div className="mt-2 text-sm font-bold text-white">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-3xl border border-amber-200/30 bg-amber-300/10 px-5 py-4 text-sm leading-7 text-white/80">
                註冊流程目前使用 Email + 密碼。若你的 Supabase 專案已開啟 Email 驗證，註冊後需要先到信箱完成確認。
              </div>

              <button
                onClick={() => setIsLoggedIn(true)}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/15"
              >
                先看樣品模式
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="rounded-[2rem] bg-white p-8 shadow-2xl lg:p-10"
            >
              <div className="flex rounded-2xl bg-slate-100 p-1.5">
                <button
                  onClick={() => handleModeChange('sign-in')}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    !isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  登入
                </button>
                <button
                  onClick={() => handleModeChange('sign-up')}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  註冊
                </button>
              </div>

              <div className="mt-8">
                <h2 className="text-3xl font-black text-slate-900">
                  {isSignUp ? '建立你的 KiDays 帳號' : '歡迎回來'}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {isSignUp
                    ? '先建立帳號，之後就能把學生檔案、學校清單與申請進度保存到雲端。'
                    : '登入後即可回到你的學校看板與學生資料。'}
                </p>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Email</span>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-indigo-500 focus-within:bg-white">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="ml-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">密碼</span>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-indigo-500 focus-within:bg-white">
                    <LockKeyhole className="h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={isSignUp ? '至少 6 個字元' : '輸入你的密碼'}
                      className="ml-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                {isSignUp && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">確認密碼</span>
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-indigo-500 focus-within:bg-white">
                      <LockKeyhole className="h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="再輸入一次密碼"
                        className="ml-3 w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>
                )}

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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-4 text-sm font-bold text-white shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitLabel}
                </button>
              </form>

              <div className="mt-6 text-sm text-slate-500">
                {isSignUp ? '已經有帳號了？' : '還沒有帳號？'}
                <button
                  onClick={() => handleModeChange(isSignUp ? 'sign-in' : 'sign-up')}
                  className="ml-2 font-bold text-indigo-600 transition-colors hover:text-indigo-500"
                >
                  {isSignUp ? '改用登入' : '立即註冊'}
                </button>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
