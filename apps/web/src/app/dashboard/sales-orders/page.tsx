"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Plus,
  Search,
  Trash2,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Printer,
  Package as PackageIcon,
  Truck,
} from "lucide-react";

type SalesOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  carrier: string;
  shippingService: string | null;
  status: string;
  source: string;
  createdAt: string;
};

type SOLine = {
  id: string;
  productId: string;
  orderedQty: number;
  allocatedQty: number;
  pickedQty: number;
  packedQty: number;
  productName: string;
  productSku: string;
  productBarcode: string | null;
};

type Allocation = {
  id: string;
  salesOrderLineId: string;
  quantity: number;
  locationName: string;
};

type SODetail = SalesOrder & { lines: SOLine[]; allocations: Allocation[] };

type PaginatedSOs = {
  data: SalesOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: {
    label: "Draft",
    color: "bg-surface-container-high text-on-surface-variant",
  },
  awaiting_pick: {
    label: "Awaiting Pick",
    color: "bg-secondary/15 text-secondary",
  },
  picking: { label: "Picking", color: "bg-primary/15 text-primary" },
  awaiting_pack: {
    label: "Awaiting Pack",
    color: "bg-secondary/15 text-secondary",
  },
  packing: { label: "Packing", color: "bg-primary/15 text-primary" },
  packed: { label: "Packed", color: "bg-green-500/15 text-green-700" },
  shipped: { label: "Shipped", color: "bg-green-600/15 text-green-800" },
  cancelled: {
    label: "Cancelled",
    color: "bg-error-container/20 text-error",
  },
};

const CARRIER_LABELS: Record<string, string> = {
  auspost: "AusPost",
  tge: "TGE",
  toll: "Toll",
  allied_express: "Allied Express",
  tnt: "TNT",
  other: "Other",
};

const CARRIERS = Object.keys(CARRIER_LABELS);

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSO, setSelectedSO] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (carrierFilter) params.set("carrier", carrierFilter);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const result = await api<PaginatedSOs>(
        `/api/sales-orders?${params.toString()}`,
      );
      setOrders(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, carrierFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] gradient-text">
            Outbound
          </p>
          <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
            Sales Orders
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Create SO
        </button>
      </div>

      {/* Status Filters */}
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          { key: "", label: "All" },
          { key: "draft", label: "Draft" },
          { key: "awaiting_pick", label: "Awaiting Pick" },
          { key: "picking", label: "Picking" },
          { key: "awaiting_pack", label: "Awaiting Pack" },
          { key: "packed", label: "Packed" },
          { key: "shipped", label: "Shipped" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setStatusFilter(f.key);
              setPage(1);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              statusFilter === f.key
                ? "gradient-cta text-white shadow-lg shadow-primary/20"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Carrier Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="flex items-center px-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
          Carrier:
        </span>
        <button
          onClick={() => {
            setCarrierFilter("");
            setPage(1);
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            carrierFilter === ""
              ? "bg-primary/15 text-primary"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          All
        </button>
        {CARRIERS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCarrierFilter(c);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              carrierFilter === c
                ? "bg-primary/15 text-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {CARRIER_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-2xl crystalline-edge overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Carrier
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Status
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Created
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-on-surface-variant"
                >
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-on-surface-variant"
                >
                  No sales orders yet. Create one to get started.
                </td>
              </tr>
            ) : (
              orders.map((so) => (
                <tr
                  key={so.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/20 cursor-pointer"
                  onClick={() => setSelectedSO(so.id)}
                >
                  <td className="px-6 py-3 text-sm font-mono font-medium">
                    {so.orderNumber}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium">
                    {so.customerName}
                  </td>
                  <td className="px-6 py-3 text-sm text-on-surface-variant">
                    {CARRIER_LABELS[so.carrier] ?? so.carrier}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        STATUS_LABELS[so.status]?.color ?? ""
                      }`}
                    >
                      {STATUS_LABELS[so.status]?.label ?? so.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-on-surface-variant">
                    {new Date(so.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <ChevronRight className="inline h-4 w-4 text-on-surface-variant" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-3">
            <p className="text-xs text-on-surface-variant">{total} orders</p>
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

      {showCreate && (
        <CreateSOModal
          onClose={() => {
            setShowCreate(false);
            fetchOrders();
          }}
        />
      )}

      {selectedSO && (
        <SODetailModal
          soId={selectedSO}
          onClose={() => {
            setSelectedSO(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}

function CreateSOModal({ onClose }: { onClose: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [carrier, setCarrier] = useState("auspost");
  const [shippingService, setShippingService] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [lines, setLines] = useState<
    Array<{
      productId: string;
      productName: string;
      productSku: string;
      orderedQty: number;
    }>
  >([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; name: string; sku: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (productSearch.length >= 2) {
      api<{ data: Array<{ id: string; name: string; sku: string }> }>(
        `/api/products?search=${productSearch}&pageSize=5`,
      ).then((r) => setSearchResults(r.data));
    } else {
      setSearchResults([]);
    }
  }, [productSearch]);

  function addProduct(product: { id: string; name: string; sku: string }) {
    if (lines.find((l) => l.productId === product.id)) return;
    setLines([
      ...lines,
      {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        orderedQty: 1,
      },
    ]);
    setProductSearch("");
    setSearchResults([]);
  }

  function updateQty(productId: string, qty: number) {
    setLines(
      lines.map((l) =>
        l.productId === productId ? { ...l, orderedQty: qty } : l,
      ),
    );
  }

  function removeLine(productId: string) {
    setLines(lines.filter((l) => l.productId !== productId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName || !carrier || lines.length === 0) return;

    setError("");
    setLoading(true);

    try {
      await api("/api/sales-orders", {
        method: "POST",
        body: JSON.stringify({
          orderNumber: orderNumber || undefined,
          customerName,
          carrier,
          shippingService: shippingService || undefined,
          lines: lines.map((l) => ({
            productId: l.productId,
            orderedQty: l.orderedQty,
          })),
        }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl p-8 crystalline-edge shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold font-[family-name:var(--font-headline)]">
            Create Sales Order
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-white/20"
          >
            <X className="h-4 w-4" />
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
                Customer *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                placeholder="Customer name"
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Order Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Auto-generated"
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm font-mono outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Carrier *
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                required
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              >
                {CARRIERS.map((c) => (
                  <option key={c} value={c}>
                    {CARRIER_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Shipping Service
              </label>
              <input
                type="text"
                value={shippingService}
                onChange={(e) => setShippingService(e.target.value)}
                placeholder="e.g. Express, Standard"
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              />
            </div>
          </div>

          {/* Add Products */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Products *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product to add..."
                className="w-full rounded-xl bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl bg-surface-container-lowest shadow-xl crystalline-edge overflow-hidden">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-primary/10 transition-colors"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-2 text-on-surface-variant">
                        ({p.sku})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lines */}
          {lines.length > 0 && (
            <div className="space-y-2">
              {lines.map((line) => (
                <div
                  key={line.productId}
                  className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-2.5"
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {line.productName}
                    </span>
                    <span className="ml-2 text-xs text-on-surface-variant">
                      ({line.productSku})
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={line.orderedQty}
                    onChange={(e) =>
                      updateQty(line.productId, Number(e.target.value))
                    }
                    className="w-20 rounded-lg bg-surface-container-lowest px-3 py-1.5 text-sm text-center outline-none focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(line.productId)}
                    className="rounded-lg p-1.5 text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

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
              disabled={loading || !customerName || lines.length === 0}
              className="rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create SO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SODetailModal({
  soId,
  onClose,
}: {
  soId: string;
  onClose: () => void;
}) {
  const [so, setSO] = useState<SODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const fetchSO = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<{ data: SODetail }>(`/api/sales-orders/${soId}`);
      setSO(result.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [soId]);

  useEffect(() => {
    fetchSO();
  }, [fetchSO]);

  async function handleAllocate() {
    setWorking(true);
    setError("");
    try {
      await api(`/api/sales-orders/${soId}/allocate`, { method: "POST" });
      await fetchSO();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to allocate stock",
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleRelease() {
    setWorking(true);
    setError("");
    try {
      await api(`/api/sales-orders/${soId}/release`, { method: "POST" });
      await fetchSO();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to release stock",
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleCancel() {
    setWorking(true);
    setError("");
    try {
      await api(`/api/sales-orders/${soId}/cancel`, { method: "POST" });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setWorking(false);
    }
  }

  async function handlePack() {
    setWorking(true);
    setError("");
    try {
      await api(`/api/sales-orders/${soId}/pack`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await fetchSO();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pack");
    } finally {
      setWorking(false);
    }
  }

  async function handleShip(trackingNumber: string) {
    setWorking(true);
    setError("");
    try {
      await api(`/api/sales-orders/${soId}/ship`, {
        method: "POST",
        body: JSON.stringify({ trackingNumber }),
      });
      await fetchSO();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ship");
    } finally {
      setWorking(false);
    }
  }

  if (loading || !so) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="glass-panel rounded-3xl p-8 crystalline-edge shadow-2xl">
          Loading...
        </div>
      </div>
    );
  }

  const totalOrdered = so.lines.reduce((s, l) => s + l.orderedQty, 0);
  const totalAllocated = so.lines.reduce((s, l) => s + l.allocatedQty, 0);
  const fullyAllocated = totalOrdered === totalAllocated && totalOrdered > 0;
  const partiallyAllocated =
    totalAllocated > 0 && totalAllocated < totalOrdered;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl p-8 crystalline-edge shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-mono text-on-surface-variant">
              {so.orderNumber}
            </p>
            <h2 className="text-xl font-bold font-[family-name:var(--font-headline)]">
              {so.customerName}
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                  STATUS_LABELS[so.status]?.color ?? ""
                }`}
              >
                {STATUS_LABELS[so.status]?.label ?? so.status}
              </span>
              <span className="text-xs text-on-surface-variant">
                {CARRIER_LABELS[so.carrier] ?? so.carrier}
                {so.shippingService && ` — ${so.shippingService}`}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest"
          >
            Close
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-error-container/20 px-4 py-3 text-sm text-error">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Actions */}
        {so.status === "draft" && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={handleAllocate}
              disabled={working}
              className="rounded-xl gradient-cta px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {working ? "Allocating..." : "Allocate Stock"}
            </button>
            <button
              onClick={handleCancel}
              disabled={working}
              className="rounded-xl bg-error-container/20 px-4 py-2 text-sm font-bold text-error hover:bg-error-container/30 transition-all disabled:opacity-50"
            >
              Cancel Order
            </button>
          </div>
        )}

        {so.status === "awaiting_pick" && (
          <div className="mb-6 flex flex-wrap gap-2">
            <a
              href={`/dashboard/sales-orders/${soId}/pick-list`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl gradient-cta px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110"
            >
              <Printer className="h-4 w-4" />
              Print Pick List
            </a>
            <button
              onClick={handleRelease}
              disabled={working}
              className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-all disabled:opacity-50"
            >
              {working ? "Releasing..." : "Release Stock (back to Draft)"}
            </button>
            <button
              onClick={handleCancel}
              disabled={working}
              className="rounded-xl bg-error-container/20 px-4 py-2 text-sm font-bold text-error hover:bg-error-container/30 transition-all disabled:opacity-50"
            >
              Cancel Order
            </button>
          </div>
        )}

        {/* Allocation summary */}
        {so.status === "draft" && partiallyAllocated && (
          <div className="mb-4 rounded-xl bg-secondary/15 px-4 py-3 text-sm text-secondary">
            Only {totalAllocated} of {totalOrdered} units allocated. Not enough
            stock.
          </div>
        )}

        {/* Lines Table */}
        <div className="rounded-xl bg-surface-container-low overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  SKU
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Ordered
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Allocated
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Picked
                </th>
              </tr>
            </thead>
            <tbody>
              {so.lines.map((line) => {
                const fullyAlloc = line.allocatedQty >= line.orderedQty;
                const fullyPicked = line.pickedQty >= line.orderedQty;
                return (
                  <tr key={line.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-sm font-medium">
                      {line.productName}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-on-surface-variant">
                      {line.productSku}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {line.orderedQty}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-medium ${
                          fullyAlloc
                            ? "text-green-600"
                            : line.allocatedQty > 0
                              ? "text-secondary"
                              : "text-on-surface-variant"
                        }`}
                      >
                        {line.allocatedQty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {fullyPicked && line.pickedQty > 0 ? (
                        <Check className="inline h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-sm text-on-surface-variant">
                          {line.pickedQty}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Allocations list */}
        {so.allocations.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Reserved From
            </p>
            <div className="rounded-xl bg-surface-container-low p-3 space-y-1">
              {so.allocations.map((a) => {
                const line = so.lines.find((l) => l.id === a.salesOrderLineId);
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-on-surface-variant">
                      {line?.productName ?? "Unknown"}
                    </span>
                    <span className="font-mono">
                      {a.quantity} @ {a.locationName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {so.status === "awaiting_pick" && fullyAllocated && (
          <div className="mt-6 rounded-xl bg-primary/5 px-4 py-3 text-sm text-on-surface">
            Stock reserved. This order is ready for a wave pick — go to{" "}
            <a
              href="/dashboard/wave-picks"
              className="font-bold text-primary underline"
            >
              Wave Picks
            </a>{" "}
            to group it with other orders for the same carrier.
          </div>
        )}

        {/* Awaiting Pack: Mark as Packed */}
        {so.status === "awaiting_pack" && (
          <div className="mt-6 rounded-xl bg-primary/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold">
              <PackageIcon className="h-4 w-4 text-primary" />
              Ready to pack
            </div>
            <p className="mb-3 text-xs text-on-surface-variant">
              All picked items will be combined into one package and the order
              marked as packed.
            </p>
            <button
              onClick={handlePack}
              disabled={working}
              className="w-full rounded-xl gradient-cta py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {working ? "Packing..." : "Mark as Packed"}
            </button>
          </div>
        )}

        {/* Packed: Ship with tracking */}
        {so.status === "packed" && (
          <ShipForm
            working={working}
            onShip={handleShip}
          />
        )}

        {/* Shipped: show confirmation */}
        {so.status === "shipped" && (
          <div className="mt-6 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-700">
            <Truck className="inline h-4 w-4 mr-2" />
            Order shipped.
          </div>
        )}
      </div>
    </div>
  );
}

function ShipForm({
  working,
  onShip,
}: {
  working: boolean;
  onShip: (trackingNumber: string) => void;
}) {
  const [tracking, setTracking] = useState("");

  return (
    <div className="mt-6 rounded-xl bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Truck className="h-4 w-4 text-primary" />
        Ready to ship
      </div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
        Tracking Number
      </label>
      <input
        type="text"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        placeholder="e.g. AP1234567890AU"
        className="mb-3 w-full rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm font-mono outline-none focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
      />
      <button
        onClick={() => onShip(tracking)}
        disabled={working || !tracking.trim()}
        className="w-full rounded-xl gradient-cta py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
      >
        {working ? "Shipping..." : "Mark as Shipped"}
      </button>
    </div>
  );
}
