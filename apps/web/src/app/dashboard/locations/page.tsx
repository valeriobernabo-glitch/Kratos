"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Plus, Search, Pencil, Trash2, X, Grid3X3 } from "lucide-react";
import type { Location } from "@kratos/shared";

type PaginatedLocations = {
  data: Location[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const ROWS = ["A", "B", "C", "D", "E", "F", "G"];

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [rowFilter, setRowFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (rowFilter) params.set("row", rowFilter);
      params.set("page", String(page));
      params.set("pageSize", "50");

      const result = await api<PaginatedLocations>(
        `/api/locations?${params.toString()}`,
      );
      setLocations(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [search, rowFilter, page]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this location?")) return;
    await api(`/api/locations/${id}`, { method: "DELETE" });
    fetchLocations();
  }

  function handleEdit(location: Location) {
    setEditing(location);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setShowBulkForm(false);
    setEditing(null);
    fetchLocations();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] gradient-text">
            Warehouse
          </p>
          <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
            Locations
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkForm(true)}
            className="flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-bold text-primary transition-all hover:bg-surface-container-highest"
          >
            <Grid3X3 className="h-4 w-4" />
            Generate Rack
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Add Location
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name or barcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRowFilter("");
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              !rowFilter
                ? "bg-primary text-white"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            All
          </button>
          {ROWS.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRowFilter(r);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                rowFilter === r
                  ? "bg-primary text-white"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl crystalline-edge overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Name
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Barcode
              </th>
              <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Row
              </th>
              <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Bay
              </th>
              <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Level
              </th>
              <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Bin
              </th>
              <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Type
              </th>
              <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Efficiency
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-on-surface-variant">
                  Loading...
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-on-surface-variant">
                  {search || rowFilter
                    ? "No locations match your filters"
                    : "No locations yet. Use 'Generate Rack' to create locations in bulk."}
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr
                  key={loc.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/20"
                >
                  <td className="px-6 py-3 text-sm font-mono font-medium">
                    {loc.name}
                  </td>
                  <td className="px-6 py-3 text-sm text-on-surface-variant font-mono">
                    {loc.barcode}
                  </td>
                  <td className="px-6 py-3 text-sm text-center">{loc.row ?? "—"}</td>
                  <td className="px-6 py-3 text-sm text-center">{loc.bay ?? "—"}</td>
                  <td className="px-6 py-3 text-sm text-center">{loc.level ?? "—"}</td>
                  <td className="px-6 py-3 text-sm text-center">{loc.bin ?? "—"}</td>
                  <td className="px-6 py-3 text-sm text-center capitalize">{loc.locationType}</td>
                  <td className="px-6 py-3 text-sm text-center">{loc.efficiency}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(loc)}
                        className="rounded-lg p-1.5 text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id)}
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
              {total} locations total
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

      {/* Bulk Generate Form */}
      {showBulkForm && <BulkGenerateForm onClose={handleFormClose} />}

      {/* Add/Edit Form */}
      {showForm && <LocationForm location={editing} onClose={handleFormClose} />}
    </div>
  );
}

function BulkGenerateForm({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [row, setRow] = useState("A");
  const [bayStart, setBayStart] = useState("1");
  const [bayEnd, setBayEnd] = useState("10");
  const [levels, setLevels] = useState("4");
  const [binsPerLevel, setBinsPerLevel] = useState("4");
  const [efficiency, setEfficiency] = useState("5");

  const preview =
    Number(bayEnd) >= Number(bayStart)
      ? (Number(bayEnd) - Number(bayStart) + 1) *
        Number(levels) *
        Number(binsPerLevel)
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api("/api/locations/generate", {
        method: "POST",
        body: JSON.stringify({
          row,
          bayStart: Number(bayStart),
          bayEnd: Number(bayEnd),
          levels: Number(levels),
          binsPerLevel: Number(binsPerLevel),
          efficiency: Number(efficiency),
        }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 crystalline-edge shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold font-[family-name:var(--font-headline)]">
            Generate Rack Locations
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-on-surface-variant hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-error-container/20 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Row
            </label>
            <select
              value={row}
              onChange={(e) => setRow(e.target.value)}
              className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none"
            >
              {ROWS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Bay Start
              </label>
              <input type="number" min="1" value={bayStart} onChange={(e) => setBayStart(e.target.value)} className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Bay End
              </label>
              <input type="number" min="1" value={bayEnd} onChange={(e) => setBayEnd(e.target.value)} className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Levels
              </label>
              <input type="number" min="1" max="10" value={levels} onChange={(e) => setLevels(e.target.value)} className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Bins/Level
              </label>
              <input type="number" min="1" max="10" value={binsPerLevel} onChange={(e) => setBinsPerLevel(e.target.value)} className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Efficiency
              </label>
              <input type="number" min="1" max="5" value={efficiency} onChange={(e) => setEfficiency(e.target.value)} className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none" />
            </div>
          </div>

          <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-sm text-on-surface-variant">
              This will create <span className="font-bold text-primary">{preview} locations</span>
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              e.g. {row}-{bayStart.padStart(2, "0")}-L1-B1 through {row}-{bayEnd.padStart(2, "0")}-L{levels}-B{binsPerLevel}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-highest">
              Cancel
            </button>
            <button type="submit" disabled={loading || preview === 0} className="rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50">
              {loading ? "Generating..." : `Generate ${preview} Locations`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LocationForm({
  location,
  onClose,
}: {
  location: Location | null;
  onClose: () => void;
}) {
  const isEditing = !!location;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(location?.name ?? "");
  const [barcode, setBarcode] = useState(location?.barcode ?? "");
  const [row, setRow] = useState(location?.row ?? "");
  const [bay, setBay] = useState(location?.bay?.toString() ?? "");
  const [level, setLevel] = useState(location?.level?.toString() ?? "");
  const [bin, setBin] = useState(location?.bin?.toString() ?? "");
  const [locationType, setLocationType] = useState<string>(location?.locationType ?? "rack");
  const [efficiency, setEfficiency] = useState(location?.efficiency?.toString() ?? "5");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body = {
      name,
      barcode,
      row: row || undefined,
      bay: bay ? Number(bay) : undefined,
      level: level ? Number(level) : undefined,
      bin: bin ? Number(bin) : undefined,
      locationType,
      efficiency: Number(efficiency),
    };

    try {
      if (isEditing) {
        await api(`/api/locations/${location.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/locations", {
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
            {isEditing ? "Edit Location" : "Add Location"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-on-surface-variant hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-error-container/20 px-4 py-3 text-sm text-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Barcode *</label>
              <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} required className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none transition-all focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px] focus:shadow-primary-fixed-dim/30" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Row</label>
              <input type="text" maxLength={1} value={row} onChange={(e) => setRow(e.target.value.toUpperCase())} className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Bay</label>
              <input type="number" min="1" value={bay} onChange={(e) => setBay(e.target.value)} className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Level</label>
              <input type="number" min="1" value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Bin</label>
              <input type="number" min="1" value={bin} onChange={(e) => setBin(e.target.value)} className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Type</label>
              <select value={locationType} onChange={(e) => setLocationType(e.target.value)} className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none">
                <option value="rack">Rack</option>
                <option value="floor">Floor</option>
                <option value="office">Office</option>
                <option value="receiving">Receiving</option>
                <option value="dispatch">Dispatch</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Efficiency (1-5)</label>
              <input type="number" min="1" max="5" value={efficiency} onChange={(e) => setEfficiency(e.target.value)} className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-highest">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50">
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
