try {
  process.loadEnvFile()
} catch {
  // Pas de fichier .env (variables injectées par l'environnement en prod ou CI).
}

const port = Number(process.env.PORT) || 3000

export const config = {
  port,
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? `http://localhost:${port}`,
  betterAuthSecret: process.env.BETTER_AUTH_SECRET,
}
