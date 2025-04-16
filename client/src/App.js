import React, { useState, useEffect, useRef } from 'react';
import { Layout, message, Input, Button, Space, Alert } from 'antd';
import VirtualKeyboard from './components/VirtualKeyboard';
import TouchPad from './components/TouchPad';
import ConnectionFactory, { ConnectionType } from './utils/ConnectionFactory';
import './App.css';

const { Header, Content } = Layout;

const App = () => {
  const [connected, setConnected] = useState(false);
  const [serverIP, setServerIP] = useState(ConnectionFactory.getDefaultHost());
  const [connecting, setConnecting] = useState(false);
  const [touchpadVisible, setTouchpadVisible] = useState(true);
  const [latency, setLatency] = useState(0);
  const connectionRef = useRef(null);

  // 获取服务器配置
  useEffect(() => {
    const fetchServerConfig = async () => {
      try {
        const config = await ConnectionFactory.fetchServerConfig(serverIP);
        if (config && config.ip && config.ip !== 'localhost') {
          setServerIP(config.ip);
        }
      } catch (error) {
        console.error('Error fetching server config:', error);
      }
    };

    fetchServerConfig();
  }, []);

  const connectToServer = async () => {
    if (connecting) return;
    
    setConnecting(true);
    try {
      // 先获取最新的服务器配置
      await ConnectionFactory.fetchServerConfig(serverIP);
      
      // 使用连接工厂创建连接实例
      const connection = ConnectionFactory.createConnection(ConnectionType.WEBSOCKET, serverIP);
      
      connection.onConnected = () => {
        setConnected(true);
        setConnecting(false);
        message.success('已连接到服务器');
      };

      connection.onDisconnected = () => {
        setConnected(false);
        setConnecting(false);
        message.error('与服务器断开连接');
      };

      connection.onError = (error) => {
        console.error('连接错误:', error);
        setConnecting(false);
        message.error('连接错误，请检查服务器IP地址是否正确');
      };

      // 设置延迟更新回调
      connection.onLatencyUpdate = (newLatency) => {
        setLatency(Math.round(newLatency));
      };

      connection.connect();
      connectionRef.current = connection;
    } catch (error) {
      console.error('连接失败:', error);
      setConnecting(false);
      message.error('连接失败，请检查服务器IP地址是否正确');
    }
  };

  const disconnectFromServer = () => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
      setConnected(false);
    }
  };

  const sendEvent = (event) => {
    if (connectionRef.current && connected) {
      try {
        connectionRef.current.queueEvent(event);
      } catch (error) {
        console.error('发送事件错误:', error);
        message.error('发送命令失败');
      }
    } else {
      message.warning('未连接到服务器');
    }
  };

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const contentRef = useRef(null);

  // 处理触摸开始
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
    setTouchEnd(e.touches[0].clientY);
  };

  // 处理触摸移动
  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientY);
    if (contentRef.current) {
      const delta = touchStart - e.touches[0].clientY;
      contentRef.current.scrollTop += delta;
      setTouchStart(e.touches[0].clientY);
    }
  };

  const toggleTouchpad = () => {
    setTouchpadVisible(!touchpadVisible);
  };

  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.disconnect();
      }
    };
  }, []);

  const getLatencyClass = () => {
    if (latency < 50) return 'latency-good';
    if (latency < 100) return 'latency-medium';
    return 'latency-high';
  };

  return (
    <Layout className="app-container">
      <Header className="header">
        <h1>虚拟输入控制器</h1>
        {connected && (
          <div className={`latency-display ${getLatencyClass()}`}>
            延迟: {latency}ms
          </div>
        )}
      </Header>
      <Content
        className="content"
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="connection-panel">
          <Space>
            <Input
              placeholder="服务器地址"
              value={serverIP}
              onChange={(e) => setServerIP(e.target.value)}
              disabled={connected}
              style={{ width: 200 }}
              addonBefore="ws://"
              addonAfter=":8080"
            />
            <Button
              type={connected ? "danger" : "primary"}
              onClick={connected ? disconnectFromServer : connectToServer}
              loading={connecting}
            >
              {connected ? "断开连接" : "连接服务器"}
            </Button>
            {connected && (
              <Button
                type="default"
                onClick={toggleTouchpad}
              >
                {touchpadVisible ? "收起触控板" : "展开触控板"}
              </Button>
            )}
          </Space>
        </div>
        
        {connected ? (
          <div className="control-container">
            {touchpadVisible && (
              <div className="touchpad-wrapper">
                <TouchPad onEvent={sendEvent} />
              </div>
            )}
            <div className="keyboard-wrapper">
              <VirtualKeyboard onEvent={sendEvent} />
            </div>
          </div>
        ) : (
          <Alert
            message="未连接到服务器"
            description={
              <div>
                <p>请输入服务器地址并点击连接按钮</p>
                <p>默认地址：{ConnectionFactory.getDefaultHost()}</p>
                <p>WebSocket端口：8080</p>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginTop: 20 }}
          />
        )}
      </Content>
    </Layout>
  );
};

export default App;