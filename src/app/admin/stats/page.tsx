'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import type { RoomStatsResponse } from '@/types';

export default function AdminStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<RoomStatsResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) { router.replace('/rooms'); return; }
    adminApi.getRoomStats()
      .then(({ data }) => {
        const sorted = [...data].sort((a, b) => b.thisMonthCount - a.thisMonthCount);
        setStats(sorted);
      })
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  }, [router]);

  const maxMonth = Math.max(...stats.map((s) => s.thisMonthCount), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-sub">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-main mb-6">회의실별 통계</h1>

      {stats.length === 0 ? (
        <div className="text-center py-20 text-text-sub">통계 데이터가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s) => {
            const barWidth = maxMonth > 0 ? Math.round((s.thisMonthCount / maxMonth) * 100) : 0;
            return (
              <div key={s.roomId} className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-base font-semibold text-text-main mb-3">{s.roomName}</h2>

                <div className="flex justify-between text-sm mb-4">
                  <div>
                    <p className="text-text-sub text-xs mb-0.5">전체 예약</p>
                    <p className="text-xl font-bold text-text-main">{s.totalCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-sub text-xs mb-0.5">이번 달</p>
                    <p className="text-xl font-bold text-[#7EB5E5]">{s.thisMonthCount}</p>
                  </div>
                </div>

                {/* 바 차트 */}
                <div>
                  <div className="flex justify-between text-xs text-text-sub mb-1">
                    <span>이번 달 예약</span>
                    <span>{barWidth}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%`, backgroundColor: '#7EB5E5' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
