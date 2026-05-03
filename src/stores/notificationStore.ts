import { create } from 'zustand';

interface ToastData {
  title: string;
  body: string;
  onClick?: () => void;
}

interface NotificationState {
  toast: ToastData | null;
  showToast: (data: ToastData) => void;
  hideToast: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toast: null,
  showToast: (data) => set({ toast: data }),
  hideToast: () => set({ toast: null }),
}));
