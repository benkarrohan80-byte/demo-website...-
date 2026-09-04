import React, { useState, useEffect } from 'react';
import { Tournament, GameCategory, MatchMode, User, Registration } from '../types';
import { 
  Trophy, Gamepad2, Users, Coins, Clock, MapPin, CheckCircle2, 
  Shield, AlertCircle, ArrowRight, X, Key, Copy, Check, Lock, Unlock, Sparkles, Info
} from 'lucide-react';
import { FF_IMAGES } from '../assets/freeFireAssets';

const cleanGame = (game: string) => {
  if (game.includes('Battle Royale')) return 'Battle Royale ⚔️';
  if (game.includes('Clash Squad')) return 'Clash Squad 🏆';
  if (game.includes('Lone Wolf')) return 'Lone Wolf 🐺';
  return game;
};

const cleanMode = (mode: string) => {
  if (mode === 'Clash Squad (4v4)') return '4v4 Clash 💥';
  if (mode === '1v1 Custom') return '1v1 Custom 🎯';
  if (mode === '2v2 Custom') return '2v2 Custom 🔥';
  return mode; // 'Solo', 'Duo', 'Squad', '6v6'
};

interface TournamentsPageProps {
  tournaments: Tournament[];
  currentUser: User | null;
  registrations: Registration[];
  onRegister: (
    tournament: Tournament, 
    teamName?: string, 
    teammates?: string[], 
    chosenSlot?: number, 
    playerUid?: string
  ) => void;
  onOpenAuth: () => void;
  selectedTournament: Tournament | null;
  setSelectedTournament: (t: Tournament | null) => void;
  setActiveTab?: (tab: string) => void;
}

export const TournamentsPage: React.FC<TournamentsPageProps> = ({
  tournaments,
  currentUser,
  registrations,
  onRegister,
  onOpenAuth,
  selectedTournament,
  setSelectedTournament,
  setActiveTab
}) => {
  const [selectedGame, setSelectedGame] = useState<string>('ALL');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Registration modal state
  const [teamName, setTeamName] = useState('');
  const [leaderUid, setLeaderUid] = useState(currentUser?.inGameId || '');
  const [player1Name, setPlayer1Name] = useState(currentUser?.name || '');
  const [player2Name, setPlayer2Name] = useState('');
  const [player3Name, setPlayer3Name] = useState('');
  const [player4Name, setPlayer4Name] = useState('');
  const [playerUid, setPlayerUid] = useState(currentUser?.inGameId || '');
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
  const [regErrorMsg, setRegErrorMsg] = useState('');

  // Copy buttons feedback
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Sync playerUid & leaderUid when currentUser changes or tournament opens
  useEffect(() => {
    if (currentUser) {
      setPlayerUid(currentUser.inGameId || '');
      setLeaderUid(currentUser.inGameId || '');
      setPlayer1Name(currentUser.name || '');
    }
  }, [currentUser]);

  useEffect(() => {
    setRegErrorMsg('');
    setRegSuccessMsg('');
    setTeamName('');
    setPlayer2Name('');
    setPlayer3Name('');
    setPlayer4Name('');
  }, [selectedTournament]);

  // When a tournament is opened, pick the first free slot automatically
  useEffect(() => {
    if (selectedTournament) {
      const occupied = registrations
        .filter(r => r.tournamentId === selectedTournament.id && r.status === 'Confirmed')
        .map(r => r.slotNumber);

      for (let s = 1; s <= selectedTournament.maxSlots; s++) {
        if (!occupied.includes(s)) {
          setSelectedSlotNumber(s);
          break;
        }
      }
    }
  }, [selectedTournament, registrations]);

  const filteredTournaments = React.useMemo(() => {
    return tournaments.filter(t => {
      if (t.status === 'Completed') return false;
      if (selectedGame !== 'ALL' && t.game !== selectedGame) return false;
      if (selectedMode !== 'ALL' && t.mode !== selectedMode) return false;
      if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
      return true;
    });
  }, [tournaments, selectedGame, selectedMode, selectedStatus]);

  const userRegistrationForSelected = React.useMemo(() => {
    return selectedTournament && currentUser
      ? registrations.find(r => r.userId === currentUser.id && r.tournamentId === selectedTournament.id && r.status === 'Confirmed')
      : null;
  }, [selectedTournament, currentUser, registrations]);

  const isSquad = React.useMemo(() => {
    return selectedTournament
      ? (selectedTournament.mode === 'Squad' || selectedTournament.mode === 'Clash Squad (4v4)' || selectedTournament.mode.toLowerCase().includes('squad'))
      : false;
  }, [selectedTournament]);

  const isDuo = React.useMemo(() => {
    return selectedTournament ? selectedTournament.mode === 'Duo' : false;
  }, [selectedTournament]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!selectedTournament) return;

    if (selectedTournament.registeredCount >= selectedTournament.maxSlots) {
      setRegErrorMsg(`⚠️ Tournament is Full! All ${selectedTournament.maxSlots} slots have already been claimed.`);
      return;
    }

    if (selectedTournament.entryFee > 0 && currentUser.diamonds < selectedTournament.entryFee) {
      setRegErrorMsg(`Insufficient Diamonds! You need ${selectedTournament.entryFee} 💎 but currently have ${currentUser.diamonds} 💎 in your wallet.`);
      return;
    }

    if (!selectedSlotNumber) {
      setRegErrorMsg('Please select an available slot number.');
      return;
    }

    // STRICT SQUAD VALIDATION: All fields required
    if (isSquad) {
      if (!teamName.trim()) {
        setRegErrorMsg('⚠️ Team Name is required! Please enter your Team / Clan Name.');
        return;
      }
      if (!leaderUid.trim()) {
        setRegErrorMsg('⚠️ Leader Free Fire UID is required! Please enter Leader UID.');
        return;
      }
      if (!player1Name.trim()) {
        setRegErrorMsg('⚠️ Player 1 (Leader) In-Game Name is required!');
        return;
      }
      if (!player2Name.trim()) {
        setRegErrorMsg('⚠️ Player 2 In-Game Name is required!');
        return;
      }
      if (!player3Name.trim()) {
        setRegErrorMsg('⚠️ Player 3 In-Game Name is required!');
        return;
      }
      if (!player4Name.trim()) {
        setRegErrorMsg('⚠️ Player 4 In-Game Name is required!');
        return;
      }
    } else if (isDuo) {
      if (!teamName.trim()) {
        setRegErrorMsg('⚠️ Duo Team Name is required!');
        return;
      }
      if (!leaderUid.trim()) {
        setRegErrorMsg('⚠️ Leader Free Fire UID is required!');
        return;
      }
      if (!player1Name.trim() || !player2Name.trim()) {
        setRegErrorMsg('⚠️ Both player In-Game Names are required!');
        return;
      }
    } else {
      // Solo match
      if (!playerUid.trim()) {
        setRegErrorMsg('⚠️ Free Fire In-Game UID is required for host verification.');
        return;
      }
      if (!player1Name.trim()) {
        setRegErrorMsg('⚠️ Player In-Game Name is required.');
        return;
      }
    }

    const squadMembers = isSquad
      ? [player1Name.trim(), player2Name.trim(), player3Name.trim(), player4Name.trim()]
      : isDuo
      ? [player1Name.trim(), player2Name.trim()]
      : [player1Name.trim()];

    const finalTeam = (isSquad || isDuo) ? teamName.trim() : (player1Name.trim() || currentUser.name);
    const finalUid = (isSquad || isDuo) ? leaderUid.trim() : playerUid.trim();

    onRegister(selectedTournament, finalTeam, squadMembers, selectedSlotNumber, finalUid);
    setRegSuccessMsg(`🎉 You have secured Slot #${selectedSlotNumber}! Room credentials unlocked.`);
    setRegErrorMsg('');
  };

  const handleCopy = (text: string, type: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  // Occupied slots calculation for selected tournament
  const occupiedSlotsMap = selectedTournament
    ? new Map<number, Registration>(
        registrations
          .filter(r => r.tournamentId === selectedTournament.id && r.status === 'Confirmed')
          .map(r => [r.slotNumber, r])
      )
    : new Map<number, Registration>();

  return (
    <div className="min-h-screen bg-[#090a0f] text-white py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Free Fire Image Wallpaper & Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15">
        <img src={FF_IMAGES.bermudaSquad} alt="Free Fire Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090a0f]/90 via-[#090a0f]/80 to-[#090a0f]"></div>
      </div>
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Page Header */}
        <div className="text-center mb-6 sm:mb-10 space-y-2 sm:space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-full bg-purple-900/60 border border-purple-500/40 backdrop-blur-md shadow-lg shadow-purple-900/30">
            <Gamepad2 className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-purple-200">
              Community Custom Rooms & Daily Matches
            </span>
          </div>
          <h1 className="text-2xl sm:text-5xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-red-300 drop-shadow-lg">
            Free Fire Custom Rooms & Matches
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Host and join daily Free Fire custom matches. Lock your fixed slot, pay the entry fee in diamonds, and unlock verified Room ID & Password instantly.
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl mb-6 sm:mb-10 shadow-xl flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          
          {/* Game Category */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase mr-1">Game:</span>
            {['ALL', 'Free Fire Battle Royale', 'Free Fire Clash Squad', 'Custom Room'].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGame(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedGame === g
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-950/80 text-gray-300 hover:bg-purple-950/40 border border-purple-500/20'
                }`}
              >
                {g === 'ALL' ? 'All Games' : g.replace('Free Fire ', '')}
              </button>
            ))}
          </div>

          {/* Mode Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase mr-1">Mode:</span>
            {['ALL', 'Solo', 'Duo', 'Squad', 'Clash Squad (4v4)', '1v1 Custom'].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMode(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedMode === m
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-950/80 text-gray-300 hover:bg-purple-950/40 border border-purple-500/20'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-purple-500/30 text-xs text-white font-bold focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Live">Live</option>
            </select>
          </div>

        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.filter(t => t.status !== 'Completed').length === 0 ? (
            <div className="col-span-full py-20 px-4 text-center bg-slate-900/50 border border-purple-500/10 rounded-3xl space-y-4 shadow-2xl">
              <div className="w-16 h-16 bg-purple-950/80 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto text-purple-400">
                <Gamepad2 className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 uppercase tracking-widest">
                NO CUSTOMS AVAILABLE
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                Kripya dhyan dein: Abhi koi bhi active custom rooms ya tournaments available nahi hain. Jaldi hi naye matches host kiye jayenge!
              </p>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-900/40 border border-purple-500/20 rounded-3xl">
              <Gamepad2 className="w-12 h-12 text-purple-500/40 mx-auto mb-3 animate-pulse" />
              <p className="text-lg font-bold text-white">No matches found matching the selected filters.</p>
              <p className="text-xs text-gray-500 mt-1">Try selecting other game categories or modes.</p>
            </div>
          ) : (
            filteredTournaments.map((t) => {
              const userReg = currentUser 
                ? registrations.find(r => r.userId === currentUser.id && r.tournamentId === t.id && r.status === 'Confirmed')
                : null;
              const isRegistered = Boolean(userReg);
              const isFull = t.registeredCount >= t.maxSlots;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTournament(t)}
                  className="group relative bg-slate-900/90 backdrop-blur-xl border border-purple-500/20 hover:border-purple-500/60 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-purple-900/20 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Banner Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={t.bannerUrl} 
                        alt={t.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
                      
                      {/* Game Category & Match Mode Badges */}
                      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-1.5 max-w-[65%]">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-600/90 text-white shadow-md shadow-purple-950/40 border border-purple-400/30 whitespace-nowrap">
                          {cleanGame(t.game)}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-950/90 border border-cyan-500/30 text-cyan-400 whitespace-nowrap">
                          {cleanMode(t.mode)}
                        </span>
                        {isFull && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-lg shadow-rose-950/60 border border-rose-400 whitespace-nowrap">
                            🔥 FULL
                          </span>
                        )}
                      </div>

                      {/* Registration / Slot badge */}
                      {isRegistered ? (
                        <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 border border-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Slot #{userReg.slotNumber} Reserved</span>
                        </div>
                      ) : isFull ? (
                        <div className="absolute top-4 right-4 bg-rose-950/90 text-rose-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-rose-500/50 flex items-center space-x-1">
                          <span>Slots Full</span>
                        </div>
                      ) : (
                        <div className="absolute top-4 right-4 bg-slate-950/80 text-gray-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-purple-500/30 flex items-center space-x-1">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>ID/Pass Locked</span>
                        </div>
                      )}

                      {/* Prize & Entry Fee Floater */}
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                        <div className="bg-slate-950/90 backdrop-blur-md border border-amber-500/40 px-3 py-1 rounded-xl flex items-center space-x-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-bold text-amber-300">
                            Prize: {t.prizePool} {t.prizeType || '💎'}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-xl flex items-center space-x-1.5 ${
                          t.entryFee === 0 
                            ? 'bg-emerald-950/90 backdrop-blur-md border border-emerald-500/60 shadow-md shadow-emerald-950/50' 
                            : 'bg-slate-950/90 backdrop-blur-md border border-cyan-500/40'
                        }`}>
                          <span className={`text-xs font-black ${t.entryFee === 0 ? 'text-emerald-300' : 'text-cyan-300'}`}>
                            {t.entryFee === 0 ? '🎁 FREE ENTRY' : `${t.entryFee} 💎`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                          {t.title}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-red-400" />
                            <span>{t.map}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            <span>{new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                      </div>

                      {/* Slots Progress */}
                      <div className="space-y-1.5 pt-2 border-t border-purple-500/10">
                        <div className="flex items-center justify-between text-xs text-gray-300">
                          <span className="flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5 text-purple-400" />
                            <span>
                              Slots: <strong className={isFull ? 'text-rose-400 font-bold' : 'text-white'}>{t.registeredCount} / {t.maxSlots}</strong>
                            </span>
                          </span>
                          <span className={`text-[11px] font-bold uppercase ${isFull ? 'text-rose-400' : 'text-purple-300'}`}>
                            {isFull ? 'Housefull' : `${t.maxSlots - t.registeredCount} Free`}
                          </span>
                        </div>

                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              isFull 
                                ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                                : 'bg-gradient-to-r from-purple-500 to-cyan-400'
                            }`}
                            style={{ width: `${Math.min(100, (t.registeredCount / t.maxSlots) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Room ID & Pass Access Status */}
                      <div className="pt-2">
                        {isRegistered ? (
                          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                            <span className="text-emerald-300 font-bold flex items-center space-x-1">
                              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Room ID Unlocked</span>
                            </span>
                            <span className="font-mono text-cyan-300 font-bold">Slot #{userReg.slotNumber}</span>
                          </div>
                        ) : isFull ? (
                          <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
                            <span className="flex items-center space-x-1 font-semibold">
                              <Lock className="w-3.5 h-3.5 text-rose-400" />
                              <span>All slots full for this match</span>
                            </span>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-purple-500/20 flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>ID/Pass visible after paying fee</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="p-5 pt-0">
                    <button className={`w-full py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                      isRegistered
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white shadow-lg shadow-emerald-950/30'
                        : isFull
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 group-hover:bg-rose-900/60 group-hover:text-white'
                          : 'bg-purple-600/20 border-purple-500/30 text-purple-200 group-hover:bg-purple-600 group-hover:text-white'
                    }`}>
                      {isRegistered ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:text-white" />
                          <span>Joined</span>
                        </>
                      ) : isFull ? (
                        <>
                          <span className="text-rose-300 font-black">SLOTS FULL</span>
                        </>
                      ) : (
                        <>
                          <span>Join</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ======================================================== */}
        {/* TOURNAMENT DETAILS & REGISTRATION MODAL */}
        {/* ======================================================== */}
        {selectedTournament && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative">
              
              {/* Modal Header Banner */}
              <div className="relative h-44 sm:h-52 overflow-hidden flex-shrink-0">
                <img 
                  src={selectedTournament.bannerUrl} 
                  alt={selectedTournament.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                
                <button
                  onClick={() => setSelectedTournament(null)}
                  className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-950/80 border border-purple-500/30 text-gray-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
                    <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-purple-600 text-white">
                      {cleanGame(selectedTournament.game)}
                    </span>
                    <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-slate-950/90 border border-cyan-500/30 text-cyan-400">
                      {cleanMode(selectedTournament.mode)}
                    </span>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-950/80 text-amber-300 border border-purple-500/30">
                      {selectedTournament.map}
                    </span>
                    {selectedTournament.registeredCount >= selectedTournament.maxSlots && (
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-600 text-white border border-rose-400 shadow-lg shadow-rose-950/60 animate-pulse">
                        🔥 HOUSEFULL
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{selectedTournament.title}</h2>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-slate-950/80 border border-purple-500/20 p-3.5 rounded-2xl text-center">
                    <span className="block text-[11px] text-gray-400 uppercase">Prize Pool</span>
                    <span className="text-lg font-bold text-amber-400">{selectedTournament.prizePool} {selectedTournament.prizeType || '💎'}</span>
                  </div>
                  <div className={`p-3.5 rounded-2xl text-center border ${
                    selectedTournament.entryFee === 0 
                      ? 'bg-emerald-950/40 border-emerald-500/50' 
                      : 'bg-slate-950/80 border-purple-500/20'
                  }`}>
                    <span className="block text-[11px] text-gray-400 uppercase">Entry Fee</span>
                    <span className={`text-lg font-black ${
                      selectedTournament.entryFee === 0 ? 'text-emerald-400' : 'text-cyan-300'
                    }`}>
                      {selectedTournament.entryFee === 0 ? '🎁 FREE ENTRY' : `${selectedTournament.entryFee} 💎`}
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-2xl text-center border ${
                    selectedTournament.registeredCount >= selectedTournament.maxSlots
                      ? 'bg-rose-950/40 border-rose-500/50'
                      : 'bg-slate-950/80 border-purple-500/20'
                  }`}>
                    <span className="block text-[11px] text-gray-400 uppercase">Slots Taken</span>
                    <span className={`text-lg font-black ${
                      selectedTournament.registeredCount >= selectedTournament.maxSlots ? 'text-rose-400' : 'text-purple-400'
                    }`}>
                      {selectedTournament.registeredCount} / {selectedTournament.maxSlots} {selectedTournament.registeredCount >= selectedTournament.maxSlots ? '(FULL)' : ''}
                    </span>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* STRICT ROOM ID & PASSWORD SECTION */}
                {/* ======================================================== */}
                {userRegistrationForSelected ? (
                  /* UNLOCKED: ONLY VISIBLE IF REGISTERED & PAID */
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-emerald-950/40 to-slate-950 border border-emerald-500/50 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                        <Unlock className="w-5 h-5 text-emerald-400" />
                        <span>Room Credentials Unlocked (Paid & Verified)</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-900 text-emerald-200 border border-emerald-400">
                        🎯 Your Fixed Slot: #{userRegistrationForSelected.slotNumber}
                      </span>
                    </div>

                    {selectedTournament.roomId ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Room ID Box */}
                        <div className="bg-slate-950/90 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between">
                          <div>
                            <span className="block text-[11px] text-gray-400 uppercase font-semibold">Free Fire Room ID</span>
                            <span className="text-base font-mono font-black text-cyan-300">{selectedTournament.roomId}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(selectedTournament.roomId!, 'id')}
                            className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold flex items-center space-x-1 transition-all"
                          >
                            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>

                        {/* Room Password Box */}
                        <div className="bg-slate-950/90 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between">
                          <div>
                            <span className="block text-[11px] text-gray-400 uppercase font-semibold">Room Password</span>
                            <span className="text-base font-mono font-black text-red-300">{selectedTournament.roomPassword || 'None'}</span>
                          </div>
                          {selectedTournament.roomPassword && (
                            <button
                              onClick={() => handleCopy(selectedTournament.roomPassword!, 'pass')}
                              className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold flex items-center space-x-1 transition-all"
                            >
                              {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedPass ? 'Copied!' : 'Copy'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/30 text-xs text-purple-200 space-y-1">
                        <p className="font-bold flex items-center space-x-1.5">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span>Room ID & Password will be posted 15 minutes before match time.</span>
                        </p>
                        <p className="text-gray-400">
                          Your slot is confirmed. Once the host creates the room, the credentials will instantly display here.
                        </p>
                      </div>
                    )}

                    {/* Strict Custom Room In-Game Warning */}
                    <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <strong>STRICT FREE FIRE ROOM RULE:</strong> In Free Fire custom room, you must sit strictly in <strong>Slot #{userRegistrationForSelected.slotNumber}</strong>. Sitting in other players' slots will result in an immediate kick by the room host.
                      </div>
                    </div>

                    {/* Registered Team / Squad Roster Details */}
                    {userRegistrationForSelected.teamName && (
                      <div className="p-4 bg-slate-950/90 rounded-xl border border-purple-500/30 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-purple-400" />
                            <span className="text-gray-400">Team Name:</span>
                            <strong className="text-white text-sm">{userRegistrationForSelected.teamName}</strong>
                          </div>
                          {userRegistrationForSelected.inGameId && (
                            <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                              <span>Leader UID:</span>
                              <strong className="font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-purple-500/30">
                                {userRegistrationForSelected.inGameId}
                              </strong>
                            </div>
                          )}
                        </div>

                        {userRegistrationForSelected.teammates && userRegistrationForSelected.teammates.length > 0 && (
                          <div className="pt-2 border-t border-purple-500/20">
                            <span className="text-[10px] font-bold uppercase text-purple-400 block mb-2">
                              Registered Squad Roster (4 Players):
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {userRegistrationForSelected.teammates.map((member, idx) => (
                                <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-purple-500/20 text-xs flex items-center space-x-2">
                                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="font-semibold text-gray-200 truncate">{member}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* LOCKED: VISIBLE TO ALL USERS WHO HAVE NOT PAID */
                  <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-2 text-center">
                    <div className="w-10 h-10 rounded-full bg-purple-950/80 border border-purple-500/40 flex items-center justify-center mx-auto text-amber-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-base">Custom Room ID & Password Locked</h4>
                    <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                      To prevent unauthorized players from invading the room, the Room ID & Password are only revealed once you {selectedTournament.entryFee === 0 ? 'join for Free' : `pay the entry fee (${selectedTournament.entryFee} 💎)`} and lock your fixed slot number.
                    </p>
                  </div>
                )}

                {/* ======================================================== */}
                {/* FIXED SLOTS ALLOCATION ROSTER */}
                {/* ======================================================== */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>
                        {selectedTournament.mode === 'Squad' 
                          ? `Fixed Squad Slots (Numbered 1 to ${selectedTournament.maxSlots})`
                          : selectedTournament.mode === 'Duo'
                          ? `Fixed Duo Slots (Numbered 1 to ${selectedTournament.maxSlots})`
                          : `Fixed Solo Slots (Numbered 1 to ${selectedTournament.maxSlots})`
                        }
                      </span>
                    </h3>
                    <span className="text-xs text-gray-400">
                      {userRegistrationForSelected ? 'Your Slot Highlighted' : 'Click an open slot to reserve'}
                    </span>
                  </div>

                  {/* Slot Status Breakdown Bar */}
                  {(() => {
                    const bookedCount = occupiedSlotsMap.size;
                    const openCount = Math.max(0, selectedTournament.maxSlots - bookedCount);
                    return (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/90 border border-purple-500/20 text-xs">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/80"></span>
                            <span className="text-gray-300">Booked: <strong className="text-rose-400 font-mono font-black">{bookedCount}</strong></span>
                          </span>
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/80"></span>
                            <span className="text-gray-300">Available: <strong className="text-emerald-400 font-mono font-black">{openCount}</strong></span>
                          </span>
                        </div>
                        {userRegistrationForSelected ? (
                          <span className="text-amber-300 font-black bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-500/30 text-[11px]">
                            ⭐ Your Reserved Slot: #{userRegistrationForSelected.slotNumber}
                          </span>
                        ) : selectedSlotNumber ? (
                          <span className="text-cyan-300 font-black bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/30 text-[11px]">
                            🎯 Chosen Slot: #{selectedSlotNumber}
                          </span>
                        ) : openCount > 0 ? (
                          <span className="text-emerald-300/80 text-[11px]">
                            🟢 Select an open slot below to join
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold text-[11px]">
                            🔒 All slots full
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {Array.from({ length: selectedTournament.maxSlots }, (_, i) => i + 1).map((slotNum) => {
                      const occupiedReg = occupiedSlotsMap.get(slotNum);
                      const isCurrentUserSlot = userRegistrationForSelected?.slotNumber === slotNum;
                      const isSelectedForRegistration = selectedSlotNumber === slotNum && !userRegistrationForSelected;
                      const slotLabel = selectedTournament.mode === 'Squad' ? `Squad ${slotNum}` : selectedTournament.mode === 'Duo' ? `Duo ${slotNum}` : `Slot ${slotNum}`;

                      if (isCurrentUserSlot) {
                        return (
                          <div
                            key={slotNum}
                            className="p-2.5 rounded-xl bg-emerald-950/90 border-2 border-emerald-400 text-center shadow-lg shadow-emerald-950/60"
                          >
                            <div className="flex items-center justify-between text-[10px] text-emerald-300 mb-0.5">
                              <span className="font-mono font-black">{slotLabel}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-400 text-slate-950 font-black">YOURS</span>
                            </div>
                            <span className="text-xs font-black text-white block mt-0.5">YOU ⭐</span>
                          </div>
                        );
                      }

                      if (occupiedReg) {
                        return (
                          <div
                            key={slotNum}
                            className="p-2.5 rounded-xl bg-slate-950/90 border border-rose-500/30 text-center relative overflow-hidden"
                            title={`Booked by ${occupiedReg.userName} (${occupiedReg.teamName || 'Player'})`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                              <span className="font-mono font-bold">{slotLabel}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950/80 text-rose-400 border border-rose-800/40 font-black">FULL</span>
                            </div>
                            <span className="text-[11px] font-bold text-gray-300 block truncate mt-0.5" title={occupiedReg.userName}>
                              {occupiedReg.userName}
                            </span>
                          </div>
                        );
                      }

                      // Slot is available
                      return (
                        <button
                          key={slotNum}
                          type="button"
                          disabled={Boolean(userRegistrationForSelected)}
                          onClick={() => setSelectedSlotNumber(slotNum)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                            isSelectedForRegistration
                              ? 'bg-purple-600 border-purple-300 text-white shadow-lg shadow-purple-600/50 ring-2 ring-purple-400'
                              : 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/40 text-emerald-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] mb-0.5">
                            <span className="font-mono font-bold">{slotLabel}</span>
                            {isSelectedForRegistration ? (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-white text-purple-900 font-black">PICKED</span>
                            ) : (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 font-bold">OPEN</span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold block mt-0.5">
                            {isSelectedForRegistration ? 'Selected ✓' : 'Available'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Match Description & Rules */}
                <div className="space-y-2 pt-2 border-t border-purple-500/10">
                  <h3 className="font-bold text-xs text-gray-300 uppercase tracking-wider">Tournament Rules & Guidelines</h3>
                  <ul className="space-y-1 text-xs text-gray-400 list-disc list-inside">
                    {selectedTournament.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>

                {/* ======================================================== */}
                {/* REGISTRATION FORM (If not already registered) */}
                {/* ======================================================== */}
                {!userRegistrationForSelected && (
                  selectedTournament.registeredCount >= selectedTournament.maxSlots ? (
                    <div className="pt-4 border-t border-rose-500/30 space-y-3">
                      <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-3 shadow-xl shadow-rose-950/30">
                        <div className="inline-flex p-3 rounded-2xl bg-rose-900/60 text-rose-300 border border-rose-500/40">
                          <Lock className="w-6 h-6 text-rose-300" />
                        </div>
                        <h4 className="text-base font-black text-rose-300 uppercase tracking-wide">
                          🔥 Match Housefull (All Slots Booked)
                        </h4>
                        <p className="text-xs text-rose-200/90 max-w-md mx-auto leading-relaxed">
                          All <strong>{selectedTournament.maxSlots} slots</strong> for this tournament have been claimed by players. Registration is now closed. Please choose another match or wait for the next custom room to open!
                        </p>
                        <button
                          type="button"
                          disabled
                          className="w-full py-4 rounded-2xl bg-slate-950/90 border border-rose-500/40 text-rose-400 font-black text-xs uppercase tracking-wider cursor-not-allowed shadow-inner"
                        >
                          🔒 SLOTS FULL - REGISTRATION CLOSED
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-purple-500/20 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                          Join Tournament & Claim Slot
                        </h3>
                        {selectedSlotNumber && (
                          <span className="text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                            Allocating: Slot #{selectedSlotNumber}
                          </span>
                        )}
                      </div>

                    {regSuccessMsg && (
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs text-center flex items-center justify-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{regSuccessMsg}</span>
                      </div>
                    )}
                    {regErrorMsg && (
                      <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs text-center flex items-center justify-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span>{regErrorMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                      {isSquad ? (
                        /* ======================================================== */
                        /* SQUAD MODE: 1 Team Name + 1 Leader UID + 4 Player Columns */
                        /* ======================================================== */
                        <div className="space-y-4">
                          <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-purple-400" />
                              <span className="text-xs font-bold text-white uppercase tracking-wider">
                                Squad Registration (4 Players Roster)
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                              All Fields Mandatory *
                            </span>
                          </div>

                          {/* 1 Team Name Option & 1 Leader UID Option */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-200 mb-1 uppercase tracking-wide">
                                Team Name / Clan Name <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="e.g. Total Gaming / Team Soul"
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-200 mb-1 uppercase tracking-wide">
                                Team Leader Free Fire UID <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={leaderUid}
                                onChange={(e) => setLeaderUid(e.target.value)}
                                placeholder="e.g. 589230148 (Leader UID)"
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                              />
                            </div>
                          </div>

                          {/* 4 Columns for Player Names */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold text-gray-200 uppercase tracking-wide">
                                Squad Players (4 Columns - All 4 Player Names Required) <span className="text-red-400">*</span>
                              </label>
                              <span className="text-[10px] text-gray-400">Enter In-Game Name (IGN)</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {/* Column 1: Player 1 (Leader) */}
                              <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-500/30 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 uppercase">
                                  <span>Column 1</span>
                                  <span className="text-[9px] bg-purple-900/60 px-1.5 py-0.5 rounded text-purple-200">Leader</span>
                                </div>
                                <label className="block text-[10px] text-gray-400 font-semibold">
                                  Player 1 (Leader) Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={player1Name}
                                  onChange={(e) => setPlayer1Name(e.target.value)}
                                  placeholder="Player 1 IGN"
                                  className="w-full px-3 py-2 bg-slate-900 border border-purple-500/20 rounded-lg text-white text-xs focus:outline-none focus:border-purple-400"
                                />
                              </div>

                              {/* Column 2: Player 2 */}
                              <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-500/30 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 uppercase">
                                  <span>Column 2</span>
                                  <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-gray-300">Player 2</span>
                                </div>
                                <label className="block text-[10px] text-gray-400 font-semibold">
                                  Player 2 Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={player2Name}
                                  onChange={(e) => setPlayer2Name(e.target.value)}
                                  placeholder="Player 2 IGN"
                                  className="w-full px-3 py-2 bg-slate-900 border border-purple-500/20 rounded-lg text-white text-xs focus:outline-none focus:border-purple-400"
                                />
                              </div>

                              {/* Column 3: Player 3 */}
                              <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-500/30 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 uppercase">
                                  <span>Column 3</span>
                                  <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-gray-300">Player 3</span>
                                </div>
                                <label className="block text-[10px] text-gray-400 font-semibold">
                                  Player 3 Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={player3Name}
                                  onChange={(e) => setPlayer3Name(e.target.value)}
                                  placeholder="Player 3 IGN"
                                  className="w-full px-3 py-2 bg-slate-900 border border-purple-500/20 rounded-lg text-white text-xs focus:outline-none focus:border-purple-400"
                                />
                              </div>

                              {/* Column 4: Player 4 */}
                              <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-500/30 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 uppercase">
                                  <span>Column 4</span>
                                  <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-gray-300">Player 4</span>
                                </div>
                                <label className="block text-[10px] text-gray-400 font-semibold">
                                  Player 4 Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={player4Name}
                                  onChange={(e) => setPlayer4Name(e.target.value)}
                                  placeholder="Player 4 IGN"
                                  className="w-full px-3 py-2 bg-slate-900 border border-purple-500/20 rounded-lg text-white text-xs focus:outline-none focus:border-purple-400"
                                />
                              </div>
                            </div>

                            <p className="text-[11px] text-amber-300/90 mt-2 flex items-center space-x-1">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                              <span>Team Name, Leader UID aur sabhi 4 players ke naam fill kiye bina tournament join nahi hoga.</span>
                            </p>
                          </div>
                        </div>
                      ) : isDuo ? (
                        /* DUO MODE */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-200 mb-1">
                                Team Name <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="Duo Team Name"
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-200 mb-1">
                                Leader Free Fire UID <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={leaderUid}
                                onChange={(e) => setLeaderUid(e.target.value)}
                                placeholder="Leader UID"
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-200 mb-1">
                                Player 1 Name <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={player1Name}
                                onChange={(e) => setPlayer1Name(e.target.value)}
                                placeholder="Player 1 IGN"
                                className="w-full px-3.5 py-2 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-200 mb-1">
                                Player 2 Name <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={player2Name}
                                onChange={(e) => setPlayer2Name(e.target.value)}
                                placeholder="Player 2 IGN"
                                className="w-full px-3.5 py-2 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* SOLO MODE */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-200 mb-1 uppercase">
                              Free Fire In-Game UID <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={playerUid}
                              onChange={(e) => setPlayerUid(e.target.value)}
                              placeholder="e.g. 589230148"
                              className="w-full px-4 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-200 mb-1 uppercase">
                              Player In-Game Name (IGN) <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={player1Name}
                              onChange={(e) => setPlayer1Name(e.target.value)}
                              placeholder="e.g. Viper_FF"
                              className="w-full px-4 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                            />
                          </div>
                        </div>
                      )}

                      {/* Wallet Balance & Entry Fee Check */}
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-purple-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span className="text-gray-300">Your Diamond Balance:</span>
                          <strong className="text-cyan-300 font-mono text-sm">
                            {currentUser ? `${currentUser.diamonds} 💎` : 'Login required'}
                          </strong>
                        </div>

                        {selectedTournament.entryFee > 0 && currentUser && currentUser.diamonds < selectedTournament.entryFee && setActiveTab && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTournament(null);
                              setActiveTab('wallet');
                            }}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all"
                          >
                            + Top Up Diamonds
                          </button>
                        )}
                      </div>

                      {/* Registration Button */}
                      <button
                        type="submit"
                        className={`w-full py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                          selectedTournament.entryFee === 0
                            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                            : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
                        }`}
                      >
                        <Lock className="w-4 h-4 text-amber-300" />
                        <span>
                          {selectedTournament.entryFee === 0
                            ? `Claim Slot #${selectedSlotNumber || 1} (100% FREE)`
                            : `Pay ${selectedTournament.entryFee} 💎 & Unlock Slot #${selectedSlotNumber || 1}`}
                        </span>
                      </button>

                      {!currentUser && (
                        <p className="text-center text-xs text-purple-400">
                          Please log in with your player account to confirm tournament registration.
                        </p>
                      )}
                    </form>
                  </div>
                  )
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
