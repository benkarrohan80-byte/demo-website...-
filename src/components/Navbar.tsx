import React, { useState } from 'react';
import { Trophy, Gamepad2, Coins, Crown, LayoutDashboard, User as UserIcon, Bell, LogOut, Menu, X, ShieldAlert, Download, Youtube, ExternalLink } from 'lucide-react';
import { User, NotificationItem } from '../types';
import { FF_IMAGES } from '../assets/freeFireAssets';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  notifications,
  onMarkNotificationsRead
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/95 backdrop-blur-xl border-b border-purple-500/20 max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group min-w-0 shrink"
            onClick={() => setActiveTab('home')}
          >
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 p-[1.5px] shadow-lg shadow-pink-500/30 group-hover:scale-105 transition-transform overflow-hidden shrink-0 flex items-center justify-center">
              <img src={FF_IMAGES.shadowQueenLogo} alt="SHADOW X Logo" className="w-full h-full object-cover rounded-[10px]" />
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-rose-300 font-sans block truncate">
                SHADOW X
              </span>
              <span className="block text-[8px] sm:text-[10px] tracking-widest text-pink-300 font-bold uppercase truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                BY @SHADOWQUEENGAMING
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-inner'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('earn')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'earn'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-inner'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-amber-400">💎</span>
              <span>Earn Diamonds</span>
            </button>
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'tournaments'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-inner'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              <span>My Matches</span>
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'wallet'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-inner'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Diamond Wallet</span>
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'withdraw'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-inner'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Withdraw / Play Store</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'bg-red-600/20 text-red-300 border border-red-500/40 shadow-inner'
                  : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Admin Portal</span>
            </button>
            {currentUser && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  activeTab === 'profile'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-inner'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserIcon className="w-4 h-4 text-purple-400" />
                <span>My Profile</span>
              </button>
            )}
          </nav>

          {/* Right Side: Diamonds & Auth / Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-4 shrink-0">
            {currentUser ? (
              <>
                {/* Diamond Balance Badge */}
                <div 
                  onClick={() => setActiveTab('wallet')}
                  className="flex items-center space-x-1 sm:space-x-1.5 bg-gradient-to-r from-purple-950/60 to-blue-950/60 border border-purple-500/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-pointer hover:border-purple-400 transition-all shadow-lg text-xs sm:text-sm"
                >
                  <span className="text-sm sm:text-base animate-pulse">💎</span>
                  <span className="font-bold text-cyan-300">{currentUser.diamonds.toLocaleString()}</span>
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      const newOpen = !notifDropdownOpen;
                      setNotifDropdownOpen(newOpen);
                      if (newOpen) {
                        setProfileDropdownOpen(false);
                        setMobileMenuOpen(false);
                        onMarkNotificationsRead();
                      }
                    }}
                    className="relative p-1.5 sm:p-2 rounded-xl bg-slate-900/80 border border-purple-500/20 text-gray-300 hover:text-white hover:border-purple-500/50 transition-all"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-600 text-white rounded-full text-[10px] sm:text-xs font-bold flex items-center justify-center animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {notifDropdownOpen && (
                    <div className="absolute -right-12 sm:right-0 mt-3 w-72 sm:w-96 max-w-[90vw] bg-slate-950/95 backdrop-blur-2xl border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div className="p-4 border-b border-purple-500/20 flex items-center justify-between bg-purple-950/20">
                        <h3 className="font-bold text-white text-sm">Notifications</h3>
                        <span className="text-xs text-purple-400">{notifications.length} total</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-purple-500/10">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-400 text-sm">No notifications yet.</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={`p-3.5 hover:bg-purple-900/10 transition-colors ${!n.read ? 'bg-purple-950/30' : ''}`}>
                              <div className="flex items-start justify-between">
                                <h4 className="font-semibold text-xs text-purple-300">{n.title}</h4>
                                <span className="text-[10px] text-gray-400">{n.timestamp}</span>
                              </div>
                              <p className="text-xs text-gray-300 mt-1">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      const newOpen = !profileDropdownOpen;
                      setProfileDropdownOpen(newOpen);
                      if (newOpen) {
                        setNotifDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }
                    }}
                    className="flex items-center space-x-2 focus:outline-none group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px] shadow-md group-hover:scale-105 transition-transform">
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover rounded-[10px]" />
                    </div>
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-slate-950/95 backdrop-blur-2xl border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div className="p-4 border-b border-purple-500/20 bg-purple-950/30">
                        <p className="font-bold text-white text-sm truncate">{currentUser.name}</p>
                        <p className="text-xs text-purple-400 truncate">{currentUser.email}</p>
                        <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] bg-purple-600/30 border border-purple-500/40 text-purple-300 font-semibold uppercase">
                          {currentUser.tier}
                        </div>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => { setActiveTab('profile'); setProfileDropdownOpen(false); }}
                          className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-purple-300 hover:bg-purple-600/30 hover:text-white transition-colors bg-purple-950/40 border border-purple-500/30 mb-1.5"
                        >
                          <UserIcon className="w-4 h-4 text-purple-400" />
                          <span>My Profile</span>
                        </button>
                        <button
                          onClick={() => { setActiveTab('tournaments'); setProfileDropdownOpen(false); }}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-purple-600/20 hover:text-white transition-colors"
                        >
                          <Gamepad2 className="w-4 h-4 text-purple-400" />
                          <span>My Matches</span>
                        </button>
                        <button
                          onClick={() => { setActiveTab('wallet'); setProfileDropdownOpen(false); }}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-purple-600/20 hover:text-white transition-colors"
                        >
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>Diamond Wallet</span>
                        </button>
                        <div className="my-1 border-t border-purple-500/20" />
                        <button
                          onClick={() => { onLogout(); setProfileDropdownOpen(false); }}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="relative group overflow-hidden rounded-xl p-[1px] font-semibold text-sm transition-transform active:scale-95"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-red-500 to-blue-500 animate-pulse"></span>
                <span className="relative px-5 py-2.5 bg-slate-950 rounded-[11px] flex items-center space-x-2 text-white group-hover:bg-opacity-80 transition-colors">
                  <UserIcon className="w-4 h-4 text-purple-400" />
                  <span>Login / Signup</span>
                </span>
              </button>
            )}

            {/* ShadowQueenGaming YouTube Quick Link */}
            <a
              href="https://www.youtube.com/@ShadowQueenGaming"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white transition-all text-xs font-black uppercase tracking-wider shadow-sm"
              title="Visit @ShadowQueenGaming on YouTube"
            >
              <Youtube className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
              <span>YT Channel</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                const newOpen = !mobileMenuOpen;
                setMobileMenuOpen(newOpen);
                if (newOpen) {
                  setNotifDropdownOpen(false);
                  setProfileDropdownOpen(false);
                }
              }}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-purple-500/20 text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/98 border-b border-purple-500/30 px-4 pt-2 pb-6 space-y-2 backdrop-blur-2xl">
          <button
            onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 ${activeTab === 'home' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40' : 'text-gray-300 hover:bg-white/5'}`}
          >
            <span>Home</span>
          </button>
          <button
            onClick={() => { setActiveTab('earn'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 ${activeTab === 'earn' ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40' : 'text-gray-300 hover:bg-white/5'}`}
          >
            <span className="w-4 h-4 text-amber-400">💎</span>
            <span>Earn Diamonds</span>
          </button>
          <button
            onClick={() => { setActiveTab('tournaments'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 ${activeTab === 'tournaments' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40' : 'text-gray-300 hover:bg-white/5'}`}
          >
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span>My Matches</span>
          </button>
          <button
            onClick={() => { setActiveTab('wallet'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 ${activeTab === 'wallet' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40' : 'text-gray-300 hover:bg-white/5'}`}
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Diamond Wallet</span>
          </button>
          <button
            onClick={() => { setActiveTab('withdraw'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 ${activeTab === 'withdraw' ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-300 hover:bg-white/5'}`}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Withdraw / Play Store</span>
          </button>
          {currentUser ? (
            <button
              onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-3 ${activeTab === 'profile' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50' : 'text-purple-300 hover:bg-purple-950/40 bg-slate-900/60 border border-purple-500/20'}`}
            >
              <UserIcon className="w-4 h-4 text-purple-400" />
              <span>My Profile ({currentUser.name})</span>
            </button>
          ) : (
            <button
              onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-3 text-purple-300 bg-purple-950/40 border border-purple-500/30 hover:bg-purple-900/40"
            >
              <UserIcon className="w-4 h-4 text-purple-400" />
              <span>Login / Signup</span>
            </button>
          )}

          <button
            onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 ${activeTab === 'admin' ? 'bg-red-600/20 text-red-300 border border-red-500/40' : 'text-red-400 hover:bg-red-500/10'}`}
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Admin Portal</span>
          </button>

          <a
            href="https://www.youtube.com/@ShadowQueenGaming"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Youtube className="w-4 h-4 text-red-400" />
              <span>@ShadowQueenGaming on YouTube</span>
            </div>
            <ExternalLink className="w-4 h-4 text-red-400" />
          </a>
        </div>
      )}
    </header>
  );
};
