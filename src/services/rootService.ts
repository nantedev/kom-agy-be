export interface EndpointInfo {
  method: string
  path: string
  description: string
}

export interface ApiInfo {
  name: string
  version: string
  endpoints: EndpointInfo[]
}

export const getApiInfo = (): ApiInfo => {
  return {
    name: 'kommit-backend',
    version: '1.0.0',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: "Documentation d'entrée de l'API",
      },
    ],
  }
}
