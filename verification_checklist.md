# UI Verification Checklist

**Date:** 2025-05-24
**Scope:** ModCard and Financials Dashboard Refactor

## 1. ModCard (Mods Page)
- [ ] **Theme Check:** Card background and border should adapt to Light/Dark mode (no longer hardcoded gray).
- [ ] **Typography:** "Cost" and "Odometer" icons/text should use the Primary color (Red-ish in standard theme).
- [ ] **Badges:** Status badges (Planned, Ordered, Installed) should use standard Shadcn variants (Secondary, Outline, Default).
- [ ] **Hover:** Card should have a subtle border highlight on hover.

## 2. Financials Dashboard (Console)
- [ ] **Theme Check:** Toggle system theme (Light/Dark). The entire dashboard should adapt (no stuck dark mode).
    - Light Mode: White cards, black text.
    - Dark Mode: Dark gray cards, white text.
- [ ] **Charts:**
    - Pie Chart: Segments should be Lime/Blue (Accent/Secondary).
    - Bar Chart: Bars should be Red (Primary).
    - Tooltips: Should adapt background color to theme.
- [ ] **Table:**
    - Should look like a standard data table (clean borders, proper padding).
    - Text colors for "Mods" (Orange) and "Maintenance" (Blue) should remain distinct but legible.
- [ ] **Typography:** "Total Spent" should be bold and Primary color.

## 3. General
- [ ] **Responsiveness:** Check on mobile. Table should scroll if needed (or layout should stack).
