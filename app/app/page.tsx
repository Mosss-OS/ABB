'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@/lib/privy/PrivyProvider';
import { 
  FiGlobe, FiFileText, FiLink, FiZap, FiTarget,
  FiDollarSign, FiCheck, FiPlus, FiCpu, FiArrowRight, FiCopy, FiLogOut, FiExternalLink
} from 'react-icons/fi';

interface User {
  fid: number;
  username: string;
}

interface Bounty {
  id: string;
  task: string;
  type: string;
  reward: number;
  status: string;
  deadlineTs: number;
  workerUsername?: string;
  bidCount?: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  translate: <FiGlobe size={18} />,
  summarize: <FiFileText size={18} />,
  'onchain-lookup': <FiLink size={18} />,
  simple: <FiZap size={18} />,
  custom: <FiTarget size={18} />,
};

const typeGradient: Record<string, string> = {
  translate: 'from-blue-500 to-cyan-500',
  summarize: 'from-purple-500 to-pink-500',
  'onchain-lookup': 'from-yellow-500 to-orange-500',
  simple: 'from-orange-500 to-red-500',
  custom: 'from-pink-500 to-rose-500',
};

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  open: { bg: 'bg-[#34C759]/15', color: 'text-[#34C759]', label: 'Open' },
  assigned: { bg: 'bg-[#FF9500]/15', color: 'text-[#FF9500]', label: 'In Progress' },
  completed: { bg: 'bg-[#007AFF]/15', color: 'text-[#007AFF]', label: 'Done' },
  settled: { bg: 'bg-[#AF52DE]/15', color: 'text-[#AF52DE]', label: 'Paid' },
};

export default function MiniApp() {
  const [user, setUser] = useState<User | null>(null);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [rewardUsdc, setRewardUsdc] = useState(1);
  const [creating, setCreating] = useState(false);
  const [bountyCreated, setBountyCreated] = useState<{id: string, task: string, reward: number} | null>(null);
  const [posted, setPosted] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState<any>(null);
  const [fundingAddress, setFundingAddress] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number>(0);
  const [copyingAddress, setCopyingAddress] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [walletLoading, setWalletLoading] = useState(false);
  const router = useRouter();
  const sdkRef = useRef<any>(null);

  const { login, logout, user: privyUser, ready } = usePrivy();

  const handleRunAgent = async () => {
    setAgentRunning(true);
    setAgentResult(null);
    try {
      const res = await fetch('/api/autonomous', { method: 'POST' });
      const data = await res.json();
      setAgentResult(data);
      fetchBounties();
    } catch (e) {
      setAgentResult({ error: 'Failed to run agent' });
    }
    setAgentRunning(false);
  };

  async function fetchBounties() {
    try {
      const res = await fetch('/api/bounties');
      const data = await res.json();
      setBounties(data.bounties || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handlePrivyLogin = async () => {
    try {
      await login();
    } catch (e) {
      console.error('Privy login error:', e);
    }
  };

  const initPrivyWallet = async (fid: number, username: string) => {
    setWalletLoading(true);
    try {
      const res = await fetch('/api/auth/privy-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid, username }),
      });
      const data = await res.json();
      if (data.address) {
        setFundingAddress(data.address);
        setUserBalance(data.balance || 0);
      }
    } catch (e) {
      console.error('Failed to init Privy wallet:', e);
    }
    setWalletLoading(false);
  };

  useEffect(() => {
    async function initSDK() {
      try {
        const miniappSdk = (await import('@farcaster/miniapp-sdk')).default;
        await miniappSdk.actions.ready();
        const ctx = await miniappSdk.context;
        if (ctx?.user) {
          setUser({ fid: ctx.user.fid, username: ctx.user.username || '' });
        }
        sdkRef.current = miniappSdk;
      } catch (e) {
        console.log('SDK init error:', e);
      }
    }
    initSDK();
    fetchBounties();
  }, []);

  useEffect(() => {
    if (!user?.fid) return;
    initPrivyWallet(user.fid, user.username);
  }, [user?.fid]);

  const handleDisconnect = () => {
    setShowAccountMenu(false);
    setUser(null);
    setFundingAddress('');
    logout();
  };

  const handleCreateBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskDescription,
          taskType: 'simple',
          rewardUsdc,
          deadlineHours: 24,
          posterFid: user?.fid || 0,
          posterUsername: user?.username || 'anonymous',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBountyCreated({ id: data.id, task: taskDescription, reward: rewardUsdc });
        setPosted(true);
        setTaskDescription('');
        setRewardUsdc(1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  if (bountyCreated) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center p-5">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#1C1C1E] rounded-3xl p-8 text-center max-w-sm w-full"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-r from-[#FF9500] to-[#FF3B30] rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <FiCheck size={28} className="text-black" />
          </motion.div>
          <div className="text-lg font-semibold text-white mb-2">Bounty Created!</div>
          <div className="text-sm text-white/60 mb-4">{bountyCreated.task}</div>
          <div className="text-2xl font-bold text-[#FF9500] mb-4">
            <FiDollarSign className="inline" size={20} />{bountyCreated.reward}
          </div>
          {posted && (
            <div className="text-xs text-[#34C759] mb-4">✓ Shared to Warpcast</div>
          )}
          <button 
            onClick={() => { setBountyCreated(null); setShowForm(false); }}
            className="w-full bg-[#3A3A3C] text-white font-medium py-3 rounded-2xl text-sm"
          >
            Create Another
          </button>
        </motion.div>
      </div>
    );
  }

  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center p-5">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center w-full max-w-sm"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-[#FF9500] to-[#FF3B30] rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FiCpu size={36} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ABB</h1>
          <p className="text-white/60 mb-8">Agent Bounty Board</p>
          
          <button 
            onClick={() => setShowSplash(false)}
            className="bg-gradient-to-r from-[#FF9500] to-[#FF3B30] text-black font-semibold py-3 px-8 rounded-2xl mb-4 w-full max-w-xs"
          >
            Enter App
          </button>
          
          <div className="mt-6">
            <a 
              href="https://warpcast.com/~/channel/abb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/40 flex items-center justify-center gap-2 hover:text-white transition-colors"
            >
              <FiExternalLink size={12} />
              Open in Warpcast
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000]">
      <div className="max-w-md mx-auto bg-[#000] min-h-screen">
        <div className="p-5">
          {user && (walletLoading ? (
            <div className="mb-4 bg-[#1C1C1E] rounded-xl p-3">
              <div className="text-xs text-white/60">Loading Privy Wallet...</div>
            </div>
          ) : fundingAddress && (
            <div className="mb-4 bg-[#1C1C1E] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] text-[#34C759]">Privy Wallet</div>
                <div className="text-[10px] bg-[#34C759]/20 text-[#34C759] px-2 py-0.5 rounded">Active</div>
              </div>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(fundingAddress);
                  setCopyingAddress(true);
                  setTimeout(() => setCopyingAddress(false), 2000);
                }}
                className="w-full text-left text-xs text-[#FF9500] hover:text-[#FF3B30] transition-colors flex items-center gap-1"
              >
                <FiCopy size={10} />
                {copyingAddress ? 'Copied!' : fundingAddress}
              </button>
              <div className="flex items-center justify-between mt-2">
                <div className="text-[10px] text-white/40">
                  <FiDollarSign className="inline" size={8} />{userBalance.toFixed(2)} USDC
                </div>
                <a 
                  href="https://bridge.base.org/deposit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] bg-[#FF9500] text-black px-2 py-1 rounded-lg font-medium hover:bg-[#FF3B30] transition-colors"
                >
                  Get Test USDC
                </a>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">ABB</h1>
              <p className="text-xs text-white/40">Agent Bounty Board</p>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="https://warpcast.com/~/channel/abb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white transition-colors"
              >
                <FiExternalLink size={16} />
              </a>
              <div className="relative" style={{ zIndex: 100 }}>
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 cursor-pointer p-1"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF9500] to-[#FF3B30] flex items-center justify-center text-black text-xs font-semibold">
                    {user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                </button>
                {showAccountMenu && user && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-12 right-0 bg-[#2C2C2E] rounded-2xl p-4 w-56 shadow-xl"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="text-xs text-white/60 mb-2">{user.username}</div>
                    <div className="text-[10px] text-[#34C759] mb-3 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#34C759]"></div>
                      Privy Wallet Connected
                    </div>
                    {fundingAddress && (
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(fundingAddress);
                          setCopyingAddress(true);
                          setTimeout(() => setCopyingAddress(false), 2000);
                        }}
                        className="w-full text-left text-xs text-white/80 hover:text-[#FF9500] transition-colors flex items-center gap-2 mb-2"
                      >
                        <FiCopy size={12} />
                        {copyingAddress ? 'Copied!' : 'Copy Wallet Address'}
                      </button>
                    )}
                    <div className="border-t border-white/10 pt-2 mt-2">
                      <button
                        onClick={handleDisconnect}
                        className="w-full text-left text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
                      >
                        <FiLogOut size={12} />
                        Disconnect
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showForm ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white/80">Active Bounties</h2>
                  <button 
                    onClick={handleRunAgent}
                    disabled={agentRunning}
                    className="text-xs bg-[#3A3A3C] text-white/60 px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  >
                    <FiCpu size={12} />
                    {agentRunning ? 'Running...' : 'Agent'}
                  </button>
                </div>

                {agentResult && (
                  <div className="bg-[#2C2C2E] rounded-2xl p-3 mb-4">
                    <div className="text-[10px] text-white/40 mb-1">Agent Results</div>
                    <div className="text-xs text-white/80">
                      Evaluated: {agentResult.results?.evaluated || 0} · 
                      Bid: {agentResult.results?.bid || 0} ·
                      Skipped: {agentResult.results?.skippedAlreadyBid || 0}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Bounties</h2>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-[#FF9500] to-[#FF3B30] text-black font-semibold text-xs px-4 py-2 rounded-full"
                  >
                    <FiPlus className="inline" size={14} /> New
                  </button>
                </div>
                
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="bg-[#1C1C1E] rounded-2xl h-24 animate-pulse" />
                    ))}
                  </div>
                ) : bounties.length === 0 ? (
                  <div className="bg-[#1C1C1E] rounded-2xl p-8 text-center">
                    <div className="text-white/40 text-sm">No bounties yet</div>
                    <div className="text-white/20 text-xs mt-1">Create one to get started</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bounties.map((bounty) => (
                      <motion.div 
                        key={bounty.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#1C1C1E] rounded-2xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeGradient[bounty.type] || typeGradient.simple} flex items-center justify-center text-white`}>
                            {typeIcons[bounty.type] || typeIcons.simple}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-white/30">{bounty.id.slice(0,12)}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig[bounty.status]?.bg} ${statusConfig[bounty.status]?.color}`}>
                                {statusConfig[bounty.status]?.label}
                              </span>
                            </div>
                            <div className="text-sm text-white font-medium line-clamp-2">{bounty.task}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-[#FF9500]">
                              <FiDollarSign className="inline" size={12} />{bounty.reward}
                            </span>
                            {bounty.status === 'assigned' && bounty.workerUsername && (
                              <span className="text-xs text-white/40">→ @{bounty.workerUsername}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {bounty.bidCount && bounty.bidCount > 0 && (
                              <span className="text-xs text-white/40">{bounty.bidCount} bid{bounty.bidCount !== 1 ? 's' : ''}</span>
                            )}
                            <FiArrowRight size={14} className="text-white/20" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleCreateBounty}
                className="bg-[#1C1C1E] rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-5">
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-sm text-white/60"
                  >
                    Cancel
                  </button>
                  <h2 className="text-sm font-semibold text-white">New Bounty</h2>
                  <div className="w-12" />
                </div>
                
                <div className="mb-4">
                  <label className="text-xs text-white/40 mb-2 block">Task Description</label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="What do you need done?"
                    className="w-full bg-[#2C2C2E] rounded-xl p-4 text-sm text-white placeholder-white/30 resize-none"
                    rows={4}
                    required
                  />
                </div>

                <div className="mb-5">
                  <label className="text-xs text-white/40 mb-2 block">Reward (USDC)</label>
                  <div className="flex items-center gap-2">
                    <FiDollarSign className="text-[#FF9500]" size={16} />
                    <input
                      type="number"
                      min={1}
                      value={rewardUsdc}
                      onChange={(e) => setRewardUsdc(parseInt(e.target.value) || 1)}
                      className="bg-[#2C2C2E] rounded-xl p-4 text-sm text-white w-full"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={creating}
                  className="w-full bg-gradient-to-r from-[#FF9500] to-[#FF3B30] text-black font-semibold py-3 rounded-2xl disabled:opacity50"
                >
                  {creating ? 'Creating...' : 'Create Bounty'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}