'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Switch } from './ui/switch';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed top-6 right-20 z-50 flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
        <div className="w-16 h-6" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="fixed top-6 right-20 z-50 flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg transition-colors">
      <Sun className="h-4 w-4 text-orange-500 transition-opacity" style={{ opacity: isDark ? 0.5 : 1 }} />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        aria-label="Toggle dark mode"
      />
      <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400 transition-opacity" style={{ opacity: isDark ? 1 : 0.5 }} />
    </div>
  );
}
