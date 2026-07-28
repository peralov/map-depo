const POINT_COLORS = {
  status: {
    clean: '#4ade80',
    low: '#a3e635',
    medium: '#facc15',
    high: '#ef4444'
  },
  type: {
    garbage: '#3b82f6',
    debris: '#a855f7',
    landfill: '#ec4899',
    electronic: '#14b8a6',
    hazardous: '#f97316',
    construction: '#6b7280',
    organic: '#84cc16',
    plastic: '#38bdf8',
    other: '#64748b'
  },
  size: {
    small: '#4ade80',
    medium: '#facc15',
    large: '#ef4444'
  }
}

const isValidCoordinate = (site) => {
  return (
    Number.isFinite(Number(site?.longitude)) &&
    Number.isFinite(Number(site?.latitude)) &&
    Number(site.longitude) >= -180 &&
    Number(site.longitude) <= 180 &&
    Number(site.latitude) >= -90 &&
    Number(site.latitude) <= 90
  )
}

export const createSitesGeoJson = (sites) => ({
  type: 'FeatureCollection',
  features: sites.filter(isValidCoordinate).map((site) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [Number(site.longitude), Number(site.latitude)]
    },
    properties: {
      id: site.id,
      name: site.name,
      status: site.status || 'medium',
      type: site.type || 'garbage',
      size: site.size || 'medium',
      description: site.description || ''
    }
  }))
})

export const getPointColorExpression = (view) => {
  const colors = POINT_COLORS[view] || POINT_COLORS.status
  const matches = Object.entries(colors).flatMap(([value, color]) => [
    value,
    color
  ])

  return ['match', ['get', view], ...matches, '#3b82f6']
}

export const getSitesBounds = (sites) => {
  const coordinates = sites
    .filter(isValidCoordinate)
    .map((site) => [Number(site.longitude), Number(site.latitude)])

  if (coordinates.length === 0) {
    return null
  }

  return coordinates.reduce(
    (bounds, [longitude, latitude]) => [
      [
        Math.min(bounds[0][0], longitude),
        Math.min(bounds[0][1], latitude)
      ],
      [
        Math.max(bounds[1][0], longitude),
        Math.max(bounds[1][1], latitude)
      ]
    ],
    [coordinates[0], coordinates[0]]
  )
}
