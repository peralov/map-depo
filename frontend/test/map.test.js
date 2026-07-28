import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createSitesGeoJson,
  getPointColorExpression,
  getSitesBounds
} from '../src/utils/map.js'

test('GeoJSON keeps valid global and zero coordinates', () => {
  const featureCollection = createSitesGeoJson([
    { id: 1, name: 'Origin', latitude: 0, longitude: 0 },
    { id: 2, name: 'Dateline', latitude: -45, longitude: 180 },
    { id: 3, name: 'Invalid', latitude: 91, longitude: 10 }
  ])

  assert.equal(featureCollection.features.length, 2)
  assert.deepEqual(featureCollection.features[0].geometry.coordinates, [0, 0])
  assert.deepEqual(featureCollection.features[1].geometry.coordinates, [180, -45])
})

test('site bounds cover empty, single, and distributed datasets', () => {
  assert.equal(getSitesBounds([]), null)
  assert.deepEqual(
    getSitesBounds([{ latitude: 0, longitude: 0 }]),
    [[0, 0], [0, 0]]
  )
  assert.deepEqual(
    getSitesBounds([
      { latitude: -33.86, longitude: 151.2 },
      { latitude: 38.72, longitude: -9.14 }
    ]),
    [[-9.14, -33.86], [151.2, 38.72]]
  )
})

test('size visualization has explicit colors for every size', () => {
  const expression = getPointColorExpression('size')

  assert.deepEqual(expression.slice(0, 2), ['match', ['get', 'size']])
  assert.ok(expression.includes('small'))
  assert.ok(expression.includes('medium'))
  assert.ok(expression.includes('large'))
})
