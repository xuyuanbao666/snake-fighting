import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';
import Orientation from 'react-native-orientation-locker';
import { store, RootState } from './src/store';
import { GameCanvas } from './src/components/GameCanvas';
import { GameOver } from './src/components/GameOver';
import { MenuScreen } from './src/components/MenuScreen';

function AppContent() {
  const { isPlaying, score, orientation } = useSelector((state: RootState) => state.game);

  // Lock orientation based on user preference - applies to ALL screens
  useEffect(() => {
    if (orientation === 'landscape') {
      Orientation.lockToLandscape();
    } else {
      Orientation.lockToPortrait();
    }
    // Re-apply on every render to prevent other components from overriding
    return () => {
      // Don't unlock on cleanup - keep the lock persistent
    };
  }, [orientation]);

  // Re-lock orientation when screen changes (menu -> game -> gameover)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (orientation === 'landscape') {
        Orientation.lockToLandscape();
      } else {
        Orientation.lockToPortrait();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isPlaying, score]);

  // Fullscreen during gameplay
  useEffect(() => {
    if (isPlaying) {
      StatusBar.setHidden(true, 'fade');
    } else {
      StatusBar.setHidden(false, 'fade');
    }
  }, [isPlaying]);

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
