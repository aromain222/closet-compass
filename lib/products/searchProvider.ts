import type { ProductResult, ProductSearchInput } from "@/lib/products/types";
import { searchMockProducts } from "@/lib/products/mockProvider";
import { getServerEnv } from "@/lib/utils/env";

export interface ProductSearchProvider {
  search(input: ProductSearchInput): Promise<ProductResult[]>;
  getById(id: string): Promise<ProductResult | null>;
}

export function getProductSearchProvider(): ProductSearchProvider {
  const env = getServerEnv();

  // Real providers can implement this interface without changing API routes.
  switch (env.shoppingProvider) {
    case "mock":
    case "serpapi":
    case "searchapi":
    case "retailer":
    default:
      return {
        search: searchMockProducts,
        getById: async (id) => {
          const products = await searchMockProducts({ query: "" });
          return products.find((product) => product.id === id) ?? null;
        }
      };
  }
}
