/* ============================================================
   FLOT — Notifications Service (F10)
   ============================================================ */

import { api } from './api';
import type { NotificationsResponse } from '../types/api';

/** GET /notifications — in-app notification feed (newest first). */
export async function getNotifications(): Promise<NotificationsResponse> {
  return api.get('notifications').json<NotificationsResponse>();
}
