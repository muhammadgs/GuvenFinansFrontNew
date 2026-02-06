// alembic/task/cacheService.js
class ApiCache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 300000; // 5 dəqiqə
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    set(key, data, ttl = this.defaultTTL) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl
        });
    }

    clear() {
        this.cache.clear();
    }

    delete(key) {
        this.cache.delete(key);
    }

    clearByPattern(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }
}

// Global cache instansı
const apiCache = new ApiCache();

// Cache ilə API sorğusu
async function cachedApiRequest(endpoint, method = 'GET', data = null, requiresAuth = true, useCache = false) {
    if (method === 'GET' && useCache) {
        const cacheKey = `${endpoint}-${JSON.stringify(data || {})}`;
        const cached = apiCache.get(cacheKey);

        if (cached) {
            console.log('Cache-dən götürüldü:', cacheKey);
            return cached;
        }
    }

    const result = await makeApiRequest(endpoint, method, data, requiresAuth);

    if (method === 'GET' && useCache && result && !result.error) {
        const cacheKey = `${endpoint}-${JSON.stringify(data || {})}`;
        apiCache.set(cacheKey, result.data);
    }

    return result;
}