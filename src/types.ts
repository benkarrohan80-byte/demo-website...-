export type GameCategory = 'Battle Royale' | 'Clash Squad' | 'Lone Wolf' | 'Custom Room' | 'Free Fire Battle Royale' | 'Free Fire Clash Squad';
export type MatchMode = 'Solo' | 'Duo' | 'Squad' | '6v6' | 'Clash Squad (4v4)' | '1v1 Custom' | '2v2 Custom';
export type TournamentStatus = 'Upcoming' | 'Live' | 'Completed';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  diamonds: number;
  inGameId: string;
  phone?: string;
  totalEarnings: number; // in diamonds
  matchesPlayed: number;
  wins: number;
  kdRatio: number;
  tier: 'Grandmaster' | 'Challenger' | 'Apex Predator' | 'Immortal';
  createdAt: string;
  isVerified?: boolean;
  referralCode?: string;
  hasClaimedReferral?: boolean;
  lastDailyClaimAt?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  referralCode: string;
  createdAt: string;
  progress: {
    emailVerified: boolean;
    dailyBonusCount: number;
    customRoomsPlayed: number;
    rewardUnlocked: boolean;
    rewardPaid: boolean;
  };
}

export interface Tournament {
  id: string;
  title: string;
  game: GameCategory;
  mode: MatchMode;
  entryFee: number; // in diamonds (0 = Free)
  prizePool: number; // prize value
  prizeType?: 'Diamonds' | 'INR';
  perKillReward?: number; // diamonds or INR per kill
  startTime: string;
  status: TournamentStatus;
  map: string;
  maxSlots: number;
  registeredCount: number;
  bannerUrl: string;
  description: string;
  rules: string[];
  roomId?: string;
  roomPassword?: string;
  winnerTeam?: string;
  winnerUserId?: string;
  winnerName?: string;
}

export interface Registration {
  id: string;
  userId: string;
  userName: string;
  inGameId?: string;
  tournamentId: string;
  tournamentTitle: string;
  game: GameCategory;
  entryFeePaid: number;
  teamName?: string;
  teammates?: string[];
  registeredAt: string;
  status: 'Confirmed' | 'Pending Approval' | 'Cancelled';
  slotNumber: number; // Guaranteed fixed slot number
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'Credit' | 'Debit' | 'Withdrawal' | 'Earn' | 'TournamentWin' | 'TournamentEntry';
  category?: 'daily_checkin' | 'ad_watch' | 'task' | 'referral' | 'tournament_entry' | 'tournament_win' | 'withdrawal' | 'gift_code';
  amountDiamonds: number;
  description: string;
  timestamp: string;
  status: 'Success' | 'Pending' | 'Failed';
  giftCode?: string;
}

export interface PlatformTask {
  id: string;
  title: string;
  description: string;
  category: 'Daily' | 'Social' | 'Gaming' | 'Video' | 'Special';
  rewardDiamonds: number;
  iconName?: string;
  actionUrl?: string;
  actionLabel?: string;
  verificationType?: 'instant' | 'timer' | 'code';
  timerSeconds?: number;
  resetType?: 'lifetime' | 'weekly' | 'daily';
  active: boolean;
}

export interface WithdrawalTier {
  id: string;
  title: string;
  valueINR: number;
  diamondsCost: number;
  popular?: boolean;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  inGameId?: string;
  diamondsCost: number;
  giftCodeAmountINR: number;
  giftCode?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
  processedAt?: string;
  remarks?: string;
}

export interface EconomySettings {
  dailyCheckinRewards: number[]; // 7 days: [5, 5, 10, 15, 20, 30, 50]
  watchAdReward: number; // e.g. 15 diamonds
  referralReward: number; // e.g. 50 diamonds
  referralBonusForFriend: number; // e.g. 25 diamonds
  dailyAdLimit: number; // e.g. 10 ads per day
  withdrawalTiers: WithdrawalTier[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'tournament' | 'wallet' | 'system' | 'win' | 'earn' | 'withdrawal';
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  game: GameCategory;
  score: number;
  earnings: number; // in diamonds
  wins: number;
  tier: string;
  badgeUrl?: string;
}

export interface DiamondPackage {
  id: string;
  diamonds: number;
  bonusDiamonds: number;
  priceDiamonds: number;
  popular?: boolean;
}
