import React, { useState, useEffect } from 'react';
import { 
  Database, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Code,
  ExternalLink
} from 'lucide-react';
import { updateSupabaseCredentials, isSupabaseConfigured } from '../supabaseClient';

export default function Settings() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [status, setStatus] = useState({ configured: false, message: '' });

  useEffect(() => {
    // Cargar credenciales guardadas en localStorage
    const savedUrl = localStorage.getItem('saint_crm_supabase_url') || '';
    const savedKey = localStorage.getItem('saint_crm_supabase_anon_key') || '';
    
    setSupabaseUrl(savedUrl);
    setSupabaseKey(savedKey);

    updateStatus();
  }, []);

  const updateStatus = () => {
    const isConfig = isSupabaseConfigured();
    setStatus({
      configured: isConfig,
      message: isConfig 
        ? 'Base de datos conectada correctamente y escuchando en tiempo real.' 
        : 'Desconectado de Supabase. Corriendo en Modo Demo local.'
    });
  };

  const handleConnect = (e) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      alert('Por favor completa ambos campos.');
      return;
    }

    const success = updateSupabaseCredentials(supabaseUrl.trim(), supabaseKey.trim());
    if (success) {
      alert('¡Credenciales guardadas con éxito! Recargando conexión...');
      updateStatus();
      // Recargar la ventana para re-inicializar el cliente Supabase globalmente
      window.location.reload();
    } else {
      alert('Error al guardar credenciales. Revisa los datos.');
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('¿Seguro que deseas desconectar Supabase? El CRM volverá al modo demostración.')) {
      updateSupabaseCredentials('', '');
      setSupabaseUrl('');
      setSupabaseKey('');
      setStatus({
        configured: false,
        message: 'Desconectado. Volviendo a Modo Demo.'
      });
      window.location.reload();
    }
  };

  const mockPayloadContact = `{
  "phone": "584123456789",
  "name": "Juan Pérez",
  "last_message": "Hola, precio del Saint Contabilidad",
  "last_message_time": "2026-07-15T01:00:00Z",
  "unread_count": 1
}`;

  const mockPayloadMessage = `{
  "contact_id": "ID_DEL_CONTACTO_GENERADO_EN_SUPABASE",
  "sender": "client",
  "content": "Hola, precio del Saint Contabilidad",
  "message_type": "text"
}`;

  const mockPayloadUpdateLabel = `{
  "label": "Interesado",
  "notes": "Calificado por n8n: Interesado en Saint Contabilidad y Enterprise"
}`;

  return (
    <div className="content-body">
      <div className="settings-grid">
        {/* Columna 1: Configuración de Base de Datos */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={24} style={{ color: 'var(--saint-blue)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Conexión con Supabase</h3>
          </div>

          {status.configured ? (
            <div className="alert-setup success">
              <CheckCircle size={18} />
              <span>{status.message}</span>
            </div>
          ) : (
            <div className="alert-setup warning">
              <AlertTriangle size={18} />
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Supabase URL</label>
              <input 
                type="url" 
                className="form-input" 
                placeholder="https://xxxxxx.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Anon Key (API Key pública)</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn-save" style={{ flex: 1 }}>
                Guardar y Conectar
              </button>
              {status.configured && (
                <button 
                  type="button" 
                  onClick={handleDisconnect} 
                  className="btn-save" 
                  style={{ backgroundColor: '#ef4444', width: 'auto', padding: '0 16px' }}
                >
                  Desconectar
                </button>
              )}
            </div>
          </form>

          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <h4 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} /> ¿Dónde encuentro estos datos?
            </h4>
            <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Inicia sesión en tu panel de <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--saint-blue)', textDecoration: 'none' }}>Supabase <ExternalLink size={10} style={{ display: 'inline' }} /></a>.</li>
              <li>Ve a la configuración de tu proyecto en <strong>Project Settings &gt; API</strong>.</li>
              <li>Copia la <strong>Project URL</strong> y la <strong>anon public API Key</strong> y pégalas arriba.</li>
              <li>Asegúrate de ejecutar primero el script SQL de <code>schema.sql</code> en el <strong>SQL Editor</strong> de tu proyecto.</li>
            </ol>
          </div>
        </div>

        {/* Columna 2: Guía de Integración de n8n */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Code size={24} style={{ color: 'var(--saint-orange)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Guía de Integración con n8n</h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Para que tu automatización de WhatsApp en n8n registre las conversaciones en este CRM, debes usar el nodo <strong>HTTP Request</strong> de n8n apuntando a la API de Supabase.
          </p>

          <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>1. Upsert del Contacto (Al recibir/enviar mensaje)</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <strong>Método:</strong> POST <br />
                <strong>URL:</strong> <code>https://[PROJECT_ID].supabase.co/rest/v1/contacts</code> <br />
                <strong>Headers:</strong> <br />
                - <code>apikey</code>: <em>Tu Anon Key</em> <br />
                - <code>Content-Type</code>: <code>application/json</code> <br />
                - <code>Prefer</code>: <code>resolution=merge-duplicates</code> (para hacer upsert)
              </p>
              <div className="code-block">{mockPayloadContact}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>2. Insertar Mensaje en Historial</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <strong>Método:</strong> POST <br />
                <strong>URL:</strong> <code>https://[PROJECT_ID].supabase.co/rest/v1/messages</code>
              </p>
              <div className="code-block">{mockPayloadMessage}</div>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>3. Actualizar Calificación/Etiqueta (IA de n8n)</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <strong>Método:</strong> PATCH <br />
                <strong>URL:</strong> <code>https://[PROJECT_ID].supabase.co/rest/v1/contacts?phone=eq.584123456789</code>
              </p>
              <div className="code-block">{mockPayloadUpdateLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
