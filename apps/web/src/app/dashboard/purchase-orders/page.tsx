"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Plus,
  Search,
  Trash2,
  ChevronRight,
  MapPin,
  Check,
} from "lucide-react";

type PurchaseOrder = {
  id: string;
  supplierName: string;
  status: string;
  expectedDate: string | null;
  notes: string | null;
  createdAt: string;
};

type POLine = {
  id: string;
  productId: string;
  expectedQty: number;
  receivedQty: number;
  productName: string;
  productSku: string;
  productBarcode: string | null;
};

type PODetail = PurchaseOrder & { lines: POLine[] };

type PaginatedPOs = {
  data: PurchaseOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-surface-container-high text-on-surface-variant" },
  awaiting_arrival: { label: "Awaiting Arrival", color: "bg-secondary/15 text-secondary" },
  receiving: { label: "Receiving", color: "bg-primary/15 text-primary" },
  received: { label: "Received", color: "bg-green-500/15 text-green-700" },
  closed: { label: "Closed", color: "bg-surface-container-high text-on-surface-variant" },
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPO, setSelectedPO] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const result = await api<PaginatedPOs>(
        `/api/purchase-orders?${params.toString()}`,
      );
      setOrders(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] gradient-text">
            Inbound
          </p>
          <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
            Purchase Orders
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Create PO
        </button>
      </div>

      {/* Status Filters */}
      <div className="mb-6 flex gap-2">
        {[
          { key: "", label: "All" },
          { key: "draft", label: "Draft" },
          { key: "awaiting_arrival", label: "Awaiting" },
          { key: "receiving", label: "Receiving" },
          { key: "received", label: "Received" },
          { key: "closed", label: "Closed" },
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

      {/* Orders Table */}
      <div className="glass-panel rounded-2xl crystalline-edge overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Status
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Expected Date
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
                <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                  No purchase orders yet. Create one to get started.
                </td>
              </tr>
            ) : (
              orders.map((po) => (
                <tr
                  key={po.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/20 cursor-pointer"
                  onClick={() => setSelectedPO(po.id)}
                >
                  <td className="px-6 py-3 text-sm font-medium">
                    {po.supplierName}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        STATUS_LABELS[po.status]?.color ?? ""
                      }`}
                    >
                      {STATUS_LABELS[po.status]?.label ?? po.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-on-surface-variant">
                    {po.expectedDate
                      ? new Date(po.expectedDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-3 text-sm text-on-surface-variant">
                    {new Date(po.createdAt).toLocaleDateString()}
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
        <CreatePOModal
          onClose={() => {
            setShowCreate(false);
            fetchOrders();
          }}
        />
      )}

      {selectedPO && (
        <PODetailModal
          poId={selectedPO}
          onClose={() => {
            setSelectedPO(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}

function CreatePOModal({ onClose }: { onClose: () => void }) {
  const [supplierName, setSupplierName] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<
    Array<{ productId: string; productName: string; productSku: string; expectedQty: number }>
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
        expectedQty: 1,
      },
    ]);
    setProductSearch("");
    setSearchResults([]);
  }

  function updateQty(productId: string, qty: number) {
    setLines(lines.map((l) => (l.productId === productId ? { ...l, expectedQty: qty } : l)));
  }

  function removeLine(productId: string) {
    setLines(lines.filter((l) => l.productId !== productId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierName || lines.length === 0) return;

    setError("");
    setLoading(true);

    try {
      await api("/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          supplierName,
          expectedDate: expectedDate || undefined,
          notes: notes || undefined,
          lines: lines.map((l) => ({
            productId: l.productId,
            expectedQty: l.expectedQty,
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
        <h2 className="mb-6 text-xl font-bold font-[family-name:var(--font-headline)]">
          Create Purchase Order
        </h2>

        {error && (
          <div className="mb-4 rounded-xl bg-error-container/20 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Supplier *
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
                placeholder="Supplier name"
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Expected Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
            />
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
                      <span className="ml-2 text-on-surface-variant">({p.sku})</span>
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
                    <span className="text-sm font-medium">{line.productName}</span>
                    <span className="ml-2 text-xs text-on-surface-variant">
                      ({line.productSku})
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={line.expectedQty}
                    onChange={(e) => updateQty(line.productId, Number(e.target.value))}
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
              disabled={loading || !supplierName || lines.length === 0}
              className="rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create PO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PODetailModal({ poId, onClose }: { poId: string; onClose: () => void }) {
  const [po, setPO] = useState<PODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  const fetchPO = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<{ data: PODetail }>(`/api/purchase-orders/${poId}`);
      setPO(result.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    fetchPO();
  }, [fetchPO]);

  useEffect(() => {
    if (locationSearch.length >= 1) {
      api<{ data: Array<{ id: string; name: string }> }>(
        `/api/locations?search=${locationSearch}&pageSize=10`,
      ).then((r) => setLocations(r.data));
    } else {
      setLocations([]);
    }
  }, [locationSearch]);

  async function handleReceiveLine(lineId: string, receivedQty: number) {
    await api(`/api/purchase-orders/${poId}/lines/${lineId}/receive`, {
      method: "PUT",
      body: JSON.stringify({ receivedQty }),
    });
    fetchPO();
  }

  async function handleComplete() {
    if (!selectedLocation) return;
    setCompleting(true);
    try {
      await api(`/api/purchase-orders/${poId}/complete`, {
        method: "POST",
        body: JSON.stringify({ locationId: selectedLocation.id }),
      });
      onClose();
    } catch {
      // ignore
    } finally {
      setCompleting(false);
    }
  }

  async function handleStatusChange(status: string) {
    await api(`/api/purchase-orders/${poId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    fetchPO();
  }

  if (loading || !po) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="glass-panel rounded-3xl p-8 crystalline-edge shadow-2xl">
          Loading...
        </div>
      </div>
    );
  }

  const allReceived =
    po.lines.length > 0 && po.lines.every((l) => l.receivedQty >= l.expectedQty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl p-8 crystalline-edge shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-[family-name:var(--font-headline)]">
              {po.supplierName}
            </h2>
            <div className="mt-1 flex items-center gap-3">
              <span
                className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                  STATUS_LABELS[po.status]?.color ?? ""
                }`}
              >
                {STATUS_LABELS[po.status]?.label ?? po.status}
              </span>
              {po.expectedDate && (
                <span className="text-xs text-on-surface-variant">
                  Expected: {new Date(po.expectedDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest"
          >
            Close
          </button>
        </div>

        {/* Status Actions */}
        {po.status === "draft" && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => handleStatusChange("awaiting_arrival")}
              className="rounded-xl bg-secondary/15 px-4 py-2 text-sm font-bold text-secondary hover:bg-secondary/25 transition-all"
            >
              Mark as Awaiting Arrival
            </button>
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
                  Expected
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Received
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((line) => (
                <tr key={line.id} className="border-b border-white/5">
                  <td className="px-4 py-3 text-sm font-medium">{line.productName}</td>
                  <td className="px-4 py-3 text-sm font-mono text-on-surface-variant">
                    {line.productSku}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{line.expectedQty}</td>
                  <td className="px-4 py-3 text-right">
                    {po.status !== "received" && po.status !== "closed" ? (
                      <input
                        type="number"
                        min="0"
                        defaultValue={line.receivedQty}
                        onBlur={(e) =>
                          handleReceiveLine(line.id, Number(e.target.value))
                        }
                        className="w-20 rounded-lg bg-surface-container-lowest px-3 py-1.5 text-sm text-right outline-none focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
                      />
                    ) : (
                      <span className="text-sm">{line.receivedQty}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {line.receivedQty >= line.expectedQty ? (
                      <Check className="inline h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-on-surface-variant">
                        {line.receivedQty}/{line.expectedQty}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Complete Receiving */}
        {po.status !== "received" &&
          po.status !== "closed" &&
          allReceived && (
            <div className="mt-6">
              {!showComplete ? (
                <button
                  onClick={() => setShowComplete(true)}
                  className="w-full rounded-xl gradient-cta py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110"
                >
                  Complete Receiving — All Items Received
                </button>
              ) : (
                <div className="rounded-xl bg-primary/5 p-4 space-y-3">
                  <p className="text-sm font-bold">
                    Select receiving location (where stock will be placed):
                  </p>
                  {selectedLocation ? (
                    <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-2.5">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="h-4 w-4 text-primary" />
                        {selectedLocation.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLocation(null);
                          setLocationSearch("");
                        }}
                        className="text-xs text-primary"
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
                        placeholder="Search location..."
                        className="w-full rounded-xl bg-surface-container-lowest py-2.5 pl-10 pr-4 text-sm outline-none focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
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
                  <button
                    onClick={handleComplete}
                    disabled={completing || !selectedLocation}
                    className="w-full rounded-xl gradient-cta py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
                  >
                    {completing ? "Completing..." : "Confirm & Update Inventory"}
                  </button>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
