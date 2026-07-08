import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  GridSize,
  Difficulty,
  calculateMultiplier,
  generateClientSeed,
  getDifficultyMines,
  calculateTax,
  generateIdempotencyKey,
} from '@/lib/minesEngine';

export interface MinesSettings {
  id: string;
  enabled: boolean;
  rtp_target: number;
  min_bet: number;
  max_bet: number;
  max_mines_3x3: number;
  max_mines_5x5: number;
  max_mines_7x7: number;
  profit_cap_per_round: number;
  tax_percent: number;
  tax_method: 'profit' | 'total';
  vip_instant_level: number;
  allow_3x3: boolean;
  allow_5x5: boolean;
  allow_7x7: boolean;
}

export interface MinesGameState {
  roundId: string | null;
  gridSize: GridSize;
  mineCount: number;
  minePositions: number[];
  revealedPositions: number[];
  pickedTilesSequence: number[];
  betAmount: number;
  currentMultiplier: number;
  potentialWin: number;
  status: 'betting' | 'active' | 'won' | 'lost' | 'cashed_out';
  difficulty: Difficulty;
  autoCashout: number | null;
  animationSpeed: number;
  autoPickEnabled: boolean;
  seedHash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  taxAmount: number;
  netAmount: number;
  balance: number;
  safePicks: number;
}

const initialState: MinesGameState = {
  roundId: null,
  gridSize: 25,
  mineCount: 5,
  minePositions: [],
  revealedPositions: [],
  pickedTilesSequence: [],
  betAmount: 10,
  currentMultiplier: 1.00,
  potentialWin: 0,
  status: 'betting',
  difficulty: 'medium',
  autoCashout: null,
  animationSpeed: 1,
  autoPickEnabled: false,
  seedHash: '',
  serverSeed: '',
  clientSeed: '',
  nonce: 1,
  taxAmount: 0,
  netAmount: 0,
  balance: 0,
  safePicks: 0,
};

export const useMinesGame = () => {
  const [state, setState] = useState<MinesGameState>(initialState);
  const [settings, setSettings] = useState<MinesSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userVipLevel, setUserVipLevel] = useState(1);
  const [pendingPicks, setPendingPicks] = useState<Set<number>>(new Set());

  // Fetch settings, user, and initialize client seed
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      if (user) {
        // Fetch user's VIP level and balance
        const [profileResult, walletResult, nonceResult] = await Promise.all([
          supabase.from('profiles').select('vip_level').eq('user_id', user.id).single(),
          supabase.from('wallets').select('balance').eq('user_id', user.id).single(),
          supabase.from('user_mines_nonce').select('current_nonce').eq('user_id', user.id).single()
        ]);

        if (profileResult.data) {
          setUserVipLevel(profileResult.data.vip_level || 1);
        }

        if (walletResult.data) {
          setState(prev => ({ ...prev, balance: walletResult.data.balance }));
        }

        // Initialize or get nonce
        let currentNonce = 1;
        if (nonceResult.data) {
          currentNonce = nonceResult.data.current_nonce;
        }

        // Initialize client seed
        const storedClientSeed = localStorage.getItem(`mines_client_seed_${user.id}`);
        const clientSeed = storedClientSeed || generateClientSeed();
        if (!storedClientSeed) {
          localStorage.setItem(`mines_client_seed_${user.id}`, clientSeed);
        }

        setState(prev => ({ 
          ...prev, 
          clientSeed,
          nonce: currentNonce
        }));
      }

      const { data: settingsData } = await supabase
        .from('mines_settings')
        .select('*')
        .single();
      
      if (settingsData) {
        setSettings(settingsData as MinesSettings);
      }
    };
    fetchData();
  }, []);

  // Update mine count when difficulty or grid size changes
  useEffect(() => {
    if (state.status === 'betting') {
      const defaultMines = getDifficultyMines(state.gridSize, state.difficulty);
      setState(prev => ({ ...prev, mineCount: defaultMines }));
    }
  }, [state.gridSize, state.difficulty, state.status]);

  // Check if grid size is allowed
  const isGridAllowed = (size: GridSize): boolean => {
    if (!settings) return true;
    switch (size) {
      case 9: return settings.allow_3x3;
      case 25: return settings.allow_5x5;
      case 49: return settings.allow_7x7;
      default: return true;
    }
  };

  // Get max mines for current grid from settings
  const getMaxMinesForGrid = (size: GridSize): number => {
    if (!settings) return size - 1;
    switch (size) {
      case 9: return settings.max_mines_3x3;
      case 25: return settings.max_mines_5x5;
      case 49: return settings.max_mines_7x7;
      default: return size - 1;
    }
  };

  // Start a new game via backend
  const startGame = useCallback(async () => {
    if (!userId) {
      toast.error('Please login to play');
      return;
    }

    if (!settings?.enabled) {
      toast.error('Mines game is currently disabled');
      return;
    }

    if (!isGridAllowed(state.gridSize)) {
      toast.error('This grid size is not currently available');
      return;
    }

    if (state.betAmount < settings.min_bet) {
      toast.error(`Minimum bet is ৳${settings.min_bet}`);
      return;
    }

    if (state.betAmount > settings.max_bet) {
      toast.error(`Maximum bet is ৳${settings.max_bet}`);
      return;
    }

    if (state.betAmount > state.balance) {
      toast.error('Insufficient balance');
      return;
    }

    const maxMines = getMaxMinesForGrid(state.gridSize);
    if (state.mineCount > maxMines) {
      toast.error(`Maximum ${maxMines} mines for this grid`);
      return;
    }

    setIsLoading(true);

    try {
      const idempotencyKey = generateIdempotencyKey();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Session expired. Please login again.');
        setIsLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('mines-start', {
        body: {
          gridSize: state.gridSize,
          mineCount: state.mineCount,
          betAmount: state.betAmount,
          difficulty: state.difficulty,
          clientSeed: state.clientSeed,
          autoCashout: state.autoCashout,
          idempotencyKey,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to start game');
      }

      const data = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      setState(prev => ({
        ...prev,
        roundId: data.roundId,
        minePositions: [], // Hidden until game ends
        revealedPositions: [],
        pickedTilesSequence: [],
        currentMultiplier: 1.00,
        potentialWin: 0,
        status: 'active',
        seedHash: data.seedHash,
        serverSeed: '',
        nonce: data.nonce,
        taxAmount: 0,
        netAmount: 0,
        balance: data.newBalance,
        safePicks: 0,
      }));

      toast.success('Game started! Good luck! 🎰');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, [state, userId, settings]);

  // Reveal a tile via backend
  const revealTile = useCallback(async (position: number) => {
    if (state.status !== 'active' || state.revealedPositions.includes(position)) {
      return;
    }

    // Prevent double picks
    if (pendingPicks.has(position)) {
      return;
    }

    setPendingPicks(prev => new Set(prev).add(position));

    try {
      const response = await supabase.functions.invoke('mines-pick', {
        body: {
          roundId: state.roundId,
          position,
          pickKey: `${state.roundId}_${position}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to pick tile');
      }

      const data = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.duplicate) {
        // Already processed
        return;
      }

      const newRevealed = [...state.revealedPositions, position];
      const newSequence = [...state.pickedTilesSequence, position];

      if (data.isMine) {
        // Game over
        setState(prev => ({
          ...prev,
          revealedPositions: newRevealed,
          pickedTilesSequence: newSequence,
          minePositions: data.minePositions || [],
          serverSeed: data.serverSeed || '',
          status: 'lost',
          potentialWin: 0,
          taxAmount: 0,
          netAmount: 0,
        }));

        toast.error('💥 BOOM! You hit a mine!');
        return;
      }

      // Check if game ended (auto-win or auto-cashout)
      if (data.status === 'won' || data.status === 'cashed_out') {
        setState(prev => ({
          ...prev,
          revealedPositions: newRevealed,
          pickedTilesSequence: newSequence,
          minePositions: data.minePositions || [],
          serverSeed: data.serverSeed || '',
          status: data.status,
          currentMultiplier: data.currentMultiplier,
          potentialWin: data.grossWin,
          taxAmount: data.taxAmount,
          netAmount: data.netAmount,
          balance: data.newBalance ?? prev.balance,
          safePicks: data.safePicks ?? prev.safePicks + 1,
        }));

        if (data.status === 'won') {
          toast.success(`🎉 YOU WON! All gems found! +৳${data.netAmount.toFixed(2)}`);
        } else {
          toast.success(`💰 Auto-cashed out ৳${data.netAmount.toFixed(2)} at ${data.currentMultiplier.toFixed(2)}x!`);
        }
        return;
      }

      // Game continues
      setState(prev => ({
        ...prev,
        revealedPositions: newRevealed,
        pickedTilesSequence: newSequence,
        currentMultiplier: data.currentMultiplier,
        potentialWin: data.grossWin,
        taxAmount: data.taxAmount,
        netAmount: data.netAmount,
        safePicks: data.safePicks ?? prev.safePicks + 1,
      }));

    } catch (error: any) {
      toast.error(error.message || 'Failed to reveal tile');
    } finally {
      setPendingPicks(prev => {
        const next = new Set(prev);
        next.delete(position);
        return next;
      });
    }
  }, [state, pendingPicks]);

  // Cashout via backend
  const cashout = useCallback(async () => {
    if (state.status !== 'active') {
      // Silently ignore if already ended
      console.log('Cashout ignored - round not active:', state.status);
      return;
    }

    if (state.revealedPositions.length === 0) {
      toast.error('Reveal at least one tile before cashing out');
      return;
    }

    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('mines-cashout', {
        body: {
          roundId: state.roundId,
          cashoutKey: `${state.roundId}_cashout`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to cashout');
      }

      const data = response.data;

      // Handle duplicate/already processed cashout gracefully
      if (data.duplicate) {
        setState(prev => ({
          ...prev,
          status: data.status || 'cashed_out',
          netAmount: data.netAmount || prev.netAmount,
          minePositions: data.minePositions || prev.minePositions,
          serverSeed: data.serverSeed || prev.serverSeed,
        }));
        return;
      }

      // Handle "round not active" error gracefully (race condition)
      if (data.error === 'Round is not active') {
        console.log('Round already ended, ignoring cashout error');
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setState(prev => ({
        ...prev,
        status: 'cashed_out',
        potentialWin: data.grossWin,
        taxAmount: data.taxAmount,
        netAmount: data.netAmount,
        balance: data.newBalance,
        minePositions: data.minePositions || [],
        serverSeed: data.serverSeed || '',
      }));

      // Build success message with streak info
      let successMsg = `💰 Cashed out ৳${data.netAmount.toFixed(2)} at ${state.currentMultiplier.toFixed(2)}x`;
      if (data.streakBonusAmount && data.streakBonusAmount > 0) {
        successMsg += ` (+${Math.round((data.streakBonusMultiplier - 1) * 100)}% streak bonus!)`;
      }
      successMsg += ` (Tax: ৳${data.taxAmount.toFixed(2)})`;
      
      toast.success(successMsg);

    } catch (error: any) {
      toast.error(error.message || 'Failed to cashout');
    } finally {
      setIsLoading(false);
    }
  }, [state]);

  // Auto pick random safe tile (client-side guess, server validates)
  const autoPick = useCallback(() => {
    if (state.status !== 'active') return;

    const availableTiles = Array.from({ length: state.gridSize }, (_, i) => i)
      .filter(i => !state.revealedPositions.includes(i));

    if (availableTiles.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableTiles.length);
    revealTile(availableTiles[randomIndex]);
  }, [state, revealTile]);

  // Reset game
  const resetGame = useCallback(async () => {
    // Refresh balance
    if (userId) {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const { data: nonceData } = await supabase
        .from('user_mines_nonce')
        .select('current_nonce')
        .eq('user_id', userId)
        .single();

      setState(prev => ({
        ...initialState,
        gridSize: prev.gridSize,
        mineCount: prev.mineCount,
        betAmount: prev.betAmount,
        difficulty: prev.difficulty,
        autoCashout: prev.autoCashout,
        animationSpeed: prev.animationSpeed,
        autoPickEnabled: prev.autoPickEnabled,
        clientSeed: prev.clientSeed,
        nonce: nonceData?.current_nonce || prev.nonce + 1,
        balance: wallet?.balance || prev.balance,
      }));
    } else {
      setState(prev => ({
        ...initialState,
        gridSize: prev.gridSize,
        mineCount: prev.mineCount,
        betAmount: prev.betAmount,
        difficulty: prev.difficulty,
        autoCashout: prev.autoCashout,
        animationSpeed: prev.animationSpeed,
        autoPickEnabled: prev.autoPickEnabled,
        clientSeed: prev.clientSeed,
        nonce: prev.nonce + 1,
      }));
    }
  }, [userId]);

  // Update client seed
  const updateClientSeed = useCallback((newSeed: string) => {
    if (state.status !== 'betting') {
      toast.error('Cannot change seed during active game');
      return;
    }
    if (userId) {
      localStorage.setItem(`mines_client_seed_${userId}`, newSeed);
    }
    setState(prev => ({ ...prev, clientSeed: newSeed }));
    toast.success('Client seed updated');
  }, [state.status, userId]);

  // Setters
  const setGridSize = (size: GridSize) => {
    if (state.status === 'betting' && isGridAllowed(size)) {
      setState(prev => ({ ...prev, gridSize: size }));
    }
  };

  const setMineCount = (count: number) => {
    if (state.status === 'betting') {
      const maxMines = getMaxMinesForGrid(state.gridSize);
      setState(prev => ({ ...prev, mineCount: Math.min(count, maxMines) }));
    }
  };

  const setBetAmount = (amount: number) => {
    if (state.status === 'betting') {
      setState(prev => ({ ...prev, betAmount: amount }));
    }
  };

  const setDifficulty = (difficulty: Difficulty) => {
    if (state.status === 'betting') {
      setState(prev => ({ ...prev, difficulty }));
    }
  };

  const setAutoCashout = (value: number | null) => {
    setState(prev => ({ ...prev, autoCashout: value }));
  };

  const setAnimationSpeed = (speed: number) => {
    setState(prev => ({ ...prev, animationSpeed: speed }));
  };

  const setAutoPickEnabled = (enabled: boolean) => {
    setState(prev => ({ ...prev, autoPickEnabled: enabled }));
  };

  // Check if VIP instant mode is available
  const canUseInstantMode = userVipLevel >= (settings?.vip_instant_level || 5);

  return {
    state,
    settings,
    isLoading,
    pendingPicks,
    userVipLevel,
    canUseInstantMode,
    startGame,
    revealTile,
    cashout,
    autoPick,
    resetGame,
    setGridSize,
    setMineCount,
    setBetAmount,
    setDifficulty,
    setAutoCashout,
    setAnimationSpeed,
    setAutoPickEnabled,
    updateClientSeed,
    isGridAllowed,
  };
};
