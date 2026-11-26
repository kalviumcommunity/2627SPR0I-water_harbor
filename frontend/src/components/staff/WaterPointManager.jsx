import { useState, useMemo } from 'react';
import { Droplets, Plus, Pencil, Power, AlertCircle, X, MapPin } from 'lucide-react';
import {
  WATER_POINT_TYPE_OPTIONS,
  formatWaterPointType,
  formatLocationPath,
  buildLocationDisplayLabel,
  filterWaterPointsStructured,
} from '../../lib/locationFilters';
import { formatBackendError } from '../../lib/reliability';

const EMPTY_WP_FORM = {
  name: '',
  location: '',
  building: '',
  type: '',
  campus_location_id: '',
};

export function WaterPointManager({
  waterPoints,
  campusLocations,
  onCreateWaterPoint,
  onUpdateWaterPoint,
}) {
  const [form, setForm] = useState(EMPTY_WP_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [formError, setFormError] = useState('');

  // Structured inventory filters
  const [selectedBlockId, setSelectedBlockId] = useState('ALL');
  const [selectedFloorId, setSelectedFloorId] = useState('ALL');
  const [selectedBuildingId, setSelectedBuildingId] = useState('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedActiveState, setSelectedActiveState] = useState('all');

  const locationsById = useMemo(() => {
    const map = new Map();
    campusLocations.forEach((loc) => map.set(loc.id, loc));
    return map;
  }, [campusLocations]);

  const activeLocations = useMemo(
    () => campusLocations.filter((l) => l.is_active),
    [campusLocations]
  );

  const blocks = useMemo(
    () => campusLocations.filter((l) => l.location_type === 'block'),
    [campusLocations]
  );
  const floors = useMemo(
    () => campusLocations.filter((l) => l.location_type === 'floor'),
    [campusLocations]
  );
  const buildings = useMemo(
    () =>
      campusLocations.filter(
        (l) => l.location_type === 'building' || l.location_type === 'facility'
      ),
    [campusLocations]
  );
  const areas = useMemo(
    () =>
      campusLocations.filter(
        (l) => l.location_type === 'indoor_area' || l.location_type === 'outdoor_area'
      ),
    [campusLocations]
  );

  const filteredPoints = useMemo(() => {
    return filterWaterPointsStructured({
      waterPoints,
      campusLocations,
      selectedBlockId,
      selectedFloorId,
      selectedBuildingId,
      selectedAreaId,
      selectedType,
      selectedActiveState,
    });
  }, [
    waterPoints,
    campusLocations,
    selectedBlockId,
    selectedFloorId,
    selectedBuildingId,
    selectedAreaId,
    selectedType,
    selectedActiveState,
  ]);

  const startEdit = (wp) => {
    setEditingId(wp.id);
    setFormError('');
    setForm({
      name: wp.name,
      location: wp.location,
      building: wp.building || '',
      type: wp.type || '',
      campus_location_id: wp.campus_location_id ? String(wp.campus_location_id) : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_WP_FORM);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      setFormError('Station name and location description are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      building: form.campus_location_id ? null : (form.building.trim() || null),
      type: form.type || null,
      campus_location_id: form.campus_location_id ? Number(form.campus_location_id) : null,
    };

    try {
      if (editingId) {
        await onUpdateWaterPoint(editingId, payload);
      } else {
        await onCreateWaterPoint(payload);
      }
      cancelEdit();
    } catch (err) {
      setFormError(formatBackendError(err, 'submit'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (wp) => {
    setTogglingId(wp.id);
    setFormError('');
    try {
      await onUpdateWaterPoint(wp.id, { is_active: !wp.is_active });
    } catch (err) {
      setFormError(formatBackendError(err, 'submit'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <section aria-label="Water Point Management" className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#DFE6F0] pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-[#102454] flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[#102454]" />
            <span>Water-Point Inventory Management</span>
          </h2>
          <p className="text-xs text-[#5A6B87]">
            Add, edit, categorize, and activate/deactivate campus water stations.
          </p>
        </div>
        <span className="text-xs font-medium text-[#5A6B87]">
          {filteredPoints.length} of {waterPoints.length} shown
        </span>
      </div>

      {/* Create / Edit Water Point Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#DFE6F0] rounded-xl p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#102454]">
            {editingId ? 'Edit Water Point' : 'Add New Water Point'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#5A6B87] hover:text-[#102454] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel edit</span>
            </button>
          )}
        </div>

        {formError && (
          <div role="alert" className="p-2.5 bg-[#FDF2F2] border border-[#F8C9C9] rounded-lg text-xs text-[#B91C1C] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label htmlFor="wp-name" className="block text-[11px] font-semibold text-[#102454] mb-1">
              Station Name *
            </label>
            <input
              id="wp-name"
              type="text"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. North Wing Dispenser"
              disabled={submitting}
              className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs focus:border-[#102454]"
            />
          </div>

          <div>
            <label htmlFor="wp-location-desc" className="block text-[11px] font-semibold text-[#102454] mb-1">
              Location Description *
            </label>
            <input
              id="wp-location-desc"
              type="text"
              required
              maxLength={255}
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Outside Room 104, East Corridor"
              disabled={submitting}
              className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs focus:border-[#102454]"
            />
          </div>

          <div>
            <label htmlFor="wp-type" className="block text-[11px] font-semibold text-[#102454] mb-1">
              Category / Type
            </label>
            <select
              id="wp-type"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              disabled={submitting}
              className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs focus:border-[#102454]"
            >
              <option value="">Select category (optional)</option>
              {WATER_POINT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="wp-campus-loc" className="block text-[11px] font-semibold text-[#102454] mb-1">
              Campus Location (Hierarchy)
            </label>
            <select
              id="wp-campus-loc"
              value={form.campus_location_id}
              onChange={(e) => {
                const nextLocId = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  campus_location_id: nextLocId,
                  building: nextLocId ? '' : prev.building,
                }));
              }}
              disabled={submitting}
              className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs focus:border-[#102454]"
            >
              <option value="">Unassigned (Legacy / Custom)</option>
              {activeLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {buildLocationDisplayLabel(loc, locationsById)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="wp-building" className="block text-[11px] font-semibold text-[#102454] mb-1">
              Building Label (Optional)
            </label>
            <input
              id="wp-building"
              type="text"
              maxLength={100}
              value={form.campus_location_id ? '' : form.building}
              onChange={(e) => setForm((prev) => ({ ...prev, building: e.target.value }))}
              placeholder={
                form.campus_location_id
                  ? 'Auto-derived from campus hierarchy'
                  : 'Optional building label'
              }
              disabled={submitting || Boolean(form.campus_location_id)}
              className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs focus:border-[#102454] disabled:bg-[#F8FAFC] disabled:text-[#8C9CB3]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#102454] hover:bg-[#183375] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Water Point'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Structured Filters */}
      <div className="bg-white border border-[#DFE6F0] rounded-xl p-3 shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <select
          aria-label="Filter inventory by block"
          value={selectedBlockId}
          onChange={(e) => setSelectedBlockId(e.target.value)}
          className="py-1.5 px-2.5 bg-[#F8FAFC] text-[#102454] border border-[#DFE6F0] rounded-lg text-xs"
        >
          <option value="ALL">All Blocks</option>
          {blocks.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          aria-label="Filter inventory by building or facility"
          value={selectedBuildingId}
          onChange={(e) => setSelectedBuildingId(e.target.value)}
          className="py-1.5 px-2.5 bg-[#F8FAFC] text-[#102454] border border-[#DFE6F0] rounded-lg text-xs"
        >
          <option value="ALL">All Buildings/Facilities</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          aria-label="Filter inventory by floor"
          value={selectedFloorId}
          onChange={(e) => setSelectedFloorId(e.target.value)}
          className="py-1.5 px-2.5 bg-[#F8FAFC] text-[#102454] border border-[#DFE6F0] rounded-lg text-xs"
        >
          <option value="ALL">All Floors</option>
          {floors.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        <select
          aria-label="Filter inventory by area"
          value={selectedAreaId}
          onChange={(e) => setSelectedAreaId(e.target.value)}
          className="py-1.5 px-2.5 bg-[#F8FAFC] text-[#102454] border border-[#DFE6F0] rounded-lg text-xs"
        >
          <option value="ALL">All Areas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <select
          aria-label="Filter inventory by category"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="py-1.5 px-2.5 bg-[#F8FAFC] text-[#102454] border border-[#DFE6F0] rounded-lg text-xs"
        >
          <option value="ALL">All Categories</option>
          {WATER_POINT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          aria-label="Filter inventory by status"
          value={selectedActiveState}
          onChange={(e) => setSelectedActiveState(e.target.value)}
          className="py-1.5 px-2.5 bg-[#F8FAFC] text-[#102454] border border-[#DFE6F0] rounded-lg text-xs"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Inventory List */}
      {filteredPoints.length === 0 ? (
        <div className="bg-white border border-[#DFE6F0] rounded-xl p-8 text-center text-xs text-[#5A6B87] shadow-xs">
          No water points match the current filters.
        </div>
      ) : (
        <div className="bg-white border border-[#DFE6F0] rounded-xl shadow-xs divide-y divide-[#F1F5F9]">
          {filteredPoints.map((wp) => {
            const pathLabel = formatLocationPath(wp);
            const typeLabel = formatWaterPointType(wp.type);
            return (
              <div
                key={wp.id}
                className={`p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  wp.is_active === false ? 'bg-[#F8FAFC] opacity-75' : ''
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#102454] font-heading">
                      {wp.name}
                    </span>
                    {typeLabel && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#EDF2F9] text-[#102454] border border-[#DFE6F0]">
                        {typeLabel}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        wp.is_active !== false
                          ? 'bg-[#EBF6EE] text-[#15803D] border-[#C6E7CF]'
                          : 'bg-[#F1F5F9] text-[#5A6B87] border-[#CBD5E1]'
                      }`}
                    >
                      {wp.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#5A6B87]">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#8C9CB3]" />
                    <span className="truncate">{wp.location}</span>
                    {pathLabel && (
                      <span className="text-[#8C9CB3] truncate">&bull; {pathLabel}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(wp)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#102454] bg-[#F8FAFC] hover:bg-[#EDF2F9] border border-[#DFE6F0] cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(wp)}
                    disabled={togglingId === wp.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer disabled:opacity-50 ${
                      wp.is_active !== false
                        ? 'text-[#B91C1C] bg-[#FDF2F2] hover:bg-[#FCE8E8] border-[#F8C9C9]'
                        : 'text-[#15803D] bg-[#EBF6EE] hover:bg-[#DCF1E2] border-[#C6E7CF]'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{wp.is_active !== false ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default WaterPointManager;
