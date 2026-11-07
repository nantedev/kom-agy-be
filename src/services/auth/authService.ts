import type { IncomingHttpHeaders } from 'node:http'
import { toApiError } from '@/services/auth/toApiError/toApiError.js'
import type { Session } from '@/types/apiContract.js'

export interface AuthRepository {
  getSession(headers: Headers): Promise<Session>
  handleRequest(request: Request): Promise<Response>
}

export type AuthRequestInput = {
  url: string
  method: string
  headers: IncomingHttpHeaders | Headers
  body?: unknown
}

export type AuthHttpResult = {
  status: number
  setCookies: string[]
  contentType: string
  body: string
}

export const toWebHeaders = (nodeHeaders?: IncomingHttpHeaders | Headers): Headers => {
  if (nodeHeaders instanceof Headers) {
    return new Headers(nodeHeaders)
  }

  const headers = new Headers()
  if (!nodeHeaders) {
    return headers
  }

  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item)
      }
    } else {
      headers.set(key, value)
    }
  }

  return headers
}

export const getSession = async (
  headers?: IncomingHttpHeaders | Headers,
  authRepo?: AuthRepository
): Promise<Session> => {
  if (!authRepo) {
    return null
  }

  return authRepo.getSession(toWebHeaders(headers))
}

export const forwardAuthRequest = async (
  input: AuthRequestInput,
  authRepo: AuthRepository
): Promise<AuthHttpResult> => {
  const webHeaders = toWebHeaders(input.headers)
  // La normalisation Zod (trim) peut modifier la taille du corps déjà lu par express.json().
  webHeaders.delete('content-length')

  const hasBody =
    input.method !== 'GET' && input.method !== 'HEAD' && input.body !== undefined

  if (hasBody) {
    webHeaders.set('content-type', 'application/json')
  }

  const webRequest = new Request(input.url, {
    method: input.method,
    headers: webHeaders,
    body: hasBody ? JSON.stringify(input.body) : undefined,
  })

  const response = await authRepo.handleRequest(webRequest)

  // Sur une erreur métier (doublon 422, identifiants invalides 401), Better Auth ne lève
  // rien : il renvoie lui-même une Response en échec qu'il faut intercepter et ré-emballer.
  if (!response.ok) {
    const rawText = await response.text()
    let parsedError: unknown = null

    if (rawText) {
      try {
        parsedError = JSON.parse(rawText)
      } catch {
        parsedError = { message: rawText }
      }
    }

    const errorPayload =
      typeof parsedError === 'object' && parsedError !== null
        ? { ...parsedError, status: response.status }
        : { status: response.status }

    const mappedError = toApiError(errorPayload, response.status)

    return {
      status: mappedError.status,
      setCookies: [],
      contentType: 'application/json',
      body: JSON.stringify(mappedError.body),
    }
  }

  return {
    status: response.status,
    setCookies: response.headers.getSetCookie(),
    contentType: response.headers.get('content-type') ?? 'application/json',
    body: await response.text(),
  }
}
