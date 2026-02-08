// apiService.js - TAM VERSİYA
const API_BASE = (() => {
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return isLocalHost
        ? `${window.location.protocol}//${window.location.host}/proxy.php`
        : "https://guvenfinans.az/proxy.php";
})();

async function makeApiRequest(endpoint, method = 'GET', data = null, requiresAuth = true) {
    console.group(`📡 API: ${method} ${endpoint}`);

    // Token yoxlaması
    let token = null;
    if (requiresAuth) {
        token = getAuthToken();

        if (!token) {
            console.error('❌ Auth token not found!');

            if (typeof AuthService !== 'undefined') {
                setTimeout(() => AuthService.redirectToLogin(), 1000);
            }

            console.groupEnd();
            return { error: 'No auth token', status: 401 };
        }

        console.log('🔑 Token var, uzunluq:', token.length);
    }

    // Headers
    const headers = {
        'Accept': 'application/json'
    };

    // ✅ ƏSAS DÜZƏLT: FormData göndərilirsə, Content-Type əlavə etmə
    const isFormData = data instanceof FormData;

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔐 Authorization header əlavə edildi');
    }

    // URL
    const cleanEndpoint = endpoint.startsWith('/api/v1') ? endpoint : `/api/v1${endpoint}`;
    const url = `${API_BASE}${cleanEndpoint}`;
    console.log('🌐 Full URL:', url);

    // Options
    const options = {
        method: method,
        headers: headers,
        credentials: 'include',
        mode: 'cors'
    };

    if (data) {
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            if (isFormData) {
                options.body = data; // FormData direkt göndər
                console.log('📦 FormData göndərilir');
            } else {
                options.body = JSON.stringify(data);
                console.log('📦 JSON body göndərilir:', data);
            }
        }
    }

    try {
        const response = await fetch(url, options);
        console.log(`📥 Response: ${response.status} ${response.statusText}`);

        // Content type-ı yoxla
        const contentType = response.headers.get('content-type');
        console.log('📋 Content-Type:', contentType);

        // Response-i emal et
        let responseData;

        // Əvvəlcə text kimi oxu
        const responseText = await response.text();
        console.log('📝 Raw response text (ilk 500 simvol):', responseText.substring(0, 500), responseText.length > 500 ? '...' : '');

        // JSON-a çevirməyə çalış
        if (responseText && responseText.trim() !== '') {
            try {
                responseData = JSON.parse(responseText);
                console.log('✅ JSON parse successful');
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                console.error('Failed to parse text:', responseText);

                // Əgər parse olunmazsa, status koduna görə fərqli emal et
                if (response.ok) {
                    responseData = { text: responseText };
                } else {
                    throw new Error(`JSON parse error: ${parseError.message}`);
                }
            }
        } else {
            console.log('⚠️ Boş response body');
            responseData = {};
        }

        // ✅ ƏSAS DÜZƏLTMƏ: 401 Unauthorized halında
        if (response.status === 401) {
            console.error('❌ 401 Unauthorized - Token expired or invalid');

            const errorText = responseText || 'Token expired';
            console.error('Error details:', errorText);

            if (typeof AuthService !== 'undefined') {
                console.log('🔄 AuthService ilə işlənir...');

                AuthService.showNotification('Session vaxtı bitmişdir. Login səhifəsinə yönləndirilirsiniz...', 'danger');
                AuthService.clearAuthData();

                setTimeout(() => {
                    AuthService.redirectToLogin();
                }, 1500);
            } else {
                console.log('⚠️ AuthService yoxdur, fallback istifadə olunur');
                localStorage.removeItem('guven_token');
                setTimeout(() => {
                    window.location.href = '../login.html';
                }, 1500);
            }

            console.groupEnd();
            return {
                error: 'Token müddəti bitmişdir',
                status: 401,
                detail: errorText
            };
        }

        // Qalan error handling
        if (!response.ok) {
            console.error('❌ HTTP Error:', {
                status: response.status,
                data: responseData
            });

            let errorMessage = `HTTP ${response.status}`;

            if (responseData && typeof responseData === 'object') {
                errorMessage = responseData.detail ||
                             responseData.message ||
                             responseData.error ||
                             errorMessage;
            }

            console.groupEnd();
            return {
                error: errorMessage,
                status: response.status,
                details: responseData
            };
        }

        // ✅ ƏSAS DÜZƏLTMƏ: SUCCESS - Backend response formatını emal et
        console.log('🔍 Backend response formatı:', {
            hasSuccess: responseData.success !== undefined,
            hasTask: !!responseData?.task,
            hasData: !!responseData?.data,
            keys: Object.keys(responseData || {})
        });

        // Format 1: {success: true, task: {...}, message: "..."} - TASK CREATE RESPONSE
        if (responseData.success !== undefined && responseData.task) {
            console.log('✅ Format 1 detected: {success: true, task: {...}, message: "..."}');
            console.log('   Task ID:', responseData.task.id);

            console.groupEnd();
            return {
                success: responseData.success,
                data: responseData.task,  // ✅ ƏSAS: task obyektini birbaşa data kimi qaytar
                message: responseData.message,
                status: response.status,
                raw: responseData
            };
        }
        // Format 2: {data: {...}} - Wrapper format
        else if (responseData.data !== undefined) {
            console.log('✅ Format 2 detected: {data: {...}}');

            console.groupEnd();
            return {
                data: responseData.data,
                status: response.status,
                raw: responseData
            };
        }
        // Format 3: {items: [...], total: X} - Paginated response
        else if (responseData.items !== undefined) {
            console.log('✅ Format 3 detected: {items: [...], total: X}');

            console.groupEnd();
            return {
                data: responseData.items,
                pagination: {
                    total: responseData.total,
                    page: responseData.page,
                    pages: responseData.pages,
                    has_next: responseData.has_next,
                    has_prev: responseData.has_prev
                },
                status: response.status,
                raw: responseData
            };
        }
        // Format 4: Array - Direct array response
        else if (Array.isArray(responseData)) {
            console.log('✅ Format 4 detected: Array response');

            console.groupEnd();
            return {
                data: responseData,
                status: response.status,
                raw: responseData
            };
        }
        // Format 5: Direct object
        else if (typeof responseData === 'object' && responseData !== null) {
            console.log('✅ Format 5 detected: Direct object');

            console.groupEnd();
            return {
                data: responseData,
                status: response.status,
                raw: responseData
            };
        }
        // Format 6: Other (text, etc.)
        else {
            console.log('✅ Format 6 detected: Other type');

            console.groupEnd();
            return {
                data: responseData,
                status: response.status,
                raw: responseData
            };
        }

    } catch (error) {
        console.error('❌ Fetch error:', error);

        // Network error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('🌐 Network error - İnternet bağlantısını yoxlayın');

            if (typeof notificationService !== 'undefined') {
                notificationService.showError('Network error: İnternet bağlantısını yoxlayın');
            }
        }

        console.groupEnd();
        return {
            error: error.message,
            status: 0,
            isNetworkError: error.name === 'TypeError' && error.message.includes('fetch')
        };
    }
}

// Helper funksiyalar
function getAuthToken() {
    // 1. localStorage-dan yoxla
    const token = localStorage.getItem('guven_token');
    if (token && token !== 'null' && token !== 'undefined' && token !== '') {
        return token;
    }

    // 2. sessionStorage-dan yoxla
    const sessionToken = sessionStorage.getItem('guven_token');
    if (sessionToken && sessionToken !== 'null' && sessionToken !== 'undefined' && sessionToken !== '') {
        return sessionToken;
    }

    // 3. Cookie-lərdən yoxla
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith('access_token=')) {
            const token = cookie.substring('access_token='.length);
            if (token && token !== 'null' && token !== 'undefined') {
                localStorage.setItem('guven_token', token);
                return token;
            }
        }
    }

    return null;
}

function parseTokenPayload(token) {
    if (!token) return null;

    try {
        const parts = token.split('.');
        if (parts.length === 3) {
            const base64UrlDecode = (str) => {
                // Base64URL formatını Base64-ə çevir
                str = str.replace(/-/g, '+').replace(/_/g, '/');

                // Padding əlavə et
                const pad = str.length % 4;
                if (pad) {
                    if (pad === 1) {
                        console.error('Invalid base64 string length');
                        return '';
                    }
                    str += '='.repeat(4 - pad);
                }

                try {
                    return atob(str);
                } catch (e) {
                    console.error('Base64 decode error:', e);
                    return '';
                }
            };

            const payloadStr = base64UrlDecode(parts[1]);
            if (!payloadStr) return null;

            const payload = JSON.parse(payloadStr);
            return {
                user_id: payload.sub || payload.user_id || payload.id,
                company_id: payload.company_id,
                company_code: payload.company_code,
                role: payload.role,
                name: payload.name,
                email: payload.email,
                ceo_name: payload.ceo_name,
                ceo_lastname: payload.ceo_lastname,
                ceo_email: payload.ceo_email,
                exp: payload.exp,
                iat: payload.iat
            };
        }
    } catch (e) {
        console.warn('Token parse error:', e);
    }
    return null;
}

// Pagination helper
function buildEndpointWithPagination(baseEndpoint, filters = {}, page = 1, pageSize = 20) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
            if (Array.isArray(value)) {
                // Array dəyərləri üçün vergüllə birləşdir
                params.append(key, value.join(','));
            } else if (typeof value === 'object' && value !== null) {
                // Object dəyərləri üçün JSON string
                params.append(key, JSON.stringify(value));
            } else {
                // Sadə dəyərlər
                params.append(key, value);
            }
        }
    });

    return `${baseEndpoint}?${params.toString()}`;
}

// Token validation
function isTokenValid() {
    const token = getAuthToken();
    if (!token) return false;

    const payload = parseTokenPayload(token);
    if (!payload) return false;

    // Expiration yoxla
    if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            console.warn('Token expired');
            return false;
        }
    }

    return true;
}

// Token refresh (əgər backend dəstəkləyirsə)
async function refreshToken() {
    try {
        const response = await makeApiRequest('/auth/refresh', 'POST', null, false);
        if (response.data && response.data.access_token) {
            localStorage.setItem('guven_token', response.data.access_token);
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
    return false;
}

// API error handling wrapper
async function makeApiRequestWithRetry(endpoint, method = 'GET', data = null, maxRetries = 1) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`🔄 Retry attempt ${attempt} for ${endpoint}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            }

            const result = await makeApiRequest(endpoint, method, data);

            // Əgər 401 xətası və ilk cəhdidirsə, token refresh etməyə çalış
            if (result.status === 401 && attempt === 0) {
                console.log('🔄 401 error detected, trying token refresh...');
                const refreshed = await refreshToken();
                if (refreshed) {
                    continue; // Token refresh olundu, yenidən cəhd et
                }
            }

            return result;
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt + 1} failed:`, error);
        }
    }

    throw lastError;
}

// Global export
if (typeof window !== 'undefined') {
    window.makeApiRequest = makeApiRequest;
    window.makeApiRequestWithRetry = makeApiRequestWithRetry;
    window.getAuthToken = getAuthToken;
    window.parseTokenPayload = parseTokenPayload;
    window.buildEndpointWithPagination = buildEndpointWithPagination;
    window.isTokenValid = isTokenValid;
    window.refreshToken = refreshToken;
}

console.log('✅ API Service loaded successfully');