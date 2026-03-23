import { LabelEntry } from '../types';

// Format time as MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate timeline position as percentage
export function getTimelinePosition(time: number, duration: number): string {
  if (!duration) return '0%';
  return `${(time / duration) * 100}%`;
}

// Get time from mouse position on timeline
export function getTimeFromPosition(
  clientX: number,
  timelineRect: DOMRect,
  duration: number,
  snapToInteger: boolean = true
): number {
  const x = clientX - timelineRect.left;
  const ratio = x / timelineRect.width;
  const time = ratio * duration;

  if (snapToInteger) {
    return Math.max(0, Math.min(Math.round(time), Math.floor(duration)));
  }
  return Math.max(0, Math.min(time, duration));
}

// Check if two time ranges overlap
export function rangesOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && end1 > start2;
}

// Calculate row for each label to prevent overlaps
// Returns a map of label id to row number
export function calculateLabelRows(labels: LabelEntry[]): Map<string, number> {
  const rowMap = new Map<string, number>();

  // Sort labels by start time, then by end time
  const sortedLabels = [...labels].sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime - b.startTime;
    return a.endTime - b.endTime;
  });

  // Track which rows are occupied at each point
  // Each row tracks the end time of its last label
  const rowEndTimes: number[] = [];

  for (const label of sortedLabels) {
    // Find the first row where this label can fit (no overlap)
    let assignedRow = -1;

    for (let row = 0; row < rowEndTimes.length; row++) {
      if (rowEndTimes[row] <= label.startTime) {
        // This row is free (previous label ended before this one starts)
        assignedRow = row;
        break;
      }
    }

    if (assignedRow === -1) {
      // No free row found, create a new one
      assignedRow = rowEndTimes.length;
      rowEndTimes.push(0);
    }

    // Assign this row to the label
    rowMap.set(label.id, assignedRow);
    // Update the row's end time
    rowEndTimes[assignedRow] = label.endTime;
  }

  return rowMap;
}

// Get the total number of rows needed for the timeline
export function getTotalRows(rowMap: Map<string, number>): number {
  if (rowMap.size === 0) return 0;
  return Math.max(...Array.from(rowMap.values())) + 1;
}

// Generate timeline ticks at 1-second intervals
export function generateTimelineTicks(duration: number): { time: number; isMajor: boolean }[] {
  const ticks: { time: number; isMajor: boolean }[] = [];
  for (let i = 0; i <= Math.floor(duration); i++) {
    ticks.push({
      time: i,
      isMajor: i % 5 === 0,
    });
  }
  return ticks;
}

// Snap a label position to avoid overlaps with existing labels
export function snapLabelToAvoidOverlap(
  label: LabelEntry,
  otherLabels: LabelEntry[]
): { startTime: number; endTime: number } {
  const { startTime, endTime } = label;

  // Get labels that overlap with the current position
  const overlapping = otherLabels.filter(
    (other) =>
      other.id !== label.id && rangesOverlap(startTime, endTime, other.startTime, other.endTime)
  );

  // If no overlap, return original position
  if (overlapping.length === 0) {
    return { startTime, endTime };
  }

  // The label rows system handles visual overlap, but we don't need to snap
  // positions because multiple labels can exist on different rows
  return { startTime, endTime };
}

// Clamp time to valid range
export function clampTime(time: number, min: number, max: number): number {
  return Math.max(min, Math.min(time, max));
}
