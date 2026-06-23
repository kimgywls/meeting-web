'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    password: '',
    nickname: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) router.replace('/rooms');
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register(form);
      router.replace('/auth/login');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message ?? '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const fields: { name: keyof typeof form; label: string; type: string; placeholder: string }[] = [
    { name: 'username', label: '아이디', type: 'text', placeholder: '아이디를 입력하세요' },
    { name: 'password', label: '비밀번호', type: 'password', placeholder: '비밀번호를 입력하세요' },
    { name: 'nickname', label: '닉네임', type: 'text', placeholder: '닉네임을 입력하세요' },
    { name: 'email', label: '이메일', type: 'email', placeholder: '이메일을 입력하세요' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4 py-8">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-text-main text-center mb-2">
          회원가입
        </h1>
        <p className="text-text-sub text-center text-sm mb-8">
          회의실 예약 시스템에 오신 것을 환영합니다
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {fields.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-text-main mb-1.5">
                {label}
              </label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-text-main placeholder:text-text-sub focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          ))}

          {error && (
            <div className="bg-cancelled/20 border border-cancelled rounded-lg px-3.5 py-2.5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-tertiary text-white rounded-lg py-2.5 font-medium hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-text-sub mt-6">
          이미 계정이 있으신가요?{' '}
          <Link
            href="/auth/login"
            className="text-primary hover:text-secondary font-medium transition-colors"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
