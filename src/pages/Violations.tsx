import { useState, useEffect } from "react";
import {
  AlertTriangle, Filter, ChevronLeft, ChevronRight,
  Shield, Search, RefreshCw,
} from "lucide-react";
import { apiClient, SafetyViolation, Zone } from "@/services/api";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const RISK_STYLE: Record<string, string> = {
  critical: "bg-red-900/60 text-red-200 border border-red-400/40",
  high:     "bg-red-900/40 text-red-300 border border-red-500/30",
  medium:   "bg-orange-900/40 text-orange-300 border border-orange-500/30",
  low:      "bg-green-900/40 text-green-300 border border-green-500/30",
};

const VIOLATION_LABEL: Record<string, string> = {
  no_helmet:           "No Helmet",
  no_vest:             "No Safety Vest",
  no_mask:             "No Face Mask",
  no_gloves:           "No Gloves",
  unauthorized_person: "Unauthorized Person",
  other:               "Other",
};

const VIOLATION_ICON: Record<string, string> = {
  no_helmet:           "⛑️",
  no_vest:             "🦺",
  no_mask:             "😷",
  no_gloves:           "🧤",
  unauthorized_person: "🚫",
  other:               "⚠️",
};

const PAGE_SIZE = 15;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Violations() {
  const [violations, setViolations] = useState<SafetyViolation[]>([]);
  const [total, setTotal] = useState(0);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterRisk, setFilterRisk] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterZone, setFilterZone] = useState<number | "">("");
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vData, zData] = await Promise.all([
        apiClient.getViolations({
          risk_level: filterRisk || undefined,
          type: filterType || undefined,
          zone: filterZone ? Number(filterZone) : undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        }),
        apiClient.getZones(),
      ]);
      setViolations(vData.results);
      setTotal(vData.count);
      setZones(zData.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterRisk, filterType, filterZone, page]);

  const handleFilterChange = () => { setPage(0); };

  return (
    <div className="space-y-5 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            Safety Violations
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            All PPE non-compliance events detected by AI · {total} total
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
          </div>

          {/* Risk level */}
          <select
            value={filterRisk}
            onChange={(e) => { setFilterRisk(e.target.value); handleFilterChange(); }}
            className="rounded-lg bg-slate-700/60 border border-slate-600 text-slate-200 text-sm px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Violation type */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); handleFilterChange(); }}
            className="rounded-lg bg-slate-700/60 border border-slate-600 text-slate-200 text-sm px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Types</option>
            {Object.entries(VIOLATION_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Zone */}
          <select
            value={filterZone}
            onChange={(e) => { setFilterZone(e.target.value ? Number(e.target.value) : ""); handleFilterChange(); }}
            className="rounded-lg bg-slate-700/60 border border-slate-600 text-slate-200 text-sm px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>

          {/* Clear */}
          {(filterRisk || filterType || filterZone) && (
            <button
              onClick={() => { setFilterRisk(""); setFilterType(""); setFilterZone(""); setPage(0); }}
              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        ) : violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Shield className="h-12 w-12 text-slate-600" />
            <p className="text-slate-400 font-medium">No violations found</p>
            <p className="text-slate-600 text-sm">
              {filterRisk || filterType || filterZone
                ? "Try clearing filters"
                : "Upload images to start detecting PPE violations"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3 text-left">ID</th>
                    <th className="px-5 py-3 text-left">Violation Type</th>
                    <th className="px-5 py-3 text-left">Risk Level</th>
                    <th className="px-5 py-3 text-left">Confidence</th>
                    <th className="px-5 py-3 text-left">Zone</th>
                    <th className="px-5 py-3 text-left">Event</th>
                    <th className="px-5 py-3 text-left">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-slate-400 text-xs">#{v.id}</td>

                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 text-slate-200">
                          <span>{VIOLATION_ICON[v.violation_type] ?? "⚠️"}</span>
                          <span>{VIOLATION_LABEL[v.violation_type] ?? v.violation_type_display}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <span className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          RISK_STYLE[v.risk_level]
                        )}>
                          {v.risk_level.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                v.confidence_score >= 0.8 ? "bg-green-500" :
                                v.confidence_score >= 0.6 ? "bg-orange-500" : "bg-red-500"
                              )}
                              style={{ width: `${v.confidence_score * 100}%` }}
                            />
                          </div>
                          <span className="text-slate-400 text-xs font-mono">
                            {(v.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-slate-300">
                        {v.zone_name ? (
                          <span className="rounded-md bg-slate-700/50 px-2 py-0.5 text-xs">
                            {v.zone_name}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3 font-mono text-xs text-blue-400">
                        #{v.event_id}
                      </td>

                      <td className="px-5 py-3 text-slate-400 text-xs">
                        {new Date(v.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/30">
                <span className="text-xs text-slate-500">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                  <span className="flex items-center px-3 text-xs text-slate-400">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
