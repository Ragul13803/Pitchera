import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function Login() {
  const handleLogin = () => {
    router.replace('/dashboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>
          Pitchera
        </Text>

        <Text style={styles.title}>
          Welcome back
        </Text>

        <Text style={styles.subtitle}>
          Login to your account
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
        />

        <Pressable
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>
            Login
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',

    alignItems: 'center',
    justifyContent: 'center',

    padding: 20,
  },

  card: {
    width: '100%',
    maxWidth: 420,

    padding: 32,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E7EB',

    borderRadius: 10,
  },

  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',

    textAlign: 'center',

    marginBottom: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',

    textAlign: 'center',
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 24,

    fontSize: 14,
    color: '#64748B',

    textAlign: 'center',
  },

  input: {
    height: 48,

    borderWidth: 1,
    borderColor: '#E2E8F0',

    borderRadius: 8,

    paddingHorizontal: 14,

    marginBottom: 14,

    color: '#111827',
  },

  loginButton: {
    height: 48,

    borderRadius: 8,

    backgroundColor: '#2563EB',

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 8,
  },

  loginButtonText: {
    color: '#FFFFFF',

    fontSize: 14,
    fontWeight: '700',
  },
});