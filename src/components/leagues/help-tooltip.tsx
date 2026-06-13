'use client';

import { useState, useRef, useEffect } from 'react';

interface HelpTooltipProps {
  text: string;
}

export function HelpTooltip({ text }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    function handleTouchStart(event: TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleTouchStart);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isOpen]);

  return (
    <div 
      className="help-tooltip-container" 
      ref={containerRef} 
      style={{ 
        display: 'inline-flex', 
        position: 'relative', 
        marginLeft: '6px',
        verticalAlign: 'middle'
      }}
    >
      <button
        type="button"
        className="help-tooltip-trigger"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px',
          color: 'rgba(148, 163, 184, 0.7)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          transition: 'color 0.2s ease, transform 0.2s ease',
          outline: 'none',
        }}
        aria-label="Ajuda"
      >
        <i className={`bi ${isOpen ? 'bi-question-circle-fill text-info' : 'bi-question-circle'}`} style={{ pointerEvents: 'none' }} />
      </button>

      {isOpen && (
        <div
          className="help-tooltip-content"
          style={{
            position: 'absolute',
            bottom: '130%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(11, 15, 23, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 1px 1px 0 rgba(255, 255, 255, 0.05) inset, 0 0 12px 0 rgba(14, 165, 233, 0.15)',
            color: '#e2e8f0',
            fontSize: '0.78rem',
            lineHeight: '1.45',
            zIndex: 9999,
            textAlign: 'left',
            fontWeight: 'normal',
            whiteSpace: 'normal',
            pointerEvents: 'auto',
          }}
        >
          {text}
          <div
            className="help-tooltip-arrow"
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '6px',
              borderStyle: 'solid',
              borderColor: 'rgba(11, 15, 23, 0.92) transparent transparent transparent',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}
