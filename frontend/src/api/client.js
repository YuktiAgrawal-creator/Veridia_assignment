/**
 * Veridia Match - Frontend API Client
 */

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/manufacturers/stats`);
  if (!res.ok) throw new Error('Failed to fetch manufacturer statistics');
  return res.json();
}

export async function fetchFilterOptions() {
  const res = await fetch(`${API_BASE}/manufacturers/filters`);
  if (!res.ok) throw new Error('Failed to fetch filter options');
  return res.json();
}

export async function submitMatchRequest(requirements) {
  const res = await fetch(`${API_BASE}/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requirements),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData.message || (errData.details ? JSON.stringify(errData.details) : 'Matching request failed');
    throw new Error(message);
  }
  return res.json();
}

export async function fetchMatchById(requestId) {
  const res = await fetch(`${API_BASE}/match/${requestId}`);
  if (!res.ok) throw new Error(`Could not find match request ${requestId}`);
  return res.json();
}

export async function fetchRecentMatches() {
  const res = await fetch(`${API_BASE}/match/recent/all`);
  if (!res.ok) throw new Error('Failed to fetch recent match history');
  return res.json();
}

export async function fetchDataQuality() {
  const res = await fetch(`${API_BASE}/data-quality`);
  if (!res.ok) throw new Error('Failed to fetch data quality metrics');
  return res.json();
}

export async function parseNaturalLanguageRFQ(rfqText) {
  const res = await fetch(`${API_BASE}/ai/parse-rfq`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rfq_text: rfqText }),
  });
  if (!res.ok) throw new Error('Failed to parse natural language RFQ');
  return res.json();
}
