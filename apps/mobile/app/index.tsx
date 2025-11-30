import { Redirect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function Index() {
  // TODO: Check if user is authenticated
  const isAuthenticated = false;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/feed" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Campus Vibe</Text>
        <Text style={styles.subtitle}>
          Connect with your university community
        </Text>
      </View>

      <View style={styles.buttons}>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerText}>Create Account</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    padding: 24,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0284c7',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
  },
  loginButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  registerText: {
    color: '#0284c7',
    fontSize: 16,
    fontWeight: '600',
  },
});
