# System Architecture

## Overview

Recipe Shopping Assistant is built on a modern, serverless architecture using Next.js 14 with the App Router. The application follows a client-server model with AI-enhanced product matching capabilities.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Components (Next.js App Router)                 │ │
│  │  ├── RecipeSwipePage                                   │ │
│  │  ├── RecipeDetailPage                                  │ │
│  │  ├── IngredientModal (AI Matching UI)                  │ │
│  │  └── CartPage                                          │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Custom Hooks (State Management)                       │ │
│  │  ├── useCart (localStorage sync)                       │ │
│  │  ├── useMatchHistory (caching)                         │ │
│  │  ├── useRecipes                                        │ │
│  │  └── useProducts                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  localStorage                                          │ │
│  │  ├── cartItems                                         │ │
│  │  └── ingredient_match_history                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                    Server (Next.js API Routes)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Endpoints                                         │ │
│  │  ├── POST /api/match    (AI Matching)                 │ │
│  │  ├── GET  /api/recipes  (Recipe Data)                 │ │
│  │  └── GET  /api/products (Product Data)                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Business Logic                                        │ │
│  │  ├── Pre-filtering Algorithm (Text Matching)          │ │
│  │  ├── Scoring System (5 levels)                        │ │
│  │  └── Fallback Logic                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Data Layer                                            │ │
│  │  ├── Recipes.json (18 recipes)                        │ │
│  │  └── Products Data.json (1000+ products)              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  OpenAI API                                            │ │
│  │  └── GPT-4o-mini (Structured Output)                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Framework: Next.js 14 App Router

The application uses Next.js 14's App Router for file-based routing and modern React features.

**Routing Structure:**
```
app/
├── page.tsx                    # Route: /
├── recipe/
│   └── [id]/page.tsx          # Route: /recipe/:id
└── cart/
    └── page.tsx               # Route: /cart
```

### Component Hierarchy

```
RootLayout (app/layout.tsx)
├── ThemeProvider (Light/Dark mode)
├── CartButton (Global floating button)
├── Toaster (Toast notifications)
└── Page Content
    │
    ├── Home Page (/)
    │   └── RecipeSwipePage
    │       └── RecipeCard (stack of 2)
    │           └── Motion animations
    │
    ├── Recipe Detail (/recipe/:id)
    │   └── RecipeDetailPage
    │       ├── ImageWithFallback
    │       ├── Ingredients List
    │       ├── Directions List
    │       └── IngredientModal (triggered by button)
    │           ├── IngredientMatchCard (one per ingredient)
    │           │   ├── AddIngredientButton
    │           │   └── Alternatives List
    │           └── ManualSearchModal (nested)
    │
    └── Cart Page (/cart)
        └── CartPage
            ├── Recipe Groups
            └── AddIngredientButton (quantity controls)
```

### State Management Strategy

**Local Component State (useState):**
- UI state (modals open/closed, selected items)
- Temporary form inputs
- Loading states

**Custom Hooks (Shared State):**
- `useCart`: Cart items with localStorage sync
- `useMatchHistory`: Match caching with localStorage
- `useRecipes`: Recipe data fetching
- `useProducts`: Product data fetching

**Event-Driven Updates:**
- Custom events for cross-component communication
- Example: `cartUpdated` event triggers cart badge update

**Persistence Layer:**
- localStorage for cart and match history
- Automatic sync on state changes
- Rehydration on app load

## Backend Architecture

### API Routes (Serverless Functions)

**POST /api/match**
- **Purpose**: AI-powered ingredient matching
- **Process**:
  1. Pre-filter products using text matching
  2. Send top 20 candidates to OpenAI
  3. Receive structured JSON response
  4. Return best match + alternatives
- **Caching**: Results cached client-side

**GET /api/recipes**
- **Purpose**: Fetch recipe data
- **Process**: Read from `data/Recipes.json`
- **Caching**: Browser HTTP cache

**GET /api/products**
- **Purpose**: Fetch product catalog
- **Process**: Read from `data/Products Data.json`
- **Caching**: Browser HTTP cache

### Pre-filtering Algorithm

**Purpose**: Reduce OpenAI API costs by filtering products before AI matching

**Scoring System** (5 levels):
```
Score 5: Exact full string match
  ↓ ingredient === product name
Score 4: Phrase match
  ↓ product name contains ingredient
Score 3: Word boundary match
  ↓ exact word found in product name
Score 2: Partial token match
  ↓ ingredient token substring in product
Score 1: No match (filtered out)
```

**Example:**
```
Ingredient: "scallions"
Products:
  "Green Onion 1 bunch"      → Score 0 (no match) ❌
  "Scallions Fresh 3pc"      → Score 5 (exact)    ✅
  "Fresh Scallion Bunch"     → Score 4 (phrase)   ✅
```

**Optimization**:
- Only send products with score ≥ 2 to AI
- Maximum 20 candidates per request
- Reduces API costs by ~90%

### AI Matching Process

**OpenAI Configuration:**
- Model: `gpt-4o-mini`
- Temperature: 0.2 (low variance)
- Response format: JSON object (structured output)

**System Prompt Strategy:**
```
You are a grocery shopping assistant matching recipe ingredients to products.
Return:
- Best match with confidence score (0-100)
- Up to 5 alternatives (confidence ≥ 60)
- Reasoning for each match
Prefer fresh/raw ingredients over processed.
```

**Confidence Scoring:**
- High (80-100): Perfect or near-perfect match
- Medium (60-79): Good match, minor differences
- Low (<60): Filtered out, not returned

**Fallback Logic:**
1. If AI returns low confidence → use pre-filter best result
2. If AI fails → return top 3 pre-filter results as alternatives
3. If no candidates → return 404 error

## Data Architecture

### Database-Free Design

The application uses a **database-free architecture**:
- **No SQL/NoSQL database**
- **Static JSON files** for recipe and product data
- **localStorage** for client-side persistence
- **No backend data storage**

**Why database-free?**
- ✅ Simpler deployment (no DB hosting)
- ✅ Faster development (no migrations)
- ✅ Serverless-friendly (stateless)
- ✅ Easy to update data (edit JSON)
- ⚠️ Limited scalability (suitable for MVP)

### Data Files

**data/Recipes.json** (18 recipes)
```json
[
  {
    "id": "1",
    "name": "Beef with Scallions",
    "image": "https://...",
    "difficulty": 2,
    "cookTime": "30 min",
    "servings": 4,
    "ingredients": [...],
    "directions": [...]
  }
]
```

**data/Products Data.json** (1000+ products)
```json
[
  {
    "id": "prod-123",
    "name": "Green Onion 1 bunch",
    "price": 0.69,
    "image": "https://...",
    "category": "veg"
  }
]
```

### localStorage Schema

**Cart Items:**
```javascript
localStorage.setItem('cartItems', JSON.stringify([
  {
    product: { id, name, price, image },
    quantity: 2,
    recipeId: "1",
    recipeName: "Beef with Scallions"
  }
]))
```

**Match History:**
```javascript
localStorage.setItem('ingredient_match_history', JSON.stringify([
  {
    ingredientName: "scallions",  // normalized (lowercase)
    productId: "prod-123",
    productName: "Green Onion 1 bunch",
    confidence: 95,
    reasoning: "...",
    timestamp: "2024-01-15T10:30:00Z",
    addedToCart: true,
    alternatives: [...]
  }
]))
```

## External Integrations

### OpenAI API

**Authentication:**
- API key via environment variable: `OPENAI_API_KEY`
- Configured in `/app/api/match/route.ts`

**Usage Pattern:**
```
Client → /api/match → Pre-filter products → OpenAI API → Response → Client
```

**Cost Optimization:**
- Pre-filtering reduces input tokens by ~90%
- Caching prevents duplicate API calls
- Low temperature (0.2) for consistency
- Structured output for reliability

**Error Handling:**
- Fallback to pre-filter results
- Retry logic for transient failures
- User-friendly error messages

### Weee! Integration

**Current State:**
- External link to checkout: `https://www.sayweee.com`
- Product data sourced from Weee! catalog (static JSON)
- No direct API integration

**Future Enhancement:**
- Could integrate Weee! API for real-time inventory
- Real checkout integration

## Performance Optimizations

### Client-Side

1. **Match History Caching**
   - Reduces API calls by ~70%
   - Instant results for repeated ingredients
   - localStorage persistence

2. **Image Lazy Loading**
   - Images load only when visible
   - Fallback images for broken URLs
   - Reduces initial page load

3. **Event-Driven Updates**
   - Minimize re-renders
   - Only update affected components
   - Custom events for cart badge

4. **Code Splitting**
   - Next.js automatic code splitting
   - Route-based chunking
   - Smaller initial bundle

### Server-Side

1. **Pre-filtering**
   - Reduces AI API calls by ~90%
   - Faster response times
   - Lower costs

2. **Serverless Functions**
   - Auto-scaling
   - Pay-per-execution
   - No server management

3. **Static Data Files**
   - No database queries
   - Instant reads
   - Edge caching possible

## Security Considerations

**API Key Protection:**
- `OPENAI_API_KEY` stored in environment variables
- Never exposed to client
- Server-side only

**Client-Side Data:**
- No sensitive data in localStorage
- Cart data is public (no authentication)
- No PII collected

**Input Validation:**
- API routes validate request payloads
- Type checking with TypeScript
- Sanitize user inputs

**CORS:**
- Next.js handles CORS automatically
- API routes only accept same-origin requests

## Scalability Considerations

**Current Limitations:**
- Static JSON data (not scalable to millions of products)
- localStorage limited to ~5-10MB
- No user authentication
- No real-time inventory

**Future Scalability:**
- Migrate to database (PostgreSQL, MongoDB)
- Add Redis for match caching
- Implement user accounts
- Real-time inventory sync
- CDN for static assets

## Deployment Architecture

### Recommended: Vercel

```
GitHub Repository
       ↓
   Vercel Build
       ↓
   ┌─────────────────┐
   │  Edge Network   │
   │  (CDN)          │
   └─────────────────┘
       ↓
   ┌─────────────────┐
   │  Serverless     │
   │  Functions      │
   │  (API Routes)   │
   └─────────────────┘
       ↓
   OpenAI API
```

**Deployment Process:**
1. Push to GitHub
2. Vercel auto-builds
3. Serverless functions deployed
4. Static assets to CDN
5. Environment variables configured

**Benefits:**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Serverless scaling
- Preview deployments

## Technology Choices & Rationale

| Technology | Why Chosen |
|------------|------------|
| Next.js 14 | Modern React framework, App Router, API routes, serverless |
| TypeScript | Type safety, better DX, fewer bugs |
| Tailwind CSS | Rapid UI development, consistent design, small bundle |
| Radix UI | Accessible primitives, headless components |
| OpenAI API | Best-in-class AI for semantic matching |
| localStorage | Simple persistence, no auth needed |
| JSON files | MVP simplicity, easy to update |
| Vercel | Best Next.js hosting, zero-config |

## Future Architecture Enhancements

1. **Add Database**
   - PostgreSQL for products/recipes
   - Redis for match caching
   - User accounts and preferences

2. **Real-time Features**
   - WebSocket for live inventory
   - Real-time cart sync across devices

3. **Microservices**
   - Separate matching service
   - Product catalog service
   - User service

4. **Analytics**
   - Track match quality
   - A/B testing for matching algorithms
   - User behavior analytics

5. **CDN & Caching**
   - Cloudflare for static assets
   - API response caching
   - Edge computing for matching
