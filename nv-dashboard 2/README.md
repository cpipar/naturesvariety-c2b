# Nature's Variety — Where to Buy Partner Dashboard

Dashboard client en marque blanche, qui lit **directement le Google Sheet
`natures_variety_event_aggregates`** et se met à jour tout seul.

```
Export auto C2B ──► Google Sheet ──► Vercel (ce projet) ──► URL client
   (déjà en place)      (interne)      (lecture auto, 15 min)
```

Pas de base de données, pas de serveur à administrer, pas de redéploiement quand
les données changent.

---

## Déploiement — les 4 étapes

Compte le temps : **30 à 40 minutes la première fois**, 2 minutes les suivantes.

### Étape 1 — Brancher la lecture du Sheet

Le dashboard lit le Sheet avec un **compte de service Google**. Rien n'est
publié sur le web, aucune donnée ne sort du périmètre interne : le dashboard
s'authentifie auprès de Google et lit la feuille comme un utilisateur autorisé.

Il te faut trois choses :

1. **Le fichier JSON de la clé** du compte de service. C'est un fichier qui
   commence par `{ "type": "service_account", …`. Il servira de valeur à la
   variable `GOOGLE_SERVICE_ACCOUNT_JSON`.
2. **Le Sheet partagé en lecture avec ce compte de service** — son adresse
   ressemble à `xxx@yyy.iam.gserviceaccount.com`. S'il est déjà propriétaire du
   Sheet, il n'y a rien à faire.
3. **L'API Google Sheets activée** sur le projet Google Cloud du compte de
   service. Si un export écrit déjà dans ce Sheet, c'est déjà le cas.

> **La clé est un secret, au même titre qu'un mot de passe.** Elle ne doit
> exister que dans les variables d'environnement Vercel. Jamais dans le dépôt
> GitHub, jamais dans un fichier commité, jamais dans un message. Si elle a
> circulé par un autre canal, il faut en générer une nouvelle et supprimer
> l'ancienne — la procédure est en bas de ce fichier.

**Le piège à vérifier :** le dashboard lit **une seule plage**, par défaut
`A:AB` sur le premier onglet du document. Assure-toi que l'export automatique
**ajoute ses lignes dans ce même onglet** au fil du temps, et ne crée pas un
nouvel onglet par mois. Si l'export vit dans un onglet nommé, mets son nom dans
`SHEET_RANGE`, par exemple `Export!A:AB`.

**Solution de secours :** si le compte de service n'est pas disponible, le
dashboard sait aussi lire un Sheet **publié sur le web en CSV**
(*Fichier → Partager → Publier sur le web → l'onglet → CSV*), via la variable
`SHEET_CSV_URL`. Attention : cette URL est alors accessible à qui la possède.
Le compte de service est préférable dès qu'il est possible.

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
| `GOOGLE_SERVICE_ACCOUNT_JSON` | le contenu complet du fichier JSON de la clé |
| `SHEET_ID` | `130wgaR6CaphPTQN8z70amX3uxq6fBS-pnkY009N9nuQ` |
| `SHEET_RANGE` | `A:AB` |
| `CLIENT_NAME` | `Nature's Variety` |
| `CAMPAIGN_NAME` | `Grain-free range campaign · France` |
| `HEADER_TITLE` | `Click2Buy — Partner Dashboard` |
| `REVALIDATE_SECONDS` | `900` |

5. **Deploy**. Au bout d'une minute tu as une URL en `.vercel.app`.

> Après toute modification d'une variable d'environnement, il faut
> **redéployer** : onglet *Deployments* → `···` → *Redeploy*.

### Étape 4 — Mot de passe, admin, domaine

**Mot de passe client** — ajoute `DASHBOARD_PASSWORD` et redéploie. Le dashboard
affiche alors un écran de connexion aux couleurs du client et retient l'accès
30 jours. Pour révoquer un accès : change la valeur et redéploie, tous les
cookies existants deviennent invalides.

**Accès admin** — ajoute `ADMIN_PASSWORD`, **différent du précédent**. Un bouton
« ⚙ Admin » apparaît alors en haut à droite. Sans cette variable, le bouton
n'existe pas du tout. Le client, qui n'a que le mot de passe du dashboard, ne
peut pas entrer dans l'admin.

**Domaine** — *Settings → Domains → Add*, par exemple `nv-stats.click2buy.com`.
Vercel affiche l'enregistrement DNS (`CNAME → cname.vercel-dns.com`) à faire
ajouter. Le HTTPS est automatique.

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
cp .env.example .env.local     # puis renseigner la source de données
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
| n'a pas accès à ce Sheet | le compte de service n'est pas autorisé | partager le Sheet en Lecteur avec son adresse, et vérifier que l'API Google Sheets est activée |
| Ce Sheet n'existe pas | mauvais `SHEET_ID` | reprendre la chaîne entre `/d/` et `/edit` dans l'URL du Sheet |
| La lecture du Sheet a échoué | clé JSON incomplète ou mal collée | recoller `GOOGLE_SERVICE_ACCOUNT_JSON` en entier, puis redéployer |
| aucune ligne exploitable | mauvaise plage ou mauvais onglet | ajuster `SHEET_RANGE`, ex. `Export!A:AB` |
| n'est pas lisible publiquement | mode CSV, Sheet non publié | passer au compte de service, ou publier l'onglet en CSV |

---

## Structure du projet

```
app/
  page.tsx              lit le Sheet, filtre la période, agrège, rend le dashboard
  api/admin/            ouvre et ferme l'accès admin
  api/settings/         lit et enregistre les taux d'extrapolation
  globals.css           charte Nature's Variety + palettes de graphiques
  login/                écran de mot de passe
  api/login|logout/     pose et retire le cookie d'accès
lib/
  mapping.ts            ⚠️ LE fichier de configuration des événements
  google.ts             authentification compte de service + API Google Sheets
  settings.ts           taux d'extrapolation, stockage et calcul
  sheet.ts              lecture du Sheet (compte de service ou CSV) et parsing
  aggregate.ts          calcul de tous les KPI et répartitions
  format.ts             formats de nombres, palettes, regroupement « Others »
components/
  Dashboard.tsx         composition de la page et sélecteurs locaux
  AdminPanel.tsx        écran Admin — taux d'extrapolation
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

---

## L'écran Admin — taux d'extrapolation

Le bouton **⚙ Admin** en haut à droite ouvre un panneau qui permet de
transformer les redirections en **commandes et CA estimés**. C'est l'équivalent
des taux d'extrapolation du dashboard Advance.

Deux réglages globaux :

| Réglage | Ce qu'il fait |
|---|---|
| **Average basket** | La valeur d'une commande, en euros. |
| **Conversion rate** | La part des redirections qui se transforment en commande. |

Puis, enseigne par enseigne, tu peux surcharger ces deux valeurs — c'est ce qui
permet de traiter Amazon différemment d'une animalerie de quartier. Laisser un
champ vide reprend la valeur globale.

Le panneau montre en direct ce que les taux produisent sur la période
sélectionnée, avant d'enregistrer quoi que ce soit.

### La case « Show estimates to the client »

**Décochée par défaut, et c'est volontaire.** Tant qu'elle est décochée, le
client ne voit aucun chiffre extrapolé : seuls les événements réellement
enregistrés s'affichent. Ne la coche qu'une fois les taux validés — un CA estimé
avec un mauvais taux est plus dommageable que pas de CA du tout.

Quand la case est cochée, deux tuiles apparaissent dans l'en-tête : commandes
estimées et valeur estimée des commandes.

### Où les réglages sont stockés

Le bouton s'appelle « Save for everyone » parce que c'est bien l'intention : les
taux s'appliquent au dashboard que voit le client, pas seulement à ta vue.

Pour cela il faut un petit stockage. Dans Vercel : **Storage → Create** → un
store KV / Upstash Redis (gratuit). Vercel injecte alors tout seul les variables
`KV_REST_API_URL` et `KV_REST_API_TOKEN`, et l'admin écrit directement dedans :
tu enregistres, c'est en ligne.

Sans ce store, l'admin fonctionne quand même : il applique les taux à ta vue et
t'affiche le JSON à coller dans la variable `SETTINGS_JSON`, puis il faut
redéployer. Plus manuel, mais aucune brique en plus.

---

## Faire tourner la clé du compte de service

À faire dès que la clé a circulé ailleurs que dans Vercel — un message, un
fichier partagé, un dépôt.

1. Console Google Cloud → **IAM et administration → Comptes de service**.
2. Ouvre le compte de service, onglet **Clés**.
3. **Ajouter une clé → Créer une clé → JSON**. Un nouveau fichier est téléchargé.
4. Dans Vercel, remplace la valeur de `GOOGLE_SERVICE_ACCOUNT_JSON` par le
   contenu du nouveau fichier, puis **Redeploy**.
5. Vérifie que le dashboard affiche bien les données.
6. **Seulement ensuite**, reviens dans Google Cloud et **supprime l'ancienne
   clé**. Dans cet ordre : si tu supprimes d'abord, l'export et le dashboard
   tombent en panne le temps du remplacement.

> **Un compte de service dédié serait mieux.** Celui qui fait tourner l'export
> est propriétaire du Sheet : c'est beaucoup de droits pour un dashboard qui ne
> fait que lire. L'idéal est un second compte de service, sans aucun rôle dans
> le projet Google Cloud, avec juste ce Sheet partagé avec lui en **Lecteur**.
> Le dashboard n'a besoin de rien d'autre.
