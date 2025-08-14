export type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

export const WS_STATUS = {
  CONNECTING: 'connecting',
  OPEN: 'open', 
  CLOSED: 'closed',
  ERROR: 'error'
} as const;