const API_BASE = '/api/v1';

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('eldercare_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...getAuthHeaders(isFormData),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || (typeof data === 'string' ? data : 'API Request Failed');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  getMe: () => request('/auth/me'),

  // Elderly
  getDashboardSummary: (elderlyId) => {
    const q = elderlyId ? `?elderly_id=${elderlyId}` : '';
    return request(`/elderly/dashboard-summary${q}`);
  },
  getProfile: (elderlyId) => {
    const q = elderlyId ? `?elderly_id=${elderlyId}` : '';
    return request(`/elderly/profile${q}`);
  },
  updateProfile: (profileData, elderlyId) => {
    const q = elderlyId ? `?elderly_id=${elderlyId}` : '';
    return request(`/elderly/profile${q}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Medications
  getMedications: (elderlyId, isActive) => {
    let params = [];
    if (elderlyId) params.push(`elderly_id=${elderlyId}`);
    if (isActive !== undefined) params.push(`is_active=${isActive}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return request(`/medications${q}`);
  },
  createMedication: (medData) =>
    request('/medications', {
      method: 'POST',
      body: JSON.stringify(medData)
    }),
  updateMedication: (id, medData, elderlyId) => {
    const q = elderlyId ? `?elderly_id=${elderlyId}` : '';
    return request(`/medications/${id}${q}`, {
      method: 'PUT',
      body: JSON.stringify(medData)
    });
  },
  deleteMedication: (id, elderlyId) => {
    const q = elderlyId ? `?elderly_id=${elderlyId}` : '';
    return request(`/medications/${id}${q}`, {
      method: 'DELETE'
    });
  },
  getTodaySchedule: (elderlyId) => {
    const q = elderlyId ? `?elderly_id=${elderlyId}` : '';
    return request(`/medications/today/schedule${q}`);
  },
  logMedicationAction: (logData) =>
    request('/medications/log', {
      method: 'POST',
      body: JSON.stringify(logData)
    }),
  getMedicationHistory: (elderlyId, days = 7) => {
    let params = [`days=${days}`];
    if (elderlyId) params.push(`elderly_id=${elderlyId}`);
    return request(`/medications/history/logs?${params.join('&')}`);
  },

  // Prescriptions
  uploadPrescription: (formData) =>
    request('/prescriptions/upload', {
      method: 'POST',
      body: formData
    }),
  reviewPrescription: (id, reviewData) =>
    request(`/prescriptions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    }),
  getPrescriptions: (elderlyId) => {
    const q = elderlyId ? `?elderly_id=${elderlyId}` : '';
    return request(`/prescriptions${q}`);
  },

  // AI Assistant
  chatAssistant: (chatData) =>
    request('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify(chatData)
    }),
  getChatHistory: (elderlyId, sessionId) => {
    let params = [];
    if (elderlyId) params.push(`elderly_id=${elderlyId}`);
    if (sessionId) params.push(`session_id=${sessionId}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return request(`/assistant/history${q}`);
  },
  clearChatHistory: (elderlyId, sessionId) => {
    let params = [];
    if (elderlyId) params.push(`elderly_id=${elderlyId}`);
    if (sessionId) params.push(`session_id=${sessionId}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return request(`/assistant/history${q}`, { method: 'DELETE' });
  },

  // Caregiver
  getCaregiverWards: () => request('/caregiver/wards'),
  getWardAdherence: (elderlyId) => request(`/caregiver/wards/${elderlyId}/adherence`),
  linkWard: (linkData) =>
    request('/caregiver/link', {
      method: 'POST',
      body: JSON.stringify(linkData)
    }),

  // Health
  getHealthRecords: (elderlyId, recordType) => {
    let params = [];
    if (elderlyId) params.push(`elderly_id=${elderlyId}`);
    if (recordType) params.push(`record_type=${recordType}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return request(`/health${q}`);
  },
  createHealthRecord: (recordData) =>
    request('/health', {
      method: 'POST',
      body: JSON.stringify(recordData)
    }),
  getHealthSummary: (elderlyId) => {
    const q = elderlyId ? `?elderly_id=${elderlyId}` : '';
    return request(`/health/summary${q}`);
  },

  // Emergency & SOS
  getEmergencyContacts: (elderlyId) => {
    const q = elderlyId ? `?elderly_id=${elderlyId}` : '';
    return request(`/emergency/contacts${q}`);
  },
  createEmergencyContact: (contactData) =>
    request('/emergency/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData)
    }),
  deleteEmergencyContact: (id, elderlyId) => {
    const q = elderlyId ? `?elderly_id=${elderlyId}` : '';
    return request(`/emergency/contacts/${id}${q}`, { method: 'DELETE' });
  },
  triggerSOS: (sosData) =>
    request('/emergency/sos', {
      method: 'POST',
      body: JSON.stringify(sosData)
    }),
  resolveEmergency: (eventId) =>
    request(`/emergency/resolve/${eventId}`, { method: 'POST' }),
  getEmergencyEvents: (elderlyId) => {
    const q = elderlyId ? `?elderly_id=${elderlyId}` : '';
    return request(`/emergency/events${q}`);
  },
  getNotifications: () => request('/emergency/notifications'),

  // Settings
  updatePreferences: (prefData) =>
    request('/settings/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefData)
    })
};
