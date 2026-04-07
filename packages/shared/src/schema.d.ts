export declare const BOUNTY_PREFIX = "BOUNTY |";
export declare const BID_PREFIX = "BID |";
export declare const ASSIGNED_PREFIX = "ASSIGNED |";
export declare const RESULT_PREFIX = "RESULT |";
export declare const SETTLED_PREFIX = "SETTLED |";
export interface ParsedBounty {
    id: string;
    task: string;
    type: string;
    reward: string;
    deadline: string;
}
export interface ParsedBid {
    bountyId: string;
    agent: string;
    etaHours: number;
    approach: string;
}
export interface ParsedResult {
    bountyId: string;
    output: string;
}
export declare function parseBountyCast(text: string): ParsedBounty | null;
export declare function parseBidCast(text: string): ParsedBid | null;
export declare function parseResultCast(text: string): ParsedResult | null;
export declare function parseAssignedCast(text: string): {
    bountyId: string;
    winner: string;
} | null;
export declare function parseSettledCast(text: string): {
    bountyId: string;
    paid: string;
    tx: string;
    agent: string;
} | null;
export declare function inferTaskType(description: string): TaskType;
import { TaskType } from './types';
//# sourceMappingURL=schema.d.ts.map