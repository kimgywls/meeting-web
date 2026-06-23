'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { isAdmin } from '@/lib/auth';
import type { AdminMemberResponse } from '@/types';

const PAGE_SIZE = 10;

export default function AdminMembersPage() {
  const router = useRouter();
  const [all, setAll] = useState<AdminMemberResponse[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) { router.replace('/rooms'); return; }
    adminApi.getMembers(0, 500)
      .then(({ data }) => setAll(data.content))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, [router]);

  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  const paged = all.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
        <h1 className="text-2xl font-bold text-text-main">회원 목록</h1>
        <span className="text-sm text-text-sub">총 {all.length}명</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        {all.length === 0 ? (
          <p className="text-sm text-text-sub text-center py-8">회원이 없습니다.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background text-text-sub">
                    <th className="text-left px-3 py-2.5 rounded-l-lg font-medium">아이디</th>
                    <th className="text-left px-3 py-2.5 font-medium">닉네임</th>
                    <th className="text-left px-3 py-2.5 font-medium">이메일</th>
                    <th className="text-left px-3 py-2.5 font-medium">권한</th>
                    <th className="text-left px-3 py-2.5 font-medium">가입일</th>
                    <th className="text-left px-3 py-2.5 rounded-r-lg font-medium">예약 수</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-3 text-text-main font-medium">{m.username}</td>
                      <td className="px-3 py-3 text-text-main">{m.nickname}</td>
                      <td className="px-3 py-3 text-text-sub">{m.email}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.role === 'ROLE_ADMIN'
                            ? 'bg-cancelled text-red-800'
                            : 'bg-[#7EB5E5]/20 text-[#4b6c89]'
                        }`}>
                          {m.role === 'ROLE_ADMIN' ? '관리자' : '일반'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-text-sub whitespace-nowrap">
                        {m.createdAt.slice(0, 10)}
                      </td>
                      <td className="px-3 py-3 text-text-main text-center">{m.reservationCount}</td>
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
