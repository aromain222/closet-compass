import type {
  BudgetShoppingRecommendation,
  DupeComparison,
  ImageSearchAnalysis,
  MaterialProfile,
  PriceHistoryPoint,
  ProductResult,
  ProductSearchResponse,
  SavedProduct,
  SpendingSummary,
  WishlistItem,
} from "@/lib/products/types";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return apiFetch<T>(url.pathname + url.search);
}

function del<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE", body: JSON.stringify(body) });
}

export interface SearchRequest {
  query: string;
  maxPrice?: number;
  preferredMaterials?: string[];
  avoidMaterials?: string[];
  occasion?: string;
  stylePreferences?: string[];
  sizePreferences?: Record<string, string>;
}

export interface ImageSearchRequest {
  imageUrl?: string;
  imageBase64?: string;
  query?: string;
  maxPrice?: number;
  preferredMaterials?: string[];
  avoidMaterials?: string[];
}

export interface DupeRequest {
  productId?: string;
  sourceProduct?: ProductResult;
  maxPrice?: number;
  preferredMaterials?: string[];
  avoidMaterials?: string[];
  limit?: number;
}

export interface DupeResponse {
  sourceProduct: ProductResult;
  alternatives: DupeComparison[];
  agentSummary: string;
}

export interface ImageSearchResponse extends ProductSearchResponse {
  imageSearch: ImageSearchAnalysis;
}

export interface ProductDetailResponse {
  product: ProductResult;
  materialProfile: MaterialProfile;
}

export interface SaveProductRequest {
  userId: string;
  product: ProductResult;
  notes?: string;
}

export interface SaveProductResponse {
  savedProduct: SavedProduct;
  materialProfile: MaterialProfile;
}

export interface TrackProductRequest {
  userId: string;
  product: ProductResult;
  targetPrice?: number;
  notifyOnDrop?: boolean;
}

export interface TrackingSummary {
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  dropFromHigh: number;
  note: string;
  targetPrice?: number;
  atOrBelowTarget?: boolean;
}

export interface TrackProductResponse {
  mode?: string;
  tracked: boolean;
  targetPrice?: number | null;
  notifyOnDrop?: boolean;
  pricePoint?: PriceHistoryPoint;
  trackingSummary: TrackingSummary;
}

export interface PriceTrackingResponse {
  mode?: string;
  productId: string;
  priceHistory: PriceHistoryPoint[];
  trackingSummary: TrackingSummary;
}

export interface WishlistCreateRequest {
  userId: string;
  product: ProductResult;
  priority?: "low" | "medium" | "high";
  targetPrice?: number;
}

export interface WishlistDeleteRequest {
  userId: string;
  wishlistItemId?: string;
  productId?: string;
}

export interface SpendingSummaryRequest {
  userId: string;
  month?: string;
  budgetLimit?: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface BudgetRecommendationRequest {
  userId: string;
  month?: string;
  budgetLimit?: number;
  maxRecommendations?: number;
}

export interface BudgetRecommendationsResponse {
  mode?: string;
  spendingSummary: SpendingSummary;
  recommendations: BudgetShoppingRecommendation[];
}

export interface PlaidLinkTokenResponse {
  mode: string;
  linkToken: string;
  expiration?: string;
  requestId?: string;
}

export interface PlaidExchangeResponse {
  mode: string;
  itemId: string;
  connected: boolean;
  note?: string;
}

export interface StripeCheckoutRequest {
  userId?: string;
  customerEmail?: string;
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface StripeCheckoutResponse {
  mode: string;
  checkoutUrl: string;
  sessionId: string;
  priceId: string;
  userId?: string;
  premiumLayer?: string;
}

export const api = {
  search: (body: SearchRequest) =>
    post<ProductSearchResponse>("/api/search", body),

  searchImage: (body: ImageSearchRequest) =>
    post<ImageSearchResponse>("/api/search/image", body),

  findDupes: (body: DupeRequest) =>
    post<DupeResponse>("/api/dupe", body),

  getProduct: (id: string) =>
    get<ProductDetailResponse>(`/api/products/${id}`),

  getSavedProducts: (userId: string) =>
    get<{ savedProducts: SavedProduct[] }>("/api/products/save", { userId }),

  saveProduct: (body: SaveProductRequest) =>
    post<SaveProductResponse>("/api/products/save", body),

  getPriceHistory: (productId: string, userId?: string) =>
    get<PriceTrackingResponse>("/api/products/track", {
      productId,
      ...(userId ? { userId } : {}),
    }),

  trackProduct: (body: TrackProductRequest) =>
    post<TrackProductResponse>("/api/products/track", body),

  getWishlist: (userId: string) =>
    get<{ items: WishlistItem[] }>("/api/wishlist", { userId }),

  addToWishlist: (body: WishlistCreateRequest) =>
    post<{ item: WishlistItem }>("/api/wishlist", body),

  removeFromWishlist: (body: WishlistDeleteRequest) =>
    del<{ deleted: boolean }>("/api/wishlist", body),

  getSpendingSummary: (body: SpendingSummaryRequest) =>
    post<SpendingSummary>("/api/spending/summary", body),

  getBudgetRecommendations: (body: BudgetRecommendationRequest) =>
    post<BudgetRecommendationsResponse>("/api/spending/recommendations", body),

  createPlaidLinkToken: (userId: string) =>
    post<PlaidLinkTokenResponse>("/api/plaid/create-link-token", { userId }),

  exchangePlaidToken: (userId: string, publicToken: string) =>
    post<PlaidExchangeResponse>("/api/plaid/exchange-token", { userId, publicToken }),

  createStripeCheckout: (body: StripeCheckoutRequest) =>
    post<StripeCheckoutResponse>("/api/stripe/create-checkout-session", body),
};
