import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';
import Orientation from 'react-native-orientation-locker';
import { store, RootState } from './src/store';
import { GameCanvas } from './src/components/GameCanvas';
import { GameOver } from './src/components/GameOver';
import { MenuScreen } from './src/components/MenuScreen';
import { THEME_COLORS } from './src/utils/constants';

function AppContent() {
  const { isPlaying, score, theme, orientation } = useSelector((state: RootState) => state.game);

  useEffect(() => {
    if (orientation === 'landscape') {
      Orientation.lockToLandscape();
    } else {
      Orientation.lockToPortrait();
    }
  }, [orientation]);

  useEffect(() => {
    if (isPlaying) {
      // Hide status bar during gameplay (fullscreen)
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
