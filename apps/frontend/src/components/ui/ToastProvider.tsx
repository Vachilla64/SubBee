import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        success: {
          style: {
            background: '#143032',
            color: '#fff',
            borderRadius: '9999px',
            padding: '12px 20px',
            fontWeight: '800',
            fontSize: '14px',
            boxShadow: '0 8px 24px -6px rgba(20,48,50,0.5)',
          },
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BBD8D8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          ),
        },
        error: {
          style: {
            background: '#3E1C1A',
            color: '#fff',
            borderRadius: '9999px',
            padding: '12px 20px',
            fontWeight: '800',
            fontSize: '14px',
            boxShadow: '0 8px 24px -6px rgba(62,28,26,0.5)',
          },
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F6D5CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ),
        },
      }}
    />
  );
}
