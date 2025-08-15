import React, { useState, useEffect, useRef } from 'react';

interface EditableLabelProps {
  initialValue: string;
  position: { x: number; y: number; width: number; height: number };
  onSave: (value: string) => void;
  onCancel: () => void;
  className?: string;
  rotation?: number; // rotation in degrees
  type?: string; // type of element (title, xAxisLabel, yAxisLabel)
}

export const EditableLabel: React.FC<EditableLabelProps> = ({
  initialValue,
  position,
  onSave,
  onCancel,
  className = '',
  rotation = 0,
  type = ''
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Don't auto-focus on mount to avoid stealing focus
  // Users will click to focus when they want to edit
  /*
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);
  */

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    onSave(value);
  };

  // Determine font size based on element type
  const getFontSize = () => {
    switch (type) {
      case 'title':
        return '16px'; // Match title font size
      case 'xAxisLabel':
      case 'yAxisLabel':
        return '12px'; // Match axis label font size
      default:
        return '12px';
    }
  };

  // Adjust position for rotated elements and element type
  let adjustedLeft = position.x;
  let adjustedTop = position.y;
  let adjustedWidth = Math.max(position.width, 100);
  let adjustedHeight = position.height;
  
  if (rotation === -90) {
    // For -90 degree rotation, the element rotates around its center
    // After rotation, width and height are swapped visually
    // Move left to compensate for the rotation
    adjustedLeft = position.x - position.height;
    adjustedTop = position.y;
    // For y-axis labels, use a more reasonable height
    if (type === 'yAxisLabel') {
      adjustedHeight = Math.min(position.height, 24);
      // Ensure the label stays within the container bounds
      // If it would go negative, position it at the edge
      if (adjustedLeft < 0) {
        adjustedLeft = 10; // Add small padding from edge
      }
    }
  }
  
  // For x-axis labels, adjust to prevent bottom overflow
  if (type === 'xAxisLabel') {
    adjustedHeight = Math.min(position.height, 24);
  }

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    left: adjustedLeft,
    top: adjustedTop,
    width: adjustedWidth,
    height: adjustedHeight,
    zIndex: 10,
    backgroundColor: 'var(--mk-ui-background-contrast)',
    border: '1px solid var(--mk-ui-border)',
    borderRadius: '4px',
    padding: '2px 4px',
    fontSize: getFontSize(),
    fontFamily: 'inherit',
    fontWeight: type === 'title' ? 'bold' : 'normal',
    color: 'var(--mk-ui-text-primary)',
    outline: 'none',
    cursor: 'text',
    boxSizing: 'border-box',
    transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
    transformOrigin: 'center center'
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={`visualization-editable-label ${className}`}
      style={overlayStyle}
      onFocus={(e) => {
        e.currentTarget.select();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    />
  );
};