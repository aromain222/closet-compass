import "server-only";

import type { ProductResult } from "@/lib/products/types";

export interface FragranceCloneIntelligence {
  clone: string;
  brand: string;
  original: string;
  fidelity: number;
  persistenceHours: number;
  projection: number;
}

const RAW_FRAGRANCE_CLONES = `
9:00 PM|Afnan|JPG Ultra Male|95|10|9.5
Turathi Blue|Afnan|Bvlgari Tygar|95|9|8.5
Supremacy Not Only Intense|Afnan|Nishane Hacivat|90|10|9.5
Supremacy In Heaven|Afnan|Creed Silver Mountain Water|88|8|7.5
Club de Nuit Intense Man Parfum|Armaf|Creed Aventus|92|10|9.5
Club de Nuit Iconic|Armaf|Bleu de Chanel EDP|90|9|8.5
Club de Nuit Untold|Armaf|MFK Baccarat Rouge 540|96|10|10
Odyssey Mandarin Sky|Armaf|JPG Scandal Pour Homme|92|8.5|8.5
Rayhaan Elixir|Rayhaan|JPG Le Male Elixir|92|10|8.5
Obsidian|Rayhaan|Dior Homme Parfum|85|9|9
Nocturno|Rayhaan|Dior Sauvage EDP|88|8.5|8
Terra|Rayhaan|Amouage Outlands vibe|85|10|9.5
Vintage Radio|Lattafa|Initio Paragon|96|9|8.5
Al Nashama Caprice|Lattafa|YSL Bleu Electrique|92|8|8
9 AM Dive|Afnan|YSL Y + BDC hybrid|88|8.5|8
Hercules|Maison Alhambra|PDM Herod|85|8|7.5
Apex|Fragrance World|Penhaligon's Halfeti|90|9.5|9
Jean Lowe Ombre|Maison Alhambra|LV Ombre Nomade|95|10|10
Asad|Lattafa|Dior Sauvage Elixir|95|10|9
Liquid Brun|French Avenue|PDM Althair|94|10|9
Khamrah|Lattafa|Kilian Angels' Share twist|90|9|8.5
Khamrah Qahwa|Lattafa|Angels' Share Coffee Twist|90|9|8.5
Fakhar Black|Lattafa|YSL Y EDP|75|7|7
Ramz Silver|Lattafa|JPG Ultra Male|88|8|8
Oud for Glory|Lattafa|Initio Oud for Greatness|95|9|9
Maahir Legacy|Lattafa|PDM Sedley|88|7.5|7
Ameer Al Oudh Intense|Lattafa|By The Fireplace|90|9|8.5
Najdia|Lattafa|Invictus Aqua|75|7|7
Suqraat|Lattafa|Acqua di Gio Profumo|70|6|6
Al Qiam Silver|Lattafa|Bvlgari Tygar|90|8|8
Liam Grey|Lattafa|BDK Gris Charnel|90|8|7.5
Emeer|Lattafa|Clive Christian Town & Country|85|8|8
Qaa'ed|Lattafa|Amouage Interlude vibe|85|8|8
Legesi|Armaf|Chanel Platinum Egoiste|95|8.5|8
Modest Une|Afnan|Dior Sauvage EDT|95|9.5|8.5
Spectre Ghost|French Avenue|Nishane Ani|90|10|9
Tabac|Maison Alhambra|Dior Tobacolor|90|10|9
Tres Nuit|Armaf|Creed Green Irish Tweed|88|7.5|7
Amber & Leather|Maison Alhambra|Tom Ford Ombre Leather|98|9|8.5
The Tux|Maison Alhambra|YSL Tuxedo|95|8|7.5
Tobacco Touch|Maison Alhambra|TF Tobacco Vanille|95|8.5|8
Victorioso Nero|Maison Alhambra|Invictus Victory|95|8.5|8.5
North Stag VII|French Avenue|LV Afternoon Swim|92|7.5|7.5
Royal Bleu|French Avenue|PDM Layton|94|8.5|8.5
Afro Leather|Maison Alhambra|Memo African Leather|95|8.5|8
Rare Carbon|Afnan|Tom Ford Ombre Leather|92|9|8.5
Evoke Gold|Ajmal|Prada L'Homme|95|8.5|8
Milestone|Armaf|Creed Millesime Imperial|90|8.5|8.5
Supremacy Incense|Afnan|Amouage Interlude Man|95|10|9.5
Dark Door Intense|Maison Alhambra|Dior Homme Intense|85|8|7.5
Woody Oud|Maison Alhambra|TF Oud Wood|85|7|6.5
Ocean Rush|Rayhaan|Invictus Aqua|88|8|8
Francique 79.9|French Avenue|TF Santal Blush|92|8.5|8
Al Areeq Silver|Lattafa|Memo Irish Leather|90|9|8.5
Porto Neroli|Maison Alhambra|TF Neroli Portofino|85|6.5|6
Odyssey Mega|Armaf|YSL Y EDP|88|8.5|8.5
Ishq Al Shuyukh Silver|Lattafa|1 Million Lucky|92|9|8.5
Cassius|Maison Alhambra|PDM Carlisle|90|8.5|8
Wajood|Lattafa|Kenzo Homme EDP|88|9|8.5
Divin Asylum|French Avenue|Roja Elysium|92|8|7.5
Exclusif Tabac|Maison Alhambra|CH Mystery Tobacco|95|9.5|9
Salvo Intense|Maison Alhambra|Dior Sauvage EDP|90|8|8
Toro|Maison Alhambra|Terre d'Hermes|88|8|7.5
Radical Brown|Armaf|PDM Herod|88|8|7.5
Hunter Intense|Armaf|Invictus + Sauvage|85|8.5|8.5
Ansaam Silver|Lattafa|Azzaro Most Wanted|92|8.5|8.5
Ishq Al Shuyukh Gold|Lattafa|Rosendo Mateu No.5|95|10|9.5
Sceptre Oceana|Maison Alhambra|Bvlgari Orom|93|9|8.5
Imperial|French Avenue|Blue Sapphire|92|9.5|9
Enaaj|Afnan|Invictus Victory Elixir|93|9|8.5
Aether|French Avenue|PDM Greenley|92|8|8
Supremacy In Oud|Afnan|Oud for Greatness|90|9.5|9
Ebony Fume|French Avenue|TF Ebene Fume|93|8.5|8
Ana Abiyedh Rouge|Lattafa|BR540|85|8.5|8
Jean Lowe Immortel|Maison Alhambra|LV L'Immensite|93|9|8.5
Jean Lowe Nouveau|Maison Alhambra|LV Nouveau Monde|90|9|8
Cassius Exclusif|Maison Alhambra|PDM Carlisle dark|92|9|8.5
Beloved|Maison Alhambra|Parfums de Marly Delina|92|9|8.5
Floral Peony|Dossier|Parfums de Marly Delina|84|8|7.5
Club de Nuit Fleur|Armaf|Parfums de Marly Delina|86|8.5|8
Galatea|Maison Alhambra|PDM Delina Exclusif|88|8|8
Bright Peach|Maison Alhambra|Tom Ford Bitter Peach|90|7.5|7.5
Lovely Cherie|Maison Alhambra|Tom Ford Lost Cherry|92|7|7.5
Infini Rose|Maison Alhambra|Initio Atomic Rose|90|9|8.5
Al Dirgham|Lattafa|Allure Homme Sport|85|7|7
Najdia Tribute|Lattafa|Invictus Legend|80|7|7
Shaheen Silver|Lattafa|Creed Aventus Cologne|88|8|8
Ana Abiyedh|Lattafa|Erba Pura vibe|85|8|8
Raghba Wood Intense|Lattafa|By The Fireplace smoky|88|9|8
Confidential Private Gold|Lattafa|Kilian Gold Knight|90|9|8.5
Oud Mood|Lattafa|Oud Oriental blend|80|9|8
Hunter|Armaf|Lacoste Blanc|85|7|7.5
Ventana|Armaf|Dior Sauvage EDT|85|7|7.5
Urban Man Elixir|Armaf|Sauvage + Aventus mix|90|9|9
Club de Nuit Sillage|Armaf|Creed Silver Mountain Water|92|9|8.5
Club de Nuit Urban Man|Armaf|Dior Sauvage light|80|6.5|7
Supremacy Silver|Afnan|Creed Aventus|85|8|8
Supremacy Gold|Afnan|Xerjoff Erba Pura vibe|88|9|8.5
Mirsaal of Trust|Afnan|Spicebomb Extreme vibe|85|8|8
Rare Tiffany|Afnan|Tiffany & Co fresh floral|85|7|7
Spectre Wraith|French Avenue|Black Phantom by Kilian|92|10|9
After Effect|French Avenue|Initio Side Effect|95|10|9.5
Enigma Une|French Avenue|Dior Sauvage Elixir|92|10|9
Midnight Oud|French Avenue|Amouage Interlude Man|90|10|9.5
Rayhaan Night|Rayhaan|YSL La Nuit de L'Homme|88|7.5|7.5
Rayhaan Intense Noir|Rayhaan|Dior Homme Intense|90|8|8
Rayhaan Fresh Wave|Rayhaan|Versace Dylan Blue|85|7|7.5
Salvo|Maison Alhambra|Dior Sauvage EDT|88|7|7.5
Jorge Di Profumo|Maison Alhambra|Acqua di Gio Profumo|85|7|7
Jorge Di Profumo Deep Blue|Maison Alhambra|Acqua di Gio Profondo|87|7.5|7.5
Yeah!|Maison Alhambra|YSL Y EDP|90|8|8
Expose Blanc|Maison Alhambra|Chanel Allure Homme Edition Blanche|88|7|7.5
Dark Aoud|Maison Alhambra|Montale Dark Aoud|85|9|8
Hayaati|Lattafa|Paco Rabanne Invictus|80|7|7
Hayaati Gold Elixir|Lattafa|Invictus Victory vibe|85|8|8
Tharwah Gold|Lattafa|YSL Y Le Parfum|88|8.5|8
Najdia Intense|Lattafa|Invictus Aqua modern|82|7.5|7.5
Ra'ed Luxe|Lattafa|Dior Sauvage + spice twist|85|8|8
Fursan Brown|Lattafa|Herod / Tobacco vibe|85|8.5|8
Club de Nuit Blue Iconic|Armaf|Bleu de Chanel Parfum|92|9|8.5
Club de Nuit White Imperiale|Armaf|Delina Exclusif|92|9|8.5
Club de Nuit Oud|Armaf|Oud blend inspired niche|85|9|8.5
Craze Noir|Armaf|PDM Pegasus Exclusif|88|8.5|8
Historic Olmeda|Afnan|Tom Ford Oud Wood fresh twist|90|8|8
9 PM Rebel|Afnan|Ultra Male modernized|88|9|8.5
Supremacy Collector's Edition|Afnan|Aventus Absolu|92|10|9
Essence de Blanc|French Avenue|LV Imagination|92|8|8
Lumiere Garcon|French Avenue|YSL L'Homme|88|7|7.5
Noir D'Arabie|French Avenue|Oud Satin Mood style|90|9|8.5
Rayhaan Ignite|Rayhaan|Dior Sauvage EDT|85|7|7.5
Rayhaan Velvet Amber|Rayhaan|Grand Soir vibe|88|9|8.5
Rayhaan Blue Wave|Rayhaan|Bleu de Chanel style|85|7.5|7.5
Avant|Al Haramain|Creed Aventus smooth|90|8|8
Toro Pour Homme|Maison Alhambra|Terre d'Hermes citric|90|8|7.5
Black Origami|Maison Alhambra|Tom Ford Black Orchid|88|9|8
Amberley Ombre Blue|Maison Alhambra|LV Afternoon Swim alt take|88|7.5|7.5
Jean Lowe Matiere|Maison Alhambra|LV Matiere Noire|90|9|8
Washwashah|Lattafa|Montale Roses Musk vibe|85|8|8
Eternal Oud|Lattafa|MFK Grand Soir sweet amber|90|9|8.5
Raghba|Lattafa|By The Fireplace sweet|85|9|8
Opulent Musk|Lattafa|MFK Gentle Fluidity Gold|85|8|7.5
Ser Hubbee|Lattafa|Tobacco Vanille light|80|7|7
Le Parfait|Armaf|Aventus + GIT hybrid|88|8|8
Le Parfait Pour Homme|Armaf|Green Irish Tweed mix|85|7.5|7.5
Tag Him Uomo Nero|Armaf|Dior Sauvage + spice|85|8|8
Derby Club House Gold|Armaf|1 Million vibe|80|7|7
Tribute Blue|Afnan|Bleu de Chanel clean|88|8|8
Highness White|Afnan|Creed SMW airy|85|7.5|7.5
Mirsaal With Love|Afnan|Spicy sweet niche vibe|85|8|8
Lueur D'espoir Arena|French Avenue|Tygar / Imagination hybrid|90|8|8.5
Lueur D'espoir Ambre|French Avenue|Grand Soir style|90|9|8.5
Rayhaan Rouge|Rayhaan|Baccarat Rouge 540 style|88|9|8.5
Rayhaan Gold|Rayhaan|1 Million Elixir vibe|85|8|8
Rayhaan Oud|Rayhaan|Oud niche blend|85|9|8
Blue Fate|ALT. Fragrances|Ex Nihilo Blue Talisman|95|8|8.5
The Blu Talassim|Alexandria Fragrances|Ex Nihilo Blue Talisman|90|9|8.5
Blue Spell|Yom & Layl|Ex Nihilo Blue Talisman|88|8|8
Turathi Electric|Afnan|Ex Nihilo Blue Talisman|92|9|8.5
Art of Universe|Lattafa|Ex Nihilo Blue Talisman|88|8.5|8.5
`.trim();

export const fragranceCloneIntelligence: FragranceCloneIntelligence[] = RAW_FRAGRANCE_CLONES
  .split("\n")
  .map((line) => {
    const [clone, brand, original, fidelity, persistenceHours, projection] = line.split("|");
    return {
      clone,
      brand,
      original,
      fidelity: Number(fidelity),
      persistenceHours: Number(persistenceHours),
      projection: Number(projection),
    };
  });

const BRAND_PRICE_ESTIMATES: Record<string, number> = {
  Afnan: 45,
  Armaf: 42,
  Rayhaan: 38,
  Lattafa: 35,
  "Maison Alhambra": 32,
  "French Avenue": 50,
  Ajmal: 42,
  "Fragrance World": 45,
  "Al Haramain": 55,
  "ALT. Fragrances": 49,
  "Alexandria Fragrances": 55,
  "Yom & Layl": 40,
  Dossier: 29,
  Oakcha: 55,
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(edp|edt|eau|de|parfum|toilette|cologne|spray|pour|homme|style|vibe|twist|modern|dark|light|smooth|clean|airy)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textScore(needle: string, haystack: string): number {
  const a = normalize(needle);
  const b = normalize(haystack);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (b.includes(a) || a.includes(b)) return 88;

  const terms = a.split(" ").filter((term) => term.length > 2);
  if (terms.length === 0) return 0;
  const hits = terms.filter((term) => b.includes(term)).length;
  return Math.round((hits / terms.length) * 78);
}

export function findCuratedFragranceClones(sourceName: string, maxPrice?: number): FragranceCloneIntelligence[] {
  return fragranceCloneIntelligence
    .map((entry) => ({
      entry,
      score: Math.max(
        textScore(sourceName, entry.original),
        textScore(sourceName, `${entry.brand} ${entry.clone}`)
      ),
    }))
    .filter(({ entry, score }) => score >= 45 && estimatedClonePrice(entry) <= (maxPrice ?? Number.POSITIVE_INFINITY))
    .sort((a, b) => b.score - a.score || b.entry.fidelity - a.entry.fidelity || b.entry.projection - a.entry.projection)
    .map(({ entry }) => entry);
}

export function estimatedClonePrice(entry: FragranceCloneIntelligence): number {
  return BRAND_PRICE_ESTIMATES[entry.brand] ?? 45;
}

export function fragranceCloneToProduct(entry: FragranceCloneIntelligence): ProductResult {
  const price = estimatedClonePrice(entry);
  return {
    id: `fragrance-intel-${normalize(`${entry.brand}-${entry.clone}`).replace(/\s+/g, "-")}`,
    title: `${entry.brand} ${entry.clone}`,
    brand: entry.brand,
    retailer: "Curated fragrance intelligence",
    price,
    currency: "USD",
    productUrl: `https://www.google.com/search?q=${encodeURIComponent(`${entry.brand} ${entry.clone} fragrance`)}`,
    imageUrl: `https://placehold.co/600x800/png?text=${encodeURIComponent(entry.clone)}`,
    category: "fragrance",
    colors: [],
    sizes: ["full bottle"],
    description: `${entry.clone} is tracked as a clone or close alternative to ${entry.original}.`,
    listedMaterials: [],
    inferredMaterials: [],
    normalizedMaterials: [],
    materialConfidence: 0,
    materialConfidenceLabel: "low",
    softnessScore: 0,
    stretchScore: 0,
    breathabilityScore: 0,
    opacityScore: 0,
    durabilityScore: Math.min(100, Math.round(entry.persistenceHours * 10)),
    careInstructions: [],
    reviewSummary: `${entry.fidelity}% fidelity to ${entry.original}; ${entry.persistenceHours}h persistence; projection ${entry.projection}/10.`,
    source: "manual",
    createdAt: "2026-05-25T00:00:00.000Z",
  };
}
