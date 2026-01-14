const HUBSPOT_BASE_URL = "https://api.hubapi.com";

const rateLimiter = {
  tokens: 100,
  maxTokens: 100,
  lastRefill: Date.now(),
  refillInterval: 10000,

  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed >= this.refillInterval) {
      this.tokens = this.maxTokens;
      this.lastRefill = now;
    }
  },

  async acquire() {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    const waitTime = this.refillInterval - (Date.now() - this.lastRefill);
    console.log(`[RateLimiter] Waiting ${waitTime}ms for token refill...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    this.refill();
    this.tokens--;
    return true;
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryableRequest = async (fn, maxRetries = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await rateLimiter.acquire();
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error.status || error.statusCode;

      if (status === 429 || (status >= 500 && status < 600)) {
        const backoff = Math.pow(2, attempt - 1) * 1000;
        console.log(
          `[HubSpot] Retry ${attempt}/${maxRetries} after ${backoff}ms (status: ${status})`
        );
        await sleep(backoff);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
  "Content-Type": "application/json",
});

const request = async (endpoint, options = {}) => {
  const url = `${HUBSPOT_BASE_URL}${endpoint}`;

  return retryableRequest(async () => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const err = new Error(error.message || `HubSpot API error: ${response.status}`);
      err.status = response.status;
      throw err;
    }

    if (response.status === 204) {
      return { success: true };
    }

    return response.json();
  });
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
