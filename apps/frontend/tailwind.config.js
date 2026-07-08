/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        // SubBee brand palette — sampled from the synced Claude Design file
        cream: {
          bg: '#FAF3E1',   // phone/page background
          nav: '#FCF7EA',  // bottom nav bar
        },
        ink: {
          DEFAULT: '#1E2A2E',
          muted: '#8A9499',
          faint: '#9AA3A6',
        },
        gold: {
          light: '#F2CE7C',
          DEFAULT: '#E9B84A',
          mid: '#E7B84F',
          deep: '#D3A048',
          panelFrom: '#F3D084',
          panelVia: '#E9BC55',
          panelTo: '#D3A048',
          text: '#3A2A0E',
          label: '#7A5A22',
        },
        teal: {
          light: '#2E6264',
          DEFAULT: '#1C4042',
          deep: '#143032',
          soft: '#BBD8D8',
          soft2: '#A7C4C7',
          soft3: '#9FC4C3',
          softText: '#C9DEDD',
        },
        salmon: {
          bg: '#FDE0DB',
          bg2: '#FBD9CE',
          text: '#B24A3C',
          alertBg: '#FEF1EE',
          alertBorder: '#F6D5CC',
        },
        active: {
          bg: '#EAF3EC',
          border: '#9CC0A5',
          text: '#3E6247',
        },
        paused: {
          bg: '#E9EAE9',
          text: '#6B7377',
        },
      },
      // Tailwind's default spacing scale only ships .5 steps up to 3.5; the synced
      // design uses 18px and 22px paddings/margins, so extend the scale rather than
      // rounding them off (a bare `p-4.5` would otherwise silently render as 0).
      spacing: {
        '4.5': '1.125rem', // 18px
        '5.5': '1.375rem', // 22px
      },
      borderRadius: {
        card: '22px',
        panel: '26px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(-4deg)' },
          '50%': { transform: 'translateY(-7px) rotate(4deg)' },
        },
      },
    },
  },
  plugins: [],
};
