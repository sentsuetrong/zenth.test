import axios from 'axios'

const axiosIns = axios.create({
  // URL หลักของ API Backend
  // ถ้า Dev บน localhost:5173 ให้ยิงไป http://zenth.test
  // ถ้า Prod (อยู่บน zenth.test เหมือนกัน) ก็ใช้ / ได้เลย
  baseURL: import.meta.env.DEV ? 'http://zenth.test' : '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// --- Interceptor: ก่อนส่ง Request ---
axiosIns.interceptors.request.use(
  (config) => {
    // ดึง Token จาก LocalStorage
    const token = localStorage.getItem('accessToken')

    // ถ้ามี Token ให้แนบ Header Authorization: Bearer ...
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// --- Interceptor: หลังได้รับ Response ---
axiosIns.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // ถ้าเจอ 401 (Unauthorized) อาจจะ Token หมดอายุ -> ให้ Logout หรือดีดไปหน้า Login
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized, logging out...')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('userData')
      // window.location.href = '/login'; // หรือจัดการผ่าน Router ทีหลัง
    }
    return Promise.reject(error)
  },
)

export default axiosIns
