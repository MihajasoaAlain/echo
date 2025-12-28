import { io, Socket } from "socket.io-client";

export interface NotifBridgeOptions {
  url: string;
  userId: string;
}

export class NotifBridge {
  private socket: Socket | null = null;

  constructor(private options: NotifBridgeOptions) {}

  connect() {
    this.socket = io(this.options.url, {
      query: { userId: this.options.userId },
      transports: ["websocket"], 
    });

    this.socket.on("connect", () => {
      console.log("✅ Connecté à EchoBridge");
    });

    this.socket.on("disconnect", () => {
      console.warn("❌ Déconnecté de EchoBridge");
    });
  }

  onNotification(callback: (data: any) => void) {
    if (!this.socket) {
      throw new Error("SDK non connecté. Appelez .connect() d'abord.");
    }
    this.socket.on("notification", callback);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}