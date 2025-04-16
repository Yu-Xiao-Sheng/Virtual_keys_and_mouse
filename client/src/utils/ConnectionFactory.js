import WSConnection from './WSConnection';

export const ConnectionType = {
    WEBSOCKET: 'websocket'
};

export const DEFAULT_PORTS = {
    WEBSOCKET: 8080,
    HTTP: 8080
};

export const DEFAULT_HOST = 'main.home';

class ConnectionFactory {
    static #ports = { ...DEFAULT_PORTS };
    static #defaultHost = DEFAULT_HOST;

    static createConnection(type, serverIP) {
        const port = this.getPortForType(type);
        const host = serverIP || this.#defaultHost;
        
        switch (type.toLowerCase()) {
            case ConnectionType.WEBSOCKET:
                return new WSConnection(host, port);
            default:
                throw new Error(`Unsupported connection type: ${type}`);
        }
    }

    static getDefaultType() {
        return ConnectionType.WEBSOCKET;
    }

    static isValidType(type) {
        return Object.values(ConnectionType).includes(type.toLowerCase());
    }

    static getAvailableTypes() {
        return Object.values(ConnectionType);
    }

    static getTypeLabel(type) {
        switch (type.toLowerCase()) {
            case ConnectionType.WEBSOCKET:
                return `WebSocket (端口${this.#ports.WEBSOCKET})`;
            default:
                return type;
        }
    }

    static getPortForType(type) {
        switch (type.toLowerCase()) {
            case ConnectionType.WEBSOCKET:
                return this.#ports.WEBSOCKET;
            default:
                throw new Error(`Unknown connection type: ${type}`);
        }
    }

    static getProtocolPrefix(type) {
        switch (type.toLowerCase()) {
            case ConnectionType.WEBSOCKET:
                return 'ws://';
            default:
                return '';
        }
    }

    static updatePorts(ports) {
        if (ports && typeof ports === 'object') {
            this.#ports = {
                ...this.#ports,
                ...ports
            };
        }
    }

    static getDefaultHost() {
        return this.#defaultHost;
    }

    static async fetchServerConfig(serverIP = this.#defaultHost) {
        try {
            const host = serverIP || this.#defaultHost;
            const response = await fetch(`http://${host}:${this.#ports.HTTP}/ip`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const config = await response.json();
            if (config.ports) {
                this.updatePorts(config.ports);
            }
            return config;
        } catch (error) {
            console.error('Error fetching server config:', error);
            return {
                ip: serverIP,
                ports: this.#ports
            };
        }
    }

    static validateHost(host) {
        const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        return hostnameRegex.test(host) || ipRegex.test(host);
    }
}

export default ConnectionFactory;