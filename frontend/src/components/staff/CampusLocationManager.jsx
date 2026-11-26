import { useState, useMemo } from 'react';
import { FolderTree, Plus, Pencil, Power, AlertCircle, X } from 'lucide-react';
import {
  LOCATION_TYPE_OPTIONS,
  ALLOWED_PARENT_TYPES,
  formatLocationType,
  buildLocationDisplayLabel,
} from '../../lib/locationFilters';
import { formatBackendError } from '../../lib/reliability';

const EMPTY_FORM = {
  name: '',
  location_type: 'block',
  parent_id: '',
  code: '',
  description: '',
  display_order: 0,
};

export function CampusLocationManager({
  campusLocations,
  onCreateLocation,
  onUpdateLocation,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [formError, setFormError] = useState('');

  const locationsById = useMemo(() => {
    const map = new Map();
    campusLocations.forEach((loc) => map.set(loc.id, loc));
    return map;
  }, [campusLocations]);

  const validParents = useMemo(() => {
    const allowed = ALLOWED_PARENT_TYPES[form.location_type] || [null];
    return campusLocations.filter(
      (loc) =>
        loc.id !== editingId &&
        loc.is_active &&
        allowed.includes(loc.location_type)
    );
  }, [campusLocations, form.location_type, editingId]);

  const requiresParent = useMemo(() => {
    const allowed = ALLOWED_PARENT_TYPES[form.location_type] || [null];
    return !allowed.includes(null);
  }, [form.location_type]);

  const handleTypeChange = (nextType) => {
    const allowed = ALLOWED_PARENT_TYPES[nextType] || [null];
    const currentParent = form.parent_id ? locationsById.get(Number(form.parent_id)) : null;
    const keepParent =
      currentParent && allowed.includes(currentParent.location_type)
        ? form.parent_id
        : '';
    setForm((prev) => ({ ...prev, location_type: nextType, parent_id: keepParent }));
  };

  const startEdit = (loc) => {
    setEditingId(loc.id);
    setFormError('');
    setForm({
      name: loc.name,
      location_type: loc.location_type,
      parent_id: loc.parent_id ? String(loc.parent_id) : '',
      code: loc.code || '',
      description: loc.description || '',
      display_order: loc.display_order || 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Location name is required.');
      return;
    }
    if (requiresParent && !form.parent_id) {
      setFormError(`A ${formatLocationType(form.location_type).toLowerCase()} requires a parent location.`);
      return;
    }

    setSubmitting(true);
    setFormError('');
    const payload = {
      name: form.name.trim(),
      location_type: form.location_type,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      code: form.code.trim() || null,
      description: form.description.trim() || null,
      display_order: Number(form.display_order) || 0,
    };

    try {
      if (editingId) {
        await onUpdateLocation(editingId, payload);
      } else {
        await onCreateLocation(payload);
      }
      cancelEdit();
    } catch (err) {
      setFormError(formatBackendError(err, 'submit'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (loc) => {
    setTogglingId(loc.id);
    setFormError('');
    try {
      await onUpdateLocation(loc.id, { is_active: !loc.is_active });
    } catch (err) {
      setFormError(formatBackendError(err, 'submit'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <section aria-label="Campus Location Hierarchy" className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#DFE6F0] pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-[#102454] flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-[#102454]" />
            <span>Campus Location Hierarchy</span>
          </h2>
          <p className="text-xs text-[#5A6B87]">
            Configure campuses, blocks, standalone facilities, buildings, floors, and indoor/outdoor areas.
          </p>
        </div>
        <span className="text-xs font-medium text-[#5A6B87]">
          {campusLocations.length} {campusLocations.length === 1 ? 'location' : 'locations'}
        </span>
      </div>

      {/* Create / Edit Location Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#DFE6F0] rounded-xl p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#102454]">
            {editingId ? 'Edit Campus Location' : 'Add Campus Location'}
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
            <label htmlFor="loc-type" className="block text-[11px] font-semibold text-[#102454] mb-1">
              Location Type *
            </label>
            <select
              id="loc-type"
              value={form.location_type}
              onChange={(e) => handleTypeChange(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs focus:border-[#102454]"
            >
              {LOCATION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="loc-parent" className="block text-[11px] font-semibold text-[#102454] mb-1">
              Parent Location {requiresParent ? '*' : '(Optional)'}
            </label>
            <select
              id="loc-parent"
              value={form.parent_id}
              onChange={(e) => setForm((prev) => ({ ...prev, parent_id: e.target.value }))}
              disabled={submitting}
              className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs focus:border-[#102454]"
            >
              <option value="">{requiresParent ? 'Select parent location...' : 'None (Top-level / Standalone)'}</option>
              {validParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {buildLocationDisplayLabel(p, locationsById)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="loc-name" className="block text-[11px] font-semibold text-[#102454] mb-1">
              Name *
            </label>
            <input
              id="loc-name"
              type="text"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Block A, Floor 1, Library"
              disabled={submitting}
              className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs focus:border-[#102454]"
            />
          </div>

          <div>
            <label htmlFor="loc-code" className="block text-[11px] font-semibold text-[#102454] mb-1">
              Short Code (Optional)
            </label>
            <input
              id="loc-code"
              type="text"
              maxLength={50}
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="e.g. BLK-A"
              disabled={submitting}
              className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs focus:border-[#102454]"
            />
          </div>

          <div>
            <label htmlFor="loc-order" className="block text-[11px] font-semibold text-[#102454] mb-1">
              Display Order
            </label>
            <input
              id="loc-order"
              type="number"
              min={0}
              max={100000}
              value={form.display_order}
              onChange={(e) => setForm((prev) => ({ ...prev, display_order: e.target.value }))}
              disabled={submitting}
              className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs focus:border-[#102454]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#102454] hover:bg-[#183375] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Location'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Configured Locations List */}
      {campusLocations.length === 0 ? (
        <div className="bg-white border border-[#DFE6F0] rounded-xl p-8 text-center text-xs text-[#5A6B87] shadow-xs">
          No campus locations configured yet. Add a campus, block, or standalone facility above to start building your hierarchy.
        </div>
      ) : (
        <div className="bg-white border border-[#DFE6F0] rounded-xl shadow-xs divide-y divide-[#F1F5F9]">
          {campusLocations.map((loc) => (
            <div
              key={loc.id}
              className={`p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                !loc.is_active ? 'bg-[#F8FAFC] opacity-75' : ''
              }`}
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-semibold text-[#102454]">
                    {buildLocationDisplayLabel(loc, locationsById)}
                  </span>
                  {loc.code && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded text-[#5A6B87]">
                      {loc.code}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      loc.is_active
                        ? 'bg-[#EBF6EE] text-[#15803D] border-[#C6E7CF]'
                        : 'bg-[#F1F5F9] text-[#5A6B87] border-[#CBD5E1]'
                    }`}
                  >
                    {loc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {loc.description && (
                  <p className="text-xs text-[#5A6B87] truncate">{loc.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(loc)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#102454] bg-[#F8FAFC] hover:bg-[#EDF2F9] border border-[#DFE6F0] cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(loc)}
                  disabled={togglingId === loc.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer disabled:opacity-50 ${
                    loc.is_active
                      ? 'text-[#B91C1C] bg-[#FDF2F2] hover:bg-[#FCE8E8] border-[#F8C9C9]'
                      : 'text-[#15803D] bg-[#EBF6EE] hover:bg-[#DCF1E2] border-[#C6E7CF]'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{loc.is_active ? 'Deactivate' : 'Activate'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CampusLocationManager;
