export const WATER_POINT_TYPE_OPTIONS = [
  { value: 'water_cooler', label: 'Water Cooler' },
  { value: 'bottle_filler', label: 'Bottle Filler' },
  { value: 'drinking_fountain', label: 'Drinking Fountain' },
  { value: 'purifier', label: 'Purifier' },
  { value: 'dispenser', label: 'Dispenser' },
  { value: 'tap', label: 'Tap' },
  { value: 'other', label: 'Other' },
];

export const LOCATION_TYPE_OPTIONS = [
  { value: 'campus', label: 'Campus' },
  { value: 'block', label: 'Block' },
  { value: 'building', label: 'Building' },
  { value: 'facility', label: 'Standalone Facility' },
  { value: 'floor', label: 'Floor' },
  { value: 'indoor_area', label: 'Indoor Area' },
  { value: 'outdoor_area', label: 'Outdoor Area' },
];

export const ALLOWED_PARENT_TYPES = {
  campus: [null],
  block: [null, 'campus'],
  building: [null, 'campus', 'block'],
  facility: [null, 'campus', 'block'],
  floor: ['block', 'building', 'facility'],
  indoor_area: ['block', 'building', 'facility', 'floor'],
  outdoor_area: [null, 'campus', 'block', 'building', 'facility'],
};

const TYPE_LABELS = Object.fromEntries(
  WATER_POINT_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

const LOC_TYPE_LABELS = Object.fromEntries(
  LOCATION_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

export function formatWaterPointType(type) {
  if (!type) return '';
  return TYPE_LABELS[type] || type.replace(/_/g, ' ');
}

export function formatLocationType(type) {
  if (!type) return '';
  return LOC_TYPE_LABELS[type] || type.replace(/_/g, ' ');
}

export function formatLocationPath(waterPoint) {
  if (Array.isArray(waterPoint?.location_path) && waterPoint.location_path.length > 0) {
    return waterPoint.location_path.map((item) => item.name).join(' › ');
  }
  return waterPoint?.building || '';
}

export function buildLocationDisplayLabel(location, locationsById) {
  const parts = [];
  let cursor = location;
  const seen = new Set();
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    parts.unshift(cursor.name);
    cursor = cursor.parent_id ? locationsById.get(cursor.parent_id) : null;
  }
  return `${parts.join(' › ')} (${formatLocationType(location.location_type)})`;
}

/**
 * Collect the selected location ID and all of its descendant location IDs.
 */
export function getDescendantLocationIds(campusLocations, rootLocationId) {
  const rootId = Number(rootLocationId);
  if (!rootId) return null;
  const childrenByParent = new Map();
  for (const loc of campusLocations) {
    if (loc.parent_id != null) {
      if (!childrenByParent.has(loc.parent_id)) {
        childrenByParent.set(loc.parent_id, []);
      }
      childrenByParent.get(loc.parent_id).push(loc.id);
    }
  }
  const result = new Set();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop();
    if (result.has(id)) continue;
    result.add(id);
    const children = childrenByParent.get(id);
    if (children) {
      stack.push(...children);
    }
  }
  return result;
}

/**
 * Structured multi-axis filter for water points across directory and staff views.
 */
export function filterWaterPointsStructured({
  waterPoints = [],
  campusLocations = [],
  activeReportsMap = new Map(),
  resolvedReportsMap = new Map(),
  activeFilter = 'all',
  selectedBlockId = 'ALL',
  selectedFloorId = 'ALL',
  selectedBuildingId = 'ALL',
  selectedAreaId = 'ALL',
  selectedType = 'ALL',
  selectedActiveState = 'active', // 'active' | 'inactive' | 'all'
  searchQuery = '',
}) {
  const blockIds =
    selectedBlockId !== 'ALL'
      ? getDescendantLocationIds(campusLocations, selectedBlockId)
      : null;
  const floorIds =
    selectedFloorId !== 'ALL'
      ? getDescendantLocationIds(campusLocations, selectedFloorId)
      : null;
  const buildingIds =
    selectedBuildingId !== 'ALL'
      ? getDescendantLocationIds(campusLocations, selectedBuildingId)
      : null;
  const areaIds =
    selectedAreaId !== 'ALL'
      ? getDescendantLocationIds(campusLocations, selectedAreaId)
      : null;

  const q = searchQuery.trim().toLowerCase();

  return waterPoints.filter((wp) => {
    if (selectedActiveState === 'active' && wp.is_active === false) return false;
    if (selectedActiveState === 'inactive' && wp.is_active !== false) return false;

    const hasActive = activeReportsMap.has(wp.id);
    const hasResolved = resolvedReportsMap.has(wp.id);

    if (activeFilter === 'reported' && !hasActive) return false;
    if (activeFilter === 'resolved' && (hasActive || !hasResolved)) return false;
    if (activeFilter === 'none' && (hasActive || hasResolved)) return false;

    if (blockIds && (!wp.campus_location_id || !blockIds.has(wp.campus_location_id))) {
      return false;
    }
    if (floorIds && (!wp.campus_location_id || !floorIds.has(wp.campus_location_id))) {
      return false;
    }
    if (buildingIds && (!wp.campus_location_id || !buildingIds.has(wp.campus_location_id))) {
      return false;
    }
    if (areaIds && (!wp.campus_location_id || !areaIds.has(wp.campus_location_id))) {
      return false;
    }

    if (selectedType !== 'ALL' && (wp.type || '') !== selectedType) {
      return false;
    }

    if (q) {
      const pathText = formatLocationPath(wp).toLowerCase();
      const matchName = wp.name.toLowerCase().includes(q);
      const matchLoc = wp.location.toLowerCase().includes(q);
      const matchBldg = (wp.building || '').toLowerCase().includes(q);
      const matchType = formatWaterPointType(wp.type).toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchBldg && !pathText.includes(q) && !matchType) {
        return false;
      }
    }

    return true;
  });
}
