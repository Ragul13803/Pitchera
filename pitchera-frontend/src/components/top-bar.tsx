import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from './ui/Avatar';
import { useDeviceType } from '@/hooks/useDeviceType';

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
};

function getTitle(pathname: string) {
  if (pathname === '/') {
    return 'Dashboard';
  }

  if (pathname.startsWith('/applied-jobs')) {
    return 'Applied Jobs List';
  }

  if (pathname.startsWith('/profile')) {
    return 'Profile';
  }

  return 'Dashboard';
}

export function TopBar() {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);

  const {
    isMobile,
    isTablet,
    isDesktop,
  } = useDeviceType();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('pitchera_user');

        if (!storedUser) {
          return;
        }

        const parsedUser: User = JSON.parse(storedUser);

        console.log('TopBar user:', parsedUser);
        console.log('TopBar avatarUrl:', parsedUser.avatarUrl);

        setUser(parsedUser);
      } catch (error) {
        console.error(
          'Failed to load pitchera_user:',
          error
        );
      }
    };

    loadUser();
  }, []);

  const fullName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : 'User';

  return (
    <View
      style={[
        styles.container,
        isMobile && styles.mobileContainer,
        isTablet && styles.tabletContainer,
        isDesktop && styles.desktopContainer,
      ]}
    >
      {/* Page Title */}
      <Text
        style={[
          styles.title,
          isMobile && styles.mobileTitle,
        ]}
        numberOfLines={1}
      >
        {getTitle(pathname)}
      </Text>

      {/* Right Actions */}
      <View
        style={[
          styles.actions,
          isMobile && styles.mobileActions,
        ]}
      >
        {/* Notifications */}
        <Pressable
          style={[
            styles.iconButton,
            isMobile && styles.mobileIconButton,
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={isMobile ? 19 : 21}
            color="#475569"
          />
        </Pressable>

        {/* Profile */}
        <Pressable
          style={[
            styles.profile,
            isMobile && styles.mobileProfile,
          ]}
          onPress={() => router.push('/profile')}
        >
          {/* Google Profile Image */}
          <View
  style={[
    styles.avatar,
    isMobile && styles.mobileAvatar,
  ]}
>
  {user?.avatarUrl ? (
    <Avatar
      uri={user.avatarUrl}
      size={isMobile ? 36 : 38}
    />
  ) : (
    <Ionicons
      name="person"
      size={isMobile ? 19 : 21}
      color="#2563EB"
    />
  )}
</View>

          {/* User Information - hidden on mobile */}
          {!isMobile && (
            <View style={styles.userInfo}>
              <Text
                style={styles.name}
                numberOfLines={1}
              >
                {fullName}
              </Text>

              <Text
                style={styles.role}
                numberOfLines={1}
              >
                {user?.email ?? ''}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 72,

    paddingHorizontal: 28,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,

    marginVertical: 10,
    marginRight: 10,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    overflow: 'hidden',
  },

  mobileContainer: {
    height: 60,
    paddingHorizontal: 14,

    marginVertical: 6,
    marginRight: 6,
  },

  tabletContainer: {
    paddingHorizontal: 20,
  },

  desktopContainer: {
    paddingHorizontal: 28,
  },

  title: {
    flexShrink: 1,

    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  mobileTitle: {
    fontSize: 17,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },

  mobileActions: {
    gap: 10,
  },

  iconButton: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: '#F8FAFC',

    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileIconButton: {
    width: 36,
    height: 36,

    borderRadius: 18,
  },

  profile: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 10,
  },

  mobileProfile: {
    gap: 0,
  },

  avatar: {
    width: 38,
    height: 38,

    borderRadius: 20,

    backgroundColor: '#DBEAFE',

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',
  },

  mobileAvatar: {
    width: 36,
    height: 36,

    borderRadius: 18,
  },

  userInfo: {
    flexShrink: 1,
  },

  name: {
    maxWidth: 140,

    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },

  role: {
    maxWidth: 160,

    marginTop: 2,

    fontSize: 11,
    color: '#94A3B8',
  },
});