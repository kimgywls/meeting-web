'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { roomsApi } from '@/lib/api';
import { isAdmin } from '@/lib/auth';

export default function EditRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    location: '',
    capacity: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdmin()) { router.replace('/rooms'); return; }
    roomsApi.getDetail(Number(id))
      .then(({ data }) => {
        setForm({
          name: data.name,
          location: data.location,
          capacity: String(data.capacity),
          description: data.description ?? '',
        });
      })
      .catch(() => router.replace('/rooms'))
      .finally(() => setLoading(false));
  }, [id, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await roomsApi.update(Number(id), {
        name: form.name,
        location: form.location,
        capacity: Number(form.capacity),
        description: form.description,
      });
      router.push(`/rooms/${id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-sub">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/rooms/${id}`} className="text-sm text-text-sub hover:text-secondary transition-colors">
          ← 상세로
        </Link>
        <h1 className="text-2xl font-bold text-text-main mt-2">회의실 수정</h1>
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
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 bg-secondary text-white rounded-lg py-2.5 font-medium hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '저장 중...' : '저장하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
