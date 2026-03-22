import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onInventory?: () => void;
  onQuests?: () => void;
  onPause?: () => void;
  onStart?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onInventory,
  onQuests,
  onPause,
  onStart,
  enabled = true,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'i' && onInventory) {
        e.preventDefault();
        onInventory();
      }

      if (key === 'q' && onQuests) {
        e.preventDefault();
        onQuests();
      }

      if (key === 'escape' && onPause) {
        e.preventDefault();
        onPause();
      }

      if ((key === 'enter' || key === ' ') && onStart) {
        e.preventDefault();
        onStart();
      }

      if (key === '1' || key === '2' || key === '3') {
        if (onStart) {
          e.preventDefault();
          onStart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onInventory, onQuests, onPause, onStart]);
}
