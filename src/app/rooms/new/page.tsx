'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { roomsApi } from '@/lib/api';
import { isAdmin } from '@/lib/auth';

export default function NewRoomPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    location: '',
    capacity: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin()) router.replace('/rooms');
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await roomsApi.create({
        name: form.name,
        location: form.location,
        capacity: Number(form.capacity),
        description: form.description,
      });
      router.push('/rooms');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '회의실 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/rooms" className="text-sm text-text-sub hover:text-secondary transition-colors">
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-text-main mt-2">회의실 등록</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">회의실 이름</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="예: 세미나실 A"
              required
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">위치</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="예: 3층 301호"
              required
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">수용 인원</label>
            <input
              type="number"
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              placeholder="예: 10"
              min={1}
              required
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">설명</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="회의실에 대한 간단한 설명을 입력하세요"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-secondary text-white rounded-lg py-2.5 font-medium hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '등록 중...' : '등록하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
