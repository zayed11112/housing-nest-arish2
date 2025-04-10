import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const Logo: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <Link to="/" className="block">
      <img 
        src={theme === 'dark' 
          ? "https://blogger.googleusercontent.com/img/a/AVvXsEilQtuf-qsT8qsa3FpdB3g80uzdGunuOluaSIJ2SYPx8z49H38nQKZDiMZlCyq84vhyWpcg_VuXJAbEJMe1fB2I0fs4OIWtawkv9dz8cYLzIfRbEhWJWhx-GO-_lk9m_H0H3pE6U_Y2Y17awSIupCyr4ouwCdqwQ_XdXq329s7oQjxDCw7qO4DSZMezMGi3"
          : "https://blogger.googleusercontent.com/img/a/AVvXsEgtib5x2cdvKmUC2uN_PDGynsNDIO5kyt0FdjL4z9rj_FxEhDr8dMqix-wbUEym1M5SK1-6Y-BuipiDQ_LYh3AC6q7cn7sqtICbv-LxF5bdi6HQn9Q_Pqe1-29kvX2k5P5ACy6E5fFZmJma9GF8C4kauLGfq2qLXXMI7Z_Yi_meTvo-eDqAvIUVR7Kff6y6"
        }
        alt="شركة السهم"
        className="h-12 w-auto hover:scale-105 hover:rotate-2 transition-all duration-300 ease-in-out animate-fadeIn hover:shadow-lg rounded-lg"
        style={{
          animation: 'floatEffect 3s ease-in-out infinite'
        }}
      />
      <style>
        {`
          @keyframes floatEffect {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-5px);
            }
            100% {
              transform: translateY(0px);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-in;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Link>
  );
};

export default Logo;