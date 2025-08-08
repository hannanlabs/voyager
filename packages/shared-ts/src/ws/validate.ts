import { WebSocketMessageSchema, type WebSocketMessage } from './messages';

export function validateWebSocketMessage(data: unknown): WebSocketMessage {
  return WebSocketMessageSchema.parse(data);
}