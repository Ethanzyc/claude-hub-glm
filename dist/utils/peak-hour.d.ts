/** GLM（智谱）计费高峰时段，按本地时间小时计。左闭右开 [start, end)。 */
export declare const PEAK_START_HOUR = 14;
export declare const PEAK_END_HOUR = 18;
/** 判断给定时刻是否处于高峰时段。默认取当前本地时间。 */
export declare function isPeakHour(now?: Date): boolean;
//# sourceMappingURL=peak-hour.d.ts.map