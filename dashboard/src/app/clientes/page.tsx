'use client';

import { useEffect, useState } from 'react';
import { getContacts, updateContact } from '@/lib/api';

type Contact = {
  id: string;
  waUserId: string;
  name: string | null;
  email: string | null;
  birthday: string | null;
  createdAt: string;
};

export default function ClientesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: '', email: '', birthday: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setError(null);
      const data = await getContacts();
      setContacts(data.contacts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({
      name: c.name ?? '',
      email: c.email ?? '',
      birthday: c.birthday ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await updateContact(editing.id, {
        name: form.name || undefined,
        email: form.email || undefined,
        birthday: form.birthday || undefined,
      });
      if (res.ok && res.contact) {
        setContacts((prev) =>
          prev.map((x) => (x.id === editing.id ? { ...x, ...res.contact } : x))
        );
        setEditing(null);
      } else {
        setError(res.error ?? 'Error al guardar');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const filtered = contacts.filter(
    (c) =>
      (c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.waUserId.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
        <p className="text-gray-600 mt-1">Contactos que escribieron al bot</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre, WhatsApp o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
        >
          Buscar
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">WhatsApp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Cumpleaños</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Agregado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No hay contactos
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{c.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.waUserId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.birthday || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="text-teal-600 hover:text-teal-800 font-medium text-sm"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar contacto</h2>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <label className="block text-sm font-medium text-gray-700">Cumpleaños (YYYY-MM-DD)</label>
              <input
                type="text"
                placeholder="2020-01-15"
                value={form.birthday}
                onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
