/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/Views/**/*.php',
    './app/Controllers/**/*.php',
    './app/Helpers/**/*.php', // เพิ่ม Helper ด้วยเผื่อมี
    './assets/js/**/*.js', // เผื่อมี JS ที่ใช้ class
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
