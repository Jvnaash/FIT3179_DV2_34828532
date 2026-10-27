# Chart 2 summary panel restoration

The Chart 2 `What the map reveals` panel uses the same rounded pale-teal styling, border, text spacing and padding as Chart 1. Its sidebar keeps a stable 235px desktop column; on narrower viewports it stacks below the map. The existing responsive map SVG rules are unchanged to avoid restoring the horizontal scrollbar. No data or chart specifications were changed.

Test with Live Server, including a narrow browser width. Check that the map, legend and summary panel remain fully visible and the tooltips still work.
