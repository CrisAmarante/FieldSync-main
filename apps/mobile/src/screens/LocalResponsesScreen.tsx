import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LocalResponse, listLocalResponses } from '../services/responses/responses-repository';

// "Minhas coletas": lista as respostas já gravadas neste aparelho (qualquer
// status), agrupadas por pesquisa. Sincronizar não tem mais botão aqui —
// existe um único ponto de sincronização manual, na tela inicial
// (HomeScreen), para não duplicar a ação em dois lugares.
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  SYNCING: 'Sincronizando',
  SYNCED: 'Sincronizada',
  FAILED_MANUAL_REQUIRED: 'Falhou — toque em Sincronizar para tentar de novo',
  CONFLICT: 'Em conflito',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#b45309',
  SYNCING: '#2563eb',
  SYNCED: '#15803d',
  FAILED_MANUAL_REQUIRED: '#c0392b',
  CONFLICT: '#7c3aed',
};

interface Section {
  title: string;
  data: LocalResponse[];
}

function groupBySurvey(responses: LocalResponse[]): Section[] {
  const bySurvey = new Map<string, Section>();
  for (const response of responses) {
    const existing = bySurvey.get(response.surveyId);
    if (existing) {
      existing.data.push(response);
    } else {
      bySurvey.set(response.surveyId, { title: response.surveyTitle, data: [response] });
    }
  }
  return Array.from(bySurvey.values());
}

export function LocalResponsesScreen({
  onBack,
  onOpenResponse,
}: {
  onBack: () => void;
  onOpenResponse: (responseId: string) => void;
}) {
  const [responses, setResponses] = useState<LocalResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setResponses(await listLocalResponses());
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setIsLoading(false);
    })();
  }, [load]);

  const sections = useMemo(() => groupBySurvey(responses), [responses]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>{'< Voltar'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Minhas coletas</Text>
      </View>

      {isLoading ? (
        <Text style={styles.empty}>Carregando...</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma coleta registrada ainda.</Text>}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>
              {section.title} ({section.data.length})
            </Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => onOpenResponse(item.id)}>
              <View style={styles.cardRow}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] ?? '#666' }]} />
                <Text style={styles.cardStatus}>{STATUS_LABEL[item.status] ?? item.status}</Text>
              </View>
              <Text style={styles.cardMeta}>Coletado em {new Date(item.collectedAt).toLocaleString('pt-BR')}</Text>
              {item.lastError && <Text style={styles.cardError}>{item.lastError}</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48, paddingHorizontal: 16, gap: 12 },
  header: { gap: 4 },
  back: { color: '#2563eb' },
  title: { fontSize: 22, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#666', marginTop: 24 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  list: { paddingBottom: 24 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 6,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  cardStatus: { fontSize: 14, fontWeight: '600' },
  cardMeta: { fontSize: 12, color: '#666' },
  cardError: { fontSize: 12, color: '#c0392b' },
});
