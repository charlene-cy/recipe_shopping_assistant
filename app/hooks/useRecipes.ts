import { useEffect, useState } from 'react';
import { Recipe } from '@/src/types';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchRecipes() {
      try {
        setLoading(true);
        const response = await fetch('/api/recipes');

        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }

        const data = await response.json();
        if (!isMounted) return;

        setRecipes(Array.isArray(data.recipes) ? data.recipes : []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching recipes:', err);
        if (!isMounted) return;
        setError(err.message || 'Failed to load recipes');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    fetchRecipes();

    return () => {
      isMounted = false;
    };
  }, []);

  return { recipes, loading, error };
}
