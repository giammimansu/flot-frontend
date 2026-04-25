/* ============================================================
   FLOT — WebSocket Event Types
   ============================================================ */

/** Client → Server messages */
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

/** Server → Client events */
export interface WsMatchFound {
  event: 'match_found';
  data: {
    matchId: string;
    partner: {
      firstName: string;
      blurredPhotoUrl: string;
      destination: string;
      verified: boolean;
    };
  };
}

export interface WsMatchUnlocked {
  event: 'match_unlocked';
  data: { matchId: string };
}

export interface WsServerChatMessage {
  event: 'chat_message';
  data: {
    matchId: string;
    senderId: string;
    text: string;
    timestamp: string;
  };
}

export interface WsServerTyping {
  event: 'typing';
  data: {
    matchId: string;
    userId: string;
  };
}

export interface WsPaymentStatus {
  event: 'payment_status';
  data: {
    matchId: string;
    status: 'captured' | 'failed';
  };
}

export type WsServerEvent =
  | WsMatchFound
  | WsMatchUnlocked
  | WsServerChatMessage
  | WsServerTyping
  | WsPaymentStatus;
