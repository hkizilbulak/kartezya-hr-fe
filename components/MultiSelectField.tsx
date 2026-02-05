import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "react-feather";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectFieldProps {
  name: string;
  value: string[];
  onChange: (values: string[]) => void;
  options: Option[];
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  name,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Seçiniz",
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ 
    top: 0, 
    left: 0, 
    width: 0, 
    maxHeight: 300, 
    openUpward: false 
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.classList.add('modal-open');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const updateDropdownPosition = () => {
    if (selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const viewport = {
        height: window.innerHeight,
        width: window.innerWidth
      };
      
      const spaceBelow = viewport.height - rect.bottom;
      const spaceAbove = rect.top;
      const estimatedHeight = Math.min(options.length * 40 + 8, 300);
      const shouldOpenUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
      const maxHeight = shouldOpenUpward 
        ? Math.min(spaceAbove - 8, 300)
        : Math.min(spaceBelow - 8, 300);
      const top = shouldOpenUpward 
        ? rect.top + window.scrollY - Math.min(estimatedHeight, maxHeight)
        : rect.bottom + window.scrollY;
      let left = rect.left + window.scrollX;
      const dropdownWidth = rect.width;
      
      if (left + dropdownWidth > viewport.width) {
        left = Math.max(8, viewport.width - dropdownWidth - 8);
      }
      if (left < 8) {
        left = 8;
      }
      
      setDropdownPosition({
        top,
        left,
        width: rect.width,
        maxHeight: Math.max(120, maxHeight),
        openUpward: shouldOpenUpward
      });
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled && !loading) {
      if (!isOpen) {
        updateDropdownPosition();
      }
      setIsOpen(!isOpen);
    }
  };

  const handleOptionToggle = (optionValue: string) => {
    const newValues = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValues);
  };

  const handleRemoveTag = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValues = value.filter(v => v !== optionValue);
    onChange(newValues);
  };

  const getDisplayText = () => {
    if (loading) return "Yükleniyor...";
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      const option = options.find(opt => opt.value === value[0]);
      return option ? option.label : value[0];
    }
    return `${value.length} seçildi`;
  };

  const renderSelectedTags = () => {
    if (value.length <= 1) return null;
    
    return (
      <div className="selected-tags mt-1">
        {value.map(val => {
          const option = options.find(opt => opt.value === val);
          return (
            <span key={val} className="badge bg-primary me-1 mb-1">
              {option ? option.label : val}
              <button
                type="button"
                className="btn-close btn-close-white ms-1"
                style={{ fontSize: '0.75em' }}
                onClick={(e) => handleRemoveTag(val, e)}
              >
                <X size={10} />
              </button>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="position-relative">
      <div
        ref={selectRef}
        className={`form-control d-flex align-items-center justify-content-between ${
          disabled || loading ? 'disabled' : ''
        } ${!disabled && !loading ? 'cursor-pointer' : ''}`}
        onClick={handleToggle}
        tabIndex={disabled || loading ? -1 : 0}
        style={{ 
          color: 'var(--bs-body-color)',
          minHeight: '38px',
          paddingRight: '2.5rem'
        }}
      >
        <span 
          className={value.length === 0 ? 'text-muted' : ''} 
          style={{ 
            flex: 1,
            paddingRight: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {getDisplayText()}
        </span>
        <ChevronDown 
          size={16} 
          className={`position-absolute transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{
            right: '8px',
            top: '50%',
            transform: `translateY(-50%) ${isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}`,
            color: 'var(--bs-body-color)'
          }}
        />
      </div>

      {renderSelectedTags()}

      {/* Dropdown Options */}
      {isOpen && !isMobile && !loading && (
        typeof window !== 'undefined' && createPortal(
          <div 
            ref={dropdownRef}
            className={`position-absolute bg-white border rounded shadow-sm ${dropdownPosition.openUpward ? 'dropdown-upward' : 'dropdown-downward'}`}
            style={{ 
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 1065,
              maxHeight: `${dropdownPosition.maxHeight}px`
            }}
          >
            <div className="overflow-auto" style={{ maxHeight: `${dropdownPosition.maxHeight}px` }}>
              <div className="list-group list-group-flush">
                {options.length === 0 ? (
                  <div className="list-group-item border-0 text-center text-muted py-3">
                    Seçenek bulunamadı
                  </div>
                ) : (
                  options.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${
                          isSelected ? 'active' : ''
                        }`}
                        onClick={() => handleOptionToggle(option.value)}
                        style={{ minHeight: '40px' }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by button onClick
                          className="me-2"
                          style={{ pointerEvents: 'none' }}
                        />
                        {option.label}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )
      )}

      {/* Mobile Bottom Sheet */}
      {isOpen && isMobile && !loading && (
        <>
          <div 
            className="modal-backdrop fade show"
            onClick={() => setIsOpen(false)}
            style={{ cursor: 'pointer' }}
          />
          <div className="position-fixed bottom-0 start-0 w-100 bg-white shadow-lg border-top rounded-top-3" 
               style={{ zIndex: 1070, maxHeight: '60vh' }}>
            <div className="overflow-auto" style={{ maxHeight: 'calc(60vh - 60px)' }}>
              <div className="list-group list-group-flush">
                {options.length === 0 ? (
                  <div className="list-group-item border-0 text-center text-muted py-3">
                    Seçenek bulunamadı
                  </div>
                ) : (
                  options.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${
                          isSelected ? 'active' : ''
                        }`}
                        onClick={() => handleOptionToggle(option.value)}
                        style={{ minHeight: '40px' }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by button onClick
                          className="me-2"
                          style={{ pointerEvents: 'none' }}
                        />
                        {option.label}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        
        .transition-transform {
          transition: transform 0.2s ease;
        }
        
        .rotate-180 {
          transform: rotate(180deg);
        }
        
        .selected-tags .badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.75rem;
        }
        
        .selected-tags .btn-close {
          background: none;
          border: none;
          padding: 0;
          margin-left: 4px;
        }
        
        .dropdown-downward {
          animation: fadeInDown 0.15s ease-out;
          transform-origin: top;
        }
        
        .dropdown-upward {
          animation: fadeInUp 0.15s ease-out;
          transform-origin: bottom;
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scaleY(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px) scaleY(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }
      `}</style>
    </div>
  );
};

export default MultiSelectField;