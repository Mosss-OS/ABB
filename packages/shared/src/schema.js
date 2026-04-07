"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTLED_PREFIX = exports.RESULT_PREFIX = exports.ASSIGNED_PREFIX = exports.BID_PREFIX = exports.BOUNTY_PREFIX = void 0;
exports.parseBountyCast = parseBountyCast;
exports.parseBidCast = parseBidCast;
exports.parseResultCast = parseResultCast;
exports.parseAssignedCast = parseAssignedCast;
exports.parseSettledCast = parseSettledCast;
exports.inferTaskType = inferTaskType;
exports.BOUNTY_PREFIX = 'BOUNTY |';
exports.BID_PREFIX = 'BID |';
exports.ASSIGNED_PREFIX = 'ASSIGNED |';
exports.RESULT_PREFIX = 'RESULT |';
exports.SETTLED_PREFIX = 'SETTLED |';
function parseBountyCast(text) {
    if (!text.startsWith(exports.BOUNTY_PREFIX))
        return null;
    const result = {};
    const parts = text.slice(exports.BOUNTY_PREFIX.length).split('|');
    for (const part of parts) {
        const [key, ...valueParts] = part.split(':');
        if (key && valueParts.length > 0) {
            result[key.trim()] = valueParts.join(':').trim();
        }
    }
    if (!result['id'] || !result['task'] || !result['type'])
        return null;
    return {
        id: result['id'],
        task: result['task'],
        type: result['type'],
        reward: result['reward'] || '0',
        deadline: result['deadline'] || '24h',
    };
}
function parseBidCast(text) {
    if (!text.startsWith(exports.BID_PREFIX))
        return null;
    const result = {};
    const parts = text.slice(exports.BID_PREFIX.length).split('|');
    for (const part of parts) {
        const [key, ...valueParts] = part.split(':');
        if (key && valueParts.length > 0) {
            result[key.trim()] = valueParts.join(':').trim();
        }
    }
    if (!result['bounty'] || !result['agent'])
        return null;
    const etaMatch = result['eta']?.match(/(\d+)/);
    const etaHours = etaMatch ? parseInt(etaMatch[1], 10) : 2;
    return {
        bountyId: result['bounty'],
        agent: result['agent'].replace('@', ''),
        etaHours,
        approach: result['approach'] || 'standard approach',
    };
}
function parseResultCast(text) {
    if (!text.startsWith(exports.RESULT_PREFIX))
        return null;
    const result = {};
    const parts = text.slice(exports.RESULT_PREFIX.length).split('|');
    for (const part of parts) {
        const [key, ...valueParts] = part.split(':');
        if (key && valueParts.length > 0) {
            result[key.trim()] = valueParts.join(':').trim();
        }
    }
    if (!result['bounty'])
        return null;
    return {
        bountyId: result['bounty'],
        output: result['output'] || result[''] || '',
    };
}
function parseAssignedCast(text) {
    if (!text.startsWith(exports.ASSIGNED_PREFIX))
        return null;
    const result = {};
    const parts = text.slice(exports.ASSIGNED_PREFIX.length).split('|');
    for (const part of parts) {
        const [key, ...valueParts] = part.split(':');
        if (key && valueParts.length > 0) {
            result[key.trim()] = valueParts.join(':').trim();
        }
    }
    if (!result['bounty'] || !result['winner'])
        return null;
    return {
        bountyId: result['bounty'],
        winner: result['winner'].replace('@', ''),
    };
}
function parseSettledCast(text) {
    if (!text.startsWith(exports.SETTLED_PREFIX))
        return null;
    const result = {};
    const parts = text.slice(exports.SETTLED_PREFIX.length).split('|');
    for (const part of parts) {
        const [key, ...valueParts] = part.split(':');
        if (key && valueParts.length > 0) {
            result[key.trim()] = valueParts.join(':').trim();
        }
    }
    if (!result['bounty'] || !result['paid'])
        return null;
    return {
        bountyId: result['bounty'],
        paid: result['paid'],
        tx: result['tx'] || '',
        agent: result['agent'] || '',
    };
}
function inferTaskType(description) {
    const lower = description.toLowerCase();
    if (lower.includes('translate'))
        return 'translate';
    if (lower.includes('summarize') || lower.includes('tldr') || lower.includes('summary'))
        return 'summarize';
    if (lower.includes('wallet') || lower.includes('holdings') || lower.includes('onchain'))
        return 'onchain_lookup';
    return 'unknown';
}
