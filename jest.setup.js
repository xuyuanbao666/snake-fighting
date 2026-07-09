/* eslint-env jest */
jest.mock('react-native-canvas', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((_props, _ref) => null),
  };
});
