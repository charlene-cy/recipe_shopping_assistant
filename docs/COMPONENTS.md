# Component Reference

## Overview

This document provides a comprehensive reference for all major React components in the Recipe Shopping Assistant application.

## Component Hierarchy

```
RootLayout
├── ThemeProvider
├── CartButton (global)
├── Toaster (global)
└── Page Components
    ├── RecipeSwipePage
    │   └── RecipeCard
    ├── RecipeDetailPage
    │   └── IngredientModal
    │       ├── IngredientMatchCard
    │       │   └── AddIngredientButton
    │       └── ManualSearchModal
    └── CartPage
        └── AddIngredientButton
```

---

## Page Components

### RecipeSwipePage

**Location:** `/src/components/RecipeSwipePage.tsx`

**Purpose:** Main swipe interface for discovering recipes

**Props:**
```typescript
interface RecipeSwipePageProps {
  recipes: Recipe[];
  onRecipeSelect: (recipe: Recipe) => void;
}
```

**Key Features:**
- Tinder-style card stack (2 cards visible)
- Swipe gestures (left/right)
- Recipe navigation
- Secret developer feature (10-tap data clear)
- Theme toggle

**State:**
- `currentIndex`: Current recipe index
- `tapCount`: Secret feature tap counter
- `showClearDialog`: Confirmation dialog state

**Events:**
- Swipe right → calls `onRecipeSelect()`
- Swipe left → increments index
- 10 taps on "Charlene" → shows clear data dialog

**Usage:**
```tsx
<RecipeSwipePage
  recipes={allRecipes}
  onRecipeSelect={(recipe) => router.push(`/recipe/${recipe.id}`)}
/>
```

---

### RecipeCard

**Location:** `/src/components/RecipeCard.tsx`

**Purpose:** Individual swipeable recipe card with gesture support

**Props:**
```typescript
interface RecipeCardProps {
  recipe: Recipe;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  style?: {
    zIndex: number;
    scale: number;
    opacity: number;
  };
}
```

**Key Features:**
- Motion animations (drag, scale, opacity)
- Swipe gesture detection
- Recipe preview (image, title, difficulty, cook time)
- "View Recipe" button

**Gesture Logic:**
- Drag > 100px right → swipe right
- Drag > 100px left → swipe left
- Visual feedback during drag

**Usage:**
```tsx
<RecipeCard
  recipe={currentRecipe}
  onSwipeRight={handleViewRecipe}
  onSwipeLeft={handleSkip}
  style={{ zIndex: 2, scale: 1, opacity: 1 }}
/>
```

---

### RecipeDetailPage

**Location:** `/src/components/RecipeDetailPage.tsx`

**Purpose:** Full recipe view with ingredients and directions

**Props:**
```typescript
interface RecipeDetailPageProps {
  recipe: Recipe;
  products: WeeeProduct[];
  onBack: () => void;
  cartQuantities: Map<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
  onAddToCart: (products: WeeeProduct[], recipeId: string, recipeName: string) => void;
}
```

**Sections:**
1. **Header**: Recipe image with back button
2. **Info Card**: Title, difficulty badge, cook time, servings
3. **Ingredients**: List with Weee! availability badges
4. **Directions**: Numbered step-by-step instructions
5. **Bottom Button**: "Add Ingredients to Cart" (opens modal)

**State:**
- `isModalOpen`: Controls ingredient modal visibility

**Usage:**
```tsx
<RecipeDetailPage
  recipe={recipe}
  products={allProducts}
  onBack={() => router.back()}
  cartQuantities={cartQuantityMap}
  onQuantityChange={updateQuantity}
  onAddToCart={addMultipleToCart}
/>
```

---

### CartPage

**Location:** `/src/components/CartPage.tsx`

**Purpose:** Shopping cart with recipe grouping

**Props:**
```typescript
interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearCart: () => void;
}
```

**Features:**
- Groups items by recipe
- Shows total price per recipe
- Quantity controls for each item
- "Clear All Items" button with confirmation
- "Checkout on Weee!" button

**Layout:**
```
┌─────────────────────────┐
│ Cart (X items)          │
├─────────────────────────┤
│ Recipe Group 1          │
│  ├── Item 1  [$X] [+/-] │
│  ├── Item 2  [$X] [+/-] │
│  └── Total: $XX         │
├─────────────────────────┤
│ Recipe Group 2          │
│  └── ...                │
├─────────────────────────┤
│ Total: $XXX             │
│ [Checkout on Weee!]     │
│ [Clear All Items]       │
└─────────────────────────┘
```

---

## Feature Components

### IngredientModal

**Location:** `/src/components/IngredientModal.tsx`

**Purpose:** AI product matching interface for recipe ingredients

**Props:**
```typescript
interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  products: WeeeProduct[];
  cartQuantities: Map<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
  onAddToCart: (products: WeeeProduct[]) => void;
}
```

**State:**
- `matchStates`: Map of ingredient ID → MatchState
- `manualSearchIngredient`: Currently searching ingredient
- `cartUpdateTrigger`: Force re-render on cart changes

**Matching States:**
- `waiting`: Not started
- `loading`: API call in progress
- `matched`: Product found
- `error`: API error
- `no_match`: No products found

**Match Flow:**
1. Modal opens → all ingredients set to "waiting"
2. Check match history (cache)
3. If cached → display immediately
4. If not cached → call `/api/match`
5. Save result to history
6. Display with appropriate status badge

**Status Badges:**
- 🤖 AI Matched: Fresh from API
- 💾 Previously Matched: Loaded from cache
- ✨ Your Choice: User previously added to cart

**Features:**
- Parallel matching (all ingredients at once)
- Smart caching (avoids duplicate API calls)
- Manual search fallback
- Skip ingredient option
- Alternative product selection
- "Add All to Cart" button

---

### IngredientMatchCard

**Location:** `/src/components/IngredientMatchCard.tsx`

**Purpose:** Display single ingredient match result

**Props:**
```typescript
interface IngredientMatchCardProps {
  matchState: IngredientMatchState;
  recipeId: string;
  recipeName: string;
  cartQuantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRetry: () => void;
  onManualSearch: () => void;
  onSkip: () => void;
  onAlternativeSelected?: (productId: string) => void;
  matchStatus?: MatchStatus;
  matchedTimestamp?: Date;
  wasAddedToCart?: boolean;
}
```

**Card Layout (3 sections):**

**Section 1: Ingredient Header**
```
┌──────────────────────────────────────┐
│ Scallions • 3 stalks   [Why match?] │
└──────────────────────────────────────┘
```

**Section 2: Product Info**
```
┌──────────────────────────────────────┐
│ [Image]  Green Onion 1 bunch        │
│          $0.69              [Add +] │
└──────────────────────────────────────┘
```

**Section 3: Alternatives Toggle**
```
┌──────────────────────────────────────┐
│ ▼ See 3 alternatives                 │
│   ○ Best match (current)            │
│   ○ Alternative 1                   │
│   ○ Alternative 2                   │
│   [Search all products manually]     │
│   [🚫 Skip this ingredient]         │
└──────────────────────────────────────┘
```

**Match States:**

**Waiting:**
```
Ingredient name • amount
Waiting to match...
```

**Loading:**
```
[Spinner] Ingredient name • amount
Finding best match...
```

**Matched:**
```
Full card with product, add button, alternatives
```

**Error:**
```
[!] Ingredient name • amount
Error message
[Retry] [Search Manually] [Skip]
```

**No Match:**
```
[!] Ingredient name • amount
No match found
[Search Manually] [Skip]
```

**Skipped (minimized):**
```
Ingredient name • Skipped  [Undo]
```

**Features:**
- Alternative product selection
- Manual search trigger
- Skip with undo
- "Why match?" dialog
- Feedback logging

---

### ManualSearchModal

**Location:** `/src/components/ManualSearchModal.tsx`

**Purpose:** Manual product search interface

**Props:**
```typescript
interface ManualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: RecipeIngredient;
  products: WeeeProduct[];
  onSelect: (product: WeeeProduct) => void;
}
```

**Features:**
- Real-time search filtering
- Radio selection interface
- Product count display
- Pre-populated with ingredient name
- Nested modal (doesn't close parent)

**Search Logic:**
```typescript
const filteredProducts = products.filter(product =>
  product.name.toLowerCase().includes(searchQuery.toLowerCase())
);
```

**Layout:**
```
┌─────────────────────────────────────┐
│ Search Products Manually        [X] │
│ Finding: Scallions • 3 stalks       │
│ [🔍 Search products...]             │
├─────────────────────────────────────┤
│ X products found                    │
│                                     │
│ ○ [Image] Product 1      $X.XX     │
│ ○ [Image] Product 2      $X.XX     │
│ ○ [Image] Product 3      $X.XX     │
│                                     │
├─────────────────────────────────────┤
│ [Cancel]      [Select Product]      │
└─────────────────────────────────────┘
```

---

## Shared UI Components

### CartButton

**Location:** `/app/components/CartButton.tsx`

**Purpose:** Global floating cart button with badge

**Features:**
- Fixed position (bottom-right)
- Cart item count badge
- Listens for `cartUpdated` events
- Links to `/cart` page
- Z-index: 50 (always on top)

**Usage:**
```tsx
<CartButton />  // No props needed, manages its own state
```

---

### AddIngredientButton

**Location:** `/src/components/AddIngredientButton.tsx`

**Purpose:** Quantity selector with add/remove

**Props:**
```typescript
interface AddIngredientButtonProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
}
```

**States:**
```
quantity === 0:  [Add +]
quantity > 0:    [-] X [+]
```

**Features:**
- Minimum: 0 (remove from cart)
- Maximum: 99
- Increment/decrement buttons
- Quantity display
- Touch-friendly (44px buttons)

---

### ThemeToggle

**Location:** `/src/components/ThemeToggle.tsx`

**Purpose:** Light/dark mode switcher

**Features:**
- Uses `next-themes`
- System preference detection
- Smooth transitions
- Sun/moon icon toggle

**Usage:**
```tsx
<ThemeToggle />
```

---

### ImageWithFallback

**Location:** `/src/components/figma/ImageWithFallback.tsx`

**Purpose:** Robust image loading with error handling

**Props:**
```typescript
interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}
```

**Features:**
- Fallback to placeholder on error
- Loading state
- Supports any image URL
- Graceful degradation

**Fallback:** Gray box with "No image" text

---

## UI Primitive Components

These components are from the `shadcn/ui` library, customized with Tailwind CSS.

### Button

**Location:** `/src/components/ui/button.tsx`

**Variants:**
- `default`: Primary button (blue)
- `outline`: Outlined button
- `ghost`: Transparent button
- `destructive`: Red button (delete actions)

**Sizes:**
- `sm`: Small (32px height)
- `md`: Medium (40px height)
- `lg`: Large (44px height)

**Usage:**
```tsx
<Button variant="outline" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

---

### Sheet

**Location:** `/src/components/ui/sheet.tsx`

**Purpose:** Bottom sheet modal (mobile-friendly)

**Sides:**
- `bottom`: Slides up from bottom (default)
- `top`: Slides down from top
- `left`: Slides from left
- `right`: Slides from right

**Components:**
- `Sheet`: Wrapper
- `SheetContent`: Modal content
- `SheetHeader`: Header section
- `SheetTitle`: Title text
- `SheetClose`: Close button (auto-included)

**Usage:**
```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Modal Title</SheetTitle>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

---

### Dialog

**Location:** `/src/components/ui/dialog.tsx`

**Purpose:** Center modal dialog

**Components:**
- `Dialog`: Wrapper
- `DialogContent`: Modal content
- `DialogHeader`: Header section
- `DialogTitle`: Title text
- `DialogDescription`: Subtitle/description

**Usage:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>Are you sure?</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

---

### AlertDialog

**Location:** `/src/components/ui/alert-dialog.tsx`

**Purpose:** Confirmation dialog

**Components:**
- `AlertDialog`: Wrapper
- `AlertDialogContent`: Modal content
- `AlertDialogHeader`: Header
- `AlertDialogTitle`: Title
- `AlertDialogDescription`: Description
- `AlertDialogFooter`: Button container
- `AlertDialogCancel`: Cancel button
- `AlertDialogAction`: Confirm button

**Usage:**
```tsx
<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleClear}>
        Clear
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Input

**Location:** `/src/components/ui/input.tsx`

**Purpose:** Text input field

**Usage:**
```tsx
<Input
  type="text"
  placeholder="Search..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full"
/>
```

---

### Card

**Location:** `/src/components/ui/card.tsx`

**Components:**
- `Card`: Container
- `CardHeader`: Header section
- `CardTitle`: Title
- `CardDescription`: Description
- `CardContent`: Main content
- `CardFooter`: Footer (buttons)

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Recipe Name</CardTitle>
    <CardDescription>Cook time: 30 min</CardDescription>
  </CardHeader>
  <CardContent>
    Ingredients list...
  </CardContent>
  <CardFooter>
    <Button>Add to Cart</Button>
  </CardFooter>
</Card>
```

---

## Component Patterns & Best Practices

### 1. Server vs Client Components

**Server Components (default in App Router):**
- Pages that don't need interactivity
- Data fetching components
- Static content

**Client Components (`'use client'` directive):**
- Interactive components (buttons, forms)
- State management (useState, useEffect)
- Event handlers
- Browser APIs (localStorage, window)

### 2. Props Pattern

**Always define TypeScript interfaces:**
```typescript
interface MyComponentProps {
  requiredProp: string;
  optionalProp?: number;
  callback: (value: string) => void;
}
```

### 3. State Management

**Local state:**
```typescript
const [count, setCount] = useState(0);
```

**Custom hooks for shared state:**
```typescript
const { items, addItem, removeItem } = useCart();
```

**localStorage sync:**
```typescript
useEffect(() => {
  localStorage.setItem('key', JSON.stringify(state));
}, [state]);
```

### 4. Event Handling

**Custom events for cross-component communication:**
```typescript
// Dispatch
window.dispatchEvent(new CustomEvent('cartUpdated'));

// Listen
useEffect(() => {
  const handler = () => { /* update */ };
  window.addEventListener('cartUpdated', handler);
  return () => window.removeEventListener('cartUpdated', handler);
}, []);
```

### 5. Error Boundaries

**Wrap risky components:**
```typescript
<ErrorBoundary fallback={<ErrorMessage />}>
  <RiskyComponent />
</ErrorBoundary>
```

### 6. Loading States

**Always show loading UI:**
```typescript
if (isLoading) return <Loader />;
if (error) return <Error message={error.message} />;
return <Content data={data} />;
```

---

## Component Testing Checklist

- [ ] TypeScript types defined
- [ ] Props validated
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Accessibility (ARIA labels)
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Touch targets ≥ 44px
- [ ] Keyboard navigation
- [ ] Dark/light mode support
- [ ] Performance optimized (memo, useMemo)
