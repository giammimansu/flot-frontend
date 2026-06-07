/* ============================================================
   FLOT — WebSocket Event Types
   Mirrors backend exactly: server messages use a `type` discriminant
   with dotted names (e.g. "chat.message"), NOT `event`.
   ============================================================ */

/** Client → Server messages (routed by `action` via $request.body.action) */
export interface WsChatMessage {
  action: 'chat_message';
  matchId: string;
  text: string;
}

export interface WsTyping {
  action: 'typing';
  matchId: string;
}

export type WsClientMessage = WsChatMessage | WsTyping;

/* ── Server → Client events (discriminant: `type`) ── */

/** chat.message (to partner) · chat.message.sent (echo to sender) */
export interface WsChatMessageEvent {
  type: 'chat.message' | 'chat.message.sent';
  data: {
    matchId: string;
    messageId: string;
    senderId: string;
    text: string;
    createdAt: string;
  };
}

/** chat.system — system message broadcast to both users */
export interface WsChatSystemEvent {
  type: 'chat.system';
  data: {
    matchId: string;
    messageId: string;
    text: string;
    createdAt: string;
  };
}

/** match.found — new match available (notification fan-out) */
export interface WsMatchFound {
  type: 'match.found';
  data: {
    matchId?: string;
    [k: string]: unknown;
  };
}

/** match.partner_unlocked — partner unlocked first (deadlock pressure) */
export interface WsMatchPartnerUnlocked {
  type: 'match.partner_unlocked';
  data: {
    matchId: string;
    [k: string]: unknown;
  };
}

/** typing — partner is typing in the chat */
export interface WsTypingEvent {
  type: 'typing';
  data: {
    matchId: string;
    userId: string;
  };
}

export type WsServerEvent =
  | WsChatMessageEvent
  | WsChatSystemEvent
  | WsMatchFound
  | WsMatchPartnerUnlocked
  | WsTypingEvent;
