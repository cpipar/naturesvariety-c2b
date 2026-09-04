# Nature's Variety — Where to Buy Partner Dashboard

Dashboard client en marque blanche, qui lit **directement le Google Sheet
`natures_variety_event_aggregates`** et se met à jour tout seul.

```
Export auto C2B ──► Google Sheet ──► Vercel (ce projet) ──► URL client
   (déjà en place)   (publié en CSV)   (relecture auto 15 min)
```

Pas de base de données, pas de serveur à administrer, pas de redéploiement quand
les données changent.

---

## Déploiement — les 4 étapes

Compte le temps : **30 à 40 minutes la première fois**, 2 minutes les suivantes.

### Étape 1 — Rendre le Sheet lisible par le dashboard

C'est la seule étape où l'on peut se tromper. Prends ton temps.

1. Ouvre le Sheet `natures_variety_event_aggregates`.
2. **Fichier → Partager → Publier sur le web**.
3. Premier menu déroulant : choisis **l'onglet précis** de l'export, pas
   « Document entier ».
4. Second menu : **Valeurs séparées par des virgules (.csv)**.
5. **Publier**, confirme, puis **copie l'URL**. Elle ressemble à
   `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv`
6. Mets-la de côté : c'est la valeur de `SHEET_CSV_URL` à l'étape 3.

> **Confidentialité.** « Publier sur le web » rend cette URL CSV accessible à qui
> la possède — elle n'est pas indexée, mais elle n'est pas secrète. Pour des
> stats de campagne c'est l'usage courant, et le dashboard lui-même est
> protégeable par mot de passe (étape 4). Si le client refuse toute publication,
> il faut passer par un compte de service Google Sheets API : dis-le moi, c'est
> une variante d'une demi-heure.

**Le piège à vérifier :** le dashboard lit **un seul onglet**. Assure-toi que
l'export automatique **ajoute ses lignes dans le même onglet** au fil du temps,
et ne crée pas un nouvel onglet par mois. Si c'est le cas, crée un onglet de
consolidation avec une formule du type

```
=QUERY({'Aout'!A2:AB; 'Septembre'!A2:AB}; "select * where Col1 is not null")
```

et publie **cet** onglet-là.

### Étape 2 — Mettre le projet sur GitHub

Crée d'abord un dépôt **vide et privé** sur github.com (bouton *New
repository*, sans README ni .gitignore).

Puis, dans un terminal, à la racine de ce dossier :

```bash
git init
git add .
git commit -m "Dashboard Where to Buy Nature's Variety"
git branch -M main
git remote add origin https://github.com/<ton-compte>/nv-wtb-dashboard.git
git push -u origin main
```

*Sans terminal :* sur github.com, *Add file → Upload files*, puis glisse tout le
contenu du dossier **sauf** `node_modules`, `.next` et `.env.local`.

### Étape 3 — Déployer sur Vercel

1. Va sur **vercel.com/new** et connecte-toi **avec GitHub**.
2. **Import** le dépôt que tu viens de créer.
3. Vercel reconnaît Next.js tout seul : ne touche à rien dans *Build settings*.
4. Déplie **Environment Variables** et ajoute :

| Nom | Valeur |
|---|---|
| `SHEET_CSV_URL` | l'URL CSV copiée à l'étape 1 |
| `CLIENT_NAME` | `Nature's Variety` |
| `CAMPAIGN_NAME` | `Grain-free range campaign · France` |
| `REVALIDATE_SECONDS` | `900` |

5. **Deploy**. Au bout d'une minute tu as une URL en `.vercel.app`.

> Après toute modification d'une variable d'environnement, il faut
> **redéployer** : onglet *Deployments* → `···` → *Redeploy*.

### Étape 4 — Protéger l'accès et mettre un domaine

**Mot de passe :** ajoute la variable `DASHBOARD_PASSWORD` et redéploie. Le
dashboard affiche alors un écran de connexion aux couleurs du client et retient
l'accès 30 jours. Pour révoquer un accès : change la valeur et redéploie.

**Domaine :** *Settings → Domains → Add*, par exemple
`nv-stats.click2buy.com`. Vercel affiche l'enregistrement DNS
(`CNAME → cname.vercel-dns.com`) à faire ajouter. Le HTTPS est automatique.

---

## Modifier le dashboard après déploiement

C'est l'intérêt principal de ce montage. Trois cas :

**Un libellé, une couleur, un bloc à déplacer** → modifie le fichier, puis :

```bash
git add .
git commit -m "Ajuste le libellé X"
git push
```

Vercel redéploie tout seul en une minute. L'URL ne change pas.

**Les données** → rien à faire. L'export écrit dans le Sheet, le dashboard suit.

**Le nom du client, le mot de passe, la fréquence de rafraîchissement** →
variables d'environnement Vercel, puis *Redeploy*.

---

## ⚠️ Le fichier à connaître : `lib/mapping.ts`

**Tout le vocabulaire de l'export est là, et nulle part ailleurs.** C'est le
fichier à ouvrir dès que tu connais le nom exact d'un événement.

Au 2 septembre 2026, l'export contient : `print`, `print_button`,
`print_retailers`, `geolocation`, `map_usage`. Sont donc alimentés :

| Métrique | État |
|---|---|
| Landing page visits | ✅ `print` + `landing` / `landing_category` |
| Where-to-buy button views | ✅ `print_button` |
| Widget openings | ✅ `print` + `widget` — **à confirmer** |
| Online redirections | ⏳ aucune action correspondante dans l'export |
| Store selections | ⏳ aucune action correspondante dans l'export |
| Engaged revenue | ⏳ dépend de `amount` sur les redirections |
| Widget internal actions | ⏳ dépend des noms d'onglets |

Pour ajouter un événement, il suffit de mettre son nom dans la bonne liste :

```ts
export const REDIRECTION = {
  actions: ['redirect', 'redirection', 'click_retailer'],  // ← ajouter ici
  mediums: [],
};
```

Les noms qui n'existent pas dans l'export sont **ignorés sans rien casser**, et
les blocs sans données se **masquent tout seuls**. Le dashboard ne montre jamais
un graphique vide au client.

Deux autres tables du même fichier valent le détour :

- `CATEGORY_NAMES` — pour remplacer « Category 1411 » par le vrai nom de la
  catégorie de la landing.
- `PRODUCT_NAMES` — pour remplacer « Product 12345 » par le nom du produit.

### Deux actions actuellement inutilisées

`geolocation` (14 événements) et `map_usage` (13 événements) ne servent à aucune
métrique pour l'instant. Si l'une des deux correspond en réalité à l'itinéraire
Google Maps, ajoute-la dans `STORE_SELECTION` et le KPI se remplira.

---

## Travailler en local (optionnel)

```bash
npm install
cp .env.example .env.local     # puis renseigner SHEET_CSV_URL
npm run dev                    # http://localhost:3000
```

Pour tester sans le Sheet, un extrait réel de l'export est fourni :

```bash
python3 -m http.server 8100     # dans ce dossier
# puis dans .env.local :
# SHEET_CSV_URL=http://127.0.0.1:8100/nv-export-sample.csv
```

---

## Si le dashboard affiche « The data is not available »

Le message sous le titre dit quoi corriger. Les trois causes classiques :

| Message | Cause | Correction |
|---|---|---|
| n'est pas lisible publiquement | Google renvoie une page de connexion | refaire l'étape 1 avec *Publier sur le web* |
| a répondu 404 | mauvais `SHEET_ID` ou `SHEET_GID` | vérifier l'ID et le gid de l'onglet |
| aucune ligne exploitable | mauvais onglet, ou en-têtes absents | publier l'onglet de l'export |

---

## Structure du projet

```
app/
  page.tsx              lit le Sheet, filtre la période, agrège, rend le dashboard
  globals.css           charte Nature's Variety + palettes de graphiques
  login/                écran de mot de passe
  api/login|logout/     pose et retire le cookie d'accès
lib/
  mapping.ts            ⚠️ LE fichier de configuration des événements
  sheet.ts              lecture et parsing du CSV Google Sheets
  aggregate.ts          calcul de tous les KPI et répartitions
  format.ts             formats de nombres, palettes, regroupement « Others »
components/
  Dashboard.tsx         composition de la page et sélecteurs locaux
  LineChart.tsx         courbes multi-séries, échelle qui se recale
  Donut.tsx             camemberts avec légende chiffrée
  BarList.tsx           barres classées
  PeriodFilter.tsx      filtre de période
middleware.ts           protection par mot de passe
nv-export-sample.csv    extrait réel de l'export, pour les tests en local
```

### Notes techniques

Aucune librairie de graphiques : tout est du SVG écrit à la main. Le site reste
très léger et il n'y a pas de dépendance à mettre à jour.

Les couleurs des graphiques ont été validées pour rester distinguables en cas de
daltonisme et suffisamment contrastées, en thème clair **comme** en thème sombre
— trois palettes distinctes : 5 teintes pour les courbes, 7 pour les camemberts,
une rampe orange pour les barres classées. Si tu changes ces couleurs, garde des
écarts francs en **luminosité** autant qu'en teinte.
