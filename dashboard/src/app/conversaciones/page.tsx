'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getConversations,
  getMessages,
  sendMessage,
  type ChatMessage as ApiMessage,
  type ConversationItem,
} from '@/lib/api';

export default function ConversacionesPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setError(null);
      const data = await getConversations();
      setConversations(data.conversations);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar conversaciones');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    getMessages(selected, 100, 0)
      .then((data) => setMessages(data.messages))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar mensajes'))
      .finally(() => setLoadingMessages(false));
  }, [selected]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    setInput('');
    try {
      await sendMessage(selected, text);
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          waUserId: selected,
          direction: 'out',
          text,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <div className="p-4 border-b bg-white">
        <h1 className="text-2xl font-semibold text-gray-900">Conversaciones</h1>
        <p className="text-gray-600 text-sm mt-1">Chats de WhatsApp con clientes</p>
      </div>

      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <div className="w-72 shrink-0 border-r bg-white flex flex-col">
          {loadingList ? (
            <p className="p-4 text-gray-500 text-sm">Cargando...</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-gray-500 text-sm">No hay conversaciones</p>
          ) : (
            <ul className="overflow-auto flex-1">
              {conversations.map((c) => (
                <li key={c.waUserId}>
                  <button
                    type="button"
                    onClick={() => setSelected(c.waUserId)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selected === c.waUserId ? 'bg-teal-50 border-l-4 border-l-teal-600' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">{c.waUserId}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {c.lastMessagePreview || 'Sin mensajes'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(c.lastMessageAt).toLocaleString('es-AR')}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Seleccioná una conversación
            </div>
          ) : (
            <>
              <div className="px-4 py-2 bg-white border-b flex items-center gap-2">
                <span className="font-medium text-gray-900">{selected}</span>
                <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-800 rounded">Activa</span>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-3">
                {loadingMessages ? (
                  <p className="text-gray-500 text-sm">Cargando mensajes...</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          m.direction === 'out'
                            ? 'bg-teal-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            m.direction === 'out' ? 'text-teal-100' : 'text-gray-400'
                          }`}
                        >
                          {new Date(m.createdAt).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-white border-t flex gap-2">
                <input
                  type="text"
                  placeholder="Escribí un mensaje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
