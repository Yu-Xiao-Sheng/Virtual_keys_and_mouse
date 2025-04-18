import React, { useState } from 'react';
import { Button, Radio } from 'antd';

const VirtualKeyboard = ({ onEvent }) => {
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [keySize, setKeySize] = useState('large'); // small, medium, large

  // 主键盘布局
  const mainKeyboardLayout = [
    ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', 'Enter'],
    ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Menu', 'Ctrl']
  ];

  // 功能键布局
  const functionKeys = [
    ['Insert', '', 'Home', '', 'PageUp'],
    ['Delete', '', 'End', '', 'PageDown']
  ];

  // 特殊键的宽度配置
  const specialKeyWidths = {
    'Backspace': '2',
    'Tab': '1.5',
    'CapsLock': '2',
    'Enter': '2.25',
    'Shift': '2.5',
    'Ctrl': '1.5',
    'Win': '1.25',
    'Alt': '1.25',
    'Space': '6.25'
  };

  // robotjs键名映射
  const keyMapping = {
    // 特殊键
    'Enter': 'enter',
    'Space': 'space',
    'Backspace': 'backspace',
    'Tab': 'tab',
    'CapsLock': 'caps_lock',
    'Shift': 'shift',
    'Ctrl': 'control',
    'Alt': 'alt',
    'Win': 'command',
    'Menu': 'menu',
    'Esc': 'escape',

    // 功能键
    'PageUp': 'page_up',
    'PageDown': 'page_down',
    'Home': 'home',
    'End': 'end',
    'Insert': 'insert',
    'Delete': 'delete',

    // 方向键
    '←': 'left',
    '→': 'right',
    '↑': 'up',
    '↓': 'down',

    // 功能键
    'F1': 'f1',
    'F2': 'f2',
    'F3': 'f3',
    'F4': 'f4',
    'F5': 'f5',
    'F6': 'f6',
    'F7': 'f7',
    'F8': 'f8',
    'F9': 'f9',
    'F10': 'f10',
    'F11': 'f11',
    'F12': 'f12',

    // 符号键
    '`': 'grave_accent',
    '-': 'minus',
    '=': 'equal',
    '[': 'open_bracket',
    ']': 'close_bracket',
    '\\': 'backslash',
    ';': 'semicolon',
    '\'': 'quote',
    ',': 'comma',
    '.': 'period',
    '/': 'forward_slash'
  };

  const handleKeyDown = (key) => {
    // 获取robotjs支持的键名
    const keyName = keyMapping[key] || key.toLowerCase();
    setPressedKeys(prev => new Set([...prev, keyName]));

    let eventData = {
      type: 'keyPress',
      key: keyName,
      modifier: []
    };

    // 处理修饰键
    if (pressedKeys.has('shift')) eventData.modifier.push('shift');
    if (pressedKeys.has('control')) eventData.modifier.push('control');
    if (pressedKeys.has('alt')) eventData.modifier.push('alt');
    if (pressedKeys.has('command')) eventData.modifier.push('command');

    onEvent(eventData);
  };

  const handleKeyUp = (key) => {
    const keyName = keyMapping[key] || key.toLowerCase();
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(keyName);
      return newSet;
    });
  };

  const getKeySizeClass = () => {
    switch (keySize) {
      case 'small': return 'key-size-small';
      case 'large': return 'key-size-large';
      default: return 'key-size-medium';
    }
  };

  const renderKey = (key, rowIndex, keyIndex) => {
    if (key === '') {
      return (
        <div key={`${rowIndex}-${keyIndex}`} className="key-row" style={{ width: '30px' }}></div>
      )
    }
    return (
      <Button
        key={`${rowIndex}-${keyIndex}`}
        className={`key ${pressedKeys.has(keyMapping[key] || key.toLowerCase()) ? 'pressed' : ''}`}
        data-width={specialKeyWidths[key] || '1'}
        onTouchStart={(e) => {
          e.preventDefault();
          handleKeyDown(key);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleKeyUp(key);
        }}
        onMouseDown={() => handleKeyDown(key)}
        onMouseUp={() => handleKeyUp(key)}
        onMouseLeave={() => {
          if (pressedKeys.has(keyMapping[key] || key.toLowerCase())) {
            handleKeyUp(key);
          }
        }}
      >
        {key}
      </Button>
    );
  }

  return (
    <div className="keyboard-container">
      <div className="keyboard-controls">
        <Radio.Group
          value={keySize}
          onChange={e => setKeySize(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="small">小</Radio.Button>
          <Radio.Button value="medium">中</Radio.Button>
          <Radio.Button value="large">大</Radio.Button>
        </Radio.Group>
      </div>
      <div className={`keyboard-layout ${getKeySizeClass()}`}>
        {/* 主键盘区域 */}
        {mainKeyboardLayout.map((row, rowIndex) => (
          <div key={`main-${rowIndex}`} className="key-row">
            {row.map((key, keyIndex) => renderKey(key, rowIndex, keyIndex))}
          </div>
        ))}

        {/* 功能键区域 */}
        <div style={{ marginTop: '12px' }}>
          {functionKeys.map((row, rowIndex) => (
            <div key={`func-${rowIndex}`} className="key-row">
              {row.map((key, keyIndex) => renderKey(key, rowIndex, keyIndex))}
            </div>
          ))}
        </div>

        {/* 方向键区域 */}
        <div className="arrow-keys">
          <Button className="key arrow-key up" onTouchStart={(e) => {
            e.preventDefault();
            handleKeyDown('↑');
          }} onTouchEnd={(e) => {
            e.preventDefault();
            handleKeyUp('↑');
          }}>↑</Button>
          <Button className="key arrow-key left" onTouchStart={(e) => {
            e.preventDefault();
            handleKeyDown('←');
          }} onTouchEnd={(e) => {
            e.preventDefault();
            handleKeyUp('←');
          }}>←</Button>
          <Button className="key arrow-key down" onTouchStart={(e) => {
            e.preventDefault();
            handleKeyDown('↓');
          }} onTouchEnd={(e) => {
            e.preventDefault();
            handleKeyUp('↓');
          }}>↓</Button>
          <Button className="key arrow-key right" onTouchStart={(e) => {
            e.preventDefault();
            handleKeyDown('→');
          }} onTouchEnd={(e) => {
            e.preventDefault();
            handleKeyUp('→');
          }}>→</Button>
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;