"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Plus,
  ChevronRight,
  X,
  Package,
  MapPin,
  Check,
  AlertCircle,
  Printer,
} from "lucide-react";

type WavePick = {
  id: string;
  carrier: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  orderCount: number;
  itemCount: number;
  pickedCount: number;
};

type WaveItem = {
  id: string;
  productId: string;
  locationId: string;
  totalQty: number;
  pickedQty: number;
  productName: string;
  productSku: string;
  productBarcode: string | null;
  locationName: string;
  locationBarcode: string | null;
};

type WaveOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
};

type WaveDetail = WavePick & { orders: WaveOrder[]; items: WaveItem[] };

type Candidate = {
  id: string;
  orderNumber: string;
  customerName: string;
  carrier: string;
  createdAt: string;
  lineCount: number;
  totalQty: number;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  created: {
    label: "Created",
    color: "bg-secondary/15 text-secondary",
  },
  in_progress: { label: "In Progress", color: "bg-primary/15 text-primary" },
  completed: {
    label: "Completed",
    color: "bg-green-500/15 text-green-700",
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

export default function WavePicksPage() {
  const [waves, setWaves] = useState<WavePick[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedWave, setSelectedWave] = useState<string | null>(null);

  const fetchWaves = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<{ data: WavePick[] }>(
        `/api/wave-picks?pageSize=50`,
      );
      setWaves(result.data);
    } catch {
      setWaves([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaves();
  }, [fetchWaves]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] gradient-text">
            Outbound
          </p>
          <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
            Wave Picks
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Group orders by carrier into consolidated pick runs.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Create Wave
        </button>
      </div>

      <div className="glass-panel rounded-2xl crystalline-edge overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Carrier
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Status
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Orders
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Progress
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
            ) : waves.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-on-surface-variant"
                >
                  No wave picks yet. Create one to start picking by carrier.
                </td>
              </tr>
            ) : (
              waves.map((wave) => (
                <tr
                  key={wave.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/20 cursor-pointer"
                  onClick={() => setSelectedWave(wave.id)}
                >
                  <td className="px-6 py-3 text-sm font-medium">
                    {CARRIER_LABELS[wave.carrier] ?? wave.carrier}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        STATUS_LABELS[wave.status]?.color ?? ""
                      }`}
                    >
                      {STATUS_LABELS[wave.status]?.label ?? wave.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-sm">
                    {wave.orderCount}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-mono">
                    {wave.pickedCount} / {wave.itemCount}
                  </td>
                  <td className="px-6 py-3 text-sm text-on-surface-variant">
                    {new Date(wave.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <ChevronRight className="inline h-4 w-4 text-on-surface-variant" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateWaveModal
          onClose={() => {
            setShowCreate(false);
            fetchWaves();
          }}
        />
      )}

      {selectedWave && (
        <WaveDetailModal
          waveId={selectedWave}
          onClose={() => {
            setSelectedWave(null);
            fetchWaves();
          }}
        />
      )}
    </div>
  );
}

function CreateWaveModal({ onClose }: { onClose: () => void }) {
  const [carrier, setCarrier] = useState("auspost");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<{ data: Candidate[] }>(
        `/api/wave-picks/candidates?carrier=${carrier}`,
      );
      setCandidates(result.data);
      setSelectedIds(new Set(result.data.map((c) => c.id)));
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [carrier]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function handleCreate() {
    if (selectedIds.size === 0) return;
    setCreating(true);
    setError("");
    try {
      await api("/api/wave-picks", {
        method: "POST",
        body: JSON.stringify({
          carrier,
          salesOrderIds: Array.from(selectedIds),
        }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wave");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl p-8 crystalline-edge shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold font-[family-name:var(--font-headline)]">
            Create Wave Pick
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-error-container/20 px-4 py-3 text-sm text-error">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            Carrier
          </label>
          <div className="flex flex-wrap gap-2">
            {CARRIERS.map((c) => (
              <button
                key={c}
                onClick={() => setCarrier(c)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  carrier === c
                    ? "gradient-cta text-white shadow-lg shadow-primary/20"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                {CARRIER_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            Awaiting Pick — {CARRIER_LABELS[carrier]}
          </p>
          {candidates.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setSelectedIds(new Set(candidates.map((c) => c.id)))
                }
                className="text-xs font-bold text-primary hover:underline"
              >
                Select all
              </button>
              <span className="text-xs text-on-surface-variant">|</span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-bold text-on-surface-variant hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-on-surface-variant">
            Loading orders...
          </div>
        ) : candidates.length === 0 ? (
          <div className="rounded-xl bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
            No orders awaiting pick for {CARRIER_LABELS[carrier]}.
            <br />
            <span className="text-xs">
              Create a sales order and allocate stock first.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {candidates.map((c) => {
              const selected = selectedIds.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                    selected
                      ? "bg-primary/15 ring-2 ring-primary/30"
                      : "bg-surface-container-low hover:bg-surface-container-high"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                      selected
                        ? "border-primary bg-primary"
                        : "border-on-surface-variant/30"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.customerName}</p>
                    <p className="text-xs font-mono text-on-surface-variant">
                      {c.orderNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-on-surface-variant">
                      {c.lineCount} SKUs
                    </p>
                    <p className="text-xs font-bold">{c.totalQty} units</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-highest"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || selectedIds.size === 0}
            className="rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
          >
            {creating
              ? "Creating..."
              : `Create Wave (${selectedIds.size} orders)`}
          </button>
        </div>
      </div>
    </div>
  );
}

function WaveDetailModal({
  waveId,
  onClose,
}: {
  waveId: string;
  onClose: () => void;
}) {
  const [wave, setWave] = useState<WaveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const fetchWave = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<{ data: WaveDetail }>(
        `/api/wave-picks/${waveId}`,
      );
      setWave(result.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [waveId]);

  useEffect(() => {
    fetchWave();
  }, [fetchWave]);

  async function handlePick(itemId: string, qty: number) {
    try {
      await api(`/api/wave-picks/${waveId}/items/${itemId}/pick`, {
        method: "PUT",
        body: JSON.stringify({ pickedQty: qty }),
      });
      fetchWave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pick");
    }
  }

  async function handleComplete() {
    setWorking(true);
    setError("");
    try {
      await api(`/api/wave-picks/${waveId}/complete`, { method: "POST" });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete");
    } finally {
      setWorking(false);
    }
  }

  async function handleCancel() {
    setWorking(true);
    setError("");
    try {
      await api(`/api/wave-picks/${waveId}/cancel`, { method: "POST" });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setWorking(false);
    }
  }

  if (loading || !wave) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="glass-panel rounded-3xl p-8 crystalline-edge shadow-2xl">
          Loading...
        </div>
      </div>
    );
  }

  const allPicked =
    wave.items.length > 0 && wave.items.every((i) => i.pickedQty >= i.totalQty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl p-8 crystalline-edge shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] gradient-text">
              Wave Pick — {CARRIER_LABELS[wave.carrier] ?? wave.carrier}
            </p>
            <h2 className="text-xl font-bold font-[family-name:var(--font-headline)]">
              {wave.orders.length} orders · {wave.items.length} pick tasks
            </h2>
            <div className="mt-2">
              <span
                className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                  STATUS_LABELS[wave.status]?.color ?? ""
                }`}
              >
                {STATUS_LABELS[wave.status]?.label ?? wave.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`/dashboard/wave-picks/${waveId}/pick-list`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest"
            >
              <Printer className="h-4 w-4" />
              Print
            </a>
            <button
              onClick={onClose}
              className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest"
            >
              Close
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-error-container/20 px-4 py-3 text-sm text-error">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Orders in wave */}
        <div className="mb-6">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            Orders in this wave
          </p>
          <div className="flex flex-wrap gap-2">
            {wave.orders.map((o) => (
              <div
                key={o.id}
                className="rounded-lg bg-surface-container-low px-3 py-1.5"
              >
                <span className="text-xs font-medium">{o.customerName}</span>
                <span className="ml-2 text-xs font-mono text-on-surface-variant">
                  {o.orderNumber}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pick Tasks */}
        <div className="mb-6">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            Pick tasks (sorted by location)
          </p>
          <div className="space-y-2">
            {wave.items.map((item) => {
              const complete = item.pickedQty >= item.totalQty;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    complete
                      ? "bg-green-500/10"
                      : "bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center gap-2 w-36">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-mono font-bold">
                      {item.locationName}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.productName}
                    </p>
                    <p className="text-xs font-mono text-on-surface-variant">
                      {item.productSku}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={item.totalQty}
                      defaultValue={item.pickedQty}
                      disabled={wave.status === "completed"}
                      onBlur={(e) =>
                        handlePick(item.id, Number(e.target.value))
                      }
                      className="w-16 rounded-lg bg-surface-container-lowest px-3 py-1.5 text-sm text-right font-mono outline-none focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
                    />
                    <span className="text-sm font-mono text-on-surface-variant">
                      / {item.totalQty}
                    </span>
                    {complete && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {wave.status !== "completed" && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleComplete}
              disabled={working || !allPicked}
              className="flex-1 rounded-xl gradient-cta py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {working
                ? "Completing..."
                : allPicked
                  ? "Complete Wave — Update Inventory"
                  : "Pick all items first"}
            </button>
            <button
              onClick={handleCancel}
              disabled={working}
              className="rounded-xl bg-error-container/20 px-5 py-3 text-sm font-bold text-error hover:bg-error-container/30 transition-all disabled:opacity-50"
            >
              Cancel Wave
            </button>
          </div>
        )}

        {wave.status === "completed" && (
          <div className="rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-700">
            <Package className="inline h-4 w-4 mr-2" />
            Wave complete. Orders moved to Awaiting Pack.
          </div>
        )}
      </div>
    </div>
  );
}
