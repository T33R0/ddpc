# Quick Start: Core Utility Loop

## 🎯 What You Got

A fully isolated "Plan-to-Log" wishlist at `/dev/wishlist`

## ⚡ 3-Step Setup

### 1. Create the Database Table
Open Supabase SQL Editor and run:

```bash
# File location:
apps/web/src/app/dev/wishlist/setup.sql
```

### 2. Start the Server
```bash
cd my-turborepo
npm run dev
```

### 3. Open the Page
```
http://localhost:3000/dev/wishlist
```

## 🧪 Test the Loop

1. **Add Item**: "Cold Air Intake" - $250
2. **Click**: "Mark Complete"
3. **Enter**: $275, today's date
4. **Verify**: Item moves to "Build Log"

## 📦 What Was Built

| File | Purpose |
|------|---------|
| `wishlist/page.tsx` | Main page (route) |
| `wishlist/actions.ts` | Server actions |
| `components/CulInputForm.tsx` | Add items form |
| `components/CulPlannedList.tsx` | Wishlist display |
| `components/CulCompletedList.tsx` | Build log display |
| `components/CulCompleteModal.tsx` | Completion modal |

## 🔒 Firewall Status

✅ **ZERO** imports from existing app code  
✅ **ZERO** dependencies on complex components  
✅ **100%** sterile isolation

## 🚨 Remember

This is a **quarantined feature**. It:
- Won't break existing code
- Can't be broken by existing code
- Can be deleted safely anytime

---

**Need help?** See `README.md` or `IMPLEMENTATION_SUMMARY.md` in this directory.


