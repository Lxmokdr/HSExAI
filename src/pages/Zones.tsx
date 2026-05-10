import { useState, useEffect } from "react";
import {
  MapPin, Plus, Pencil, Trash2, X, Check,
  AlertTriangle, RefreshCw, Shield, Info,
  Footprints, Glasses
} from "lucide-react";
import { apiClient, Zone } from "@/services/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const RISK_STYLES: Record<string, { badge: string; dot: string }> = {
  critical: { badge: "bg-red-900/50 text-red-200 border border-red-400/40",    dot: "bg-red-500" },
  high:     { badge: "bg-red-900/30 text-red-300 border border-red-500/30",    dot: "bg-red-400" },
  medium:   { badge: "bg-orange-900/30 text-orange-300 border border-orange-500/30", dot: "bg-orange-400" },
  low:      { badge: "bg-green-900/30 text-green-300 border border-green-500/30",    dot: "bg-green-400" },
};

const PPE_OPTIONS = [
  { id: "helmet", label: "Hard Hat", icon: Shield },
  { id: "vest",   label: "Safety Vest", icon: Shield },
  { id: "gloves", label: "Safety Gloves", icon: Shield },
  { id: "mask",   label: "Face Mask", icon: Shield },
  { id: "shoes",  label: "Safety Shoes", icon: Footprints },
  { id: "glasses", label: "Eye Protection", icon: Glasses },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  risk_category: "medium" as Zone["risk_category"],
  location: "",
  is_active: true,
  required_ppe_rules: [] as string[],
  compliance_threshold: 80,
};

// ─────────────────────────────────────────────────────────────────────────────
// Zone Form Modal
// ─────────────────────────────────────────────────────────────────────────────
function ZoneModal({
  zone,
  onClose,
  onSave,
}: {
  zone: Partial<Zone> | null;
  onClose: () => void;
  onSave: (data: typeof EMPTY_FORM) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(zone ?? {}) });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const togglePPE = (id: string) => {
    const current = [...form.required_ppe_rules];
    if (current.includes(id)) {
      setForm({ ...form, required_ppe_rules: current.filter(x => x !== id) });
    } else {
      setForm({ ...form, required_ppe_rules: [...current, id] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr("Zone name is required."); return; }
    setSaving(true);
    setErr(null);
    try {
      await onSave(form);
      onClose();
    } catch (ex: any) {
      setErr(ex.message ?? "Failed to save zone.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-400" />
            {zone?.id ? "Edit Safety Zone" : "Configure New Zone"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wider">Zone Name *</label>
              <input
                type="text" value={form.name} required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Hazardous Materials Area"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 placeholder:text-slate-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wider">Risk Category</label>
              <select
                value={form.risk_category}
                onChange={(e) => setForm({ ...form, risk_category: e.target.value as Zone["risk_category"] })}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wider">Location</label>
              <input
                type="text" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Building B, Floor 2"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-3 block uppercase tracking-wider">Required PPE for this Zone</label>
            <div className="grid grid-cols-2 gap-3">
              {PPE_OPTIONS.map((ppe) => (
                <button
                  key={ppe.id}
                  type="button"
                  onClick={() => togglePPE(ppe.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                    form.required_ppe_rules.includes(ppe.id)
                      ? "bg-blue-600/20 border-blue-500 text-blue-100 ring-1 ring-blue-500"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    form.required_ppe_rules.includes(ppe.id) ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-500"
                  )}>
                    <ppe.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{ppe.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Compliance Threshold</label>
              <span className="text-sm font-bold text-blue-400">{form.compliance_threshold}%</span>
            </div>
            <input
              type="range" min="0" max="100" step="5"
              value={form.compliance_threshold}
              onChange={(e) => setForm({ ...form, compliance_threshold: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Alerts will trigger when compliance falls below this level.
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <input
              type="checkbox" checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 accent-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-200">Enable Active Monitoring</span>
              <p className="text-[10px] text-slate-500">Only active zones trigger real-time violations.</p>
            </div>
          </label>

          {err && (
            <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {err}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm text-white font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
              {saving ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              {zone?.id ? "Update Configuration" : "Create Zone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Zones() {
  const { user } = useAuth();
  const canEdit = user?.role === "superadmin" || user?.role === "chef_departement";

  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalZone, setModalZone] = useState<Partial<Zone> | null | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getZones();
      setZones(Array.isArray(data) ? data : data.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form: typeof EMPTY_FORM) => {
    if (modalZone && (modalZone as Zone).id) {
      await apiClient.updateZone((modalZone as Zone).id, form);
    } else {
      await apiClient.createZone(form);
    }
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteZone(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
              <MapPin className="h-6 w-6 text-blue-400" />
            </div>
            Zone Management
          </h1>
          <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
            Configure PPE requirements and risk thresholds for monitoring areas · 
            <span className="text-blue-400 font-medium">{zones.length} Active Zones</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={load}
            className="flex items-center justify-center h-11 w-11 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
            title="Refresh zones"
          >
            <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
          </button>
          {canEdit && (
            <button
              onClick={() => setModalZone({})}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-sm text-white font-bold transition-all shadow-xl shadow-blue-900/40"
            >
              <Plus className="h-5 w-5" />
              New Safety Zone
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-4 text-sm text-red-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-slate-400 animate-pulse font-medium">Synchronizing safety zones...</p>
        </div>
      ) : zones.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center py-24 gap-6">
          <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center">
            <MapPin className="h-10 w-10 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-slate-200 font-bold text-lg">No zones configured yet</p>
            <p className="text-slate-500 text-sm mt-1">Start by adding a monitored area with specific safety rules.</p>
          </div>
          {canEdit && (
            <button
              onClick={() => setModalZone({})}
              className="bg-slate-800 hover:bg-slate-700 text-blue-400 px-6 py-2.5 rounded-xl text-sm font-bold border border-slate-700 transition-all"
            >
              Configure First Zone
            </button>
          )}
        </div>
      ) : (
        /* Zone Cards Grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => {
            const style = RISK_STYLES[zone.risk_category] ?? RISK_STYLES.medium;
            return (
              <div
                key={zone.id}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden hover:border-blue-500/50 hover:bg-slate-900/80 transition-all duration-300 shadow-xl"
              >
                {/* Status Bar */}
                <div className={cn("h-1.5 w-full", style.dot)} />

                <div className="p-6 space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-lg truncate group-hover:text-blue-400 transition-colors">{zone.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-xs text-slate-400">{zone.location || "Undisclosed Location"}</span>
                      </div>
                    </div>
                    <span className={cn("rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest whitespace-nowrap", style.badge)}>
                      {zone.risk_category}
                    </span>
                  </div>

                  {/* Description */}
                  {zone.description && (
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 min-h-[40px]">{zone.description}</p>
                  )}

                  {/* PPE Rules */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Required PPE</span>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Threshold: {zone.compliance_threshold}%</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {zone.required_ppe_rules && zone.required_ppe_rules.length > 0 ? (
                        zone.required_ppe_rules.map(rule => (
                          <span key={rule} className="px-2 py-1 bg-slate-800 rounded-md text-[10px] font-medium text-slate-300 border border-slate-700 flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-blue-400" />
                            {rule.toUpperCase()}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">No PPE rules defined</span>
                      )}
                    </div>
                  </div>

                  {/* Stats Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Violations</span>
                        <span className="text-sm font-bold text-white">{zone.violation_count}</span>
                      </div>
                      <div className="h-6 w-[1px] bg-slate-800" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Status</span>
                        <span className={cn("text-sm font-bold", zone.is_active ? "text-green-400" : "text-slate-600")}>
                          {zone.is_active ? "Live" : "Offline"}
                        </span>
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModalZone(zone)}
                          className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                          title="Edit configuration"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(zone)}
                          className="h-9 w-9 rounded-lg flex items-center justify-center bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-600 hover:text-white transition-all"
                          title="Deactivate zone"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Zone Modal */}
      {modalZone !== false && (
        <ZoneModal
          zone={modalZone}
          onClose={() => setModalZone(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-red-900/20 flex items-center justify-center border border-red-500/30">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Deactivate Zone</h3>
                <p className="text-slate-400 text-sm mt-2">
                  Are you sure you want to take <strong className="text-slate-100">"{deleteTarget.name}"</strong> offline? 
                  Monitoring for this area will be suspended.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-bold text-slate-400 hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-3 text-sm font-bold text-white transition-all disabled:opacity-60 shadow-lg shadow-red-900/20"
              >
                {deleting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
