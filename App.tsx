import React, { useEffect, useRef } from 'react';
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
  const prevOrientationRef = useRef(orientation);
  const prevIsPlayingRef = useRef(isPlaying);

  // Apply orientation immediately when it changes
  useEffect(() => {
    const applyOrientation = () => {
      if (orientation === 'landscape') {
        Orientation.lockToLandscape();
      } else {
        Orientation.lockToPortrait();
      }
    };

    applyOrientation();

    // Also apply after a delay to handle transitions
    const timer = setTimeout(applyOrientation, 200);
    return () => clearTimeout(timer);
  }, [orientation]);

  // Re-apply orientation when game state changes
  useEffect(() => {
    const applyOrientation = () => {
      if (orientation === 'landscape') {
        Orientation.lockToLandscape();
      } else {
        Orientation.lockToPortrait();
      }
    };

    // Apply immediately
    applyOrientation();
    // Apply again after a short delay for transitions
    const timer1 = setTimeout(applyOrientation, 100);
    const timer2 = setTimeout(applyOrientation, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
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
