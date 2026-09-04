import React, { useState } from 'react';
import { User, PlatformTask, EconomySettings } from '../types';
import { 
  Sparkles, Calendar, Play, CheckCircle2, Gift, Share2, Copy, Trophy, 
  ExternalLink, Clock, Flame, ShieldCheck, ArrowRight, Zap, Star, ChevronRight, Check, RotateCcw, Lock
} from 'lucide-react';
import { FF_IMAGES } from '../assets/freeFireAssets';

interface EarnDiamondsPageProps {
  currentUser: User | null;
  tasks: PlatformTask[];
  economySettings: EconomySettings;
  onClaimDailyBonus: (dayIndex: number, amount: number) => void;
  onCompleteTask: (taskId: string, rewardDiamonds: number) => void;
  onApplyReferralCode: (code: string) => boolean;
  onOpenAuth: () => void;
  setActiveTab: (tab: string) => void;
}

export interface WheelSector {
  diamonds: number;
  color: string;
  stroke: string;
  name: string;
  labelColor: string;
}

export const WHEEL_SECTORS: WheelSector[] = [
  { diamonds: 150, color: '#b45309', stroke: '#f59e0b', name: 'Jackpot', labelColor: '#fef3c7' }, // Sector 0 (center 30 deg)
  { diamonds: 25, color: '#6d28d9', stroke: '#a855f7', name: 'Starter', labelColor: '#f3e8ff' }, // Sector 1 (center 90 deg)
  { diamonds: 75, color: '#0e7490', stroke: '#22d3ee', name: 'Pro', labelColor: '#cffafe' },     // Sector 2 (center 150 deg)
  { diamonds: 30, color: '#be185d', stroke: '#f472b6', name: 'Bonus', labelColor: '#fce7f3' },   // Sector 3 (center 210 deg)
  { diamonds: 100, color: '#047857', stroke: '#34d399', name: 'Mega', labelColor: '#d1fae5' },   // Sector 4 (center 270 deg)
  { diamonds: 50, color: '#1d4ed8', stroke: '#60a5fa', name: 'Hero', labelColor: '#dbeafe' },    // Sector 5 (center 330 deg)
];

export const EarnDiamondsPage: React.FC<EarnDiamondsPageProps> = ({
  currentUser,
  tasks,
  economySettings,
  onClaimDailyBonus,
  onCompleteTask,
  onApplyReferralCode,
  onOpenAuth,
  setActiveTab,
}) => {
  // Helper functions for calendar dates
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Compute streak state based on user's persistent record
  const computeStreakData = () => {
    const userId = currentUser?.id || 'guest_user';
    const raw = localStorage.getItem(`shadowx_streak_data_${userId}`);
    const todayStr = getTodayDateStr();
    const yesterdayStr = getYesterdayDateStr();

    if (!raw) {
      return {
        streakCount: 0,
        hasClaimedToday: false,
        claimedStreak: [] as number[],
        currentStreakDay: 0,
        notice: null as string | null,
      };
    }

    try {
      const data = JSON.parse(raw);
      const { lastDateStr, streakCount } = data;

      if (lastDateStr === todayStr) {
        // Already claimed today
        const clamped = Math.min(Math.max(streakCount || 1, 1), 7);
        return {
          streakCount: clamped,
          hasClaimedToday: true,
          claimedStreak: Array.from({ length: clamped }, (_, i) => i),
          currentStreakDay: clamped < 7 ? clamped : 6,
          notice: clamped === 7 ? '🎉 7-Day Cycle Completed! Tomorrow your streak will reset to Day 1.' : null,
        };
      } else if (lastDateStr === yesterdayStr) {
        // Logged in on consecutive day
        if (streakCount >= 7) {
          // Completed all 7 days yesterday! Cycle restarts from Day 1
          return {
            streakCount: 0,
            hasClaimedToday: false,
            claimedStreak: [],
            currentStreakDay: 0,
            notice: '🎉 Fresh 7-Day Cycle Started! All previous 7 days were claimed.',
          };
        } else {
          // Continue streak: next day is available
          return {
            streakCount: streakCount,
            hasClaimedToday: false,
            claimedStreak: Array.from({ length: streakCount }, (_, i) => i),
            currentStreakDay: streakCount, // 0-indexed: day 2 is index 1
            notice: null,
          };
        }
      } else {
        // Missed at least 1 day (lastDateStr is before yesterday) -> Reset to Day 1
        return {
          streakCount: 0,
          hasClaimedToday: false,
          claimedStreak: [],
          currentStreakDay: 0,
          notice: '⚠️ Streak Reset: You missed a daily check-in. Starting fresh from Day 1!',
        };
      }
    } catch {
      return {
        streakCount: 0,
        hasClaimedToday: false,
        claimedStreak: [],
        currentStreakDay: 0,
        notice: null,
      };
    }
  };

  const [streakData, setStreakData] = useState(computeStreakData);

  // Re-compute when user changes
  React.useEffect(() => {
    setStreakData(computeStreakData());
  }, [currentUser?.id]);

  // Task category filter & completion tracking
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [inProgressTask, setInProgressTask] = useState<{ id: string; secondsLeft: number } | null>(null);

  // Referral code state
  const [friendRefCode, setFriendRefCode] = useState('');
  const [refMsg, setRefMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Weekly Booyah Lucky Wheel state (1 spin per week)
  const [spinDegree, setSpinDegree] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinReward, setSpinReward] = useState<number | null>(null);
  const [hasSpunThisWeek, setHasSpunThisWeek] = useState(false);
  const [daysUntilNextSpin, setDaysUntilNextSpin] = useState(6);
  const [winningSectorIndex, setWinningSectorIndex] = useState<number | null>(null);

  // Synchronize weekly spin history for the active user
  React.useEffect(() => {
    if (!currentUser) {
      setHasSpunThisWeek(false);
      setSpinReward(null);
      setWinningSectorIndex(null);
      return;
    }
    try {
      const raw = localStorage.getItem(`shadowx_weekly_spin_${currentUser.id}`);
      if (raw) {
        const data = JSON.parse(raw);
        const daysElapsed = Math.floor((Date.now() - Number(data.timestamp)) / (1000 * 60 * 60 * 24));
        if (daysElapsed < 7) {
          setHasSpunThisWeek(true);
          setDaysUntilNextSpin(Math.max(1, 7 - daysElapsed));
          if (typeof data.reward === 'number') setSpinReward(data.reward);
          if (typeof data.sectorIndex === 'number') setWinningSectorIndex(data.sectorIndex);
        } else {
          setHasSpunThisWeek(false);
        }
      } else {
        setHasSpunThisWeek(false);
      }
    } catch {
      setHasSpunThisWeek(false);
    }
  }, [currentUser?.id]);

  // Handlers
  const handleClaimDaily = (dayIndex: number) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const reward = economySettings.dailyCheckinRewards[dayIndex] ?? 5;
    onClaimDailyBonus(dayIndex, reward);

    const newStreak = dayIndex + 1; // 1 to 7
    const todayStr = getTodayDateStr();
    const userId = currentUser.id;

    localStorage.setItem(
      `shadowx_streak_data_${userId}`,
      JSON.stringify({
        lastDateStr: todayStr,
        streakCount: newStreak,
      })
    );

    setStreakData({
      streakCount: newStreak,
      hasClaimedToday: true,
      claimedStreak: Array.from({ length: newStreak }, (_, i) => i),
      currentStreakDay: newStreak < 7 ? newStreak : 6,
      notice: newStreak === 7 ? '🎉 7-Day Cycle Completed! Next check-in tomorrow will start fresh from Day 1 (+5 💎).' : null,
    });
  };

  // Helper function for quick testing simulation
  const simulateStreakCondition = (mode: 'next_day' | 'miss_day' | 'reset') => {
    const userId = currentUser?.id || 'guest_user';
    const todayStr = getTodayDateStr();
    const yesterdayStr = getYesterdayDateStr();

    if (mode === 'reset') {
      localStorage.removeItem(`shadowx_streak_data_${userId}`);
      setStreakData({
        streakCount: 0,
        hasClaimedToday: false,
        claimedStreak: [],
        currentStreakDay: 0,
        notice: 'Streak reset to Day 1.',
      });
    } else if (mode === 'next_day') {
      // Set lastDate to yesterday with current streak
      const currentCount = streakData.streakCount === 0 ? 1 : streakData.streakCount;
      localStorage.setItem(
        `shadowx_streak_data_${userId}`,
        JSON.stringify({
          lastDateStr: yesterdayStr,
          streakCount: currentCount,
        })
      );
      setStreakData(computeStreakData());
    } else if (mode === 'miss_day') {
      // Set lastDate to 3 days ago (broken streak)
      const d = new Date();
      d.setDate(d.getDate() - 3);
      const oldDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      localStorage.setItem(
        `shadowx_streak_data_${userId}`,
        JSON.stringify({
          lastDateStr: oldDateStr,
          streakCount: streakData.streakCount || 2,
        })
      );
      setStreakData(computeStreakData());
    }
  };

  const handleStartTask = (task: PlatformTask) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (task.actionUrl) {
      window.open(task.actionUrl, '_blank');
    }

    if (task.verificationType === 'timer' && task.timerSeconds) {
      setInProgressTask({ id: task.id, secondsLeft: task.timerSeconds });
      let remaining = task.timerSeconds;
      const interval = setInterval(() => {
        remaining -= 1;
        setInProgressTask(curr => curr ? { ...curr, secondsLeft: remaining } : null);
        if (remaining <= 0) {
          clearInterval(interval);
          setInProgressTask(null);
          setCompletedTaskIds(prev => [...prev, task.id]);
          onCompleteTask(task.id, task.rewardDiamonds);
        }
      }, 1000);
    } else {
      // Instant verification
      setCompletedTaskIds(prev => [...prev, task.id]);
      onCompleteTask(task.id, task.rewardDiamonds);
    }
  };

  const handleCopyReferral = () => {
    const code = currentUser ? `SHX-${currentUser.inGameId || currentUser.id}` : 'SHX-VIPER2026';
    const link = `https://shadowx.esports/join?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleApplyReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const ok = onApplyReferralCode(friendRefCode.trim());
    if (ok) {
      setRefMsg({ text: `Referral code applied! +${economySettings.referralBonusForFriend} Welcome Diamonds credited.`, type: 'success' });
      setFriendRefCode('');
    } else {
      setRefMsg({ text: 'Invalid referral code or already used.', type: 'error' });
    }
  };

  const handleSpinWeeklyWheel = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (isSpinning || hasSpunThisWeek) return;

    setIsSpinning(true);
    setSpinReward(null);
    setWinningSectorIndex(null);

    // Probability Distribution (Configured as requested):
    // 25 Diamonds: 70% chance
    // 30 Diamonds: 25% chance
    // 50 Diamonds:  5% chance
    // All other wheel options (150, 75, 100) are purely visual and will never be selected
    const rand = Math.random() * 100; // 0 to 100
    let targetDiamonds = 25;
    if (rand < 70) {
      targetDiamonds = 25; // 70% probability
    } else if (rand < 95) {
      targetDiamonds = 30; // 25% probability
    } else {
      targetDiamonds = 50; // 5% probability
    }

    let chosenIndex = WHEEL_SECTORS.findIndex(s => s.diamonds === targetDiamonds);
    if (chosenIndex === -1) chosenIndex = 1; // Fallback to 25 diamonds
    const chosenSector = WHEEL_SECTORS[chosenIndex];
    const winningDiamonds = chosenSector.diamonds;

    // Pointer arrow is positioned at the BOTTOM of the wheel (180 degrees from top 0 degrees)
    // Sector i has its center at: (i * 60 + 30) degrees
    // When the wheel rotates clockwise by spinDegree, sector i moves to:
    // (midAngle + spinDegree) % 360
    // To position sector i center exactly at the bottom (180 degrees):
    // targetAngleMod = (180 - (chosenIndex * 60 + 30)) % 360
    let targetAngleMod = (180 - (chosenIndex * 60 + 30)) % 360;
    if (targetAngleMod < 0) targetAngleMod += 360;

    const currentMod = spinDegree % 360;
    let diff = targetAngleMod - currentMod;
    if (diff < 0) diff += 360;

    // Spin at least 5 complete rounds (1800 deg) + diff to precisely land on target slice
    const nextDegree = spinDegree + 1800 + diff;
    setSpinDegree(nextDegree);

    setTimeout(() => {
      setIsSpinning(false);
      setSpinReward(winningDiamonds);
      setWinningSectorIndex(chosenIndex);
      setHasSpunThisWeek(true);
      setDaysUntilNextSpin(7);

      try {
        localStorage.setItem(`shadowx_weekly_spin_${currentUser.id}`, JSON.stringify({
          timestamp: Date.now(),
          reward: winningDiamonds,
          sectorIndex: chosenIndex,
        }));
      } catch {}

      onClaimDailyBonus(99, winningDiamonds);
    }, 3600);
  };

  const filteredTasks = React.useMemo(() => {
    return tasks.filter(t => {
      if (!t.active) return false;
      if (selectedCategory === 'All') return true;
      return t.category === selectedCategory;
    });
  }, [tasks, selectedCategory]);

  const referralCode = currentUser ? `SHX-${currentUser.inGameId || currentUser.id}` : 'SHX-VIPER2026';

  return (
    <div className="min-h-screen bg-[#090a0f] text-white py-6 sm:py-10 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Free Fire Image Wallpaper */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15">
        <img src={FF_IMAGES.clashSquad} alt="Free Fire Clash Squad Wallpaper" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090a0f]/90 via-[#090a0f]/80 to-[#090a0f]"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-12 relative z-10">
        
        {/* Hero Banner: Earn Diamonds Hub */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img 
              src={FF_IMAGES.dailyTaskRewards} 
              alt="Free Fire Diamond Rewards Hub" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-25 object-right mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/85 to-transparent"></div>
          </div>

          <div className="relative z-10 p-5 sm:p-12 max-w-3xl space-y-3 sm:space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>100% Free Diamonds • Zero Purchase Required</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
              Earn Free Diamonds & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-amber-300">
                Redeem Google Play Codes
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              No need to buy diamonds! Check-in daily, complete simple missions, and refer friends to build your diamond stash. Spend diamonds to compete in Free Fire custom rooms and withdraw winnings directly as Google Play Redeem Codes!
            </p>

            {/* Loop Roadmap Indicators */}
            <div className="pt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-300">
              <span className="px-3 py-1.5 rounded-xl bg-purple-900/60 border border-purple-500/40 text-purple-200">1. Complete Tasks</span>
              <ChevronRight className="w-4 h-4 text-purple-400" />
              <span className="px-3 py-1.5 rounded-xl bg-cyan-900/60 border border-cyan-500/40 text-cyan-200">2. Earn 💎</span>
              <ChevronRight className="w-4 h-4 text-cyan-400" />
              <span className="px-3 py-1.5 rounded-xl bg-indigo-900/60 border border-indigo-500/40 text-indigo-200">3. Play Tournaments</span>
              <ChevronRight className="w-4 h-4 text-indigo-400" />
              <span className="px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-500/40 text-emerald-200">4. Withdraw Play Store Codes</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: 7-DAY DAILY CHECK-IN STREAK */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4" />
                <span>Daily Login Streak</span>
              </div>
              <h2 className="text-2xl font-black text-white">7-Day Free Fire Diamond Calendar</h2>
              <p className="text-xs text-gray-400">
                Log in every 24 hours to claim your daily diamonds. If you miss a day, the streak resets to Day 1! After claiming Day 7, the cycle restarts.
              </p>
            </div>

            {currentUser && (
              <div className="flex items-center space-x-3 bg-purple-950/60 border border-purple-500/30 px-4 py-2.5 rounded-2xl">
                <span className="text-xs text-purple-300 font-bold uppercase">Current Streak:</span>
                <span className="text-lg font-black text-amber-400">{streakData.streakCount} / 7 Days 🔥</span>
              </div>
            )}
          </div>

          {/* Status / Reset Notification banner */}
          {streakData.notice && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
              streakData.notice.includes('⚠️') 
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' 
                : 'bg-purple-950/50 border-purple-500/40 text-purple-200'
            }`}>
              <div className="flex items-center space-x-2">
                <span>{streakData.notice}</span>
              </div>
              <button 
                onClick={() => setStreakData(prev => ({ ...prev, notice: null }))}
                className="text-gray-400 hover:text-white text-xs underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {economySettings.dailyCheckinRewards.map((reward, idx) => {
              const dayNum = idx + 1;
              const isClaimed = streakData.claimedStreak.includes(idx);
              const isToday = idx === streakData.currentStreakDay && !streakData.hasClaimedToday;
              const isLocked = idx > streakData.currentStreakDay || (streakData.hasClaimedToday && !isClaimed);

              return (
                <div
                  key={`day_${dayNum}`}
                  className={`relative rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all border ${
                    isClaimed
                      ? 'bg-purple-950/30 border-purple-500/30 opacity-75'
                      : isToday
                      ? 'bg-gradient-to-b from-purple-900/80 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40 scale-105'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Day {dayNum}</div>
                  
                  <div className="my-3 text-3xl">
                    {dayNum === 7 ? '👑' : isClaimed ? '✅' : '💎'}
                  </div>

                  <div className="font-black text-lg text-amber-300">+{reward} 💎</div>

                  <div className="w-full mt-3">
                    {isClaimed ? (
                      <span className="block w-full py-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 rounded-lg border border-emerald-500/30">
                        Claimed
                      </span>
                    ) : isToday ? (
                      <button
                        onClick={() => handleClaimDaily(idx)}
                        className="w-full py-2 text-xs font-black uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-yellow-400 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
                      >
                        Claim Now
                      </button>
                    ) : (
                      <span className="block w-full py-1.5 text-[11px] font-semibold text-gray-500 bg-slate-900 rounded-lg border border-slate-800">
                        {streakData.hasClaimedToday ? 'Come Back Tomorrow' : isLocked ? 'Locked' : 'Day 1'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Streak Rule summary info & testing controls */}
          <div className="p-4 bg-slate-950/60 border border-purple-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-300">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-bold">📌 Streak Rules:</span>
              <span>Day 1 (5💎) → Day 2 (5💎) → Day 3 (10💎) → Day 4 (15💎) → Day 5 (20💎) → Day 6 (30💎) → Day 7 (50💎). Miss a day = Reset to Day 1.</span>
            </div>

            {/* Quick Test / Simulation Buttons for User */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => simulateStreakCondition('next_day')}
                title="Advance date to tomorrow to test next day claim"
                className="px-2.5 py-1 rounded-lg bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[11px] font-semibold hover:bg-purple-800/80 transition-all flex items-center space-x-1"
              >
                <span>⏩ Sim Next Day</span>
              </button>
              <button
                onClick={() => simulateStreakCondition('miss_day')}
                title="Simulate missing a day to verify reset to Day 1"
                className="px-2.5 py-1 rounded-lg bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[11px] font-semibold hover:bg-amber-800/80 transition-all flex items-center space-x-1"
              >
                <span>⚠️ Sim Miss Day</span>
              </button>
              <button
                onClick={() => simulateStreakCondition('reset')}
                title="Reset streak to start"
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-gray-400 text-[11px] font-semibold hover:bg-slate-700 transition-all flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: WEEKLY BOOYAH LUCKY WHEEL (1 Spin per Week) */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-4">
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>Weekly Special Event</span>
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 flex items-center space-x-1.5">
                  {hasSpunThisWeek ? (
                    <>
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Next Spin in {daysUntilNextSpin}d</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>1 Spin Available</span>
                    </>
                  )}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white">Weekly Booyah Lucky Spin 🎯</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Enjoy 1 free lucky spin every week! Spin the wheel to win up to <span className="text-amber-400 font-bold">150 Free Fire Diamonds</span> deposited directly into your platform wallet.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/20 text-center">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Frequency</span>
                  <span className="text-xs font-bold text-cyan-300">1 Time / Week</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/20 text-center">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Max Jackpot</span>
                  <span className="text-xs font-bold text-amber-400">150 💎</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/20 text-center">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Reset Day</span>
                  <span className="text-xs font-bold text-purple-300">Every Monday</span>
                </div>
              </div>

              {spinReward && (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-sm font-bold flex items-center space-x-3 animate-bounce">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <div>Booyah! You won +{spinReward} Diamonds this week!</div>
                    <div className="text-xs text-emerald-400/80 font-normal">Amount has been added to your diamond wallet.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Wheel Element */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950/80 rounded-2xl border border-purple-500/30 w-full sm:w-96 shadow-2xl relative">
              
              {/* Wheel Container with glowing bezel */}
              <div className="relative p-2 rounded-full bg-gradient-to-b from-amber-500/20 via-purple-900/30 to-slate-950 border-2 border-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                
                {/* Rotating SVG Wheel */}
                <div 
                  className="w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-2xl transition-transform duration-[3600ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
                  style={{ transform: `rotate(${spinDegree}deg)` }}
                >
                  <svg viewBox="0 0 260 260" className="w-full h-full">
                    {/* Background */}
                    <circle cx="130" cy="130" r="126" fill="#0f172a" />

                    {/* 6 Wheel Slices */}
                    {WHEEL_SECTORS.map((sector, i) => {
                      const a1 = (i * 60) * (Math.PI / 180);
                      const a2 = ((i + 1) * 60) * (Math.PI / 180);
                      const x1 = (130 + 120 * Math.sin(a1)).toFixed(2);
                      const y1 = (130 - 120 * Math.cos(a1)).toFixed(2);
                      const x2 = (130 + 120 * Math.sin(a2)).toFixed(2);
                      const y2 = (130 - 120 * Math.cos(a2)).toFixed(2);

                      const midAngle = i * 60 + 30;
                      const midRad = midAngle * (Math.PI / 180);
                      const tx = 130 + 76 * Math.sin(midRad);
                      const ty = 130 - 76 * Math.cos(midRad);

                      // When slice lands at the bottom arrow (180 deg), (midAngle - 180) ensures text is completely upright & horizontal!
                      const textRotation = midAngle - 180;
                      const isHighlighted = winningSectorIndex === i && !isSpinning;

                      return (
                        <g key={i}>
                          <path
                            d={`M 130 130 L ${x1} ${y1} A 120 120 0 0 1 ${x2} ${y2} Z`}
                            fill={sector.color}
                            stroke={isHighlighted ? '#fbbf24' : '#090a0f'}
                            strokeWidth={isHighlighted ? '4' : '2'}
                          />
                          {/* Slice separator line */}
                          <line
                            x1="130"
                            y1="130"
                            x2={x1}
                            y2={y1}
                            stroke="rgba(255,255,255,0.25)"
                            strokeWidth="1.5"
                          />
                          {/* Diamond count text */}
                          <g transform={`translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) rotate(${textRotation})`}>
                            <text
                              x="0"
                              y="0"
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={sector.labelColor}
                              fontSize="14"
                              fontWeight="900"
                              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}
                            >
                              {sector.diamonds} 💎
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* Outer Wheel Rim */}
                    <circle cx="130" cy="130" r="122" fill="none" stroke="#f59e0b" strokeWidth="4" />

                    {/* Center Hub */}
                    <circle cx="130" cy="130" r="28" fill="#090a0f" stroke="#fbbf24" strokeWidth="3" />
                    <circle cx="130" cy="130" r="23" fill="#1e1b4b" />
                    <text
                      x="130"
                      y="131"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fbbf24"
                      fontSize="10"
                      fontWeight="900"
                      letterSpacing="1"
                    >
                      SPIN
                    </text>
                  </svg>
                </div>
              </div>

              {/* BOTTOM ARROW INDICATOR (POINTING UP AT THE WINNING SLICE) */}
              <div className="flex flex-col items-center -mt-2 sm:-mt-2.5 z-20 pointer-events-none">
                {/* Arrow Pointer Triangle pointing UP */}
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] border-b-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,1)] animate-bounce" />
                
                {/* Arrow Label Badge */}
                <div className="px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-black text-[10px] uppercase tracking-wider shadow-lg shadow-amber-400/40 border border-yellow-100 flex items-center space-x-1 -mt-0.5">
                  <span>▲</span>
                  <span>WINNER ARROW</span>
                </div>
              </div>

              {/* Explanatory Caption */}
              <p className="text-[11px] text-amber-300/90 font-semibold text-center mt-2.5">
                Arrow ke theek samne jo diamonds aayenge, wahi wallet me milenge!
              </p>

              {/* Spin Button */}
              <button
                onClick={handleSpinWeeklyWheel}
                disabled={isSpinning || hasSpunThisWeek}
                className={`w-full mt-3.5 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2 ${
                  hasSpunThisWeek
                    ? 'bg-slate-800 text-gray-400 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black hover:brightness-110 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
                }`}
              >
                {hasSpunThisWeek ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Zap className="w-4 h-4 fill-black" />
                )}
                <span>
                  {isSpinning 
                    ? 'Spinning Wheel...' 
                    : hasSpunThisWeek 
                    ? `Locked (Next Spin in ${daysUntilNextSpin} Day${daysUntilNextSpin > 1 ? 's' : ''})` 
                    : 'Spin Booyah Wheel Now'}
                </span>
              </button>

              {/* Weekly Limit Rule Banner */}
              {hasSpunThisWeek && (
                <div className="w-full mt-2.5 px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center space-x-2 text-[11px] text-purple-300 text-center">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Weekly Limit: Week me 1 bar spin allowed. Agla spin <strong className="text-amber-300 font-bold">{daysUntilNextSpin} din</strong> baad unlock hoga.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: MISSION & TASK CENTER */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Mission Center</span>
              </div>
              <h2 className="text-2xl font-black text-white">Complete Tasks & Earn Diamonds</h2>
              <p className="text-xs text-gray-400">Complete social missions and weekly tournament challenges to earn diamond rewards.</p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {['All', 'Social', 'Gaming'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-950 border border-purple-500/20 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Rules Guide Notice */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-950 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">🔄 Weekly Task Reset Policy:</span>
                <span className="text-gray-300">
                  <strong className="text-amber-400">Tournament Match (30 💎)</strong> and <strong className="text-amber-400">1st Booyah (70 💎)</strong> reset every Monday at 12:00 AM! Social tasks are 1-Time Lifetime rewards.
                </span>
              </div>
            </div>
            <span className="self-start sm:self-center px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold whitespace-nowrap">
              Reset: Every Monday 12 AM
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const isCompleted = completedTaskIds.includes(task.id);
              const isInProgress = inProgressTask?.id === task.id;
              const isWeekly = task.resetType === 'weekly';

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                    isCompleted
                      ? 'bg-slate-950/40 border-purple-500/20 opacity-70'
                      : 'bg-slate-950/80 border-purple-500/30 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300">
                          {task.category}
                        </span>
                        {isWeekly ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center space-x-1">
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Weekly Reset</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300">
                            1-Time Lifetime
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white">{task.title}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">{task.description}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-block px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 text-amber-300 font-black text-sm">
                        +{task.rewardDiamonds} 💎
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-purple-500/10 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      {isCompleted 
                        ? (isWeekly ? 'Claimed this week (Resets next week)' : 'Lifetime reward claimed') 
                        : (isWeekly ? '🔄 Available once per week' : 'Instant credit upon verification')}
                    </span>

                    {isCompleted ? (
                      <span className="flex items-center space-x-1 text-xs font-bold text-emerald-400">
                        <Check className="w-4 h-4" />
                        <span>Completed</span>
                      </span>
                    ) : isInProgress ? (
                      <span className="px-4 py-2 rounded-xl bg-cyan-950 text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying ({inProgressTask.secondsLeft}s)...</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleStartTask(task)}
                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-1.5"
                      >
                        <span>{task.actionLabel || 'Start Task'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: REFER FRIENDS & EARN */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Share2 className="w-4 h-4" />
                <span>Referral Program</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Invite Friends & Get <span className="text-amber-400">+{economySettings.referralReward} 💎</span> Per Friend
              </h2>
              
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Give your squad members your unique invite link. When they register on Shadow Queen Gaming, you get <strong className="text-white">+{economySettings.referralReward} 💎</strong> and your friend gets <strong className="text-white">+{economySettings.referralBonusForFriend} 💎</strong> bonus diamonds!
              </p>

              {/* Referral Link Copy Bar */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex-1 flex items-center space-x-2 bg-slate-950 border border-purple-500/30 px-4 py-3 rounded-2xl">
                  <span className="text-xs text-gray-400 uppercase font-bold">Code:</span>
                  <span className="text-sm font-black text-purple-300 font-mono flex-1">{referralCode}</span>
                  <button
                    onClick={handleCopyReferral}
                    className="p-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 transition-colors"
                    title="Copy Referral Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <a
                  href={`https://api.whatsapp.com/send?text=Join%20me%20on%20Shadow%20Queen%20Free%20Fire%20tournaments!%20Use%20my%20code%20${referralCode}%20to%20get%2025%20Free%20Diamonds%20and%20win%20Google%20Play%20Redeem%20Codes:%20https://shadowx.esports/join?ref=${referralCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Apply Friend's Code Form */}
            <div className="lg:col-span-5 bg-slate-950/80 border border-purple-500/30 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Have a Friend's Referral Code?</h3>
              <p className="text-xs text-gray-400">Enter their invite code to claim +{economySettings.referralBonusForFriend} Welcome Diamonds.</p>

              {refMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  refMsg.type === 'success' ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border border-red-500/40 text-red-300'
                }`}>
                  {refMsg.text}
                </div>
              )}

              <form onSubmit={handleApplyReferral} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="e.g. SHX-VIPER2026"
                  value={friendRefCode}
                  onChange={(e) => setFriendRefCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-purple-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                >
                  Apply Code & Claim +{economySettings.referralBonusForFriend} 💎
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
