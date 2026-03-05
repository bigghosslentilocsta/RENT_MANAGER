/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#fff3f7",
        ink: "#271038",
        muted: "#6a567a",
        accentPink: "#ff4fa3",
        accentOrange: "#ff8a3d",
        accentBlue: "#3b7cff",
        pending: "#d8333a",
        paid: "#1f9a63"
      },
      boxShadow: {
        card: "0 18px 40px rgba(45, 21, 86, 0.16)"
      }
    }
  },
  plugins: []
};
