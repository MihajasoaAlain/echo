import { io } from "socket.io-client";
export class NotifBridge {
    constructor(options) {
        this.options = options;
        this.socket = null;
    }
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
    onNotification(callback) {
        if (!this.socket) {
            throw new Error("SDK non connecté. Appelez .connect() d'abord.");
        }
        this.socket.on("notification", callback);
    }
    disconnect() {
        this.socket?.disconnect();
    }
}
//# sourceMappingURL=index.js.map