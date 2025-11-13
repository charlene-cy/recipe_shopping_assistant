# Recipe Shopping Assistant

This is a Recipe Shopping Assistant built with Next.js 14. The original project design is available at https://www.figma.com/design/7wJTIGjZntQglXwVx6wBbR/Recipe-Shopping-Assistant.

## Features

- 🍳 Recipe browsing with swipe interface
- 📝 Recipe details with ingredients and directions
- 🛒 Shopping cart with Weee! product matching
- 🤖 OpenAI integration for ingredient matching
- 💾 Cart persistence with localStorage

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── match/         # OpenAI ingredient matching
│   ├── cart/              # Shopping cart page
│   ├── recipe/[id]/       # Recipe detail page
│   ├── hooks/             # Custom hooks
│   └── components/        # App-level components
├── src/
│   ├── components/        # React components
│   ├── data/              # Mock data
│   └── types/             # TypeScript types
└── ...
```

## Migration

This project was migrated from Vite + React to Next.js 14. See `MIGRATION.md` for details.

## API Endpoints

### POST `/api/match`

Matches a recipe ingredient with Weee! products using OpenAI.

**Request:**
```json
{
  "ingredient": {
    "id": "1-1",
    "name": "Chicken breast",
    "amount": "1 lb"
  },
  "products": [
    {
      "id": "p1-1",
      "name": "Organic Chicken Breast (1 lb)",
      "price": 7.99,
      "image": "...",
      "ingredientId": "1-1"
    }
  ]
}
```

**Response:**
```json
{
  "ingredient": "Chicken breast",
  "matchedProducts": [...],
  "reasoning": "The product matches because...",
  "confidence": "high"
}
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **AI**: OpenAI GPT-4o-mini
- **Animations**: Motion (Framer Motion)
- **State Management**: React Hooks + localStorage
# recipe_shopping_assistant
