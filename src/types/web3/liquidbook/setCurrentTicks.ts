export interface TickEvent {
    id: string;
    tick: string;
    timestamp: number;
  }
  
  export interface TickEventResponse {
    setCurrentTickEvents: {
      items: TickEvent[];
    }
  }