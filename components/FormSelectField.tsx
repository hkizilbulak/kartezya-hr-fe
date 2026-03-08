import React, { useState, useEffect, useRef } from "react";
import { Form, Col } from "react-bootstrap";
import { createPortal } from "react-dom";

type IProps = {
    as?: typeof Col;
    md?: number;
    controlId?: string;
    label?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
    disabled?: boolean;
    isInvalid?: boolean;
    errorMessage?: string;
};

const FormSelectField = ({
    as,
    md,
    controlId,
    label,
    name,
    value,
    onChange,
    children,
    disabled = false,
    isInvalid = false,
    errorMessage
}: IProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [dropdownPosition, setDropdownPosition] = useState({ 
        top: 0, 
        left: 0, 
        width: 0, 
        maxHeight: 300, 
        openUpward: false 
    });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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
            // Focus search input when dropdown opens
            setTimeout(() => {
                if (searchInputRef.current && !isMobile) {
                    searchInputRef.current.focus();
                }
            }, 100);
        } else {
            // Clear search when dropdown closes
            setSearchQuery("");
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.classList.remove('modal-open');
        };
    }, [isOpen, isMobile]);

    useEffect(() => {
        const handleScroll = () => {
            if (isOpen && !isMobile) {
                updateDropdownPosition();
            }
        };

        const handleResize = () => {
            if (isOpen && !isMobile) {
                updateDropdownPosition();
            }
        };

        if (isOpen) {
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleResize);
        }

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen, isMobile]);

    const updateDropdownPosition = () => {
        if (selectRef.current) {
            const rect = selectRef.current.getBoundingClientRect();
            const viewport = {
                height: window.innerHeight,
                width: window.innerWidth
            };
            
            // Calculate available space below and above
            const spaceBelow = viewport.height - rect.bottom;
            const spaceAbove = rect.top;
            
            // Count options to estimate dropdown height
            const optionCount = React.Children.count(children) - 1; // Subtract placeholder option
            const estimatedHeight = Math.min(optionCount * 40 + 8, 300); // 40px per option + padding, max 300px
            
            // Determine if dropdown should open upward
            const shouldOpenUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
            
            // Calculate final position and constraints
            const maxHeight = shouldOpenUpward 
                ? Math.min(spaceAbove - 8, 300) // Leave some margin from top
                : Math.min(spaceBelow - 8, 300); // Leave some margin from bottom
                
            const top = shouldOpenUpward 
                ? rect.top + window.scrollY - Math.min(estimatedHeight, maxHeight)
                : rect.bottom + window.scrollY;
                
            // Ensure dropdown doesn't overflow horizontally
            let left = rect.left + window.scrollX;
            const dropdownWidth = rect.width;
            
            // Check if dropdown would overflow right edge
            if (left + dropdownWidth > viewport.width) {
                left = Math.max(8, viewport.width - dropdownWidth - 8);
            }
            
            // Ensure dropdown doesn't overflow left edge
            if (left < 8) {
                left = 8;
            }
            
            setDropdownPosition({
                top,
                left,
                width: rect.width,
                maxHeight: Math.max(120, maxHeight), // Minimum height of 120px
                openUpward: shouldOpenUpward
            });
        }
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!disabled) {
            if (!isOpen) {
                updateDropdownPosition();
            }
            setIsOpen(!isOpen);
        }
    };

    const handleOptionClick = (optionValue: string) => {
        const syntheticEvent = {
            target: { name, value: optionValue }
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
        setIsOpen(false);
    };

    const getSelectedLabel = () => {
        let selectedLabel = '';
        
        // Fragment içindeki children'ı düzgün işlemek için
        const processChildren = (children: React.ReactNode): void => {
            React.Children.forEach(children, (child) => {
                if (React.isValidElement(child)) {
                    if (child.type === 'option' && child.props.value === value) {
                        selectedLabel = child.props.children;
                    } else if (child.props.children) {
                        // Fragment durumu için recursively kontrol et
                        processChildren(child.props.children);
                    }
                }
            });
        };
        
        processChildren(children);
        return selectedLabel || 'Seçiniz';
    };

    const renderOptions = () => {
        const options: React.ReactNode[] = [];
        
        // Fragment içindeki children'ı düzgün işlemek için
        const processChildren = (children: React.ReactNode): void => {
            React.Children.forEach(children, (child, index) => {
                if (React.isValidElement(child)) {
                    if (child.type === 'option') {
                        // Filter by search query
                        const optionLabel = String(child.props.children || '');
                        const optionValue = String(child.props.value || '');
                        const query = searchQuery.toLowerCase().trim();
                        
                        if (query && !optionLabel.toLowerCase().includes(query) && !optionValue.toLowerCase().includes(query)) {
                            return; // Skip this option if it doesn't match search
                        }
                        
                        const isSelected = child.props.value === value;
                        options.push(
                            <button
                                key={`${child.props.value}-${index}`}
                                type="button"
                                className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${
                                    isSelected ? 'active' : ''
                                } ${isMobile ? 'py-2' : 'py-2'}`}
                                onClick={() => handleOptionClick(child.props.value)}
                                style={{ minHeight: isMobile ? '40px' : '40px' }}
                            >
                                {child.props.children}
                                {isSelected && (
                                    <svg 
                                        width="16" 
                                        height="16" 
                                        fill="currentColor" 
                                        className="bi bi-check ms-auto"
                                        viewBox="0 0 16 16"
                                    >
                                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                    </svg>
                                )}
                            </button>
                        );
                    } else if (child.props.children) {
                        // Fragment durumu için recursively işle
                        processChildren(child.props.children);
                    }
                }
            });
        };
        
        processChildren(children);
        
        // If no options match the search, show "no results" message
        if (options.length === 0 && searchQuery) {
            return (
                <div className="list-group-item border-0 text-center text-muted py-3">
                    Sonuç bulunamadı
                </div>
            );
        }
        
        return options;
    };

    return (
        <>
            <Form.Group as={as} md={md} controlId={controlId} className="mb-3">
                {label && <Form.Label>{label}</Form.Label>}
                <div className="position-relative" ref={dropdownRef}>
                    {/* Custom Select Button */}
                    <div
                        ref={selectRef}
                        className={`form-control d-flex align-items-center justify-content-between ${
                            disabled ? 'disabled' : ''
                        } ${isInvalid ? 'is-invalid' : ''} ${!disabled ? 'cursor-pointer' : ''}`}
                        onClick={handleToggle}
                        tabIndex={disabled ? -1 : 0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleToggle(e as any);
                            }
                        }}
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        role="combobox"
                        style={{ 
                            color: 'var(--bs-body-color)',
                            minHeight: '38px',
                            paddingRight: '2.5rem'
                        }}
                    >
                        <span 
                            className={value ? '' : 'text-muted'} 
                            style={{ 
                                color: value ? 'var(--bs-body-color)' : undefined,
                                flex: 1,
                                paddingRight: '8px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {getSelectedLabel()}
                        </span>
                        <div 
                            className="d-flex align-items-center justify-content-center position-absolute"
                            style={{
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '24px',
                                height: '24px',
                                flexShrink: 0
                            }}
                        >
                            <svg 
                                width="20" 
                                height="20" 
                                fill="var(--bs-body-color)" 
                                className={`bi bi-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                viewBox="0 0 16 16"
                                style={{ 
                                    color: 'var(--bs-body-color) !important',
                                    flexShrink: 0
                                }}
                            >
                                <path d="M1.5 5.5a.5.5 0 0 1 .708 0L8 11.293l5.792-5.793a.5.5 0 0 1 .708.708l-6.146 6.146a.5.5 0 0 1-.708 0L1.5 6.207a.5.5 0 0 1 0-.707z"/>
                            </svg>
                        </div>
                    </div>

                    {/* Hidden native select for form submission */}
                    <select
                        name={name}
                        value={value}
                        onChange={onChange}
                        className="d-none"
                        tabIndex={-1}
                        aria-hidden="true"
                    >
                        {children}
                    </select>

                    {/* Dropdown Options */}
                    {isOpen && !isMobile && (
                        // Desktop Dropdown Portal
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
                                {/* Search Input */}
                                <div className="p-2 border-bottom bg-light sticky-top">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Ara..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                
                                <div className="overflow-auto" style={{ maxHeight: `${dropdownPosition.maxHeight - 50}px` }}>
                                    <div className="list-group list-group-flush">
                                        {renderOptions()}
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )
                    )}

                    {/* Mobile Bottom Sheet */}
                    {isOpen && isMobile && (
                        <>
                            <div 
                                className="modal-backdrop fade show"
                                onClick={() => setIsOpen(false)}
                                style={{ cursor: 'pointer' }}
                            ></div>
                            <div className="position-fixed bottom-0 start-0 w-100 bg-white shadow-lg border-top rounded-top-3" 
                                 style={{ zIndex: 1070, maxHeight: '60vh' }}>
                                {/* Handle bar */}
                                <div className="py-2">
                                </div>
                                
                                {/* Search Input for Mobile */}
                                <div className="px-3 pb-2 border-bottom bg-light">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        className="form-control"
                                        placeholder="Ara..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                
                                {/* Options */}
                                <div className="overflow-auto" style={{ maxHeight: 'calc(60vh - 120px)' }}>
                                    <div className="list-group list-group-flush">
                                        {renderOptions()}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Error Message */}
                {isInvalid && errorMessage && (
                    <div className="invalid-feedback d-block">
                        {errorMessage}
                    </div>
                )}
            </Form.Group>

            {/* Custom CSS using Bootstrap variables and utilities */}
            <style jsx global>{`
                .cursor-pointer {
                    cursor: pointer;
                }
                
                .transition-transform {
                    transition: transform 0.2s ease;
                }
                
                .rotate-180 {
                    transform: rotate(180deg);
                }
                
                .rounded-top-3 {
                    border-top-left-radius: 0.5rem !important;
                    border-top-right-radius: 0.5rem !important;
                }
                
                /* Mobile bottom sheet animation */
                @media (max-width: 768px) {
                    .position-fixed.bottom-0 {
                        animation: slideUpFromBottom 0.3s ease-out;
                    }
                }
                
                @keyframes slideUpFromBottom {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
                
                /* Focus styles using Bootstrap colors */
                .form-control:focus {
                    border-color: #86b7fe;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                }
                
                /* Active list item styles */
                .list-group-item.active {
                    background-color: var(--bs-primary);
                    border-color: var(--bs-primary);
                    color: var(--bs-white);
                }
                
                .list-group-item:hover:not(.active) {
                    background-color: var(--bs-gray-100);
                }
                
                /* Disabled state */
                .form-control.disabled {
                    background-color: var(--bs-gray-100);
                    opacity: 1;
                    cursor: not-allowed;
                }
                
                /* Modal backdrop for mobile */
                .modal-backdrop {
                    z-index: 1050;
                }
                
                /* Prevent body scroll when mobile modal is open */
                body.modal-open {
                    overflow: hidden;
                }

                /* Dropdown animations and positioning */
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
                
                /* Scrollbar styling for dropdown */
                .overflow-auto::-webkit-scrollbar {
                    width: 6px;
                }
                
                .overflow-auto::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .overflow-auto::-webkit-scrollbar-thumb {
                    background-color: rgba(0, 0, 0, 0.2);
                    border-radius: 3px;
                }
                
                .overflow-auto::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(0, 0, 0, 0.3);
                }
            `}</style>
        </>
    );
};

export default FormSelectField;