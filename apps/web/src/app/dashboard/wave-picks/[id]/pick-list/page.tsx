"use client";

import { useState, useEffect, useCallback, use } from "react";
import { api } from "@/lib/api";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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

type WaveDetail = {
  id: string;
  carrier: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  orders: WaveOrder[];
  items: WaveItem[];
};

const CARRIER_LABELS: Record<string, string> = {
  auspost: "AusPost",
  tge: "TGE",
  toll: "Toll",
  allied_express: "Allied Express",
  tnt: "TNT",
  other: "Other",
};

export default function WavePickListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [wave, setWave] = useState<WaveDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<{ data: WaveDetail }>(`/api/wave-picks/${id}`);
      setWave(result.data);
    } catch {
      setWave(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="p-8 text-sm">Loading wave pick list...</div>;
  }

  if (!wave) {
    return (
      <div className="p-8">
        <p className="text-sm text-on-surface-variant">Wave pick not found.</p>
      </div>
    );
  }

  const totalUnits = wave.items.reduce((s, t) => s + t.totalQty, 0);

  return (
    <div className="pick-list-root">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .pick-list-root {
            color: black !important;
            background: white !important;
          }
          .pick-list-root * {
            color: black !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .pick-list-root .task-row {
            page-break-inside: avoid;
            border-bottom: 1px solid #ccc !important;
          }
          .pick-list-root .header {
            border-bottom: 2px solid black !important;
          }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110"
        >
          <Printer className="h-4 w-4" />
          Print Wave Pick List
        </button>
      </div>

      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-10 text-black shadow-lg print:p-0 print:shadow-none">
        <div className="header mb-8 border-b-2 border-black pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600">
                Wave Pick List
              </p>
              <h1 className="mt-1 text-3xl font-black">
                {CARRIER_LABELS[wave.carrier] ?? wave.carrier}
              </h1>
              <p className="mt-1 text-sm text-gray-700">
                {wave.orders.length} orders · {wave.items.length} pick tasks ·{" "}
                {totalUnits} units
              </p>
            </div>
            <div className="text-right text-xs text-gray-700">
              <p>Printed: {new Date().toLocaleString()}</p>
              <p className="mt-1">Wave: {wave.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* Orders in this wave */}
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-600">
              Orders in this wave
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {wave.orders.map((o) => (
                <span key={o.id} className="text-xs">
                  <span className="font-mono text-gray-600">
                    {o.orderNumber}
                  </span>{" "}
                  <span>{o.customerName}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {wave.items.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No pick tasks in this wave.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 w-12">
                  #
                </th>
                <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600">
                  Location
                </th>
                <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600">
                  Product
                </th>
                <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600">
                  SKU
                </th>
                <th className="py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-600 w-20">
                  Qty
                </th>
                <th className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-600 w-16">
                  ✓
                </th>
              </tr>
            </thead>
            <tbody>
              {wave.items.map((item, idx) => (
                <tr
                  key={item.id}
                  className="task-row border-b border-gray-300"
                >
                  <td className="py-4 text-sm font-bold text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="py-4">
                    <div className="inline-block rounded border-2 border-black px-3 py-1">
                      <span className="font-mono text-base font-bold">
                        {item.locationName}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-medium">
                    {item.productName}
                  </td>
                  <td className="py-4 text-xs font-mono text-gray-700">
                    {item.productSku}
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-2xl font-black">
                      {item.totalQty}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <div className="inline-block h-6 w-6 border-2 border-black" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-10 border-t-2 border-black pt-4">
          <div className="flex items-start justify-between text-xs text-gray-600">
            <div>
              <p className="uppercase tracking-wider">Picker signature</p>
              <div className="mt-6 w-64 border-b border-black" />
            </div>
            <div>
              <p className="uppercase tracking-wider">Date / Time</p>
              <div className="mt-6 w-48 border-b border-black" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
