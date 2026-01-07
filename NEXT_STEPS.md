# Next Steps After Migration

## ✅ Migration Complete!

Your project has been successfully migrated from Vite + React to Next.js 14. Here's what to do next:

## 1. Set Up OpenAI API Key

1. Get your API key from: https://platform.openai.com/api-keys
2. Create `.env.local` file in the root directory:
   ```bash
   OPENAI_API_KEY=sk-your-api-key-here
   ```
3. The API route is already set up at `/app/api/match/route.ts`

## 2. Test the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and test:
- ✅ Recipe swipe page loads
- ✅ Recipe detail page works
- ✅ Cart functionality
- ✅ API endpoint (once you have OpenAI key)

## 3. Implement Feedback Interface

You mentioned needing a feedback interface for confirming/rejecting matches. You can:

1. Add feedback buttons to `IngredientModal.tsx`:
   - "Confirm Match" button
   - "Reject Match" button
2. Store feedback in state or localStorage
3. Optionally send feedback to API for learning

## 4. Expand Data

As planned:
- Add 5-10 recipes to `src/data/mockData.ts`
- Add 50-100 Weee! products
- Ensure products link to ingredients via `ingredientId`

## 5. Test OpenAI Integration

Once you have your API key:

1. Test the `/api/match` endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/match \
     -H "Content-Type: application/json" \
     -d '{
       "ingredient": {
         "id": "1-1",
         "name": "Chicken breast",
         "amount": "1 lb"
       },
       "products": [...]
     }'
   ```

2. Integrate the API call into `IngredientModal.tsx` or create a new component

## 6. Deploy to Production

When ready, deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Key Files to Review

- `app/api/match/route.ts` - OpenAI API integration
- `app/hooks/useCart.ts` - Cart state management
- `src/components/IngredientModal.tsx` - Where to add feedback UI
- `src/data/mockData.ts` - Where to expand recipe/product data

## Troubleshooting

### If you see "Module not found" errors:
- Make sure all imports use `@/` alias (e.g., `@/src/components/...`)
- Check `tsconfig.json` has the correct paths

### If OpenAI API fails:
- Verify `.env.local` exists and has `OPENAI_API_KEY`
- Restart the dev server after adding env vars
- Check API key is valid at https://platform.openai.com/api-keys

### If cart doesn't persist:
- Check browser localStorage is enabled
- Verify `useCart` hook is being used correctly

## Need Help?

- Check `MIGRATION.md` for migration details
- Review `README.md` for setup instructions
- Check Next.js docs: https://nextjs.org/docs











