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
  // '123456': 'No Grain Dog Adult Med/Max — Chicken',
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

export function matches(
  row: { action: string; medium: string },
  sel: Selector,
): boolean {
  if (sel.actions.length > 0 && !sel.actions.includes(row.action)) return false;
  if (sel.mediums.length > 0 && !sel.mediums.includes(row.medium)) return false;
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
