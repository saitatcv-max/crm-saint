import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  User, 
  CalendarPlus, 
  MessageSquareOff,
  BellRing,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

// Datos Mock en caso de que Supabase no esté conectado
const MOCK_CONTACTS = [
  { id: '1', phone: '+584125550123', name: 'Carlos Mendoza', label: 'Interesado', notes: 'Interesado en licenciamiento saint Enterprise Administrativo para su supermercado.', last_message: '¿Cuáles son los requisitos de hardware para Annual Cloud?', last_message_time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), unread_count: 2 },
  { id: '2', phone: '+584241112233', name: 'Dra. María Elena', label: 'Cliente', notes: 'Compró Annual Contabilidad el mes pasado. Canal integrador asignado: Zulia Tech.', last_message: 'Muchas gracias por la activación de la licencia, todo funciona excelente.', last_message_time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), unread_count: 0 },
  { id: '3', phone: '+584149998877', name: 'Distribuidora Oriental', label: 'Soporte', notes: 'Presenta problemas con la impresora fiscal Homologada por SENIAT.', last_message: 'Buenas tardes, el sistema me da error de comunicación con el puerto COM1.', last_message_time: new Date(Date.now() - 1000 * 60 * 120).toISOString(), unread_count: 0 },
  { id: '4', phone: '+584167776655', name: 'Juan Pérez (Ferretería)', label: 'Nuevo', notes: 'Preguntó por precios de Saint Professional Más.', last_message: 'Hola, me gustaría recibir una cotización del sistema para 3 estaciones.', last_message_time: new Date(Date.now() - 1000 * 60 * 360).toISOString(), unread_count: 1 },
];

const MOCK_MESSAGES = {
  '1': [
    { id: 'm1', sender: 'client', content: 'Hola, buenas tardes. Escribo de Supermercado El Prado.', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 'm2', sender: 'bot', content: '¡Hola! Bienvenido al canal automatizado de saint de Venezuela. ¿En qué sistema administrativo estás interesado?', timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString() },
    { id: 'm3', sender: 'client', content: 'Me interesa la versión Enterprise para facturación y control de inventarios.', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
    { id: 'm4', sender: 'agent', content: 'Hola Carlos, gusto en saludarte. Contamos con Saint Enterprise Administrativo, el cual está homologado por el SENIAT. ¿Tienes impresora fiscal actualmente?', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
    { id: 'm5', sender: 'client', content: 'Sí, tengo una HKA112. ¿Cuáles son los requisitos de hardware para Annual Cloud?', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() }
  ],
  '2': [
    { id: 'm6', sender: 'client', content: 'Hola, ¿ya registraron mi pago de la licencia?', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: 'm7', sender: 'agent', content: 'Hola Dra. María, sí. Hemos verificado la licencia de Annual Contabilidad y ya se encuentra activa en su portal.', timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
    { id: 'm8', sender: 'client', content: 'Muchas gracias por la activación de la licencia, todo funciona excelente.', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() }
  ],
  '3': [
    { id: 'm9', sender: 'client', content: 'Hola, tengo una emergencia.', timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString() },
    { id: 'm10', sender: 'agent', content: 'Cuéntanos qué sucede para ayudarte de inmediato.', timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString() },
    { id: 'm11', sender: 'client', content: 'Buenas tardes, el sistema me da error de comunicación con el puerto COM1.', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
  ],
  '4': [
    { id: 'm12', sender: 'client', content: 'Hola, me gustaría recibir una cotización del sistema para 3 estaciones.', timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString() }
  ]
};

const MOCK_FOLLOWUPS = {
  '1': [
    { id: 'f1', scheduled_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), notes: 'Enviar cotización formal de saint Enterprise.' }
  ],
  '2': [],
  '3': [
    { id: 'f2', scheduled_date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), notes: 'Llamar para verificar si resolvió el error de impresora fiscal.' }
  ],
  '4': []
};

export default function ChatRoom() {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Campos de formulario para el perfil del contacto
  const [editName, setEditName] = useState('');
  const [editLabel, setEditLabel] = useState('Nuevo');
  const [editNotes, setEditNotes] = useState('');
  
  // Programación de Seguimientos
  const [followupDate, setFollowupDate] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');

  // Búsqueda y Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [configured, setConfigured] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const isConfig = isSupabaseConfigured();
    setConfigured(isConfig);

    if (isConfig) {
      fetchContacts();
      
      // Suscribirse a cambios en la tabla de contactos en tiempo real
      const contactSub = supabase
        .channel('chat-contacts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
          fetchContacts();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(contactSub);
      };
    } else {
      // Usar datos mock
      setContacts(MOCK_CONTACTS);
      if (MOCK_CONTACTS.length > 0) {
        selectContact(MOCK_CONTACTS[0]);
      }
    }
  }, []);

  // Suscribirse a mensajes del contacto activo en tiempo real
  useEffect(() => {
    if (!activeContact) return;

    if (configured) {
      fetchMessages(activeContact.id);
      fetchFollowups(activeContact.id);

      const msgSub = supabase
        .channel(`chat-messages-${activeContact.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `contact_id=eq.${activeContact.id}` 
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
          // Si el mensaje es recibido, limpiar el contador de no leídos
          markAsRead(activeContact.id);
        })
        .subscribe();

      const followSub = supabase
        .channel(`chat-followups-${activeContact.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'follow_ups',
          filter: `contact_id=eq.${activeContact.id}`
        }, () => {
          fetchFollowups(activeContact.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(msgSub);
        supabase.removeChannel(followSub);
      };
    } else {
      // Cargar mock data
      setMessages(MOCK_MESSAGES[activeContact.id] || []);
      setFollowups(MOCK_FOLLOWUPS[activeContact.id] || []);
    }
  }, [activeContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('last_message_time', { ascending: false });
      if (!error && data) {
        setContacts(data);
        // Si no hay contacto activo, seleccionar el primero
        if (!activeContact && data.length > 0) {
          selectContact(data[0]);
        } else if (activeContact) {
          // Mantener actualizado el contacto activo
          const updated = data.find(c => c.id === activeContact.id);
          if (updated) setActiveContact(updated);
        }
      }
    } catch (e) {
      console.error('Error al cargar contactos:', e);
    }
  };

  const fetchMessages = async (contactId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('timestamp', { ascending: true });
      if (!error && data) {
        setMessages(data);
      }
    } catch (e) {
      console.error('Error al cargar mensajes:', e);
    }
  };

  const fetchFollowups = async (contactId) => {
    try {
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('contact_id', contactId)
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true });
      if (!error && data) {
        setFollowups(data);
      }
    } catch (e) {
      console.error('Error al cargar seguimientos:', e);
    }
  };

  const selectContact = (contact) => {
    setActiveContact(contact);
    setEditName(contact.name || '');
    setEditLabel(contact.label || 'Nuevo');
    setEditNotes(contact.notes || '');
    setFollowupDate('');
    setFollowupNotes('');
    
    // Marcar como leído
    markAsRead(contact.id);
  };

  const markAsRead = async (contactId) => {
    if (configured) {
      await supabase
        .from('contacts')
        .update({ unread_count: 0 })
        .eq('id', contactId);
    } else {
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, unread_count: 0 } : c));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact) return;

    const messageContent = inputText.trim();
    setInputText('');

    if (configured) {
      try {
        const n8nUrl = import.meta.env.VITE_N8N_OUTGOING_WEBHOOK_URL || 'https://sait-atc-n8n.wdwx8z.easypanel.host/webhook/send-agent-message';
        
        const response = await fetch(n8nUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: activeContact.phone,
            message: messageContent
          })
        });

        if (!response.ok) {
          throw new Error('Error al enviar el mensaje mediante el servidor de n8n');
        }
      } catch (err) {
        console.error('Error al enviar mensaje:', err);
        alert('Error: No se pudo enviar el mensaje a WhatsApp. Verifica tu conexión con n8n.');
      }
    } else {
      // Simulación local con mock data
      const newMsg = {
        id: `m-local-${Date.now()}`,
        sender: 'agent',
        content: messageContent,
        timestamp: new Date().toISOString()
      };
      
      const updatedMessages = [...messages, newMsg];
      setMessages(updatedMessages);
      MOCK_MESSAGES[activeContact.id] = updatedMessages;

      // Actualizar en la lista lateral
      setContacts(prev => prev.map(c => {
        if (c.id === activeContact.id) {
          return {
            ...c,
            last_message: messageContent,
            last_message_time: new Date().toISOString()
          };
        }
        return c;
      }));

      // Simular respuesta automática de n8n/bot tras 1.5s
      setTimeout(() => {
        const botResponse = {
          id: `m-bot-${Date.now()}`,
          sender: 'bot',
          content: `[Respuesta Automática]: Recibido. Tu mensaje de agente: "${messageContent}" se enviaría al WhatsApp en producción. El bot de n8n calificaría el interés según esta respuesta.`,
          timestamp: new Date().toISOString()
        };
        
        const finalMessages = [...updatedMessages, botResponse];
        if (activeContact.id === activeContact.id) {
          setMessages(finalMessages);
          MOCK_MESSAGES[activeContact.id] = finalMessages;
          
          setContacts(prev => prev.map(c => {
            if (c.id === activeContact.id) {
              return {
                ...c,
                last_message: botResponse.content,
                last_message_time: new Date().toISOString()
              };
            }
            return c;
          }));
        }
      }, 1500);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!activeContact) return;

    if (configured) {
      try {
        const { error } = await supabase
          .from('contacts')
          .update({
            name: editName,
            label: editLabel,
            notes: editNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeContact.id);

        if (!error) {
          alert('Información del contacto actualizada correctamente.');
          fetchContacts();
        } else {
          alert('Error al actualizar: ' + error.message);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Mock update
      setContacts(prev => prev.map(c => {
        if (c.id === activeContact.id) {
          const updated = { ...c, name: editName, label: editLabel, notes: editNotes };
          setActiveContact(updated);
          return updated;
        }
        return c;
      }));
      alert('Información del contacto actualizada (Simulación).');
    }
  };

  const handleScheduleFollowup = async (e) => {
    e.preventDefault();
    if (!followupDate || !activeContact) return;

    if (configured) {
      try {
        const { error } = await supabase
          .from('follow_ups')
          .insert({
            contact_id: activeContact.id,
            scheduled_date: new Date(followupDate).toISOString(),
            notes: followupNotes,
            status: 'pending'
          });

        if (!error) {
          alert('Seguimiento programado con éxito.');
          setFollowupDate('');
          setFollowupNotes('');
          fetchFollowups(activeContact.id);
        } else {
          alert('Error al guardar seguimiento: ' + error.message);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Mock follow-up insert
      const newFollowup = {
        id: `f-local-${Date.now()}`,
        scheduled_date: new Date(followupDate).toISOString(),
        notes: followupNotes,
        status: 'pending'
      };
      
      const updatedList = [...followups, newFollowup];
      setFollowups(updatedList);
      MOCK_FOLLOWUPS[activeContact.id] = updatedList;

      alert('Seguimiento programado con éxito (Simulación).');
      setFollowupDate('');
      setFollowupNotes('');
    }
  };

  // Filtrado y Búsqueda de contactos
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      contact.phone.includes(searchTerm);
    
    if (activeFilter === 'Todos') return matchesSearch;
    return matchesSearch && contact.label === activeFilter;
  });

  // Helper para formatear fechas relativas
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} hr`;
    
    return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="chat-container">
      {/* 1. Panel Lateral de Contactos */}
      <div className="chat-sidebar">
        <div className="chat-search-bar">
          <div className="search-input-wrapper">
            <Search className="search-icon-svg" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-filters">
          {['Todos', 'Nuevo', 'Interesado', 'Cliente', 'Soporte', 'Sin Interés'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="chat-list">
          {filteredContacts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No se encontraron chats
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isActive = activeContact && activeContact.id === contact.id;
              return (
                <div 
                  key={contact.id} 
                  className={`chat-item ${isActive ? 'active' : ''}`}
                  onClick={() => selectContact(contact)}
                >
                  <div className="chat-item-avatar">
                    {getInitials(contact.name)}
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-header">
                      <span className="chat-item-name">{contact.name}</span>
                      <span className="chat-item-time">{formatTime(contact.last_message_time)}</span>
                    </div>
                    <div className="chat-item-body">
                      <span className="chat-item-msg">{contact.last_message || 'Sin mensajes'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {contact.unread_count > 0 && (
                          <span className="unread-badge">{contact.unread_count}</span>
                        )}
                        <span className={`badge badge-${contact.label ? contact.label.toLowerCase().replace(' ', '-') : 'nuevo'}`}>
                          {contact.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Chat Principal */}
      <div className="chat-main">
        {activeContact ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--saint-blue)', color: 'white', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 'bold' }}>
                  {getInitials(activeContact.name)}
                </div>
                <div>
                  <div className="chat-header-name">{activeContact.name}</div>
                  <div className="chat-header-phone">{activeContact.phone}</div>
                </div>
              </div>
              <div>
                <span className={`badge badge-${activeContact.label ? activeContact.label.toLowerCase().replace(' ', '-') : 'nuevo'}`}>
                  {activeContact.label}
                </span>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  Inicia la conversación enviando un mensaje
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`message-bubble ${msg.sender}`}>
                    <div>{msg.content}</div>
                    <div className="message-meta">
                      <Clock size={10} />
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-area">
              <input 
                type="text" 
                className="chat-input" 
                placeholder="Escribe un mensaje de respuesta para WhatsApp..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" className="send-btn" title="Enviar mensaje">
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <MessageSquareOff className="empty-state-icon" size={48} />
            <h3 className="empty-state-title">Ningún chat seleccionado</h3>
            <p className="empty-state-desc">Selecciona un chat en la lista lateral para ver los mensajes e interactuar en tiempo real.</p>
          </div>
        )}
      </div>

      {/* 3. Panel de Detalles y Acciones */}
      {activeContact && (
        <div className="chat-details">
          <div className="details-header">
            <div className="details-avatar">
              {getInitials(activeContact.name)}
            </div>
            <div className="details-name">{activeContact.name}</div>
            <div className="details-phone">{activeContact.phone}</div>
          </div>

          {/* Calificación y Datos del Prospecto */}
          <div className="details-section">
            <div className="details-section-title">
              <FileText size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Calificación de Lead
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Nombre del Cliente</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Etiqueta de Interés</label>
                <select 
                  className="form-input" 
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                >
                  <option value="Nuevo">Nuevo</option>
                  <option value="Interesado">Interesado (Lead)</option>
                  <option value="Cliente">Cliente Saint</option>
                  <option value="Soporte">Soporte Técnico</option>
                  <option value="Sin Interés">Sin Interés</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notas Comerciales</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Detalles del interés, licenciamiento, impresora fiscal..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-save">
                Guardar Datos
              </button>
            </form>
          </div>

          {/* Programar Seguimientos */}
          <div className="details-section" style={{ borderBottom: 'none' }}>
            <div className="details-section-title">
              <CalendarPlus size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Programar Seguimiento
            </div>
            <form onSubmit={handleScheduleFollowup} style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notas del recordatorio</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej: Enviar cotización, llamar..."
                  value={followupNotes}
                  onChange={(e) => setFollowupNotes(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-save" style={{ backgroundColor: 'var(--saint-orange)' }}>
                Programar Recordatorio
              </button>
            </form>

            {/* Listado de Seguimientos Pendientes del Contacto */}
            {followups.length > 0 && (
              <div>
                <label className="form-label" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BellRing size={12} /> Recordatorios Programados:
                </label>
                {followups.map(f => (
                  <div key={f.id} className="followup-item-simple">
                    <Clock size={14} className="followup-item-simple-icon" />
                    <div className="followup-item-simple-details">
                      <div className="followup-item-simple-date">
                        {new Date(f.scheduled_date).toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>{f.notes || 'Hacer seguimiento'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
