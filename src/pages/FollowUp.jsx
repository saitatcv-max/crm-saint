import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Calendar, 
  Check, 
  Trash, 
  Info,
  Clock,
  CheckCircle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

const MOCK_FOLLOWUPS_DASH = [
  {
    id: 'f-mock-1',
    status: 'pending',
    scheduled_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // Hace 2 días
    notes: 'Llamar para verificar si resolvió el error de impresora fiscal y compra la licencia de soporte.',
    contacts: { id: '3', name: 'Distribuidora Oriental', phone: '+584149998877' }
  },
  {
    id: 'f-mock-2',
    status: 'pending',
    scheduled_date: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // En 30 minutos (Hoy)
    notes: 'Enviar cotización formal de saint Enterprise con 3 estaciones de trabajo.',
    contacts: { id: '1', name: 'Carlos Mendoza', phone: '+584125550123' }
  },
  {
    id: 'f-mock-3',
    status: 'pending',
    scheduled_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), // En 4 días
    notes: 'Hacer seguimiento post-venta. Revisar si la Dra. María necesita soporte adicional.',
    contacts: { id: '2', name: 'Dra. María Elena', phone: '+584241112233' }
  },
  {
    id: 'f-mock-4',
    status: 'completed',
    scheduled_date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // Hace 4 horas
    completed_date: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(),
    notes: 'Llamada de bienvenida completada. Canal integrador asignado satisfactoriamente.',
    contacts: { id: '2', name: 'Dra. María Elena', phone: '+584241112233' }
  }
];

export default function FollowUp() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const isConfig = isSupabaseConfigured();
    setConfigured(isConfig);

    if (isConfig) {
      fetchFollowups();

      // Suscribirse a cambios en tiempo real
      const subscription = supabase
        .channel('followup-kanban')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, () => {
          fetchFollowups();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } else {
      setFollowups(MOCK_FOLLOWUPS_DASH);
    }
  }, []);

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      // Traer los seguimientos pendientes y completados uniendo la información del contacto
      const { data, error } = await supabase
        .from('follow_ups')
        .select(`
          id,
          status,
          scheduled_date,
          completed_date,
          notes,
          contact_id,
          contacts (
            id,
            name,
            phone
          )
        `)
        .in('status', ['pending', 'completed'])
        .order('scheduled_date', { ascending: true });

      if (!error && data) {
        setFollowups(data);
      }
    } catch (e) {
      console.error('Error al cargar seguimientos:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    if (configured) {
      try {
        const { error } = await supabase
          .from('follow_ups')
          .update({
            status: 'completed',
            completed_date: new Date().toISOString()
          })
          .eq('id', id);

        if (error) alert('Error al completar: ' + error.message);
      } catch (err) {
        console.error(err);
      }
    } else {
      setFollowups(prev => prev.map(f => f.id === id ? { ...f, status: 'completed', completed_date: new Date().toISOString() } : f));
      alert('Seguimiento marcado como completado (Simulación).');
    }
  };

  const handleCancel = async (id) => {
    if (configured) {
      try {
        // En lugar de sólo cambiar estado, los seguimientos cancelados o archivados los borramos
        const { error } = await supabase
          .from('follow_ups')
          .delete()
          .eq('id', id);

        if (error) alert('Error al eliminar: ' + error.message);
      } catch (err) {
        console.error(err);
      }
    } else {
      setFollowups(prev => prev.filter(f => f.id !== id));
      alert('Seguimiento eliminado permanentemente (Simulación).');
    }
  };

  // Clasificar seguimientos por fecha y estado
  const getColumns = () => {
    const overdue = [];
    const today = [];
    const upcoming = [];
    const completed = [];

    const now = new Date();
    // Inicio y fin del día de hoy
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    followups.forEach(item => {
      if (item.status === 'completed') {
        completed.push(item);
      } else {
        const date = new Date(item.scheduled_date);
        if (date < startOfToday) {
          overdue.push(item);
        } else if (date >= startOfToday && date <= endOfToday) {
          today.push(item);
        } else {
          upcoming.push(item);
        }
      }
    });

    // Ordenar completados por completed_date desc
    completed.sort((a, b) => new Date(b.completed_date || b.scheduled_date) - new Date(a.completed_date || a.scheduled_date));

    return { overdue, today, upcoming, completed };
  };

  const { overdue, today, upcoming, completed } = getColumns();

  const formatScheduledTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-VE', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column' }}>
      {!configured && (
        <div className="alert-setup warning" style={{ marginBottom: '24px', flexShrink: 0 }}>
          <Info size={18} />
          <span>
            <strong>Modo Demo Activo:</strong> Puedes simular completar y eliminar seguimientos. Conecta Supabase en Configuración para persistir tus datos.
          </span>
        </div>
      )}

      {loading && <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>Actualizando tablero...</div>}

      <div className="kanban-board">
        {/* Columna: VENCIDOS */}
        <div className="kanban-column">
          <div className="kanban-column-header" style={{ borderTop: '3px solid #ef4444' }}>
            <span className="kanban-column-title" style={{ color: '#ef4444' }}>
              <AlertCircle size={18} />
              Vencidos / Atrasados
            </span>
            <span className="kanban-column-count">{overdue.length}</span>
          </div>
          <div className="kanban-column-content">
            {overdue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                ¡Excelente! No tienes tareas vencidas.
              </div>
            ) : (
              overdue.map(item => (
                <div key={item.id} className="kanban-card overdue">
                  <div className="kanban-card-header">
                    <span className="kanban-card-name">{item.contacts?.name || 'Cliente sin nombre'}</span>
                    <span className="kanban-card-date">
                      <Clock size={12} />
                      {formatScheduledTime(item.scheduled_date)}
                    </span>
                  </div>
                  <p className="kanban-card-notes">{item.notes || 'Hacer llamada de seguimiento.'}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Tel: {item.contacts?.phone}
                  </div>
                  <div className="kanban-card-actions">
                    <button 
                      onClick={() => handleCancel(item.id)} 
                      className="btn-card-action"
                      title="Eliminar recordatorio"
                    >
                      <Trash size={12} />
                    </button>
                    <button 
                      onClick={() => handleComplete(item.id)} 
                      className="btn-card-action complete"
                      title="Marcar completo"
                    >
                      <Check size={12} />
                      Completar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna: PARA HOY */}
        <div className="kanban-column">
          <div className="kanban-column-header" style={{ borderTop: '3px solid var(--saint-orange)' }}>
            <span className="kanban-column-title" style={{ color: 'var(--saint-orange)' }}>
              <Calendar size={18} />
              Para Hoy
            </span>
            <span className="kanban-column-count">{today.length}</span>
          </div>
          <div className="kanban-column-content">
            {today.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Sin tareas pendientes para hoy.
              </div>
            ) : (
              today.map(item => (
                <div key={item.id} className="kanban-card">
                  <div className="kanban-card-header">
                    <span className="kanban-card-name">{item.contacts?.name || 'Cliente sin nombre'}</span>
                    <span className="kanban-card-date">
                      <Clock size={12} />
                      {formatScheduledTime(item.scheduled_date)}
                    </span>
                  </div>
                  <p className="kanban-card-notes">{item.notes || 'Hacer llamada de seguimiento.'}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Tel: {item.contacts?.phone}
                  </div>
                  <div className="kanban-card-actions">
                    <button 
                      onClick={() => handleCancel(item.id)} 
                      className="btn-card-action"
                    >
                      <Trash size={12} />
                    </button>
                    <button 
                      onClick={() => handleComplete(item.id)} 
                      className="btn-card-action complete"
                    >
                      <Check size={12} />
                      Completar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna: FUTUROS */}
        <div className="kanban-column">
          <div className="kanban-column-header" style={{ borderTop: '3px solid var(--saint-blue)' }}>
            <span className="kanban-column-title" style={{ color: 'var(--saint-blue)' }}>
              <Clock size={18} />
              Planificados / Futuros
            </span>
            <span className="kanban-column-count">{upcoming.length}</span>
          </div>
          <div className="kanban-column-content">
            {upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No tienes seguimientos planificados a futuro.
              </div>
            ) : (
              upcoming.map(item => (
                <div key={item.id} className="kanban-card">
                  <div className="kanban-card-header">
                    <span className="kanban-card-name">{item.contacts?.name || 'Cliente sin nombre'}</span>
                    <span className="kanban-card-date" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={12} />
                      {formatScheduledTime(item.scheduled_date)}
                    </span>
                  </div>
                  <p className="kanban-card-notes">{item.notes || 'Hacer llamada de seguimiento.'}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Tel: {item.contacts?.phone}
                  </div>
                  <div className="kanban-card-actions">
                    <button 
                      onClick={() => handleCancel(item.id)} 
                      className="btn-card-action"
                    >
                      <Trash size={12} />
                    </button>
                    <button 
                      onClick={() => handleComplete(item.id)} 
                      className="btn-card-action complete"
                    >
                      <Check size={12} />
                      Completar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna: COMPLETADOS (HISTORIAL) */}
        <div className="kanban-column">
          <div className="kanban-column-header" style={{ borderTop: '3px solid #10b981' }}>
            <span className="kanban-column-title" style={{ color: '#10b981' }}>
              <CheckCircle size={18} />
              Completados / Historial
            </span>
            <span className="kanban-column-count">{completed.length}</span>
          </div>
          <div className="kanban-column-content">
            {completed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No tienes seguimientos completados todavía.
              </div>
            ) : (
              completed.map(item => (
                <div key={item.id} className="kanban-card completed" style={{ borderLeft: '3px solid #10b981', opacity: 0.9 }}>
                  <div className="kanban-card-header">
                    <span className="kanban-card-name" style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                      {item.contacts?.name || 'Cliente sin nombre'}
                    </span>
                    <span className="kanban-card-date" style={{ color: '#10b981' }}>
                      <Check size={12} />
                      {item.completed_date ? formatScheduledTime(item.completed_date) : 'Completado'}
                    </span>
                  </div>
                  <p className="kanban-card-notes" style={{ color: 'var(--text-muted)' }}>{item.notes || 'Llamada de seguimiento.'}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Tel: {item.contacts?.phone}
                  </div>
                  <div className="kanban-card-actions" style={{ justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleCancel(item.id)} 
                      className="btn-card-action"
                      title="Eliminar permanentemente"
                      style={{ fontSize: '11px', gap: '4px' }}
                    >
                      <Trash size={12} />
                      Archivar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
