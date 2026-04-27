export interface KspeakerVoucher {
    id?: number;
    code?: string;
    active?: boolean;
    expiresAt: string;
    usedByDeviceId?: string;
    userDeviceId?: string; // used in POST
    createdAt?: string;
    updatedAt?: string;
    status?: string;
    [key: string]: any;
}

export interface KspeakerVoucherResponse {
    limit: number;
    page: number;
    total: number;
    vouchers: KspeakerVoucher[];
}

class KspeakerService {
    private get baseUrl() {
        return process.env.NEXT_PUBLIC_KSPEAKER_BASE_URL || 'https://kartezya-ai.up.railway.app';
    }

    private get headers() {
        return {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_KSPEAKER_API_KEY || ''
        };
    }

    async getVouchers(page = 1, limit = 100): Promise<KspeakerVoucherResponse> {
        const response = await fetch(`${this.baseUrl}/vouchers?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: this.headers
        });
        if (!response.ok) {
            throw new Error('Failed to fetch vouchers');
        }
        return response.json();
    }

    async createVoucher(voucher: { userDeviceId: string; expiresAt: string }) {
        const response = await fetch(`${this.baseUrl}/vouchers`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(voucher)
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to create voucher');
        }
        return data;
    }

    async updateVoucher(id: string | number, voucher: { userDeviceId: string; expiresAt: string }) {
        const response = await fetch(`${this.baseUrl}/vouchers/${id}`, {
            method: 'PUT',
            headers: this.headers,
            body: JSON.stringify(voucher)
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to update voucher');
        }
        return data;
    }

    async deleteVoucher(id: string | number) {
        const response = await fetch(`${this.baseUrl}/vouchers/${id}`, {
            method: 'DELETE',
            headers: this.headers
        });
        
        if (!response.ok) {
            let data;
            try {
                data = await response.json();
            } catch (e) {
                data = {};
            }
            throw new Error(data.message || data.error || 'Failed to delete voucher');
        }
        return true;
    }
}

export const kspeakerService = new KspeakerService();
