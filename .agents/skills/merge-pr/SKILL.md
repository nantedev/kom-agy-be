---
name: merge-pr
description: "Merge la PR de la branche courante, puis passe le ticket Notion de DOING à TO TEST. Fait ces deux choses, et rien d'autre. Utiliser quand l'utilisateur dit 'merge la PR', 'merge-pr', 'merge cette PR', 'on merge', après que la PR a été ouverte et relue."
---

## Entrée

- La **PR de la branche courante** (celle ouverte par `open-pr` vers `dev`), que l'utilisateur veut merger maintenant.
- Le **ticket Notion associé**, déduit du nom de branche (`ID-\d+`), à passer en `TO TEST`.

## Sortie

- La **confirmation du merge**, sous forme de l'**URL de la PR** menant vers l'écran de confirmation du merge.
- La **confirmation que le ticket est passé en `TO TEST`**.

---

## Base Notion (autonome : ne dépend d'aucun autre skill)

- **Base** : Board CCE / Kommit V4
- **Page ID** : `d1c2fbc6-d207-83d7-8bda-018052c9b51f`
- **Data Source ID** : `collection://d042fbc6-d207-83de-aaab-873647656bc7`
- **Propriété ID ticket** : `Ticket ID` (texte, ex. `KOM-06`)
- **Propriété statut** : `Agile Statut` → option cible `TO TEST`

## ⛔️ Garde-fou merge (NON négociable)

La règle Git du repo interdit tout merge sans accord explicite **pour cette PR précise**.

- **L'invocation de ce skill PAR L'UTILISATEUR vaut accord ponctuel pour CE merge-là, et lui seul.**
- Ne jamais déclencher ce skill de toi-même, ni l'enchaîner sur plusieurs PR. 1 seul `merge-pr` = 1 seule PR mergée.
- Au moindre doute sur le fait que l'utilisateur veut merger maintenant → demander avant, ne pas merger.

## Étapes

1. **Merger la PR courante.** `gh pr view --json number,url,state` pour la récupérer. Si aucune PR n'est ouverte pour la branche → stop, le dire. Sinon `gh pr merge --merge --delete-branch`. Si la PR n'est pas mergeable (conflits, checks rouges) → **stop**, expliquer pourquoi, ne pas forcer.
2. **Passer le ticket en `TO TEST`.**
   - Identifier le ticket depuis le nom de branche : extraire le token `KOM-\d+` (ex. `KOM-06-AUTHENTIFICATION` → `KOM-06`), chercher dans le Board le ticket dont `Ticket ID` (texte) vaut ce token exact. Charger l'outil Notion si besoin (`notion-update-page`).
   - Mettre à jour `Agile Statut` → option `TO TEST`.
   - Si le ticket est introuvable ou ambigu → le dire, **sans bloquer** (le merge a réussi) ; ne jamais deviner au hasard.

## Restitution

1 ligne, dans l'ordre des étapes réussies. Ex :
```
✅ PR #42 mergée (branche supprimée) → ticket KOM-06 en TO TEST
```
Si 1 étape est sautée (ticket introuvable…), le dire explicitement sur la même ligne.

## Anti-patterns

- ❌ Merger sans que l'utilisateur ait invoqué le skill pour CETTE PR.
- ❌ Enchaîner sur une 2e PR dans la foulée.
- ❌ Forcer un merge sur une PR avec conflits ou checks rouges.
- ❌ Passer le ticket en `DONE` : rien n'est validé, il va en `TO TEST`.
- ❌ Bloquer toute la commande si le ticket est introuvable : le merge prime, signaler et finir.
