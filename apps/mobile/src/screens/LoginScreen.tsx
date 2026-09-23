import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../services/auth/auth-context';
import { getFriendlyErrorMessage, showAlert } from '../utils/alert';

// Tela de login (email/senha). A autenticação de fato acontece em
// AuthProvider (auth-context.tsx); esta tela só chama `login` e mostra
// erro (em popup, ver utils/alert.ts) /carregamento.
export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      showAlert('Não foi possível entrar', getFriendlyErrorMessage(err, 'Falha ao entrar.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FieldSync</Text>
      <Text style={styles.subtitle}>Entre com sua conta de pesquisador</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Senha"
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setIsPasswordVisible((v) => !v)} style={styles.toggleButton}>
          <Text style={styles.toggleButtonText}>{isPasswordVisible ? 'Ocultar' : 'Mostrar'}</Text>
        </TouchableOpacity>
      </View>

      {isSubmitting ? (
        <ActivityIndicator />
      ) : (
        <Button title="Entrar" onPress={handleSubmit} disabled={!email || !password} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleButton: {
    paddingHorizontal: 12,
  },
  toggleButtonText: {
    color: '#007aff',
    fontSize: 13,
    fontWeight: '600',
  },
});
