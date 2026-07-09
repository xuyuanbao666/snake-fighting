import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './src/store';
import { GameCanvas } from './src/components/GameCanvas';
import { GameOver } from './src/components/GameOver';
import { MenuScreen } from './src/components/MenuScreen';
import { THEME_COLORS } from './src/utils/constants';

function AppContent() {
  const { isPlaying, score, theme } = useSelector((state: RootState) => state.game);
  const colors = THEME_COLORS[theme];

  if (isPlaying) {
    return <GameCanvas />;
  }

  if (score > 0) {
    return <GameOver />;
  }

  return <MenuScreen />;
}

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.container}>
          <AppContent />
        </View>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
});

export default App;
