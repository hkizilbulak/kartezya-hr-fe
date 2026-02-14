"use client";

import React, { useRef, useState, useEffect } from "react";
import { Form } from "react-bootstrap";

type IProps = {
    label?: string;
    name: string;
    value: string;
    onChange: (e: any) => void;
    disabled?: boolean;
    required?: boolean;
    isInvalid?: boolean;
    errorMessage?: string;
    placeholder?: string;
};

const FormDateField = ({
    label,
    name,
    value,
    onChange,
    disabled = false,
    required = false,
    isInvalid = false,
    errorMessage,
    placeholder = "GG.AA.YYYY",
}: IProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const monthsNamesTr = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    const daysNamesTr = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

    useEffect(() => {
        if (value) {
            const [year, month, day] = value.split("-");
            setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            // Popup açıkken body scroll'u engelle
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = "unset";
            };
        }
    }, [isOpen]);

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return firstDay === 0 ? 6 : firstDay - 1;
    };

    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return "";
        try {
            const [year, month, day] = dateString.split("-");
            return `${day}.${month}.${year}`;
        } catch {
            return dateString;
        }
    };

    const handleDateClick = (day: number, e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        e?.stopPropagation();
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, "0");
        const dayStr = String(day).padStart(2, "0");
        const dateStr = `${year}-${month}-${dayStr}`;

        onChange({
            target: {
                name: name,
                value: dateStr,
            },
        });
        setIsOpen(false);
    };

    const handlePrevMonth = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        onChange({
            target: {
                name: name,
                value: inputValue,
            },
        });
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        const isCurrentDate = (day: number) => {
            if (!value) return false;
            const [year, month, dayStr] = value.split("-");
            return (
                parseInt(year) === currentMonth.getFullYear() &&
                parseInt(month) - 1 === currentMonth.getMonth() &&
                parseInt(dayStr) === day
            );
        };

        return (
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "0.375rem",
                    padding: "0.75rem",
                    maxWidth: "100%",
                }}
            >
                {days.map((day, index) => (
                    <button
                        key={index}
                        onClick={(e) => day && handleDateClick(day, e)}
                        disabled={!day}
                        style={{
                            padding: "0.5rem 0",
                            border: "none",
                            borderRadius: "4px",
                            backgroundColor: day && isCurrentDate(day) ? "#624bff" : "transparent",
                            color: day && isCurrentDate(day) ? "#ffffff" : "#212529",
                            cursor: day ? "pointer" : "default",
                            fontSize: "0.8rem",
                            fontWeight: day && isCurrentDate(day) ? 600 : 400,
                            transition: "all 0.15s ease-in-out",
                            opacity: day ? 1 : 0.2,
                            fontFamily: "Poppins, sans-serif",
                            minWidth: "0",
                            aspectRatio: "1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                        }}
                        onMouseEnter={(e) => {
                            if (day && !isCurrentDate(day)) {
                                (e.target as HTMLButtonElement).style.backgroundColor = "#e9ecef";
                                (e.target as HTMLButtonElement).style.color = "#624bff";
                                (e.target as HTMLButtonElement).style.fontWeight = "600";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (day && !isCurrentDate(day)) {
                                (e.target as HTMLButtonElement).style.backgroundColor = "transparent";
                                (e.target as HTMLButtonElement).style.color = "#212529";
                                (e.target as HTMLButtonElement).style.fontWeight = "400";
                            }
                        }}
                    >
                        {day}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <Form.Group 
            ref={containerRef} 
            className="form-date-field-wrapper" 
            style={{ 
                marginBottom: "1rem", 
                width: "100%", 
                position: "relative" 
            }}
        >
            {label && (
                <Form.Label htmlFor={name}>
                    {label}
                    {required && <span style={{ color: "#dc3545", marginLeft: "4px" }}>*</span>}
                </Form.Label>
            )}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    border: isInvalid ? "2px solid #dc3545" : "1px solid #ced4da",
                    borderRadius: "4px",
                    backgroundColor: disabled ? "#e9ecef" : "#ffffff",
                    transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
                    padding: "0",
                    height: "40px",
                    overflow: "visible",
                    width: "100%",
                }}
                className="date-input-container"
            >
                <input
                    ref={inputRef}
                    type="text"
                    id={name}
                    name={name}
                    value={formatDateForDisplay(value)}
                    onChange={handleInputChange}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    placeholder={placeholder}
                    style={{
                        border: "none",
                        outline: "none",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.9375rem",
                        backgroundColor: "transparent",
                        color: value ? "var(--bs-body-color)" : "#6c757d",
                        width: "100%",
                        fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
                        cursor: disabled ? "not-allowed" : "pointer",
                    }}
                />
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    style={{
                        marginRight: "0.75rem",
                        color: disabled ? "#6c757d" : "#624bff",
                        pointerEvents: "auto",
                        cursor: disabled ? "not-allowed" : "pointer",
                        flexShrink: 0,
                    }}
                >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </div>

            {isOpen && !disabled && (
                <>
                    <div
                        style={{
                            position: "fixed",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            backgroundColor: "#ffffff",
                            border: "1px solid #d0d0d0",
                            borderRadius: "8px",
                            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                            zIndex: 1060,
                            width: "auto",
                            minWidth: "320px",
                            maxWidth: "90vw",
                            display: "none",
                        }}
                        className="calendar-popover calendar-desktop"
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "1rem",
                                borderBottom: "1px solid #e0e0e0",
                            }}
                        >
                            <button
                                onClick={handlePrevMonth}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "0.5rem",
                                    fontSize: "1.25rem",
                                    color: "#0d6efd",
                                    fontWeight: "bold",
                                    transition: "all 0.15s ease-in-out",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            >
                                ❮
                            </button>
                            <div
                                style={{
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    color: "#212529",
                                    fontFamily: "Poppins, sans-serif",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {monthsNamesTr[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </div>
                            <button
                                onClick={handleNextMonth}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "0.5rem",
                                    fontSize: "1.25rem",
                                    color: "#0d6efd",
                                    fontWeight: "bold",
                                    transition: "all 0.15s ease-in-out",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            >
                                ❯
                            </button>
                        </div>

                        <div style={{ padding: "0.75rem" }}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(7, 1fr)",
                                    gap: "0.375rem",
                                    marginBottom: "0.5rem",
                                }}
                            >
                                {daysNamesTr.map((day) => (
                                    <div
                                        key={day}
                                        style={{
                                            textAlign: "center",
                                            fontWeight: 600,
                                            fontSize: "0.7rem",
                                            color: "#6c757d",
                                            padding: "0.25rem 0",
                                            fontFamily: "Poppins, sans-serif",
                                            aspectRatio: "1",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                            {renderCalendar()}
                            <div
                                style={{
                                    marginTop: "0.5rem",
                                    textAlign: "center",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange({ target: { name, value: '' } });
                                        setIsOpen(false); // Close the popover
                                    }}
                                    style={{
                                        background: "none",
                                        border: "1px solid #ced4da",
                                        borderRadius: "4px",
                                        padding: "0.25rem 0.5rem",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                        color: "#212529",
                                    }}
                                >
                                    Seçimi Kaldır
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            zIndex: 1055,
                            display: "none",
                        }}
                        className="calendar-backdrop"
                        onClick={() => setIsOpen(false)}
                    />

                    <div
                        style={{
                            position: "fixed",
                            top: "auto",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: "#ffffff",
                            border: "1px solid #d0d0d0",
                            borderRadius: "16px 16px 0 0",
                            boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.12)",
                            zIndex: 1060,
                            width: "100%",
                            maxHeight: "80vh",
                            overflowY: "auto",
                            display: "none",
                        }}
                        className="calendar-popover calendar-mobile"
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "1rem",
                                borderBottom: "1px solid #e0e0e0",
                            }}
                        >
                            <button
                                onClick={handlePrevMonth}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "0.5rem",
                                    fontSize: "1.25rem",
                                    color: "#0d6efd",
                                    fontWeight: "bold",
                                    transition: "all 0.15s ease-in-out",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            >
                                ❮
                            </button>
                            <div
                                style={{
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    color: "#212529",
                                    fontFamily: "Poppins, sans-serif",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {monthsNamesTr[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </div>
                            <button
                                onClick={handleNextMonth}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "0.5rem",
                                    fontSize: "1.25rem",
                                    color: "#0d6efd",
                                    fontWeight: "bold",
                                    transition: "all 0.15s ease-in-out",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            >
                                ❯
                            </button>
                        </div>

                        <div style={{ padding: "0.75rem" }}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(7, 1fr)",
                                    gap: "0.375rem",
                                    marginBottom: "0.5rem",
                                }}
                            >
                                {daysNamesTr.map((day) => (
                                    <div
                                        key={day}
                                        style={{
                                            textAlign: "center",
                                            fontWeight: 600,
                                            fontSize: "0.7rem",
                                            color: "#6c757d",
                                            padding: "0.25rem 0",
                                            fontFamily: "Poppins, sans-serif",
                                            aspectRatio: "1",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                            {renderCalendar()}
                            <div
                                style={{
                                    marginTop: "0.5rem",
                                    textAlign: "center",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange({ target: { name, value: '' } });
                                        setIsOpen(false); // Close the popover
                                    }}
                                    style={{
                                        background: "none",
                                        border: "1px solid #ced4da",
                                        borderRadius: "4px",
                                        padding: "0.25rem 0.5rem",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                        color: "#212529",
                                    }}
                                >
                                    Seçimi Kaldır
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {isInvalid && errorMessage && (
                <Form.Text className="text-danger">
                    {errorMessage}
                </Form.Text>
            )}
            <style jsx>{`
                .form-date-field-wrapper {
                    font-family: Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
                        "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
                        sans-serif;
                    width: 100%;
                }

                .date-input-container:hover:not(:has(input:disabled)) {
                    border-color: #ced4da;
                }

                .date-input-container:has(input:focus) {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
                }

                .date-input-container:has(input:disabled) {
                    opacity: 0.65;
                    cursor: not-allowed;
                }

                .calendar-popover {
                    animation: fadeIn 0.2s ease-in-out forwards;
                }

                .calendar-desktop {
                    display: none !important;
                }

                .calendar-mobile {
                    display: none !important;
                }

                .calendar-backdrop {
                    display: none !important;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Desktop: centered popup with backdrop */
                @media (min-width: 577px) {
                    .calendar-backdrop {
                        display: block !important;
                    }

                    .calendar-desktop {
                        display: block !important;
                    }

                    .calendar-desktop {
                        animation: fadeIn 0.2s ease-in-out forwards;
                    }
                }

                /* Mobile: bottom sheet with backdrop */
                @media (max-width: 576px) {
                    .calendar-backdrop {
                        display: block !important;
                    }

                    .calendar-mobile {
                        display: block !important;
                        animation: slideUp 0.3s ease-in-out forwards;
                    }
                }
            `}</style>
        </Form.Group>
    );
};

export default FormDateField;
