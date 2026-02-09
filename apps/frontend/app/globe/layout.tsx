import { WebSocketProvider } from "../components/WebSocketProvider";

export default function GlobeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WebSocketProvider>{children}</WebSocketProvider>;
}
