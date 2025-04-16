import React, { useRef, useState, useEffect } from 'react';
import { Button } from 'antd';

const TouchPad = ({ onEvent }) => {
  const touchpadRef = useRef(null);
  const [lastTouch, setLastTouch] = useState(null);
  const [isTapping, setIsTapping] = useState(false);
  const [tapTimeout, setTapTimeout] = useState(null);
  const [lastTapTime, setLastTapTime] = useState(0);

  // 处理触摸开始
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setLastTouch({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setIsTapping(true);
  };

  // 处理触摸移动
  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!lastTouch) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - lastTouch.x;
    const deltaY = touch.clientY - lastTouch.y;

    // 发送鼠标移动事件
    onEvent({
      type: 'mouseMove',
      deltaX: deltaX * 2, // 调整灵敏度
      deltaY: deltaY * 2
    });

    setLastTouch({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setIsTapping(false);
  };

  // 处理触摸结束
  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (!lastTouch) return;

    const now = Date.now();
    const tapDuration = now - lastTouch.time;

    // 检测是否为点击（短触摸）
    if (isTapping && tapDuration < 200) {
      // 检测双击
      if (now - lastTapTime < 300) {
        onEvent({
          type: 'mouseClick',
          button: 'left',
          double: true
        });
        setLastTapTime(0);
      } else {
        // 单击
        onEvent({
          type: 'mouseClick',
          button: 'left',
          double: false
        });
        setLastTapTime(now);
      }
    }

    setLastTouch(null);
    setIsTapping(false);
  };

  // 处理鼠标按钮点击
  const handleMouseButton = (button) => {
    onEvent({
      type: 'mouseClick',
      button,
      double: false
    });
  };

  // 处理滚轮事件
  const handleScroll = (direction) => {
    onEvent({
      type: 'mouseScroll',
      x: 0,
      y: direction === 'up' ? 1 : -1
    });
  };

  return (
    <div className="touchpad-container">
      <div
        ref={touchpadRef}
        className="touchpad-area"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          height: 'calc(100% - 50px)',
          background: '#f0f0f0',
          borderRadius: '8px 8px 0 0'
        }}
      />
      <div
        className="touchpad-buttons"
        style={{
          height: '50px',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 20px',
          alignItems: 'center',
          borderTop: '1px solid #d9d9d9'
        }}
      >
        <Button onClick={() => handleMouseButton('left')}>左键</Button>
        <div>
          <Button onClick={() => handleScroll('up')} style={{ marginRight: '8px' }}>↑</Button>
          <Button onClick={() => handleScroll('down')}>↓</Button>
        </div>
        <Button onClick={() => handleMouseButton('right')}>右键</Button>
      </div>
    </div>
  );
};

export default TouchPad;