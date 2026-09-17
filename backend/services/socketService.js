import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class SocketService {
  constructor() {
    this.io = null;
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          process.env.CLIENT_URL,
        ].filter(Boolean),
        credentials: true,
      },
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (token) {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'boltortlari_super_secret_jwt_key_2026_luxury'
          );
          const user = await User.findById(decoded.id).select('-password');
          if (user && !user.isBlocked) {
            socket.user = user;
          }
        }
      } catch (err) {
        // Allow unauthenticated socket connection (guests), but don't attach user
      }
      next();
    });

    this.io.on('connection', (socket) => {
      // If admin or super_admin, join 'admins' room
      if (socket.user && (socket.user.role === 'admin' || socket.user.role === 'super_admin')) {
        socket.join('admins');
      }

      // If user is authenticated, join their personal room
      if (socket.user) {
        socket.join(`user_${socket.user._id}`);
      }

      socket.on('disconnect', () => {
        // cleanup handled automatically by Socket.io
      });
    });

    console.log('⚡ Socket.IO real-time tizimi faollashtirildi');
  }

  /**
   * Broadcast new order alert to all online admins
   */
  emitNewOrder(order) {
    if (!this.io) return;
    this.io.to('admins').emit('new_order', {
      orderId: order.orderId,
      customer_name: order.customer_name,
      total: order.total,
      itemCount: order.items?.length || 1,
      createdAt: order.createdAt,
      order,
    });
  }

  /**
   * Notify customer and admins about order status change
   */
  emitOrderStatus(order) {
    if (!this.io) return;
    // Notify customer
    if (order.customer) {
      this.io.to(`user_${order.customer}`).emit('order_status_updated', {
        orderId: order.orderId,
        status: order.status,
        updatedAt: new Date(),
        order,
      });
    }

    // Also update admins
    this.io.to('admins').emit('order_status_updated', {
      orderId: order.orderId,
      status: order.status,
      updatedAt: new Date(),
      order,
    });
  }

  /**
   * Broadcast general notification
   */
  emitNotification(recipientId, notification) {
    if (!this.io) return;
    if (recipientId === 'all') {
      this.io.emit('notification', notification);
    } else if (recipientId === 'admins') {
      this.io.to('admins').emit('notification', notification);
    } else {
      this.io.to(`user_${recipientId}`).emit('notification', notification);
    }
  }

  /**
   * Celebrate and prompt customer directly upon delivery
   */
  emitOrderDelivered(order, reviewPrompt = null) {
    if (!this.io) return;
    if (order.customer) {
      this.io.to(`user_${order.customer}`).emit('order_delivered', {
        orderId: order.orderId,
        reviewUrl: `/profile?tab=reviews&orderId=${order.orderId}`,
        customerName: order.customer_name,
        total: order.total,
        reviewPrompt,
      });
    }
  }

  /**
   * Real-time notification when user connects Telegram account
   */
  emitTelegramLinked(userId, data = {}) {
    if (!this.io || !userId) return;
    this.io.to(`user_${userId}`).emit('telegram_linked', {
      success: true,
      userId,
      ...data,
    });
  }
}

export const socketService = new SocketService();

