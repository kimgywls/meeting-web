export interface Member {
  id: number;
  username: string;
  nickname: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Room {
  id: number;
  name: string;
  location: string;
  capacity: number;
  description: string;
  createdAt: string;
}

export interface Reservation {
  id: number;
  roomId: number;
  roomName: string;
  roomLocation: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  username: string;
}

export interface ReservationRequest {
  roomId: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ReservationUpdateRequest {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  nickname: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

export interface RoomStatsResponse {
  roomId: number;
  roomName: string;
  totalCount: number;
  thisMonthCount: number;
}

export interface AdminReservationResponse {
  id: number;
  username: string;
  roomName: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface AdminMemberResponse {
  id: number;
  username: string;
  nickname: string;
  email: string;
  role: string;
  createdAt: string;
  reservationCount: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
