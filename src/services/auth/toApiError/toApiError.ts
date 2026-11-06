import type { ApiError } from '@/types/apiContract.js'

export type HttpApiError = {
  status: number
  body: ApiError
}

export const toApiError = (_error: unknown, _defaultStatus?: number): HttpApiError => {
  return {
    status: 0,
    body: {
      code: 'INTERNAL_ERROR',
      message: '',
    },
  }
}
