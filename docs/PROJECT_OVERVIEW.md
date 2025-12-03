# Recipe Shopping Assistant - Project Overview

## What is Recipe Shopping Assistant?

Recipe Shopping Assistant is a modern web application that helps users discover Asian recipes and automatically match recipe ingredients to products from Weee! (an Asian grocery delivery service). The app uses AI-powered matching to suggest the best products for each ingredient, creating a seamless shopping experience from recipe discovery to checkout.

## Key Features

- **🍜 Swipe-based Recipe Browsing**: Tinder-style interface for discovering new recipes
- **🤖 AI-Powered Product Matching**: Intelligent ingredient-to-product matching using OpenAI GPT-4o-mini
- **💾 Smart Caching**: Match history system to avoid redundant API calls
- **🛒 Shopping Cart**: Persistent cart with recipe grouping and quantity management
- **🔍 Manual Search Fallback**: Search all products manually if AI match isn't perfect
- **🎨 Dark/Light Theme**: Toggle between themes with system preference detection
- **📱 Mobile-First Design**: Responsive design optimized for all devices

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (shadcn/ui)
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes (serverless functions)
- **AI**: OpenAI API (GPT-4o-mini model)
- **Data Storage**: JSON files + localStorage (no database)

### State Management
- React Hooks (useState, useEffect, useCallback)
- Custom hooks for cart, recipes, products, and match history
- localStorage for persistence

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
cd "/Users/charlenelin/Desktop/Repepe/Recipe Shopping Assistant"
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
OPENAI_API_KEY=sk-your-api-key-here
```

4. Start development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
Recipe Shopping Assistant/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (match, recipes, products)
│   ├── cart/              # Cart page
│   ├── recipe/[id]/       # Recipe detail page
│   └── page.tsx           # Home page (swipe interface)
├── src/
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript interfaces
│   └── api/               # Client-side API utilities
├── data/                  # JSON data files
│   ├── Recipes.json
│   └── Products Data.json
├── docs/                  # Documentation
└── public/                # Static assets
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI matching | Yes |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Browser Support

- Modern browsers with ES6+ support
- localStorage required
- Touch events for mobile gestures
- Optional: Navigator.vibrate for haptic feedback

## Key Concepts

### Recipe Discovery Flow
1. User swipes through recipe cards
2. Swipe right to view recipe details
3. Click "Add Ingredients to Cart"
4. AI matches each ingredient to products
5. Add matched products to cart
6. Checkout on Weee!

### AI Matching Process
1. **Pre-filtering**: Text-based scoring filters products (20 candidates max)
2. **AI Ranking**: OpenAI GPT-4o-mini ranks candidates with confidence scores
3. **Caching**: Results saved to match history to avoid duplicate API calls
4. **Fallback**: Manual search if AI can't find good matches

### Data Persistence
- **Cart**: Persisted in localStorage, survives page reloads
- **Match History**: Cached in localStorage, reused across recipes
- **Theme Preference**: Saved using next-themes

## Learn More

- [Architecture Documentation](./ARCHITECTURE.md)
- [Component Reference](./COMPONENTS.md)
- [API Reference](./API_REFERENCE.md)
- [Feature Documentation](./FEATURES.md)
- [Development Guide](./DEVELOPMENT.md)

## Deployment

### Recommended Platform: Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Add `OPENAI_API_KEY` environment variable
4. Deploy

The app is optimized for Vercel's serverless platform.

## License

This project is for educational/portfolio purposes.

## Contact

For questions or feedback, please contact the development team.
