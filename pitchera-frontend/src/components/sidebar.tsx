import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const menuItems = [
  {
    label: 'Dashboard',
    icon: 'grid-outline' as const,
    route: '/',
  },
  {
    label: 'Applied Jobs',
    icon: 'briefcase-outline' as const,
    route: '/applied-jobs',
  },
  {
    label: 'Profile',
    icon: 'person-outline' as const,
    route: '/profile',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      <Text style={styles.logo}>
        JobPortal
      </Text>

      <View style={styles.menu}>
        {menuItems.map((item) => {
          const isActive =
            item.route === '/'
              ? pathname === '/'
              : pathname.startsWith(item.route);

          return (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={[
                styles.menuItem,
                isActive && styles.menuItemActive,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={
                  isActive
                    ? '#2563EB'
                    : '#64748B'
                }
              />

              <Text
                style={[
                  styles.menuText,
                  isActive && styles.menuTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.bottom}>
        <Text style={styles.version}>
          v1.0.0
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: '#FFFFFF',

    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',

    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 20,

    justifyContent: 'space-between',
  },

  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',

    paddingHorizontal: 12,
    marginBottom: 32,
  },

  menu: {
    gap: 6,
  },

  menuItem: {
    minHeight: 48,

    borderRadius: 10,

    paddingHorizontal: 12,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 12,
  },

  menuItemActive: {
    backgroundColor: '#EFF6FF',
  },

  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },

  menuTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  bottom: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    paddingHorizontal: 12,
  },

  version: {
    fontSize: 12,
    color: '#94A3B8',
  },
});