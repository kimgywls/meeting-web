'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { roomsApi } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import type { Room } from '@/types';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    setAdmin(isAdmin());
    roomsApi.getList()
      .then(({ data }) => setRooms(data))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-sub">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-main">회의실 목록</h1>
        {admin && (
          <Link
            href="/rooms/new"
            className="px-4 py-2 text-sm bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
          >
            + 회의실 등록
          </Link>
        )}
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-20 text-text-sub">등록된 회의실이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow block group"
            >
              <h2 className="text-lg font-semibold text-text-main mb-1 group-hover:text-secondary transition-colors">
                {room.name}
              </h2>
              <p className="text-sm text-text-sub mb-1">{room.location}</p>
              <p className="text-sm text-text-sub mb-3">최대 {room.capacity}명</p>
              {room.description && (
                <p className="text-sm text-text-main line-clamp-2">{room.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
