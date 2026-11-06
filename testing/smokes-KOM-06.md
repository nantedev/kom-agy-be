# Smokes manuels : KOM-06 (Authentification · backend)

> ⚠️ **Test-first** : ces scénarios sont écrits **avant** l'implémentation à partir du ticket et du contrat d'API (`src/types/apiContract.ts`). Ils s'exécutent **à la main après l'implémentation**, contre le serveur backend démarré (`pnpm dev`) et la base PostgreSQL réelle.
>
> **Note sur `AUTH_BASE_URL`** : les commandes `curl` ci-dessous utilisent `AUTH_BASE_URL="http://localhost:3000/api/auth"` (préfixe standard de Better Auth repris dans l'inventaire). Si Better Auth est monté directement à la racine (`http://localhost:3000`), remplacer `AUTH_BASE_URL` en conséquence : un statut HTTP `404` sur le 1er appel signifierait que le préfixe de montage diffère, pas que la logique métier échoue.

### 1. Cas nominaux : création, connexion, déconnexion

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM8 | 🔴 | Création du compte sur `/sign-up/email` avec prénom, email libre et mot de passe valide, et connexion automatique via cookie de session (`credentials: true`, `trustedOrigins`) | Scénario RM8 : Signup valide et connexion automatique |
| RM12 | 🔴 | Connexion d'un utilisateur existant sur `/sign-in/email` avec email et mot de passe corrects, et ouverture de la session par cookie | Scénario RM12 : Signin valide et ouverture de session |
| RM5 | 🔴 | Fermeture effective de la session et invalidation du cookie lors d'un appel à `/sign-out` par un utilisateur connecté | Scénario RM5 : Signout et fermeture de session |

#### Scénario RM8 : Signup valide et connexion automatique

> ✅ **Ce qu'on vérifie :**
> - La soumission de `/sign-up/email` avec un prénom (`name`), un email non utilisé et un mot de passe valide (8 à 128 caractères) crée le compte en base et connecte automatiquement l'utilisateur via un cookie de session (`SameSite=Lax`) utilisable depuis l'origine du front (`http://localhost:5173`).
> - Pourquoi à la main : le comportement vérifié est celui de Better Auth, de Prisma et du branchement HTTP/CORS (écriture en base, pose du cookie et maintien de la session en cross-origin). Le mocker reviendrait à mocker ce qu'on veut vérifier.

**Préconditions :**
- Serveur backend lancé (`pnpm dev` sur `http://localhost:3000`) et base PostgreSQL accessible avec les tables d'authentification migrées.
- Aucun compte existant en base avec l'email `alice@example.com`.

**Étapes :**

1. Créer le compte via `/sign-up/email` en simulant l'origine du front et en enregistrant les cookies dans `/tmp/kom-cookies.txt` :
   ```bash
   AUTH_BASE_URL="http://localhost:3000/api/auth"
   rm -f /tmp/kom-cookies.txt

   curl -i -c /tmp/kom-cookies.txt \
     -X POST "$AUTH_BASE_URL/sign-up/email" \
     -H "Origin: http://localhost:5173" \
     -H "Content-Type: application/json" \
     -d '{"name":"Alice","email":"alice@example.com","password":"Password123!"}'
   ```

2. Vérifier que la session est immédiatement ouverte en appelant `/get-session` avec le cookie reçu :
   ```bash
   curl -i -b /tmp/kom-cookies.txt \
     -X GET "$AUTH_BASE_URL/get-session" \
     -H "Origin: http://localhost:5173"
   ```

**Résultat attendu :**
- **Étape 1** : statut HTTP `200`, en-têtes CORS présents (`Access-Control-Allow-Origin: http://localhost:5173`, `Access-Control-Allow-Credentials: true`), et en-tête `Set-Cookie` posant le cookie de session Better Auth (`HttpOnly`, `SameSite=Lax`).
- **Étape 2** : statut HTTP `200`, corps JSON conforme au type `Session` du contrat contenant `user` :
  ```json
  {
    "user": {
      "id": "<id non vide>",
      "name": "Alice",
      "email": "alice@example.com"
    }
  }
  ```

- [ ] Scénario RM8 exécuté et validé

---

#### Scénario RM12 : Signin valide et ouverture de session

> ✅ **Ce qu'on vérifie :**
> - La soumission de `/sign-in/email` avec l'email et le mot de passe corrects d'un utilisateur existant l'authentifie et ouvre sa session par cookie.
> - Pourquoi à la main : le contrôle du hash de mot de passe et la création de la session reposent entièrement sur Better Auth et la base réelle.

**Préconditions :**
- Serveur backend lancé sur `http://localhost:3000`.
- Le compte `alice@example.com` (mot de passe `Password123!`, prénom `Alice`) existe en base (créé au scénario RM8).
- Fichier `/tmp/kom-cookies.txt` supprimé pour repartir sans session locale.

**Étapes :**

1. Se connecter via `/sign-in/email` et enregistrer le cookie de session dans `/tmp/kom-cookies.txt` :
   ```bash
   AUTH_BASE_URL="http://localhost:3000/api/auth"
   rm -f /tmp/kom-cookies.txt

   curl -i -c /tmp/kom-cookies.txt \
     -X POST "$AUTH_BASE_URL/sign-in/email" \
     -H "Origin: http://localhost:5173" \
     -H "Content-Type: application/json" \
     -d '{"email":"alice@example.com","password":"Password123!"}'
   ```

2. Lire la session courante via `/get-session` avec ce cookie :
   ```bash
   curl -i -b /tmp/kom-cookies.txt \
     -X GET "$AUTH_BASE_URL/get-session" \
     -H "Origin: http://localhost:5173"
   ```

**Résultat attendu :**
- **Étape 1** : statut HTTP `200`, en-têtes CORS `Access-Control-Allow-Origin: http://localhost:5173` et `Access-Control-Allow-Credentials: true`, et en-tête `Set-Cookie` posant le cookie de session (`HttpOnly`, `SameSite=Lax`).
- **Étape 2** : statut HTTP `200`, corps JSON contenant `user` avec `id`, `"name": "Alice"` et `"email": "alice@example.com"`.

- [ ] Scénario RM12 exécuté et validé

---

#### Scénario RM5 : Signout et fermeture de session

> ✅ **Ce qu'on vérifie :**
> - L'appel à `/sign-out` par un utilisateur connecté ferme sa session en base et invalide son cookie de session.
> - Pourquoi à la main : l'invalidation de la session en base et l'effacement du cookie sont exécutés par Better Auth sur la route native `/sign-out`.

**Préconditions :**
- Serveur backend lancé sur `http://localhost:3000`.
- Une session active est présente dans `/tmp/kom-cookies.txt` (issue du scénario RM12).

**Étapes :**

1. Appeler `/sign-out` en envoyant et mettant à jour le fichier de cookies `/tmp/kom-cookies.txt` :
   ```bash
   AUTH_BASE_URL="http://localhost:3000/api/auth"

   curl -i -b /tmp/kom-cookies.txt -c /tmp/kom-cookies.txt \
     -X POST "$AUTH_BASE_URL/sign-out" \
     -H "Origin: http://localhost:5173"
   ```

2. Vérifier que la session est bien fermée en rappelant `/get-session` :
   ```bash
   curl -i -b /tmp/kom-cookies.txt \
     -X GET "$AUTH_BASE_URL/get-session" \
     -H "Origin: http://localhost:5173"
   ```

**Résultat attendu :**
- **Étape 1** : statut HTTP `200`, en-tête `Set-Cookie` vidant ou expirant le cookie de session (`Max-Age=0` ou valeur vide).
- **Étape 2** : statut HTTP `200`, corps de réponse `null` (état non connecté du type `Session` dans `src/types/apiContract.ts`).

- [ ] Scénario RM5 exécuté et validé

### 2. Valeurs refusées

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM10 | 🟢 | Refus d'un signup avec un email mal formé ou un mot de passe hors bornes (< 8 ou > 128 caractères) | aucun smoke, couvert en unitaire |
| RM11 | 🟢 | Refus d'un signup sans prénom (`name` manquant ou vide) | aucun smoke, couvert en unitaire |
| RM20 | 🟢 | Refus d'un signup dont le prénom ne contient que des espaces, avec le même rejet que RM11 | aucun smoke, couvert en unitaire |

### 3. Unicité de l'email

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM9 | 🟠 | Refus d'un signup avec un email déjà utilisé en renvoyant `EMAIL_ALREADY_EXISTS` (et jamais 500, y compris sur violation de contrainte `UNIQUE`) | Scénario RM9 : Signup avec un email déjà utilisé (`EMAIL_ALREADY_EXISTS`) |
| RM21 | 🟢 | Normalisation de l'email (`trim` + mise en minuscules) avant validation et contrôle d'unicité (` MARC@x.com ` ramené à `marc@x.com`) | aucun smoke, couvert en unitaire |

#### Scénario RM9 : Signup avec un email déjà utilisé (`EMAIL_ALREADY_EXISTS`)

> ✅ **Ce qu'on vérifie :**
> - Un 2e signup avec un email déjà utilisé (identique ou avec majuscules et espaces comme ` ALICE@example.com `) est rejeté avec un statut 4xx et une `ApiError` portant `"code": "EMAIL_ALREADY_EXISTS"`, sans créer de doublon et sans jamais renvoyer `500` ni l'erreur brute de Better Auth.
> - Pourquoi à la main : la conversion de l'erreur de doublon (Better Auth ou contrainte `UNIQUE` Prisma) vers `ApiError` avec le code `EMAIL_ALREADY_EXISTS` est du code à nous (testable en unitaire en mockant l'erreur), mais la forme réelle renvoyée par Better Auth / Prisma lors d'un doublon n'est confirmée par aucun smoke nominal.

**Préconditions :**
- Serveur backend lancé sur `http://localhost:3000`.
- Le compte `alice@example.com` existe déjà en base (créé au scénario RM8).

**Étapes :**

1. Soumettre un signup avec l'email exact déjà pris (`alice@example.com`) :
   ```bash
   AUTH_BASE_URL="http://localhost:3000/api/auth"

   curl -i -X POST "$AUTH_BASE_URL/sign-up/email" \
     -H "Origin: http://localhost:5173" \
     -H "Content-Type: application/json" \
     -d '{"name":"Alice Bis","email":"alice@example.com","password":"Password123!"}'
   ```

2. Soumettre un signup avec le même email entouré d'espaces et en majuscules (` ALICE@example.com `) :
   ```bash
   curl -i -X POST "$AUTH_BASE_URL/sign-up/email" \
     -H "Origin: http://localhost:5173" \
     -H "Content-Type: application/json" \
     -d '{"name":"Alice Bis","email":" ALICE@example.com ","password":"Password123!"}'
   ```

**Résultat attendu :**
- **Étapes 1 et 2** : statut HTTP 4xx (jamais `500`), aucun en-tête `Set-Cookie` de session, et corps JSON au format `ApiError` du contrat :
  ```json
  {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Un compte avec cet email existe déjà"
  }
  ```
  *(Vérifier que `code` vaut bien `"EMAIL_ALREADY_EXISTS"` et non le code interne Better Auth `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`.)*

- [ ] Scénario RM9 exécuté et validé

### 4. Gestion des erreurs et pannes

| Règle | Inventaire | Ce qu'on vérifie | Scénario |
|---|---|---|---|
| RM13 | 🟠 | Réponse `INVALID_CREDENTIALS` lors d'un signin avec un email inconnu ou un mot de passe erroné | Scénario RM13 : Signin avec identifiants incorrects (`INVALID_CREDENTIALS`) |
| RM18, RM19 | 🟢 | Conversion de toute erreur non reconnue ou panne (5xx, timeout, exception imprévue) en `INTERNAL_ERROR` (500) sans fuite d'erreur brute, tout en préservant les codes des erreurs métier (4xx) | aucun smoke, couvert en unitaire |
| RM2 | 🟢 | Réponse 401 quand une requête atteint une route protégée sans session active | aucun smoke, couvert en unitaire |

#### Scénario RM13 : Signin avec identifiants incorrects (`INVALID_CREDENTIALS`)

> ✅ **Ce qu'on vérifie :**
> - Un appel à `/sign-in/email` avec un mot de passe erroné ou un email inconnu renvoie un statut 4xx et une `ApiError` portant `"code": "INVALID_CREDENTIALS"` avec un message générique en français qui ne distingue pas l'email faux du mot de passe faux.
> - Pourquoi à la main : le ré-emballage de l'erreur d'authentification Better Auth en `ApiError` (`INVALID_CREDENTIALS` + message en français) est notre logique (testable en unitaire), mais la forme exacte de l'erreur émise par Better Auth sur `/sign-in/email` doit être confirmée par un essai réel.

**Préconditions :**
- Serveur backend lancé sur `http://localhost:3000`.
- Le compte `alice@example.com` existe en base avec le mot de passe `Password123!`.
- Aucun compte n'existe en base pour `inconnu@example.com`.

**Étapes :**

1. Appeler `/sign-in/email` avec l'email existant mais un mot de passe faux :
   ```bash
   AUTH_BASE_URL="http://localhost:3000/api/auth"

   curl -i -X POST "$AUTH_BASE_URL/sign-in/email" \
     -H "Origin: http://localhost:5173" \
     -H "Content-Type: application/json" \
     -d '{"email":"alice@example.com","password":"MauvaisPassword123!"}'
   ```

2. Appeler `/sign-in/email` avec un email qui n'existe pas en base :
   ```bash
   curl -i -X POST "$AUTH_BASE_URL/sign-in/email" \
     -H "Origin: http://localhost:5173" \
     -H "Content-Type: application/json" \
     -d '{"email":"inconnu@example.com","password":"Password123!"}'
   ```

**Résultat attendu :**
- **Étapes 1 et 2** : statut HTTP 4xx (`401`), aucun cookie de session posé, et corps JSON strictement identique dans les 2 cas au format `ApiError` :
  ```json
  {
    "code": "INVALID_CREDENTIALS",
    "message": "<message générique en français>"
  }
  ```
  *(Vérifier que `code` vaut `"INVALID_CREDENTIALS"` et que le `message` en français est identique entre l'étape 1 et l'étape 2, sans révéler si l'erreur porte sur l'email ou sur le mot de passe.)*

- [ ] Scénario RM13 exécuté et validé
