import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { networkInterfaces } from 'os';
import robot from 'robotjs';

// 端口配置
const PORTS = {
    HTTP: 8080,
    WS: 8080
};

// 获取本机IP地址
const getLocalIP = () => {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (!net.internal && net.family === 'IPv4') {
                return net.address;
            }
        }
    }
    return 'localhost';
};

const localIP = getLocalIP();

// 日志记录器
class Logger {
    static log(type, message, details = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type}: ${message}`;
        
        if (details) {
            console.log(logMessage, details);
        } else {
            console.log(logMessage);
        }
    }

    static event(type, details) {
        // 只记录键盘事件
        if (type === 'keyPress') {
            this.log('键盘事件', `按键: ${details.key}${details.modifier.length > 0 ? ' 修饰键: ' + details.modifier.join('+') : ''}`);
        }
    }

    static error(message, error) {
        this.log('错误', message, error);
    }
}

// 事件处理器类
class InputEventHandler {
    constructor() {
        this.lastMousePosition = robot.getMousePos();
    }

    handleEvent(event) {
        try {
            switch (event.type) {
                case 'keyPress':
                    Logger.event(event.type, event);
                    robot.keyTap(event.key, event.modifier);
                    break;

                case 'mouseMove':
                    const currentPos = robot.getMousePos();
                    robot.moveMouse(currentPos.x + event.deltaX, currentPos.y + event.deltaY);
                    break;

                case 'mouseClick':
                    robot.mouseClick(event.button, event.double);
                    break;

                case 'mouseScroll':
                    robot.scrollMouse(event.x, event.y);
                    break;

                default:
                    Logger.log('未知事件类型', event.type);
            }
        } catch (error) {
            Logger.error('事件处理错误', error);
        }
    }
}

// 创建事件处理器实例
const eventHandler = new InputEventHandler();

// 创建HTTP服务器
const httpServer = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/ip') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ip: localIP,
            ports: PORTS
        }));
        return;
    }

    res.writeHead(404);
    res.end();
});

// 创建WebSocket服务器
const wss = new WebSocketServer({ 
    server: httpServer,
    perMessageDeflate: false // 禁用消息压缩以减少延迟
});

// 为每个连接生成唯一ID
let nextClientId = 1;

wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    ws.clientId = nextClientId++;

    ws.send(JSON.stringify({ 
        type: 'welcome',
        message: 'Connected to Virtual Input Server',
        serverIP: localIP,
        protocol: 'websocket'
    }));

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            // 处理ping消息
            if (message.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong' }));
                return;
            }
            
            // 处理单个事件或事件数组
            if (Array.isArray(message)) {
                message.forEach(event => eventHandler.handleEvent(event));
            } else {
                eventHandler.handleEvent(message);
            }
        } catch (error) {
            Logger.error('消息处理错误', error);
        }
    });

    ws.on('error', (error) => {
        Logger.error(`客户端错误`, error);
    });
});

// 启动服务器
httpServer.listen(PORTS.HTTP, '0.0.0.0', () => {
    Logger.log('服务器', '虚拟输入服务器已启动');
    Logger.log('地址', `http://${localIP}:${PORTS.HTTP}`);
});