import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketClient {
  constructor() {
    this.socket = null;
  }

  connect(forcedToken = null) {
    const token = forcedToken || localStorage.getItem('bol_tortlari_token');

    if (this.socket) {
      if (this.socket.auth?.token !== token) {
        this.socket.auth = { token };
        this.socket.disconnect().connect();
      }
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      // Connected
    });

    this.socket.on('connect_error', () => {
      // Silently fall back or reconnect
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  on(event, callback) {
    const s = this.getSocket();
    if (s && typeof s.on === 'function') {
      s.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket && typeof this.socket.off === 'function') {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    const s = this.getSocket();
    if (s && typeof s.emit === 'function') {
      s.emit(event, data);
    }
  }
}

export const socketClient = new SocketClient();
export default socketClient;
