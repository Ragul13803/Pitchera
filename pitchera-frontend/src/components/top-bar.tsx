import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function getTitle(pathname: string) {
  if (pathname === '/') {
    return 'Dashboard';
  }

  if (pathname.startsWith('/applied-jobs')) {
    return 'Applied Jobs';
  }

  if (pathname.startsWith('/profile')) {
    return 'Profile';
  }

  return 'Dashboard';
}

export function TopBar() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {getTitle(pathname)}
      </Text>

      <View style={styles.actions}>
        <Pressable style={styles.iconButton}>
          <Ionicons
            name="notifications-outline"
            size={21}
            color="#475569"
          />
        </Pressable>

        <Pressable
          style={styles.profile}
          onPress={() => router.push('/profile')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              JD
            </Text>
          </View>

          <View>
            <Text style={styles.name}>
              John Doe
            </Text>

            <Text style={styles.role}>
              Developer
            </Text>
          </View>
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

    // Makes the background/border respect the rounded corners
    overflow: 'hidden',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },

  iconButton: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: '#F8FAFC',

    alignItems: 'center',
    justifyContent: 'center',
  },

  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  avatar: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: '#DBEAFE',

    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },

  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },

  role: {
    marginTop: 2,
    fontSize: 11,
    color: '#94A3B8',
  },
});