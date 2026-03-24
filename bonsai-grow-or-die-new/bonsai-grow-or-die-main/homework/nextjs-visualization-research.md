# Next.js 15 + Data Visualization - Research Notes

**Updated:** 2026-02-05

---

## 🏗️ Next.js 15 App Router - Key Concepts

### Architecture Fundamentals

**File Structure (app/ directory):**
- `page.tsx` - Route UI (leaf node)
- `layout.tsx` - Persistent wrapper, composes with parent layouts
- `loading.tsx` - Suspense fallback for streaming
- `error.tsx` - Error boundary for segment
- `route.ts` - API endpoints (GET/POST/etc.)
- `middleware.ts` - Global request interceptor (at root, not in app/)

**Best Practice:** Keep most code OUTSIDE app/ directory - resist the urge to stuff everything inside

---

## 🎨 Server vs Client Components

**Server Components (Default):**
- ✅ Render on server, ship NO client JS
- ✅ Can read secrets, talk to DB/APIs directly
- ✅ Can `await` in JSX
- ❌ No useState, useEffect, event handlers, window/document

**Client Components ("use client"):**
- ✅ Render on server THEN hydrate on client
- ✅ Can use state/effects/events/browser APIs
- ❌ Ship JavaScript to the browser

**Pattern:** Keep most UI as Server Components; isolate interactivity in small Client islands

**For Bonsai App:**
- Dashboard layout → Server Component
- Data display cards → Server Component
- Interactive charts → Client Component (Recharts needs client-side)
- Forms → Client Component (for validation/submission)

---

## ⚡ Rendering Modes

### Static Generation (SSG) - Best for marketing/docs
```typescript
export const dynamic = 'force-static'
```

### Incremental Static Regeneration (ISR) - Best for dashboards
```typescript
export const revalidate = 60 // seconds
// OR per-fetch:
fetch(url, { next: { revalidate: 60 } })
```

### Server-Side Rendering (SSR) - Best for per-user views
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

### Streaming - Built-in with loading.tsx
```typescript
// Use loading.tsx + Suspense for progressive rendering
// Great for perceived performance on dashboards
```

**For Bonsai App:**
- Use **ISR with revalidate: 300** (5 min) for production dashboard
- Data doesn't change minute-to-minute, perfect for ISR
- Can add on-demand revalidation when data is manually updated

---

## 📊 Data Fetching & Caching

**Default:** Server fetch is memoized/deduped and cached (force-cache)

**Disable cache (per request):**
```typescript
fetch(url, { cache: 'no-store' })
// OR
fetch(url, { next: { revalidate: 0 } })
```

**Tag-based cache (for on-demand revalidation):**
```typescript
// In fetch:
fetch(url, { next: { tags: ['production-data'] } })

// To invalidate:
import { revalidateTag } from 'next/cache'
revalidateTag('production-data')
```

**For Bonsai App:**
- Tag production data fetches with 'production-data'
- When user submits new data, call `revalidateTag('production-data')`
- Dashboard updates without manual refresh

---

## 🔐 Server Actions (for mutations)

**Instead of building API routes for internal mutations, use Server Actions:**

```typescript
'use server'

export async function addProductionData(formData: FormData) {
  // Validate
  // Write to Google Sheets or DB
  // Revalidate cache
  revalidateTag('production-data')
}
```

**Call from client:**
```typescript
<form action={addProductionData}>
  <input name="weight" type="number" />
  <button type="submit">Submit</button>
</form>
```

**Benefits:**
- No manual API route needed
- Automatic serialization
- Can call `revalidateTag()` directly
- Type-safe

**For Bonsai App:**
- Use Server Actions for data submission forms
- Use Route Handlers (app/api/*) for external webhooks only

---

## 📈 Chart Library Comparison

### Summary Table

| Library | Stars | Downloads/week | Rendering | Best For |
|---------|-------|----------------|-----------|----------|
| **Recharts** | 24.8K+ | 3.6M+ | SVG | React apps, simple → moderate charts |
| **react-chartjs-2** | 6.8K+ | 1.6M+ | Canvas | Fast rendering, 10K+ data points |
| **Victory** | 11.1K | 272K+ | SVG | Cross-platform (React + React Native) |
| **Nivo** | 13.5K+ | 665K+ | SVG/Canvas/HTML | Versatile, multiple rendering methods |
| **Apache ECharts** | 62.2K+ | 1.1M+ | SVG/Canvas | Enterprise, feature-rich, complex |
| **visx** | 19.9K+ | 2.2M+ | SVG | D3 integration, custom visualizations |

---

## 🔍 Chart Library Deep Dive

### Recharts (RECOMMENDED for Bonsai App)

**Pros:**
- ✅ React component syntax (matches Next.js philosophy)
- ✅ Built with React + D3
- ✅ Simple, easy to learn
- ✅ Great documentation
- ✅ Large community (24.8K stars)
- ✅ Optimized for large datasets via React's virtual DOM
- ✅ ResponsiveContainer for mobile support

**Cons:**
- ❌ SVG only (no Canvas option)
- ❌ Charts not responsive by default (need ResponsiveContainer wrapper)

**Installation:**
```bash
npm install recharts
```

**Example:**
```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function ProductionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="grams_per_sqft" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Why Recharts for Bonsai:**
- Perfect for 60K+ row datasets (virtual DOM optimization)
- React-first API matches Next.js patterns
- Simple enough for quick development
- Powerful enough for production dashboards

---

### react-chartjs-2 (Alternative if Canvas needed)

**Pros:**
- ✅ Canvas rendering (better performance for 10K+ points)
- ✅ Based on Chart.js (mature, battle-tested)
- ✅ Responsive by default
- ✅ Animations out of the box

**Cons:**
- ❌ Canvas only (no SVG)
- ❌ Less React-idiomatic (wrapper around Chart.js)

**When to choose:**
- Need maximum performance with huge datasets (100K+ points)
- Already familiar with Chart.js
- Canvas rendering is preferred

---

### D3.js (NOT recommended for Bonsai App)

**Why avoid:**
- Steep learning curve
- Maximum flexibility = more complexity
- Recharts/Victory already use D3 internally
- Overkill for standard dashboard charts

**When to use:**
- Highly custom, unique visualizations
- Complex interactive data art
- You have D3 expertise

---

## 📱 Mobile Responsiveness

**All libraries support responsive charts, but implementation differs:**

**Recharts:**
```typescript
<ResponsiveContainer width="100%" height={400}>
  {/* Chart */}
</ResponsiveContainer>
```

**react-chartjs-2:**
```typescript
// Responsive by default, but can configure:
options={{
  responsive: true,
  maintainAspectRatio: false
}}
```

**For Bonsai App:**
- Use Tailwind breakpoints for layout
- Wrap charts in ResponsiveContainer
- Test on mobile (facility managers may use tablets/phones)

---

## 🚀 Performance Best Practices

### For Next.js App Router:

1. **Use Server Components by default**
   - Only mark chart components as 'use client'
   - Keep data fetching in Server Components

2. **Implement streaming with loading.tsx**
   - Add `loading.tsx` at dashboard route
   - Shows spinner while data loads

3. **Use dynamic imports for charts**
```typescript
import dynamic from 'next/dynamic'

const ProductionChart = dynamic(
  () => import('@/components/ProductionChart'),
  { ssr: false } // Charts render client-side only
)
```

4. **Optimize images** (if using photos/screenshots)
```typescript
import Image from 'next/image'
<Image src="/chart.png" width={800} height={600} alt="Chart" />
```

5. **Monitor cache HIT/MISS**
   - Check dev logs to tune revalidate timing
   - Adjust per-route or per-fetch

---

## 🎯 Bonsai App Architecture Recommendation

### Tech Stack:
- **Framework:** Next.js 16 (already initialized)
- **Styling:** Tailwind CSS ✅
- **Charts:** Recharts (React-first, perfect for dashboards)
- **Data:** Google Sheets API → transition to direct input later
- **Caching:** ISR with 5-minute revalidation + tag-based on-demand updates
- **Forms:** Server Actions for mutations

### File Structure:
```
app/
  layout.tsx          # Root layout (Server Component)
  page.tsx            # Landing page
  dashboard/
    layout.tsx        # Dashboard shell (Server Component)
    loading.tsx       # Loading state
    page.tsx          # Dashboard overview (Server Component)
    production/
      page.tsx        # Production charts page
    trimmers/
      page.tsx        # Trimmer productivity page
    
components/
  charts/
    ProductionChart.tsx     # 'use client' - Recharts wrapper
    TrimmerChart.tsx        # 'use client'
    WeeklyChart.tsx         # 'use client'
  
lib/
  google-sheets.ts    # Data fetching functions (Server-side)
  calculations.ts     # g/sq ft calculations
  
actions/
  production.ts       # 'use server' - Server Actions
```

### Rendering Strategy:
- Dashboard pages: **ISR with revalidate: 300** (5 min)
- Data submission: **Server Actions**
- Charts: **Client Components** (dynamic import)
- Data fetching: **Server Components**

---

## ✅ Implementation Checklist

### Phase 1: Dashboard Foundation
- [ ] Create dashboard layout with nav
- [ ] Set up Google Sheets data fetching (server-side)
- [ ] Implement ISR caching (revalidate: 300)
- [ ] Add loading.tsx for streaming

### Phase 2: Charts & Visualization
- [ ] Install Recharts (`npm install recharts`)
- [ ] Create ProductionChart component (weekly g/sq ft)
- [ ] Create TrimmerChart component (productivity)
- [ ] Wrap charts in ResponsiveContainer
- [ ] Use dynamic imports for charts

### Phase 3: Data Input
- [ ] Build data input forms (Client Components)
- [ ] Create Server Actions for mutations
- [ ] Implement tag-based revalidation
- [ ] Add form validation

### Phase 4: Polish
- [ ] Mobile responsiveness testing
- [ ] Add authentication (password protection)
- [ ] Error boundaries (error.tsx)
- [ ] Performance optimization

---

## 📚 Key Resources

- **Next.js 15 Docs:** https://nextjs.org/docs
- **Recharts Docs:** https://recharts.org/
- **Next.js Dashboard Tutorial:** https://nextjs.org/learn/dashboard-app
- **LogRocket React Charts:** https://blog.logrocket.com/best-react-chart-libraries-2025/

---

**Next Steps:**
- [ ] Design dashboard mockup (layout + charts)
- [ ] Define data models/interfaces (TypeScript types)
- [ ] Plan agent swarm task breakdown
- [ ] Create GitHub branch strategy
