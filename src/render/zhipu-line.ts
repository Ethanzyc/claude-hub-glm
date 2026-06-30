import type { RenderContext } from '../types.js';
import { label, getQuotaColor, quotaBar, warning, RESET } from './colors.js';
import { getAdaptiveBarWidth } from '../utils/terminal.js';
import { isPeakHour, PEAK_START_HOUR, PEAK_END_HOUR } from '../utils/peak-hour.js';
import { t } from '../i18n/index.js';
import { formatResetTime } from './format-reset-time.js';

export function renderZhipuLine(ctx: RenderContext): string | null {
  if (!ctx.config.display.showZhipu) return null;
  if (!ctx.zhipuUsage) return null;

  const colors = ctx.config.colors;
  const barWidth = getAdaptiveBarWidth();
  const timeFormat = ctx.config.display.timeFormat ?? 'relative';
  const now = ctx.now ?? new Date();

  const parts: string[] = [];

  const zhipuLabel = label(`${t('label.zhipu')}:`, colors);

  // 5-hour usage
  const fiveHour = ctx.zhipuUsage.fiveHour;
  const fiveHourBar = quotaBar(fiveHour.percent, barWidth, colors);
  const fiveHourColor = getQuotaColor(fiveHour.percent, colors);
  const fiveHourPercent = `${fiveHourColor}${fiveHour.percent}%${RESET}`;
  const fiveHourReset = fiveHour.resetsAt
    ? ` ${label(`(${formatResetTime(new Date(fiveHour.resetsAt), timeFormat)})`, colors)}`
    : '';
  parts.push(`5h ${fiveHourBar} ${fiveHourPercent}${fiveHourReset}`);

  // Weekly usage
  const weekly = ctx.zhipuUsage.weekly;
  const weeklyBar = quotaBar(weekly.percent, barWidth, colors);
  const weeklyColor = getQuotaColor(weekly.percent, colors);
  const weeklyPercent = `${weeklyColor}${weekly.percent}%${RESET}`;
  const weeklyReset = weekly.resetsAt
    ? ` ${label(`(${formatResetTime(new Date(weekly.resetsAt), timeFormat)})`, colors)}`
    : '';
  parts.push(`${t('label.weeklyZhipu')} ${weeklyBar} ${weeklyPercent}${weeklyReset}`);

  // MCP usage
  const mcp = ctx.zhipuUsage.mcp;
  if (mcp.total > 0) {
    const mcpBar = quotaBar(mcp.percent, barWidth, colors);
    const mcpColor = getQuotaColor(mcp.percent, colors);
    const mcpDisplay = `${mcpColor}${mcp.used}/${mcp.total}${RESET}`;
    const mcpReset = mcp.resetsAt
      ? ` ${label(`(${formatResetTime(new Date(mcp.resetsAt), timeFormat)})`, colors)}`
      : '';
    parts.push(`${t('label.mcp')} ${mcpBar} ${mcpDisplay}${mcpReset}`);
  }

  // Subscription
  const sub = ctx.zhipuUsage.subscription;
  if (sub) {
    const renewTime = sub.nextRenewTime
      ? ` ${label(`(${t('format.renews')} ${formatResetTime(new Date(sub.nextRenewTime), timeFormat)})`, colors)}`
      : '';
    parts.push(`${label(sub.plan, colors)}${renewTime}`);
  }

  // GLM peak-hour badge (only during 14:00–18:00 local)
  if (ctx.config.display.showZhipuPeakHour !== false && isPeakHour(now)) {
    const peakText = `⚡${t('label.peakHour')} ${PEAK_START_HOUR}–${PEAK_END_HOUR}`;
    parts.push(warning(peakText, colors));
  }

  // Data freshness
  const ageMs = now.getTime() - ctx.zhipuUsage.updatedAt;
  const ageStr = formatAge(ageMs);
  const freshLabel = label(`[${ageStr}]`, colors);

  return `${zhipuLabel} ${parts.join(' │ ')} ${freshLabel}`;
}

function formatAge(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${Math.round(ms / 3_600_000)}h`;
}
