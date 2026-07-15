# Flujos de n8n para el CRM Saint

Este archivo contiene los JSONs de los flujos de n8n listos para copiar e importar.

---

## 📥 Flujo 1: Recibir Mensajes (Evolution API -> Supabase)

Este flujo recibe el webhook de Evolution API, extrae el número, el nombre del cliente y el mensaje, hace un Upsert en la tabla `contacts` de Supabase y guarda el mensaje en la tabla `messages`.

### Instrucciones:
1. Copia todo el bloque JSON de abajo.
2. Abre tu panel de n8n, crea un nuevo flujo.
3. Haz clic en cualquier parte en blanco del lienzo y presiona **Ctrl + V** (o ve al menú superior derecho > Import desde JSON).
4. Configura tus nodos de Supabase con tus credenciales.

```json
{
  "name": "Evolution API to Supabase (Saint CRM)",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "evolution-webhook",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [
        0,
        0
      ],
      "id": "webhook-trigger",
      "name": "Webhook Trigger"
    },
    {
      "parameters": {
        "jsCode": "const body = items[0].json.body;\nif (body.event !== 'messages.upsert') {\n  return []; // Ignorar eventos que no sean nuevos mensajes\n}\n\nconst data = body.data;\nconst remoteJid = data.key.remoteJid;\nconst phone = remoteJid.split('@')[0];\nconst name = data.pushName || 'WhatsApp Contacto';\n\n// Extraer texto del mensaje\nlet content = '';\nif (data.message) {\n  content = data.message.conversation || \n            (data.message.extendedTextMessage && data.message.extendedTextMessage.text) || \n            '[Mensaje Multimedia/Archivo]';\n}\n\nconst sender = data.key.fromMe ? 'agent' : 'client';\n\nreturn [{\n  json: {\n    phone,\n    name,\n    content,\n    sender,\n    unread_increment: data.key.fromMe ? 0 : 1\n  }\n}];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        220,
        0
      ],
      "id": "parse-payload",
      "name": "Parse Payload"
    },
    {
      "parameters": {
        "operation": "upsert",
        "table": "contacts",
        "columns": "phone",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "phone",
              "fieldValue": "={{ $json.phone }}"
            },
            {
              "fieldId": "name",
              "fieldValue": "={{ $json.name }}"
            },
            {
              "fieldId": "last_message",
              "fieldValue": "={{ $json.content }}"
            },
            {
              "fieldId": "last_message_time",
              "fieldValue": "={{ new Date().toISOString() }}"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        440,
        0
      ],
      "id": "upsert-contact",
      "name": "Upsert Contact"
    },
    {
      "parameters": {
        "table": "messages",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "contact_id",
              "fieldValue": "={{ $node[\"Upsert Contact\"].json.id }}"
            },
            {
              "fieldId": "sender",
              "fieldValue": "={{ $node[\"Parse Payload\"].json.sender }}"
            },
            {
              "fieldId": "content",
              "fieldValue": "={{ $node[\"Parse Payload\"].json.content }}"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        660,
        0
      ],
      "id": "insert-message",
      "name": "Insert Message"
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [
        [
          {
            "node": "Parse Payload",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Parse Payload": {
      "main": [
        [
          {
            "node": "Upsert Contact",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Upsert Contact": {
      "main": [
        [
          {
            "node": "Insert Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

## 📤 Flujo 2: Enviar Mensajes (CRM/Supabase -> Evolution API)

Este flujo se activa cuando un asesor inserta un mensaje de respuesta (`sender = 'agent'`) desde la pantalla del CRM. n8n detecta el insert, consulta el número de teléfono del contacto y le ordena a Evolution API que lo envíe a WhatsApp.

### Instrucciones:
1. Copia todo el bloque JSON de abajo.
2. Abre tu panel de n8n, crea otro nuevo flujo y presiona **Ctrl + V** en el lienzo.
3. Modifica el nodo **HTTP Request** con la URL, el puerto y la API Key de tu Evolution API.

```json
{
  "name": "Supabase to Evolution API (Send Whatsapp)",
  "nodes": [
    {
      "parameters": {
        "event": "row_inserted",
        "table": "messages"
      },
      "type": "n8n-nodes-base.supabaseTrigger",
      "typeVersion": 1,
      "position": [
        0,
        0
      ],
      "id": "supabase-trigger",
      "name": "Supabase Trigger"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.sender }}",
              "value2": "agent"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [
        220,
        0
      ],
      "id": "check-sender-agent",
      "name": "Is Agent?"
    },
    {
      "parameters": {
        "operation": "get",
        "table": "contacts",
        "id": "={{ $json.contact_id }}"
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        440,
        -100
      ],
      "id": "get-contact",
      "name": "Get Contact"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://187.127.251.5:PUERTO_EVOLUTION/message/sendText/saint",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "TU_API_KEY_DE_EVOLUTION"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"number\": \"{{ $node[\"Get Contact\"].json.phone }}\",\n  \"options\": {\n    \"delay\": 1200,\n    \"presence\": \"composing\"\n  },\n  \"textMessage\": {\n    \"text\": \"{{ $node[\"Supabase Trigger\"].json.content }}\"\n  }\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [
        660,
        -100
      ],
      "id": "send-whatsapp-api",
      "name": "Evolution API Send"
    }
  ],
  "connections": {
    "Supabase Trigger": {
      "main": [
        [
          {
            "node": "Is Agent?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Is Agent?": {
      "main": [
        [
          {
            "node": "Get Contact",
            "type": "main",
            "index": 0
          }
        ],
        []
      ]
    },
    "Get Contact": {
      "main": [
        [
          {
            "node": "Evolution API Send",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```
