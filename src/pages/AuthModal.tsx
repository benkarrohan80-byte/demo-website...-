import React, { useState, useEffect } from 'react';
import { Mail, Lock, User as UserIcon, Crown, Sparkles, X, ArrowRight, CheckCircle2, RefreshCw, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { 
  signInWithFirebase, 
  signUpWithFirebase, 
  resendVerificationEmail, 
  sendPasswordReset, 
  getFirebaseErrorMessage,
  auth,
  syncUserProfile,
  isFirebaseConfigured
} from '../lib/firebase';
import { FF_IMAGES } from '../assets/freeFireAssets';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialMode?: 'login' | 'signup' | 'verify' | 'forgot';
  unverifiedUser?: User | null;
  isStandaloneScreen?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  unverifiedUser = null,
  isStandaloneScreen = false,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify' | 'forgot'>(
    unverifiedUser ? 'verify' : initialMode
  );

  // Form input state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(unverifiedUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inGameId, setInGameId] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (unverifiedUser) {
      setMode('verify');
      setEmail(unverifiedUser.email);
    }
  }, [unverifiedUser]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Lock body scroll when opened as an overlay modal over the site
  useEffect(() => {
    if (isOpen && !isStandaloneScreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isStandaloneScreen]);

  if (!isOpen) return null;

  // Switch tabs
  const handleTabSwitch = (newMode: 'login' | 'signup') => {
    setError('');
    setSuccessMsg('');
    setMode(newMode);
  };

  // Resend Verification Email
  const handleResendVerification = async () => {
    setIsResending(true);
    setError('');
    setSuccessMsg('');
    try {
      await resendVerificationEmail();
      setResendCountdown(60);
      setSuccessMsg(`Verification email re-sent to ${auth?.currentUser?.email || email}. Please check your inbox.`);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  // Check Email Verification Status
  const handleCheckVerification = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (auth?.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          const userProfile = await syncUserProfile(auth.currentUser);
          onLoginSuccess(userProfile);
          onClose();
        } else {
          setError('Your email is not verified yet. Please open your inbox and click the verification link.');
        }
      } else {
        setError('Session expired. Please sign in with your email and password.');
        setMode('login');
      }
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Main Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Please configure your Netlify VITE_FIREBASE_* environment variables.');
      return;
    }

    setLoading(true);

    try {
      // 1. REAL LOGIN
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setError('Please enter both email and password.');
          setLoading(false);
          return;
        }

        const fbUser = await signInWithFirebase(email.trim(), password);

        if (!fbUser.emailVerified) {
          setMode('verify');
          setSuccessMsg(`Verification required. An email link was sent to ${fbUser.email}. Please verify your email.`);
          setLoading(false);
          return;
        }

        const userProfile = await syncUserProfile(fbUser);
        onLoginSuccess(userProfile);
        onClose();
      }

      // 2. REAL SIGNUP
      else if (mode === 'signup') {
        if (!fullName.trim()) {
          setError('Full Name is required.');
          setLoading(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email address.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        const fbUser = await signUpWithFirebase(email.trim(), password, fullName.trim(), inGameId.trim());
        setSuccessMsg(`Account created! A verification link has been sent to ${fbUser.email}. Please verify your email to access the arena.`);
        setMode('verify');
        setResendCountdown(60);
      }

      // 3. FORGOT PASSWORD
      else if (mode === 'forgot') {
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid registered email address.');
          setLoading(false);
          return;
        }

        await sendPasswordReset(email.trim());
        setSuccessMsg(`Password reset email sent to ${email}. Please check your inbox for instructions.`);
      }

    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const containerClasses = isStandaloneScreen
    ? "min-h-screen w-full flex items-center justify-center p-3 sm:p-6 bg-[#06070a] relative overflow-y-auto selection:bg-purple-600 selection:text-white"
    : "fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto";

  return (
    <div className={containerClasses}>
      
      {/* Background Wallpaper */}
      <div className={`${isStandaloneScreen ? 'fixed' : 'absolute'} inset-0 pointer-events-none overflow-hidden`}>
        <img 
          src={FF_IMAGES.bermudaSquad} 
          alt="Free Fire Background" 
          referrerPolicy="no-referrer" 
          className="w-full h-full object-cover opacity-25 filter brightness-50 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06070a]/90 via-[#0a0814]/85 to-[#06070a]"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-red-600/20 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative w-full max-w-lg bg-[#0d0a1a]/95 border border-pink-500/30 rounded-3xl shadow-[0_0_60px_rgba(219,39,119,0.3)] backdrop-blur-2xl overflow-hidden p-5 sm:p-8 my-auto z-10">
        
        {/* Dismiss Close Button (Only when used as overlay modal and user is verified) */}
        {!isStandaloneScreen && !unverifiedUser && auth?.currentUser?.emailVerified && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 border border-purple-500/30 text-gray-400 hover:text-white hover:border-pink-500/60 transition-all z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 mb-3 shadow-lg shadow-pink-500/40 animate-pulse">
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.8)]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-yellow-400">👑</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-rose-300 drop-shadow-sm">
              SHADOW QUEEN'S
            </span>
            <span className="text-white">REWARD ARENA</span>
          </h1>

          <p className="text-xs sm:text-sm text-pink-200/90 mt-2 font-medium max-w-md mx-auto leading-relaxed">
            Join the community, participate in custom tournaments, earn rewards and redeem exciting prizes.
          </p>
        </div>

        {/* Mode Toggle [ Sign In ] | [ Create Account ] */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-purple-950/50 border border-pink-500/30 rounded-2xl mb-6 shadow-inner">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-pink-500/30 border border-pink-400/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch('signup')}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/30 border border-pink-400/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs text-center font-semibold shadow-md">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs text-center font-semibold flex items-center justify-center space-x-2 shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* AUTH FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ================= MODE: SIGN IN ================= */}
          {mode === 'login' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="gamer@shadowqueen.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-pink-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50 transition-all placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccessMsg('');
                      setMode('forgot');
                    }}
                    className="text-xs text-pink-400 hover:text-pink-300 transition-colors font-medium hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-900/90 border border-pink-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/50 transition-all placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 tracking-wide uppercase"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {/* ================= MODE: CREATE ACCOUNT ================= */}
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-pink-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-pink-400 transition-all placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="gamer@shadowqueen.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-pink-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-pink-400 transition-all placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Free Fire In-Game ID (Optional)</label>
                <input
                  type="text"
                  value={inGameId}
                  onChange={(e) => setInGameId(e.target.value)}
                  placeholder="e.g. 589230141"
                  className="w-full px-4 py-3 bg-slate-900/90 border border-pink-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-pink-400 transition-all placeholder:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-3 bg-slate-900/90 border border-pink-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-pink-400 transition-all placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-3 bg-slate-900/90 border border-pink-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-pink-400 transition-all placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-pink-950/30 border border-pink-500/20 rounded-xl flex items-center space-x-2 text-[11px] text-pink-200">
                <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>🎁 New accounts get <strong>30 Welcome Diamonds</strong> bonus after email verification!</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 tracking-wide uppercase"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Send Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {/* ================= MODE: EMAIL VERIFICATION ================= */}
          {mode === 'verify' && (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-900/40 to-pink-950/40 border border-pink-500/30">
                <div className="w-12 h-12 rounded-full bg-pink-600/20 border border-pink-500/40 flex items-center justify-center mx-auto mb-3 text-pink-400">
                  <Mail className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">Verify Your Email</h3>
                <p className="text-xs text-pink-200 mt-1 max-w-xs mx-auto leading-relaxed">
                  A verification email link has been sent to:
                </p>
                <div className="mt-2 py-1.5 px-3 bg-black/60 rounded-lg border border-pink-500/30 text-yellow-300 font-mono text-xs font-bold inline-block">
                  {email || auth.currentUser?.email || 'your-email@domain.com'}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  Please open your email inbox, click the verification link, and then press the button below to complete verification.
                </p>
              </div>

              {/* Status Check Button */}
              <button
                type="button"
                disabled={loading}
                onClick={handleCheckVerification}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold text-sm shadow-lg shadow-teal-500/30 hover:opacity-95 transition-all flex items-center justify-center space-x-2 tracking-wide uppercase"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                    <span>I've Verified My Email - Continue</span>
                  </>
                )}
              </button>

              {/* Resend Link */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-400">Didn't receive email?</span>
                <button
                  type="button"
                  disabled={resendCountdown > 0 || isResending}
                  onClick={handleResendVerification}
                  className="text-xs font-bold text-pink-400 hover:text-pink-300 disabled:text-gray-500 flex items-center space-x-1 hover:underline transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCountdown > 0 ? `Resend Email (${resendCountdown}s)` : 'Resend Verification Email'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ================= FORGOT PASSWORD ================= */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-base font-bold text-white uppercase">Reset Password</h3>
                <p className="text-xs text-gray-400 mt-0.5">Enter your registered email address to receive a password reset link.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@domain.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-pink-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-pink-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 uppercase"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Send Password Reset Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

        </form>

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-purple-500/20 text-center text-xs text-gray-400">
          {mode === 'login' && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleTabSwitch('signup')}
                className="text-pink-400 font-bold hover:text-pink-300 hover:underline"
              >
                Create Account Now
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className="text-pink-400 font-bold hover:text-pink-300 hover:underline"
              >
                Sign In to Account
              </button>
            </p>
          )}

          {(mode === 'forgot' || mode === 'verify') && (
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className="text-pink-400 font-semibold hover:text-pink-300 hover:underline"
            >
              ← Back to Sign In
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
