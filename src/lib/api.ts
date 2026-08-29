import axios from 'axios';
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  Room,
  Reservation,
  ReservationRequest,
  ReservationUpdateRequest,
  AdminReservationResponse,
  AdminMemberResponse,
  RoomStatsResponse,
  PageResponse,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<void>('/auth/register', data),
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),
};

export const roomsApi = {
  getList: () =>
    api.get<Room[]>('/rooms'),
  getDetail: (id: number) =>
    api.get<Room>(`/rooms/${id}`),
  getAvailable: (date: string, startTime?: string, endTime?: string) =>
    api.get<Room[]>('/rooms/available', {
      params: { date, ...(startTime && { startTime }), ...(endTime && { endTime }) },
    }),
  create: (data: Omit<Room, 'id' | 'createdAt'>) =>
    api.post<Room>('/rooms', data),
  update: (id: number, data: Partial<Omit<Room, 'id' | 'createdAt'>>) =>
    api.put<Room>(`/rooms/${id}`, data),
  delete: (id: number) =>
    api.delete<void>(`/rooms/${id}`),
};

export const reservationsApi = {
  getMy: () =>
    api.get<Reservation[]>('/reservations'),
  create: (data: ReservationRequest) =>
    api.post<Reservation>('/reservations', data),
  update: (id: number, data: ReservationUpdateRequest) =>
    api.put<Reservation>(`/reservations/${id}`, data),
  cancel: (id: number) =>
    api.delete<void>(`/reservations/${id}`),
  getRoomReservations: (roomId: number, date: string) =>
    api.get<Reservation[]>(`/rooms/${roomId}/reservations`, { params: { date } }),
};

export const adminApi = {
  getReservations: (page = 0, size = 100) =>
    api.get<PageResponse<AdminReservationResponse>>('/admin/reservations', { params: { page, size } }),
  getTodayReservations: () =>
    api.get<AdminReservationResponse[]>('/admin/reservations/today'),
  getMembers: (page = 0, size = 100) =>
    api.get<PageResponse<AdminMemberResponse>>('/admin/members', { params: { page, size } }),
  getRoomStats: () =>
    api.get<RoomStatsResponse[]>('/admin/rooms/stats'),
};

export default api;
