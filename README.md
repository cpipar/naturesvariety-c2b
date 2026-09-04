# Nature's Variety — Where to Buy Partner Dashboard

Dashboard client en marque blanche, qui lit le Google Sheet
`natures_variety_event_aggregates` **via l'API Google Sheets** et se met à jour
tout seul.

```
Export auto C2B ──► Google Sheet ──► Vercel (ce projet) ──► URL client
   (déjà en place)     (privé)       (API Sheets, cache 15 min)
```

Le Sheet reste **privé** : il est simplement partagé en lecture avec un compte
de service Google. Pas de base de données, pas de serveur à administrer, pas de
redéploiement quand les données changent.

---

## Configuration — deux variables

Tout tient dans deux variables d'environnement :

| Variable | Contenu |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | la clé du compte de service, **JSON complet** |
| `GOOGLE_SHEET_ID` | l'identifiant du Sheet, entre `/d/` et `/edit` dans son URL |

Le modèle complet, avec les options, est dans **`.env.example`**.

---

## Déploiement — les 4 étapes

Compte **20 à 30 minutes la première fois**, 2 minutes les suivantes.

### Étape 1 — Créer le compte de service et lui donner accès au Sheet

C'est la seule étape où l'on peut se tromper. Prends ton temps.

1. Va sur **console.cloud.google.com**, crée un projet (ou réutilise celui de
   l'équipe).
2. **APIs & Services → Library**, cherche **Google Sheets API**, clique
   **Enable**. *Sans cette activation, toute lecture répond 403.*
3. **IAM & Admin → Service Accounts → Create service account**. Un nom suffit
   (`nv-dashboard`), aucun rôle IAM n'est nécessaire.
4. Ouvre le compte créé → onglet **Keys** → **Add key → Create new key → JSON**.
   Un fichier se télécharge : c'est la valeur de `GOOGLE_SERVICE_ACCOUNT_JSON`.
5. Ouvre ce fichier, copie la valeur de **`client_email`** (elle ressemble à
   `nv-dashboard@mon-projet.iam.gserviceaccount.com`).
6. Ouvre le Sheet `natures_variety_event_aggregates` → **Partager** → colle
   cette adresse → droit **Lecteur** → **Envoyer**.
7. Dans l'URL du Sheet, copie la chaîne entre `/d/` et `/edit` : c'est
   `GOOGLE_SHEET_ID`.

> **Le fichier JSON est un secret.** Il ne va jamais dans Git — `.gitignore`
> l'exclut déjà. Uniquement dans `.env.local` en local, et dans les variables
> d'environnement chiffrées de Vercel.

**Le piège à vérifier :** le dashboard lit **un seul onglet**. Assure-toi que
l'export automatique **ajoute ses lignes dans le même onglet** au fil du temps,
et ne crée pas un nouvel onglet par mois. Si c'est le cas, crée un onglet de
consolidation avec une formule du type

```
=QUERY({'Aout'!A2:AB; 'Septembre'!A2:AB}; "select * where Col1 is not null")
```

et pointe `GOOGLE_SHEET_TAB` sur **cet** onglet-là.

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
| `GOOGLE_SERVICE_ACCOUNT_JSON` | tout le contenu du fichier JSON de l'étape 1 |
| `GOOGLE_SHEET_ID` | l'identifiant copié à l'étape 1 |
| `CLIENT_NAME` | `Nature's Variety` |
| `CAMPAIGN_NAME` | `Grain-free range campaign · France` |
| `REVALIDATE_SECONDS` | `900` |

Colle le JSON tel quel, accolades comprises, dans le champ *Value* de Vercel :
les retours à la ligne y sont acceptés. Si un outil intermédiaire les abîme,
encode la clé en base64 — le dashboard accepte les deux formats :

```bash
base64 -i cle-du-compte-de-service.json | tr -d '\n'
```

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

**Les données** → rien à faire. L'export écrit dans le Sheet, le dashboard suit
au bout de `REVALIDATE_SECONDS`.

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

## Travailler en local

```bash
npm install
cp .env.example .env.local     # puis renseigner les deux variables Google
npm run dev                    # http://localhost:3000
```

Le fichier `nv-export-sample.csv` est un extrait réel de l'export : il sert de
référence pour les noms de colonnes quand tu ajustes `lib/mapping.ts`, sans
avoir à ouvrir le Sheet.

---

## Si le dashboard affiche « The data is not available »

Le message sous le titre dit quoi corriger. Les causes classiques :

| Message | Cause | Correction |
|---|---|---|
| n'est pas configurée | variables absentes | renseigner `GOOGLE_SERVICE_ACCOUNT_JSON` et `GOOGLE_SHEET_ID`, puis redéployer |
| pas accès à ce Sheet (403) | Sheet non partagé, ou API Sheets non activée | étape 1, points 2 et 6 |
| authentification refusée (401) | clé révoquée ou tronquée | régénérer une clé JSON |
| ce Sheet n'existe pas (404) | mauvais `GOOGLE_SHEET_ID` | reprendre la chaîne entre `/d/` et `/edit` |
| plage refusée (400) | mauvais nom d'onglet | corriger `GOOGLE_SHEET_TAB` |
| aucune ligne exploitable | mauvais onglet, ou en-têtes absents | le message liste les onglets du document |

---

## Structure du projet

```
app/
  page.tsx              lit le Sheet, filtre la période, agrège, rend le dashboard
  globals.css           charte Nature's Variety + palettes de graphiques
  login/                écran de mot de passe
  api/login|logout/     pose et retire le cookie d'accès
lib/
  google.ts             client API Google Sheets (compte de service, googleapis)
  sheet.ts              lecture du Sheet, mapping des colonnes, cache mémoire
  mapping.ts            ⚠️ LE fichier de configuration des événements
  aggregate.ts          calcul de tous les KPI et répartitions
  format.ts             formats de nombres, palettes, regroupement « Others »
components/
  Dashboard.tsx         composition de la page et sélecteurs locaux
  LineChart.tsx         courbes multi-séries, échelle qui se recale
  Donut.tsx             camemberts avec légende chiffrée
  BarList.tsx           barres classées
  PeriodFilter.tsx      filtre de période
middleware.ts           protection par mot de passe
.env.example            modèle des variables d'environnement
nv-export-sample.csv    extrait réel de l'export, référence des colonnes
```

### Notes techniques

L'accès aux données passe par **`googleapis`**, le client officiel Google pour
Node : il gère seul l'obtention et le rafraîchissement du jeton OAuth du compte
de service. Les colonnes sont retrouvées **par leur nom**, pas par leur
position : ajouter ou déplacer une colonne dans l'export ne casse rien.

Le résultat est gardé en mémoire pendant `REVALIDATE_SECONDS`, parce que la page
est rendue à la demande (elle dépend de la période choisie) — sans ce cache, on
interrogerait l'API à chaque affichage.

Aucune librairie de graphiques : tout est du SVG écrit à la main. Le site reste
très léger.

Les couleurs des graphiques ont été validées pour rester distinguables en cas de
daltonisme et suffisamment contrastées, en thème clair **comme** en thème sombre
— trois palettes distinctes : 5 teintes pour les courbes, 7 pour les camemberts,
une rampe orange pour les barres classées. Si tu changes ces couleurs, garde des
écarts francs en **luminosité** autant qu'en teinte.
