import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { getHudPluginDir } from './claude-config-dir.js';
const API_BASE = 'https://api.z.ai';
function getCachePath(config) {
    if (config.display.zhipuCachePath) {
        return config.display.zhipuCachePath;
    }
    return path.join(getHudPluginDir(os.homedir()), 'zhipu-usage-cache.json');
}
function readCache(cachePath) {
    try {
        const raw = fs.readFileSync(cachePath, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function writeCache(cachePath, data) {
    try {
        const dir = path.dirname(cachePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf8');
    }
    catch {
        // Silently ignore write failures — cache is optional
    }
}
function parseNextResetTime(value) {
    if (!Number.isFinite(value) || value <= 0)
        return null;
    return value > 1e12 ? value : value * 1000;
}
function extractQuotaData(limits) {
    let fiveHour = { percent: 0, resetsAt: null };
    let weekly = { percent: 0, resetsAt: null };
    let mcp = { used: 0, total: 0, percent: 0, resetsAt: null };
    for (const item of limits) {
        if (item.type === 'TOKENS_LIMIT' && item.unit === 3) {
            fiveHour = {
                percent: Math.round(Math.min(100, Math.max(0, item.percentage))),
                resetsAt: parseNextResetTime(item.nextResetTime),
            };
        }
        else if (item.type === 'TOKENS_LIMIT' && item.unit === 6) {
            weekly = {
                percent: Math.round(Math.min(100, Math.max(0, item.percentage))),
                resetsAt: parseNextResetTime(item.nextResetTime),
            };
        }
        else if (item.type === 'TIME_LIMIT') {
            const used = item.currentValue ?? 0;
            const total = item.usage ?? 0;
            mcp = {
                used,
                total,
                percent: Math.round(Math.min(100, Math.max(0, item.percentage))),
                resetsAt: parseNextResetTime(item.nextResetTime),
            };
        }
    }
    return { fiveHour, weekly, mcp };
}
function extractSubscription(items) {
    if (!items?.length)
        return null;
    const active = items.find(s => s.status === 'VALID');
    if (!active)
        return null;
    return {
        plan: active.productName,
        status: active.status,
        nextRenewTime: active.nextRenewTime || null,
    };
}
async function fetchFromApi(apiKey) {
    const headers = { 'Authorization': `Bearer ${apiKey}` };
    const [quotaResp, subResp] = await Promise.all([
        fetch(`${API_BASE}/api/monitor/usage/quota/limit`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/biz/subscription/list?pageSize=9999&pageNum=1`, { headers }).then(r => r.json()),
    ]);
    if (quotaResp.code !== 200 || !quotaResp.data?.limits?.length) {
        return null;
    }
    const { fiveHour, weekly, mcp } = extractQuotaData(quotaResp.data.limits);
    const subscription = extractSubscription(subResp.data);
    return {
        updatedAt: Date.now(),
        fiveHour,
        weekly,
        mcp,
        subscription,
    };
}
function getApiKey() {
    const glmKey = process.env.GLM_API_KEY?.trim();
    if (glmKey)
        return glmKey;
    // Fallback: when using Zhipu's Anthropic-compatible endpoint, reuse the auth token
    const baseUrl = process.env.ANTHROPIC_BASE_URL?.trim();
    if (baseUrl === 'https://open.bigmodel.cn/api/anthropic') {
        return process.env.ANTHROPIC_AUTH_TOKEN?.trim() || null;
    }
    return null;
}
export function getZhipuUsage(config, now = Date.now()) {
    const apiKey = getApiKey();
    if (!apiKey)
        return null;
    const cachePath = getCachePath(config);
    const cached = readCache(cachePath);
    const freshnessMs = config.display.zhipuFreshnessMs;
    // Return stale cache while fresh enough
    if (cached && (now - cached.updatedAt) <= freshnessMs) {
        return cached;
    }
    // Kick off background refresh (non-blocking — fire and forget)
    const promise = fetchFromApi(apiKey)
        .then(data => {
        if (data)
            writeCache(cachePath, data);
    })
        .catch(() => {
        // Silently ignore API errors
    });
    // Prevent unhandled rejection
    promise.catch(() => { });
    // Return stale cache if available, otherwise null
    return cached;
}
//# sourceMappingURL=zhipu-usage.js.map