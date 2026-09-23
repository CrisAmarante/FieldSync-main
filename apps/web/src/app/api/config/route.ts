import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';

// Escrito por apps/mobile/docker-entrypoint.sh a cada início do serviço
// `mobile`, com o IP do Tailscale resolvido naquele momento — montado aqui
// só leitura via volume `tailscale_ip_export` (ver docker-compose.dev.yml).
const SHARED_IP_PATH = '/shared-ip/tailscale-ip';
const DEFAULT_METRO_PORT = '8081';

// Config pública, lida em tempo de execução (nunca em build) — necessário
// porque o build do Web roda em standalone e as variáveis passadas via
// `environment:` do docker-compose só existem no container em runtime, não
// no momento do `next build`. Usado pela aba de Sessões para renderizar o
// QR code de pareamento do Expo (ver EXPO_DEV_SERVER_URL no .env.example).
export async function GET() {
  return NextResponse.json({
    expoDevServerUrl: await resolveExpoDevServerUrl(),
  });
}

// Prioriza o IP resolvido automaticamente (sempre atual, ver
// docker-entrypoint.sh) sobre o valor fixo de EXPO_DEV_SERVER_URL — que fica
// desatualizado sempre que o nó do Tailscale muda de IP. Cai de volta
// silenciosamente para EXPO_DEV_SERVER_URL se o arquivo não existir (ex:
// fora do docker-compose.dev.yml, ou serviço `mobile` ainda não resolveu o
// IP), assim como o próprio docker-entrypoint.sh faz.
async function resolveExpoDevServerUrl(): Promise<string | null> {
  try {
    const ip = (await readFile(SHARED_IP_PATH, 'utf-8')).trim();
    if (ip) {
      const port = process.env.EXPO_DEV_SERVER_URL?.match(/:(\d+)$/)?.[1] ?? DEFAULT_METRO_PORT;
      return `exp://${ip}:${port}`;
    }
  } catch {
    // arquivo ausente/ilegível — segue para o fallback abaixo.
  }
  return process.env.EXPO_DEV_SERVER_URL || null;
}
