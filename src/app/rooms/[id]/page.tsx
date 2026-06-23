'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { roomsApi, reservationsApi } from '@/lib/api';
import { isLoggedIn, isAdmin } from '@/lib/auth';
import type { Room, Reservation, ReservationRequest } from '@/types';

type CalendarValue = Date | [Date | null, Date | null] | null;

const SLOTS: string[] = Array.from({ length: 26 }, (_, i) => {
  const totalMinutes = i * 30 + 9 * 60;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

function slotEndTime(lastIndex: number): string {
  const totalMinutes = (lastIndex + 1) * 30 + 9 * 60;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const hasDraggedRef = useRef(false);
  const [showModal, setShowModal] = useState(false);
  const [reservationTitle, setReservationTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [adminUser, setAdminUser] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setAdminUser(isAdmin());
    setLoggedIn(isLoggedIn());
  }, []);

  useEffect(() => {
    roomsApi.getDetail(Number(id))
      .then(({ data }) => setRoom(data))
      .catch(() => setRoom(null))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchReservations = useCallback(async () => {
    try {
      const { data } = await reservationsApi.getRoomReservations(
        Number(id),
        formatDate(selectedDate),
      );
      setReservations(data);
    } catch {
      setReservations([]);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    fetchReservations();
    setSelectedSlots([]);
    setSelectionAnchor(null);
  }, [fetchReservations]);

  const getSlotReservation = (index: number): Reservation | undefined => {
    const slotTime = SLOTS[index];
    return reservations.find(r => slotTime >= r.startTime && slotTime < r.endTime);
  };

  const isPastSlot = (index: number): boolean => {
    const now = new Date();
    if (formatDate(selectedDate) !== formatDate(now)) return false;
    const slotMinutes = index * 30 + 9 * 60;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes < nowMinutes;
  };

  const MAX_SLOTS = 6; // 최대 3시간

  const buildRange = (anchor: number, target: number) => {
    const capped =
      target > anchor
        ? Math.min(target, anchor + MAX_SLOTS - 1)
        : Math.max(target, anchor - MAX_SLOTS + 1);
    const lo = Math.min(anchor, capped);
    const hi = Math.max(anchor, capped);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  };

  const handleSlotMouseDown = (index: number) => {
    if (getSlotReservation(index) || isPastSlot(index)) return;
    hasDraggedRef.current = false;
    setIsDragging(true);
    setDragStart(index);
  };

  const handleSlotMouseEnter = (index: number) => {
    if (!isDragging || dragStart === null || index === dragStart || getSlotReservation(index) || isPastSlot(index)) return;
    hasDraggedRef.current = true;
    const range = buildRange(dragStart, index);
    if (!range.some(i => getSlotReservation(i) || isPastSlot(i))) {
      setSelectedSlots(range);
      setSelectionAnchor(dragStart);
    }
  };

  const handleContainerMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (hasDraggedRef.current) return;

    const el = (e.target as HTMLElement).closest('[data-slot]');
    if (!el) return;
    const clickedIndex = Number(el.getAttribute('data-slot'));
    if (isNaN(clickedIndex) || getSlotReservation(clickedIndex) || isPastSlot(clickedIndex)) return;

    if (selectedSlots.includes(clickedIndex)) {
      // 선택된 칸 재클릭 → 전체 해제
      setSelectedSlots([]);
      setSelectionAnchor(null);
    } else if (selectedSlots.length > 0 && selectionAnchor !== null) {
      // 기존 선택 있음 → anchor 기준으로 범위 확장
      const range = buildRange(selectionAnchor, clickedIndex);
      if (!range.some(i => getSlotReservation(i))) {
        setSelectedSlots(range);
      }
    } else {
      // 새 선택 시작
      setSelectedSlots([clickedIndex]);
      setSelectionAnchor(clickedIndex);
    }
  };

  const getReservationTimes = () => {
    if (selectedSlots.length === 0) return { startTime: '', endTime: '' };
    const sorted = [...selectedSlots].sort((a, b) => a - b);
    return {
      startTime: SLOTS[sorted[0]],
      endTime: slotEndTime(sorted[sorted.length - 1]),
    };
  };

  const handleReserve = async () => {
    if (!loggedIn) { router.push('/auth/login'); return; }
    const { startTime, endTime } = getReservationTimes();
    const req: ReservationRequest = {
      roomId: Number(id),
      title: reservationTitle,
      date: formatDate(selectedDate),
      startTime,
      endTime,
    };
    setSubmitting(true);
    try {
      await reservationsApi.create(req);
      setShowModal(false);
      setSelectedSlots([]);
      setSelectionAnchor(null);
      setReservationTitle('');
      await fetchReservations();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '예약에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 회의실을 삭제하시겠습니까?')) return;
    try {
      await roomsApi.delete(Number(id));
      router.push('/rooms');
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-sub">로딩 중...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-sub">회의실을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const { startTime, endTime } = getReservationTimes();

  return (
    <div
      className="max-w-5xl mx-auto px-4 py-8"
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={() => setIsDragging(false)}
    >
      {/* Room info */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link
              href="/rooms"
              className="text-sm text-text-sub hover:text-parmary-dark transition-colors inline-block mb-2"
            >
              ← 목록으로
            </Link>
            <h1 className="text-2xl font-bold text-text-main">{room.name}</h1>
            <p className="text-sm text-text-sub mt-1">
              {room.location} · 최대 {room.capacity}명
            </p>
            {room.description && (
              <p className="text-sm text-text-main mt-2">{room.description}</p>
            )}
          </div>
          {adminUser && (
            <div className="flex gap-2 shrink-0">
              <Link
                href={`/rooms/edit/${id}`}
                className="px-3 py-1.5 text-sm bg-tertiary text-white rounded-lg hover:bg-primary transition-colors"
              >
                수정
              </Link>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm bg-cancelled text-white rounded-lg hover:opacity-80 transition-opacity"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-text-main mb-3">날짜 선택</h2>
          <Calendar
            value={selectedDate}
            onChange={(val: CalendarValue) => {
              if (val instanceof Date) setSelectedDate(val);
            }}
            minDate={today}
            locale="ko-KR"
          />
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-text-main">
              {formatDate(selectedDate)} 타임라인
            </h2>
            {selectedSlots.length > 0 && (
              <button
                onClick={() => {
                  if (!loggedIn) { router.push('/auth/login'); return; }
                  setShowModal(true);
                }}
                className="px-4 py-1.5 text-sm bg-tertiary text-white rounded-lg hover:bg-primary transition-colors"
              >
                예약 신청 ({startTime} ~ {endTime})
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[480px] rounded-lg border border-gray-100 select-none">
            {SLOTS.map((slot, index) => {
              const reservation = getSlotReservation(index);
              const isSelected = selectedSlots.includes(index);
              const isPast = isPastSlot(index);

              let slotClass = 'bg-timeline-empty hover:opacity-75 cursor-pointer';
              if (reservation) slotClass = 'bg-timeline-booked cursor-not-allowed';
              if (isPast) slotClass = 'bg-gray-100 cursor-not-allowed';
              if (isSelected) slotClass = 'bg-timeline-selected cursor-pointer';

              return (
                <div
                  key={slot}
                  className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 transition-colors ${slotClass}`}
                  data-slot={index}
                  onMouseDown={() => handleSlotMouseDown(index)}
                  onMouseEnter={() => handleSlotMouseEnter(index)}
                >
                  <span className={`text-xs font-mono w-12 shrink-0 ${isPast ? 'text-gray-300' : 'text-text-sub'}`}>{slot}</span>
                  <span className={`text-xs truncate ${isPast ? 'text-gray-300' : 'text-text-main'}`}>
                    {reservation ? `${reservation.username} · ${reservation.title}` : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-3 text-xs text-text-sub">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-timeline-empty border border-gray-200 inline-block" />
              비어있음
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-timeline-booked inline-block" />
              예약됨
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-timeline-selected inline-block" />
              선택됨
            </span>
          </div>
        </div>
      </div>

      {/* Reservation modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-text-main mb-5">예약 신청</h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-text-sub mb-1.5">날짜</p>
                  <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-text-main">
                    {formatDate(selectedDate)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-text-sub mb-1.5">시간</p>
                  <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-text-main">
                    {startTime} ~ {endTime}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-sub block mb-1.5">예약 제목</label>
                <input
                  type="text"
                  value={reservationTitle}
                  onChange={(e) => setReservationTitle(e.target.value)}
                  placeholder="예: 주간 팀 미팅"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowModal(false); setReservationTitle(''); }}
                  className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-text-sub hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleReserve}
                  disabled={!reservationTitle.trim() || submitting}
                  className="flex-1 py-2.5 text-sm bg-secondary text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '예약 중...' : '확인'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
