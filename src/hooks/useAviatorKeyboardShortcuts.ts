import { useEffect, useCallback } from 'react';

interface KeyboardShortcutHandlers {
  onPlaceBet1: () => void;
  onPlaceBet2: () => void;
  onCashout1: () => void;
  onCashout2: () => void;
  onCancel1: () => void;
  onCancel2: () => void;
  onIncreaseStake1: () => void;
  onDecreaseStake1: () => void;
  onIncreaseStake2: () => void;
  onDecreaseStake2: () => void;
  canPlaceBet1: boolean;
  canPlaceBet2: boolean;
  canCashout1: boolean;
  canCashout2: boolean;
  canCancel1: boolean;
  canCancel2: boolean;
}

export const useAviatorKeyboardShortcuts = (handlers: KeyboardShortcutHandlers) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input field
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement)?.isContentEditable
    ) {
      return;
    }

    switch (event.code) {
      // Enter - Place bet on panel 1
      case 'Enter':
        event.preventDefault();
        if (handlers.canPlaceBet1) {
          handlers.onPlaceBet1();
        } else if (handlers.canCancel1) {
          handlers.onCancel1();
        }
        break;

      // Space - Cashout panel 1
      case 'Space':
        event.preventDefault();
        if (handlers.canCashout1) {
          handlers.onCashout1();
        }
        break;

      // Shift + Enter - Place bet on panel 2
      case 'NumpadEnter':
        event.preventDefault();
        if (handlers.canPlaceBet2) {
          handlers.onPlaceBet2();
        } else if (handlers.canCancel2) {
          handlers.onCancel2();
        }
        break;

      // C key - Cashout panel 2
      case 'KeyC':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          if (handlers.canCashout2) {
            handlers.onCashout2();
          }
        }
        break;

      // Arrow Up - Increase stake panel 1
      case 'ArrowUp':
        event.preventDefault();
        handlers.onIncreaseStake1();
        break;

      // Arrow Down - Decrease stake panel 1
      case 'ArrowDown':
        event.preventDefault();
        handlers.onDecreaseStake1();
        break;

      // Shift + Arrow Up - Increase stake panel 2
      case 'BracketRight':
        event.preventDefault();
        handlers.onIncreaseStake2();
        break;

      // Shift + Arrow Down - Decrease stake panel 2
      case 'BracketLeft':
        event.preventDefault();
        handlers.onDecreaseStake2();
        break;

      // Q - Quick double stake panel 1
      case 'KeyQ':
        event.preventDefault();
        handlers.onIncreaseStake1();
        handlers.onIncreaseStake1();
        break;

      // W - Quick halve stake panel 1
      case 'KeyW':
        event.preventDefault();
        handlers.onDecreaseStake1();
        handlers.onDecreaseStake1();
        break;
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Shortcut hints for UI display
export const AVIATOR_SHORTCUTS = [
  { key: 'Enter', action: 'Place Bet / Cancel (Panel 1)' },
  { key: 'Space', action: 'Cashout (Panel 1)' },
  { key: 'NumEnter', action: 'Place Bet / Cancel (Panel 2)' },
  { key: 'C', action: 'Cashout (Panel 2)' },
  { key: '↑ / ↓', action: 'Adjust Stake (Panel 1)' },
  { key: '[ / ]', action: 'Adjust Stake (Panel 2)' },
];
