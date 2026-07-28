const DEFAULT_MAP_CENTER = [0, 20]
const DEFAULT_MAP_ZOOM = 1.6

const parseMapCenter = (value) => {
  if (!value) {
    return DEFAULT_MAP_CENTER
  }

  const [longitude, latitude] = value.split(',').map(Number)
  const isValid =
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90

  return isValid ? [longitude, latitude] : DEFAULT_MAP_CENTER
}

const parseMapZoom = (value) => {
  const zoom = Number(value)
  return Number.isFinite(zoom) && zoom >= 0 && zoom <= 22
    ? zoom
    : DEFAULT_MAP_ZOOM
}

export const appConfig = Object.freeze({
  name: import.meta.env.VITE_APP_NAME || 'Open Waste Map',
  tagline:
    import.meta.env.VITE_APP_TAGLINE ||
    'Map waste. Verify reports. Organize action.',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  map: Object.freeze({
    accessToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
    style:
      import.meta.env.VITE_MAP_STYLE ||
      'mapbox://styles/mapbox/satellite-streets-v12',
    center: parseMapCenter(import.meta.env.VITE_MAP_CENTER),
    zoom: parseMapZoom(import.meta.env.VITE_MAP_ZOOM),
    autoFitData: import.meta.env.VITE_MAP_AUTO_FIT !== 'false'
  })
})
