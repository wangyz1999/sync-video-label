'use client';

import { useState, useRef, useEffect } from 'react';
import { EditableTextProps } from './types';

/**
 * Inline editable text component
 */
export function EditableText({
  value,
  onChange,
  placeholder = 'Click to edit...',
  className = '',
  multiline = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const baseClass = "w-full px-2 py-1 text-sm bg-slate-700 border border-violet-500 rounded text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500";
    
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${baseClass} min-h-[60px] resize-y ${className}`}
          placeholder={placeholder}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${baseClass} ${className}`}
        placeholder={placeholder}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={`cursor-text hover:bg-slate-700/50 rounded px-1 -mx-1 transition-colors ${className}`}
      title="Double-click to edit"
    >
      {value || <span className="text-slate-500 italic">{placeholder}</span>}
    </span>
  );
}

