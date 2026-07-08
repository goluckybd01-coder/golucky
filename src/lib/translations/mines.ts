export type Language = 'en' | 'bn';

export const minesTranslations = {
  header: {
    mines: { en: 'Mines', bn: 'মাইনস' },
  },
  balance: {
    availableBalance: { en: 'Available Balance', bn: 'উপলব্ধ ব্যালেন্স' },
  },
  fairHash: {
    title: { en: 'Fair Hash', bn: 'ফেয়ার হ্যাশ' },
  },
  multiplier: {
    current: { en: 'Current Multiplier', bn: 'বর্তমান মাল্টিপ্লায়ার' },
    next: { en: 'Next Tile', bn: 'পরবর্তী টাইল' },
    grossWin: { en: 'Gross Win', bn: 'মোট জয়' },
    tax: { en: 'Tax', bn: 'ট্যাক্স' },
    netCashout: { en: 'Net Cashout', bn: 'নেট ক্যাশআউট' },
  },
  grid: {
    gridSize: { en: 'Grid Size', bn: 'গ্রিড সাইজ' },
    difficulty: { en: 'Difficulty', bn: 'কঠিনতা' },
    easy: { en: 'Easy', bn: 'সহজ' },
    medium: { en: 'Medium', bn: 'মাঝারি' },
    hard: { en: 'Hard', bn: 'কঠিন' },
    mines: { en: 'Mines', bn: 'মাইনস' },
    betAmount: { en: 'Bet Amount', bn: 'বাজির পরিমাণ' },
  },
  settings: {
    title: { en: 'Advanced Settings', bn: 'উন্নত সেটিংস' },
    clientSeed: { en: 'Client Seed', bn: 'ক্লায়েন্ট সিড' },
    edit: { en: 'Edit', bn: 'সম্পাদনা' },
    editClientSeed: { en: 'Edit Client Seed', bn: 'ক্লায়েন্ট সিড সম্পাদনা' },
    seedDescription: { en: 'Your client seed is used to generate provably fair results. You can change it anytime between games.', bn: 'আপনার ক্লায়েন্ট সিড প্রমাণযোগ্য ন্যায্য ফলাফল তৈরি করতে ব্যবহৃত হয়। আপনি গেমের মধ্যে যেকোনো সময় এটি পরিবর্তন করতে পারেন।' },
    enterNewSeed: { en: 'Enter new client seed...', bn: 'নতুন ক্লায়েন্ট সিড লিখুন...' },
    generateRandom: { en: 'Generate Random', bn: 'র্যান্ডম তৈরি করুন' },
    saveSeed: { en: 'Save Seed', bn: 'সিড সংরক্ষণ করুন' },
    notSet: { en: 'Not set', bn: 'সেট করা হয়নি' },
    autoCashout: { en: 'Auto Cashout at', bn: 'অটো ক্যাশআউট' },
    animationSpeed: { en: 'Animation Speed', bn: 'অ্যানিমেশন স্পিড' },
    instant: { en: 'Instant', bn: 'তাৎক্ষণিক' },
    vipInstant: { en: 'VIP Instant Mode Available', bn: 'ভিআইপি তাৎক্ষণিক মোড উপলব্ধ' },
    soundVolume: { en: 'Sound Volume', bn: 'সাউন্ড ভলিউম' },
    muted: { en: 'Muted', bn: 'নিঃশব্দ' },
    mute: { en: 'Mute', bn: 'নিঃশব্দ করুন' },
    unmute: { en: 'Unmute', bn: 'শব্দ চালু করুন' },
    reset: { en: 'Reset', bn: 'রিসেট' },
    enableAutoPick: { en: 'Enable Auto Pick Button', bn: 'অটো পিক বাটন সক্রিয় করুন' },
    hapticFeedback: { en: 'Haptic Feedback', bn: 'হ্যাপটিক ফিডব্যাক' },
  },
  buttons: {
    startGame: { en: 'Start Game', bn: 'গেম শুরু করুন' },
    starting: { en: 'Starting...', bn: 'শুরু হচ্ছে...' },
    gameDisabled: { en: 'Game Disabled', bn: 'গেম নিষ্ক্রিয়' },
    autoPick: { en: 'Auto Pick', bn: 'অটো পিক' },
    cashout: { en: 'Cashout', bn: 'ক্যাশআউট' },
    playAgain: { en: '🎮 Play Again', bn: '🎮 আবার খেলুন' },
  },
  tips: {
    safeTilesRemaining: { en: 'safe tiles remaining', bn: 'টি নিরাপদ টাইল বাকি' },
    tip: { en: 'Tip', bn: 'টিপ' },
  },
  gameOver: {
    title: { en: 'Game Over!', bn: 'গেম ওভার!' },
    hitMine: { en: 'You hit a mine 💥', bn: 'আপনি মাইনে আঘাত করেছেন 💥' },
    youWon: { en: 'You Won!', bn: 'আপনি জিতেছেন!' },
    cashedOut: { en: 'Cashed Out!', bn: 'ক্যাশআউট হয়েছে!' },
    multiplier: { en: 'multiplier', bn: 'মাল্টিপ্লায়ার' },
  },
  provablyFair: {
    seedHash: { en: 'Seed Hash (Provably Fair)', bn: 'সিড হ্যাশ (প্রমাণযোগ্য ন্যায্য)' },
  },
  streak: {
    winStreak: { en: 'Win Streak', bn: 'জয় স্ট্রীক' },
    bonus: { en: 'Streak Bonus', bn: 'স্ট্রীক বোনাস' },
    streakLost: { en: 'Streak Lost', bn: 'স্ট্রীক হারিয়েছেন' },
    newRecord: { en: 'New Record!', bn: 'নতুন রেকর্ড!' },
  },
  language: {
    english: { en: 'EN', bn: 'EN' },
    bangla: { en: 'বাং', bn: 'বাং' },
  },
};

export const minesHowToPlayTranslations = {
  en: [
    { title: "🎯 Game Objective", lines: ["Reveal gems while avoiding hidden mines!", "The more tiles you reveal, the higher your multiplier.", "Cash out anytime to secure your winnings!"] },
    { title: "🎮 Grid Sizes", lines: ["• 3×3 (9 tiles) - Quick rounds, fast action", "• 5×5 (25 tiles) - Balanced gameplay", "• 7×7 (49 tiles) - Maximum tiles, bigger wins"] },
    { title: "💎 How to Play", lines: ["1. Set your bet amount (৳10 - ৳50,000)", "2. Choose grid size and number of mines", "3. Click 'Start Game' to begin", "4. Click tiles to reveal gems or mines", "5. Hit 'Cashout' anytime to collect winnings", "6. If you hit a mine, you lose your bet!"] },
    { title: "⚡ Difficulty Levels", lines: ["• Easy: ~20% mines (low risk, lower rewards)", "• Medium: ~40% mines (balanced risk/reward)", "• Hard: ~60% mines (high risk, big multipliers)"] },
    { title: "💰 Payouts & Tax", lines: ["• Multiplier increases with each safe tile", "• More mines = higher multipliers", "• 2% tax applies on profit (wins minus bet)", "• All amounts shown in ৳ (BDT)"] },
    { title: "✅ Provably Fair", lines: ["Each game uses cryptographic seeds for fairness.", "Server seed hash is shown before you play.", "After the round, you can verify the result.", "Your client seed can be changed anytime."] },
    { title: "💡 Tips", lines: ["• Start with smaller bets to learn", "• Use Auto Cashout for consistent profits", "• Higher VIP levels unlock Instant Mode", "• Check your history for round details"] },
  ],
  bn: [
    { title: "🎯 গেমের উদ্দেশ্য", lines: ["লুকানো মাইন এড়িয়ে জেমস খুঁজে বের করুন!", "আপনি যত বেশি টাইল প্রকাশ করবেন, মাল্টিপ্লায়ার তত বেশি হবে।", "যেকোনো সময় ক্যাশআউট করে জয় নিশ্চিত করুন!"] },
    { title: "🎮 গ্রিড সাইজ", lines: ["• ৩×৩ (৯ টাইল) - দ্রুত রাউন্ড, দ্রুত অ্যাকশন", "• ৫×৫ (২৫ টাইল) - ভারসাম্যপূর্ণ গেমপ্লে", "• ৭×৭ (৪৯ টাইল) - সর্বাধিক টাইল, বড় জয়"] },
    { title: "💎 কিভাবে খেলবেন", lines: ["১. আপনার বাজির পরিমাণ সেট করুন (৳১০ - ৳৫০,০০০)", "২. গ্রিড সাইজ এবং মাইনের সংখ্যা বাছুন", "৩. শুরু করতে 'গেম শুরু করুন' ক্লিক করুন", "৪. জেম বা মাইন প্রকাশ করতে টাইলে ক্লিক করুন", "৫. জয় সংগ্রহ করতে যেকোনো সময় 'ক্যাশআউট' করুন", "৬. মাইনে আঘাত করলে আপনার বাজি হারাবেন!"] },
    { title: "⚡ কঠিনতার স্তর", lines: ["• সহজ: ~২০% মাইন (কম ঝুঁকি, কম পুরস্কার)", "• মাঝারি: ~৪০% মাইন (ভারসাম্যপূর্ণ ঝুঁকি/পুরস্কার)", "• কঠিন: ~৬০% মাইন (উচ্চ ঝুঁকি, বড় মাল্টিপ্লায়ার)"] },
    { title: "💰 পেআউট এবং ট্যাক্স", lines: ["• প্রতিটি নিরাপদ টাইলে মাল্টিপ্লায়ার বাড়ে", "• বেশি মাইন = উচ্চ মাল্টিপ্লায়ার", "• মুনাফার উপর ২% ট্যাক্স প্রযোজ্য (জয় বিয়োগ বাজি)", "• সব পরিমাণ ৳ (বিডিটি) তে দেখানো হয়"] },
    { title: "✅ প্রমাণযোগ্য ন্যায্য", lines: ["প্রতিটি গেম ন্যায্যতার জন্য ক্রিপ্টোগ্রাফিক সিড ব্যবহার করে।", "আপনি খেলার আগে সার্ভার সিড হ্যাশ দেখানো হয়।", "রাউন্ড শেষ হলে আপনি ফলাফল যাচাই করতে পারবেন।", "আপনার ক্লায়েন্ট সিড যেকোনো সময় পরিবর্তন করা যায়।"] },
    { title: "💡 টিপস", lines: ["• শিখতে ছোট বাজি দিয়ে শুরু করুন", "• ধারাবাহিক মুনাফার জন্য অটো ক্যাশআউট ব্যবহার করুন", "• উচ্চ ভিআইপি লেভেল তাৎক্ষণিক মোড আনলক করে", "• রাউন্ডের বিবরণের জন্য আপনার ইতিহাস দেখুন"] },
  ],
};

export const t = (key: string, lang: Language): string => {
  const keys = key.split('.');
  let value: any = minesTranslations;
  for (const k of keys) {
    value = value?.[k];
    if (!value) return key;
  }
  return value[lang] || value['en'] || key;
};
