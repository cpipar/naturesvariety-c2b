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
 * Actions internes au widget, en dehors de l'entonnoir principal. Certaines
 * de ces actions ne se distinguent pas par leur nom mais par la colonne
 * `tab` ou `retailOutletService` de la même ligne — voir internalActionLabel
 * plus bas, qui porte la logique complète.
 *
 *   tab_title_click        + tab=store/drive/delivery   → quel onglet ouvert
 *   map_usage                                           → carte ouverte
 *   no_retail_outlet_found + retailOutletService=…       → aucune enseigne trouvée
 *   list_info_button_click                              → bouton infos magasin
 */

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
 * Widget ouvert (`mediumId` d'un événement `print` / `widget`) → productId.
 * Les événements d'ouverture de widget ne portent pas de productId
 * directement : seul l'id du widget est connu, et un widget correspond à un
 * seul produit. Source : export Click2Buy des widgets (id, product_id).
 */
export const WIDGET_PRODUCT_ID: Record<string, string> = {
  '713792': '684862',
  '713793': '684863',
  '713794': '684864',
  '713795': '684865',
  '713796': '684866',
  '713797': '684867',
  '713798': '684868',
  '713799': '684869',
  '713800': '684870',
  '713801': '684871',
  '713802': '684872',
  '713803': '684873',
  '713804': '684874',
  '713805': '684875',
  '713806': '684876',
  '713807': '684877',
  '713808': '684878',
  '713809': '684879',
  '713810': '684880',
  '713811': '684881',
  '713812': '684882',
  '713813': '684883',
  '713814': '684884',
  '713815': '684885',
  '713816': '684886',
  '713817': '684887',
  '713818': '684888',
  '713819': '684889',
  '713820': '684890',
  '713821': '684891',
  '713822': '684892',
  '713823': '684893',
  '713824': '684894',
  '713825': '684895',
  '713826': '684896',
  '713827': '684897',
  '713828': '684898',
  '713829': '684899',
  '713830': '684900',
  '713831': '684901',
  '713832': '684902',
  '713833': '684903',
  '713834': '684904',
  '713835': '684905',
  '713836': '684906',
  '713837': '684907',
  '713838': '684908',
  '713839': '684909',
  '713840': '684910',
  '713841': '684911',
  '713842': '684912',
  '713843': '684913',
  '713844': '684914',
  '713845': '684915',
  '713846': '684916',
  '713847': '684917',
  '713848': '684918',
  '713849': '684919',
  '713850': '684920',
  '713851': '684921',
  '713852': '684922',
  '713853': '684923',
  '713854': '684924',
  '713855': '684925',
  '713856': '684926',
  '713857': '684927',
  '713858': '684928',
  '713859': '684929',
  '713860': '684930',
  '713861': '684931',
  '713862': '684932',
  '713863': '684933',
  '713864': '684934',
  '713865': '684935',
  '713866': '684936',
  '713867': '684937',
  '713868': '684938',
  '713869': '684939',
  '713870': '684940',
  '713871': '684941',
  '713872': '684942',
  '713873': '684943',
  '713874': '684944',
  '713875': '684945',
  '713876': '684946',
  '713877': '684947',
  '713878': '684948',
  '713879': '684949',
  '713880': '684950',
  '713881': '684951',
  '713882': '684952',
  '713883': '684953',
  '713884': '684954',
  '713885': '684955',
  '713886': '684956',
  '713887': '684957',
  '713888': '684958',
  '713889': '684959',
  '713890': '684960',
  '713891': '684961',
  '713892': '684962',
  '713893': '684963',
  '713894': '684964',
  '713895': '684965',
  '713896': '684966',
  '713897': '684967',
  '713898': '684968',
  '713899': '684969',
  '713900': '684970',
  '713901': '684971',
  '713902': '684972',
  '713903': '684973',
  '713904': '684974',
  '713905': '684975',
  '713906': '684976',
  '713907': '684977',
  '713908': '684978',
  '713909': '684979',
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

/** Libellé d'une action interne au widget — voir le vocabulaire plus haut. */
export function internalActionLabel(row: {
  action: string;
  tab: string;
  retailOutletService: string;
}): string {
  const action = norm(row.action);

  if (action === 'tab_title_click') {
    const tab = norm(row.tab);
    if (tab === 'store') return 'Physical stores tab';
    if (tab === 'drive') return 'Click & collect tab';
    if (tab === 'delivery') return 'Delivery tab';
    return '';
  }

  if (action === 'map_usage') return 'Map opened';

  if (action === 'no_retail_outlet_found') {
    const service = norm(row.retailOutletService);
    if (service === 'store') return 'No physical store found';
    if (service === 'drive') return 'No click & collect found';
    if (service === 'delivery') return 'No delivery found';
    return 'No retailer found';
  }

  if (action === 'list_info_button_click') return 'Store info button';

  return '';
}

export function serviceOf(raw: string): 'delivery' | 'collect' | 'unknown' {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return SERVICE_MAP[key] ?? 'unknown';
}

export function productName(id: string): string {
  return PRODUCT_NAMES[id] ?? (id ? `Product ${id}` : '');
}

/** productId d'une ouverture de widget : direct si présent, sinon via le widget ouvert. */
export function clickProductId(productId: string, mediumId: string): string {
  return productId || WIDGET_PRODUCT_ID[mediumId] || '';
}

/**
 * Une valeur qui n'est pas une des 7 catégories connues (test, filtre annexe,
 * anomalie de l'export…) est ignorée plutôt qu'affichée telle quelle : ce
 * graphique ne montre que les vraies catégories de la landing.
 */
export function categoryName(landingcategory: string, mediumId: string): string {
  const raw = landingcategory || mediumId;
  if (!raw) return '';
  return CATEGORY_NAMES[raw] ?? '';
}
