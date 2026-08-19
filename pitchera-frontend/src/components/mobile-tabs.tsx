import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const items = [
  {
    label: 'Dashboard',
    icon: 'grid-outline' as const,
    route: '/dashboard',
  },
  {
    label: 'Applications',
    icon: 'briefcase-outline' as const,
    route: '/applications',
  },
  {
    label: 'Profile',
    icon: 'person-outline' as const,
    route: '/profile',
  },
];

export function MobileTabs() {
  const pathname = usePathname();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
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
              color={active ? colors.primary : colors.textSecondary}
            />

            <Text
              style={[
                styles.label,
                { color: active ? colors.primary : colors.textSecondary },
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

    borderTopWidth: 1,

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
  },

  activeLabel: {
    fontWeight: '700',
  },
});