import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../services/auth/auth-context';
import { getSyncStatus, subscribeSyncStatus, SyncStatusSnapshot } from '../services/sync/sync-status';
import { syncPendingResponses } from '../services/sync/sync-repository';
import { refreshPendingCount } from '../services/sync/auto-sync';
import { getFriendlyErrorMessage, showAlert } from '../utils/alert';

// Tela inicial após o login: atalhos para as demais telas e, abaixo do
// cabeçalho, os indicadores de estado do app — última sincronização,
// online/offline e um botão para sincronizar manualmente com o servidor.
// Substitui a antiga listra verde/laranja no topo (SyncStatusBadge, removida
// de App.tsx) e o botão de diagnóstico "Verificar sessão".
interface HomeScreenProps {
  onOpenSurveys: () => void;
  onOpenResponses: () => void;
}

function formatLastSync(iso: string | null): string {
  if (!iso) return 'Nunca sincronizado';
  return new Date(iso).toLocaleString('pt-BR');
}

export function HomeScreen({ onOpenSurveys, onOpenResponses }: HomeScreenProps) {
  const { user, logout } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatusSnapshot>(getSyncStatus());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => subscribeSyncStatus(setSyncStatus), []);

  useEffect(() => {
    NetInfo.fetch().then((state) => setIsOnline(!!state.isConnected && state.isInternetReachable !== false));
    return NetInfo.addEventListener((state) =>
      setIsOnline(!!state.isConnected && state.isInternetReachable !== false),
    );
  }, []);

  async function handleSyncNow() {
    if (!isOnline) {
      showAlert('Sem conexão', 'Conecte-se a uma rede para sincronizar.');
      return;
    }
    try {
      const summary = await syncPendingResponses();
      await refreshPendingCount();
      const status = getSyncStatus();
      showAlert(
        status.surveysSyncFailed ? 'Sincronização concluída com pendência' : 'Sincronização concluída',
        // Em caso de falha ao atualizar o catálogo de pesquisas, o aviso
        // completo (com "Pesquisas: não foi possível atualizar a lista.")
        // já está em status.lastMessage — sem isto, o usuário via só o
        // resumo de respostas e achava que tudo tinha sincronizado.
        status.lastMessage ??
          `Sincronizadas: ${summary.synced + summary.alreadySynced} · Conflitos: ${summary.conflicts} · Falhas: ${summary.failed}`,
      );
    } catch (err) {
      showAlert('Falha ao sincronizar', getFriendlyErrorMessage(err, 'Não foi possível sincronizar agora.'));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FieldSync</Text>
      <Text style={styles.subtitle}>
        Bem-vindo(a), {user?.name} ({user?.role})
      </Text>

      <View style={styles.statusPanel}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: isOnline ? '#15803d' : '#c0392b' }]} />
          <Text style={styles.statusLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: syncStatus.isSyncing
                  ? '#2563eb'
                  : syncStatus.surveysSyncFailed || syncStatus.pendingCount > 0
                    ? '#b45309'
                    : '#15803d',
              },
            ]}
          />
          <Text style={styles.statusLabel}>
            {syncStatus.isSyncing
              ? 'Sincronizando...'
              : syncStatus.surveysSyncFailed
                ? `Pesquisas desatualizadas — última tentativa: ${formatLastSync(syncStatus.lastSyncAt)}`
                : `Última sincronização: ${formatLastSync(syncStatus.lastSyncAt)}`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.syncButton, syncStatus.isSyncing && styles.syncButtonDisabled]}
          onPress={handleSyncNow}
          disabled={syncStatus.isSyncing}
        >
          <Text style={styles.syncButtonText}>
            {syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar Serviço'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />
      <TouchableOpacity style={styles.navButton} onPress={onOpenSurveys}>
        <Text style={styles.navButtonText}>Ver pesquisas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navButton} onPress={onOpenResponses}>
        <Text style={styles.navButtonText}>Minhas coletas</Text>
      </TouchableOpacity>
      <View style={styles.spacer} />
      <TouchableOpacity style={styles.logoutButton} onPress={() => logout()}>
        <Text style={styles.logoutButtonText}>Sair</Text>
      </TouchableOpacity>
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
  statusPanel: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 13,
    color: '#333',
  },
  syncButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  navButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#c0392b',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  spacer: {
    height: 24,
  },
});
