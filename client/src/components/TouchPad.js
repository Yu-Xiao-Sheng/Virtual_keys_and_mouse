import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button, Slider } from 'antd';

// 节流函数
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

const TouchPad = ({ onEvent }) => {
  const [sensitivity, setSensitivity] = useState(8);
  const touchpadRef = useRef(null);
  const [lastTouch, setLastTouch] = useState(null);
  const [isTapping, setIsTapping] = useState(false);
  const [tapTimeout, setTapTimeout] = useState(null);
  const [lastTapTime, setLastTapTime] = useState(0);

  // 处理触摸开始
  const handleTouchStart = (e) => {
    const target = e.target;
    
    // 确保事件发生在触摸板区域内
    if (touchpadRef.current && touchpadRef.current.contains(target)) {
      e.stopPropagation();  // 阻止事件冒泡
      
      // 检测双指触摸
      if (e.touches.length === 2) {
        setIsTapping(true);
        setLastTouch({
          time: Date.now(),
          isTwoFingers: true
        });
        return;
      }

      // 单指触摸
      const touch = e.touches[0];
      setLastTouch({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        isTwoFingers: false
      });
      setIsTapping(true);
    }
  };

  // 创建节流后的事件发送函数
  const throttledSendEvent = useCallback(
    throttle((deltaX, deltaY) => {
      onEvent({
        type: 'mouseMove',
        deltaX: deltaX * sensitivity,
        deltaY: deltaY * sensitivity
      });
    }, 16), // 约60fps的更新频率
    [onEvent, sensitivity]
  );

  const handleSensitivityChange = (value) => {
    setSensitivity(value);
  };

  // 处理触摸移动
  const handleTouchMove = (e) => {
    if (!lastTouch || e.touches.length === 2) return; // 双指触摸时不处理移动

    const touch = e.touches[0];
    const target = e.target;
    
    // 确保事件发生在触摸板区域内
    if (touchpadRef.current && touchpadRef.current.contains(target)) {
      e.stopPropagation();  // 阻止事件冒泡
      const deltaX = touch.clientX - lastTouch.x;
      const deltaY = touch.clientY - lastTouch.y;

      // 使用节流函数发送事件
      throttledSendEvent(deltaX, deltaY);

      setLastTouch({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        isTwoFingers: false
      });
      setIsTapping(false);
    }
  };

  // 处理触摸结束
  const handleTouchEnd = (e) => {
    if (!lastTouch) return;

    const target = e.target;

    // 确保事件发生在触摸板区域内
    if (touchpadRef.current && touchpadRef.current.contains(target)) {
      e.stopPropagation();  // 阻止事件冒泡
      const now = Date.now();
      const tapDuration = now - lastTouch.time;

      // 检测是否为点击（短触摸）
      if (isTapping && tapDuration < 200) {
        if (lastTouch.isTwoFingers) {
          // 双指点击 - 触发右键点击
          onEvent({
            type: 'mouseClick',
            button: 'right',
            double: false
          });
        } else {
          // 单指点击 - 检测双击
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
      <div className="touchpad-settings" style={{
        padding: '10px 20px',
        borderBottom: '1px solid #d9d9d9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>灵敏度：</span>
          <Slider
            min={0.5}
            max={8}
            step={0.2}
            value={sensitivity}
            onChange={handleSensitivityChange}
            style={{ flex: 1 }}
            marks={{
              0.5: '0.5x',
              2: '2x',
              4: '4x',
              6: '6x',
              8: '8x'
            }}
            tooltip={{
              formatter: value => `${value}x`
            }}
          />
        </div>
      </div>
      <div
        ref={touchpadRef}
        className="touchpad-area"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          height: 'calc(100% - 110px)', // 调整高度以适应设置区域
          background: '#f0f0f0',
          borderRadius: '8px 8px 0 0'
        }}
      />
      <div
        className="touchpad-buttons"
        style={{
          height: '60px', // 增加按钮区域高度
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 20px',
          alignItems: 'center',
          borderTop: '1px solid #d9d9d9'
        }}
      >
        <Button size="large" onClick={() => handleMouseButton('left')}>左键</Button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button size="large" onClick={() => handleScroll('up')} style={{ width: '50px', height: '40px' }}>↑</Button>
          <Button size="large" onClick={() => handleScroll('down')} style={{ width: '50px', height: '40px' }}>↓</Button>
        </div>
        <Button size="large" onClick={() => handleMouseButton('right')}>右键</Button>
      </div>
    </div>
  );
};

export default TouchPad;