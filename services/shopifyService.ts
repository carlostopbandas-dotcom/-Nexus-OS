export interface ShopifyOrder {
  id: number;
  name: string;
  total_price: string;
  financial_status: string;
  created_at: string;
  customer: { first_name: string; last_name: string } | null;
  line_items: { title: string; quantity: number }[];
}

type ServiceResult<T> = { data: T; error: string | null }

const STORE_PREFIXES = {
  moriel: '/api/shopify',
  vcchic: '/api/vcchic',
  sezo:   '/api/sezo',
} as const;

export type ShopifyStoreKey = keyof typeof STORE_PREFIXES;

export const shopifyService = {
  async getLiveOrders(store: ShopifyStoreKey): Promise<ServiceResult<ShopifyOrder[]>> {
    try {
      const res = await fetch(
        `${STORE_PREFIXES[store]}/orders.json?limit=50&status=any&fields=id,name,total_price,financial_status,created_at,customer,line_items`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { data: data.orders || [], error: null };
    } catch (e) {
      return { data: [], error: e.message };
    }
  },

  async getYtdOrders(store: ShopifyStoreKey): Promise<ServiceResult<ShopifyOrder[]>> {
    const yearStart = `${new Date().getFullYear()}-01-01T00:00:00`;
    try {
      const res = await fetch(
        `${STORE_PREFIXES[store]}/orders.json?limit=250&status=any&created_at_min=${yearStart}&fields=id,total_price,financial_status,created_at`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { data: data.orders || [], error: null };
    } catch (e) {
      return { data: [], error: e.message };
    }
  },
}
