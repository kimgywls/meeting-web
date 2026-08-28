'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reservationsApi } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { Reservation, ReservationUpdateRequest, ErrorResponse } from '@/types';

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

const START_TIMES = Array.from({ length: 26 }, (_, i) => {
  const total = i * 30 + 9 * 60;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
});

const END_TIMES = Array.from({ length: 26 }, (_, i) => {
  const total = (i + 1) * 30 + 9 * 60;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
});

const EDIT_ERROR_MESSAGES: Record<string, string> = {
  RESERVATION_TIME_CONFLICT: '해당 시간에 이미 다른 예약이 있습니다.',
  RESERVATION_ALREADY_CANCELLED: '취소된 예약은 수정할 수 없습니다.',
  RESERVATION_PAST_DATE: '지난 날짜로는 수정할 수 없습니다.',
  INVALID_TIME_RANGE: '시작 시간은 종료 시간보다 이전이어야 합니다.',
};

function getErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: Partial<ErrorResponse> } })?.response?.data;
  if (data?.code && EDIT_ERROR_MESSAGES[data.code]) return EDIT_ERROR_MESSAGES[data.code];
  return data?.message ?? fallback;
}

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tab, setTab] = useState<Tab>('ALL');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [editing, setEditing] = useState<Reservation | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

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

  const openEditModal = (reservation: Reservation) => {
    setEditing(reservation);
    setEditTitle(reservation.title);
    setEditDate(reservation.date);
    setEditStartTime(reservation.startTime.slice(0, 5));
    setEditEndTime(reservation.endTime.slice(0, 5));
    setEditError('');
  };

  const closeEditModal = () => {
    setEditing(null);
    setEditError('');
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editTitle.trim()) { setEditError('예약 제목을 입력해주세요.'); return; }
    if (!editDate) { setEditError('날짜를 선택해주세요.'); return; }
    if (!editStartTime || !editEndTime) { setEditError('시간을 선택해주세요.'); return; }
    if (editStartTime >= editEndTime) {
      setEditError('시작 시간은 종료 시간보다 이전이어야 합니다.');
      return;
    }
    setUpdating(true);
    setEditError('');
    const req: ReservationUpdateRequest = {
      title: editTitle.trim(),
      date: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
    };
    try {
      await reservationsApi.update(editing.id, req);
      closeEditModal();
      await fetchReservations();
    } catch (err: unknown) {
      setEditError(getErrorMessage(err, '예약 수정에 실패했습니다.'));
    } finally {
      setUpdating(false);
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
                      onClick={() => openEditModal(reservation)}
                      className="px-3 py-1.5 text-xs font-medium bg-updated-light text-updated-dark rounded-lg hover:opacity-90 transition-opacity"
                    >
                      예약 수정
                    </button>
                  )}
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

      {/* 예약 수정 모달 */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-text-main mb-5">예약 수정</h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-text-sub mb-1.5">회의실</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-text-main">
                  {editing.roomName}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-sub block mb-1.5">예약 제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => { setEditTitle(e.target.value); setEditError(''); }}
                  placeholder="예: 주간 팀 미팅"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-text-sub block mb-1.5">날짜</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => { setEditDate(e.target.value); setEditError(''); }}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-sub block mb-1.5">시작</label>
                  <select
                    value={editStartTime}
                    onChange={(e) => { setEditStartTime(e.target.value); setEditError(''); }}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="">선택</option>
                    {START_TIMES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-sub block mb-1.5">종료</label>
                  <select
                    value={editEndTime}
                    onChange={(e) => { setEditEndTime(e.target.value); setEditError(''); }}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="">선택</option>
                    {END_TIMES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              {editError && (
                <p className="text-sm text-red-500 -mt-1">{editError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={closeEditModal}
                  className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-text-sub hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex-1 py-2.5 text-sm bg-secondary text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? '수정 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
