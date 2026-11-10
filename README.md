# Hunt Command

A responsive, data-driven Lords Mobile guild hunting dashboard built from the weekly hunt export.

## Features

- Guild summary with total points, target completion, and collective shortfall
- Monster level distribution and point-leader analysis
- Searchable and filterable member ranking
- One-click copying for the weekly report, below-target list, visible ranking, leaders, level mix, and guild broadcast
- Personal messages that adapt to each member's score, remaining points, status, rank, hunt count, and high-level hunts
- Mobile-friendly design with no framework or build dependency

## Run locally

The dashboard fetches `hunt-data.csv`, so use a local HTTP server instead of opening the HTML file directly.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Update the report

Replace `hunt-data.csv` with a new export using the same column structure. The dashboard recalculates every number and message automatically.
