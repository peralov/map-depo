<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  shallowRef,
  useTemplateRef
} from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { appConfig } from '../../config/app'
import { useAuthStore } from '../../stores/auth'
import { useDepoStore } from '../../stores/depo'
import {
  createSitesGeoJson,
  getPointColorExpression,
  getSitesBounds
} from '../../utils/map'
import CreateDepoForm from '../CreateDepoForm.vue'
import DepoInfo from '../DepoInfo.vue'
import MapLayerControl from './MapLayerControl.vue'
import MapLegend from './MapLegend.vue'

const CLUSTER_LAYER = {
  id: 'clusters',
  type: 'circle',
  source: 'sites',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#51bbd6',
      10,
      '#f1f075',
      30,
      '#f28cb1'
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20,
      10,
      30,
      30,
      40
    ]
  }
}

const CLUSTER_COUNT_LAYER = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'sites',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  }
}

const POINT_RADIUS_EXPRESSION = [
  'match',
  ['get', 'size'],
  'small',
  8,
  'medium',
  12,
  'large',
  16,
  10
]

const depoStore = useDepoStore()
const authStore = useAuthStore()
const mapContainer = useTemplateRef('mapContainer')
const map = shallowRef(null)
const selectedSite = shallowRef(null)
const newSiteLocation = shallowRef(null)
const loading = shallowRef(true)
const error = shallowRef('')
const activeLayerView = shallowRef('status')

const isLoggedIn = computed(() => authStore.isAuthenticated)
const siteFeatureCollection = () => createSitesGeoJson(depoStore.depos)

const fitMapToSites = () => {
  const bounds = getSitesBounds(depoStore.depos)
  if (!map.value || !bounds || !appConfig.map.autoFitData) {
    return
  }

  const [[west, south], [east, north]] = bounds
  if (west === east && south === north) {
    map.value.easeTo({
      center: [west, south],
      zoom: Math.max(appConfig.map.zoom, 11)
    })
    return
  }

  map.value.fitBounds(bounds, {
    padding: 64,
    maxZoom: 11,
    duration: 0
  })
}

const addSiteSource = () => {
  map.value.addSource('sites', {
    type: 'geojson',
    data: siteFeatureCollection(),
    cluster: true,
    clusterMaxZoom: 20,
    clusterRadius: 50
  })
}

const addSiteLayers = () => {
  map.value.addLayer(CLUSTER_LAYER)
  map.value.addLayer(CLUSTER_COUNT_LAYER)
  map.value.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'sites',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': getPointColorExpression(activeLayerView.value),
      'circle-radius': POINT_RADIUS_EXPRESSION,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  })
}

const zoomToCluster = (feature) => {
  const clusterId = feature.properties.cluster_id
  map.value
    .getSource('sites')
    .getClusterExpansionZoom(clusterId, (clusterError, zoom) => {
      if (clusterError) {
        return
      }

      map.value.easeTo({
        center: feature.geometry.coordinates,
        zoom
      })
    })
}

const selectCluster = (event) => {
  const [feature] = map.value.queryRenderedFeatures(event.point, {
    layers: ['clusters']
  })
  if (feature) {
    zoomToCluster(feature)
  }
}

const selectSite = (event) => {
  const [feature] = map.value.queryRenderedFeatures(event.point, {
    layers: ['unclustered-point']
  })
  if (!feature) {
    return
  }

  newSiteLocation.value = null
  selectedSite.value =
    depoStore.depos.find(
      (site) => Number(site.id) === Number(feature.properties.id)
    ) || null
}

const setPointerCursor = (cursor) => {
  map.value.getCanvas().style.cursor = cursor
}

const bindFeatureInteractions = () => {
  map.value.on('click', 'clusters', selectCluster)
  map.value.on('click', 'unclustered-point', selectSite)

  for (const layer of ['clusters', 'unclustered-point']) {
    map.value.on('mouseenter', layer, () => setPointerCursor('pointer'))
    map.value.on('mouseleave', layer, () => setPointerCursor(''))
  }
}

const prepareSiteMap = () => {
  addSiteSource()
  addSiteLayers()
  bindFeatureInteractions()
  fitMapToSites()
}

const interactiveLayers = () => {
  return ['unclustered-point', 'clusters'].filter((layer) =>
    map.value.getLayer(layer)
  )
}

const selectEmptyMapLocation = (event) => {
  if (!isLoggedIn.value) {
    return
  }

  const layers = interactiveLayers()
  const features = layers.length
    ? map.value.queryRenderedFeatures(event.point, { layers })
    : []
  if (features.length) {
    return
  }

  newSiteLocation.value = {
    latitude: event.lngLat.lat,
    longitude: event.lngLat.lng
  }
  selectedSite.value = null
}

const addMapControls = () => {
  map.value.addControl(new mapboxgl.NavigationControl(), 'top-right')
  map.value.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false
    }),
    'top-right'
  )
}

const initializeMap = () => {
  if (!appConfig.map.accessToken) {
    error.value =
      'Mapbox is not configured. Add VITE_MAPBOX_TOKEN to frontend/.env.local.'
    return
  }

  mapboxgl.accessToken = appConfig.map.accessToken
  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: appConfig.map.style,
    center: appConfig.map.center,
    zoom: appConfig.map.zoom
  })
  addMapControls()
  map.value.on('load', prepareSiteMap)
  map.value.on('click', selectEmptyMapLocation)
}

const changeLayerView = (layerView) => {
  activeLayerView.value = layerView
  if (map.value?.getLayer('unclustered-point')) {
    map.value.setPaintProperty(
      'unclustered-point',
      'circle-color',
      getPointColorExpression(layerView)
    )
  }
}

const refreshCreatedSite = async (createdSite) => {
  newSiteLocation.value = null
  await depoStore.fetchDepos()

  if (map.value?.getSource('sites')) {
    map.value.getSource('sites').setData(siteFeatureCollection())
    selectedSite.value =
      depoStore.depos.find((site) => site.id === createdSite.id) || null
  }
}

const loadMap = async () => {
  try {
    await depoStore.fetchDepos()
    initializeMap()
  } catch (fetchError) {
    console.error('Error initializing map:', fetchError)
    error.value = depoStore.error || 'Failed to initialize the map'
  } finally {
    loading.value = false
  }
}

onMounted(loadMap)
onUnmounted(() => {
  map.value?.remove()
  map.value = null
})
</script>

<template>
  <section
    class="relative flex h-[calc(100vh-7.5rem)] min-h-[36rem] w-full"
    aria-label="Waste site map"
  >
    <div ref="mapContainer" class="h-full w-full"></div>

    <div
      v-if="loading"
      class="absolute inset-0 z-20 flex items-center justify-center bg-white/70"
      role="status"
    >
      <p class="text-lg font-semibold text-gray-700">Loading map data…</p>
    </div>

    <div
      v-if="error"
      class="absolute left-1/2 top-4 z-20 max-w-lg -translate-x-1/2 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 shadow"
      role="alert"
    >
      {{ error }}
    </div>

    <MapLayerControl
      class="absolute left-4 top-4 z-10"
      :active-view="activeLayerView"
      @change="changeLayerView"
    />

    <MapLegend
      class="absolute bottom-4 left-4 z-10"
      :active-view="activeLayerView"
    />

    <aside
      v-if="selectedSite"
      class="absolute right-0 top-0 z-10 h-full w-full overflow-y-auto bg-white shadow-lg sm:w-96"
      aria-label="Waste site details"
    >
      <div class="p-4">
        <DepoInfo :depo="selectedSite" />
        <button
          type="button"
          class="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
          aria-label="Close site details"
          @click="selectedSite = null"
        >
          <span class="text-xl" aria-hidden="true">&times;</span>
        </button>
      </div>
    </aside>

    <aside
      v-else-if="newSiteLocation"
      class="absolute right-0 top-0 z-10 h-full w-full overflow-y-auto bg-white shadow-lg sm:w-96"
      aria-label="Add a waste site"
    >
      <div class="p-4">
        <h2 class="mb-4 text-xl font-bold">Add a waste site</h2>
        <CreateDepoForm
          :location="newSiteLocation"
          @site-created="refreshCreatedSite"
        />
        <button
          type="button"
          class="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
          aria-label="Close new site form"
          @click="newSiteLocation = null"
        >
          <span class="text-xl" aria-hidden="true">&times;</span>
        </button>
      </div>
    </aside>

    <div
      v-if="!isLoggedIn"
      class="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-white p-3 shadow-md"
    >
      <p class="text-sm text-gray-700">
        <RouterLink
          to="/login"
          class="font-medium text-primary hover:text-primary-dark"
        >
          Sign in
        </RouterLink>
        to add waste sites anywhere in the world.
      </p>
    </div>
  </section>
</template>
