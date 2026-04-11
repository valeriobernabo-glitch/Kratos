"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Search, Plus, ArrowUpDown, Package, MapPin, AlertTriangle, Boxes } from "lucide-react";

type StockItem = {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  updatedAt: string;
  productName: string;
  productSku: string;
  productBarcode: string | null;
  locationName: string;
  locationBarcode: string;
};

type StockSummary = {
  totalProducts: number;
  totalLocations: number;
  totalUnits: number;
  lowStockCount: number;
  lowStockItems: Array<{
    productId: string;
    productName: string;
    productSku: string;
    totalQty: number;
    threshold: number;
  }>;
};

type PaginatedStock = {
  data: StockItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export default function InventoryPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState(false);
  const [tab, setTab] = useState<"stock" | "low-stock">("stock");

  const fetchSummary = useCallback(async () => {
    try {
      const result = await api<{ data: StockSummary }>("/api/inventory/summary");
      setSummary(result.data);
    } catch {
      // API not connected
    }
  }, []);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "25");

      const result = await api<PaginatedStock>(
        `/api/inventory?${params.toString()}`,
      );
      setStock(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setStock([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSummary();
    fetchStock();
  }, [fetchSummary, fetchStock]);

  function handleAdjustClose() {
    setShowAdjust(false);
    fetchSummary();
    fetchStock();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] gradient-text">
            Warehouse
          </p>
          <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
            Inventory
          </h1>
        </div>
        <button
          onClick={() => setShowAdjust(true)}
          className="flex items-center gap-2 rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110"
        >
          <ArrowUpDown className="h-4 w-4" />
          Stock Adjustment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        <SummaryCard
          icon={<Package className="h-5 w-5" />}
          label="Active Products"
          value={summary?.totalProducts ?? 0}
          color="primary"
        />
        <SummaryCard
          icon={<MapPin className="h-5 w-5" />}
          label="Active Locations"
          value={summary?.totalLocations ?? 0}
          color="secondary"
        />
        <SummaryCard
          icon={<Boxes className="h-5 w-5" />}
          label="Total Units"
          value={summary?.totalUnits ?? 0}
          color="tertiary"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Low Stock Alerts"
          value={summary?.lowStockCount ?? 0}
          color="error"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("stock")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            tab === "stock"
              ? "gradient-cta text-white shadow-lg shadow-primary/20"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          Stock on Hand
        </button>
        <button
          onClick={() => setTab("low-stock")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            tab === "low-stock"
              ? "gradient-cta text-white shadow-lg shadow-primary/20"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          Low Stock ({summary?.lowStockCount ?? 0})
        </button>
      </div>

      {tab === "stock" ? (
        <>
          {/* Stock Table */}
          <div className="glass-panel rounded-2xl crystalline-edge overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                      Loading...
                    </td>
                  </tr>
                ) : stock.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                      No stock records yet. Use Stock Adjustment to add inventory.
                    </td>
                  </tr>
                ) : (
                  stock.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 transition-colors hover:bg-white/20"
                    >
                      <td className="px-6 py-3 text-sm font-medium">
                        {item.productName}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-on-surface-variant">
                        {item.productSku}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                          {item.locationName}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-bold font-[family-name:var(--font-headline)]">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-3 text-right text-xs text-on-surface-variant">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/10 px-6 py-3">
                <p className="text-xs text-on-surface-variant">
                  {total} stock records
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg px-3 py-1 text-xs font-medium text-on-surface-variant hover:bg-white/20 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-on-surface-variant">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg px-3 py-1 text-xs font-medium text-on-surface-variant hover:bg-white/20 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Low Stock Tab */
        <div className="glass-panel rounded-2xl crystalline-edge overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  SKU
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Current Qty
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Threshold
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Shortfall
                </th>
              </tr>
            </thead>
            <tbody>
              {!summary || summary.lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    No low stock alerts
                  </td>
                </tr>
              ) : (
                summary.lowStockItems.map((item) => (
                  <tr
                    key={item.productId}
                    className="border-b border-white/5 transition-colors hover:bg-white/20"
                  >
                    <td className="px-6 py-3 text-sm font-medium">
                      {item.productName}
                    </td>
                    <td className="px-6 py-3 text-sm font-mono text-on-surface-variant">
                      {item.productSku}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-error">
                      {item.totalQty}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-on-surface-variant">
                      {item.threshold}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-error">
                      {item.totalQty - item.threshold}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjust && <AdjustModal onClose={handleAdjustClose} />}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "primary" | "secondary" | "tertiary" | "error";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    tertiary: "bg-tertiary/10 text-tertiary",
    error: "bg-error/10 text-error",
  };

  return (
    <div className="glass-panel rounded-2xl p-6 crystalline-edge">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 text-3xl font-extrabold font-[family-name:var(--font-headline)]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function AdjustModal({ onClose }: { onClose: () => void }) {
  const [productSearch, setProductSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string }>>([]);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; sku: string } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name: string } | null>(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (productSearch.length >= 2) {
      api<{ data: Array<{ id: string; name: string; sku: string }> }>(
        `/api/products?search=${productSearch}&pageSize=5`,
      ).then((r) => setProducts(r.data));
    } else {
      setProducts([]);
    }
  }, [productSearch]);

  useEffect(() => {
    if (locationSearch.length >= 1) {
      api<{ data: Array<{ id: string; name: string }> }>(
        `/api/locations?search=${locationSearch}&pageSize=10`,
      ).then((r) => setLocations(r.data));
    } else {
      setLocations([]);
    }
  }, [locationSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || !selectedLocation || !quantity) return;

    setError("");
    setLoading(true);

    try {
      await api("/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProduct.id,
          locationId: selectedLocation.id,
          quantity: Number(quantity),
          notes: notes || undefined,
        }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-8 crystalline-edge shadow-2xl">
        <h2 className="mb-6 text-xl font-bold font-[family-name:var(--font-headline)]">
          Stock Adjustment
        </h2>

        {error && (
          <div className="mb-4 rounded-xl bg-error-container/20 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Search */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Product *
            </label>
            {selectedProduct ? (
              <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-2.5">
                <span className="text-sm font-medium">
                  {selectedProduct.name}{" "}
                  <span className="text-on-surface-variant">({selectedProduct.sku})</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setProductSearch("");
                  }}
                  className="text-xs text-primary hover:text-primary-dim"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search product by name or SKU..."
                  className="w-full rounded-xl bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
                />
                {products.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl bg-surface-container-lowest shadow-xl crystalline-edge overflow-hidden">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(p);
                          setProducts([]);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-primary/10 transition-colors"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="ml-2 text-on-surface-variant">({p.sku})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location Search */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Location *
            </label>
            {selectedLocation ? (
              <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-2.5">
                <span className="text-sm font-medium">{selectedLocation.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocation(null);
                    setLocationSearch("");
                  }}
                  className="text-xs text-primary hover:text-primary-dim"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Search location (e.g. A-01)..."
                  className="w-full rounded-xl bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
                />
                {locations.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl bg-surface-container-lowest shadow-xl crystalline-edge">
                    {locations.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(l);
                          setLocations([]);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-primary/10 transition-colors"
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Quantity * (positive to add, negative to remove)
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              placeholder="e.g. 10 or -5"
              className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for adjustment..."
              className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-highest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProduct || !selectedLocation || !quantity}
              className="rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Apply Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
