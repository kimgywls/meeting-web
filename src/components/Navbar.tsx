'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isLoggedIn, isAdmin, getUser, removeToken, removeUser } from '@/lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setAdmin(isAdmin());
    setUsername(getUser()?.username ?? '');
  }, [pathname]);

  function handleLogout() {
    removeToken();
    removeUser();
    window.location.href = '/auth/login';
  }

  return (
    <nav className="bg-white border-b border-primary/30 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-primary font-bold text-lg tracking-tight"
        >
          회의실 예약 시스템
        </Link>

        <div className="flex items-center gap-4 text-sm">

          {loggedIn ? (
            <>
              <span className="text-text-sub text-sm">
                <span className="text-text-secondary font-bold">{username}</span>님
              </span>

              <Link
                href="/rooms"
                className="text-text-main hover:text-primary transition-colors"
              >
                회의실 목록
              </Link>
              {!admin && (
                <>
                  <Link
                    href="/reservations"
                    className="text-main hover:text-primary transition-colors"
                  >
                    내 예약
                  </Link>
                  <Link
                    href="/rooms/available"
                    className="text-text-main hover:text-primary transition-colors"
                  >
                    빈 회의실 찾기
                  </Link>
                </>
              )}


              {admin && (
                <>
                  <Link
                    href="/admin/reservations"
                    className="text-text-main hover:text-primary transition-colors"
                  >
                    전체 예약
                  </Link>
                  <Link
                    href="/admin/members"
                    className="text-text-main hover:text-primary transition-colors"
                  >
                    회원 목록
                  </Link>
                  <Link
                    href="/admin/stats"
                    className="text-text-main hover:text-primary transition-colors"
                  >
                    통계
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="bg-primary text-white px-3 py-1.5 rounded-md hover:bg-secondary transition-colors text-sm"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-text-main hover:text-primary transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/auth/register"
                className="bg-primary text-white px-3 py-1.5 rounded-md hover:bg-secondary transition-colors"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
