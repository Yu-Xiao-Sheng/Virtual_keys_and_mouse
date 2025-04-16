import BaseConnection from './BaseConnection';

class WSConnection extends BaseConnection {
    constructor(serverIP, port) {
        super(serverIP, port);
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 1000;
        this.latency = 0;
        this.lastPingTime = 0;
        this.pingInterval = null;
        this.onLatencyUpdate = null;
    }

    connect() {
        try {
            const wsUrl = `ws://${this.serverIP}:${this.port}`;
            console.log('Connecting to WebSocket:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            this.ws.binaryType = 'arraybuffer'; // 使用二进制传输提高性能

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.handleConnect();
                this.startPingInterval();
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.handleDisconnect();
                this.stopPingInterval();
                this.tryReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.handleError(error);
            };

            this.ws.onmessage = this.handleMessage.bind(this);

        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.handleError(error);
            this.tryReconnect();
        }
    }

    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'pong') {
                // 计算延迟
                const now = performance.now();
                this.latency = Math.round(now - this.lastPingTime);
                if (this.onLatencyUpdate) {
                    this.onLatencyUpdate(this.latency);
                }
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    startPingInterval() {
        this.pingInterval = setInterval(() => {
            if (this.connected) {
                this.sendPing();
            }
        }, 1000); // 每秒发送一次ping
    }

    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    sendPing() {
        try {
            this.lastPingTime = performance.now();
            this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
            console.error('Error sending ping:', error);
        }
    }

    tryReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting attempt ${this.reconnectAttempts}...`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        }
    }

    disconnect() {
        this.stopPingInterval();
        if (this.ws) {
            this.ws.close();
        }
        this.connected = false;
    }

    send(event) {
        if (!this.connected || !this.ws) {
            return;
        }

        try {
            // 直接发送事件，不使用队列
            this.ws.send(JSON.stringify(event));
        } catch (error) {
            console.error('Error sending event:', error);
            this.handleError(error);
        }
    }

    getLatency() {
        return this.latency;
    }
}

export default WSConnection;