import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ClipboardList, 
  Settings as SettingsIcon, 
  Sun, 
  Moon 
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, theme, toggleTheme }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Chats en Vivo', icon: MessageSquare },
    { id: 'followup', label: 'Seguimiento', icon: ClipboardList },
    { id: 'settings', label: 'Configuración', icon: SettingsIcon },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1 className="logo-text">
          sa<span>i</span>nt
        </h1>
      </div>

      <nav style={{ flex: 1 }}>
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={`menu-item ${isActive ? 'active' : ''}`}
                  style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
                >
                  <IconComponent size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <span style={{ fontSize: '12px', color: 'var(--text-on-sidebar)', fontWeight: 500 }}>
          v1.0.0
        </span>
        <button onClick={toggleTheme} className="theme-toggle" title="Cambiar tema">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </aside>
  );
}
