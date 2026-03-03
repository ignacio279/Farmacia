const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const API_KEY = process.env.NEXT_PUBLIC_SEND_API_KEY ?? '';

function headers(): HeadersInit {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) h['x-api-key'] = API_KEY;
  return h;
}

export async function getContacts(): Promise<{
  count: number;
  contacts: Contact[];
}> {
  const res = await fetch(`${API_URL}/broadcast/contacts`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface Contact {
  id: string;
  waUserId: string | null;
  name: string | null;
  email: string | null;
  birthday: string | null;
  createdAt: string;
}

export async function createContact(data: {
  waUserId?: string;
  name?: string;
  email?: string;
  birthday?: string;
}): Promise<{ ok: boolean; contact?: Contact; error?: string }> {
  const res = await fetch(`${API_URL}/broadcast/contacts`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateContact(
  id: string,
  data: { waUserId?: string; name?: string; email?: string; birthday?: string }
): Promise<{ ok: boolean; contact?: Contact; error?: string }> {
  const res = await fetch(`${API_URL}/broadcast/contacts/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export interface ConversationItem {
  waUserId: string;
  lastMessageAt: string;
  lastMessagePreview: string;
}

export async function getConversations(): Promise<{
  count: number;
  conversations: ConversationItem[];
}> {
  const res = await fetch(`${API_URL}/conversations`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface ChatMessage {
  id: string;
  waUserId: string;
  direction: 'in' | 'out';
  text: string;
  createdAt: string;
}

export async function getMessages(
  waUserId: string,
  limit?: number,
  offset?: number
): Promise<{ messages: ChatMessage[]; total: number }> {
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', String(limit));
  if (offset != null) params.set('offset', String(offset));
  const q = params.toString();
  const res = await fetch(
    `${API_URL}/conversations/${encodeURIComponent(waUserId)}/messages${q ? `?${q}` : ''}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sendMessage(to: string, text: string): Promise<void> {
  const res = await fetch(`${API_URL}/send`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ to, text }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export interface Campaign {
  id: string;
  type: string;
  title: string | null;
  message: string;
  createdAt: string;
  sentAt: string | null;
  sentCount: number;
  failedCount: number;
}

export async function getCampaigns(limit?: number): Promise<{
  count: number;
  campaigns: Campaign[];
}> {
  const q = limit != null ? `?limit=${limit}` : '';
  const res = await fetch(`${API_URL}/broadcast/campaigns${q}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCampaign(body: {
  type: string;
  title?: string;
  message: string;
}): Promise<{ ok: boolean; campaignId?: string; sent?: number; failed?: number; error?: string }> {
  const res = await fetch(`${API_URL}/broadcast/campaigns`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return res.json();
}
