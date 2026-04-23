export interface AppConfig {
  port: number;
  clientOrigin: string;
}

export function getConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 4000),
    clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  };
}
