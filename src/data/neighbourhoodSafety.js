// Mocked neighbourhood safety data for Toronto
// safetyScore: 1–10 (10 = safest). Derived from public crime index proxies.
// Colours: green ≥7, amber ≥4, red <4

const neighbourhoodSafety = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Rosedale–Moore Park', safetyScore: 9 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.396, 43.678], [-79.369, 43.678], [-79.369, 43.696],
        [-79.396, 43.696], [-79.396, 43.678],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Forest Hill', safetyScore: 9 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.430, 43.688], [-79.405, 43.688], [-79.405, 43.712],
        [-79.430, 43.712], [-79.430, 43.688],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'The Annex', safetyScore: 8 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.416, 43.660], [-79.384, 43.660], [-79.384, 43.678],
        [-79.416, 43.678], [-79.416, 43.660],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Yorkville', safetyScore: 9 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.402, 43.667], [-79.379, 43.667], [-79.379, 43.679],
        [-79.402, 43.679], [-79.402, 43.667],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Riverdale', safetyScore: 8 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.354, 43.662], [-79.322, 43.662], [-79.322, 43.683],
        [-79.354, 43.683], [-79.354, 43.662],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Leslieville', safetyScore: 7 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.342, 43.653], [-79.310, 43.653], [-79.310, 43.667],
        [-79.342, 43.667], [-79.342, 43.653],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Danforth Village', safetyScore: 7 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.354, 43.679], [-79.322, 43.679], [-79.322, 43.698],
        [-79.354, 43.698], [-79.354, 43.679],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'High Park', safetyScore: 8 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.478, 43.645], [-79.450, 43.645], [-79.450, 43.665],
        [-79.478, 43.665], [-79.478, 43.645],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Parkdale', safetyScore: 4 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.455, 43.635], [-79.430, 43.635], [-79.430, 43.650],
        [-79.455, 43.650], [-79.455, 43.635],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Regent Park', safetyScore: 3 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.368, 43.656], [-79.352, 43.656], [-79.352, 43.668],
        [-79.368, 43.668], [-79.368, 43.656],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Lawrence Park', safetyScore: 9 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.418, 43.718], [-79.390, 43.718], [-79.390, 43.740],
        [-79.418, 43.740], [-79.418, 43.718],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'North York Centre', safetyScore: 7 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.422, 43.754], [-79.387, 43.754], [-79.387, 43.776],
        [-79.422, 43.776], [-79.422, 43.754],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Eglinton West', safetyScore: 5 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.447, 43.696], [-79.418, 43.696], [-79.418, 43.714],
        [-79.447, 43.714], [-79.447, 43.696],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Scarborough Village', safetyScore: 4 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.255, 43.746], [-79.220, 43.746], [-79.220, 43.768],
        [-79.255, 43.768], [-79.255, 43.746],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'East End Danforth', safetyScore: 6 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.312, 43.678], [-79.280, 43.678], [-79.280, 43.698],
        [-79.312, 43.698], [-79.312, 43.678],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Bloor West Village', safetyScore: 8 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.478, 43.651], [-79.450, 43.651], [-79.450, 43.666],
        [-79.478, 43.666], [-79.478, 43.651],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'Cabbagetown', safetyScore: 6 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.371, 43.660], [-79.354, 43.660], [-79.354, 43.676],
        [-79.371, 43.676], [-79.371, 43.660],
      ]] },
    },
    {
      type: 'Feature',
      properties: { name: 'St. Lawrence', safetyScore: 7 },
      geometry: { type: 'Polygon', coordinates: [[
        [-79.373, 43.648], [-79.354, 43.648], [-79.354, 43.660],
        [-79.373, 43.660], [-79.373, 43.648],
      ]] },
    },
  ],
};

export default neighbourhoodSafety;
