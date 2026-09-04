import React, { useState } from 'react';
import { User, WithdrawalTier, WithdrawalRequest } from '../types';
import { 
  Download, CheckCircle2, ShieldCheck, Coins, Sparkles, Copy, 
  ExternalLink, AlertCircle, Mail, Lock, Check, ArrowRight, Clock, KeyRound, QrCode, User as UserIcon
} from 'lucide-react';
import { FF_IMAGES } from '../assets/freeFireAssets';

interface WithdrawPageProps {
  currentUser: User | null;
  withdrawalTiers: WithdrawalTier[];
  withdrawalRequests: WithdrawalRequest[];
  onSubmitWithdrawalRequest: (tier: WithdrawalTier, email: string, inGameId: string, passwordVerify: string) => void;
  onOpenAuth: () => void;
  setActiveTab: (tab: string) => void;
}

export const WithdrawPage: React.FC<WithdrawPageProps> = ({
  currentUser,
  withdrawalTiers,
  withdrawalRequests,
  onSubmitWithdrawalRequest,
  onOpenAuth,
  setActiveTab,
}) => {
  const [selectedTier, setSelectedTier] = useState<WithdrawalTier>(
    withdrawalTiers[1] || withdrawalTiers[0]
  );
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [accountPassword, setAccountPassword] = useState('');
  const [inGameId, setInGameId] = useState(currentUser?.inGameId || '');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    tier?: WithdrawalTier;
    code?: string;
  }>({ show: false });

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const userWithdrawalRequests = currentUser
    ? withdrawalRequests.filter(r => r.userId === currentUser.id)
    : [];

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!accountPassword.trim()) {
      setErrorMsg('⚠️ Please enter your account password to authorize this withdrawal.');
      return;
    }

    if (currentUser.diamonds < selectedTier.diamondsCost) {
      setErrorMsg(`Insufficient diamonds! You have ${currentUser.diamonds} 💎, but need ${selectedTier.diamondsCost} 💎 for this Play Store Redeem Code.`);
      return;
    }

    onSubmitWithdrawalRequest(selectedTier, userEmail.trim() || currentUser.email, inGameId.trim(), accountPassword.trim());

    setAccountPassword('');
    setSuccessModal({
      show: true,
      tier: selectedTier,
      code: undefined // Under admin review or auto-processed
    });
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white py-6 sm:py-10 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Free Fire Image Wallpaper */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15">
        <img src={FF_IMAGES.googlePlayBanner} alt="Google Play Code Wallpaper" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090a0f]/90 via-[#090a0f]/80 to-[#090a0f]"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-12 relative z-10">
        
        {/* Promotional Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-cyan-950/90 shadow-2xl">
          <div className="absolute inset-0 z-0 flex items-center justify-end">
            <img 
              src={FF_IMAGES.playstoreRedeemCard} 
              alt="Google Play Store Redeem Code Voucher" 
              referrerPolicy="no-referrer"
              className="w-full md:w-2/3 h-full object-cover opacity-35 object-center mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/85 to-transparent"></div>
          </div>

          <div className="relative z-10 p-8 sm:p-12 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Official Google Play Store Redeem Codes</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
              Withdraw Diamonds as <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Play Store Redeem Codes
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Convert your tournament winnings and task diamonds into instant Google Play Redeem Codes. Top up Free Fire Diamonds, Special Airdrops, Elite Pass, or purchase any in-app items directly through your Google Play balance!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-bold text-gray-300">
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Genuine Play Store Redeem Codes</span>
              </div>
              <div className="flex items-center space-x-1.5 text-cyan-400">
                <Clock className="w-4 h-4" />
                <span>Instant Code Reveal Upon Approval</span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Status Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">Your Available Diamonds</span>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-3xl sm:text-4xl">💎</span>
              <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-amber-300">
                {currentUser ? currentUser.diamonds.toLocaleString() : '0'} Diamonds
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {currentUser && currentUser.diamonds >= 350
                ? '✅ You have enough diamonds for a Play Store Redeem Code withdrawal!'
                : '💡 Tip: Complete tasks or win tournaments to reach 350 💎 minimum.'}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('earn')}
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Earn More Diamonds</span>
          </button>
        </div>

        {/* Withdrawal Options Grid & Checkout Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Options Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">Select Play Store Redeem Code</h2>
              <p className="text-xs text-gray-400 mt-1">Choose the Play Store Redeem Code denomination that fits your diamond balance.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {withdrawalTiers.map((tier) => {
                const isSelected = selectedTier.id === tier.id;
                const canAfford = currentUser ? currentUser.diamonds >= tier.diamondsCost : true;

                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`relative rounded-3xl p-5 cursor-pointer transition-all border flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-b from-emerald-950/80 to-slate-900 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xl scale-[1.02]'
                        : 'bg-slate-900/80 border-purple-500/20 hover:border-emerald-500/40'
                    }`}
                  >
                    {/* Visual Google Play Redeem Voucher Art Tag */}
                    <div className="absolute top-0 right-0 w-28 h-28 opacity-15 pointer-events-none overflow-hidden">
                      <img 
                        src={FF_IMAGES.playstoreRedeemCard} 
                        alt="Play Store Redeem Code" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    {tier.popular && (
                      <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md z-10">
                        Best Value ⭐
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-lg">
                          ₹
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-950 border border-purple-500/30 text-purple-300">
                          {tier.diamondsCost} 💎
                        </span>
                      </div>

                      <h3 className="text-2xl font-black text-white">₹{tier.valueINR} Redeem Code</h3>
                      <p className="text-xs text-emerald-400 font-semibold mt-1">Play Store Digital Voucher</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-purple-500/10 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        {canAfford ? 'Balance Available' : 'Need more diamonds'}
                      </span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-gray-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* How to Redeem Guide */}
            <div className="bg-slate-900/60 border border-purple-500/20 rounded-2xl p-6 space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>How to Redeem Play Store Code:</span>
              </h4>
              <ol className="space-y-2 text-xs text-gray-300 list-decimal list-inside leading-relaxed">
                <li>Submit your withdrawal request with your verified email ID and Free Fire UID.</li>
                <li>Once approved, your unique 16-character Google Play Redeem Code will appear in your Redeem History below.</li>
                <li>Open Google Play Store on your phone &gt; tap your Profile Icon &gt; tap <strong>Payments & Subscriptions</strong> &gt; <strong>Redeem Code</strong>. Your Google Play balance updates instantly!</li>
              </ol>
            </div>
          </div>

          {/* Checkout & Submit Column (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6">
            
            {/* Visual Header with Play Store Card Thumbnail */}
            <div className="rounded-2xl overflow-hidden border border-emerald-500/30 relative h-28 bg-slate-950">
              <img 
                src={FF_IMAGES.playstoreRedeemCard} 
                alt="Play Store Redeem Code Preview" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end p-3">
                <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                  Official Google Play Digital Code
                </span>
              </div>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-5">
              <div>
                <h3 className="text-xl font-black text-white">Confirm Redeem Request</h3>
                <p className="text-xs text-gray-400 mt-1">Authorize withdrawal with your account password.</p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/20 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Redeem Code:</span>
                  <span className="font-bold text-white">₹{selectedTier.valueINR} Play Store Code</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Diamonds Deducted:</span>
                  <span className="font-black text-cyan-400">{selectedTier.diamondsCost} 💎</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Current Balance:</span>
                  <span className="font-bold text-amber-400">{currentUser ? currentUser.diamonds : 0} 💎</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-purple-500/20">
                  <span className="text-gray-400 font-bold">Balance After Claim:</span>
                  <span className="font-bold text-white">
                    {currentUser ? Math.max(0, currentUser.diamonds - selectedTier.diamondsCost) : 0} 💎
                  </span>
                </div>
              </div>

              {/* Account Identity Details (Username & Email only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Username</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.name || 'Guest User'}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-purple-500/20 rounded-xl text-gray-300 text-sm font-semibold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="e.g. gamer@gmail.com"
                    className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Input: Free Fire In Game ID */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  <span>Free Fire In-Game UID (Optional)</span>
                </label>
                <input
                  type="text"
                  value={inGameId}
                  onChange={(e) => setInGameId(e.target.value)}
                  placeholder="e.g. FF_58923014"
                  className="w-full px-4 py-3 bg-slate-950 border border-purple-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Input: Account Password Verification */}
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Account Password (Required for Security) *</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full px-4 py-3 bg-slate-950 border border-amber-500/40 focus:border-amber-400 rounded-xl text-white text-sm focus:outline-none placeholder-gray-500"
                  />
                </div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  🔒 Password verification protects your diamonds from unauthorized claims.
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 hover:opacity-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Withdraw ₹{selectedTier.valueINR} Redeem Code ({selectedTier.diamondsCost} 💎)</span>
              </button>
            </form>
          </div>

        </div>

        {/* Withdrawal History Table */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
            <div>
              <h2 className="text-xl font-black text-white">Your Play Store Redeem Codes</h2>
              <p className="text-xs text-gray-400">Track requested Play Store vouchers and copy your active redeem codes.</p>
            </div>

            <a
              href="https://play.google.com/redeem"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              <span>Open Google Play Store Redeem Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-500/20 text-xs text-gray-400 uppercase">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Redeem Code Voucher</th>
                  <th className="py-3 px-4">Diamonds Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Redeem Code</th>
                  <th className="py-3 px-4">Requested At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10 text-sm">
                {userWithdrawalRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      No Play Store Redeem Codes requested yet. Reach 350 💎 to claim your first ₹30 Google Play Redeem Code!
                    </td>
                  </tr>
                ) : (
                  userWithdrawalRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-purple-900/10 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs text-gray-400">
                        #{req.id.slice(-6)}
                      </td>
                      <td className="py-4 px-4 font-bold text-white">
                        ₹{req.giftCodeAmountINR} Play Store Redeem Code
                      </td>
                      <td className="py-4 px-4 font-black text-cyan-400">
                        {req.diamondsCost} 💎
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          req.status === 'Approved'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                            : req.status === 'Pending'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                            : 'bg-red-950/70 text-red-300 border border-red-500/40'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {req.giftCode ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold px-3 py-1 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 select-all">
                              {req.giftCode}
                            </span>
                            <button
                              onClick={() => handleCopyCode(req.id, req.giftCode!)}
                              className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 transition-colors cursor-pointer"
                              title="Copy Code"
                            >
                              {copiedCodeId === req.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Processing redeem code...</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-400">
                        {req.requestedAt}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Success Modal */}
        {successModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="relative w-full max-w-md bg-[#0d0f17] border border-emerald-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div>
                <h3 className="text-2xl font-black text-white">Withdrawal Submitted!</h3>
                <p className="text-sm text-gray-300 mt-2">
                  Your request for <strong className="text-emerald-400">₹{successModal.tier?.valueINR} Play Store Redeem Code</strong> has been placed.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Your code will be generated and issued by the admin team. You can view and copy the redeem code directly from your Redeem History.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSuccessModal({ show: false })}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:opacity-95 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

