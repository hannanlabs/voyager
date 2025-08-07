import type { FlightState } from '../../domain/flight';

export type FlightDataSource = {
  /**
   * Get initial flight data
   */
  getInitial(): Map<string, FlightState>;

  /**
   * Start receiving flight updates
   * @param emit Callback to receive flight updates
   * @returns Cleanup function to stop updates
   */
  start(emit: (updates: FlightState[]) => void): () => void;

  /**
   * Subscribe to connection status changes
   * @param callback Callback to receive status updates
   * @returns Cleanup function to unsubscribe
   */
  onStatus(callback: (connected: boolean) => void): () => void;
};
