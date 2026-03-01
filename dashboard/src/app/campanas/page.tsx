'use client';

import { useEffect, useState } from 'react';
import { getCampaigns, createCampaign, type Campaign } from '@/lib/api';

const TYPES = [
  { value: 'discount', label: 'Descuento' },
  { value: 'birthday', label: 'Cumpleaños' },
  { value: 'announcement', label: 'Anuncio' },
  { value: 'custom', label: 'Personalizada' },
] as const;

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'custom', title: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const data = await getCampaigns(50);
      setCampaigns(data.campaigns);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = form.message.trim();
    if (!message) {
      setError('El mensaje es obligatorio');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await createCampaign({
        type: form.type,
        title: form.title.trim() || undefined,
        message,
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ type: 'custom', title: '', message: '' });
        await load();
      } else {
        setError(res.error ?? 'Error al crear campaña');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear campaña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Campañas</h1>
          <p className="text-gray-600 mt-1">Campañas de marketing por WhatsApp</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-medium"
        >
          Nueva campaña
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Creada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Enviados / Fallidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No hay campañas. Creá una con el botón &quot;Nueva campaña&quot;.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {c.title || c.message.slice(0, 40) + (c.message.length > 40 ? '…' : '')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">{c.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          c.sentAt ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.sentAt ? 'Enviada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {c.sentCount} / {c.failedCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nueva campaña</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título (opcional)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: Oferta de la semana"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Usá {{name}} para personalizar con el nombre del contacto."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Podés usar <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> para
                  personalizar.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
                >
                  {submitting ? 'Enviando...' : 'Crear y enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
