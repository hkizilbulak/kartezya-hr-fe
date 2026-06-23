import { HR_ENDPOINTS } from '@/contants/urls';
import axiosInstance from '@/helpers/api/axiosInstance';
import { 
    OtherRequest, 
    RequestType, 
    CreateOtherRequestPayload, 
    CreateRequestTypePayload 
} from '@/types/other-request';

export const otherRequestService = {
    getAllRequests: async (params?: { limit?: number; offset?: number; sort?: string; direction?: string }) => {
        const response = await axiosInstance.get(HR_ENDPOINTS.OTHER_REQUESTS, { params });
        return response.data;
    },

    createRequest: async (payload: CreateOtherRequestPayload) => {
        const response = await axiosInstance.post(HR_ENDPOINTS.OTHER_REQUESTS, payload);
        return response.data;
    },

    cancelRequest: async (id: number) => {
        const response = await axiosInstance.patch(`${HR_ENDPOINTS.OTHER_REQUESTS}/${id}/cancel`);
        return response.data;
    },

    completeRequest: async (id: number) => {
        const response = await axiosInstance.patch(`${HR_ENDPOINTS.OTHER_REQUESTS}/${id}/complete`);
        return response.data;
    },

    getAllRequestTypes: async (params?: { limit?: number; offset?: number }) => {
        const response = await axiosInstance.get(HR_ENDPOINTS.REQUEST_TYPES, { params });
        return response.data;
    },

    createRequestType: async (payload: CreateRequestTypePayload) => {
        const response = await axiosInstance.post(HR_ENDPOINTS.REQUEST_TYPES, payload);
        return response.data;
    }
};