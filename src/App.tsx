import React, { useState, useEffect } from 'react';
import { User, Tournament, Registration, Transaction, NotificationItem, PlatformTask, EconomySettings, WithdrawalTier, WithdrawalRequest } from './types';
import { INITIAL_TOURNAMENTS, INITIAL_REGISTRATIONS, INITIAL_TRANSACTIONS, INITIAL_NOTIFICATIONS, INITIAL_TASKS, INITIAL_ECONOMY_SETTINGS, INITIAL_WITHDRAWAL_REQUESTS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { TournamentsPage } from './pages/TournamentsPage';
import { WalletPage } from './pages/WalletPage';
import { AdminPortal } from './pages/AdminPortal';
import { AuthModal } from './pages/AuthModal';
import { WithdrawPage } from './pages/WithdrawPage';
import { EarnDiamondsPage } from './pages/EarnDiamondsPage';
import { ProfilePage } from './pages/ProfilePage';
import { FF_IMAGES } from './assets/freeFireAssets';
import { auth, syncUserProfile, logoutFirebase, persistUserDiamonds, persistUserProfile, resetAccountToFresh, fetchAllUsers, applyReferralCode, fetchDiamondTransactions, claimDailyBonusSecurely } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitializing, setAuthInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Standalone animated brand splash screen timer (1.0 second)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Database state
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
  const [registrations, setRegistrations] = useState<Registration[]>(INITIAL_REGISTRATIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  
  const [tasks, setTasks] = useState<PlatformTask[]>(INITIAL_TASKS);
  const [economySettings, setEconomySettings] = useState<EconomySettings>(INITIAL_ECONOMY_SETTINGS);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(INITIAL_WITHDRAWAL_REQUESTS);

  // Persistent Firebase Authentication listener
  useEffect(() => {
    if (!auth) {
      setAuthInitializing(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userProfile = await syncUserProfile(fbUser);
          setCurrentUser(userProfile);
          setUsers(prev => prev.some(u => u.id === userProfile.id) ? prev : [userProfile, ...prev]);

          // Load persistent data for this user
          const savedTx = localStorage.getItem(`sq_tx_${fbUser.uid}`);
          let localTx: Transaction[] = savedTx ? JSON.parse(savedTx) : [];
          
          // Fetch backend transactions (e.g., referral rewards) and merge
          const backendTx = await fetchDiamondTransactions(fbUser.uid);
          if (backendTx && backendTx.length > 0) {
            const merged = [...backendTx, ...localTx];
            // Remove duplicates by ID and sort
            const uniqueTx = Array.from(new Map(merged.map(item => [item.id, item])).values());
            uniqueTx.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setTransactions(uniqueTx);
          } else if (localTx.length > 0) {
            setTransactions(localTx);
          }
          
          const savedReg = localStorage.getItem(`sq_reg_${fbUser.uid}`);
          if (savedReg) setRegistrations(JSON.parse(savedReg));

          const savedNotif = localStorage.getItem(`sq_notif_${fbUser.uid}`);
          if (savedNotif) setNotifications(JSON.parse(savedNotif));

        } catch (e) {
          console.error('Error syncing user profile:', e);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  // Save activity when it changes
  useEffect(() => {
    if (currentUser && transactions.length > 0 && transactions !== INITIAL_TRANSACTIONS) {
      localStorage.setItem(`sq_tx_${currentUser.id}`, JSON.stringify(transactions));
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    if (currentUser && registrations.length > 0 && registrations !== INITIAL_REGISTRATIONS) {
      localStorage.setItem(`sq_reg_${currentUser.id}`, JSON.stringify(registrations));
    }
  }, [registrations, currentUser]);

  useEffect(() => {
    if (currentUser && notifications.length > 0 && notifications !== INITIAL_NOTIFICATIONS) {
      localStorage.setItem(`sq_notif_${currentUser.id}`, JSON.stringify(notifications));
    }
  }, [notifications, currentUser]);

  // Load all registered users from Firestore for the Admin Portal if current user is admin
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      const loadAllUsers = async () => {
        const list = await fetchAllUsers();
        if (list.length > 0) {
          setUsers(list);
        }
      };
      loadAllUsers();
    }
  }, [currentUser?.role]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(`sq_diamonds_${user.id}`, String(user.diamonds));
      localStorage.setItem(`sq_earnings_${user.id}`, String(user.totalEarnings || 0));
    } catch {}
    if (!users.some(u => u.id === user.id)) {
      setUsers([user, ...users]);
    }
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    setActiveTab('home');
  };

  const handleResetAccount = async () => {
    if (!currentUser) return;
    await resetAccountToFresh(currentUser.id);

    const resetUser: User = {
      ...currentUser,
      diamonds: 30,
      totalEarnings: 0,
      matchesPlayed: 0,
      wins: 0,
      kdRatio: 4.2,
      tier: 'Grandmaster'
    };

    setCurrentUser(resetUser);
    setUsers(prev => prev.map(u => u.id === resetUser.id ? resetUser : u));

    // Remove tournament registrations of this user
    setRegistrations(prev => prev.filter(r => r.userId !== currentUser.id));

    // Reset transactions to initial fresh welcome bonus
    const welcomeTx: Transaction = {
      id: `tx_welcome_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'Earn',
      category: 'gift_code',
      amountDiamonds: 30,
      description: 'Welcome Bonus Credited (Fresh Account 💎)',
      timestamp: new Date().toLocaleString(),
      status: 'Success'
    };
    setTransactions(prev => [welcomeTx, ...prev.filter(t => t.userId !== currentUser.id)]);

    const resetNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      title: 'Account Reset Completed 🔄',
      message: 'Aapki ID bilkul fresh new account jese reset ho gayi hai. 30 Welcome Diamonds wallet me credit ho chuke hain!',
      timestamp: 'Just now',
      read: false,
      type: 'system'
    };
    setNotifications(prev => [resetNotif, ...prev.filter(n => n.userId !== currentUser.id)]);
  };

  // Automatically ensure benkarrohan80@gmail.com ID is cleanly reset on request
  useEffect(() => {
    if (currentUser && (currentUser.email?.toLowerCase() === 'benkarrohan80@gmail.com' || currentUser.email?.toLowerCase() === 'shadowyesports1@gmail.com')) {
      const resetKey = `shadowx_auto_reset_app_${currentUser.id}`;
      if (localStorage.getItem(resetKey) !== 'applied_v2') {
        localStorage.setItem(resetKey, 'applied_v2');
        handleResetAccount();
      }
    }
  }, [currentUser?.id]);

  const handleRegisterTournament = (
    tournament: Tournament,
    teamName?: string,
    teammates?: string[],
    chosenSlot?: number,
    playerUid?: string
  ) => {
    if (!currentUser) return;

    // Check if already registered
    const existing = registrations.find(
      r => r.userId === currentUser.id && r.tournamentId === tournament.id && r.status === 'Confirmed'
    );
    if (existing) {
      alert(`You are already registered for this tournament in Slot #${existing.slotNumber}!`);
      return;
    }

    // Determine fixed unique slot
    const occupiedSlots = registrations
      .filter(r => r.tournamentId === tournament.id && r.status === 'Confirmed')
      .map(r => r.slotNumber);

    let finalSlot = chosenSlot;
    if (!finalSlot || occupiedSlots.includes(finalSlot) || finalSlot > tournament.maxSlots || finalSlot < 1) {
      for (let s = 1; s <= tournament.maxSlots; s++) {
        if (!occupiedSlots.includes(s)) {
          finalSlot = s;
          break;
        }
      }
    }

    if (!finalSlot) {
      alert('All slots for this tournament are currently full!');
      return;
    }

    // Deduct entry fee if required
    if (tournament.entryFee > 0) {
      if (currentUser.diamonds < tournament.entryFee) {
        alert(`Insufficient Diamonds! You need ${tournament.entryFee} 💎.`);
        return;
      }
      const newDiamonds = currentUser.diamonds - tournament.entryFee;
      const updatedUser = { ...currentUser, diamonds: newDiamonds };
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      persistUserDiamonds(currentUser.id, newDiamonds);

      // Add debit transaction
      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        type: 'TournamentEntry',
        category: 'tournament_entry',
        amountDiamonds: tournament.entryFee,
        description: `Entry fee for ${tournament.title} (Fixed Slot #${finalSlot})`,
        timestamp: new Date().toLocaleString(),
        status: 'Success'
      };
      setTransactions([newTx, ...transactions]);
    }

    // Create fixed slot registration
    const newReg: Registration = {
      id: `reg_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      inGameId: playerUid || currentUser.inGameId,
      tournamentId: tournament.id,
      tournamentTitle: tournament.title,
      game: tournament.game,
      entryFeePaid: tournament.entryFee,
      teamName: teamName || (tournament.mode === 'Solo' ? 'Solo Warrior' : `Team ${currentUser.name}`),
      teammates: teammates || [],
      registeredAt: new Date().toISOString(),
      status: 'Confirmed',
      slotNumber: finalSlot
    };

    setRegistrations([newReg, ...registrations]);

    // Update tournament registered count
    setTournaments(tournaments.map(t => t.id === tournament.id ? { ...t, registeredCount: t.registeredCount + 1 } : t));

    // Update referral progress
    if (currentUser.hasClaimedReferral) {
      import('./lib/firebase').then(m => {
        m.updateReferralProgress(currentUser.id, { incrementRoom: true }).catch(e => console.warn('Referral update failed', e));
      });
    }

    // Add notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      title: `Slot #${finalSlot} Confirmed! 🎮`,
      message: tournament.entryFee === 0
        ? `Free entry confirmed for ${tournament.title}! Room ID & Password are now unlocked. Sit strictly in Slot #${finalSlot} in custom room.`
        : `Entry fee confirmed for ${tournament.title}. Room ID & Password are now unlocked! Sit strictly in Slot #${finalSlot} in custom room.`,
      timestamp: 'Just now',
      read: false,
      type: 'tournament'
    };
    setNotifications([newNotif, ...notifications]);
  };

  const handleClaimDailyBonus = async (dayIndex: number, amount: number) => {
    if (!currentUser) return;
    const isLuckySpin = dayIndex === 99;

    const res = await claimDailyBonusSecurely(currentUser.id, amount, isLuckySpin);
    if (!res.success) {
      alert(res.error || 'Failed to claim daily bonus.');
      return;
    }

    const newDiamonds = res.newDiamonds !== undefined ? res.newDiamonds : currentUser.diamonds + amount;
    const newEarnings = res.newEarnings !== undefined ? res.newEarnings : (currentUser.totalEarnings || 0) + amount;
    
    const updatedUser = { 
      ...currentUser, 
      diamonds: newDiamonds, 
      totalEarnings: newEarnings,
      lastDailyClaimAt: !isLuckySpin ? new Date().toISOString() : currentUser.lastDailyClaimAt
    };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'Earn',
      category: isLuckySpin ? 'tournament_win' : 'daily_checkin',
      amountDiamonds: amount,
      description: isLuckySpin 
        ? `Booyah Lucky Spin Wheel (+${amount} 💎)` 
        : `Daily Check-in Reward (Day ${dayIndex + 1})`,
      timestamp: new Date().toLocaleString(),
      status: 'Success'
    };
    setTransactions([newTx, ...transactions]);

    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      title: isLuckySpin ? 'Lucky Spin Reward Claimed! 🎯' : 'Daily Bonus Claimed 💎',
      message: isLuckySpin
        ? `Lucky spin arrow landed on ${amount} Diamonds and has been added to your wallet.`
        : `Successfully credited ${amount} Diamonds for daily check-in.`,
      timestamp: 'Just now',
      read: false,
      type: 'earn'
    };
    setNotifications([newNotif, ...notifications]);

    // Update referral progress
    if (!isLuckySpin && currentUser.hasClaimedReferral) {
      import('./lib/firebase').then(m => {
        m.updateReferralProgress(currentUser.id, { incrementDaily: true }).catch(e => console.warn('Referral update failed', e));
      });
    }
  };

  const handleCompleteTask = (taskId: string, rewardDiamonds: number) => {
    if (!currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newDiamonds = currentUser.diamonds + rewardDiamonds;
    const newEarnings = (currentUser.totalEarnings || 0) + rewardDiamonds;
    const updatedUser = { ...currentUser, diamonds: newDiamonds, totalEarnings: newEarnings };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    persistUserDiamonds(currentUser.id, newDiamonds, newEarnings);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'Earn',
      category: 'task',
      amountDiamonds: rewardDiamonds,
      description: `Completed Task: ${task.title}`,
      timestamp: new Date().toLocaleString(),
      status: 'Success'
    };
    setTransactions([newTx, ...transactions]);
  };

  const handleApplyReferralCode = async (code: string) => {
    if (!currentUser) return { success: false, error: 'Must be logged in' };
    try {
      await applyReferralCode(currentUser.id, code);
      // Wait for it to succeed, then update local state
      const reward = 5;
      const newDiamonds = currentUser.diamonds + reward;
      const newEarnings = (currentUser.totalEarnings || 0) + reward;
      const updatedUser = { ...currentUser, diamonds: newDiamonds, totalEarnings: newEarnings, hasClaimedReferral: true };
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      persistUserDiamonds(currentUser.id, newDiamonds, newEarnings);

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        type: 'Earn',
        category: 'referral',
        amountDiamonds: reward,
        description: `Applied Referral Code: ${code}`,
        timestamp: new Date().toISOString(),
        status: 'Success'
      };
      setTransactions([newTx, ...transactions]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to apply referral code' };
    }
  };

  const handleSubmitWithdrawalRequest = (tier: WithdrawalTier, email: string, inGameId: string, _passwordVerify: string) => {
    if (!currentUser) return;
    
    const newDiamonds = currentUser.diamonds - tier.diamondsCost;
    const updatedUser = { ...currentUser, diamonds: newDiamonds };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    persistUserDiamonds(currentUser.id, newDiamonds);

    const newReq: WithdrawalRequest = {
      id: `wreq_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: email,
      inGameId: inGameId || currentUser.inGameId,
      diamondsCost: tier.diamondsCost,
      giftCodeAmountINR: tier.valueINR,
      status: 'Pending',
      requestedAt: new Date().toLocaleString(),
      remarks: 'Awaiting administrator verification.'
    };
    setWithdrawalRequests([newReq, ...withdrawalRequests]);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'Withdrawal',
      category: 'withdrawal',
      amountDiamonds: tier.diamondsCost,
      description: `Requested ₹${tier.valueINR} Google Play Code`,
      timestamp: new Date().toLocaleString(),
      status: 'Success'
    };
    setTransactions([newTx, ...transactions]);
  };

  const handleUpdateWithdrawalStatus = (requestId: string, newStatus: 'Pending' | 'Approved' | 'Rejected', giftCode?: string, remarks?: string) => {
    setWithdrawalRequests(prev => prev.map(w => {
      if (w.id === requestId) {
        return {
          ...w,
          status: newStatus,
          redeemCode: giftCode || w.redeemCode,
          remarks: remarks || w.remarks,
          processedAt: new Date().toLocaleString()
        };
      }
      return w;
    }));
  };

  const handleCreateTournament = (newT: Tournament) => {
    setTournaments([newT, ...tournaments]);
  };

  const handleUpdateTournament = (updatedT: Tournament) => {
    setTournaments(tournaments.map(t => t.id === updatedT.id ? updatedT : t));
    if (updatedT.roomId) {
      const regUsers = registrations.filter(r => r.tournamentId === updatedT.id && r.status === 'Confirmed');
      regUsers.forEach(r => {
        const notif: NotificationItem = {
          id: `notif_${Date.now()}_${r.userId}`,
          userId: r.userId,
          title: `Room ID & Pass Updated: ${updatedT.title} 🔑`,
          message: `Room ID: ${updatedT.roomId} | Password: ${updatedT.roomPassword || 'None'}. Your slot is Slot #${r.slotNumber}. Join now!`,
          timestamp: 'Just now',
          read: false,
          type: 'tournament'
        };
        setNotifications(prev => [notif, ...prev]);
      });
    }
  };

  const handleDeleteTournament = (id: string) => {
    setTournaments(tournaments.filter(t => t.id !== id));
    setRegistrations(registrations.filter(r => r.tournamentId !== id));
  };

  const handleUpdateRegistrationSlot = (regId: string, newSlot: number) => {
    setRegistrations(registrations.map(r => r.id === regId ? { ...r, slotNumber: newSlot } : r));
  };

  const handleCancelRegistration = (regId: string, refund: boolean = true) => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;

    if (refund && reg.entryFeePaid > 0) {
      const userToRefund = users.find(u => u.id === reg.userId);
      if (userToRefund) {
        const newDiamonds = userToRefund.diamonds + reg.entryFeePaid;
        const updated = { ...userToRefund, diamonds: newDiamonds };
        setUsers(users.map(u => u.id === updated.id ? updated : u));
        if (currentUser && currentUser.id === userToRefund.id) {
          setCurrentUser(updated);
        }
        persistUserDiamonds(userToRefund.id, newDiamonds);

        const refundTx: Transaction = {
          id: `tx_${Date.now()}`,
          userId: userToRefund.id,
          userName: userToRefund.name,
          type: 'Credit',
          amountDiamonds: reg.entryFeePaid,
          description: `Entry fee refunded for ${reg.tournamentTitle} (Slot #${reg.slotNumber})`,
          timestamp: new Date().toLocaleString(),
          status: 'Success'
        };
        setTransactions([refundTx, ...transactions]);
      }
    }

    setRegistrations(registrations.filter(r => r.id !== regId));
    setTournaments(tournaments.map(t => t.id === reg.tournamentId ? { ...t, registeredCount: Math.max(0, t.registeredCount - 1) } : t));
  };

  const handleUpdateUserDiamonds = (userId: string, newDiamonds: number) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const oldDiamonds = userToUpdate.diamonds;
    const diff = newDiamonds - oldDiamonds;
    if (diff === 0) return;

    setUsers(users.map(u => u.id === userId ? { ...u, diamonds: newDiamonds } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser({ ...currentUser, diamonds: newDiamonds });
    }
    persistUserDiamonds(userId, newDiamonds);

    // Create transaction log
    const changeTx: Transaction = {
      id: `tx_admin_${Date.now()}`,
      userId,
      userName: userToUpdate.name,
      type: diff >= 0 ? 'Earn' : 'Debit',
      category: 'gift_code',
      amountDiamonds: Math.abs(diff),
      description: `Diamonds balance adjusted by Admin (${diff >= 0 ? '+' : '-'}${Math.abs(diff)} 💎)`,
      timestamp: new Date().toLocaleString(),
      status: 'Success'
    };
    setTransactions(prev => [changeTx, ...prev]);

    // Send notification to the user
    const changeNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      userId,
      title: 'Diamonds Balance Updated! 💎',
      message: `Admin ne aapke wallet me diamonds adjust kiye hain. Naya balance: ${newDiamonds} Diamonds.`,
      timestamp: 'Just now',
      read: false,
      type: 'wallet'
    };
    setNotifications(prev => [changeNotif, ...prev]);
  };

  const handleDeclareTournamentWinner = (tournamentId: string, winnerUserId: string) => {
    const t = tournaments.find(item => item.id === tournamentId);
    if (!t) return;

    const winner = users.find(u => u.id === winnerUserId);
    if (!winner) return;

    const prize = t.prizePool || 0;
    const newDiamonds = winner.diamonds + prize;
    const newEarnings = (winner.totalEarnings || 0) + prize;
    const newWins = (winner.wins || 0) + 1;
    const newMatches = (winner.matchesPlayed || 0) + 1;

    // Update Winner user profile
    const updatedWinner: User = {
      ...winner,
      diamonds: newDiamonds,
      totalEarnings: newEarnings,
      wins: newWins,
      matchesPlayed: newMatches
    };

    let updatedUsers = users.map(u => u.id === winnerUserId ? updatedWinner : u);

    // Also increment matchesPlayed for ALL registered participants in this tournament
    const confirmedRegs = registrations.filter(r => r.tournamentId === tournamentId && r.status === 'Confirmed');
    
    confirmedRegs.forEach(reg => {
      if (reg.userId !== winnerUserId) {
        const participant = updatedUsers.find(u => u.id === reg.userId);
        if (participant) {
          const pNewMatches = (participant.matchesPlayed || 0) + 1;
          const pUpdated: User = { ...participant, matchesPlayed: pNewMatches };
          updatedUsers = updatedUsers.map(u => u.id === reg.userId ? pUpdated : u);
          persistUserProfile(reg.userId, { matchesPlayed: pNewMatches });
        }
      }
    });

    setUsers(updatedUsers);

    if (currentUser) {
      const selfInUpdated = updatedUsers.find(u => u.id === currentUser.id);
      if (selfInUpdated) {
        setCurrentUser(selfInUpdated);
      }
    }

    // Persist winner in Firestore
    persistUserProfile(winnerUserId, {
      diamonds: newDiamonds,
      totalEarnings: newEarnings,
      wins: newWins,
      matchesPlayed: newMatches
    });

    // Mark Tournament as Completed & store winner details
    const updatedTournament: Tournament = {
      ...t,
      status: 'Completed',
      winnerUserId: winnerUserId,
      winnerName: winner.name,
      winnerTeam: winner.inGameId || winner.name
    };

    setTournaments(tournaments.map(item => item.id === tournamentId ? updatedTournament : item));

    // Record Win Transaction
    const winTx: Transaction = {
      id: `tx_win_${Date.now()}`,
      userId: winnerUserId,
      userName: winner.name,
      type: 'TournamentWin',
      category: 'tournament_win',
      amountDiamonds: prize,
      description: `🏆 1st Place Winner Prize for "${t.title}"! (+${prize} 💎)`,
      timestamp: new Date().toLocaleString(),
      status: 'Success'
    };
    setTransactions(prev => [winTx, ...prev]);

    // Send Notification to Winner
    const winNotif: NotificationItem = {
      id: `notif_win_${Date.now()}`,
      userId: winnerUserId,
      title: '🏆 BOOYAH! Tournament Winner!',
      message: `Badhai Ho! Aap "${t.title}" ke winner bane hain. ${prize} Diamonds aapke wallet me add kar diye gaye hain!`,
      timestamp: 'Just now',
      read: false,
      type: 'win'
    };
    setNotifications(prev => [winNotif, ...prev]);

    // Send Notification to all other participants
    confirmedRegs.filter(r => r.userId !== winnerUserId).forEach(reg => {
      const pNotif: NotificationItem = {
        id: `notif_${Date.now()}_${reg.userId}`,
        userId: reg.userId,
        title: '🎮 Tournament Result Announced!',
        message: `The match "${t.title}" is complete! Winner: ${winner.name} 🏆. Matches Played has been updated in your profile.`,
        timestamp: 'Just now',
        read: false,
        type: 'tournament'
      };
      setNotifications(prev => [pNotif, ...prev]);
    });
  };

  const handleSendNotification = (title: string, message: string) => {
    if (!currentUser) return;
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      title,
      message,
      timestamp: 'Just now',
      read: false,
      type: 'system'
    };
    setNotifications([newNotif, ...notifications]);
  };

  const handleMarkNotificationsRead = () => {
    if (!currentUser) return;
    setNotifications(notifications.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
  };

  const handleUpdateProfile = (updatedData: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updatedData };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    persistUserProfile(currentUser.id, updatedData);

    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      title: 'Profile Updated Successfully! 🎮',
      message: 'Your Free Fire gamer profile and IGN/UID details have been saved.',
      timestamp: 'Just now',
      read: false,
      type: 'system'
    };
    setNotifications([newNotif, ...notifications]);
  };

  if (authInitializing || showSplash) {
    return (
      <div className="min-h-screen bg-[#06070a] flex flex-col items-center justify-center text-white relative overflow-hidden select-none">
        {/* Deep ambient glowing backgrounds */}
        <div className="absolute w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none transform-gpu animate-pulse"></div>
        <div className="absolute w-[350px] h-[350px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none transform-gpu animate-pulse delay-75"></div>
        
        {/* Animated logo content */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          
          {/* Circular channel logo with modern gradients and glowing shadows */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-[3px] bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500 shadow-[0_0_50px_rgba(236,72,153,0.3)] animate-bounce duration-1000">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#090a0f] p-[2px]">
              <img 
                src={FF_IMAGES.shadowQueenLogo} 
                alt="Shadow Queen Gaming Logo" 
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover animate-pulse"
              />
            </div>
            
            {/* Crown emoji floating decoration */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-[0_0_15px_rgba(253,224,71,0.85)] animate-bounce">
              <span className="text-4xl">👑</span>
            </div>
          </div>
          
          {/* Animated Brand Typography */}
          <div className="mt-8 text-center animate-pulse">
            <h1 className="text-2xl sm:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-rose-300 uppercase">
              SHADOW X
            </h1>
            <p className="text-[10px] sm:text-xs font-black tracking-[0.25em] text-pink-400/80 uppercase mt-2">
              BY @SHADOWQUEENGAMING
            </p>
          </div>
        </div>

        {/* Dynamic bottom progress indicator bar */}
        <div className="absolute bottom-16 w-48 h-1 bg-slate-900/80 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full animate-pulse w-full"></div>
        </div>
      </div>
    );
  }

  // Gate the entire application: If user is not logged in or unverified, show ONLY the clean Sign In screen.
  // The website is NOT rendered in the background, eliminating scrolling glitches and performance issues.
  if (!currentUser || currentUser.isVerified === false) {
    return (
      <AuthModal
        isOpen={true}
        isStandaloneScreen={true}
        unverifiedUser={currentUser && currentUser.isVerified === false ? currentUser : null}
        onClose={() => {}}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#06070a] text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white relative overflow-x-hidden">
      
      {/* Global Fixed Free Fire Background Wallpaper for All Pages */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img 
          src={FF_IMAGES.bermudaSquad} 
          alt="Free Fire Background Wallpaper" 
          referrerPolicy="no-referrer" 
          className="w-full h-full object-cover opacity-20 filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06070a]/90 via-[#06070a]/80 to-[#06070a]"></div>
        <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-purple-600/15 rounded-full blur-[130px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[350px] bg-red-600/15 rounded-full blur-[140px]"></div>
      </div>

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        notifications={currentUser ? notifications.filter(n => n.userId === currentUser.id) : []}
        onMarkNotificationsRead={handleMarkNotificationsRead}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {activeTab === 'home' && (
          <Home
            setActiveTab={setActiveTab}
            tournaments={tournaments}
            currentUser={currentUser}
            registrations={registrations}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSelectTournament={(t) => {
              setSelectedTournament(t);
              setActiveTab('tournaments');
            }}
          />
        )}
        {activeTab === 'tournaments' && (
          <TournamentsPage
            tournaments={tournaments}
            currentUser={currentUser}
            registrations={registrations}
            onRegister={handleRegisterTournament}
            onOpenAuth={() => setAuthModalOpen(true)}
            selectedTournament={selectedTournament}
            setSelectedTournament={setSelectedTournament}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'earn' && (
          <EarnDiamondsPage
            currentUser={currentUser}
            tasks={tasks}
            economySettings={economySettings}
            onClaimDailyBonus={handleClaimDailyBonus}
            onCompleteTask={handleCompleteTask}
            onApplyReferralCode={handleApplyReferralCode}
            onOpenAuth={() => setAuthModalOpen(true)}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'wallet' && (
          <WalletPage
            currentUser={currentUser}
            transactions={transactions}
            onOpenAuth={() => setAuthModalOpen(true)}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'withdraw' && (
          <WithdrawPage
            currentUser={currentUser}
            withdrawalTiers={economySettings.withdrawalTiers}
            withdrawalRequests={withdrawalRequests}
            onSubmitWithdrawalRequest={handleSubmitWithdrawalRequest}
            onOpenAuth={() => setAuthModalOpen(true)}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            tournaments={tournaments}
            registrations={registrations}
            transactions={transactions}
            onUpdateProfile={handleUpdateProfile}
            onResetAccount={handleResetAccount}
            onOpenAuth={() => setAuthModalOpen(true)}
            setActiveTab={setActiveTab}
            onSelectTournament={(t) => {
              setSelectedTournament(t);
              setActiveTab('tournaments');
            }}
          />
        )}
        {activeTab === 'admin' && (
          <AdminPortal
            currentUser={currentUser}
            users={users}
            tournaments={tournaments}
            transactions={transactions}
            registrations={registrations}
            withdrawalRequests={withdrawalRequests}
            onUpdateWithdrawalStatus={handleUpdateWithdrawalStatus}
            onCreateTournament={handleCreateTournament}
            onUpdateTournament={handleUpdateTournament}
            onDeleteTournament={handleDeleteTournament}
            onUpdateRegistrationSlot={handleUpdateRegistrationSlot}
            onCancelRegistration={handleCancelRegistration}
            onUpdateUserDiamonds={handleUpdateUserDiamonds}
            onSendNotification={handleSendNotification}
            onOpenAuth={() => setAuthModalOpen(true)}
            onDeclareTournamentWinner={handleDeclareTournamentWinner}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* Auth Modal (if user opens login/signup while already inside the app) */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          isStandaloneScreen={false}
          unverifiedUser={null}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

    </div>
  );
}
