'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import type { AdminReservationResponse } from '@/types';

type Tab = 'ALL' | 'CONFIRMED' | 'CANCELLED';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'CONFIRMED', label: '예약확정' },
  { key: 'CANCELLED', label: '취소됨' },
];

const STATUS_LABEL: Record<string, string> = { CONFIRMED: '예약확정', CANCELLED: '취소됨' };
const PAGE_SIZE = 10;

export default function AdminReservationsPage() {
  const router = useRouter();
  const [all, setAll] = useState<AdminReservationResponse[]>([]);
  const [tab, setTab] = useState<Tab>('ALL');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) { router.replace('/rooms'); return; }
    adminApi.getReservations(0, 500)
      .then(({ data }) => setAll(data.content))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(() =>
    tab === 'ALL' ? all : all.filter((r) => r.status === tab),
    [all, tab]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleTabChange = (t: Tab) => { setTab(t); setPage(0); };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-sub">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-main mb-6">전체 예약 현황</h1>

      {/* 탭 */}
      <div className="flex gap-2 mb-5">
        {TABS.map(({ key, label }) => {
          const count = key === 'ALL' ? all.length : all.filter((r) => r.status === key).length;
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-secondary text-white'
                  : 'bg-white text-text-sub border border-gray-200 hover:border-secondary hover:text-secondary'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        {paged.length === 0 ? (
          <p className="text-sm text-text-sub text-center py-8">예약 내역이 없습니다.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background text-text-sub">
                    <th className="text-left px-3 py-2.5 rounded-l-lg font-medium">회원명</th>
                    <th className="text-left px-3 py-2.5 font-medium">회의실</th>
                    <th className="text-left px-3 py-2.5 font-medium">제목</th>
                    <th className="text-left px-3 py-2.5 font-medium">날짜</th>
                    <th className="text-left px-3 py-2.5 font-medium">시간</th>
                    <th className="text-left px-3 py-2.5 rounded-r-lg font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-3 text-text-main">{r.username}</td>
                      <td className="px-3 py-3 text-text-main">{r.roomName}</td>
                      <td className="px-3 py-3 text-text-main truncate max-w-[160px]">{r.title}</td>
                      <td className="px-3 py-3 text-text-sub whitespace-nowrap">{r.date}</td>
                      <td className="px-3 py-3 text-text-sub whitespace-nowrap">
                        {r.startTime.slice(0, 5)} ~ {r.endTime.slice(0, 5)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === 'CONFIRMED' ? 'bg-confirmed text-green-800' : 'bg-cancelled text-red-800'
                        }`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이징 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-5">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-text-sub hover:border-secondary hover:text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                      page === i
                        ? 'bg-secondary text-white'
                        : 'border border-gray-200 text-text-sub hover:border-secondary hover:text-secondary'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-text-sub hover:border-secondary hover:text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
