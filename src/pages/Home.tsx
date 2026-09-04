import React, { useState } from 'react';
import { Trophy, Gamepad2, Coins, Users, Sparkles, ArrowRight, Shield, Flame, CheckCircle2, ChevronRight, Star, Crown, Gift } from 'lucide-react';
import { Tournament, User, Registration } from '../types';
import { FAQS } from '../data/mockData';
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

interface HomeProps {
  setActiveTab: (tab: string) => void;
  tournaments: Tournament[];
  currentUser: User | null;
  registrations?: Registration[];
  onOpenAuth: () => void;
  onSelectTournament: (t: Tournament) => void;
}

export const Home: React.FC<HomeProps> = ({
  setActiveTab,
  tournaments,
  currentUser,
  registrations = [],
  onOpenAuth,
  onSelectTournament
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const activeTournaments = tournaments.filter(t => t.status !== 'Completed');
  const featuredTournaments = activeTournaments.slice(0, 3);
  const liveTournaments = activeTournaments.filter(t => t.status === 'Live');
  const upcomingTournaments = activeTournaments.filter(t => t.status === 'Upcoming');

  return (
    <div className="min-h-screen bg-[#090a0f] text-white relative">
      
      {/* Ambient ShadowQueenGaming Background Watermark (Page Left & Right) */}
      <div className="fixed top-1/3 -left-20 w-80 h-80 pointer-events-none z-0 opacity-10 select-none overflow-hidden transform-gpu will-change-transform">
        <img 
          src={FF_IMAGES.shadowQueenLogo} 
          alt="" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-full mix-blend-screen" 
        />
      </div>
      <div className="fixed bottom-20 -right-24 w-96 h-96 pointer-events-none z-0 opacity-10 select-none overflow-hidden transform-gpu will-change-transform">
        <img 
          src={FF_IMAGES.shadowQueenLogo} 
          alt="" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-full mix-blend-screen" 
        />
      </div>

      {/* Hero Banner with Free Fire Battle Royale Background */}
      <section className="relative overflow-hidden pt-8 sm:pt-20 pb-14 sm:pb-32 border-b border-purple-500/20 bg-[#090a0f]">
        
        {/* Background Image with Dark Overlay - Shadow Queen Channel Artwork */}
        <div className="absolute inset-0 z-0">
          <img 
            src={FF_IMAGES.heroBanner} 
            alt="Shadow Queen Gaming Channel Backdrop" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-45 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-transparent to-[#090a0f]"></div>
        </div>

        {/* ShadowQueenGaming Centered Background Emblem / Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1] select-none flex flex-col items-center justify-center transform-gpu will-change-transform">
          <div className="relative w-52 sm:w-96 md:w-[480px] h-52 sm:h-96 md:h-[480px] rounded-full p-2 bg-gradient-to-tr from-purple-500/25 via-red-500/20 to-cyan-500/25 blur-sm">
            <img 
              src={FF_IMAGES.shadowQueenLogo} 
              alt="ShadowQueenGaming Watermark Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full opacity-25 mix-blend-lighten filter contrast-125"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-400/30 mt-3 select-none">
            @SHADOWQUEENGAMING
          </span>
        </div>

        {/* Glowing Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[200px] sm:h-[350px] bg-purple-600/20 rounded-full blur-[60px] pointer-events-none transform-gpu will-change-[filter,opacity]"></div>
        <div className="absolute top-1/3 left-1/4 w-[200px] sm:w-[350px] h-[150px] sm:h-[250px] bg-red-600/15 rounded-full blur-[50px] pointer-events-none transform-gpu will-change-[filter,opacity]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Community Badge */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4 sm:mb-6">
            <div className="inline-flex items-center space-x-2 sm:space-x-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-900/90 border border-pink-500/50 backdrop-blur-md shadow-xl shadow-pink-900/30">
              <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden p-[1px] bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500">
                <img 
                  src={FF_IMAGES.shadowQueenLogo} 
                  alt="ShadowQueenGaming Logo" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover" 
                />
              </div>
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-red-400">
                OFFICIAL SHADOW QUEEN COMMUNITY
              </span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-tight mb-4 sm:mb-6 drop-shadow-2xl">
            SHADOW QUEEN'S <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
              REWARD ARENA
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-200 text-sm sm:text-lg mb-6 sm:mb-10 leading-relaxed font-medium">
            Join Shadow Queen's custom rooms and tournaments, complete challenges, earn diamonds, and redeem exciting rewards.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActiveTab('tournaments')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white font-extrabold text-base shadow-xl shadow-pink-600/40 hover:scale-105 transition-transform flex items-center justify-center space-x-3"
            >
              <Gamepad2 className="w-5 h-5" />
              <span>JOIN TOURNAMENTS</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            {!currentUser ? (
              <button
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 border border-pink-500/40 text-pink-300 font-bold text-base hover:bg-pink-900/30 transition-all flex items-center justify-center space-x-2 backdrop-blur-md"
              >
                <Gift className="w-5 h-5 text-pink-400" />
                <span>EARN REWARDS</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('earn')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 border border-pink-500/40 text-pink-300 font-bold text-base hover:bg-pink-900/30 transition-all flex items-center justify-center space-x-2 backdrop-blur-md"
              >
                <Gift className="w-5 h-5 text-pink-400" />
                <span>EARN REWARDS</span>
              </button>
            )}
          </div>

        </div>
      </section>

      {/* Live & Featured Tournaments Section */}
      <section className="py-10 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div>
            <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-widest mb-1">
              <Flame className="w-4 h-4 animate-bounce" />
              <span>Battle Ready</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">CUSTOM ROOMS</h2>
          </div>
          <button
            onClick={() => setActiveTab('tournaments')}
            className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 font-bold text-sm transition-colors"
          >
            <span>View All Custom Rooms</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {featuredTournaments.length === 0 ? (
          <div className="w-full py-20 px-4 rounded-3xl bg-slate-900/50 border border-purple-500/10 text-center space-y-4 shadow-2xl">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {featuredTournaments.map((t) => {
              const isRegistered = currentUser && registrations
                ? registrations.some(r => r.userId === currentUser.id && r.tournamentId === t.id && r.status === 'Confirmed')
                : false;
              const isFull = t.registeredCount >= t.maxSlots;

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTournament(t)}
                  className="group relative bg-slate-900/80 backdrop-blur-xl border border-purple-500/20 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 shadow-xl ff-card-glow cursor-pointer flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img src={t.bannerUrl} alt={t.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                    
                    {/* Game Category & Match Mode Badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap items-center gap-1.5 max-w-[85%]">
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

                    {/* Prize Pool Floating Tag */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="bg-slate-950/90 backdrop-blur-md border border-amber-500/40 px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300">{t.prizePool.toLocaleString()} 💎</span>
                      </div>
                      <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5">
                        <span className="text-sm">{t.entryFee === 0 ? '🎁' : '💎'}</span>
                        <span className={`text-xs font-black ${t.entryFee === 0 ? 'text-emerald-300' : 'text-cyan-300'}`}>
                          {t.entryFee === 0 ? 'FREE Entry' : `${t.entryFee} 💎 Entry`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1">{t.title}</h3>
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{t.description}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-purple-500/10">
                      <div className="flex items-center justify-between text-xs text-gray-300">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          <span>
                            Slots: <strong className={isFull ? 'text-rose-400 font-bold' : 'text-white'}>{t.registeredCount} / {t.maxSlots}</strong>
                          </span>
                        </span>
                        <span className={`font-semibold ${isFull ? 'text-rose-400 font-bold uppercase' : 'text-purple-300'}`}>
                          {isFull ? '🔥 Slots Full' : `${t.mode} Mode`}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            isFull 
                              ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                              : 'bg-gradient-to-r from-purple-500 to-red-500'
                          }`}
                          style={{ width: `${Math.min(100, (t.registeredCount / t.maxSlots) * 100)}%` }}
                        ></div>
                      </div>

                      <button className={`w-full py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                        isRegistered
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white shadow-lg shadow-emerald-950/30'
                          : isFull
                            ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 group-hover:bg-rose-900/60 group-hover:text-white'
                            : 'bg-purple-600/20 border-purple-500/30 text-purple-300 group-hover:bg-purple-600 group-hover:text-white'
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
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Free Fire Booyah Diamond Vault & Grand Prize Section */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-950 shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img 
              src={FF_IMAGES.booyahTrophy} 
              alt="Free Fire Booyah Trophy & Diamond Rewards" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-30 object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/80 to-transparent"></div>
          </div>

          <div className="relative z-10 p-8 sm:p-12 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-4">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Free Fire Booyah Championship Rewards</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight leading-tight">
              Win 100% Verified <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400">
                Free Fire Diamonds & Redeem Codes
              </span>
            </h2>

            <p className="text-sm text-gray-300 mt-3 leading-relaxed">
              Every custom room match pays out real Free Fire Diamonds directly to your wallet. Convert your earnings into official Google Play Redeem Codes instantly!
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => setActiveTab('wallet')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
              >
                <Coins className="w-4 h-4" />
                <span>Explore Diamond Vault</span>
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className="px-6 py-3.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-300 font-bold text-sm uppercase tracking-wider hover:bg-amber-950/40 transition-all flex items-center space-x-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Redeem Play Store Codes</span>
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-10 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl font-black text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-purple-300 mt-2 uppercase tracking-wider">Everything you need to know about Shadow X Tournaments</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-bold text-white flex items-center justify-between hover:bg-purple-900/10 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-5 h-5 text-purple-400 transition-transform ${openFaq === idx ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-sm text-gray-300 leading-relaxed border-t border-purple-500/10 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
