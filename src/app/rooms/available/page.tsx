'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { roomsApi, reservationsApi } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { Room, ReservationRequest } from '@/types';

const START_TIMES = Array.from({ length: 26 }, (_, i) => {
  const total = i * 30 + 9 * 60;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
});

const END_TIMES = Array.from({ length: 26 }, (_, i) => {
  const total = (i + 1) * 30 + 9 * 60;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
});

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface ModalState {
  room: Room;
  date: string;
  startTime: string;
  endTime: string;
}

export default function AvailableRoomsPage() {
  const router = useRouter();

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<Room[]>([]);

  const [modal, setModal] = useState<ModalState | null>(null);
  const [modalStartTime, setModalStartTime] = useState('');
  const [modalEndTime, setModalEndTime] = useState('');
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const validate = (): boolean => {
    if (!date) { setFormError('날짜를 입력해주세요.'); return false; }
    if (date < todayStr()) { setFormError('오늘 이후 날짜를 선택해주세요.'); return false; }
    if (startTime && endTime && startTime >= endTime) {
      setFormError('시작 시간은 종료 시간보다 이전이어야 합니다.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSearch = async () => {
    if (!validate()) return;
    setLoading(true);
    setSearched(false);
    try {
      const { data } = await roomsApi.getAvailable(date, startTime || undefined, endTime || undefined);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const openModal = (room: Room) => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    setModal({ room, date, startTime, endTime });
    setModalStartTime(startTime);
    setModalEndTime(endTime);
    setTitle('');
    setModalError('');
  };

  const handleReserve = async () => {
    if (!modal) return;
    if (!title.trim()) { setModalError('예약 제목을 입력해주세요.'); return; }
    if (!modalStartTime) { setModalError('시작 시간을 선택해주세요.'); return; }
    if (!modalEndTime) { setModalError('종료 시간을 선택해주세요.'); return; }
    if (modalStartTime >= modalEndTime) { setModalError('시작 시간은 종료 시간보다 이전이어야 합니다.'); return; }
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    if (toMin(modalEndTime) - toMin(modalStartTime) > 180) { setModalError('최대 예약 가능 시간은 3시간입니다.'); return; }
    setSubmitting(true);
    setModalError('');
    const req: ReservationRequest = {
      roomId: modal.room.id,
      title: title.trim(),
      date: modal.date,
      startTime: modalStartTime,
      endTime: modalEndTime,
    };
    try {
      await reservationsApi.create(req);
      setModal(null);
      alert('예약이 완료되었습니다.');
      router.push(`/rooms/${modal.room.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setModalError(msg ?? '예약에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/rooms" className="text-sm text-text-sub hover:text-primary transition-colors">
          ← 회의실 목록
        </Link>
        <h1 className="text-2xl font-bold text-text-main mt-2">빈 회의실 찾기</h1>
        <p className="text-sm text-text-sub mt-1">날짜와 시간을 선택하면 예약 가능한 회의실을 찾아드립니다.</p>
      </div>

      {/* 검색 폼 */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1.5">날짜</label>
            <input
              type="date"
              value={date}
              min={todayStr()}
              onChange={(e) => { setDate(e.target.value); setFormError(''); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1.5">시작 시간</label>
            <select
              value={startTime}
              onChange={(e) => { setStartTime(e.target.value); setFormError(''); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors bg-white"
            >
              <option value="">선택</option>
              {START_TIMES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1.5">종료 시간</label>
            <select
              value={endTime}
              onChange={(e) => { setEndTime(e.target.value); setFormError(''); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors bg-white"
            >
              <option value="">선택</option>
              {END_TIMES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2.5 bg-tertiary text-white text-sm font-medium rounded-lg hover:bg-primary transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
        {formError && (
          <p className="mt-3 text-sm text-red-500">{formError}</p>
        )}
      </div>

      {/* 검색 결과 */}
      {!searched && !loading && (
        <div className="text-center py-16 text-text-sub">
          <p className="text-base">날짜와 시간을 선택해주세요.</p>
          <p className="text-sm mt-1">검색하면 예약 가능한 회의실 목록이 표시됩니다.</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-text-sub">검색 중...</div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16 text-text-sub">
          <p className="text-base">해당 시간에 예약 가능한 회의실이 없습니다.</p>
          <p className="text-sm mt-1">다른 날짜나 시간을 선택해보세요.</p>
        </div>
      )}

      {searched && !loading && results.length > 0 && (
        <>
          <p className="text-sm text-text-sub mb-3">
            <span className="font-semibold text-text-main">{results.length}개</span>의 회의실을 예약할 수 있습니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-text-main mb-1">{room.name}</h2>
                  <p className="text-sm text-text-sub mb-0.5">{room.location}</p>
                  <p className="text-sm text-text-sub mb-3">최대 {room.capacity}명</p>
                  {room.description && (
                    <p className="text-sm text-text-main line-clamp-2 mb-3">{room.description}</p>
                  )}
                </div>
                <button
                  onClick={() => openModal(room)}
                  className="mt-auto w-full py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  바로 예약하기
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 예약 모달 */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-text-main mb-5">예약 신청</h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-text-sub mb-1.5">회의실</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-text-main">
                  {modal.room.name}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-text-sub mb-1.5">날짜</p>
                  <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-text-main">
                    {modal.date}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-text-sub mb-1.5">시작</p>
                  {modal.startTime ? (
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-text-main">
                      {modal.startTime}
                    </div>
                  ) : (
                    <select
                      value={modalStartTime}
                      onChange={(e) => { setModalStartTime(e.target.value); setModalError(''); }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary bg-white"
                    >
                      <option value="">선택</option>
                      {START_TIMES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <p className="text-xs text-text-sub mb-1.5">종료</p>
                  {modal.endTime ? (
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-text-main">
                      {modal.endTime}
                    </div>
                  ) : (
                    <select
                      value={modalEndTime}
                      onChange={(e) => { setModalEndTime(e.target.value); setModalError(''); }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary bg-white"
                    >
                      <option value="">선택</option>
                      {END_TIMES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-sub block mb-1.5">예약 제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setModalError(''); }}
                  placeholder="예: 주간 팀 미팅"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              {modalError && (
                <p className="text-sm text-red-500 -mt-1">{modalError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setModal(null); setModalError(''); }}
                  className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-text-sub hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleReserve}
                  disabled={submitting}
                  className="flex-1 py-2.5 text-sm bg-secondary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
