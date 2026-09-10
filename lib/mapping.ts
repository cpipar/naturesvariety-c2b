/* ═══════════════════════════════════════════════════════════════════════════
   MAPPING — le seul fichier à ajuster quand on connaît le vocabulaire exact
   de l'export Click2Buy.

   Chaque métrique du dashboard est définie ici par les valeurs de la colonne
   `action` (et parfois `medium`) qui l'alimentent. Ajouter un nom dans une
   liste suffit : le reste du dashboard suit tout seul.

   Vocabulaire observé dans natures_variety_event_aggregates au 02/09/2026 :
     print · print_button · print_retailers · geolocation · map_usage
   Les autres noms ci-dessous sont des candidats : ceux qui n'existent pas
   dans l'export sont simplement ignorés, sans casser le dashboard.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Le dashboard ignore tout ce qui précède cette date : les lignes plus
 * anciennes de natures_variety_event_aggregates (rodage, tests) ne comptent
 * pas. Tout ce qui s'ajoute à l'export auto à partir de cette date, jour
 * après jour, est pris en compte automatiquement — pas de borne haute.
 */
export const DATA_START_DATE = '2026-09-07';

/** Visites de la landing page (page d'accueil + pages catégorie). */
export const LANDING_VIEW = {
  actions: ['print'],
  mediums: ['landing', 'landing_category'],
};

/** Vues du bouton « Où acheter ». Une vue par visite, pas par scroll. */
export const BUTTON_VIEW = {
  actions: ['print_button'],
  mediums: [] as string[], // vide = tous les mediums
};

/** Ouverture du widget : le bouton a été cliqué et la liste s'est affichée. */
export const WIDGET_OPEN = {
  actions: ['print', 'click', 'click_button', 'open_widget', 'widget_open'],
  mediums: ['widget'],
};

/** Redirection online vers un site distributeur (delivery + click & collect). */
export const REDIRECTION = {
  actions: [
    'redirection_product',
    'redirect',
    'redirection',
    'click_retailer',
    'retailer_click',
    'redirect_retailer',
    'add_to_cart',
  ],
  mediums: [] as string[],
};

/** Sélection d'un magasin physique = itinéraire Google Maps demandé. */
export const STORE_SELECTION = {
  actions: [
    'retail_outlet_selection',
    'store_selection',
    'select_retail_outlet',
    'click_retail_outlet',
    'itinerary',
    'directions',
  ],
  mediums: [] as string[],
};

/**
 * Affichage d'une enseigne dans le widget — sert au tableau « Retailer
 * efficiency » (combien de fois choisie une fois montrée). Si aucune de ces
 * actions n'existe, le tableau se masque automatiquement.
 */
export const RETAILER_DISPLAY = {
  actions: ['print_retailers', 'print_retailer'],
  mediums: [] as string[],
};

/**
 * Actions internes au widget. Clé = valeur de `action` (ou de `tab` quand
 * l'action est un changement d'onglet), valeur = libellé affiché.
 * Les 5 seules actions internes de cette campagne.
 */
export const INTERNAL_ACTIONS: Record<string, string> = {
  // Onglets — selon l'export, ce sera soit une action dédiée, soit `tab`
  tab_delivery: 'Delivery tab',
  tab_click_and_collect: 'Click & collect tab',
  tab_stores: 'Physical stores tab',
  delivery: 'Delivery tab',
  drive: 'Click & collect tab',
  click_and_collect: 'Click & collect tab',
  stores: 'Physical stores tab',
  physical: 'Physical stores tab',
  // Clics supplémentaires
  complementary_product: 'Complementary product click',
  click_complementary: 'Complementary product click',
  store_info: 'Store info button',
  info_button: 'Store info button',
  print_info: 'Store info button',
};

/**
 * Type de service par valeur de `retailOutletService`, pour le filtre
 * All / Delivery / Click & collect.
 */
export const SERVICE_MAP: Record<string, 'delivery' | 'collect'> = {
  delivery: 'delivery',
  livraison: 'delivery',
  ecommerce: 'delivery',
  online: 'delivery',
  drive: 'collect',
  collect: 'collect',
  click_and_collect: 'collect',
  clickandcollect: 'collect',
  retrait: 'collect',
  store: 'collect',
  magasin: 'collect',
};

/**
 * Noms lisibles des produits, par `productId`. L'export ne contient que des
 * identifiants : sans entrée ici, le dashboard affiche « Product 12345 ».
 * À compléter au fur et à mesure.
 */
export const PRODUCT_NAMES: Record<string, string> = {
  '684862': 'Healthy Grains Chiot Mini Poulet - 1.5 kg',
  '684863': 'Healthy Grains Chiot Mini Poulet - 3 kg',
  '684864': 'Healthy Grains Chiot Mini Poulet - 7 kg',
  '684865': 'Healthy Grains Chiot Med/Max Poulet - 3 kg',
  '684866': 'Healthy Grains Chiot Med/Max Poulet - 10 kg',
  '684867': 'No Grain Chiot Mini Saumon - 1.5 kg',
  '684868': 'No Grain Chiot Mini Saumon - 3 kg',
  '684869': 'No Grain Chiot Med/Max/Max Saumon - 3 kg',
  '684870': 'No Grain Chiot Med/Max/Max Saumon - 10 kg',
  '684871': 'Healthy Grains Chien Adulte Mini Poulet - 1.5 kg',
  '684872': 'Healthy Grains Chien Adulte Mini Poulet - 3 kg',
  '684873': 'Healthy Grains Chien Adulte Mini Poulet - 7 kg',
  '684874': 'Healthy Grains Chien Adulte Mini Poissons Blancs - 1.5 kg',
  '684875': 'Healthy Grains Chien Adulte Mini Poissons Blancs - 3 kg',
  '684876': 'Healthy Grains Chien Adulte Mini Dinde - 1.5 kg',
  '684877': 'Healthy Grains Chien Adulte Mini Dinde - 3 kg',
  '684878': 'No Grain Chien Adulte Mini Saumon - 600g',
  '684879': 'No Grain Chien Adulte Mini Saumon - 1.5 kg',
  '684880': 'No Grain Chien Adulte Mini Saumon - 3 kg',
  '684881': 'No Grain Chien Adulte Mini Saumon - 7 kg',
  '684882': 'No Grain Chien Adulte Mini Poulet - 1.5 kg',
  '684883': 'No Grain Chien Adulte Mini Poulet - 7 kg',
  '684884': 'Healthy Grains Chien Adulte Med/Max Poulet - 3 kg',
  '684885': 'Healthy Grains Chien Adulte Med/Max Poulet - 10 kg',
  '684886': 'Healthy Grains Chien Adulte Med/Max Poissons Blancs - 3 kg',
  '684887': 'Healthy Grains Chien Adulte Med/Max Poissons Blancs - 10 kg',
  '684888': 'Healthy Grains Chien Adulte Med/Max Dinde - 3 kg',
  '684889': 'Healthy Grains Chien Adulte Med/Max Dinde - 10 kg',
  '684890': 'No Grain Chien Adulte Med/Max Saumon - 3 kg',
  '684891': 'No Grain Chien Adulte Med/Max Saumon - 10 kg',
  '684892': 'No Grain Chien Adulte Med/Max Poulet - 3 kg',
  '684893': 'No Grain Chien Adulte Med/Max Poulet - 10 kg',
  '684894': 'Freeze Dried Complete Food Chien Mini Poulet - 120g',
  '684895': 'Freeze Dried Complete Food Chien Mini Dinde - 120g',
  '684896': 'Chien Freeze Dried Snack Meat Bites Poulet - 20g',
  '684897': 'Chien Freeze Dried Snack Meat Bites Dinde - 20g',
  '684898': 'Chien Freeze Dried Snack Chunks Poulet - 50g',
  '684899': 'Chien Freeze Dried Snack Chunks Bœuf - 50g',
  '684900': 'Chien Freeze Dried Toppers Poulet - 120g',
  '684901': 'Chien Freeze Dried Toppers Bœuf - 120g',
  '684902': 'Chien Freeze Dried Toppers Bœuf - 40g',
  '684903': 'Chien Freeze Dried Toppers Poulet - 40g',
  '684904': 'Chien Freeze Dried Toppers Agneau - 40g',
  '684905': 'Chien Freeze Dried Toppers Dinde - 40g',
  '684906': 'Pâtée Chien Mini Poulet - 150g',
  '684907': 'Pâtée Chien Mini Bœuf - 150g',
  '684908': 'Pâtée Chien Mini Dinde - 150g',
  '684909': 'Pâtée Chien Med/Max Poulet - 300g',
  '684910': 'Pâtée Chien Med/Max Bœuf - 300g',
  '684911': 'Pâtée Chien Med/Max Dinde - 300g',
  '684912': 'Pâtée Chien Med/Max MULTIPACK x4 - 4x300g',
  '684913': 'Pâtée Chien Mini MULTIPACK x4 - 4x150g',
  '684914': 'Bouchées en sauce Chien Mini Poulet et Légumes - 100g',
  '684915': 'Bouchées en sauce Chien Mini Saumon et Herbes - 100g',
  '684916': 'Bouchées en sauce Chien Mini Dinde et Haricots Verts - 100g',
  '684917': 'Pâtée Chien Mini Poulet - 200g',
  '684918': 'Pâtée Chien Mini Bœuf - 200g',
  '684919': 'Pâtée Chiot Mini Poulet - 200g',
  '684920': 'Pâtée Chien Med/Max Poulet - 400g',
  '684921': 'Pâtée Chien Med/Max Bœuf - 400g',
  '684922': 'Pâtée Chiot Med/Max Poulet - 400g',
  '684923': 'Snacks Chien Superfoods Poulet - 85g',
  '684924': 'Snacks Chien Superfoods Bœuf - 85g',
  '684925': 'Snacks Chien Superfoods Dinde - 85g',
  '684926': 'Délibars Superfood Chien Poulet - 70g',
  '684927': 'Délibars Superfood Chien Boeuf - 70g',
  '684928': 'Délibars Superfood Chien Dinde - 70g',
  '684929': 'Deli Snacks Chien Poulet - 50g',
  '684930': 'Deli Snacks Chien Poulet & Agneau - 50g',
  '684931': 'Deli Snacks Chiot - 50g',
  '684932': 'Healthy Grains Chaton Poissons Blancs - 300g',
  '684933': 'Healthy Grains Chaton Poissons Blancs - 1.25 kg',
  '684934': 'Healthy Grains Chaton Poissons Blancs - 3 kg',
  '684935': 'No Grain Chaton Poulet - 300g',
  '684936': 'No Grain Chaton Poulet - 1.25 kg',
  '684937': 'No Grain Chaton Poulet - 3 kg',
  '684938': 'No Grain Chaton Poulet - 7 kg',
  '684939': 'Healthy Grain Chat Adulte Poulet - 1.25 kg',
  '684940': 'Healthy Grain Chat Adulte Poulet - 3 kg',
  '684941': 'Healthy Grain Chat Adulte Poulet - 7 kg',
  '684942': 'No Grain Chat Adulte Saumon - 1.25 kg',
  '684943': 'No Grain Chat Adulte Saumon - 7 kg',
  '684944': 'Healthy Grains Chat Stérilisé Saumon - 1.25 kg',
  '684945': 'Healthy Grains Chat Stérilisé Saumon - 3 kg',
  '684946': 'Healthy Grains Chat Stérilisé Saumon - 7 kg',
  '684947': 'Healthy Grains Chat Stérilisé Poissons Blancs - 0.3 kg',
  '684948': 'Healthy Grains Chat Stérilisé Poissons Blancs - 1.25 kg',
  '684949': 'Healthy Grains Chat Stérilisé Poissons Blancs - 3 kg',
  '684950': 'Healthy Grains Chat Stérilisé Poulet - 1.25 kg',
  '684951': 'Healthy Grains Chat Stérilisé Poulet - 3 kg',
  '684952': 'Healthy Grains Chat Stérilisé Poulet - 7 kg',
  '684953': 'No Grain Chat Stérilisé Dinde - 1.25 kg',
  '684954': 'No Grain Chat Stérilisé Dinde - 3 kg',
  '684955': 'No Grain Chat Stérilisé Dinde - 7 kg',
  '684956': 'No Grain Chat Stérilisé Saumon - 1.25 kg',
  '684957': 'No Grain Chat Stérilisé Saumon - 3 kg',
  '684958': 'No Grain Chat Stérilisé Saumon - 7 kg',
  '684959': 'No Grain Chat Stérilisé Poulet - 300g',
  '684960': 'No Grain Chat Stérilisé Poulet - 1.25 kg',
  '684961': 'No Grain Chat Stérilisé Poulet - 3 kg',
  '684962': 'No Grain Chat Stérilisé Poulet - 7 kg',
  '684963': 'Pâtée Chat Poulet - 70g',
  '684964': 'Pâtée Chat Poulet & Oie - 70g',
  '684965': 'Pâtée Chat Boeuf & Poulet - 70g',
  '684966': 'Pâtée Chat Dinde - 70g',
  '684967': 'Bouchée en Sauce Chat Saumon - 85g',
  '684968': 'Bouchée en Sauce Chat Poulet - 85g',
  '684969': 'Bouchée en Sauce Chat Poulet & Saumon MULTIPACK x4 - 4x85g',
  '684970': 'Bouchée en Sauce Chat Dinde - 85g',
  '684971': 'Bouchée en Sauce Chat Thon - 85g',
  '684972': 'Bouchée en Sauce Chat Dinde & Thon MULTIPACK x4 - 4x85g',
  '684973': 'Bouchée en Sauce Chat Cabillaud - 85g',
  '684974': 'Bouchée en Sauce Chat Poissons - 85g',
  '684975': 'Bouchée en Sauce Chaton Poulet - 70g',
  '684976': 'Bouchée en Sauce Chaton Saumon - 70g',
  '684977': 'Bouchée en Sauce Chat Séléction Poissons MULTIPACK (12x4) - 1,20 kg',
  '684978': 'Bouchée en Sauce Chat Séléction Viandes MULTIPACK (12x4) - 1,20 kg',
  '684979': 'Bouchée en Sauce Chat Séléction Viandes & Poissons MULTIPACK (12x4) - 1,20 kg',
};

/**
 * Noms lisibles des catégories de la landing, par `landingcategory` ou par
 * `mediumId` quand la colonne landingcategory est vide.
 * Les 7 catégories de la landing Nature's Variety.
 */
export const CATEGORY_NAMES: Record<string, string> = {
  '1411': 'All - No Grain',
  '1412': 'Dog - No Grain',
  '1413': 'Cat - No Grain',
  '1414': 'Dog - Healthy Grains',
  '1415': 'Cat - Healthy Grains',
  '1416': 'Dog - Wetfood',
  '1417': 'Cat - Wetfood',
};

/* ─────────────────────── Helpers utilisés par l'agrégation ─────────────── */

export type Selector = { actions: string[]; mediums: string[] };

/** Casse et espaces variables selon la façon dont la ligne a été saisie ou exportée. */
const norm = (v: string) => v.trim().toLowerCase();

export function matches(
  row: { action: string; medium: string },
  sel: Selector,
): boolean {
  if (sel.actions.length > 0 && !sel.actions.map(norm).includes(norm(row.action))) return false;
  if (sel.mediums.length > 0 && !sel.mediums.map(norm).includes(norm(row.medium))) return false;
  return true;
}

export function serviceOf(raw: string): 'delivery' | 'collect' | 'unknown' {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return SERVICE_MAP[key] ?? 'unknown';
}

export function productName(id: string): string {
  return PRODUCT_NAMES[id] ?? (id ? `Product ${id}` : '');
}

export function categoryName(landingcategory: string, mediumId: string): string {
  const raw = landingcategory || mediumId;
  if (!raw) return '';
  return CATEGORY_NAMES[raw] ?? (/^\d+$/.test(raw) ? `Category ${raw}` : raw);
}
