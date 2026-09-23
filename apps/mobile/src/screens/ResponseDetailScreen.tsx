import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LocalResponseDetail, getLocalResponseDetail } from '../services/responses/responses-repository';
import { getCachedSchemaByVersionId } from '../services/surveys/surveys-repository';
import { SchemaQuestion } from '../services/surveys/schema-types';

// Detalhe de uma coleta local específica: junta a resposta salva no SQLite
// com o schema em cache (para mostrar o label de cada pergunta, não só o
// id interno) — respostas, localização e status de sincronização.
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  SYNCING: 'Sincronizando',
  SYNCED: 'Sincronizada',
  FAILED_MANUAL_REQUIRED: 'Falhou — sincronize novamente',
  CONFLICT: 'Em conflito',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#b45309',
  SYNCING: '#2563eb',
  SYNCED: '#15803d',
  FAILED_MANUAL_REQUIRED: '#c0392b',
  CONFLICT: '#7c3aed',
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function ResponseDetailScreen({
  responseId,
  onBack,
}: {
  responseId: string;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<LocalResponseDetail | null>(null);
  const [questionById, setQuestionById] = useState<Record<string, SchemaQuestion>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const found = await getLocalResponseDetail(responseId);
      setDetail(found);
      if (found) {
        const schema = await getCachedSchemaByVersionId(found.surveyVersionId);
        if (schema) {
          const map: Record<string, SchemaQuestion> = {};
          for (const section of schema.sections) {
            for (const question of section.questions) map[question.id] = question;
          }
          setQuestionById(map);
        }
      }
      setIsLoading(false);
    })();
  }, [responseId]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Carregando...</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>{'< Voltar'}</Text>
        </TouchableOpacity>
        <Text style={styles.empty}>Coleta não encontrada.</Text>
      </View>
    );
  }

  const answerEntries = Object.entries(detail.answers);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[detail.status] ?? '#666' }]}>
        <Text style={styles.statusText}>{STATUS_LABEL[detail.status] ?? detail.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Coletado em</Text>
        <Text style={styles.value}>{new Date(detail.collectedAt).toLocaleString('pt-BR')}</Text>
      </View>

      {detail.syncedAt && (
        <View style={styles.section}>
          <Text style={styles.label}>Sincronizado em</Text>
          <Text style={styles.value}>{new Date(detail.syncedAt).toLocaleString('pt-BR')}</Text>
        </View>
      )}

      {detail.respondentId && (
        <View style={styles.section}>
          <Text style={styles.label}>Entrevistado</Text>
          <Text style={styles.value}>{detail.respondentId}</Text>
        </View>
      )}

      {detail.latitude != null && detail.longitude != null && (
        <View style={styles.section}>
          <Text style={styles.label}>Localização</Text>
          <Text style={styles.value}>
            {detail.latitude.toFixed(5)}, {detail.longitude.toFixed(5)}
            {detail.accuracy != null && ` (±${detail.accuracy}m)`}
          </Text>
        </View>
      )}

      {detail.lastError && (
        <View style={styles.section}>
          <Text style={styles.label}>Última mensagem</Text>
          <Text style={[styles.value, styles.error]}>{detail.lastError}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Respostas</Text>
      {answerEntries.map(([questionId, value]) => (
        <View key={questionId} style={styles.answerRow}>
          <Text style={styles.answerLabel}>{questionById[questionId]?.label ?? questionId}</Text>
          <Text style={styles.value}>{formatValue(value)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48, paddingHorizontal: 16 },
  content: { paddingBottom: 32, gap: 12 },
  back: { color: '#2563eb', marginBottom: 8 },
  empty: { textAlign: 'center', color: '#666', marginTop: 24 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  statusText: { color: '#fff', fontWeight: '600' },
  section: { gap: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  label: { fontSize: 12, color: '#666' },
  value: { fontSize: 14 },
  error: { color: '#c0392b' },
  answerRow: { borderBottomWidth: 1, borderBottomColor: '#e5e5e5', paddingBottom: 8, gap: 2 },
  answerLabel: { fontSize: 12, color: '#666' },
});
