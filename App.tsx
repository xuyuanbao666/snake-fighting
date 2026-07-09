import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './src/store';
import { GameCanvas } from './src/components/GameCanvas';
import { GameOver } from './src/components/GameOver';
import { MenuScreen } from './src/components/MenuScreen';
import { ScoreBoard } from './src/components/ScoreBoard';

function AppContent() {
  const { isPlaying, score } = useSelector((state: RootState) => state.game);

  if (isPlaying) {
    return (
      <View style={styles.gameContainer}>
        <ScoreBoard />
        <GameCanvas />
      </View>
    );
  }

  if (score > 0) {
    return <GameOver />;
  }

  return <MenuScreen />;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
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
  gameContainer: {
    flex: 1,
  },
});

export default App;
