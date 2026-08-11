import { StyleSheet, Text, View } from 'react-native';

export default function AppliedJobsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Applied Jobs</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F7F8FA',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },
});