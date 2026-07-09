/**
 * @format
 */

jest.mock('react-native', () => {
  const React = require('react');
  const MockComponent = ({ children, ..._props }: any) => React.createElement('View', _props, children);
  return {
    StatusBar: MockComponent,
    StyleSheet: { create: (styles: any) => styles },
    useColorScheme: () => 'light',
    View: MockComponent,
    Text: MockComponent,
    TouchableOpacity: MockComponent,
    PanResponder: { create: () => ({ panHandlers: {} }) },
    Dimensions: { get: () => ({ width: 375, height: 812 }) },
    Share: { share: jest.fn() },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock('react-native-canvas', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((_props: any, _ref: any) => null),
  };
});

jest.mock('react-native-sound', () => {
  const MockSound = jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    stop: jest.fn(),
    release: jest.fn(),
    setVolume: jest.fn(),
  }));
  (MockSound as any).setCategory = jest.fn();
  return { __esModule: true, default: MockSound };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
