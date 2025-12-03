# API Reference

## Overview

The Recipe Shopping Assistant exposes three API endpoints for data fetching and AI-powered product matching. All endpoints are implemented as Next.js API routes (serverless functions).

**Base URL:** `http://localhost:3000` (development)

---

## Endpoints

### POST /api/match

**Purpose:** Match a recipe ingredient to products using AI

**Authentication:** None required (uses server-side OpenAI API key)

**Rate Limiting:** None (add in production)

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```typescript
{
  ingredient: {
    id?: string;              // Optional: ingredient ID
    name: string;             // Required: ingredient name (e.g., "scallions")
    amount?: string;          // Optional: quantity (e.g., "3 stalks")
    recipeName?: string;      // Optional: recipe context
  },
  products: Array<{
    id: string;               // Required: unique product ID
    name: string;             // Required: product name
    price?: number;           // Optional: product price
    image?: string;           // Optional: product image URL
    category?: string;        // Optional: product category
  }>,
  options?: {
    maxCandidates?: number;   // Default: 20
    temperature?: number;     // Default: 0.2
  }
}
```

**Example:**
```json
{
  "ingredient": {
    "id": "1-0",
    "name": "scallions",
    "amount": "3 stalks",
    "recipeName": "Beef with Scallions"
  },
  "products": [
    {
      "id": "prod-123",
      "name": "Green Onion 1 bunch",
      "price": 0.69,
      "image": "https://...",
      "category": "veg"
    },
    {
      "id": "prod-456",
      "name": "Scallions Fresh 3pc",
      "price": 1.99,
      "image": "https://...",
      "category": "veg"
    }
  ],
  "options": {
    "maxCandidates": 20,
    "temperature": 0.2
  }
}
```

#### Response

**Success (200 OK):**
```typescript
{
  ingredient: {
    id?: string;
    name: string;
    amount?: string;
    recipeName?: string;
  },
  bestMatch: {
    id: string;
    name: string;
    price: number;
    image: string;
    confidence: number;           // 0-100
    confidenceLabel: 'high' | 'medium' | 'low';
    reasoning: string;            // AI explanation
  } | null,
  alternatives: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    confidence: number;           // 60-100 (filtered)
    confidenceLabel: 'high' | 'medium' | 'low';
    reasoning: string;
  }>,
  candidateCount: number;         // # products passed pre-filter
}
```

**Example:**
```json
{
  "ingredient": {
    "id": "1-0",
    "name": "scallions",
    "amount": "3 stalks"
  },
  "bestMatch": {
    "id": "prod-123",
    "name": "Green Onion 1 bunch",
    "price": 0.69,
    "image": "https://...",
    "confidence": 95,
    "confidenceLabel": "high",
    "reasoning": "Green onions and scallions are the same vegetable. This fresh bunch is perfect for your recipe."
  },
  "alternatives": [
    {
      "id": "prod-456",
      "name": "Scallions Fresh 3pc",
      "price": 1.99,
      "image": "https://...",
      "confidence": 85,
      "confidenceLabel": "high",
      "reasoning": "Pre-packaged scallions, slightly more expensive but convenient."
    }
  ],
  "candidateCount": 12
}
```

#### Error Responses

**400 Bad Request:**
```json
{
  "error": "Invalid request: missing required fields",
  "details": "ingredient.name is required"
}
```

**404 Not Found:**
```json
{
  "error": "No matching products found during pre-filtering. Please refine the ingredient name or update product data."
}
```

**503 Service Unavailable:**
```json
{
  "error": "OpenAI API key is not configured"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to match ingredient",
  "details": "OpenAI API error: ..."
}
```

#### curl Example

```bash
curl -X POST http://localhost:3000/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "ingredient": {
      "name": "scallions",
      "amount": "3 stalks"
    },
    "products": [
      {
        "id": "prod-123",
        "name": "Green Onion 1 bunch",
        "price": 0.69,
        "image": "https://example.com/image.jpg"
      }
    ]
  }'
```

#### Implementation Details

**Pre-filtering Algorithm:**
1. Scores all products (0-5 scale)
2. Filters products with score ≥ 2
3. Returns top `maxCandidates` (default: 20)

**AI Matching:**
1. Sends pre-filtered candidates to OpenAI GPT-4o-mini
2. Temperature: 0.2 (low variance)
3. Structured JSON output
4. Returns best match + up to 5 alternatives (confidence ≥ 60)

**Fallback Logic:**
- If AI confidence < 70 → uses pre-filter best result
- If AI fails → returns top 3 pre-filter results as alternatives
- If no candidates → 404 error

---

### GET /api/recipes

**Purpose:** Fetch all recipes from JSON file

**Authentication:** None required

#### Request

**Headers:** None required

**Query Parameters:** None

**Example:**
```bash
curl http://localhost:3000/api/recipes
```

#### Response

**Success (200 OK):**
```typescript
{
  recipes: Array<{
    id: string;
    name: string;
    image: string;
    difficulty: number;           // 1-5
    difficultyLabel?: string;
    cookTime: string;
    cookTimeMinutes?: number;
    servings: number;
    cuisine?: string;
    ingredients: Array<{
      id: string;
      name: string;
      amount: string;
    }>,
    directions: string[];
  }>,
  total: number;
}
```

**Example:**
```json
{
  "recipes": [
    {
      "id": "1",
      "name": "Beef with Scallions",
      "image": "https://...",
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
        "Marinate beef with soy sauce",
        "Stir-fry beef until browned",
        "Add scallions and cook for 2 minutes"
      ]
    }
  ],
  "total": 18
}
```

#### Error Responses

**500 Internal Server Error:**
```json
{
  "error": "Failed to load recipes",
  "details": "File read error"
}
```

#### Implementation

**Data Source:** `/data/Recipes.json`

**Caching:** Browser HTTP cache (consider adding Cache-Control headers)

---

### GET /api/products

**Purpose:** Fetch all products from JSON file

**Authentication:** None required

#### Request

**Headers:** None required

**Query Parameters:** None

**Example:**
```bash
curl http://localhost:3000/api/products
```

#### Response

**Success (200 OK):**
```typescript
{
  products: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    ingredientId: string;     // Always '' (not used)
    category?: string;
  }>,
  total: number;
}
```

**Example:**
```json
{
  "products": [
    {
      "id": "prod-123",
      "name": "Green Onion 1 bunch",
      "price": 0.69,
      "image": "https://...",
      "ingredientId": "",
      "category": "veg"
    },
    {
      "id": "prod-456",
      "name": "Soy Sauce Premium 500ml",
      "price": 3.99,
      "image": "https://...",
      "ingredientId": "",
      "category": "condiments"
    }
  ],
  "total": 1243
}
```

#### Error Responses

**500 Internal Server Error:**
```json
{
  "error": "Failed to load products",
  "details": "File read error"
}
```

#### Implementation

**Data Source:** `/data/Products Data.json`

**Caching:** Browser HTTP cache

**Transform:** Adds `ingredientId: ''` to each product

---

## API Error Handling

### Client-Side Error Handling

**Recommended pattern:**
```typescript
try {
  const response = await fetch('/api/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  const data = await response.json();
  return data;
} catch (err) {
  console.error('API error:', err);
  // Show user-friendly error message
  toast.error('Failed to match ingredient');
}
```

### Common Error Scenarios

| Scenario | Status | Solution |
|----------|--------|----------|
| Missing OpenAI key | 503 | Add `OPENAI_API_KEY` to `.env.local` |
| No products match | 404 | Try manual search or skip ingredient |
| Invalid request | 400 | Check required fields in payload |
| AI API timeout | 500 | Retry request or use fallback |
| Rate limit hit | 429 | Wait and retry (if implemented) |

---

## API Response Formats

### Confidence Levels

| Score | Label | Meaning |
|-------|-------|---------|
| 80-100 | `high` | Perfect or near-perfect match |
| 60-79 | `medium` | Good match with minor differences |
| 0-59 | `low` | Filtered out, not returned |

### Match Quality

**High confidence (80-100):**
- Exact product name match
- Same ingredient, different brand
- Fresh vs packaged (same item)

**Medium confidence (60-79):**
- Similar ingredient (e.g., yellow vs white onion)
- Different form (e.g., fresh vs frozen)
- Substitutable ingredient

**Low confidence (<60):**
- Not returned in alternatives
- User should use manual search

---

## Rate Limiting & Optimization

### Current State
- No rate limiting implemented
- Unlimited requests per user
- Suitable for MVP/development

### Production Recommendations

**Add rate limiting:**
```typescript
// Recommended: 10 matches per minute per IP
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many requests, please try again later'
});
```

**Add caching:**
```typescript
// Cache API responses in Redis
const cacheKey = `match:${ingredientName}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// ... perform matching ...

await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
```

**Add request validation:**
```typescript
import { z } from 'zod';

const matchRequestSchema = z.object({
  ingredient: z.object({
    name: z.string().min(1).max(100),
    amount: z.string().optional(),
  }),
  products: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).min(1).max(2000),
});
```

---

## API Performance

### Benchmarks (Development)

| Endpoint | Avg Response Time | Notes |
|----------|------------------|-------|
| GET /api/recipes | ~50ms | Static JSON read |
| GET /api/products | ~100ms | Large JSON file (1000+ items) |
| POST /api/match | ~2-5s | Includes OpenAI API call |

### Optimization Tips

**For /api/match:**
1. Pre-filter reduces candidates by ~90% (huge cost savings)
2. Match history caching prevents duplicate API calls (~70% cache hit rate)
3. Low temperature (0.2) ensures consistent, fast responses

**For /api/products:**
1. Consider pagination for large datasets
2. Add server-side caching (Redis)
3. Use CDN for static JSON files

**For /api/recipes:**
1. Small dataset, no optimization needed
2. Consider adding search/filter endpoints

---

## API Versioning

### Current State
- No versioning (v1 implied)
- Breaking changes not supported
- Suitable for MVP

### Future Versioning Strategy

**URL-based versioning:**
```
/api/v1/match
/api/v2/match  (with enhanced features)
```

**Header-based versioning:**
```
API-Version: 2024-01-01
```

---

## Testing APIs

### Using curl

**Match ingredient:**
```bash
curl -X POST http://localhost:3000/api/match \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "ingredient": { "name": "scallions" },
  "products": [
    { "id": "1", "name": "Green Onion", "price": 0.69 }
  ]
}
EOF
```

**Fetch recipes:**
```bash
curl http://localhost:3000/api/recipes | jq '.recipes[0]'
```

**Fetch products:**
```bash
curl http://localhost:3000/api/products | jq '.products | length'
```

### Using JavaScript

```javascript
// Match ingredient
const matchIngredient = async (ingredientName, products) => {
  const response = await fetch('/api/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredient: { name: ingredientName },
      products: products,
    }),
  });
  return response.json();
};

// Fetch recipes
const getRecipes = async () => {
  const response = await fetch('/api/recipes');
  const data = await response.json();
  return data.recipes;
};

// Fetch products
const getProducts = async () => {
  const response = await fetch('/api/products');
  const data = await response.json();
  return data.products;
};
```

---

## API Security Considerations

### Current State
- No authentication
- No authorization
- OpenAI key server-side only
- Suitable for public demo

### Production Security

**Add authentication:**
```typescript
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... proceed with request
}
```

**Input sanitization:**
```typescript
const sanitize = (input: string) =>
  input.replace(/[<>]/g, '').trim().slice(0, 100);
```

**CORS configuration:**
```typescript
// Only allow same-origin requests
const allowedOrigins = ['https://your-domain.com'];
```

**API key rotation:**
- Rotate OpenAI key monthly
- Use environment-specific keys
- Monitor usage for anomalies

---

## API Changelog

### v1 (Current)
- Initial release
- POST /api/match (AI matching)
- GET /api/recipes (recipe data)
- GET /api/products (product data)
- No versioning, no auth
- OpenAI GPT-4o-mini integration

### Future Enhancements
- Add rate limiting
- Add caching layer (Redis)
- Add pagination for products
- Add search/filter endpoints
- Add user authentication
- Add analytics/telemetry
- API versioning (v2)
