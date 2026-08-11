import { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { MobileTabs } from './mobile-tabs';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 900;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {isDesktop && <Sidebar />}

        <View style={styles.main}>
          <TopBar />

          {/* Content Card */}
          <View style={styles.content}>
            {children}
          </View>
        </View>

        {!isDesktop && <MobileTabs />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  container: {
    flex: 1,
    flexDirection: 'row',
  },

  main: {
    flex: 1,
    minWidth: 0,
  },

  content: {
    flex: 1,

    minWidth: 0,

    marginRight: 10,
    marginBottom: 10,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E7EB',

    borderRadius: 10,

    overflow: 'hidden',
  },
});