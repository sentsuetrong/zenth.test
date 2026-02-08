import { defineStore } from 'pinia'
import axios from '@/libs/axios' // เรียกใช้ axios ตัวที่เราเพิ่งสร้าง

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // โหลดค่าจาก Storage ถ้ามี (กรณี Refresh หน้าเว็บแล้วไม่หลุด)
    user: JSON.parse(localStorage.getItem('userData')) || null,
    token: localStorage.getItem('accessToken') || null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    async login(email, password) {
      try {
        const response = await axios.post('/api/v1/auth/login', {
          email,
          password,
        })

        const { token, user } = response.data.data

        // อัปเดต State
        this.token = token
        this.user = user

        // บันทึกลง Storage (เพื่อให้จำได้เวลาปิดคอม)
        localStorage.setItem('accessToken', token)
        localStorage.setItem('userData', JSON.stringify(user))

        return true
      } catch (error) {
        console.error(
          'Login Failed:',
          error.response?.data?.message || error.message,
        )
        throw error
      }
    },

    async fetchUser() {
      // กรณีอยากดึงข้อมูลล่าสุดจาก Server (/auth/me)
      if (!this.token) return
      try {
        const res = await axios.get('/api/v1/auth/me')
        this.user = res.data.data
        localStorage.setItem('userData', JSON.stringify(this.user))
      } catch (error) {
        this.logout()
      }
    },

    logout() {
      // เรียก API Logout (Optional: เพื่อ Revoke Token ฝั่ง Server)
      if (this.token) {
        axios.post('/api/v1/auth/logout').catch(() => {})
      }

      // ล้างข้อมูลฝั่ง Client
      this.token = null
      this.user = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('userData')
    },
  },
})
