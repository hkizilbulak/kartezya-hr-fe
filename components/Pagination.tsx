import React from 'react';
import { Pagination, Form } from 'react-bootstrap';

type IProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[];
}

const CustomPagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    totalItems,
    itemsPerPage = 10,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100]
}: IProps) => {

    // If no page size change and only one page, don't show pagination at all
    if (totalPages < 1 && !onPageSizeChange && !totalItems) {
    return null;
}

    const onNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const onPrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const renderPageItems = () => {
        const items = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page
        if (startPage > 1) {
            items.push(
                <Pagination.Item key={1} onClick={() => onPageChange(1)}>
                    1
                </Pagination.Item>
            );
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="start-ellipsis" />);
            }
        }

        // Page range
        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <Pagination.Item 
                    key={page} 
                    active={page === currentPage}
                    onClick={() => onPageChange(page)}
                >
                    {page}
                </Pagination.Item>
            );
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<Pagination.Ellipsis key="end-ellipsis" />);
            }
            items.push(
                <Pagination.Item key={totalPages} onClick={() => onPageChange(totalPages)}>
                    {totalPages}
                </Pagination.Item>
            );
        }

        return items;
    };

    return (
        <div style={{ padding: '0 16px' }}>
            {/* Desktop görünüm */}
            <div className="d-none d-md-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                    {onPageSizeChange && (
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-muted" style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                Sayfa başına:
                            </span>
                            <Form.Select 
                                size="sm"
                                value={itemsPerPage}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                style={{ width: 'auto', minWidth: '70px' }}
                            >
                                {pageSizeOptions.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </Form.Select>
                        </div>
                    )}
                    {totalItems && (
                        <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                            Toplam {totalItems} kayıt, sayfa {currentPage} / {totalPages}
                        </div>
                    )}
                </div>
                {totalPages > 1 && (
                    <Pagination className="mb-0">
                        <Pagination.Prev 
                            disabled={currentPage === 1} 
                            onClick={onPrevious} 
                        />
                        {renderPageItems()}
                        <Pagination.Next 
                            disabled={currentPage === totalPages} 
                            onClick={onNext} 
                        />
                    </Pagination>
                )}
            </div>

            {/* Mobile görünüm */}
            <div className="d-flex d-md-none flex-column align-items-center gap-2">
                {onPageSizeChange && (
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-muted" style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                            Sayfa başına:
                        </span>
                        <Form.Select 
                            size="sm"
                            value={itemsPerPage}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            style={{ width: 'auto', minWidth: '70px' }}
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </Form.Select>
                    </div>
                )}
                {totalItems && (
                    <div className="text-muted text-center" style={{ fontSize: '0.875rem' }}>
                        Toplam {totalItems} kayıt, sayfa {currentPage} / {totalPages}
                    </div>
                )}
                {totalPages > 1 && (
                    <Pagination className="mb-0 justify-content-center">
                        <Pagination.Prev 
                            disabled={currentPage === 1} 
                            onClick={onPrevious} 
                        />
                        {renderPageItems()}
                        <Pagination.Next 
                            disabled={currentPage === totalPages} 
                            onClick={onNext} 
                        />
                    </Pagination>
                )}
            </div>
        </div>
    );
};

export default CustomPagination;
