# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- npm or yarn
- Git
- Code editor (VS Code recommended)
- OpenAI API key ([Get one](https://platform.openai.com/api-keys))

### Initial Setup

1. **Navigate to project directory:**
```bash
cd "/Users/charlenelin/Desktop/Repepe/Recipe Shopping Assistant"
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp .env.example .env.local
```

4. **Add your OpenAI API key to `.env.local`:**
```
OPENAI_API_KEY=sk-your-api-key-here
```

5. **Start development server:**
```bash
npm run dev
```

6. **Open browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
Recipe Shopping Assistant/
├── app/                        # Next.js App Router
│   ├── api/                   # API routes (serverless functions)
│   │   ├── match/route.ts    # AI matching endpoint
│   │   ├── products/route.ts # Products data endpoint
│   │   └── recipes/route.ts  # Recipes data endpoint
│   ├── cart/                  # Cart page route
│   │   └── page.tsx
│   ├── recipe/[id]/           # Dynamic recipe detail route
│   │   └── page.tsx
│   ├── components/            # App-level components
│   │   └── CartButton.tsx
│   ├── hooks/                 # App-level hooks
│   │   ├── useCart.ts
│   │   ├── useProducts.ts
│   │   └── useRecipes.ts
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles

├── src/
│   ├── api/                   # Client-side API utilities
│   │   └── matchApi.ts
│   ├── components/            # React components
│   │   ├── RecipeSwipePage.tsx
│   │   ├── RecipeDetailPage.tsx
│   │   ├── IngredientModal.tsx
│   │   ├── CartPage.tsx
│   │   ├── figma/             # Figma-exported components
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   │   └── useMatchHistory.ts
│   ├── types/                 # TypeScript definitions
│   │   └── index.ts
│   └── data/                  # Mock data (legacy)
│       └── mockData.ts

├── data/                      # JSON data files
│   ├── Recipes.json
│   └── Products Data.json

├── docs/                      # Documentation
├── public/                    # Static assets
├── .env.local                 # Environment variables (not in git)
├── .gitignore
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

---

## Development Workflow

### 1. Running the App

**Development mode (hot reload):**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

**Linting:**
```bash
npm run lint
```

### 2. Making Changes

**Component development:**
1. Create/edit component in `/src/components`
2. Import and use in page component
3. Hot reload shows changes instantly

**API development:**
1. Create/edit route in `/app/api`
2. Export POST or GET handler
3. Test with curl or browser

**Styling:**
1. Use Tailwind utility classes
2. Update `globals.css` for custom styles
3. Use `cn()` utility for conditional classes

### 3. Adding a New Feature

**Example: Add a "Favorites" feature**

1. **Create type definition:**
```typescript
// src/types/index.ts
export interface Favorite {
  recipeId: string;
  timestamp: string;
}
```

2. **Create custom hook:**
```typescript
// src/hooks/useFavorites.ts
export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('favorites');
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  const addFavorite = (recipeId: string) => {
    // Implementation
  };

  return { favorites, addFavorite };
}
```

3. **Create component:**
```typescript
// src/components/FavoriteButton.tsx
export function FavoriteButton({ recipeId }: { recipeId: string }) {
  const { favorites, addFavorite } = useFavorites();
  // Implementation
}
```

4. **Use in page:**
```typescript
// app/recipe/[id]/page.tsx
import { FavoriteButton } from '@/src/components/FavoriteButton';

<FavoriteButton recipeId={recipe.id} />
```

---

## Code Standards

### TypeScript

**Always define types:**
```typescript
// ✅ Good
interface Props {
  name: string;
  onSelect: (id: string) => void;
}

// ❌ Bad
const MyComponent = ({ name, onSelect }: any) => {
  // ...
};
```

**Use type inference:**
```typescript
// ✅ Good
const count = useState(0);  // TypeScript infers number

// ❌ Bad
const count = useState<number>(0);  // Redundant
```

### React Components

**Functional components only:**
```typescript
// ✅ Good
export function MyComponent({ title }: { title: string }) {
  return <div>{title}</div>;
}

// ❌ Bad (class components)
export class MyComponent extends React.Component {
  // ...
}
```

**Use hooks properly:**
```typescript
// ✅ Good
const [count, setCount] = useState(0);

useEffect(() => {
  // Side effect
}, [dependencies]);

// ❌ Bad (hooks in conditions)
if (condition) {
  const [count, setCount] = useState(0);  // ERROR
}
```

### Styling

**Use Tailwind utilities:**
```typescript
// ✅ Good
<div className="flex items-center gap-4 p-6 bg-white rounded-xl">

// ❌ Bad (inline styles)
<div style={{ display: 'flex', padding: '24px' }}>
```

**Use cn() for conditional classes:**
```typescript
// ✅ Good
<div className={cn("base-class", isActive && "active-class")}>

// ❌ Bad
<div className={`base-class ${isActive ? 'active-class' : ''}`}>
```

### File Organization

**One component per file:**
```
✅ RecipeCard.tsx (one component)
❌ Components.tsx (multiple components)
```

**Co-locate related files:**
```
components/
├── RecipeCard.tsx
├── RecipeCardSkeleton.tsx
└── RecipeCardUtils.ts
```

---

## Testing

### Manual Testing Checklist

- [ ] Recipe swipe (left/right gestures)
- [ ] View recipe details
- [ ] AI matching (all ingredients)
- [ ] Add to cart
- [ ] Update quantities
- [ ] Manual search
- [ ] Alternative selection
- [ ] Cart page
- [ ] Clear cart
- [ ] Theme toggle (light/dark)
- [ ] Match history caching
- [ ] Secret developer feature (10 taps)
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Error states (network errors, no matches)

### Testing the Match API

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "ingredient": { "name": "scallions" },
    "products": [
      { "id": "1", "name": "Green Onion", "price": 0.69 }
    ]
  }'
```

**Using browser console:**
```javascript
const testMatch = async () => {
  const res = await fetch('/api/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredient: { name: 'scallions' },
      products: [{ id: '1', name: 'Green Onion', price: 0.69 }]
    })
  });
  console.log(await res.json());
};

testMatch();
```

---

## Debugging

### Common Issues

**1. "OpenAI API key is not configured" (503 error)**

**Solution:**
```bash
# Check .env.local exists
cat .env.local

# Add API key
echo "OPENAI_API_KEY=sk-your-key" >> .env.local

# Restart dev server
npm run dev
```

**2. "No matching products found" (404 error)**

**Cause:** Pre-filter scored all products as 0

**Solutions:**
- Check ingredient spelling
- Try more generic name (e.g., "onion" instead of "scallions")
- Add synonym mapping (see FEATURES.md)
- Use manual search

**3. Cart not updating after adding items**

**Cause:** `cartUpdated` event not firing

**Solution:**
```typescript
// Ensure event is dispatched after cart update
window.dispatchEvent(new CustomEvent('cartUpdated'));
```

**4. Match history not caching**

**Cause:** localStorage quota exceeded or disabled

**Solution:**
```javascript
// Check localStorage
console.log(localStorage.getItem('ingredient_match_history'));

// Clear if needed
localStorage.clear();
```

### Debug Logs

**Match API debugging:**
```typescript
// app/api/match/route.ts
console.log('[match] Ingredient:', ingredient.name);
console.log('[match] Pre-filter candidates:', candidates.length);
console.log('[match] OpenAI response:', aiResponse);
```

**Match history debugging:**
```typescript
// src/hooks/useMatchHistory.ts
console.log('[MatchHistory] Saving match:', ingredientName);
console.log('[MatchHistory] Cache hit:', !!cachedMatch);
```

**Cart debugging:**
```typescript
// app/hooks/useCart.ts
console.log('[Cart] Adding item:', product.name);
console.log('[Cart] Total items:', items.length);
```

---

## Performance Optimization

### Bundle Size

**Check bundle size:**
```bash
npm run build

# Output shows bundle sizes:
# ✓ Compiled successfully
# Route (app)          Size
# ┌ ○ /                123 kB
# ├ ○ /cart            45 kB
# └ ○ /recipe/[id]     67 kB
```

**Reduce bundle:**
- Use dynamic imports for heavy components
- Tree-shake unused libraries
- Minimize third-party dependencies

### API Optimization

**Match API costs:**
- Pre-filtering reduces costs by ~90%
- Each match: ~500-1000 tokens ($0.001-0.002)
- Caching prevents duplicate calls

**Optimize API calls:**
```typescript
// Parallel requests
const [recipes, products] = await Promise.all([
  fetch('/api/recipes'),
  fetch('/api/products')
]);

// Sequential requests (when dependent)
const recipes = await fetch('/api/recipes');
const products = await fetch('/api/products');
```

### localStorage Performance

**Avoid frequent writes:**
```typescript
// ❌ Bad (writes on every update)
setItems(newItems);
localStorage.setItem('cart', JSON.stringify(newItems));

// ✅ Good (batch updates)
useEffect(() => {
  localStorage.setItem('cart', JSON.stringify(items));
}, [items]);
```

---

## Deployment

### Deploying to Vercel

1. **Push code to GitHub:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Import project in Vercel:**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository

3. **Configure environment variables:**
- Add `OPENAI_API_KEY` in Vercel dashboard
- Settings → Environment Variables

4. **Deploy:**
- Vercel auto-deploys on push to main
- Preview deployments for pull requests

5. **Custom domain (optional):**
- Settings → Domains
- Add your custom domain
- Update DNS records

### Deploying to Other Platforms

**Netlify:**
```bash
npm run build
# Upload .next folder to Netlify
```

**AWS Amplify:**
```bash
# Connect GitHub repo
# Add build settings: npm run build
# Add OPENAI_API_KEY environment variable
```

**Self-hosted (Docker):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI matching | Yes | - |
| `NODE_ENV` | Environment (development/production) | No | development |
| `NEXT_PUBLIC_API_URL` | API base URL (future) | No | - |

**Loading environment variables:**
```typescript
// Server-side only (API routes)
const apiKey = process.env.OPENAI_API_KEY;

// Client-side (must prefix with NEXT_PUBLIC_)
const publicUrl = process.env.NEXT_PUBLIC_API_URL;
```

---

## Troubleshooting

### Build Errors

**TypeScript errors:**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix common issues:
# - Missing type definitions
# - Incorrect prop types
# - Unused variables
```

**ESLint errors:**
```bash
# Run linter
npm run lint

# Auto-fix
npm run lint -- --fix
```

### Runtime Errors

**Check console:**
```
F12 → Console → Look for errors
```

**Check network:**
```
F12 → Network → Check API calls
```

**Check localStorage:**
```javascript
// Browser console
console.log(localStorage);
localStorage.clear();  // Clear all data
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Vercel Deployment](https://vercel.com/docs)

---

## Contributing Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with descriptive message
6. Push to branch
7. Open Pull Request

**Commit message format:**
```
feat: add favorites feature
fix: resolve cart update bug
docs: update API reference
style: format code with prettier
refactor: simplify match algorithm
```
