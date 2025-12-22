## 2025-05-24 - Mobile Data Entry & A11y Batch Fixes
Learning: Mobile users in garage environments benefit significantly from `inputMode="decimal"` on cost/numeric fields to trigger the correct keypad. Icon-only buttons must have `aria-label` for accessibility.
Action: Automatically audit `type="number"` inputs for `inputMode` and `size="icon"` buttons for `aria-label` during reviews.

## 2025-05-24 - Integer vs Decimal InputMode
Learning: Use `inputMode="numeric"` for integers (like odometers) and `inputMode="decimal"` for floating points (costs) to optimize the keypad layout further.
Action: Check data type before applying inputMode.
