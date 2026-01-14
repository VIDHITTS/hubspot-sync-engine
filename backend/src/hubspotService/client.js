const HUBSPOT_BASE_URL = "https://api.hubapi.com";

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
  "Content-Type": "application/json",
});

const request = async (endpoint, options = {}) => {
  const url = `${HUBSPOT_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HubSpot API error: ${response.status}`);
  }

  return response.json();
};

const get = (endpoint) => request(endpoint, { method: "GET" });

const post = (endpoint, data) =>
  request(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });

const patch = (endpoint, data) =>
  request(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

const del = (endpoint) => request(endpoint, { method: "DELETE" });

module.exports = { get, post, patch, del };
