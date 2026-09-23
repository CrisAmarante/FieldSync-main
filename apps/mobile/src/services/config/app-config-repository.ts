import { getDatabase } from '../../database';

// Leitura de configurações do app persistidas na tabela `app_config` do
// SQLite local, caindo para os valores padrão da spec quando ainda não
// configuradas.
// Valores padrão documentados na spec (4.6/4.8) para as chaves de app_config.
const DEFAULTS: Record<string, string> = {
  mobile_retention_days: '7',
  storage_warning_threshold_percent: '80',
  sync_retry_interval_minutes: '60',
  sync_max_auto_retries: '3',
};

export async function getAppConfigNumber(key: keyof typeof DEFAULTS): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_config WHERE key = ?',
    [key],
  );
  return Number(row?.value ?? DEFAULTS[key]);
}
