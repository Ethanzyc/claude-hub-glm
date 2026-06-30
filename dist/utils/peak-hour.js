/** GLM（智谱）计费高峰时段，按本地时间小时计。左闭右开 [start, end)。 */
export const PEAK_START_HOUR = 14;
export const PEAK_END_HOUR = 18;
/** 判断给定时刻是否处于高峰时段。默认取当前本地时间。 */
export function isPeakHour(now = new Date()) {
    const hour = now.getHours();
    return hour >= PEAK_START_HOUR && hour < PEAK_END_HOUR;
}
//# sourceMappingURL=peak-hour.js.map