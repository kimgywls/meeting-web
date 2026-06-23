'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reservationsApi } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { Reservation } from '@/types';

type Tab = 'ALL' | 'CONFIRMED' | 'CANCELLED';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'CONFIRMED', label: '예약확정' },
  { key: 'CANCELLED', label: '취소됨' },
];

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: '예약확정',
  CANCELLED: '취소됨',
};

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tab, setTab] = useState<Tab>('ALL');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/auth/login');
      return;
    }
    fetchReservations();
  }, [router]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data } = await reservationsApi.getMy();
      setReservations(data);
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('예약을 취소하시겠습니까?')) return;
    setCancellingId(id);
    try {
      await reservationsApi.cancel(id);
      await fetchReservations();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '예약 취소에 실패했습니다.');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = tab === 'ALL'
    ? reservations
    : reservations.filter((r) => r.status === tab);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-sub">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-main mb-6">내 예약</h1>

      {/* 탭 필터 */}
      <div className="flex gap-2 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-secondary text-white'
                : 'bg-white text-text-sub border border-gray-200 hover:border-secondary hover:text-secondary'
            }`}
          >
            {label}
            {key !== 'ALL' && (
              <span className="ml-1.5 text-xs opacity-80">
                ({reservations.filter((r) => r.status === key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 예약 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-text-sub">
          <p>예약 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((reservation) => (
            <div key={reservation.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* 왼쪽: 예약 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-base font-semibold text-text-main truncate">
                      {reservation.title}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                        reservation.status === 'CONFIRMED'
                          ? 'bg-confirmed-light text-confirmed-dark'
                          : 'bg-cancelled-light text-cancelled-dark'
                      }`}
                    >
                      {STATUS_LABEL[reservation.status] ?? reservation.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-main mb-0.5">
                    {reservation.roomName}
                  </p>
                  <p className="text-xs text-text-sub mb-2">{reservation.roomLocation}</p>
                  <p className="text-sm text-text-sub">
                    {reservation.date} &nbsp;
                    <span className="text-text-main font-medium">
                      {reservation.startTime.slice(0, 5)} ~ {reservation.endTime.slice(0, 5)}
                    </span>
                  </p>
                </div>

                {/* 오른쪽: 버튼 */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    href={`/rooms/${reservation.roomId}`}
                    className="px-3 py-1.5 text-xs font-medium bg-quaternary-ligt text-quaternary-dark rounded-lg hover:opacity-90 transition-opacity text-center"
                  >
                    회의실 보기
                  </Link>
                  {reservation.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      disabled={cancellingId === reservation.id}
                      className="px-3 py-1.5 text-xs font-medium bg-cancelled-light text-[#91646c] rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancellingId === reservation.id ? '취소 중...' : '예약 취소'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
