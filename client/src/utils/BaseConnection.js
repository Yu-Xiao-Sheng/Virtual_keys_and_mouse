// 通信层抽象基类
class BaseConnection {
    constructor(serverIP, port) {
        this.serverIP = serverIP;
        this.port = port;
        this.connected = false;
        this.onConnected = null;
        this.onDisconnected = null;
        this.onError = null;
        this.eventQueue = [];
        this.lastSendTime = 0;
        this.batchInterval = 16; // ~60fps
        this.processingQueue = false;
    }

    // 连接方法（子类必须实现）
    connect() {
        throw new Error('connect method must be implemented');
    }

    // 断开连接（子类必须实现）
    disconnect() {
        throw new Error('disconnect method must be implemented');
    }

    // 发送数据（子类必须实现）
    send(data) {
        throw new Error('send method must be implemented');
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
                this.send(events);
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

    // 错误处理
    handleError(error) {
        if (this.onError) {
            this.onError(error);
        }
    }

    // 处理断开连接
    handleDisconnect() {
        this.connected = false;
        if (this.onDisconnected) {
            this.onDisconnected();
        }
    }

    // 处理连接成功
    handleConnect() {
        this.connected = true;
        if (this.onConnected) {
            this.onConnected();
        }
    }
}

export default BaseConnection;