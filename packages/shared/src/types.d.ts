export type BountyStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'expired';
export type TaskType = 'translate' | 'summarize' | 'onchain_lookup' | 'unknown';
export interface Bounty {
    id: string;
    castHash: string;
    posterFid: number;
    taskType: TaskType;
    taskDescription: string;
    rewardUsdc: number;
    deadlineTs: number;
    status: BountyStatus;
    winnerFid?: number;
    winnerCastHash?: string;
    settlementTxHash?: string;
    createdAt: number;
}
export interface Bid {
    id: string;
    bountyId: string;
    bidderFid: number;
    bidderUsername: string;
    castHash: string;
    etaHours: number;
    approach: string;
    submittedAt: number;
}
export interface AgentProfile {
    fid: number;
    username: string;
    walletAddress: string;
    tasksCompleted: number;
    totalEarnedUsdc: number;
    capabilities: TaskType[];
}
//# sourceMappingURL=types.d.ts.map