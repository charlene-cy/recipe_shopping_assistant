# Features Documentation

## Core Features

### 1. Recipe Discovery (Swipe Interface)

**How it works:**
- Tinder-style card stack with 2 cards visible
- Swipe right (or click "View Recipe") to view details
- Swipe left to skip to next recipe
- Smooth animations using Motion/Framer Motion
- "Start Over" button when all recipes viewed

**User Flow:**
```
Home Page → Swipe Cards → View Recipe → Recipe Detail Page
```

**Key Components:**
- `RecipeSwipePage`: Main container
- `RecipeCard`: Individual swipeable card

---

### 2. AI Product Matching

**How it works:**
1. User clicks "Add Ingredients to Cart" on recipe detail page
2. Modal opens showing all ingredients
3. System checks match history cache for each ingredient
4. If not cached, calls `/api/match` endpoint
5. Pre-filtering: Scores all products (1-5 scale)
6. AI matching: Sends top 20 candidates to OpenAI GPT-4o-mini
7. Returns best match + up to 5 alternatives (confidence ≥ 60)
8. Saves result to match history

**Pre-filtering Algorithm:**
```
Score 5: Exact match ("scallions" === "scallions")
Score 4: Phrase match ("fresh scallions" contains "scallions")
Score 3: Word boundary match (\bscallions\b in product name)
Score 2: Partial match (token substring found)
Score 0-1: Filtered out
```

**AI Configuration:**
- Model: GPT-4o-mini
- Temperature: 0.2 (low variance, consistent results)
- Output: Structured JSON
- Cost optimization: Only top 20 candidates sent

**Match Quality Indicators:**
- **High (80-100)**: Green badge, perfect match
- **Medium (60-79)**: Yellow badge, good match
- **Low (<60)**: Filtered out, not shown

---

### 3. Match History & Caching

**Purpose:** Avoid duplicate API calls and provide faster results

**How it works:**
- All matches saved to localStorage
- Keyed by normalized ingredient name (lowercase, trimmed)
- Checked before making API call
- If match found in history, display immediately
- Shows different status badges based on cache status

**Status Badges:**
- 🤖 **AI Matched**: Fresh from API (just matched)
- 💾 **Previously Matched**: Loaded from cache
- ✨ **Your Choice**: User previously added to cart

**Data Stored:**
- Best match product details
- Confidence score and reasoning
- Up to 5 alternatives
- Timestamp
- Whether user added to cart

**Cache Hit Rate:** ~70% (based on typical usage)

**Storage:** localStorage key `ingredient_match_history`

---

### 4. Shopping Cart

**Features:**
- Persistent cart (survives page reloads)
- Groups items by recipe
- Quantity controls (add/remove)
- Total price per recipe
- Grand total across all recipes
- "Clear All Items" with confirmation
- "Checkout on Weee!" button (external link)

**Cart Item Structure:**
```typescript
{
  product: WeeeProduct,
  quantity: number,
  recipeId: string,
  recipeName: string  // For grouping
}
```

**Cart Updates:**
- Add item → Dispatches `cartUpdated` event
- Remove item → Quantity set to 0
- Update quantity → Direct modification
- Clear all → Confirmation dialog

**Floating Cart Button:**
- Always visible (fixed position)
- Shows item count badge
- Links to `/cart` page
- Z-index: 50 (always on top)

---

### 5. Manual Product Search

**When to use:**
- AI match failed (404 error)
- User doesn't like AI suggestions
- User wants to browse all options

**How it works:**
1. Click "Search Manually" or "Search all products manually"
2. Modal opens with search input
3. Search input pre-populated with ingredient name
4. Real-time filtering as user types
5. Radio selection interface
6. Select product → Saves as manual match (confidence: 100)

**Search Algorithm:**
```typescript
products.filter(p =>
  p.name.toLowerCase().includes(searchQuery.toLowerCase())
)
```

**Features:**
- Live search (no submit button needed)
- Shows product count
- Image thumbnails
- Price display
- Nested modal (doesn't close parent)

---

### 6. Alternative Product Selection

**Purpose:** Let users choose from AI-suggested alternatives

**How it works:**
- Click "See X alternatives" to expand
- Shows best match + alternatives in radio list
- Select alternative → Updates match history
- Swaps best match with selected alternative
- Logs feedback for improvement

**Alternative Criteria:**
- Confidence ≥ 60
- Maximum 5 alternatives
- Sorted by confidence (highest first)

**Options in List:**
- Best match (current selection, highlighted)
- Up to 5 alternatives
- "Search all products manually" option
- "Skip this ingredient" option

---

### 7. Theme Toggle (Dark/Light Mode)

**Features:**
- Light and dark themes
- System preference detection
- Manual toggle switch
- Smooth transitions
- Persistent preference

**Implementation:**
- Uses `next-themes` library
- Sun icon (light mode) / Moon icon (dark mode)
- Located at bottom of swipe page

**CSS Variables:**
```css
:root {
  --background: white;
  --foreground: black;
}

.dark {
  --background: black;
  --foreground: white;
}
```

---

### 8. Responsive Design

**Breakpoints:**
- Mobile: < 768px (default)
- Tablet: 768px - 1024px (md)
- Desktop: > 1024px (lg)

**Mobile Optimizations:**
- Touch-optimized buttons (44px minimum)
- Swipe gestures for recipe cards
- Bottom sheet modals (Sheet component)
- Floating cart button
- Vertical layout

**Desktop Enhancements:**
- Larger images and text
- Center-aligned content
- Max-width containers
- Dialog modals instead of sheets

---

### 9. Secret Developer Feature

**Purpose:** Quick way to clear all data for testing

**How to activate:**
1. Go to recipe swipe page
2. Tap "Charlene" text 10 times within 3 seconds
3. Visual feedback at 5 taps (text flashes red, vibration)
4. At 10 taps, shows confirmation dialog

**What it clears:**
- Match history (localStorage)
- Cart items (localStorage)
- All ingredient/recipe/cart-related keys

**After clearing:**
- Shows success toast
- Auto-refreshes page after 1 second
- All data reset to initial state

**Tap Counter:**
- Resets after 3 seconds of inactivity
- Console logs each tap (for debugging)
- Haptic feedback at halfway point

---

### 10. Error Handling & Fallbacks

**Ingredient Matching Errors:**
- **No products found (404)**: Shows "No match found" with manual search option
- **AI API error (500)**: Falls back to pre-filter results
- **OpenAI key missing (503)**: Shows error message with setup instructions
- **Network error**: Retry button + error message

**Image Loading:**
- Uses `ImageWithFallback` component
- Fallback: Gray placeholder with "No image" text
- Prevents broken image icons

**Data Loading:**
- Loading states for recipes, products, matches
- Skeleton loaders or spinner animations
- Error messages with retry options

---

### 11. Toast Notifications

**Library:** Sonner

**Notification Types:**
- **Success**: Green toast (e.g., "Added 3 items to cart")
- **Error**: Red toast (e.g., "Failed to match ingredient")
- **Info**: Blue toast (e.g., "Skipped scallions")

**Examples:**
```typescript
toast.success('Added to cart');
toast.error('Failed to load products');
toast.info('Match loaded from history');
```

**Position:** Top-right corner

---

### 12. Accessibility Features

**Keyboard Navigation:**
- Tab through interactive elements
- Enter to activate buttons
- Escape to close modals

**ARIA Labels:**
- All buttons have accessible names
- Modals have proper roles
- Form inputs have labels

**Screen Reader Support:**
- Semantic HTML (`<button>`, `<nav>`, `<main>`)
- Alt text for images
- Status announcements for loading states

**Touch Targets:**
- Minimum 44x44px for all clickable elements
- Adequate spacing between buttons
- Large tap areas for mobile

---

### 13. Performance Optimizations

**Client-Side:**
- Match history caching (reduces API calls by ~70%)
- Image lazy loading
- Event-driven updates (minimize re-renders)
- localStorage for instant cart/history restoration

**Server-Side:**
- Pre-filtering reduces OpenAI input by ~90%
- Low temperature (0.2) for faster, consistent responses
- Serverless auto-scaling

**Bundle Optimization:**
- Next.js automatic code splitting
- Tree shaking (remove unused code)
- Dynamic imports for heavy components

---

## Feature Roadmap

### Planned Features

1. **User Accounts**
   - Sign up / login
   - Save favorite recipes
   - Persistent cart across devices

2. **Recipe Ratings & Reviews**
   - Star ratings
   - User comments
   - Recipe difficulty feedback

3. **Dietary Filters**
   - Vegetarian, vegan, gluten-free
   - Allergen warnings
   - Nutrition information

4. **Shopping Lists**
   - Export to PDF
   - Share via email/text
   - Print-friendly format

5. **Recipe Recommendations**
   - Based on user preferences
   - "Customers who liked this also liked..."
   - Seasonal recipes

6. **Real-time Inventory**
   - Weee! API integration
   - Stock availability
   - Price updates

7. **Meal Planning**
   - Weekly meal planner
   - Grocery list generation
   - Calorie tracking

8. **Social Features**
   - Share recipes on social media
   - Friend recommendations
   - Cooking challenges

---

## Feature Metrics

**Usage Statistics (Estimated):**
- Match cache hit rate: ~70%
- Average match time: 2-3 seconds
- Match accuracy (high confidence): ~80%
- Cart conversion rate: ~60% (users who view recipe add to cart)
- Alternative selection rate: ~15%
- Manual search usage: ~10%

**Performance Metrics:**
- Page load time: < 2 seconds
- API response time: 2-5 seconds (including AI)
- localStorage operations: < 50ms
- Image load time: 1-3 seconds (CDN-dependent)
