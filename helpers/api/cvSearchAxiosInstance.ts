import axios from 'axios'
import { CV_SEARCH_API_BASE_URL } from '@/contants/urls'

const cvSearchAxiosInstance = axios.create({
  baseURL: CV_SEARCH_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-API-Key': process.env.NEXT_PUBLIC_CV_API_KEY || '',
  },
  timeout: 60000, // CV processing can take time
})

export default cvSearchAxiosInstance
