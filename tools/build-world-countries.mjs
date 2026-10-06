// Builds globe/lib/world-countries.js from Natural Earth (public domain).
//
// Run from the project folder:   node tools/build-world-countries.mjs
//
// Shapes come from the 1:110m dataset (light enough for a hero globe).
// Names, codes, label points and areas come from the 1:50m dataset, which
// also covers small countries (Singapore, Malta, Bahrain...) that 1:110m
// leaves out. Those get a marker on the globe instead of a shape.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const SHAPES_URL = BASE + 'ne_110m_admin_0_countries.geojson';
const INDEX_URL = BASE + 'ne_50m_admin_0_countries.geojson';
const OUT_FILE = fileURLToPath(new URL('../globe/lib/world-countries.js', import.meta.url));

const DECIMALS = 2; // ~1 km, plenty for 1:110m shapes

// Common short names that are not in Natural Earth.
const EXTRA_NAMES = {
  GBR: ['UK', 'Great Britain'],
  ARE: ['UAE'],
  USA: ['US'],
  BHR: ['Bahréin'], // spelling used on the Wix site (Natural Earth has "Baréin")
};

// Overseas parts that Natural Earth draws as part of another country. They
// become countries of their own, so highlighting the main country doesn't
// light them up too. Every piece of the main country's shape that lies inside
// `box` (degrees) moves to the new entry.
const SPLIT_OFF = [
  {
    from: 'FRA',
    id: 'GUF',
    name: 'French Guiana',
    names: ['French Guiana', 'Guayana Francesa', 'Guyane', 'Guyane française'],
    codes: ['GUF', 'GF'],
    label: [-53.1, 3.9],
    box: { west: -55, east: -51, south: 1, north: 7 },
  },
];

// Borders along a line of latitude that Natural Earth draws where a country is
// in control rather than where it is internationally recognised. The part of
// `from` south of `lat` is joined onto `to`.
const MOVE_SOUTH_OF = [
  // Natural Earth's Morocco includes most of Western Sahara. Their border is
  // 27°40'N, which is 27.66 in Natural Earth's own outlines.
  { from: 'MAR', to: 'SAH', lat: 27.66 },
];

const EARTH_RADIUS_KM = 6371.0088;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// Natural Earth has used both upper- and lower-case property keys over time.
function prop(props, key) {
  const value = props[key] ?? props[key.toLowerCase()];
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' || text === '-99' ? null : text;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

// Approximate area of a lng/lat ring on a sphere, in km².
function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[i + 1];
    sum += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((sum * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2);
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function polygonsOf(geometry) {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

function geometryFrom(polygons) {
  if (polygons.length === 0) return null;
  return polygons.length === 1
    ? { type: 'Polygon', coordinates: polygons[0] }
    : { type: 'MultiPolygon', coordinates: polygons };
}

function geometryArea(geometry) {
  let area = 0;
  for (const [outer, ...holes] of polygonsOf(geometry)) {
    area += ringArea(outer);
    for (const hole of holes) area -= ringArea(hole);
  }
  return Math.max(0, Math.round(area));
}

function roundRing(ring) {
  const factor = 10 ** DECIMALS;
  const out = [];
  for (const [lng, lat] of ring) {
    const point = [Math.round(lng * factor) / factor, Math.round(lat * factor) / factor];
    const prev = out[out.length - 1];
    if (!prev || prev[0] !== point[0] || prev[1] !== point[1]) out.push(point);
  }
  // A valid closed ring needs at least 4 points (first === last).
  return out.length >= 4 ? out : null;
}

function roundGeometry(geometry) {
  const rounded = polygonsOf(geometry)
    .map((rings) => rings.map(roundRing))
    .filter((rings) => rings[0] !== null)
    .map((rings) => rings.filter(Boolean));
  return geometryFrom(rounded);
}

// Splits a geometry in two: the polygons whose outline lies inside `box`, and the rest.
function splitByBox(geometry, box) {
  const inside = [];
  const outside = [];
  for (const polygon of polygonsOf(geometry)) {
    const isInside = polygon[0].every(
      ([lng, lat]) => lng >= box.west && lng <= box.east && lat >= box.south && lat <= box.north
    );
    (isInside ? inside : outside).push(polygon);
  }
  return [geometryFrom(inside), geometryFrom(outside)];
}

// The part of a closed ring north (or south) of a line of latitude, closed
// again. Points on the line belong to both sides.
function clipRing(ring, lat, keepNorth) {
  const inside = ([, y]) => (keepNorth ? y >= lat : y <= lat);
  const out = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    if (inside(a)) out.push(a);
    if (inside(a) !== inside(b)) {
      const t = (lat - a[1]) / (b[1] - a[1]);
      out.push([a[0] + t * (b[0] - a[0]), lat]);
    }
  }
  return out.length > 0 ? [...out, out[0]] : [];
}

function clipGeometry(geometry, lat, keepNorth) {
  const polygons = polygonsOf(geometry)
    .map((rings) => rings.map((ring) => clipRing(ring, lat, keepNorth)).filter((ring) => ring.length >= 4))
    .filter((rings) => rings.length > 0);
  return geometryFrom(polygons);
}

// Joins two shapes that share a border into one: the edges they have in
// common cancel out and the rest are chained back into closed outlines.
function mergeGeometries(a, b) {
  const rings = [...polygonsOf(a), ...polygonsOf(b)].map((rings) => {
    if (rings.length > 1) throw new Error('Merging shapes with holes is not supported');
    return rings[0];
  });
  const edges = new Set();
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) edges.add(`${ring[i]}>${ring[i + 1]}`);
  }
  const next = new Map(); // start point -> remaining edge
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [from, to] = [ring[i], ring[i + 1]];
      if (edges.has(`${to}>${from}`)) continue; // shared border
      if (next.has(String(from))) throw new Error(`Cannot merge shapes at ${from}`);
      next.set(String(from), { from, to });
    }
  }
  const polygons = [];
  while (next.size > 0) {
    let edge = next.values().next().value;
    const ring = [edge.from];
    while (edge) {
      next.delete(String(edge.from));
      ring.push(edge.to);
      edge = next.get(String(edge.to));
    }
    if (String(ring[0]) !== String(ring[ring.length - 1])) throw new Error(`Cannot merge shapes at ${ring[0]}`);
    polygons.push([ring]);
  }
  return geometryFrom(polygons);
}

// Applies one MOVE_SOUTH_OF border.
function moveSouthOf(countries, detailedGeometry, border) {
  const from = countries.find((c) => c.id === border.from);
  const to = countries.find((c) => c.id === border.to);
  if (!from?.shape || !to?.shape) throw new Error(`${border.from} -> ${border.to}: no shapes`);
  const north = roundGeometry(clipGeometry(from.shape, border.lat, true));
  const south = roundGeometry(clipGeometry(from.shape, border.lat, false));
  if (!north || !south) throw new Error(`${border.from}: latitude ${border.lat} doesn't cross it`);
  from.shape = north;
  to.shape = mergeGeometries(to.shape, south);
  from.areaKm2 = geometryArea(clipGeometry(detailedGeometry, border.lat, true));
  to.areaKm2 += geometryArea(clipGeometry(detailedGeometry, border.lat, false));
}

// Moves one SPLIT_OFF part out of its parent country into a new entry.
function splitOff(countries, detailedGeometry, part) {
  const parent = countries.find((c) => c.id === part.from);
  if (!parent || !parent.shape) throw new Error(`${part.id}: no shape for ${part.from}`);
  const [shape, parentShape] = splitByBox(parent.shape, part.box);
  const [detailed] = splitByBox(detailedGeometry, part.box);
  if (!shape || !detailed) throw new Error(`${part.id}: no part of ${part.from} inside its box`);
  const areaKm2 = geometryArea(detailed);
  parent.shape = parentShape;
  parent.areaKm2 -= areaKm2;
  countries.push({
    id: part.id,
    name: part.name,
    names: part.names,
    codes: part.codes,
    label: part.label,
    areaKm2,
    shape,
  });
}

function countryId(props) {
  return prop(props, 'ADM0_A3');
}

async function main() {
  console.log('Downloading Natural Earth data...');
  const [shapes, index] = await Promise.all([getJson(SHAPES_URL), getJson(INDEX_URL)]);

  const shapeById = new Map();
  for (const feature of shapes.features) {
    shapeById.set(countryId(feature.properties), roundGeometry(feature.geometry));
  }

  const countries = index.features.map((feature) => {
    const p = feature.properties;
    const id = countryId(p);
    return {
      id,
      name: prop(p, 'NAME_EN') || prop(p, 'NAME'),
      names: unique([
        prop(p, 'NAME'),
        prop(p, 'NAME_LONG'),
        prop(p, 'ADMIN'),
        prop(p, 'NAME_EN'),
        prop(p, 'NAME_ES'),
        prop(p, 'FORMAL_EN'),
        ...(EXTRA_NAMES[id] || []),
      ]),
      codes: unique([
        id,
        prop(p, 'ISO_A3'),
        prop(p, 'ISO_A3_EH'),
        prop(p, 'ISO_A2'),
        prop(p, 'ISO_A2_EH'),
      ]),
      label: [Number(prop(p, 'LABEL_X')), Number(prop(p, 'LABEL_Y'))],
      areaKm2: geometryArea(feature.geometry),
      shape: shapeById.get(id) || null,
    };
  });

  for (const part of SPLIT_OFF) {
    const feature = index.features.find((f) => countryId(f.properties) === part.from);
    splitOff(countries, feature?.geometry, part);
  }
  for (const border of MOVE_SOUTH_OF) {
    const feature = index.features.find((f) => countryId(f.properties) === border.from);
    moveSouthOf(countries, feature?.geometry, border);
  }

  countries.sort((a, b) => a.name.localeCompare(b.name));

  const withShape = countries.filter((c) => c.shape).length;
  const header =
    '// Generated by tools/build-world-countries.mjs - do not edit by hand.\n' +
    '// Country borders: Natural Earth (naturalearthdata.com), public domain.\n';
  const body = 'window.WORLD_COUNTRIES = ' + JSON.stringify(countries) + ';\n';
  await writeFile(OUT_FILE, header + body, 'utf8');

  console.log(`Wrote ${countries.length} countries (${withShape} with shapes) to ${OUT_FILE}`);
  console.log(`File size: ${(Buffer.byteLength(header + body) / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
