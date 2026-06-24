export interface RequestType {
    id: number;
    name: string;
    description: string;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface OtherRequest {
    id: number;
    employee_id: number;
    request_type_id: number;
    description: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    completed_at?: string | null;
    completed_by?: number | null;
    created_at: string;
    updated_at: string;
    
    // Backend'den Preload ile dönen ilişkili veriler
    employee?: {
        id: number;
        first_name: string;
        last_name: string;
    };
    request_type?: RequestType;
}

// Backend'e gönderilecek veri tipleri
export interface CreateOtherRequestPayload {
    request_type_id: number;
    description: string;
}

export interface CreateRequestTypePayload {
    name: string;
    description: string;
    active: boolean;
}