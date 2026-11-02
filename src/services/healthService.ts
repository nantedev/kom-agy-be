export interface HealthStatus {
  status: string
  uptime: number
  timestamp: string
}

export const getHealthStatus = (): HealthStatus => {
  return {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }
}
