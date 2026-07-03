const API_BASE = `${window.location.protocol}//${window.location.hostname}:3001/api`;

const getHeaders = (hasBody = true) => {
  const headers = {};
  if (hasBody) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('pollnight_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const loginAdmin = async (password) => {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) throw new Error('Unauthorized');
  const data = await res.json();
  return data.token;
};

export const fetchSessions = async () => {
  const res = await fetch(`${API_BASE}/sessions`);
  return res.json();
};

export const fetchActiveSession = async () => {
  const res = await fetch(`${API_BASE}/sessions/active`);
  if (!res.ok) throw new Error('Failed to fetch active session');
  return res.json();
};

export const fetchSessionDetails = async (id) => {
  const res = await fetch(`${API_BASE}/sessions/${id}`);
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
};

export const fetchSessionVotes = async (id) => {
  const res = await fetch(`${API_BASE}/sessions/${id}/votes`);
  if (!res.ok) throw new Error('Failed to fetch votes');
  return res.json();
};

export const createSession = async (data) => {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteSession = async (id) => {
  const res = await fetch(`${API_BASE}/sessions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false)
  });
  return res.json();
};

export const updateSessionStatus = async (id, status) => {
  const res = await fetch(`${API_BASE}/sessions/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
};

export const updateSessionClosedView = async (id, view) => {
  const res = await fetch(`${API_BASE}/sessions/${id}/closed_view`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ view })
  });
  if (!res.ok) throw new Error('Failed to update closed view');
  return res.json();
};

export const updateItemVotingStatus = async (sessionId, itemId, voting_status, active_category_id = null) => {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/items/${itemId}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ voting_status, active_category_id })
  });
  return res.json();
};

export const revealItem = async (sessionId, itemId) => {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/items/${itemId}/reveal`, {
    method: 'POST',
    headers: getHeaders(false)
  });
  return res.json();
};

export const joinSession = async (sessionId, username, avatar) => {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, avatar })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const submitVotes = async (data) => {
  const res = await fetch(`${API_BASE}/votes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to submit votes');
  }
  return res.json();
};

export const fetchParticipantVotes = async (sessionId, participantId) => {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/participants/${participantId}/votes`);
  if (!res.ok) throw new Error('Failed to fetch votes');
  return res.json();
};

export const removeParticipant = async (sessionId, participantId) => {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/participants/${participantId}`, {
    method: 'DELETE',
    headers: getHeaders(false)
  });
  return res.json();
};
