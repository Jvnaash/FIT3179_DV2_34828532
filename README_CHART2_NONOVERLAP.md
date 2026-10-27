Chart 2 update — non-overlapping graduated symbols

Bins: 0–99, 100–199, 200–299, 300–399 kg per resident. All 79 observed values are below 400 kg; no 400+ band.
Main file: map2_garbage_no_overlap.vega.json (Vega v5); main.js now loads this file.
Force-collision positions are moved away from projected council centroids to remove circle overlaps. This intentionally reduces geographic precision; use tooltips to identify councils.
All 12 charts remain in the project. Test the map in Live Server; the exact appearance of the force layout is browser-dependent and hasn't been visually confirmed.
