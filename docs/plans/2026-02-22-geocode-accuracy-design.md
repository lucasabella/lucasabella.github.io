# Fix Map Coordinate Accuracy via Nominatim Geocoding

**Date:** 2026-02-22
**Status:** Approved

## Problem

All 178 location coordinates across 6 chains were AI-generated and are inaccurate (~50-200m off), causing markers to appear in water, on wrong streets, etc.

## Solution

A one-time geocoding script that converts existing street addresses to precise coordinates using OpenStreetMap's Nominatim API (free, no API key required).

## Script: `backend/scripts/geocode.js`

- Reads all `backend/seeds/chains/*.json` files
- For each location, sends the `address` field to Nominatim's `/search` endpoint
- Respects the 1 request/second rate limit (Nominatim usage policy)
- Updates `lat` and `lng` with the geocoded result (6 decimal places)
- Writes updated JSON back to the same file
- Logs a summary: how many succeeded, how many failed, and lists failures for manual review
- Supports a `--dry-run` flag to preview changes without writing

## After geocoding

- Run `npm run seed` in backend to push updated coordinates to the database
- No frontend changes needed — the map already reads lat/lng from the API

## Edge cases

- If an address fails to geocode, keep the original coordinates and log a warning
- If the geocoded result is in a different country, flag it as suspicious

## Scope

| Chain | Locations |
|-------|-----------|
| Loetje | 40 |
| FEBO | 44 |
| Dunkin' | 25 |
| Bagels & Beans | 30 |
| La Place | 30 |
| Sumo | 9 |
| **Total** | **178** |
