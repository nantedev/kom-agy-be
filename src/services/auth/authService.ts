import type { IncomingHttpHeaders } from 'node:http'
import type { Session } from '@/types/apiContract.js'

export const getSession = async (
  _headers?: IncomingHttpHeaders | Headers
): Promise<Session> => {
  return null
}
