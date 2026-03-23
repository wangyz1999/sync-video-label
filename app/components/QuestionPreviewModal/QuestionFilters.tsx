'use client';

import { useMemo } from 'react';
import { QuestionFiltersProps, QuestionLevel } from './types';

// Question code categories for grouping
const CODE_CATEGORIES = [
  { name: 'IDENT', label: 'Identification', color: 'text-emerald-400' },
  { name: 'EXIST', label: 'Existence (T/F)', color: 'text-blue-400' },
  { name: 'ABSENT', label: 'Absence', color: 'text-orange-400' },
  { name: 'COUNT', label: 'Counting', color: 'text-purple-400' },
  { name: 'TIME', label: 'Timing (When)', color: 'text-cyan-400' },
  { name: 'INTENT', label: 'Intent (Why action)', color: 'text-yellow-400' },
  { name: 'CAUSAL', label: 'Causal (Why effect)', color: 'text-teal-400' },
  { name: 'TR', label: 'Timeline Reference', color: 'text-pink-400' },
  { name: 'POV-ID', label: 'POV Identity', color: 'text-rose-400' },
  { name: 'ORDER', label: 'Temporal Order', color: 'text-amber-400' },
] as const;

// Get the category for a code
function getCodeCategory(code: string): string {
  if (code === 'CAUSAL') return 'CAUSAL';
  if (code.includes('-INTENT')) return 'INTENT';
  if (code.includes('-COUNT')) return 'COUNT';
  if (code.includes('-TIME')) return 'TIME';
  if (code.includes('-ABSENT')) return 'ABSENT';
  if (code.includes('-EXIST')) return 'EXIST';
  if (code.includes('-IDENT')) return 'IDENT';
  // POV-ID codes (Level 3)
  if (code.includes('-POV-ID')) return 'POV-ID';
  // ORDER codes (Level 3)
  if (code.includes('-ORDER')) return 'ORDER';
  // Timeline Reference (TR2*) codes
  if (code.startsWith('TR2')) return 'TR';
  // Level 2 and 3 codes
  if (code.includes('2') && code.includes('-')) {
    const suffix = code.split('-').pop();
    if (suffix === 'IDENT') return 'IDENT';
    if (suffix === 'EXIST') return 'EXIST';
    if (suffix === 'ABSENT') return 'ABSENT';
    if (suffix === 'COUNT') return 'COUNT';
  }
  return 'OTHER';
}

/**
 * Filter controls for questions list with validation filter
 * Groups question codes by category for better organization
 */
export function QuestionFilters({
  filterLevel,
  filterCode,
  filterValidation,
  searchQuery,
  uniqueCodes,
  stats,
  filteredCount,
  totalCount,
  validCount,
  invalidCount,
  unreviewedCount,
  onFilterLevelChange,
  onFilterCodeChange,
  onFilterValidationChange,
  onSearchChange,
}: QuestionFiltersProps) {
  // Group codes by category
  const groupedCodes = useMemo(() => {
    const groups: Record<string, { codes: string[]; count: number }> = {};

    for (const code of uniqueCodes) {
      const category = getCodeCategory(code);
      if (!groups[category]) {
        groups[category] = { codes: [], count: 0 };
      }
      groups[category].codes.push(code);
      groups[category].count += stats.byCode[code] || 0;
    }

    return groups;
  }, [uniqueCodes, stats.byCode]);

  return (
    <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/20 shrink-0">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Level filter */}
        <select
          value={filterLevel}
          onChange={(e) =>
            onFilterLevelChange(
              e.target.value === 'all' ? 'all' : (Number(e.target.value) as QuestionLevel)
            )
          }
          className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500"
        >
          <option value="all">All Levels</option>
          <option value={1}>L1 - Perception</option>
          <option value={2}>L2 - Temporal</option>
          <option value={3}>L3 - Cross-Video</option>
        </select>

        {/* Code filter - grouped by category */}
        <select
          value={filterCode}
          onChange={(e) => onFilterCodeChange(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 max-w-[220px]"
        >
          <option value="all">All Types ({uniqueCodes.length} codes)</option>
          {CODE_CATEGORIES.map((category) => {
            const group = groupedCodes[category.name];
            if (!group || group.codes.length === 0) return null;

            return (
              <optgroup key={category.name} label={`── ${category.label} (${group.count}) ──`}>
                {/* Category-level filter option */}
                <option value={`category:${category.name}`}>
                  All {category.label} ({group.count})
                </option>
                {/* Individual codes */}
                {group.codes.map((code) => (
                  <option key={code} value={code}>
                    {code} ({stats.byCode[code] || 0})
                  </option>
                ))}
              </optgroup>
            );
          })}
          {/* Other codes that don't fit categories */}
          {groupedCodes['OTHER'] && groupedCodes['OTHER'].codes.length > 0 && (
            <optgroup label="── Other ──">
              {groupedCodes['OTHER'].codes.map((code) => (
                <option key={code} value={code}>
                  {code} ({stats.byCode[code] || 0})
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {/* Validation filter */}
        <select
          value={filterValidation}
          onChange={(e) =>
            onFilterValidationChange(e.target.value as 'all' | 'valid' | 'invalid' | 'unreviewed')
          }
          className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500"
        >
          <option value="all">All Status ({totalCount})</option>
          <option value="valid">✓ Valid ({validCount})</option>
          <option value="invalid">✗ Invalid ({invalidCount})</option>
          <option value="unreviewed">? Unreviewed ({unreviewedCount})</option>
        </select>

        <div className="text-sm text-slate-400">
          <span className="text-slate-200 font-medium">{filteredCount}</span> / {totalCount}
        </div>
      </div>
    </div>
  );
}
