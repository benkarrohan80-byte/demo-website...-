import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { 
  Coins, ArrowUpRight, ArrowDownLeft, Sparkles, Download, 
  Gift, Trophy, CheckCircle2, Copy, Check, Clock, ExternalLink, ArrowRight, Play
} from 'lucide-react';
import { FF_IMAGES } from '../assets/freeFireAssets';

interface WalletPageProps {
  currentUser: User | null;
  transactions: Transaction[];
  onOpenAuth: () => void;
  setActiveTab: (tab: string) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({
  currentUser,
  transactions,
  onOpenAuth,
  setActiveTab,
}) => {
  const [historyTab, setHistoryTab] = useState<'all' | 'earn' | 'tournaments' | 'withdrawals'>('all');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const userTransactions = React.useMemo(() => {
    return currentUser
      ? transactions.filter(t => t.userId === currentUser.id)
      : [];
  }, [currentUser, transactions]);

  const earnTransactions = React.useMemo(() => {
    return userTransactions.filter(
      t => t.type === 'Earn' || t.category === 'daily_checkin' || t.category === 'ad_watch' || t.category === 'task' || t.category === 'referral'
    );
  }, [userTransactions]);

  const tournamentTransactions = React.useMemo(() => {
    return userTransactions.filter(
      t => t.type === 'TournamentWin' || t.type === 'TournamentEntry' || t.category === 'tournament_win' || t.category === 'tournament_entry'
    );
  }, [userTransactions]);

  const withdrawalTransactions = React.useMemo(() => {
    return userTransactions.filter(
      t => t.type === 'Withdrawal' || t.category === 'withdrawal' || t.category === 'gift_code'
    );
  }, [userTransactions]);

  const displayedTransactions = React.useMemo(() => {
    return historyTab === 'earn' ? earnTransactions :
      historyTab === 'tournaments' ? tournamentTransactions :
      historyTab === 'withdrawals' ? withdrawalTransactions :
      userTransactions;
  }, [historyTab, earnTransactions, tournamentTransactions, withdrawalTransactions, userTransactions]);

  const totalEarnedDiamonds = React.useMemo(() => {
    return earnTransactions.reduce((acc, t) => acc + (t.amountDiamonds || 0), 0);
  }, [earnTransactions]);

  const totalTournamentWins = React.useMemo(() => {
    return tournamentTransactions
      .filter(t => t.type === 'TournamentWin' || t.category === 'tournament_win')
      .reduce((acc, t) => acc + (t.amountDiamonds || 0), 0);
  }, [tournamentTransactions]);

  const totalWithdrawnDiamonds = React.useMemo(() => {
    return withdrawalTransactions.reduce((acc, t) => acc + (t.amountDiamonds || 0), 0);
  }, [withdrawalTransactions]);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Free Fire Image Wallpaper */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15">
        <img src={FF_IMAGES.booyahTrophy} alt="Free Fire Booyah Trophy Wallpaper" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090a0f]/90 via-[#090a0f]/80 to-[#090a0f]"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 mb-3 sm:mb-4 backdrop-blur-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-purple-300">Player Diamond Vault</span>
          </div>
          <h1 className="text-2xl sm:text-5xl font-black tracking-tight uppercase">
            Diamond Wallet & Ledger
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            Track your earned Free Fire diamonds from tasks, ads, and tournaments. Withdraw anytime directly as Google Play Redeem Codes!
          </p>
        </div>

        {/* Balance & Overview Card */}
        <div className="relative bg-gradient-to-r from-purple-950/70 via-slate-900/90 to-blue-950/70 border border-purple-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img 
              src={FF_IMAGES.booyahTrophy} 
              alt="Free Fire Booyah Diamond Vault" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-20 object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/80 to-transparent"></div>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div>
              <span className="text-xs uppercase tracking-wider text-purple-300 font-bold">Current Diamond Balance</span>
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-4xl sm:text-6xl">💎</span>
                <span className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-amber-300">
                  {currentUser ? currentUser.diamonds.toLocaleString() : '0'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>100% Free Earn-to-Play • Zero Purchases Required</span>
              </p>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setActiveTab('earn')}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 font-bold text-sm text-white shadow-lg hover:opacity-95 transition-all flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Earn More Diamonds</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('withdraw')}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 font-bold text-sm text-white shadow-lg hover:opacity-95 transition-all flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Withdraw Google Play Code</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Breakdown */}
          <div className="mt-8 pt-6 border-t border-purple-500/20 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            <div className="bg-slate-950/60 border border-purple-500/20 p-4 rounded-2xl">
              <span className="block text-[11px] text-gray-400 uppercase font-semibold">Total Diamonds Won</span>
              <span className="text-lg font-black text-amber-400 mt-1 block">
                {currentUser ? currentUser.totalEarnings.toLocaleString() : '0'} 💎
              </span>
            </div>

            <div className="bg-slate-950/60 border border-purple-500/20 p-4 rounded-2xl">
              <span className="block text-[11px] text-gray-400 uppercase font-semibold">Task & Ad Earnings</span>
              <span className="text-lg font-black text-cyan-400 mt-1 block">
                {totalEarnedDiamonds.toLocaleString()} 💎
              </span>
            </div>

            <div className="bg-slate-950/60 border border-purple-500/20 p-4 rounded-2xl">
              <span className="block text-[11px] text-gray-400 uppercase font-semibold">Tournament Wins</span>
              <span className="text-lg font-black text-purple-400 mt-1 block">
                {totalTournamentWins.toLocaleString()} 💎
              </span>
            </div>

            <div className="bg-slate-950/60 border border-purple-500/20 p-4 rounded-2xl">
              <span className="block text-[11px] text-gray-400 uppercase font-semibold">Redeem Codes Claimed</span>
              <span className="text-lg font-black text-emerald-400 mt-1 block">
                {totalWithdrawnDiamonds.toLocaleString()} 💎
              </span>
            </div>
          </div>
        </div>

        {/* Loop Reminder Banner */}
        <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-300">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-xl bg-purple-600/30 text-purple-300 font-bold uppercase">System Info</span>
            <span>Diamonds cannot be purchased. Earn diamonds via Tasks, Ads, Daily check-ins, and Tournament victories.</span>
          </div>
          <button
            onClick={() => setActiveTab('tournaments')}
            className="text-purple-400 hover:text-purple-300 font-bold flex items-center space-x-1 shrink-0"
          >
            <span>Join Tournaments with Diamonds</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Transaction History Section */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
            <div>
              <h2 className="text-xl font-black text-white">Wallet Activity & History</h2>
              <p className="text-xs text-gray-400">Detailed records of all earned diamonds, tournament fees & prizes, and redeem code vouchers.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-slate-950 border border-purple-500/20 rounded-xl">
              <button
                onClick={() => setHistoryTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  historyTab === 'all' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                All ({userTransactions.length})
              </button>
              <button
                onClick={() => setHistoryTab('earn')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  historyTab === 'earn' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Earn History ({earnTransactions.length})
              </button>
              <button
                onClick={() => setHistoryTab('tournaments')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  historyTab === 'tournaments' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Tournament Rewards ({tournamentTransactions.length})
              </button>
              <button
                onClick={() => setHistoryTab('withdrawals')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  historyTab === 'withdrawals' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Withdrawals ({withdrawalTransactions.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-500/20 text-xs text-gray-400 uppercase">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Diamonds</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Redeem Code / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10 text-sm">
                {displayedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      <p className="text-sm">No transactions recorded in this category yet.</p>
                      <button
                        onClick={() => setActiveTab('earn')}
                        className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-purple-400 hover:text-purple-300"
                      >
                        <span>Start earning diamonds now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ) : (
                  displayedTransactions.map((tx) => {
                    const isCredit = tx.type === 'Earn' || tx.type === 'TournamentWin' || tx.type === 'Credit';
                    return (
                      <tr key={tx.id} className="hover:bg-purple-900/10 transition-colors">
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            tx.type === 'TournamentWin'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                              : isCredit
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                              : tx.type === 'Withdrawal'
                              ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                              : 'bg-red-950/60 text-red-300 border border-red-500/30'
                          }`}>
                            {isCredit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            <span>{tx.type}</span>
                          </span>
                        </td>
                        
                        <td className="py-4 px-4 text-gray-200">
                          <div>{tx.description}</div>
                        </td>

                        <td className={`py-4 px-4 font-black ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isCredit ? '+' : '-'}{tx.amountDiamonds} 💎
                        </td>

                        <td className="py-4 px-4 text-xs text-gray-400">
                          {tx.timestamp}
                        </td>

                        <td className="py-4 px-4">
                          {tx.giftCode ? (
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-300">
                                {tx.giftCode}
                              </span>
                              <button
                                onClick={() => handleCopyCode(tx.id, tx.giftCode!)}
                                className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40"
                                title="Copy Redeem Code"
                              >
                                {copiedCodeId === tx.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-400 font-semibold">{tx.status}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
