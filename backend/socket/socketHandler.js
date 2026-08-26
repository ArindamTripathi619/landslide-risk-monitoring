const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

class SocketHandler {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.connectedUsers = new Map();
    this.districtSubscriptions = new Map(); // district -> Set of socket ids

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      socket.on('authenticate', (data) => {
        this.connectedUsers.set(socket.id, {
          userId: socket.userId,
          role: data.role || 'viewer',
          district: data.district,
        });
        socket.emit('authenticated', { userId: socket.userId });

        // Auto-subscribe to user's district
        if (data.district) {
          this.subscribeToDistrict(socket, data.district);
        }

        this.broadcastStats();
      });

      socket.on('subscribe_district', (district) => {
        this.subscribeToDistrict(socket, district);
      });

      socket.on('unsubscribe_district', (district) => {
        this.unsubscribeFromDistrict(socket, district);
      });

      socket.on('field_report', (report) => {
        // Broadcast new field report to admins and district subscribers
        this.io.to('role:admin').emit('new_field_report', report);
        if (report.district) {
          const subs = this.districtSubscriptions.get(report.district);
          if (subs) {
            subs.forEach(id => this.io.to(id).emit('new_field_report', report));
          }
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.connectedUsers.delete(socket.id);
        // Clean up district subscriptions
        for (const [district, subs] of this.districtSubscriptions) {
          subs.delete(socket.id);
          if (subs.size === 0) this.districtSubscriptions.delete(district);
        }
        this.broadcastStats();
      });
    });
  }

  subscribeToDistrict(socket, district) {
    socket.join(`district:${district}`);
    if (!this.districtSubscriptions.has(district)) {
      this.districtSubscriptions.set(district, new Set());
    }
    this.districtSubscriptions.get(district).add(socket.id);
  }

  unsubscribeFromDistrict(socket, district) {
    socket.leave(`district:${district}`);
    const subs = this.districtSubscriptions.get(district);
    if (subs) subs.delete(socket.id);
  }

  // Broadcast a risk update to all connected clients
  broadcastRiskUpdate(data) {
    this.io.emit('risk_update', data);
  }

  // Broadcast an early warning alert
  broadcastAlert(alert) {
    // Send to all clients
    this.io.emit('alert', alert);
    // Also send to specific district room
    if (alert.district) {
      this.io.to(`district:${alert.district}`).emit('district_alert', alert);
    }
  }

  // Broadcast weather update
  broadcastWeatherUpdate(data) {
    this.io.emit('weather_update', data);
    if (data.district) {
      this.io.to(`district:${data.district}`).emit('district_weather', data);
    }
  }

  broadcastStats() {
    this.io.emit('connected_stats', {
      totalConnected: this.connectedUsers.size,
      districts: Object.fromEntries(
        [...this.districtSubscriptions.entries()].map(([d, s]) => [d, s.size])
      ),
    });
  }

  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      districtSubscriptions: Object.fromEntries(
        [...this.districtSubscriptions.entries()].map(([d, s]) => [d, s.size])
      ),
    };
  }
}

module.exports = SocketHandler;
