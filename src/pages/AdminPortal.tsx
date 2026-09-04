import React, { useState } from 'react';
import { User, Tournament, Transaction, Registration, GameCategory, MatchMode, TournamentStatus, WithdrawalRequest } from '../types';
import { 
  ShieldAlert, Trophy, Users, Coins, TrendingUp, Plus, Edit, Trash2, CheckCircle2, 
  Send, Shield, DollarSign, Key, Eye, EyeOff, Sparkles, MapPin, Clock, AlertCircle, X, Check,
  FileText, History, Gamepad2, ArrowUpRight, Award, UserCheck, UserX
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FF_IMAGES } from '../assets/freeFireAssets';

interface AdminPortalProps {
  currentUser: User | null;
  users: User[];
  tournaments: Tournament[];
  transactions: Transaction[];
  registrations: Registration[];
  withdrawalRequests?: WithdrawalRequest[];
  onUpdateWithdrawalStatus?: (requestId: string, newStatus: 'Pending' | 'Approved' | 'Rejected', giftCode?: string, remarks?: string) => void;
  onCreateTournament: (newT: Tournament) => void;
  onUpdateTournament?: (updated: Tournament) => void;
  onDeleteTournament: (id: string) => void;
  onUpdateRegistrationSlot?: (regId: string, newSlot: number) => void;
  onCancelRegistration?: (regId: string, refund?: boolean) => void;
  onUpdateUserDiamonds: (userId: string, newDiamonds: number) => void;
  onSendNotification: (title: string, message: string) => void;
  onOpenAuth: () => void;
  onDeclareTournamentWinner?: (tournamentId: string, winnerUserId: string) => void;
  onUpdateProfile?: (updatedData: Partial<User>) => void;
}

const revenueData = [
  { month: 'Oct', revenue: 45000, tournaments: 12 },
  { month: 'Nov', revenue: 78000, tournaments: 24 },
  { month: 'Dec', revenue: 120000, tournaments: 35 },
  { month: 'Jan', revenue: 195000, tournaments: 48 },
  { month: 'Feb', revenue: 280000, tournaments: 65 },
  { month: 'Mar', revenue: 350000, tournaments: 82 },
];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  users,
  tournaments,
  transactions,
  registrations,
  withdrawalRequests = [],
  onUpdateWithdrawalStatus,
  onCreateTournament,
  onUpdateTournament,
  onDeleteTournament,
  onUpdateRegistrationSlot,
  onCancelRegistration,
  onUpdateUserDiamonds,
  onSendNotification,
  onOpenAuth,
  onDeclareTournamentWinner,
  onUpdateProfile
}) => {
  // Tabs: Tournaments is default as requested by user
  const [adminTab, setAdminTab] = useState<'tournaments' | 'slots' | 'analytics' | 'users' | 'transactions' | 'notifications'>('tournaments');

  // User Inspector Modal state
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [userInspectorTab, setUserInspectorTab] = useState<'matches' | 'transactions' | 'withdrawals' | 'actions'>('matches');

  // Create tournament form state
  const [newTitle, setNewTitle] = useState('');
  const [newGame, setNewGame] = useState<GameCategory>('Free Fire Battle Royale');
  const [newMode, setNewMode] = useState<MatchMode>('Squad');
  const [newEntryFee, setNewEntryFee] = useState<number>(50);
  const [newPrizePool, setNewPrizePool] = useState<number>(1800);
  const [newPrizeType, setNewPrizeType] = useState<'Diamonds' | 'INR'>('Diamonds');
  const [newPerKillReward, setNewPerKillReward] = useState<number>(10);
  const [newMap, setNewMap] = useState('Bermuda Remastered');
  const [newMaxSlots, setNewMaxSlots] = useState<number>(12); // 12 Squads = 48 players
  const [newBannerUrl, setNewBannerUrl] = useState(FF_IMAGES.tournamentBanner);
  const [newDesc, setNewDesc] = useState('Daily Free Fire custom room hosted by Shadow Queen Gaming. Strict slot allotment & instant diamond rewards.');
  const [newRules, setNewRules] = useState('1. Sit in your allocated slot number only.\n2. No emulators, PC or third-party scripts.\n3. Victory screenshot mandatory for prize claim.');
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newStartTime, setNewStartTime] = useState(() => {
    const d = new Date(Date.now() + 2 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });

  // Quick Room ID & Password Update Modal State
  const [editingRoomT, setEditingRoomT] = useState<Tournament | null>(null);
  const [roomModalId, setRoomModalId] = useState('');
  const [roomModalPass, setRoomModalPass] = useState('');

  // Slot Management Modal State
  const [selectedSlotT, setSelectedSlotT] = useState<Tournament | null>(null);

  // Declare Winner Modal State
  const [selectingWinnerT, setSelectingWinnerT] = useState<Tournament | null>(null);

  // Tournament Filter State ('all' | 'Upcoming' | 'Live' | 'Completed')
  const [tournamentFilter, setTournamentFilter] = useState<'all' | 'Upcoming' | 'Live' | 'Completed'>('all');

  // Full Tournament Details & Winner Selection Modal State
  const [viewingDetailsT, setViewingDetailsT] = useState<Tournament | null>(null);

  // Custom Confirm Cancel Registration Modal State
  const [confirmCancelReg, setConfirmCancelReg] = useState<{
    regId: string;
    userName: string;
    slotNum: number;
    entryFee: number;
    tournamentTitle?: string;
  } | null>(null);

  // Notification broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-purple-500/40 p-8 rounded-3xl text-center space-y-4 max-w-md shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
          <h2 className="text-xl font-bold text-white">Admin Access Required</h2>
          <p className="text-sm text-gray-400">
            Aap filhal regular user account se logged in hain. Admin Panel open karne ke liye niche <strong className="text-purple-300">Enable Admin Mode</strong> button par click karein ya admin account (<span className="text-purple-300 font-mono">admin@shadowx.com</span>) se login karein.
          </p>
          <div className="space-y-3 pt-2">
            {currentUser && onUpdateProfile && (
              <button
                onClick={() => {
                  onUpdateProfile({ role: 'admin' });
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <ShieldAlert className="w-4 h-4 text-amber-300" />
                <span>Enable Admin Mode (1-Click)</span>
              </button>
            )}
            <button
              onClick={onOpenAuth}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-all"
            >
              Switch Account / Login as Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quick template helper to set up standard matches in 1 click
  const applyTemplate = (preset: 'daily_squad' | 'solo_showdown' | 'clash_squad' | '1v1_custom' | '2v2_duo') => {
    if (preset === 'daily_squad') {
      setNewTitle(`Shadow Queen Daily Squad Room #${Math.floor(10 + Math.random() * 90)}`);
      setNewGame('Free Fire Battle Royale');
      setNewMode('Squad');
      setNewMap('Bermuda Remastered');
      setNewMaxSlots(12); // 12 squads
      setNewEntryFee(50);
      setNewPrizePool(1800);
      setNewPrizeType('Diamonds');
      setNewPerKillReward(10);
      setNewBannerUrl(FF_IMAGES.tournamentBanner);
    } else if (preset === 'solo_showdown') {
      setNewTitle(`Free Fire Solo Bermuda Rush #${Math.floor(10 + Math.random() * 90)}`);
      setNewGame('Free Fire Battle Royale');
      setNewMode('Solo');
      setNewMap('Purgatory');
      setNewMaxSlots(48); // 48 solo players
      setNewEntryFee(30);
      setNewPrizePool(1000);
      setNewPrizeType('Diamonds');
      setNewPerKillReward(5);
      setNewBannerUrl(FF_IMAGES.tournamentBanner);
    } else if (preset === 'clash_squad') {
      setNewTitle(`Clash Squad 4v4 High Stakes #${Math.floor(10 + Math.random() * 90)}`);
      setNewGame('Free Fire Clash Squad');
      setNewMode('Clash Squad (4v4)');
      setNewMap('Kalahari');
      setNewMaxSlots(8); // 2 squads / 8 players
      setNewEntryFee(100);
      setNewPrizePool(1200);
      setNewPrizeType('Diamonds');
      setNewPerKillReward(0);
      setNewBannerUrl(FF_IMAGES.tournamentBanner);
    } else if (preset === '1v1_custom') {
      setNewTitle(`1v1 Custom Sniper / Rush Duel #${Math.floor(10 + Math.random() * 90)}`);
      setNewGame('Custom Room');
      setNewMode('1v1 Custom');
      setNewMap('Bermuda Remastered');
      setNewMaxSlots(2); // 2 players
      setNewEntryFee(100);
      setNewPrizePool(180);
      setNewPrizeType('Diamonds');
      setNewPerKillReward(0);
      setNewBannerUrl(FF_IMAGES.tournamentBanner);
    } else if (preset === '2v2_duo') {
      setNewTitle(`2v2 Duo Custom Clash #${Math.floor(10 + Math.random() * 90)}`);
      setNewGame('Custom Room');
      setNewMode('2v2 Custom');
      setNewMap('Alpine');
      setNewMaxSlots(4); // 4 players
      setNewEntryFee(60);
      setNewPrizePool(200);
      setNewPrizeType('Diamonds');
      setNewPerKillReward(0);
      setNewBannerUrl(FF_IMAGES.tournamentBanner);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rulesList = newRules.split('\n').map(r => r.trim()).filter(Boolean);

    const created: Tournament = {
      id: `t_${Date.now()}`,
      title: newTitle || 'Shadow Queen Custom Room',
      game: newGame,
      mode: newMode,
      entryFee: Number(newEntryFee) || 0,
      prizePool: Number(newPrizePool) || 0,
      prizeType: newPrizeType,
      perKillReward: Number(newPerKillReward) || 0,
      startTime: new Date(newStartTime).toISOString(),
      status: 'Upcoming',
      map: newMap,
      maxSlots: Number(newMaxSlots) || 12,
      registeredCount: 0,
      bannerUrl: FF_IMAGES.tournamentBanner,
      description: newDesc,
      rules: rulesList.length > 0 ? rulesList : ['Sit in your assigned slot number.', 'No emulators or third-party scripts.'],
      roomId: newRoomId.trim() || undefined,
      roomPassword: newRoomPassword.trim() || undefined
    };

    onCreateTournament(created);
    alert(`Tournament "${created.title}" successfully hosted! Slots 1 to ${created.maxSlots} are now open.`);
    // Reset inputs
    setNewTitle('');
    setNewRoomId('');
    setNewRoomPassword('');
  };

  const handleSaveRoomCredentials = () => {
    if (!editingRoomT || !onUpdateTournament) return;
    const updated = {
      ...editingRoomT,
      roomId: roomModalId.trim(),
      roomPassword: roomModalPass.trim()
    };
    onUpdateTournament(updated);
    setEditingRoomT(null);
    alert(`Room ID & Password saved for "${updated.title}"! Only confirmed paid players will now see these credentials.`);
  };

  const handleStatusChange = (t: Tournament, newStatus: TournamentStatus) => {
    if (!onUpdateTournament) return;
    onUpdateTournament({ ...t, status: newStatus });
    if (newStatus === 'Completed' && !t.winnerUserId) {
      setSelectingWinnerT(t);
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (broadcastTitle && broadcastMsg) {
      onSendNotification(broadcastTitle, broadcastMsg);
      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastMsg('');
      setTimeout(() => setBroadcastSuccess(false), 3500);
    }
  };

  // Slot calculations for selected tournament in Slot modal
  const currentSlotTournament = selectedSlotT || tournaments[0] || null;
  const currentSlotRegistrations = currentSlotTournament
    ? registrations.filter(r => r.tournamentId === currentSlotTournament.id && r.status === 'Confirmed')
    : [];

  return (
    <div className="min-h-screen bg-[#090a0f] text-white py-6 sm:py-10 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Free Fire Image Wallpaper */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15">
        <img src={FF_IMAGES.heroBanner} alt="Free Fire Hero Banner Wallpaper" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090a0f]/90 via-[#090a0f]/80 to-[#090a0f]"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8 relative z-10">
        
        {/* Header Banner */}
        <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-900/50 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Tournament Host Center</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Manage Custom Rooms & Tournaments
            </h1>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              Host any Free Fire match (Solo, Duo, Squad, Clash Squad 4v4, 1v1 Room). Set entry fees, manage guaranteed slots, and securely publish Room ID & Password strictly to paid participants.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <div className="bg-slate-950/80 border border-purple-500/30 px-5 py-3 rounded-2xl text-center">
              <span className="block text-[11px] text-gray-400 uppercase font-semibold">Active Tournaments</span>
              <span className="text-2xl font-black text-purple-400">{tournaments.length}</span>
            </div>
            <div className="bg-slate-950/80 border border-cyan-500/30 px-5 py-3 rounded-2xl text-center">
              <span className="block text-[11px] text-gray-400 uppercase font-semibold">Total Players</span>
              <span className="text-2xl font-black text-cyan-300">{users.length}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl">
          <button
            onClick={() => setAdminTab('tournaments')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
              adminTab === 'tournaments'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Host & Manage Tournaments</span>
          </button>
          
          <button
            onClick={() => setAdminTab('slots')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
              adminTab === 'slots'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Slot Roster & Players</span>
          </button>

          <button
            onClick={() => setAdminTab('analytics')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
              adminTab === 'analytics'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Platform Stats</span>
          </button>

          <button
            onClick={() => setAdminTab('users')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
              adminTab === 'users'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Users & Diamonds</span>
          </button>

          <button
            onClick={() => setAdminTab('transactions')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
              adminTab === 'transactions'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Transactions</span>
          </button>

          <button
            onClick={() => setAdminTab('notifications')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
              adminTab === 'notifications'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Broadcast Alerts</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: Host & Manage Tournaments (Core User Request) */}
        {/* ======================================================== */}
        {adminTab === 'tournaments' && (
          <div className="space-y-10">
            
            {/* Create / Host Form */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center space-x-2">
                    <Plus className="w-5 h-5 text-purple-400" />
                    <span>Host a New Tournament / Custom Room</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Create any custom room with custom slots and entry fees. Room ID & Password will be locked for non-paying users.
                  </p>
                </div>

                {/* 1-Click Match Quick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-purple-300 font-bold uppercase tracking-wider">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyTemplate('daily_squad')}
                    className="px-2.5 py-1.5 bg-purple-950/70 border border-purple-500/40 rounded-lg text-[11px] font-bold text-purple-200 hover:bg-purple-900 hover:text-white transition-all"
                  >
                    ⚡ Squad (12 Slots)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('solo_showdown')}
                    className="px-2.5 py-1.5 bg-purple-950/70 border border-purple-500/40 rounded-lg text-[11px] font-bold text-purple-200 hover:bg-purple-900 hover:text-white transition-all"
                  >
                    ⚡ Solo (48 Slots)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('clash_squad')}
                    className="px-2.5 py-1.5 bg-purple-950/70 border border-purple-500/40 rounded-lg text-[11px] font-bold text-purple-200 hover:bg-purple-900 hover:text-white transition-all"
                  >
                    ⚡ CS 4v4 (8 Slots)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('1v1_custom')}
                    className="px-2.5 py-1.5 bg-purple-950/70 border border-purple-500/40 rounded-lg text-[11px] font-bold text-purple-200 hover:bg-purple-900 hover:text-white transition-all"
                  >
                    ⚡ 1v1 Room
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-6">
                
                {/* Row 1: Title & Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase">Match Title / Name</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Shadow Queen Daily Squad Room #12"
                      className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase">Game Category</label>
                    <select
                      value={newGame}
                      onChange={(e) => setNewGame(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                    >
                      <option value="Battle Royale">Battle Royale</option>
                      <option value="Clash Squad">Clash Squad</option>
                      <option value="Lone Wolf">Lone Wolf</option>
                      <option value="Free Fire Battle Royale">Free Fire Battle Royale</option>
                      <option value="Free Fire Clash Squad">Free Fire Clash Squad</option>
                      <option value="Custom Room">Custom Room (1v1 / 2v2 / Fun)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase">Match Mode</label>
                    <select
                      value={newMode}
                      onChange={(e) => {
                        const m = e.target.value as MatchMode;
                        setNewMode(m);
                        if (m === 'Solo') setNewMaxSlots(48);
                        else if (m === 'Duo') setNewMaxSlots(24);
                        else if (m === 'Squad') setNewMaxSlots(12);
                        else if (m === '6v6') setNewMaxSlots(12);
                        else if (m === 'Clash Squad (4v4)') setNewMaxSlots(8);
                        else if (m === '1v1 Custom') setNewMaxSlots(2);
                        else if (m === '2v2 Custom') setNewMaxSlots(4);
                      }}
                      className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                    >
                      <option value="Squad">Squad (Teams)</option>
                      <option value="Solo">Solo (Single Players)</option>
                      <option value="Duo">Duo (Pairs)</option>
                      <option value="6v6">6v6 (12 Players)</option>
                      <option value="Clash Squad (4v4)">Clash Squad (4v4)</option>
                      <option value="1v1 Custom">1v1 Custom Room</option>
                      <option value="2v2 Custom">2v2 Custom Room</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Map, Slots, Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase">Free Fire Map</label>
                    <select
                      value={newMap}
                      onChange={(e) => setNewMap(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                    >
                      <option value="Bermuda Remastered">Bermuda Remastered</option>
                      <option value="Bermuda">Bermuda (Classic)</option>
                      <option value="Purgatory">Purgatory</option>
                      <option value="Kalahari">Kalahari</option>
                      <option value="Alpine">Alpine</option>
                      <option value="Nexterra">Nexterra</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase">
                      Total Fixed Slots (Numbered 1 to {newMaxSlots})
                    </label>
                    <input
                      type="number"
                      required
                      min={2}
                      max={48}
                      value={newMaxSlots}
                      onChange={(e) => setNewMaxSlots(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">Each registrant gets a guaranteed fixed slot number.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase">Match Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                {/* Row 3: Economics (Entry Fee, Prize Pool, Per Kill) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-purple-950/20 p-4 rounded-2xl border border-purple-500/20">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase">
                      Entry Fee (Diamonds 💎)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newEntryFee}
                      onChange={(e) => setNewEntryFee(Number(e.target.value))}
                      placeholder="0 for Free Entry"
                      className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400 font-bold text-cyan-300"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">Set 0 for free community custom room.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase">
                      Total Prize Pool (Diamonds 💎)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min={0}
                        value={newPrizePool}
                        onChange={(e) => setNewPrizePool(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400 font-bold text-amber-300"
                      />
                      <div className="px-3.5 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-amber-300 text-xs font-bold flex items-center space-x-1 shrink-0">
                        <span>💎 Diamonds</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase">
                      Per Kill Bounty (Optional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newPerKillReward}
                      onChange={(e) => setNewPerKillReward(Number(e.target.value))}
                      placeholder="e.g. 5💎 per kill"
                      className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">Additional bonus for aggressive rushers.</span>
                  </div>
                </div>

                {/* Row 4: Custom Room ID & Password (Strict Access Control) */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/40 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase text-purple-200 tracking-wider">
                      Free Fire Room ID & Password (Protected Access)
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Aap Room ID & Pass abhi bhi daal sakte hain, ya match se 15 minute pehle update kar sakte hain. <strong className="text-purple-300">Sirf un players ko dikhega jinhone entry fee pay karke slot book kiya hai!</strong>
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase">Room ID (In-Game)</label>
                      <input
                        type="text"
                        value={newRoomId}
                        onChange={(e) => setNewRoomId(e.target.value)}
                        placeholder="e.g. 58923014 (or leave blank to set later)"
                        className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase">Room Password</label>
                      <input
                        type="text"
                        value={newRoomPassword}
                        onChange={(e) => setNewRoomPassword(e.target.value)}
                        placeholder="e.g. 1234 or FIREX"
                        className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs font-mono font-bold text-red-300 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Rules & Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase">Match Rules & Notes</label>
                  <textarea
                    rows={3}
                    value={newRules}
                    onChange={(e) => setNewRules(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400 font-mono resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm uppercase tracking-wider shadow-xl shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>Publish Tournament & Open Slot Registration</span>
                </button>

              </form>
            </div>

            {/* Existing Tournaments Management Table */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span>Hosted Tournaments & Custom Rooms</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage active matches, view full details, declare winners, and control slot rosters.
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-300 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/30">
                  {tournaments.length} Tournaments Total
                </span>
              </div>

              {/* Filter Tabs Bar (All, Upcoming, Live, Completed) */}
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
                <button
                  type="button"
                  onClick={() => setTournamentFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tournamentFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-950 text-gray-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  All ({tournaments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTournamentFilter('Upcoming')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tournamentFilter === 'Upcoming'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-950 text-gray-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Upcoming ({tournaments.filter(t => t.status === 'Upcoming').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTournamentFilter('Live')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tournamentFilter === 'Live'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30 animate-pulse'
                      : 'bg-slate-950 text-gray-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  🔴 Live Now ({tournaments.filter(t => t.status === 'Live').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTournamentFilter('Completed')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    tournamentFilter === 'Completed'
                      ? 'bg-amber-500 text-black font-black shadow-lg shadow-amber-500/30'
                      : 'bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/50'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Completed / Past Tournaments 🏆 ({tournaments.filter(t => t.status === 'Completed').length})</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-purple-500/20 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Tournament</th>
                      <th className="py-3 px-4">Mode & Map</th>
                      <th className="py-3 px-4">Slots Filled</th>
                      <th className="py-3 px-4">Fee / Prize</th>
                      <th className="py-3 px-4">Room ID & Pass</th>
                      <th className="py-3 px-4">Match Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10 text-sm">
                    {tournaments
                      .filter(t => tournamentFilter === 'all' || t.status === tournamentFilter)
                      .map((t) => {
                      const tRegs = registrations.filter(r => r.tournamentId === t.id && r.status === 'Confirmed');
                      const hasRoomCreds = Boolean(t.roomId && t.roomPassword);

                      return (
                        <tr key={t.id} className="hover:bg-purple-950/20 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-white max-w-xs truncate">{t.title}</div>
                            <div className="text-[11px] text-gray-400 flex items-center space-x-2 mt-0.5">
                              <Clock className="w-3 h-3 text-purple-400" />
                              <span>{new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(t.startTime).toLocaleDateString()}</span>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-950 text-purple-300 border border-purple-500/30 inline-block">
                              {t.mode}
                            </span>
                            <div className="text-[11px] text-gray-400 mt-1 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-red-400" />
                              <span>{t.map}</span>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <span className={`font-bold text-xs ${
                                t.registeredCount >= t.maxSlots ? 'text-rose-400 font-black' : 'text-white'
                              }`}>
                                {t.registeredCount} / {t.maxSlots}
                              </span>
                              {t.registeredCount >= t.maxSlots && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-500/50">
                                  FULL
                                </span>
                              )}
                              <button
                                onClick={() => setSelectedSlotT(t)}
                                className="px-2 py-0.5 bg-purple-900/50 hover:bg-purple-800 text-purple-300 rounded text-[11px] font-bold border border-purple-500/30 transition-colors cursor-pointer"
                              >
                                View Slots
                              </button>
                            </div>
                            <div className="w-24 h-1.5 bg-slate-950 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  t.registeredCount >= t.maxSlots 
                                    ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                                    : 'bg-gradient-to-r from-purple-500 to-cyan-400'
                                }`}
                                style={{ width: `${Math.min(100, (t.registeredCount / t.maxSlots) * 100)}%` }}
                              ></div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-bold text-xs">
                              {t.entryFee === 0 ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-black">
                                  FREE ENTRY
                                </span>
                              ) : (
                                <span className="text-cyan-300">{t.entryFee} 💎</span>
                              )}
                            </div>
                            <div className="text-[11px] text-amber-400 font-semibold mt-1">
                              Prize: {t.prizePool} {t.prizeType || '💎'}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {hasRoomCreds ? (
                              <div className="space-y-1">
                                <div className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-purple-500/20 inline-block">
                                  ID: {t.roomId}
                                </div>
                                <div className="text-xs font-mono font-bold text-red-400 bg-slate-950 px-2 py-0.5 rounded border border-purple-500/20 block w-fit">
                                  Pass: {t.roomPassword}
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingRoomT(t);
                                    setRoomModalId(t.roomId || '');
                                    setRoomModalPass(t.roomPassword || '');
                                  }}
                                  className="text-[10px] text-purple-300 hover:text-white underline block"
                                >
                                  Edit Credentials
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingRoomT(t);
                                  setRoomModalId('');
                                  setRoomModalPass('');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500 hover:text-black transition-all flex items-center space-x-1.5"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>Set Room ID & Pass</span>
                              </button>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex flex-col space-y-1">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black text-center uppercase tracking-wider ${
                                t.status === 'Live' ? 'bg-red-600 text-white animate-pulse' :
                                t.status === 'Completed' ? 'bg-slate-700 text-gray-300' : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                              }`}>
                                {t.status}
                              </span>
                              <div className="flex items-center space-x-1 pt-1">
                                <button
                                  onClick={() => handleStatusChange(t, 'Upcoming')}
                                  title="Mark Upcoming"
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${t.status === 'Upcoming' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                  Up
                                </button>
                                <button
                                  onClick={() => handleStatusChange(t, 'Live')}
                                  title="Set Live"
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${t.status === 'Live' ? 'bg-red-600 text-white font-bold' : 'text-gray-400 hover:text-red-400'}`}
                                >
                                  Live
                                </button>
                                <button
                                  onClick={() => handleStatusChange(t, 'Completed')}
                                  title="Set Completed"
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${t.status === 'Completed' ? 'bg-slate-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                  End
                                </button>
                              </div>
                              {t.status === 'Completed' && (
                                t.winnerUserId ? (
                                  <div className="mt-1.5 p-1 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 font-bold flex items-center space-x-1 max-w-[130px]" title={`Winner: ${t.winnerName}`}>
                                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span className="truncate">Win: {t.winnerName}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectingWinnerT(t)}
                                    className="mt-1.5 w-full max-w-[130px] px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black transition-all flex items-center justify-center space-x-1"
                                  >
                                    <Trophy className="w-3 h-3 shrink-0" />
                                    <span>Set Winner</span>
                                  </button>
                                )
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setViewingDetailsT(t)}
                                className="px-2.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/30 text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
                                title="View Full Match Details & Declare Winner"
                              >
                                <Eye className="w-3.5 h-3.5 text-purple-300" />
                                <span className="hidden sm:inline">Details</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${t.title}"? This cannot be undone.`)) {
                                    onDeleteTournament(t.id);
                                  }
                                }}
                                className="p-2 rounded-xl bg-red-950/50 text-red-400 hover:bg-red-900 hover:text-white transition-colors border border-red-500/30 cursor-pointer"
                                title="Delete Tournament"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: Slot Roster & Player Allocations */}
        {/* ======================================================== */}
        {adminTab === 'slots' && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>Fixed Slot Allocation Board</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  View every slot number in the match, see who booked it, check their In-Game UID, or free up slots.
                </p>
              </div>

              {/* Tournament Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400 uppercase font-semibold">Select Match:</span>
                <select
                  value={selectedSlotT ? selectedSlotT.id : (tournaments[0]?.id || '')}
                  onChange={(e) => {
                    const found = tournaments.find(t => t.id === e.target.value);
                    if (found) setSelectedSlotT(found);
                  }}
                  className="px-3 py-2 bg-slate-950 border border-purple-500/40 rounded-xl text-xs font-bold text-white focus:outline-none"
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.mode} • {t.registeredCount}/{t.maxSlots} Slots)</option>
                  ))}
                </select>
              </div>
            </div>

            {currentSlotTournament ? (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-white text-base">{currentSlotTournament.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Map: {currentSlotTournament.map} • Mode: {currentSlotTournament.mode} • Entry: {currentSlotTournament.entryFee === 0 ? 'FREE' : `${currentSlotTournament.entryFee} 💎`} • Max Slots: {currentSlotTournament.maxSlots}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
                      {currentSlotRegistrations.length} Occupied Slots
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-300 font-bold">
                      {currentSlotTournament.maxSlots - currentSlotRegistrations.length} Vacant Slots
                    </span>
                  </div>
                </div>

                {/* Slot Grid Representation */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array.from({ length: currentSlotTournament.maxSlots }, (_, i) => i + 1).map((slotNum) => {
                    const occupiedReg = currentSlotRegistrations.find(r => r.slotNumber === slotNum);

                    return (
                      <div
                        key={slotNum}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                          occupiedReg
                            ? 'bg-purple-950/50 border-purple-500/50 shadow-lg shadow-purple-950/40'
                            : 'bg-slate-950/60 border-purple-500/10 text-gray-500 border-dashed'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            occupiedReg ? 'bg-purple-600 text-white' : 'bg-slate-800 text-gray-400'
                          }`}>
                            Slot #{slotNum}
                          </span>
                          {occupiedReg && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          )}
                        </div>

                        {occupiedReg ? (
                          <div className="space-y-1">
                            <p className="font-bold text-white text-xs truncate" title={occupiedReg.userName}>
                              {occupiedReg.userName}
                            </p>
                            <p className="text-[10px] font-mono text-purple-300 truncate">
                              UID: {occupiedReg.inGameId || 'FF_Player'}
                            </p>
                            {occupiedReg.teamName && (
                              <p className="text-[10px] text-purple-300 font-semibold truncate">
                                🛡️ {occupiedReg.teamName}
                              </p>
                            )}
                            {occupiedReg.teammates && occupiedReg.teammates.length > 0 && (
                              <div className="text-[9px] text-gray-300 bg-slate-950/80 p-1.5 rounded border border-purple-500/20 space-y-0.5">
                                <span className="text-purple-400 font-bold block">Squad Members ({occupiedReg.teammates.length}):</span>
                                <div className="truncate font-mono text-gray-200">
                                  {occupiedReg.teammates.join(', ')}
                                </div>
                              </div>
                            )}
                            <div className="pt-2">
                              {onCancelRegistration && (
                                <button
                                  onClick={() => {
                                    setConfirmCancelReg({
                                      regId: occupiedReg.id,
                                      userName: occupiedReg.userName,
                                      slotNum: slotNum,
                                      entryFee: occupiedReg.entryFeePaid,
                                      tournamentTitle: currentSlotTournament.title
                                    });
                                  }}
                                  className="w-full py-1.5 rounded-xl bg-red-950/80 hover:bg-red-600 border border-red-500/40 text-red-200 hover:text-white text-[10px] font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-md"
                                  title={`Remove ${occupiedReg.userName} from slot and refund fee`}
                                >
                                  <UserX className="w-3 h-3" />
                                  <span>Remove Player</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="py-3 text-center">
                            <p className="text-xs font-semibold text-gray-500">Vacant</p>
                            <p className="text-[10px] text-gray-600">Available for join</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No tournaments available to display slots.</p>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: Platform Analytics */}
        {/* ======================================================== */}
        {adminTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900/80 border border-purple-500/30 p-6 rounded-3xl">
                <span className="block text-xs font-bold text-gray-400 uppercase">Gross Ticket Volume</span>
                <span className="text-2xl font-black text-cyan-400 mt-1 block">💎 48,200</span>
                <span className="text-xs text-emerald-400 mt-2 block font-semibold">+24.5% vs last week</span>
              </div>
              <div className="bg-slate-900/80 border border-purple-500/30 p-6 rounded-3xl">
                <span className="block text-xs font-bold text-gray-400 uppercase">Platform Profit Retained</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">💎 14,800</span>
                <span className="text-xs text-purple-300 mt-2 block font-semibold">Guaranteed ~30% spread</span>
              </div>
              <div className="bg-slate-900/80 border border-purple-500/30 p-6 rounded-3xl">
                <span className="block text-xs font-bold text-gray-400 uppercase">Registered Gamers</span>
                <span className="text-2xl font-black text-white mt-1 block">{users.length}</span>
                <span className="text-xs text-cyan-400 mt-2 block font-semibold">Active Free Fire players</span>
              </div>
              <div className="bg-slate-900/80 border border-purple-500/30 p-6 rounded-3xl">
                <span className="block text-xs font-bold text-gray-400 uppercase">Total Completed Matches</span>
                <span className="text-2xl font-black text-purple-400 mt-1 block">184</span>
                <span className="text-xs text-emerald-400 mt-2 block font-semibold">100% fair play room rate</span>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 p-6 sm:p-8 rounded-3xl">
              <h3 className="text-lg font-bold text-white mb-6">Esports Diamond Turnover (Monthly Revenue)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e1065" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#090a0f', borderColor: '#8b5cf6', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: Users & Diamonds Management */}
        {/* ======================================================== */}
        {adminTab === 'users' && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-white mb-6">Manage User Accounts & Diamonds</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-purple-500/20 text-xs text-gray-400 uppercase">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">In-Game UID</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Diamonds 💎</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10 text-sm">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-purple-950/10 transition-colors">
                      <td className="py-4 px-4 flex items-center space-x-3">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <span className="font-bold text-white block">{u.name}</span>
                          <span className="text-[11px] text-gray-400">{u.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-purple-300 text-xs">{u.inGameId}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          u.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-gray-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-cyan-300">{u.diamonds} 💎</td>
                      <td className="py-4 px-4 text-purple-300">{u.tier}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUserForDetails(u);
                              setUserInspectorTab('matches');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-purple-600/20"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>User Activity & Info</span>
                          </button>
                          <button
                            onClick={() => {
                              const val = prompt(`Adjust diamonds balance for ${u.name}:`, String(u.diamonds));
                              if (val !== null && !isNaN(Number(val))) {
                                onUpdateUserDiamonds(u.id, Number(val));
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
                          >
                            Edit Diamonds
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: Transactions */}
        {/* ======================================================== */}
        {adminTab === 'transactions' && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-white mb-6">Platform Transactions History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-purple-500/20 text-xs text-gray-400 uppercase">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Diamonds</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10 text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-purple-950/10 transition-colors">
                      <td className="py-4 px-4 font-bold text-white">{tx.userName}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          tx.type === 'Credit' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300 text-xs">{tx.description}</td>
                      <td className="py-4 px-4 font-bold text-cyan-300">{tx.amountDiamonds} 💎</td>
                      <td className="py-4 px-4 text-xs text-gray-400">{tx.timestamp}</td>
                      <td className="py-4 px-4 text-emerald-400 font-semibold">{tx.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: Broadcast Notifications */}
        {/* ======================================================== */}
        {adminTab === 'notifications' && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-xl font-black text-white flex items-center space-x-2">
                <Send className="w-5 h-5 text-purple-400" />
                <span>Send Platform Broadcast Notification</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Broadcast announcements, match schedule reminders, or reward releases directly to players' notification bells.
              </p>
            </div>
            
            {broadcastSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs text-center flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Notification successfully broadcasted to all active players!</span>
              </div>
            )}

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase">Notification Title</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="🔥 Weekend Free Fire Clash Squad 4v4 is Live!"
                  className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase">Message Body</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Free Fire Custom Room starts at 8:00 PM. All paid players must check their Slot Number in Tournaments page."
                  className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400 resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Broadcast to All Users</span>
              </button>
            </form>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* QUICK ROOM ID & PASSWORD MODAL */}
      {/* ======================================================== */}
      {editingRoomT && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
            <button
              onClick={() => setEditingRoomT(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Key className="w-4 h-4" />
                <span>Publish Room Credentials</span>
              </div>
              <h3 className="text-lg font-bold text-white">{editingRoomT.title}</h3>
              <p className="text-xs text-gray-400">
                In-game Free Fire Room ID & Password save karne ke baad, sirf paid players ko unki screen par dikhega.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase">Free Fire Room ID</label>
                <input
                  type="text"
                  value={roomModalId}
                  onChange={(e) => setRoomModalId(e.target.value)}
                  placeholder="e.g. 58923014"
                  className="w-full px-4 py-3 bg-slate-950 border border-purple-500/40 rounded-xl text-white font-mono font-bold text-sm text-cyan-300 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase">Room Password</label>
                <input
                  type="text"
                  value={roomModalPass}
                  onChange={(e) => setRoomModalPass(e.target.value)}
                  placeholder="e.g. 1234 or SHX99"
                  className="w-full px-4 py-3 bg-slate-950 border border-purple-500/40 rounded-xl text-white font-mono font-bold text-sm text-red-300 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 text-[11px] text-purple-200">
                🔒 Security Note: Non-registered and non-paying users CANNOT see these credentials.
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setEditingRoomT(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-gray-300 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRoomCredentials}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase shadow-lg shadow-purple-600/40"
                >
                  Save & Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* QUICK VIEW SLOTS MODAL */}
      {/* ======================================================== */}
      {selectedSlotT && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-6 relative">
            <button
              onClick={() => setSelectedSlotT(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Slot Allocation</span>
              <h3 className="text-xl font-bold text-white">{selectedSlotT.title}</h3>
              <p className="text-xs text-gray-400 mt-1">
                Total Fixed Slots: {selectedSlotT.maxSlots} • Mode: {selectedSlotT.mode} • Map: {selectedSlotT.map}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: selectedSlotT.maxSlots }, (_, i) => i + 1).map((slotNum) => {
                const reg = registrations.find(r => r.tournamentId === selectedSlotT.id && r.status === 'Confirmed' && r.slotNumber === slotNum);

                return (
                  <div
                    key={slotNum}
                    className={`p-3 rounded-xl border ${
                      reg
                        ? 'bg-purple-950/60 border-purple-500/50 text-white'
                        : 'bg-slate-950/60 border-purple-500/10 text-gray-500 border-dashed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${reg ? 'bg-purple-600 text-white' : 'bg-slate-800 text-gray-400'}`}>
                        Slot #{slotNum}
                      </span>
                      {reg && <span className="text-[10px] text-emerald-400 font-bold">PAID</span>}
                    </div>

                    {reg ? (
                      <div className="space-y-1">
                        <p className="font-bold text-xs truncate">{reg.userName}</p>
                        <p className="text-[10px] font-mono text-purple-300 truncate">UID: {reg.inGameId || 'FF_Player'}</p>
                        {onCancelRegistration && (
                          <button
                            onClick={() => {
                              setConfirmCancelReg({
                                regId: reg.id,
                                userName: reg.userName,
                                slotNum: slotNum,
                                entryFee: reg.entryFeePaid,
                                tournamentTitle: selectedSlotT.title
                              });
                            }}
                            className="mt-1 text-[10px] text-red-400 hover:text-red-300 underline block"
                          >
                            Remove / Free
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-500 py-1 font-medium">Empty</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSlotT(null)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FULL USER INSPECTOR & HISTORY MODAL */}
      {/* ======================================================== */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-4 sm:p-8 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 relative my-auto">
            <button
              onClick={() => setSelectedUserForDetails(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* User Profile Summary Header */}
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-950 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedUserForDetails.avatar}
                  alt={selectedUserForDetails.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/40 shadow-lg"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black text-white">{selectedUserForDetails.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedUserForDetails.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-gray-300'
                    }`}>
                      {selectedUserForDetails.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedUserForDetails.email}</p>
                  <div className="flex items-center space-x-3 mt-2 text-xs">
                    <span className="text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                      FF UID: {selectedUserForDetails.inGameId || 'Not Set'}
                    </span>
                    <span className="text-amber-300 font-bold">
                      Tier: {selectedUserForDetails.tier}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-purple-500/20 gap-2">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Current Diamonds</span>
                  <span className="text-2xl font-black text-cyan-300">{selectedUserForDetails.diamonds} 💎</span>
                </div>
                <button
                  onClick={() => {
                    const val = prompt(`Adjust diamonds balance for ${selectedUserForDetails.name}:`, String(selectedUserForDetails.diamonds));
                    if (val !== null && !isNaN(Number(val))) {
                      onUpdateUserDiamonds(selectedUserForDetails.id, Number(val));
                      setSelectedUserForDetails({ ...selectedUserForDetails, diamonds: Number(val) });
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  Edit Balance
                </button>
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex items-center space-x-2 border-b border-purple-500/20 pb-2 overflow-x-auto">
              <button
                onClick={() => setUserInspectorTab('matches')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                  userInspectorTab === 'matches'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-950 text-gray-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Joined Matches ({
                  tournaments.filter(t => 
                    t.registeredUsers?.includes(selectedUserForDetails.id) || 
                    registrations.some(r => r.tournamentId === t.id && r.userId === selectedUserForDetails.id)
                  ).length
                })</span>
              </button>

              <button
                onClick={() => setUserInspectorTab('transactions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                  userInspectorTab === 'transactions'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-950 text-gray-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Diamond History ({
                  transactions.filter(t => t.userId === selectedUserForDetails.id || t.userName === selectedUserForDetails.name).length
                })</span>
              </button>

              <button
                onClick={() => setUserInspectorTab('withdrawals')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                  userInspectorTab === 'withdrawals'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-950 text-gray-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Withdrawal Requests ({
                  withdrawalRequests.filter(w => w.userId === selectedUserForDetails.id || w.userName === selectedUserForDetails.name).length
                })</span>
              </button>
            </div>

            {/* TAB CONTENT 1: Joined Matches */}
            {userInspectorTab === 'matches' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Gamepad2 className="w-4 h-4 text-purple-400" />
                  <span>Matches Registered & Participated by {selectedUserForDetails.name}</span>
                </h4>

                {(() => {
                  const userRegs = registrations.filter(r => r.userId === selectedUserForDetails.id);
                  const userTourneys = tournaments.filter(t => 
                    t.registeredUsers?.includes(selectedUserForDetails.id) || 
                    userRegs.some(r => r.tournamentId === t.id)
                  );

                  if (userTourneys.length === 0) {
                    return (
                      <div className="py-12 text-center bg-slate-950/60 rounded-2xl border border-purple-500/10">
                        <Gamepad2 className="w-8 h-8 text-purple-400/40 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-semibold">No tournament/match entries found for this user.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-purple-500/20 text-[11px] text-gray-400 uppercase">
                            <th className="py-2.5 px-3">Match Title</th>
                            <th className="py-2.5 px-3">Slot #</th>
                            <th className="py-2.5 px-3">Mode & Map</th>
                            <th className="py-2.5 px-3">Entry Fee</th>
                            <th className="py-2.5 px-3">Prize Pool</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-500/10 text-xs">
                          {userTourneys.map(t => {
                            const reg = userRegs.find(r => r.tournamentId === t.id);
                            return (
                              <tr key={t.id} className="hover:bg-purple-950/20 transition-colors">
                                <td className="py-3 px-3 font-bold text-white">{t.title}</td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono font-bold border border-purple-500/30">
                                    Slot #{reg?.slotNumber || 1}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-gray-300">{t.mode} • {t.map}</td>
                                <td className="py-3 px-3 font-bold text-cyan-300">{t.entryFee} 💎</td>
                                <td className="py-3 px-3 font-bold text-amber-300">{t.prizePool} 💎</td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    t.status === 'Open' ? 'bg-emerald-950 text-emerald-300' :
                                    t.status === 'Live' ? 'bg-amber-950 text-amber-300' :
                                    'bg-slate-800 text-gray-400'
                                  }`}>
                                    {t.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB CONTENT 2: Diamond Transactions */}
            {userInspectorTab === 'transactions' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <History className="w-4 h-4 text-purple-400" />
                  <span>Diamond Transaction Ledger for {selectedUserForDetails.name}</span>
                </h4>

                {(() => {
                  const userTxs = transactions.filter(t => t.userId === selectedUserForDetails.id || t.userName === selectedUserForDetails.name);

                  if (userTxs.length === 0) {
                    return (
                      <div className="py-12 text-center bg-slate-950/60 rounded-2xl border border-purple-500/10">
                        <History className="w-8 h-8 text-purple-400/40 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-semibold">No diamond transaction history found for this user.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-purple-500/20 text-[11px] text-gray-400 uppercase">
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3">Diamonds 💎</th>
                            <th className="py-2.5 px-3">Timestamp</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-500/10 text-xs">
                          {userTxs.map(tx => (
                            <tr key={tx.id} className="hover:bg-purple-950/20 transition-colors">
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tx.type === 'Credit' || tx.type === 'win' || tx.type === 'earn'
                                    ? 'bg-emerald-950 text-emerald-300'
                                    : 'bg-red-950 text-red-300'
                                }`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-white font-medium">{tx.description}</td>
                              <td className="py-3 px-3 font-bold text-cyan-300">{tx.amountDiamonds} 💎</td>
                              <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">{tx.timestamp}</td>
                              <td className="py-3 px-3 font-semibold text-emerald-400">{tx.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB CONTENT 3: Withdrawal Requests */}
            {userInspectorTab === 'withdrawals' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Redeem / Withdrawal History for {selectedUserForDetails.name}</span>
                </h4>

                {(() => {
                  const userWreqs = withdrawalRequests.filter(w => w.userId === selectedUserForDetails.id || w.userName === selectedUserForDetails.name);

                  if (userWreqs.length === 0) {
                    return (
                      <div className="py-12 text-center bg-slate-950/60 rounded-2xl border border-purple-500/10">
                        <DollarSign className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-semibold">No withdrawal requests submitted by this user yet.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {userWreqs.map(wreq => (
                        <div key={wreq.id} className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-sm">₹{wreq.giftCodeAmountINR} Google Play Code</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                wreq.status === 'Approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                                wreq.status === 'Rejected' ? 'bg-red-950 text-red-300 border border-red-500/30' :
                                'bg-amber-950 text-amber-300 border border-amber-500/30 animate-pulse'
                              }`}>
                                {wreq.status}
                              </span>
                            </div>
                            <p className="text-xs text-cyan-300 font-bold mt-1">Cost: {wreq.diamondsCost} Diamonds 💎</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Requested: {wreq.requestedAt} • Target: {wreq.userEmail} (FF UID: {wreq.inGameId || 'N/A'})</p>
                            {wreq.redeemCode && (
                              <div className="mt-2 p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 inline-block">
                                <span className="text-[10px] text-purple-300 font-bold uppercase block">Redeem Code Delivered:</span>
                                <span className="text-xs font-mono font-black text-amber-300 tracking-wider select-all">{wreq.redeemCode}</span>
                              </div>
                            )}
                          </div>

                          {/* Admin Action for Pending Withdrawal */}
                          {wreq.status === 'Pending' && onUpdateWithdrawalStatus && (
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                onClick={() => {
                                  const code = prompt(`Enter Google Play Redeem Code for ₹${wreq.giftCodeAmountINR} (sent to ${wreq.userEmail}):`, 'GOOGLEPLAY-REDEEM-CODE-1234');
                                  if (code) {
                                    onUpdateWithdrawalStatus(wreq.id, 'Approved', code, 'Approved and gift code generated by Admin.');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                              >
                                Approve & Issue Code
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Reject withdrawal request for ${wreq.userName}?`)) {
                                    onUpdateWithdrawalStatus(wreq.id, 'Rejected', undefined, 'Rejected by admin verification.');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-red-950 text-red-300 border border-red-500/30 text-xs font-bold hover:bg-red-900 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs uppercase hover:bg-purple-500 transition-all cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Declare Tournament Winner */}
      {/* ======================================================== */}
      {selectingWinnerT && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-6 relative">
            <button
              onClick={() => setSelectingWinnerT(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950 text-gray-400 hover:text-white border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>Declare Tournament Winner</span>
              </span>
              <h3 className="text-xl font-black text-white mt-1">{selectingWinnerT.title}</h3>
              <p className="text-xs text-gray-400 mt-1">
                Winner will receive the prize pool of <strong className="text-amber-300">{selectingWinnerT.prizePool} {selectingWinnerT.prizeType || 'Diamonds'}</strong> automatically added to their wallet!
              </p>
            </div>

            {/* List of Registered Players */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-300">Select Winner from Registered Players:</h4>
              {(() => {
                const confirmedParticipants = registrations.filter(
                  r => r.tournamentId === selectingWinnerT.id && r.status === 'Confirmed'
                );

                if (confirmedParticipants.length === 0) {
                  return (
                    <div className="py-6 px-4 text-center bg-slate-950/40 rounded-2xl border border-purple-500/10">
                      <p className="text-xs text-gray-400 font-semibold mb-3">No confirmed registrations found for this tournament.</p>
                      <p className="text-xs text-amber-300 font-medium">Please register players first or select any user below.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {confirmedParticipants.map((reg) => (
                      <button
                        key={reg.id}
                        onClick={() => {
                          if (confirm(`Set ${reg.userName} as the winner of "${selectingWinnerT.title}"?`)) {
                            if (onDeclareTournamentWinner) {
                              onDeclareTournamentWinner(selectingWinnerT.id, reg.userId);
                            }
                            setSelectingWinnerT(null);
                          }
                        }}
                        className="w-full p-4 rounded-2xl bg-slate-950 hover:bg-amber-500/10 border border-purple-500/20 hover:border-amber-500/40 transition-all flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 font-bold border border-amber-500/30">
                            #{reg.slotNumber}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-amber-300 transition-colors">{reg.userName}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">UID: {reg.inGameId || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-amber-500 text-black text-[11px] font-black rounded-lg uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                          Select
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* General Users Search / Manual Selector (Backup Override) */}
              <div className="border-t border-purple-500/20 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Manual Override (Select Any Platform User):</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        if (confirm(`Set ${user.name} as the winner of "${selectingWinnerT.title}"?`)) {
                          if (onDeclareTournamentWinner) {
                            onDeclareTournamentWinner(selectingWinnerT.id, user.id);
                          }
                          setSelectingWinnerT(null);
                        }
                      }}
                      className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-amber-500/10 border border-purple-500/10 hover:border-amber-500/30 transition-all flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <img src={user.avatar || FF_IMAGES.characterKelly} alt={user.name} className="w-7 h-7 rounded-full border border-purple-500/20" />
                        <div>
                          <div className="font-bold text-gray-200 text-xs group-hover:text-amber-300 transition-colors">{user.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">InGame ID: {user.inGameId || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-amber-400 font-bold group-hover:underline">Select</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Full Tournament Details & Winner Management */}
      {/* ======================================================== */}
      {viewingDetailsT && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 relative">
            <button
              onClick={() => setViewingDetailsT(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950 text-gray-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title & Badges */}
            <div className="border-b border-purple-500/20 pb-4 pr-10 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  viewingDetailsT.status === 'Live' ? 'bg-red-600 text-white animate-pulse' :
                  viewingDetailsT.status === 'Completed' ? 'bg-amber-500 text-black font-black' : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                }`}>
                  {viewingDetailsT.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-950 text-cyan-300 border border-purple-500/20">
                  {viewingDetailsT.mode}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-950 text-red-300 border border-purple-500/20 flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-red-400 inline" />
                  <span>{viewingDetailsT.map}</span>
                </span>
              </div>

              <h2 className="text-2xl font-black text-white">{viewingDetailsT.title}</h2>
              <div className="text-xs text-gray-400 flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Scheduled: {new Date(viewingDetailsT.startTime).toLocaleString()}</span>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/20">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Entry Fee</div>
                <div className="text-sm font-black text-cyan-300 mt-1">
                  {viewingDetailsT.entryFee === 0 ? 'FREE' : `${viewingDetailsT.entryFee} 💎`}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/20">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Prize Pool</div>
                <div className="text-sm font-black text-amber-400 mt-1">
                  {viewingDetailsT.prizePool} {viewingDetailsT.prizeType || '💎'}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/20">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Players Joined</div>
                <div className="text-sm font-black text-white mt-1">
                  {viewingDetailsT.registeredCount} / {viewingDetailsT.maxSlots}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/20">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Room Credentials</div>
                <div className="text-xs font-mono font-bold text-cyan-300 mt-1 truncate">
                  {viewingDetailsT.roomId ? `ID: ${viewingDetailsT.roomId}` : 'Not set'}
                </div>
              </div>
            </div>

            {/* WINNER HIGHLIGHT SECTION */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-950 to-purple-950/50 border border-amber-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider">Tournament Winner Status</h3>
                    <p className="text-[11px] text-gray-400">Selecting a winner auto-adds prize diamonds & updates profile stats.</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectingWinnerT(viewingDetailsT);
                    setViewingDetailsT(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Award className="w-4 h-4" />
                  <span>{viewingDetailsT.winnerUserId ? 'Change Winner' : 'Declare Winner (+Add Prize)'}</span>
                </button>
              </div>

              {viewingDetailsT.winnerUserId ? (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-amber-400 font-bold uppercase">🏆 Declared 1st Place Champion:</div>
                    <div className="text-base font-black text-white">{viewingDetailsT.winnerName}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">UID / Team: {viewingDetailsT.winnerTeam || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Prize Credited</div>
                    <div className="text-sm font-black text-emerald-400">+{viewingDetailsT.prizePool} 💎</div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/20 text-center text-xs text-gray-300">
                  <span>No winner declared yet for this tournament. Click <strong className="text-amber-300">Declare Winner</strong> above to select from registered players list.</span>
                </div>
              )}
            </div>

            {/* REGISTERED PLAYERS ROSTER TABLE */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Registered Players Roster ({registrations.filter(r => r.tournamentId === viewingDetailsT.id && r.status === 'Confirmed').length})</span>
              </h3>

              {(() => {
                const regsForT = registrations.filter(r => r.tournamentId === viewingDetailsT.id && r.status === 'Confirmed');
                if (regsForT.length === 0) {
                  return (
                    <div className="p-6 text-center bg-slate-950 rounded-2xl border border-purple-500/10 text-xs text-gray-400">
                      No registered players found for this tournament.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto max-h-60 rounded-2xl border border-purple-500/20 bg-slate-950">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-gray-400 uppercase font-bold border-b border-purple-500/20">
                          <th className="py-2.5 px-3">Slot #</th>
                          <th className="py-2.5 px-3">Player / User</th>
                          <th className="py-2.5 px-3">In-Game ID</th>
                          <th className="py-2.5 px-3">Fee Paid</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-500/10 text-gray-300">
                        {regsForT.map((reg) => (
                          <tr key={reg.id} className="hover:bg-purple-950/30 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-amber-300">#{reg.slotNumber}</td>
                            <td className="py-2.5 px-3 font-bold text-white">{reg.userName}</td>
                            <td className="py-2.5 px-3 font-mono text-cyan-300">{reg.inGameId || 'N/A'}</td>
                            <td className="py-2.5 px-3">{reg.entryFeePaid > 0 ? `${reg.entryFeePaid} 💎` : 'FREE'}</td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                {viewingDetailsT.winnerUserId === reg.userId ? (
                                  <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-black text-[10px] uppercase">
                                    🏆 WINNER
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Set ${reg.userName} as the winner of "${viewingDetailsT.title}"?`)) {
                                        if (onDeclareTournamentWinner) {
                                          onDeclareTournamentWinner(viewingDetailsT.id, reg.userId);
                                        }
                                        setViewingDetailsT(null);
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-[10px] uppercase transition-all cursor-pointer"
                                  >
                                    Make Winner
                                  </button>
                                )}

                                {onCancelRegistration && (
                                  <button
                                    onClick={() => {
                                      setConfirmCancelReg({
                                        regId: reg.id,
                                        userName: reg.userName,
                                        slotNum: reg.slotNumber,
                                        entryFee: reg.entryFeePaid,
                                        tournamentTitle: viewingDetailsT.title
                                      });
                                    }}
                                    className="px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white font-bold text-[10px] uppercase border border-red-500/30 transition-all cursor-pointer flex items-center space-x-1"
                                    title={`Remove ${reg.userName} from slot and refund entry fee`}
                                  >
                                    <UserX className="w-3 h-3" />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Room ID / Pass Creds Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/20 space-y-2">
              <h4 className="text-xs font-bold text-gray-300 uppercase">Room ID & Password Credentials:</h4>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <span className="text-gray-500">Room ID: </span>
                  <strong className="text-cyan-300">{viewingDetailsT.roomId || 'Not posted'}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Password: </span>
                  <strong className="text-red-400">{viewingDetailsT.roomPassword || 'Not posted'}</strong>
                </div>
                <button
                  onClick={() => {
                    setEditingRoomT(viewingDetailsT);
                    setRoomModalId(viewingDetailsT.roomId || '');
                    setRoomModalPass(viewingDetailsT.roomPassword || '');
                  }}
                  className="px-3 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-bold border border-purple-500/30 transition-all cursor-pointer"
                >
                  Edit Creds
                </button>
              </div>
            </div>

            {/* Rules */}
            {viewingDetailsT.rules && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase">Match Rules & Info:</h4>
                <div className="p-3 bg-slate-950 rounded-xl text-xs text-gray-300 font-mono whitespace-pre-wrap border border-purple-500/10">
                  {viewingDetailsT.rules}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Custom Confirm Remove / Cancel Registration         */}
      {/* ======================================================== */}
      {confirmCancelReg && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center space-y-5">
            <div className="mx-auto w-16 h-16 bg-red-950/50 border-2 border-red-500/50 rounded-full flex items-center justify-center mb-2">
              <UserX className="w-8 h-8 text-red-400" />
            </div>
            
            <div>
              <h2 className="text-xl font-black text-white">Remove Player?</h2>
              <p className="text-sm text-gray-400 mt-2">
                Are you sure you want to remove <strong className="text-white">{confirmCancelReg.userName}</strong> from <strong className="text-white">Slot #{confirmCancelReg.slotNum}</strong>?
              </p>
              {confirmCancelReg.tournamentTitle && (
                <p className="text-xs text-purple-300 mt-1">{confirmCancelReg.tournamentTitle}</p>
              )}
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-red-500/20 text-sm">
              {confirmCancelReg.entryFee > 0 ? (
                <>
                  <span className="text-gray-400">Refund Amount: </span>
                  <strong className="text-emerald-400">+{confirmCancelReg.entryFee} 💎</strong>
                  <p className="text-[10px] text-gray-500 mt-1">This amount will be added back to the player's wallet automatically.</p>
                </>
              ) : (
                <span className="text-gray-400">This was a <strong className="text-emerald-400">FREE</strong> entry. No refund required.</span>
              )}
            </div>

            <p className="text-[11px] text-red-400 font-bold uppercase tracking-wider">
              This slot will become immediately available for other players to join.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setConfirmCancelReg(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onCancelRegistration) {
                    onCancelRegistration(confirmCancelReg.regId, true);
                  }
                  setConfirmCancelReg(null);
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
