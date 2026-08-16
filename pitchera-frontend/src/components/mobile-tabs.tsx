import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const items = [
  {
    label: 'Dashboard',
    icon: 'grid-outline' as const,
    route: '/dashboard',
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

export function MobileTabs() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active =
          item.route === '/'
            ? pathname === '/'
            : pathname.startsWith(item.route);

        return (
          <Pressable
            key={item.route}
            onPress={() =>
              router.push(item.route as any)
            }
            style={styles.item}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={
                active
                  ? '#2563EB'
                  : '#94A3B8'
              }
            />

            <Text
              style={[
                styles.label,
                active && styles.activeLabel,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',

    left: 0,
    right: 0,
    bottom: 0,

    height: 70,

    backgroundColor: '#FFFFFF',

    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',

    flexDirection: 'row',
  },

  item: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    gap: 4,
  },

  label: {
    fontSize: 11,
    color: '#94A3B8',
  },

  activeLabel: {
    color: '#2563EB',
    fontWeight: '700',
  },
});