'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, roomsApi } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import type { AdminReservationResponse } from '@/types';

const STATUS_LABEL: Record<string, string> = { CONFIRMED: '예약확정', CANCELLED: '취소됨' };

interface Summary {
  roomCount: number;
  todayCount: number;
  memberCount: number;
  thisMonthCount: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [todayList, setTodayList] = useState<AdminReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) { router.replace('/rooms'); return; }

    Promise.all([
      roomsApi.getList(),
      adminApi.getTodayReservations(),
      adminApi.getMembers(0, 1),
      adminApi.getRoomStats(),
    ]).then(([rooms, today, members, stats]) => {
      setSummary({
        roomCount: rooms.data.length,
        todayCount: today.data.length,
        memberCount: members.data.totalElements,
        thisMonthCount: stats.data.reduce((sum, s) => sum + s.thisMonthCount, 0),
      });
      setTodayList(today.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-sub">로딩 중...</p>
      </div>
    );
  }

  const cards = [
    { label: '전체 회의실', value: summary?.roomCount ?? 0, color: '#7EB5E5', href: '/rooms' },
    { label: '오늘 예약', value: summary?.todayCount ?? 0, color: '#A89DD6', href: '/admin/reservations' },
    { label: '전체 회원', value: summary?.memberCount ?? 0, color: '#A8D5B5', href: '/admin/members' },
    { label: '이번 달 예약', value: summary?.thisMonthCount ?? 0, color: '#FFD4A8', href: '/admin/stats' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-main mb-6">관리자 대시보드</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow block"
          >
            <div
              className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: color }}
            >
              {value > 99 ? '99+' : value}
            </div>
            <p className="text-2xl font-bold text-text-main">{value}</p>
            <p className="text-sm text-text-sub mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* 오늘 예약 현황 */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-text-main mb-4">오늘 예약 현황</h2>
        {todayList.length === 0 ? (
          <p className="text-sm text-text-sub text-center py-8">오늘 예약이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background text-text-sub">
                  <th className="text-left px-3 py-2.5 rounded-l-lg font-medium">회원명</th>
                  <th className="text-left px-3 py-2.5 font-medium">회의실</th>
                  <th className="text-left px-3 py-2.5 font-medium">제목</th>
                  <th className="text-left px-3 py-2.5 font-medium">시간</th>
                  <th className="text-left px-3 py-2.5 rounded-r-lg font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {todayList.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-3 text-text-main">{r.username}</td>
                    <td className="px-3 py-3 text-text-main">{r.roomName}</td>
                    <td className="px-3 py-3 text-text-main truncate max-w-[160px]">{r.title}</td>
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
        )}
      </div>
    </div>
  );
}
