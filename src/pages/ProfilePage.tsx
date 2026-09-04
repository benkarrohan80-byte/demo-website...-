import React, { useState } from 'react';
import { 
  User, 
  Tournament, 
  Registration, 
  Transaction 
} from '../types';
import { FF_IMAGES } from '../assets/freeFireAssets';
import { 
  User as UserIcon, 
  Shield, 
  Award, 
  Trophy, 
  Coins, 
  Gamepad2, 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  X, 
  Share2, 
  Key, 
  Lock, 
  Unlock, 
  Phone, 
  Mail, 
  Flame, 
  Sparkles, 
  Crosshair, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Download,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

interface ProfilePageProps {
  currentUser: User | null;
  tournaments: Tournament[];
  registrations: Registration[];
  transactions: Transaction[];
  onUpdateProfile: (updatedData: Partial<User>) => void;
  onResetAccount?: () => void;
  onOpenAuth: () => void;
  setActiveTab: (tab: string) => void;
  onSelectTournament?: (t: Tournament) => void;
}

const AVATAR_OPTIONS = [
  { id: 'alok', name: 'DJ Alok', image: FF_IMAGES.characterAlok },
  { id: 'chrono', name: 'Chrono (CR7)', image: FF_IMAGES.characterChrono },
  { id: 'hayato', name: 'Hayato Bushido', image: FF_IMAGES.characterHayato },
  { id: 'kelly', name: 'Kelly The Swift', image: FF_IMAGES.characterKelly },
  { id: 'moco', name: 'Moco Hacker', image: FF_IMAGES.characterMoco },
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  tournaments,
  registrations,
  transactions,
  onUpdateProfile,
  onResetAccount,
  onOpenAuth,
  setActiveTab,
  onSelectTournament
}) => {
  const [copiedUID, setCopiedUID] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const [copiedRoomPass, setCopiedRoomPass] = useState<string | null>(null);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editInGameId, setEditInGameId] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Account reset states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Tab inside profile: 'overview' | 'tournaments' | 'transactions'
  const [profileTab, setProfileTab] = useState<'overview' | 'tournaments' | 'transactions'>('overview');

  const handlePerformReset = async () => {
    setIsResetting(true);
    if (onResetAccount) {
      await onResetAccount();
    }
    setIsResetting(false);
    setShowResetConfirm(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 5000);
  };

  // Initialize edit fields
  React.useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditInGameId(currentUser.inGameId || '');
      setEditAvatar(currentUser.avatar || FF_IMAGES.characterAlok);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-950/80 border border-purple-500/30 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <UserIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
            Login to Access My Profile
          </h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            Please log in or create an account to view your Free Fire player ID, manage slot reservations, check diamond earnings, and track custom room credentials.
          </p>
          <div>
            <button
              onClick={onOpenAuth}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-red-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            >
              🚀 Login / Register Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter user data
  const userRegistrations = registrations.filter(r => r.userId === currentUser.id);
  const userTransactions = transactions.filter(t => t.userId === currentUser.id);
  
  // Calculate win rate
  const winRate = currentUser.matchesPlayed > 0 
    ? Math.round((currentUser.wins / currentUser.matchesPlayed) * 100) 
    : 0;

  const referralCode = currentUser.referralCode || 'SHX-VIPER2026';

  const handleCopyUID = () => {
    navigator.clipboard.writeText(currentUser.inGameId);
    setCopiedUID(true);
    setTimeout(() => setCopiedUID(false), 2000);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!editInGameId.trim()) {
      alert('Please enter your Free Fire In-Game UID');
      return;
    }

    onUpdateProfile({
      name: editName.trim(),
      inGameId: editInGameId.trim(),
      avatar: editAvatar
    });

    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen py-5 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-5 sm:space-y-8 animate-fadeIn relative overflow-hidden">
      {/* Background Free Fire Image Wallpaper */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15">
        <img src={FF_IMAGES.purgatorySolo} alt="Free Fire Purgatory Wallpaper" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090a0f]/90 via-[#090a0f]/80 to-[#090a0f]"></div>
      </div>

      <div className="relative z-10 space-y-5 sm:space-y-8">
      {/* ======================================================== */}
      {/* 1. HERO PROFILE CARD */}
      {/* ======================================================== */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950/80 border border-purple-500/30 shadow-2xl backdrop-blur-xl">
        {/* Decorative Background Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Banner Pattern with Free Fire Artwork */}
        <div className="h-32 sm:h-44 border-b border-purple-500/20 relative overflow-hidden">
          <img src={FF_IMAGES.channelBanner} alt="Shadow Queen Channel Banner" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          
          <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-600 text-white shadow-lg border border-purple-400">
              {currentUser.tier || 'Grandmaster'}
            </span>
            {currentUser.role === 'admin' && (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-lg border border-red-400">
                🛡️ Admin
              </span>
            )}
          </div>
        </div>

        {/* User Identity Details */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
            
            {/* Avatar & Main Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left w-full sm:w-auto">
              <div className="relative group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-purple-600 via-red-500 to-cyan-400 p-[3px] shadow-2xl overflow-hidden">
                  <img
                    src={currentUser.avatar || FF_IMAGES.characterAlok}
                    alt={currentUser.name}
                    className="w-full h-full object-cover rounded-[22px] bg-slate-900"
                  />
                </div>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setAvatarPickerOpen(true);
                  }}
                  className="absolute bottom-1 right-1 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg border border-purple-400 transition-transform active:scale-95"
                  title="Change Avatar"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                    {currentUser.name}
                  </h1>
                  <span className="text-amber-400 text-lg" title="Verified Free Fire Player">🔥</span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-gray-300">
                  <button
                    onClick={handleCopyUID}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-purple-500/30 text-purple-300 hover:border-purple-400 transition-colors font-mono font-bold"
                    title="Click to copy Free Fire UID"
                  >
                    <span>UID: {currentUser.inGameId}</span>
                    {copiedUID ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  </button>

                  <span className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-slate-900/90 border border-purple-500/20 text-gray-400">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>{currentUser.email}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600 border border-purple-500/40 text-purple-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? 'Close Editor' : 'Edit Profile'}</span>
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                title="Reset account to brand new state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ID</span>
              </button>

              <button
                onClick={() => setActiveTab('wallet')}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
              >
                <span>💎 {currentUser.diamonds.toLocaleString()} Diamonds</span>
              </button>
            </div>
          </div>

          {/* Reset Success Banner */}
          {resetSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center justify-between animate-fadeIn shadow-xl">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>ID poori tarah new account jese reset ho gayi hai! 30 Welcome Diamonds credit ho chuke hain aur tournament/streak fresh shuru ho gayi hai.</span>
              </div>
              <button onClick={() => setResetSuccess(false)} className="text-emerald-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Success Banner */}
          {saveSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Profile updated successfully! Free Fire UID and details saved.</span>
              </div>
              <button onClick={() => setSaveSuccess(false)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* EDIT PROFILE FORM MODAL / COLLAPSIBLE */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="mb-8 p-6 rounded-2xl bg-slate-900/90 border border-purple-500/40 space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-purple-400" />
                  <span>Edit Player Information & Avatar</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Choose Free Fire Character Avatar
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEditAvatar(opt.image)}
                      className={`relative p-1.5 rounded-2xl border transition-all flex flex-col items-center space-y-1 ${
                        editAvatar === opt.image
                          ? 'bg-purple-600/30 border-purple-400 ring-2 ring-purple-400 scale-105'
                          : 'bg-slate-950/60 border-purple-500/20 hover:border-purple-500/50'
                      }`}
                    >
                      <img src={opt.image} alt={opt.name} className="w-14 h-14 rounded-xl object-cover" />
                      <span className="text-[10px] font-bold text-gray-300 truncate w-full text-center">
                        {opt.name}
                      </span>
                      {editAvatar === opt.image && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Player Name / In-Game Name (IGN) *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    placeholder="e.g. ꧁ShadowKiller꧂"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Free Fire UID (Numeric ID) *
                  </label>
                  <input
                    type="text"
                    value={editInGameId}
                    onChange={(e) => setEditInGameId(e.target.value)}
                    required
                    placeholder="e.g. 1928472910"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white text-sm font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-gray-400 hover:text-white text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 2. STATS OVERVIEW CARDS */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/20 text-center space-y-1">
              <div className="flex items-center justify-center space-x-1 text-purple-400 text-xs font-bold uppercase">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Matches</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{currentUser.matchesPlayed || 0}</p>
              <span className="text-[10px] text-gray-400">Total Played</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/20 text-center space-y-1">
              <div className="flex items-center justify-center space-x-1 text-amber-400 text-xs font-bold uppercase">
                <Trophy className="w-3.5 h-3.5" />
                <span>Booyah / Wins</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-400">{currentUser.wins || 0}</p>
              <span className="text-[10px] text-gray-400">Win Rate: {winRate}%</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/20 text-center space-y-1">
              <div className="flex items-center justify-center space-x-1 text-cyan-400 text-xs font-bold uppercase">
                <Coins className="w-3.5 h-3.5" />
                <span>Total Earned</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-cyan-300">{(currentUser.totalEarnings || 0).toLocaleString()} 💎</p>
              <span className="text-[10px] text-gray-400">Diamonds Won</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SECTION TABS */}
      {/* ======================================================== */}
      <div className="flex items-center space-x-2 border-b border-purple-500/20 pb-2">
        <button
          onClick={() => setProfileTab('overview')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 ${
            profileTab === 'overview'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-gray-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>My Overview</span>
        </button>

        <button
          onClick={() => setProfileTab('tournaments')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 ${
            profileTab === 'tournaments'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-gray-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>My Registered Matches ({userRegistrations.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('transactions')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 ${
            profileTab === 'transactions'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-gray-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Diamond History</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB CONTENT: 1. OVERVIEW */}
      {/* ======================================================== */}
      {profileTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: My Active Tournament Passes & Room Credentials */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-purple-500/20 backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-black text-white uppercase tracking-wider">
                    My Custom Room Passes & Slot Allocations
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('tournaments')}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                >
                  <span>Explore Matches</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {userRegistrations.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/50 border border-purple-500/10 text-center space-y-3">
                  <Gamepad2 className="w-10 h-10 mx-auto text-gray-500" />
                  <h4 className="text-sm font-bold text-gray-300">You haven't joined any tournaments yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Browse live Free Fire custom rooms and join with your UID to get guaranteed slot number and room password!
                  </p>
                  <button
                    onClick={() => setActiveTab('tournaments')}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider"
                  >
                    View Tournaments
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userRegistrations.map((reg) => {
                    const match = tournaments.find(t => t.id === reg.tournamentId);
                    const isRoomUnlocked = Boolean(match?.roomId);

                    return (
                      <div
                        key={reg.id}
                        className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 hover:border-purple-500/60 transition-all space-y-4 shadow-lg"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-500/10">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-600 text-white">
                                {reg.game}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-cyan-300 border border-cyan-500/30">
                                {reg.status}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-1">{reg.tournamentTitle}</h3>
                          </div>

                          {/* Fixed Slot Badge */}
                          <div className="flex items-center space-x-2 bg-gradient-to-r from-cyan-950 to-purple-950 border border-cyan-500/40 px-3.5 py-1.5 rounded-xl self-start sm:self-auto shadow-md">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-gray-300">Guaranteed:</span>
                            <span className="text-sm font-mono font-black text-cyan-300">SLOT #{reg.slotNumber}</span>
                          </div>
                        </div>

                        {/* Room Credentials Box */}
                        <div className={`p-4 rounded-xl border ${
                          isRoomUnlocked
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                            : 'bg-slate-950/80 border-purple-500/20 text-gray-400'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                              {isRoomUnlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                              <span>{isRoomUnlocked ? 'Custom Room Credentials (UNLOCKED)' : 'Room ID & Password Locked'}</span>
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {match?.startTime ? `Starts: ${match.startTime}` : 'Match schedule'}
                            </span>
                          </div>

                          {isRoomUnlocked ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                                <div>
                                  <span className="block text-[10px] text-gray-400 uppercase">Room ID</span>
                                  <span className="font-mono text-sm font-black text-white">{match?.roomId}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    if (match?.roomId) {
                                      navigator.clipboard.writeText(match.roomId);
                                      setCopiedRoomId(reg.id);
                                      setTimeout(() => setCopiedRoomId(null), 2000);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1"
                                >
                                  {copiedRoomId === reg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedRoomId === reg.id ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>

                              <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                                <div>
                                  <span className="block text-[10px] text-gray-400 uppercase">Room Password</span>
                                  <span className="font-mono text-sm font-black text-amber-400">{match?.roomPassword || 'None'}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    if (match?.roomPassword) {
                                      navigator.clipboard.writeText(match.roomPassword);
                                      setCopiedRoomPass(reg.id);
                                      setTimeout(() => setCopiedRoomPass(null), 2000);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center space-x-1"
                                >
                                  {copiedRoomPass === reg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedRoomPass === reg.id ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Room ID and Password will be posted by the admin 15 minutes prior to match start. When posted, they will unlock here automatically. Sit strictly in <strong>Slot #{reg.slotNumber}</strong> inside the Free Fire custom room!
                            </p>
                          )}
                        </div>

                        {/* Footer Details */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 pt-1">
                          <span>Team: <strong className="text-white">{reg.teamName || 'Solo'}</strong></span>
                          <span>Entry Paid: <strong className="text-amber-400">{reg.entryFeePaid === 0 ? '🎁 FREE' : `${reg.entryFeePaid} 💎`}</strong></span>
                          {match && (
                            <button
                              onClick={() => {
                                if (onSelectTournament) onSelectTournament(match);
                                setActiveTab('tournaments');
                              }}
                              className="text-purple-400 hover:text-purple-300 font-bold underline"
                            >
                              View Tournament Page →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Referral Card & Quick Earn */}
          <div className="space-y-6">
            
            {/* Referral Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/80 to-slate-950/90 border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <Share2 className="w-5 h-5" />
                <h3 className="text-base font-black uppercase tracking-wider text-white">
                  Refer & Earn Free Diamonds
                </h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Invite your Free Fire squad friends! Share your unique referral code. When they register, you both earn bonus Diamonds.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Your Referral Code</span>
                  <span className="text-base font-mono font-black text-cyan-300 tracking-wider">{referralCode}</span>
                </div>
                <button
                  onClick={handleCopyReferral}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase flex items-center space-x-1 transition-all"
                >
                  {copiedReferral ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReferral ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join me on Shadow X Free Fire Tournament platform! Play daily custom rooms, win instant Diamonds and Google Play Redeem Codes. Use my referral code: ${referralCode}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <span>📲 Share on WhatsApp</span>
              </a>
            </div>

            {/* Quick Actions Card */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-purple-500/20 backdrop-blur-xl shadow-xl space-y-3">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider">
                Quick Shortcuts
              </h3>
              
              <button
                onClick={() => setActiveTab('earn')}
                className="w-full p-3.5 rounded-2xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 text-amber-300 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3 text-xs font-bold">
                  <span className="text-base">💎</span>
                  <span>Daily Bonus & Tasks (Earn Diamonds)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={() => setActiveTab('withdraw')}
                className="w-full p-3.5 rounded-2xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3 text-xs font-bold">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Redeem Google Play Codes</span>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => setActiveTab('wallet')}
                className="w-full p-3.5 rounded-2xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3 text-xs font-bold">
                  <Coins className="w-4 h-4 text-purple-400" />
                  <span>Diamond Wallet & History</span>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </button>
            </div>

            {/* Account Fresh Reset Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/30 via-purple-950/20 to-slate-950 border border-red-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wide">Account Fresh Reset</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/30">Fresh Start</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Sabhi test stats, earnings aur spins reset karein. ID bilkul brand new account jesi ban jayegi with <strong className="text-amber-400">30 Welcome Diamonds</strong>.
                </p>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ID Now</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 2. MY REGISTERED MATCHES */}
      {/* ======================================================== */}
      {profileTab === 'tournaments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              All My Registered Tournaments ({userRegistrations.length})
            </h2>
            <button
              onClick={() => setActiveTab('tournaments')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase"
            >
              + Join More Matches
            </button>
          </div>

          {userRegistrations.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-950/80 border border-purple-500/20 text-center space-y-4">
              <Gamepad2 className="w-12 h-12 mx-auto text-gray-500" />
              <h3 className="text-base font-bold text-gray-300">No Tournament Registrations Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Join our upcoming Free Fire tournaments, pick your favorite slot, and compete for massive diamond prize pools!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userRegistrations.map((reg) => {
                const match = tournaments.find(t => t.id === reg.tournamentId);
                return (
                  <div
                    key={reg.id}
                    className="p-5 rounded-2xl bg-slate-950/90 border border-purple-500/30 space-y-4 shadow-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-600 text-white">
                          {reg.game}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1.5">{reg.tournamentTitle}</h3>
                        <p className="text-xs text-gray-400">Team: {reg.teamName || 'Solo'}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-center">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold">Slot</span>
                        <span className="text-base font-mono font-black text-cyan-300">#{reg.slotNumber}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/20 text-xs space-y-1.5 text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Registered At:</span>
                        <span>{new Date(reg.registeredAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Entry Fee:</span>
                        <span className="text-amber-400 font-bold">{reg.entryFeePaid === 0 ? '🎁 FREE' : `${reg.entryFeePaid} 💎`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Custom Room:</span>
                        <span className={match?.roomId ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                          {match?.roomId ? `ID: ${match.roomId}` : 'Posting 15m before match'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT: 3. TRANSACTIONS / DIAMONDS HISTORY */}
      {/* ======================================================== */}
      {profileTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              My Diamond Transaction Log
            </h2>
            <button
              onClick={() => setActiveTab('wallet')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase"
            >
              Go to Full Wallet
            </button>
          </div>

          {userTransactions.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-950/80 border border-purple-500/20 text-center space-y-4">
              <Coins className="w-12 h-12 mx-auto text-gray-500" />
              <h3 className="text-base font-bold text-gray-300">No Transactions Found</h3>
              <p className="text-xs text-gray-500">
                Claim your daily check-in bonus or win tournaments to see diamond activity here.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-950/90 border border-purple-500/20 overflow-hidden shadow-xl">
              <div className="divide-y divide-purple-500/10">
                {userTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-purple-900/10 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl border ${
                        tx.type === 'Credit' || tx.type === 'Earn' || tx.type === 'TournamentWin'
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                          : 'bg-red-950/60 border-red-500/40 text-red-400'
                      }`}>
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{tx.description}</h4>
                        <span className="text-[10px] text-gray-500">{tx.timestamp}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-black ${
                        tx.type === 'Credit' || tx.type === 'Earn' || tx.type === 'TournamentWin'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}>
                        {tx.type === 'Credit' || tx.type === 'Earn' || tx.type === 'TournamentWin' ? '+' : '-'}
                        {tx.amountDiamonds} 💎
                      </span>
                      <span className="block text-[10px] text-gray-400">{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-950 border border-red-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-lg shadow-red-600/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-wide">
                Reset ID to Brand New?
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Kya aap is Free Fire ID ko poori tarah new account jese reset karna chahte hain?
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/20 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-gray-300">
                <span>💎 Wallet Diamonds:</span>
                <span className="font-black text-amber-400">Reset to 30 Welcome 💎</span>
              </div>
              <div className="flex items-center justify-between text-gray-300">
                <span>🎮 Matches & Wins:</span>
                <span className="font-black text-white">Reset to 0</span>
              </div>
              <div className="flex items-center justify-between text-gray-300">
                <span>🔥 Daily Check-in Streak:</span>
                <span className="font-black text-purple-300">Reset to Day 1</span>
              </div>
              <div className="flex items-center justify-between text-gray-300">
                <span>🎡 Booyah Lucky Wheel:</span>
                <span className="font-black text-emerald-400">Ready to Spin</span>
              </div>
              <div className="flex items-center justify-between text-gray-300">
                <span>📋 Tournament Registrations:</span>
                <span className="font-black text-red-300">Cleared (Fresh)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/20 text-gray-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformReset}
                disabled={isResetting}
                className="py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <span>Resetting...</span>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
