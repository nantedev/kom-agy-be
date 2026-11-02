export interface DbHealthRepository {
  ping(): Promise<void>
}

export interface DbHealthResult {
  status: 'ok' | 'error'
  latencyMs?: number
  error?: string
}

export const checkDbHealth = async (
  dbRepo: DbHealthRepository
): Promise<DbHealthResult> => {
  const startTime = performance.now()
  try {
    await dbRepo.ping()
    const latencyMs = Math.round(performance.now() - startTime)
    return {
      status: 'ok',
      latencyMs,
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Database unreachable',
    }
  }
}
