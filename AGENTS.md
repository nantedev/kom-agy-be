# Kommit Backend

API backend du projet Kommit, développée avec Node.js, Express, TypeScript (v6), Prisma et PostgreSQL.

## Arborescence

```
src/
├── index.ts          # démarrage du serveur : lit la config, écoute. Rien d'autre.
├── app.ts            # assemblage de l'app Express. Ne connaît aucune route.
├── config/           # configuration (variables d'environnement…)
├── middlewares/      # middlewares Express (404, erreurs, validation d'entrée…)
├── routes/           # déclaration des routes. Aucun corps de handler.
├── controllers/      # les handlers : lire la requête, appeler un service, répondre.
├── services/         # la logique métier. Ne connaît ni Express, ni req, ni res.
└── repositories/     # l'accès aux données. Implémente les interfaces de repository des services.
```
