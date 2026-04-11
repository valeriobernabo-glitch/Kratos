"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
import type { Product } from "@kratos/shared";

type PaginatedProducts = {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const result = await api<PaginatedProducts>(
        `/api/products?${params.toString()}`,
      );
      setProducts(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      // API not connected yet — show empty state
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await api(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  }

  function handleEdit(product: Product) {
    setEditing(product);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditing(null);
    fetchProducts();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] gradient-text">
            Warehouse
          </p>
          <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
            Products
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl crystalline-edge overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Name
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Barcode
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Weight (kg)
              </th>
              <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Active
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                  {search
                    ? "No products match your search"
                    : "No products yet. Add your first product to get started."}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/20"
                >
                  <td className="px-6 py-3 text-sm font-mono font-medium">
                    {product.sku}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium">
                    {product.name}
                  </td>
                  <td className="px-6 py-3 text-sm text-on-surface-variant font-mono">
                    {product.barcode ?? "—"}
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-on-surface-variant">
                    {product.weightKg ?? "—"}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        product.active ? "bg-green-500" : "bg-red-400"
                      }`}
                    />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(product)}
                        className="rounded-lg p-1.5 text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="rounded-lg p-1.5 text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-3">
            <p className="text-xs text-on-surface-variant">
              {total} products total
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

      {/* Add/Edit Form Modal */}
      {showForm && (
        <ProductForm
          product={editing}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}

function ProductForm({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const isEditing = !!product;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sku, setSku] = useState(product?.sku ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [weightKg, setWeightKg] = useState(product?.weightKg?.toString() ?? "");
  const [volumeM3, setVolumeM3] = useState(product?.volumeM3?.toString() ?? "");
  const [lowStockThreshold, setLowStockThreshold] = useState(
    product?.lowStockThreshold?.toString() ?? "5",
  );
  const [active, setActive] = useState(product?.active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body = {
      sku,
      name,
      description: description || undefined,
      barcode: barcode || undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      volumeM3: volumeM3 ? Number(volumeM3) : undefined,
      lowStockThreshold: Number(lowStockThreshold),
      active,
    };

    try {
      if (isEditing) {
        await api(`/api/products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-8 crystalline-edge shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold font-[family-name:var(--font-headline)]">
            {isEditing ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-error-container/20 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                SKU *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Barcode
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Volume (m3)
              </label>
              <input
                type="number"
                step="0.001"
                value={volumeM3}
                onChange={(e) => setVolumeM3(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <label htmlFor="active" className="text-sm text-on-surface-variant">
              Active
            </label>
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
              disabled={loading}
              className="rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
