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
      {
        method: 'GET',
        path: '/health',
        description: 'État du processus',
      },
      {
        method: 'GET',
        path: '/db-health',
        description: 'État de la base de données',
      },
      {
        method: 'POST',
        path: '/api/auth/sign-up/email',
        description: "Création d'un compte et ouverture de session",
      },
      {
        method: 'POST',
        path: '/api/auth/sign-in/email',
        description: 'Connexion par email et mot de passe',
      },
      {
        method: 'POST',
        path: '/api/auth/sign-out',
        description: 'Déconnexion et fermeture de session',
      },
      {
        method: 'GET',
        path: '/api/auth/get-session',
        description: "Session de l'utilisateur courant",
      },
    ],
  }
}
