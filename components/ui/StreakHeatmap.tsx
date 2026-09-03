// ============================================================
// STREAKER — Streak Heatmap (GitHub contribution graph style)
// ============================================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { HeatmapDay, HeatmapStatus } from '../../types';
import { buildHeatmapGrid, formatDateWithWeekday, getToday } from '../../utils/helpers';

// Cell colour per number of streaks checked into that day: index 0 = none,
// index 3 = three or more. Order matches the Less → More legend below.
const TIERS = ['bg-[#252542]', 'bg-green-700/40', 'bg-green-600/60', 'bg-green-500'] as const;

const CELL = 12; // square side
const GAP = 3; // between squares, both axes
const COLUMN = CELL + GAP; // horizontal pitch of one week
const GUTTER = 26; // width of the weekday label column
const MONTH_ROW = 14; // height of the month label row
// Room for the rightmost month label, which is wider than its column.
const LABEL_OVERHANG = 24;

// Sunday-first rows, labelled like GitHub: every other day, so the names fit.
const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''] as const;

interface StreakHeatmapProps {
  /** One entry per day, oldest first and contiguous — buildHeatmapDays output. */
  days: HeatmapDay[];
  /** Where the fetch behind `days` got to. */
  status?: HeatmapStatus;
}

function tierFor(count: number): string {
  return TIERS[Math.min(count, TIERS.length - 1)];
}

function countLabel(count: number): string {
  if (count === 0) return 'no check-ins';
  return count === 1 ? '1 check-in' : `${count} check-ins`;
}

export function StreakHeatmap({ days, status = 'ready' }: StreakHeatmapProps) {
  const scrollRef = React.useRef<ScrollView>(null);
  // The date, not the day object: a refetch can change that day's count, and
  // the caption should show the new one.
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const today = getToday();
  const { weeks, months, total, cellLabels } = React.useMemo(() => {
    // Screen-reader labels are built here rather than per cell per render:
    // that is 365 Intl formats, worth doing once per data change.
    const cellLabels = new Map<string, string>();
    for (const day of days) {
      cellLabels.set(day.date, `${formatDateWithWeekday(day.date)}, ${countLabel(day.count)}`);
    }
    return { ...buildHeatmapGrid(days), cellLabels };
  }, [days]);

  const selectedDay = days.find((day) => day.date === selectedDate) ?? null;

  if (status === 'error' && total === 0) {
    return (
      <Text className="text-gray-400 text-sm py-2">
        Couldn&apos;t load your check-in history. Pull down to refresh.
      </Text>
    );
  }

  if (weeks.length === 0) {
    return <Text className="text-gray-400 text-sm py-2">No check-ins yet.</Text>;
  }

  // The window is a fixed 365 days, so the grid is full of squares before the
  // fetch has landed. Say it is loading rather than drawing an empty year,
  // which reads as "you never checked in".
  if (total === 0 && (status === 'loading' || status === 'idle')) {
    return (
      <View className="flex-row items-center py-2">
        <ActivityIndicator size="small" color="#6B6B80" />
        <Text className="text-gray-400 text-sm ml-2">Loading your year…</Text>
      </View>
    );
  }

  const gridWidth = weeks.length * COLUMN;

  return (
    <View>
      <Text className="text-white text-sm font-medium mb-3">
        {total === 0 ? 'No check-ins' : countLabel(total)} in the last year
      </Text>

      <View className="flex-row">
        {/* Weekday gutter — outside the scroll view so it stays put */}
        <View style={{ width: GUTTER, paddingTop: MONTH_ROW }}>
          {WEEKDAY_LABELS.map((label, row) => (
            <View key={row} style={{ height: CELL, marginBottom: GAP }} className="justify-center">
              <Text className="text-gray-500 text-[9px]">{label}</Text>
            </View>
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          // Open on the most recent weeks, the way GitHub's graph ends on today.
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <View>
            {/* Month labels, each pinned above the column its month starts in */}
            <View style={{ height: MONTH_ROW, width: gridWidth + LABEL_OVERHANG }}>
              {months.map((month) => (
                <Text
                  key={`${month.label}-${month.weekIndex}`}
                  className="text-gray-500 text-[9px]"
                  style={{ position: 'absolute', left: month.weekIndex * COLUMN, top: 0 }}
                >
                  {month.label}
                </Text>
              ))}
            </View>

            <View className="flex-row">
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={{ marginRight: GAP }}>
                  {week.map((day, row) =>
                    // Outside the window: blank, not a zero-count day. An empty
                    // square reads as a day missed, and these are days with no
                    // data rather than days without a check-in.
                    day === null ? (
                      <View key={row} style={{ width: CELL, height: CELL, marginBottom: GAP }} />
                    ) : (
                      <TouchableOpacity
                        key={row}
                        onPress={() => setSelectedDate(day.date)}
                        hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
                        accessibilityRole="button"
                        accessibilityLabel={cellLabels.get(day.date)}
                        style={{
                          width: CELL,
                          height: CELL,
                          marginBottom: GAP,
                          borderWidth: selectedDay?.date === day.date || day.date === today ? 1 : 0,
                          borderColor:
                            selectedDay?.date === day.date
                              ? '#FAFAFA'
                              : 'rgba(250, 250, 250, 0.35)',
                        }}
                        className={`rounded-sm ${tierFor(day.count)}`}
                      />
                    )
                  )}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Caption — a phone has no hover, so the tapped square reports here */}
      <Text className="text-gray-400 text-xs mt-3" numberOfLines={1}>
        {selectedDay
          ? `${formatDateWithWeekday(selectedDay.date)} · ${countLabel(selectedDay.count)}`
          : 'Tap a square to see that day'}
      </Text>

      <View className="flex-row items-center justify-end mt-2 gap-1">
        <Text className="text-gray-500 text-xs mr-1">Less</Text>
        {TIERS.map((tier) => (
          <View key={tier} style={{ width: CELL, height: CELL }} className={`rounded-sm ${tier}`} />
        ))}
        <Text className="text-gray-500 text-xs ml-1">More</Text>
      </View>
    </View>
  );
}
