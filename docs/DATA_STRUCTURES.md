# Data Structures

## TypeScript Interfaces

### Recipe

```typescript
interface Recipe {
  id: string;                    // Unique identifier
  name: string;                  // Recipe title
  image: string;                 // Image URL
  difficulty: number;            // 1-5 scale
  difficultyLabel?: string;      // Optional label
  cookTime: string;              // Human-readable (e.g., "30 min")
  cookTimeMinutes?: number;      // Optional numeric value
  servings: number;              // Number of servings
  cuisine?: string;              // Optional cuisine type
  ingredients: RecipeIngredient[];
  directions: string[];          // Step-by-step instructions
}
```

### RecipeIngredient

```typescript
interface RecipeIngredient {
  id: string;      // Format: "{recipeId}-{index}"
  name: string;    // Ingredient name (e.g., "Scallions")
  amount: string;  // Quantity (e.g., "3 stalks")
}
```

### WeeeProduct

```typescript
interface WeeeProduct {
  id: string;          // Unique product ID
  name: string;        // Product name
  price: number;       // Price in USD
  image: string;       // Product image URL
  ingredientId: string; // Always "" (legacy field)
}
```

### CartItem

```typescript
interface CartItem {
  product: WeeeProduct;
  quantity: number;      // Number of items
  recipeId: string;      // Source recipe
  recipeName: string;    // Recipe name for grouping
}
```

### MatchedProduct

```typescript
interface MatchedProduct extends WeeeProduct {
  confidence: number;                           // 0-100
  confidenceLabel: 'high' | 'medium' | 'low';
  reasoning: string;                            // AI explanation
}
```

### IngredientMatchResult

```typescript
interface IngredientMatchResult {
  ingredient: RecipeIngredient;
  bestMatch: MatchedProduct | null;
  alternatives: MatchedProduct[];
  candidateCount: number;   // # products passed pre-filter
}
```

### IngredientMatchState

```typescript
type MatchLoadingState = 'waiting' | 'loading' | 'matched' | 'error' | 'no_match';

interface IngredientMatchState {
  ingredient: RecipeIngredient;
  state: MatchLoadingState;
  result?: IngredientMatchResult;
  error?: string;
  isFromCache?: boolean;       // Loaded from history
  isUserSelection?: boolean;   // User manually selected
}
```

### MatchHistoryEntry

```typescript
interface MatchHistoryEntry {
  ingredientName: string;      // Normalized (lowercase, trimmed)
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  confidence: number;
  confidenceLabel: 'high' | 'medium' | 'low';
  reasoning: string;
  timestamp: string;           // ISO 8601 format
  addedToCart: boolean;        // User added to cart
  alternatives: Array<{
    productId: string;
    productName: string;
    confidence: number;
  }>;
}
```

---

## localStorage Schema

### Cart Items

**Key:** `cartItems`

**Format:** JSON array of CartItem objects

**Example:**
```json
[
  {
    "product": {
      "id": "prod-123",
      "name": "Green Onion 1 bunch",
      "price": 0.69,
      "image": "https://...",
      "ingredientId": ""
    },
    "quantity": 2,
    "recipeId": "1",
    "recipeName": "Beef with Scallions"
  },
  {
    "product": {
      "id": "prod-456",
      "name": "Soy Sauce 500ml",
      "price": 3.99,
      "image": "https://...",
      "ingredientId": ""
    },
    "quantity": 1,
    "recipeId": "1",
    "recipeName": "Beef with Scallions"
  }
]
```

**Operations:**
```typescript
// Read
const items = JSON.parse(localStorage.getItem('cartItems') || '[]');

// Write
localStorage.setItem('cartItems', JSON.stringify(items));

// Clear
localStorage.removeItem('cartItems');
```

### Match History

**Key:** `ingredient_match_history`

**Format:** JSON array of MatchHistoryEntry objects

**Example:**
```json
[
  {
    "ingredientName": "scallions",
    "productId": "prod-123",
    "productName": "Green Onion 1 bunch",
    "productPrice": 0.69,
    "productImage": "https://...",
    "confidence": 95,
    "confidenceLabel": "high",
    "reasoning": "Green onions and scallions are the same vegetable.",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "addedToCart": true,
    "alternatives": [
      {
        "productId": "prod-456",
        "productName": "Scallions Fresh 3pc",
        "confidence": 85
      }
    ]
  }
]
```

**Key Features:**
- Ingredient names normalized (lowercase, trimmed)
- Timestamp in ISO 8601 format
- Tracks whether user added to cart
- Stores alternatives for re-matching

---

## JSON Data Files

### Recipes.json

**Location:** `/data/Recipes.json`

**Format:** Array of Recipe objects

**Example:**
```json
[
  {
    "id": "1",
    "name": "Beef with Scallions",
    "image": "https://images.unsplash.com/...",
    "difficulty": 2,
    "cookTime": "30 min",
    "servings": 4,
    "ingredients": [
      {
        "id": "1-0",
        "name": "Scallions",
        "amount": "3 stalks"
      },
      {
        "id": "1-1",
        "name": "Beef",
        "amount": "1 lb"
      }
    ],
    "directions": [
      "Slice scallions into 2-inch pieces",
      "Marinate beef with soy sauce for 15 minutes",
      "Heat wok over high heat with oil",
      "Stir-fry beef until browned, 3-4 minutes",
      "Add scallions and cook for 2 minutes",
      "Serve hot with rice"
    ]
  }
]
```

### Products Data.json

**Location:** `/data/Products Data.json`

**Format:** Array of product objects (Weee! catalog format)

**Example:**
```json
[
  {
    "id": "prod-123",
    "name": "Green Onion 1 bunch",
    "price": 0.69,
    "image": "https://...",
    "category": "veg"
  },
  {
    "id": "prod-456",
    "name": "Beef Chuck Steak 1 lb",
    "price": 8.99,
    "image": "https://...",
    "category": "meat"
  }
]
```

**Note:** Products are transformed when loaded via API to add `ingredientId: ""` field.

---

## API Payload Formats

### Match Request Payload

```typescript
{
  ingredient: {
    id?: string;
    name: string;         // Required
    amount?: string;
    recipeName?: string;
  },
  products: Array<{
    id: string;           // Required
    name: string;         // Required
    price?: number;
    image?: string;
  }>,
  options?: {
    maxCandidates?: number;  // Default: 20
    temperature?: number;    // Default: 0.2
  }
}
```

### Match Response Payload

```typescript
{
  ingredient: IngredientPayload,
  bestMatch: MatchedProduct | null,
  alternatives: MatchedProduct[],
  candidateCount: number
}
```

---

## State Management Structures

### Cart State (useCart hook)

```typescript
{
  items: CartItem[],
  totalItems: number,
  totalPrice: number,
  addItem: (product: WeeeProduct, recipeId: string, recipeName: string) => void,
  removeItem: (productId: string) => void,
  updateQuantity: (productId: string, quantity: number) => void,
  clearCart: () => void
}
```

### Match History State (useMatchHistory hook)

```typescript
{
  history: Map<string, MatchHistoryEntry>,  // Key: normalized ingredient name
  isLoaded: boolean,
  saveMatch: (ingredientName: string, product: MatchedProduct, alternatives: MatchedProduct[]) => void,
  getMatch: (ingredientName: string) => MatchHistoryEntry | undefined,
  updateMatch: (ingredientName: string, product: MatchedProduct) => void,
  markAsAddedToCart: (ingredientName: string, productId: string) => void,
  clearMatch: (ingredientName: string) => void,
  clearAll: () => void
}
```

---

## Data Normalization

### Ingredient Name Normalization

**Purpose:** Ensure consistent matching in history cache

**Function:**
```typescript
const normalizeIngredientName = (name: string): string => {
  return name.toLowerCase().trim();
};
```

**Examples:**
```typescript
normalizeIngredientName("Scallions")       // "scallions"
normalizeIngredientName(" Green Onions ")  // "green onions"
normalizeIngredientName("SOY SAUCE")       // "soy sauce"
```

### Product Score Normalization

**Purpose:** Rank products for pre-filtering

**Scores:**
- 5: Exact full string match
- 4: Phrase match (contains ingredient)
- 3: Word boundary match
- 2: Partial token match
- 0-1: Filtered out

---

## Data Constraints

### Limits

- **Recipes:** ~20 recipes (current dataset)
- **Products:** ~1000+ products (Weee! catalog)
- **localStorage:** ~5-10MB limit (browser-dependent)
- **Match candidates:** Max 20 sent to AI
- **Alternatives:** Max 5 per ingredient
- **Cart items:** Unlimited (limited by localStorage)

### Validation Rules

- Recipe ID: Required, unique
- Product ID: Required, unique
- Ingredient name: 1-100 characters
- Product name: 1-200 characters
- Price: ≥ 0
- Quantity: 1-99
- Confidence: 0-100

---

## Data Migration

### Future Database Schema (PostgreSQL)

```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  image TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  cook_time VARCHAR(50),
  servings INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ingredients (
  id UUID PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id),
  name VARCHAR(100) NOT NULL,
  amount VARCHAR(50),
  position INTEGER
);

CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  recipe_id UUID REFERENCES recipes(id),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE match_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  ingredient_name VARCHAR(100),
  product_id UUID REFERENCES products(id),
  confidence INTEGER,
  reasoning TEXT,
  added_to_cart BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

This would enable:
- User accounts and authentication
- Persistent cart across devices
- Analytics and usage tracking
- Real-time inventory updates
- Better scalability
