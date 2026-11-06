# Inventaire des tests : KOM-06 (Authentification · backend)

### 1. Cas nominaux : création, connexion, déconnexion

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM8 | Création du compte sur `/sign-up/email` avec prénom, email libre et mot de passe valide, et connexion automatique via cookie de session (`credentials: true`, `trustedOrigins`) | 🔴 | Le comportement vérifié est celui de Better Auth, de Prisma et du branchement HTTP/CORS (écriture en base, pose du cookie et maintien de la session en cross-origin). Le mocker reviendrait à mocker ce qu'on veut vérifier. | Manuel (smoke) |
| RM12 | Connexion d'un utilisateur existant sur `/sign-in/email` avec email et mot de passe corrects, et ouverture de la session par cookie | 🔴 | Le contrôle du hash de mot de passe et la création de la session reposent entièrement sur Better Auth et la base réelle. | Manuel (smoke) |
| RM5 | Fermeture effective de la session et invalidation du cookie lors d'un appel à `/sign-out` par un utilisateur connecté | 🔴 | L'invalidation de la session en base et l'effacement du cookie sont exécutés par Better Auth sur la route native `/sign-out`. | Manuel (smoke) |

### 2. Valeurs refusées

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM10 | Refus d'un signup avec un email mal formé ou un mot de passe hors bornes (< 8 ou > 128 caractères) | 🟢 | La validation est portée par notre schéma Zod côté serveur avant la création du compte. C'est du code à nous, pur et déterministe en mémoire. | Unitaire, test-first |
| RM11 | Refus d'un signup sans prénom (`name` manquant ou vide) | 🟢 | Le contrôle de présence du champ `name` est exécuté par notre schéma Zod, testable directement en mémoire sans dépendance externe. | Unitaire, test-first |
| RM20 | Refus d'un signup dont le prénom ne contient que des espaces, avec le même rejet que RM11 | 🟢 | Le retrait des espaces (`trim`) suivi du contrôle de non-vacuité sur `name` fait partie de notre schéma Zod. | Unitaire, test-first |

### 3. Unicité de l'email

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM9 | Refus d'un signup avec un email déjà utilisé en renvoyant `EMAIL_ALREADY_EXISTS` (et jamais 500, y compris sur violation de contrainte `UNIQUE`) | 🟠 | La conversion de l'erreur de doublon (Better Auth ou contrainte `UNIQUE` Prisma) vers `ApiError` avec le code `EMAIL_ALREADY_EXISTS` est du code à nous (testable en unitaire en mockant l'erreur), mais la forme réelle renvoyée par Better Auth / Prisma lors d'un doublon n'est confirmée par aucun smoke nominal. | Unitaire (mapping) + smoke manuel |
| RM21 | Normalisation de l'email (`trim` + mise en minuscules) avant validation et contrôle d'unicité (` MARC@x.com ` ramené à `marc@x.com`) | 🟢 | La transformation de l'email en minuscules et sans espaces autour est exécutée par notre schéma Zod avant d'appeler Better Auth. Le rejet du doublon une fois l'email normalisé est déjà couvert par RM9. | Unitaire, test-first |

### 4. Gestion des erreurs et pannes

| Règle | Ce qu'on vérifie | Testable unitaire ? | Pourquoi | Comment |
|---|---|---|---|---|
| RM13 | Réponse `INVALID_CREDENTIALS` lors d'un signin avec un email inconnu ou un mot de passe erroné | 🟠 | Le ré-emballage de l'erreur d'authentification Better Auth en `ApiError` (`INVALID_CREDENTIALS` + message en français) est notre logique (testable en unitaire), mais la forme exacte de l'erreur émise par Better Auth sur `/sign-in/email` doit être confirmée par un essai réel. | Unitaire (mapping) + smoke manuel |
| RM18, RM19 | Conversion de toute erreur non reconnue ou panne (5xx, timeout, exception imprévue) en `INTERNAL_ERROR` (500) sans fuite d'erreur brute, tout en préservant les codes des erreurs métier (4xx) | 🟢 | Le branchement par défaut de notre gestionnaire d'erreurs (`toApiError` / `errorHandler`) qui sépare les `ApiError` métier connues des erreurs inconnues rabattues sur `INTERNAL_ERROR` est du code à nous, testable en isolant la fonction avec des erreurs simulées. | Unitaire, test-first |
| RM2 | Réponse 401 quand une requête atteint une route protégée sans session active | 🟢 | Notre middleware de protection appelle `getSession` et prend la décision `null` vers 401 (`ApiError`) ou session valide vers `next()`. En mockant le retour de `getSession`, on teste directement cette décision. | Unitaire, test-first |

---

## Récapitulatif

### 1. Test unitaire automatisé (→ `unit-test-writer`)
- **RM10** : validation Zod du format de l'email et de la longueur du mot de passe (minimum 8, maximum 128 caractères).
- **RM11** : validation Zod refusant un prénom (`name`) manquant ou vide.
- **RM20** : `trim` du prénom dans le schéma Zod et refus d'un prénom composé uniquement d'espaces comme dans RM11.
- **RM21** : normalisation de l'email (`trim` + mise en minuscules) par le schéma Zod avant traitement.
- **RM18, RM19** : conversion des pannes et erreurs non reconnues en `INTERNAL_ERROR` (500) par notre couche d'erreurs, distincte des erreurs métier qui conservent leur code et leur statut 4xx.
- **RM2** : décision du middleware de protection de route (`null` renvoyé par `getSession` → réponse 401, session présente → passage au handler suivant).

### 2. Couverture partielle : unitaire + smoke manuel (🟠)
- **RM9** :
  - **Unitaire** : mapping d'une erreur de doublon d'email (réponse/erreur Better Auth et violation `UNIQUE` de Prisma) vers `ApiError` avec le code `EMAIL_ALREADY_EXISTS` et un statut 4xx (jamais 500).
  - **Smoke manuel à faire** : appeler `POST /api/auth/sign-up/email` 2 fois avec le même email (dont 1 variante avec majuscules/espaces comme ` MARC@x.com `) contre le serveur démarré et vérifier que le 2e appel renvoie bien `EMAIL_ALREADY_EXISTS` et non une erreur brute ou un 500.
- **RM13** :
  - **Unitaire** : mapping d'une erreur d'identifiants invalides de Better Auth vers `ApiError` avec le code `INVALID_CREDENTIALS` et son message en français.
  - **Smoke manuel à faire** : appeler `POST /api/auth/sign-in/email` avec un mauvais mot de passe (puis un email inexistant) contre le serveur démarré et vérifier que la réponse ressort bien au format `ApiError` avec le code `INVALID_CREDENTIALS`.

### 3. Vérification manuelle uniquement (→ `smoke-test-writer`)
- **RM8** : `POST /api/auth/sign-up/email` avec un prénom, un email neuf et un mot de passe valide crée le compte en base, pose le cookie de session (avec en-tête `Origin` du front accepté par CORS/`trustedOrigins`) et connecte automatiquement l'utilisateur (confirmé par `GET /api/auth/get-session`).
- **RM12** : `POST /api/auth/sign-in/email` avec les identifiants d'un compte existant pose le cookie de session et `GET /api/auth/get-session` renvoie l'utilisateur connecté.
- **RM5** : `POST /api/auth/sign-out` avec le cookie de session actif ferme la session, et un appel suivant à `GET /api/auth/get-session` confirme qu'il n'y a plus de session active.
