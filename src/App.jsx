import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ChatRoom from './pages/ChatRoom';
import FollowUp from './pages/FollowUp';
import Settings from './pages/Settings';
import { User } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [theme, setTheme] = useState('light');

  // Inicializar el tema desde localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('saint_crm_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('saint_crm_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Renderizar la página actual
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <ChatRoom />;
      case 'followup':
        return <FollowUp />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // Obtener el título legible de la barra superior
  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Panel de Control (Dashboard)';
      case 'chat':
        return 'Mensajería en Tiempo Real';
      case 'followup':
        return 'Tablero de Seguimiento (Clientes/Leads)';
      case 'settings':
        return 'Configuración y Webhooks';
      default:
        return 'CRM saint';
    }
  };

  return (
    <div className="app-container">
      {/* Barra de Navegación Lateral */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Área Principal de Contenido */}
      <main className="main-content">
        {/* Barra Superior */}
        <header className="top-bar">
          <h2 className="top-bar-title">{getPageTitle()}</h2>
          
          <div className="top-bar-actions">
            <div className="user-badge">
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                Asesor Saint
              </span>
              <div className="user-avatar">
                <User size={16} />
              </div>
            </div>
          </div>
        </header>

        {/* Cuerpo de la Página */}
        {renderPage()}
      </main>
    </div>
  );
}
