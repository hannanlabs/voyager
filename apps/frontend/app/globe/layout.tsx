import { WebSocketProvider } from './websocket';

export default function GlobeLayout({ children }: { children: React.ReactNode }) {
  return <WebSocketProvider>{children}</WebSocketProvider>;
}