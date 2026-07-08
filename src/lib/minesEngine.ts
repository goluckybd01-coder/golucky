// Mines Game Engine - Handles multiplier calculations and provably fair game logic

export type GridSize = 9 | 25 | 49;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface MinesGameState {
  gridSize: GridSize;
  mineCount: number;
  minePositions: number[];
  revealedPositions: number[];
  betAmount: number;
  currentMultiplier: number;
  status: 'betting' | 'active' | 'won' | 'lost' | 'cashed_out';
}

// Calculate multiplier based on revealed tiles with RTP factor
export const calculateMultiplier = (
  gridSize: GridSize,
  mineCount: number,
  revealedCount: number,
  rtpTarget: number = 95
): number => {
  if (revealedCount === 0) return 1.00;
  
  const totalTiles = gridSize;
  const safeTiles = totalTiles - mineCount;
  
  // Base probability calculation using combinatorics
  let probability = 1;
  for (let i = 0; i < revealedCount; i++) {
    probability *= (safeTiles - i) / (totalTiles - i);
  }
  
  // Apply RTP factor (e.g., 95% = 0.95)
  const rtpFactor = rtpTarget / 100;
  const multiplier = (1 / probability) * rtpFactor;
  
  return Math.max(1.01, Number(multiplier.toFixed(2)));
};

// Get next tile multiplier (what you'll get if you reveal one more safe tile)
export const getNextMultiplier = (
  gridSize: GridSize,
  mineCount: number,
  revealedCount: number,
  rtpTarget: number = 95
): number => {
  return calculateMultiplier(gridSize, mineCount, revealedCount + 1, rtpTarget);
};

// HMAC-based provably fair mine generation
export const generateMinePositionsProvablyFair = async (
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  gridSize: GridSize,
  mineCount: number
): Promise<number[]> => {
  // Create combined seed input
  const seedInput = `${serverSeed}:${clientSeed}:${nonce}`;
  
  // Generate HMAC-SHA256 hash
  const encoder = new TextEncoder();
  const keyData = encoder.encode(serverSeed);
  const messageData = encoder.encode(`${clientSeed}:${nonce}`);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Use hash to shuffle tile indices deterministically
  const positions = Array.from({ length: gridSize }, (_, i) => i);
  
  // Fisher-Yates shuffle using hash bytes for randomness
  for (let i = positions.length - 1; i > 0; i--) {
    // Use 4 hex chars (2 bytes) per random number for better distribution
    const hashIndex = (i * 4) % hashHex.length;
    const randomValue = parseInt(hashHex.slice(hashIndex, hashIndex + 4) || hashHex.slice(0, 4), 16);
    const j = randomValue % (i + 1);
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  // Return first mineCount positions as mine locations
  return positions.slice(0, mineCount).sort((a, b) => a - b);
};

// Legacy random mine generation (fallback)
export const generateMinePositions = (gridSize: GridSize, mineCount: number): number[] => {
  const positions: number[] = [];
  const allPositions = Array.from({ length: gridSize }, (_, i) => i);
  
  // Fisher-Yates shuffle for fair randomness
  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }
  
  return allPositions.slice(0, mineCount);
};

// Generate provably fair seed hash (SHA-256)
export const generateSeedHash = async (serverSeed: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(serverSeed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate server seed (32 random bytes)
export const generateServerSeed = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate client seed (16 random bytes)
export const generateClientSeed = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Get max mines allowed for grid size
export const getMaxMines = (gridSize: GridSize): number => {
  switch (gridSize) {
    case 9: return 8;
    case 25: return 24;
    case 49: return 48;
    default: return 24;
  }
};

// Get grid dimensions
export const getGridDimensions = (gridSize: GridSize): number => {
  switch (gridSize) {
    case 9: return 3;
    case 25: return 5;
    case 49: return 7;
    default: return 5;
  }
};

// Get difficulty mine presets
export const getDifficultyMines = (gridSize: GridSize, difficulty: Difficulty): number => {
  const maxMines = getMaxMines(gridSize);
  switch (difficulty) {
    case 'easy':
      return Math.max(1, Math.floor(maxMines * 0.2)); // 20% mines
    case 'medium':
      return Math.floor(maxMines * 0.4); // 40% mines
    case 'hard':
      return Math.floor(maxMines * 0.6); // 60% mines
    default:
      return Math.floor(maxMines * 0.4);
  }
};

// Calculate tax amount based on method
export const calculateTax = (
  grossWin: number,
  betAmount: number,
  taxPercent: number = 2,
  taxMethod: 'profit' | 'total' = 'profit'
): { taxAmount: number; netAmount: number } => {
  if (taxMethod === 'profit') {
    // Tax only on profit (grossWin - betAmount)
    const profit = Math.max(0, grossWin - betAmount);
    const taxAmount = Math.floor(profit * (taxPercent / 100) * 100) / 100;
    const netAmount = Math.floor((grossWin - taxAmount) * 100) / 100;
    return { taxAmount, netAmount };
  } else {
    // Tax on total payout
    const taxAmount = Math.floor(grossWin * (taxPercent / 100) * 100) / 100;
    const netAmount = Math.floor((grossWin - taxAmount) * 100) / 100;
    return { taxAmount, netAmount };
  }
};

// Verify game result with seeds
export const verifyGameResult = async (
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  gridSize: GridSize,
  mineCount: number,
  serverSeedHash: string
): Promise<{ isValid: boolean; minePositions: number[]; computedHash: string }> => {
  // Verify server seed hash matches
  const computedHash = await generateSeedHash(serverSeed);
  const isValid = computedHash === serverSeedHash;
  
  // Generate mine positions using the seeds
  const minePositions = await generateMinePositionsProvablyFair(
    serverSeed,
    clientSeed,
    nonce,
    gridSize,
    mineCount
  );
  
  return {
    isValid,
    minePositions,
    computedHash
  };
};

// Generate idempotency key for transactions
export const generateIdempotencyKey = (): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.getRandomValues(new Uint8Array(8));
  const randomStr = Array.from(random).map(b => b.toString(36)).join('');
  return `mines_${timestamp}_${randomStr}`;
};

// Format grid label
export const getGridLabel = (gridSize: GridSize): string => {
  switch (gridSize) {
    case 9: return '3×3';
    case 25: return '5×5';
    case 49: return '7×7';
    default: return `${Math.sqrt(gridSize)}×${Math.sqrt(gridSize)}`;
  }
};
