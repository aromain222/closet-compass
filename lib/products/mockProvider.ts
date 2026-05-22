import type { ProductResult, ProductSearchInput } from "@/lib/products/types";
import {
  getMaterialConfidenceLabel,
  normalizeFiberName,
  normalizeMaterialBlend
} from "@/lib/materials/normalizeMaterials";
import { scoreMaterialQuality } from "@/lib/materials/materialScore";

function product(
  input: Omit<ProductResult, "normalizedMaterials" | "createdAt" | "source" | "materialConfidenceLabel">
): ProductResult {
  const materialText = [...input.listedMaterials, ...input.inferredMaterials].join(", ");
  return {
    ...input,
    normalizedMaterials: normalizeMaterialBlend(materialText),
    materialConfidenceLabel: getMaterialConfidenceLabel(input.listedMaterials, input.inferredMaterials),
    source: "mock",
    createdAt: "2026-05-22T00:00:00.000Z"
  };
}

export const MOCK_PRODUCTS: ProductResult[] = [
  product({
    id: "mock-silk-slip-skirt",
    title: "Bias-Cut Silk Slip Skirt",
    brand: "Aurate Studio",
    retailer: "Muse Market",
    price: 168,
    originalPrice: 228,
    currency: "USD",
    productUrl: "https://example.com/products/silk-slip-skirt",
    imageUrl: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8",
    category: "skirt",
    colors: ["black", "champagne"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Midi skirt with a fluid bias cut and lined upper panel for better opacity.",
    listedMaterials: ["Shell: 100% silk charmeuse", "lining: 100% viscose"],
    inferredMaterials: [],
    materialConfidence: 0.92,
    softnessScore: 94,
    stretchScore: 18,
    breathabilityScore: 88,
    opacityScore: 72,
    durabilityScore: 74,
    careInstructions: ["dry clean recommended", "steam lightly"],
    reviewSummary: "Reviewers praise the drape and softness but note delicate care."
  }),
  product({
    id: "mock-modal-slip-skirt",
    title: "Soft Modal Slip Midi Skirt",
    brand: "Everlane Edit",
    retailer: "Northline",
    price: 78,
    originalPrice: 98,
    currency: "USD",
    productUrl: "https://example.com/products/modal-slip-skirt",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
    category: "skirt",
    colors: ["black", "espresso", "ivory"],
    sizes: ["XXS", "XS", "S", "M", "L", "XL"],
    description: "Pull-on midi skirt with a silk-like drape and comfortable elastic waist.",
    listedMaterials: ["72% modal, 23% recycled polyester, 5% elastane"],
    inferredMaterials: ["modal jersey"],
    materialConfidence: 0.88,
    softnessScore: 90,
    stretchScore: 82,
    breathabilityScore: 76,
    opacityScore: 78,
    durabilityScore: 70,
    careInstructions: ["machine wash cold", "lay flat to dry"],
    reviewSummary: "Soft and easy to style; fabric has noticeable stretch."
  }),
  product({
    id: "mock-poly-satin-slip-skirt",
    title: "Satin-Look Bias Midi Skirt",
    brand: "City Muse",
    retailer: "FastFinds",
    price: 42,
    originalPrice: 58,
    currency: "USD",
    productUrl: "https://example.com/products/satin-look-bias-skirt",
    imageUrl: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956",
    category: "skirt",
    colors: ["black", "champagne", "sage"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Bias-cut satin-look midi skirt with a pull-on waist. Product copy describes a silky finish but does not list the full fiber breakdown.",
    listedMaterials: [],
    inferredMaterials: ["polyester satin with elastane"],
    materialConfidence: 0.52,
    softnessScore: 58,
    stretchScore: 54,
    breathabilityScore: 34,
    opacityScore: 60,
    durabilityScore: 66,
    careInstructions: ["machine wash cold", "hang dry"],
    reviewSummary: "Similar shine and silhouette, but reviews mention thinner fabric and static."
  }),
  product({
    id: "mock-linen-wide-leg-trouser",
    title: "Relaxed Linen Wide-Leg Trouser",
    brand: "Marlow",
    retailer: "Muse Market",
    price: 118,
    currency: "USD",
    productUrl: "https://example.com/products/linen-wide-leg-trouser",
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1",
    category: "pants",
    colors: ["oat", "navy", "black"],
    sizes: ["0", "2", "4", "6", "8", "10", "12"],
    description: "High-rise trouser with breathable linen blend and partial lining.",
    listedMaterials: ["54% linen, 44% cotton, 2% elastane"],
    inferredMaterials: ["linen cotton blend"],
    materialConfidence: 0.9,
    softnessScore: 72,
    stretchScore: 30,
    breathabilityScore: 93,
    opacityScore: 70,
    durabilityScore: 80,
    careInstructions: ["machine wash gentle", "line dry"],
    reviewSummary: "Airy for warm weather; some wrinkling expected."
  }),
  product({
    id: "mock-cotton-poplin-shirt",
    title: "Crisp Organic Cotton Poplin Shirt",
    brand: "Kind Thread",
    retailer: "Cedar & Co",
    price: 86,
    originalPrice: 110,
    currency: "USD",
    productUrl: "https://example.com/products/cotton-poplin-shirt",
    imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10",
    category: "shirt",
    colors: ["white", "blue stripe"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Structured button-down with a smooth poplin weave and opaque finish.",
    listedMaterials: ["100% organic cotton"],
    inferredMaterials: ["cotton poplin"],
    materialConfidence: 0.94,
    softnessScore: 68,
    stretchScore: 5,
    breathabilityScore: 84,
    opacityScore: 82,
    durabilityScore: 86,
    careInstructions: ["machine wash warm", "tumble dry low"],
    reviewSummary: "Crisp and polished; not stretchy."
  }),
  product({
    id: "mock-cashmere-cardigan",
    title: "Lightweight Cashmere Cardigan",
    brand: "Atelier Vale",
    retailer: "LuxeLoop",
    price: 240,
    originalPrice: 320,
    currency: "USD",
    productUrl: "https://example.com/products/cashmere-cardigan",
    imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105",
    category: "sweater",
    colors: ["heather grey", "camel", "black"],
    sizes: ["XS", "S", "M", "L"],
    description: "Fine-gauge cardigan with rib trim and a plush handfeel.",
    listedMaterials: ["100% cashmere"],
    inferredMaterials: ["cashmere knit"],
    materialConfidence: 0.93,
    softnessScore: 98,
    stretchScore: 38,
    breathabilityScore: 70,
    opacityScore: 88,
    durabilityScore: 68,
    careInstructions: ["hand wash cold", "dry flat"],
    reviewSummary: "Extremely soft, lightweight warmth; pilling possible with friction."
  }),
  product({
    id: "mock-wool-blend-cardigan",
    title: "Soft Wool Blend Cropped Cardigan",
    brand: "Oak & Thread",
    retailer: "Northline",
    price: 92,
    currency: "USD",
    productUrl: "https://example.com/products/wool-blend-cardigan",
    imageUrl: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e",
    category: "sweater",
    colors: ["grey", "cream", "black"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Cropped knit cardigan with a soft brushed surface and medium warmth.",
    listedMaterials: ["45% wool, 30% nylon, 20% cotton, 5% cashmere"],
    inferredMaterials: ["wool cashmere blend"],
    materialConfidence: 0.86,
    softnessScore: 82,
    stretchScore: 42,
    breathabilityScore: 68,
    opacityScore: 86,
    durabilityScore: 76,
    careInstructions: ["hand wash cold", "reshape and dry flat"],
    reviewSummary: "Good value for a wool blend; softer than typical acrylic knits."
  }),
  product({
    id: "mock-acrylic-cardigan",
    title: "Cloud-Soft Cropped Cardigan",
    brand: "FastFinds",
    retailer: "FastFinds",
    price: 38,
    currency: "USD",
    productUrl: "https://example.com/products/cloud-soft-cardigan",
    imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c",
    category: "sweater",
    colors: ["grey", "cream", "black"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Cropped fuzzy cardigan styled like a premium cashmere knit. Fiber content is not shown on the mock retailer page.",
    listedMaterials: [],
    inferredMaterials: [],
    materialConfidence: 0.22,
    softnessScore: 55,
    stretchScore: 46,
    breathabilityScore: 28,
    opacityScore: 76,
    durabilityScore: 38,
    careInstructions: ["machine wash cold"],
    reviewSummary: "Looks similar in photos, but reviews mention shedding and pilling."
  }),
  product({
    id: "mock-lyocell-wrap-dress",
    title: "Lyocell Jersey Wrap Dress",
    brand: "Sable Row",
    retailer: "Cedar & Co",
    price: 128,
    currency: "USD",
    productUrl: "https://example.com/products/lyocell-wrap-dress",
    imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c",
    category: "dress",
    colors: ["black", "forest", "berry"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Knee-length wrap dress with smooth jersey drape and forgiving stretch.",
    listedMaterials: ["67% lyocell, 28% cotton, 5% elastane"],
    inferredMaterials: ["lyocell jersey"],
    materialConfidence: 0.89,
    softnessScore: 88,
    stretchScore: 80,
    breathabilityScore: 82,
    opacityScore: 76,
    durabilityScore: 73,
    careInstructions: ["machine wash cold", "hang dry"],
    reviewSummary: "Comfortable, soft, and breathable enough for office-to-dinner wear."
  }),
  product({
    id: "mock-poly-satin-dress",
    title: "Satin Wrap Midi Dress",
    brand: "City Muse",
    retailer: "FastFinds",
    price: 64,
    originalPrice: 88,
    currency: "USD",
    productUrl: "https://example.com/products/poly-satin-wrap-dress",
    imageUrl: "https://images.unsplash.com/photo-1495385794356-15371f348c31",
    category: "dress",
    colors: ["black", "sage", "rose"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Glossy satin-effect midi dress with adjustable waist tie.",
    listedMaterials: ["96% polyester, 4% elastane"],
    inferredMaterials: ["polyester satin"],
    materialConfidence: 0.83,
    softnessScore: 62,
    stretchScore: 58,
    breathabilityScore: 36,
    opacityScore: 74,
    durabilityScore: 78,
    careInstructions: ["machine wash cold", "do not tumble dry"],
    reviewSummary: "Affordable event option; less breathable than natural fiber alternatives."
  })
];

function matchesText(product: ProductResult, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [
    product.title,
    product.brand,
    product.retailer,
    product.category,
    product.description,
    product.listedMaterials.join(" "),
    product.inferredMaterials.join(" "),
    product.colors.join(" ")
  ]
    .join(" ")
    .toLowerCase();

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .some((word) => haystack.includes(word));
}

export async function searchMockProducts(input: ProductSearchInput): Promise<ProductResult[]> {
  const preferred = new Set((input.preferredMaterials ?? []).map((item) => normalizeFiberName(item).toLowerCase()));
  const avoid = new Set((input.avoidMaterials ?? []).map((item) => normalizeFiberName(item).toLowerCase()));

  return MOCK_PRODUCTS.filter((product) => matchesText(product, input.query))
    .filter((product) => (input.maxPrice ? product.price <= input.maxPrice : true))
    .filter((product) => {
      const fibers = product.normalizedMaterials.map((item) => item.fiber.toLowerCase());
      const hasPreferred = preferred.size === 0 || fibers.some((fiber) => preferred.has(fiber));
      const hasAvoided = fibers.some((fiber) => avoid.has(fiber));
      return hasPreferred && !hasAvoided;
    })
    .sort((a, b) => scoreSearchProduct(b, preferred) - scoreSearchProduct(a, preferred) || a.price - b.price);
}

function scoreSearchProduct(product: ProductResult, preferred: Set<string>): number {
  const fibers = product.normalizedMaterials.map((item) => item.fiber.toLowerCase());
  const preferredScore =
    preferred.size === 0 ? 70 : fibers.filter((fiber) => preferred.has(fiber)).length * 30;
  return (
    preferredScore * 0.35 +
    product.materialConfidence * 100 * 0.25 +
    scoreMaterialQuality(product) * 0.25 +
    product.softnessScore * 0.05 +
    product.breathabilityScore * 0.05 +
    product.durabilityScore * 0.05
  );
}
