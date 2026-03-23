'use client';

import { useEffect, useRef, useState } from 'react';

export interface ContextMenuSubItem {
  label: string;
  value: number | string;
  disabled?: boolean;
  color?: string;  // Background color for badge-style rendering
}

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  submenu?: ContextMenuSubItem[];
  onSubmenuSelect?: (value: number | string) => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Small delay to prevent immediate close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] py-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={index} className="my-1 border-t border-slate-700" />;
        }

        const hasSubmenu = item.submenu && item.submenu.length > 0;

        return (
          <div
            key={index}
            className="relative"
            onMouseEnter={() => hasSubmenu && setHoveredSubmenu(index)}
            onMouseLeave={(e) => {
              // Don't close if moving to the submenu
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (relatedTarget?.closest('[data-submenu]')) return;
              setHoveredSubmenu(null);
            }}
          >
            <button
              onClick={() => {
                if (!item.disabled && !hasSubmenu) {
                  item.onClick();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                item.disabled
                  ? 'text-slate-600 cursor-not-allowed'
                  : item.danger
                  ? 'text-red-400 hover:bg-red-500/20'
                  : 'text-slate-200 hover:bg-slate-700'
              }`}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {hasSubmenu && (
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>

            {/* Submenu */}
            {hasSubmenu && hoveredSubmenu === index && (
              <div
                data-submenu
                className="absolute left-full top-0 -ml-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
                onMouseEnter={() => setHoveredSubmenu(index)}
                onMouseLeave={() => setHoveredSubmenu(null)}
              >
                {/* Invisible bridge to prevent gap issues */}
                <div className="absolute -left-2 top-0 w-2 h-full" />
                {/* Check if all items have colors (horizontal badge layout) */}
                {item.submenu!.every(s => s.color) ? (
                  <div className="flex items-center gap-1 p-2">
                    {item.submenu!.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => {
                          if (!subItem.disabled && item.onSubmenuSelect) {
                            item.onSubmenuSelect(subItem.value);
                            onClose();
                          }
                        }}
                        disabled={subItem.disabled}
                        className={`px-2 py-1 rounded text-xs font-bold text-white shadow-sm transition-all ${
                          subItem.disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:ring-2 hover:ring-white/50'
                        }`}
                        style={{ backgroundColor: subItem.color }}
                        title={subItem.label}
                      >
                        {String(subItem.value)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="min-w-[120px] py-1">
                    {item.submenu!.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => {
                          if (!subItem.disabled && item.onSubmenuSelect) {
                            item.onSubmenuSelect(subItem.value);
                            onClose();
                          }
                        }}
                        disabled={subItem.disabled}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          subItem.disabled
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Icons for context menu
export const ContextMenuIcons = {
  delete: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  duplicate: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  switchVideo: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  play: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  edit: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  distractor: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  changeType: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  focus: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  addLabel: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  loop: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};
