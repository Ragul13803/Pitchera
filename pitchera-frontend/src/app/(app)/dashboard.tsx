import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function Dashboard() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>
        Welcome back, John
      </Text>

      <View style={styles.card}>
        <Text>Dashboard content goes here</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 28,
    paddingBottom: 100,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  card: {
    marginTop: 24,

    padding: 24,

    borderRadius: 16,

    backgroundColor: '#FFFFFF',
  },
});