import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Flame, 
  CheckCircle, 
  CalendarClock, 
  Info,
  TrendingUp
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalContacts: 120,
    interested: 45,
    clients: 32,
    pendingFollowUps: 15
  });
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const isConfig = isSupabaseConfigured();
    setConfigured(isConfig);

    if (isConfig) {
      fetchRealStats();
      
      // Suscribirse a cambios para actualizar las estadísticas en tiempo real
      const contactSubscription = supabase
        .channel('dashboard-contacts-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
          fetchRealStats();
        })
        .subscribe();

      const followupSubscription = supabase
        .channel('dashboard-followup-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, () => {
          fetchRealStats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(contactSubscription);
        supabase.removeChannel(followupSubscription);
      };
    }
  }, []);

  const fetchRealStats = async () => {
    setLoading(true);
    try {
      // 1. Total Contactos
      const { count: totalCount, error: err1 } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      // 2. Interesados
      const { count: interestedCount, error: err2 } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('label', 'Interesado');

      // 3. Clientes
      const { count: clientsCount, error: err3 } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('label', 'Cliente');

      // 4. Seguimientos pendientes
      const { count: followupCount, error: err4 } = await supabase
        .from('follow_ups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (!err1 && !err2 && !err3 && !err4) {
        setStats({
          totalContacts: totalCount || 0,
          interested: interestedCount || 0,
          clients: clientsCount || 0,
          pendingFollowUps: followupCount || 0
        });
      }
    } catch (e) {
      console.error('Error al cargar estadísticas de Supabase:', e);
    } finally {
      setLoading(false);
    }
  };

  // Calcular porcentajes
  const total = stats.totalContacts || 1;
  const interestedPct = Math.round((stats.interested / total) * 100);
  const clientsPct = Math.round((stats.clients / total) * 100);
  const others = total - stats.interested - stats.clients;
  const othersPct = Math.round((others / total) * 100);

  return (
    <div className="content-body">
      {!configured && (
        <div className="alert-setup warning" style={{ marginBottom: '24px' }}>
          <Info size={18} />
          <span>
            <strong>Base de datos no conectada:</strong> Mostrando datos de demostración interactivos. Dirígete a la sección de <strong>Configuración</strong> para conectar tu Supabase.
          </span>
        </div>
      )}

      {/* Grid de Tarjetas Estadísticas */}
      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Prospectos</span>
            <span className="stat-value">{loading ? '...' : stats.totalContacts}</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon orange">
            <Flame size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Interesados (Leads)</span>
            <span className="stat-value">{loading ? '...' : stats.interested}</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Clientes de saint</span>
            <span className="stat-value">{loading ? '...' : stats.clients}</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon purple">
            <CalendarClock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Seguimientos Activos</span>
            <span className="stat-value">{loading ? '...' : stats.pendingFollowUps}</span>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos y Detalles */}
      <div className="dashboard-details-grid">
        {/* Gráfico de barras de Clasificación */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Distribución de Leads por Interés</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={14} /> Tiempo Real
            </span>
          </div>
          
          <div className="chart-placeholder">
            <div className="chart-bars">
              <div className="chart-bar-container">
                <div 
                  className="chart-bar" 
                  style={{ height: `${Math.max(5, (stats.totalContacts / total) * 100)}%` }}
                  data-value={stats.totalContacts}
                ></div>
                <div className="chart-bar-label">Total</div>
              </div>

              <div className="chart-bar-container">
                <div 
                  className="chart-bar orange" 
                  style={{ height: `${Math.max(5, interestedPct)}%` }}
                  data-value={stats.interested}
                ></div>
                <div className="chart-bar-label">Interesados</div>
              </div>

              <div className="chart-bar-container">
                <div 
                  className="chart-bar" 
                  style={{ height: `${Math.max(5, clientsPct)}%`, background: '#22c55e' }}
                  data-value={stats.clients}
                ></div>
                <div className="chart-bar-label">Clientes</div>
              </div>

              <div className="chart-bar-container">
                <div 
                  className="chart-bar" 
                  style={{ height: `${Math.max(5, othersPct)}%`, background: '#64748b' }}
                  data-value={others >= 0 ? others : 0}
                ></div>
                <div className="chart-bar-label">Otros</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Resumen y Acciones Rápidas */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Eficiencia Comercial</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 500 }}>Conversión a Cliente</span>
                  <span style={{ fontWeight: 700, color: '#22c55e' }}>{clientsPct}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${clientsPct}%`, height: '100%', backgroundColor: '#22c55e' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 500 }}>Interés Generado (Leads)</span>
                  <span style={{ fontWeight: 700, color: 'var(--saint-orange)' }}>{interestedPct}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${interestedPct}%`, height: '100%', backgroundColor: 'var(--saint-orange)' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Resumen del Negocio (saint)</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Este CRM permite evaluar el nivel de interés de los chats gestionados vía WhatsApp. n8n etiqueta automáticamente a los prospectos basándose en sus intenciones, permitiendo al equipo comercial de saint concentrarse en cerrar ventas de licencias Enterprise y Contabilidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
