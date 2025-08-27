import { WebSocketProvider } from "./transport/websocket";

export default function GlobeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WebSocketProvider>{children}</WebSocketProvider>;
}
