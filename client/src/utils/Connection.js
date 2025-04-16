class Connection {
    constructor(serverIP, port) {
        this.serverIP = serverIP;
        this.port = port;
        this.ws = null;
        this.connected = false;
        this.onConnected = null;
        this.onDisconnected = null;
        this.onError = null;
        this.eventQueue = [];
        this.lastSendTime = 0;
        this.batchInterval = 16; // ~60fps
        this.processingQueue = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 1000; // 1秒
    }

    connect() {
        try {
            const wsUrl = `ws://${this.serverIP}:${this.port}`;
            console.log('Connecting to:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            this.setupWebSocket();
        } catch (error) {
            console.error('Connection error:', error);
            this.handleError(error);
        }
    }

    setupWebSocket() {
        this.ws.binaryType = 'arraybuffer'; // 使用二进制传输

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.connected = true;
            this.reconnectAttempts = 0;
            if (this.onConnected) {
                this.onConnected();
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket closed');
            this.connected = false;
            this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleError(error);
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'welcome') {
                    console.log('Server welcome message:', message.message);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
    }

    handleDisconnect() {
        if (this.onDisconnected) {
            this.onDisconnected();
        }

        // 尝试重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting attempt ${this.reconnectAttempts}...`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        }
    }

    handleError(error) {
        if (this.onError) {
            this.onError(error);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.connected = false;
        this.eventQueue = [];
        this.processingQueue = false;
    }

    // 添加事件到队列
    queueEvent(event) {
        this.eventQueue.push(event);
        this.processEventQueue();
    }

    // 处理事件队列
    async processEventQueue() {
        if (this.processingQueue || !this.connected || this.eventQueue.length === 0) {
            return;
        }

        this.processingQueue = true;
        const currentTime = Date.now();

        // 如果距离上次发送时间不足batchInterval，等待
        const timeToWait = Math.max(0, this.batchInterval - (currentTime - this.lastSendTime));
        if (timeToWait > 0) {
            await new Promise(resolve => setTimeout(resolve, timeToWait));
        }

        try {
            // 批量发送事件
            const events = this.eventQueue.splice(0, this.eventQueue.length);
            if (events.length > 0) {
                this.ws.send(JSON.stringify(events));
                this.lastSendTime = Date.now();
            }
        } catch (error) {
            console.error('Error sending events:', error);
            this.handleError(error);
        }

        this.processingQueue = false;

        // 如果队列中还有事件，继续处理
        if (this.eventQueue.length > 0) {
            this.processEventQueue();
        }
    }
}

export default Connection;