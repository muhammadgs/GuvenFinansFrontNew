// authService.js - DÜZGÜN VERSİYA
const AuthService = {
    // Token vaxtı yoxlamaq
    isTokenExpired: function(token) {
        if (!token) return true;

        try {
            const payload = this.parseTokenPayload(token);
            if (!payload || !payload.exp) return true;

            const currentTime = Math.floor(Date.now() / 1000);
            const isExpired = payload.exp < currentTime;

            console.log(`🔐 Token yoxlanılır: exp=${payload.exp}, current=${currentTime}, expired=${isExpired}`);
            return isExpired;

        } catch (error) {
            console.error('Token parse error:', error);
            return true;
        }
    },

    // Token parse etmək
    parseTokenPayload: function(token) {
        if (!token) return null;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error('❌ Token formatı səhv');
                return null;
            }

            // Base64 decode
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

            // Padding əlavə et
            const pad = base64.length % 4;
            if (pad) {
                if (pad === 1) {
                    throw new Error('Invalid base64 length');
                }
                base64 += '==='.slice(0, 4 - pad);
            }

            const jsonPayload = atob(base64);
            const decoded = JSON.parse(jsonPayload);

            console.log('✅ Token payload:', decoded);
            return decoded;

        } catch (error) {
            console.error('❌ Token parse error:', error);
            return null;
        }
    },

    // Token almaq
    getToken: function() {
        const tokenKeys = ['guven_token', 'access_token', 'accessToken', 'token'];

        for (const key of tokenKeys) {
            // 1. localStorage
            let token = localStorage.getItem(key);
            if (token && token.trim() && token !== 'null' && token !== 'undefined') {
                console.log(`✅ Token tapıldı (localStorage): ${key}`);
                return token.trim();
            }

            // 2. sessionStorage
            token = sessionStorage.getItem(key);
            if (token && token.trim() && token !== 'null' && token !== 'undefined') {
                console.log(`✅ Token tapıldı (sessionStorage): ${key}`);
                return token.trim();
            }
        }

        // 3. Cookies
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith('access_token=')) {
                const token = cookie.substring('access_token='.length);
                console.log('✅ Token tapıldı (cookie): access_token');
                return token;
            }
            if (cookie.startsWith('guven_token=')) {
                const token = cookie.substring('guven_token='.length);
                console.log('✅ Token tapıldı (cookie): guven_token');
                return token;
            }
        }

        console.warn('⚠️ Heç bir token tapılmadı');
        return null;
    },

    // Auth data təmizləmək
    clearAllCookies: function() {
        console.log('🍪 BÜTÜN cookies-lər təmizlənir...');

        const domain = window.location.hostname;
        const baseDomain = domain.replace(/^www\./, '.'); // .guvenfinans.az formatı

        // Təmizlənəcək cookies-lərin siyahısı
        const cookiesToClear = [
            // Auth cookies
            'access_token',
            'refresh_token',
            'session_id',
            'XSRF-TOKEN',
            'xsrf_token',
            'auth_token',
            'token',
            'guven_token',

            // Session cookies
            'cpsession',
            'PHPSESSID',
            'ASP.NET_SessionId',
            'JSESSIONID',

            // Debug cookies
            'auth_debug',

            // Digər ehtimal olunan cookies
            'remember_me',
            'user_session',
            'auth_session',
            'logged_in',
            'login_token'
        ];

        // Tarix formatı: Thu, 01 Jan 1970 00:00:00 UTC
        const pastDate = 'Thu, 01 Jan 1970 00:00:00 UTC';

        // Hər bir cookie üçün müxtəlif domain/path kombinasiyalarını sına
        cookiesToClear.forEach(cookieName => {
            try {
                // 1. Əsas domain üçün
                document.cookie = `${cookieName}=; expires=${pastDate}; path=/; domain=${domain}`;

                // 2. .domain formatı üçün (subdomain-lər də daxil)
                document.cookie = `${cookieName}=; expires=${pastDate}; path=/; domain=${baseDomain}`;

                // 3. Path təkbaşına
                document.cookie = `${cookieName}=; expires=${pastDate}; path=/`;

                // 4. Root path üçün
                document.cookie = `${cookieName}=; expires=${pastDate}; path=/;`;

                // 5. Bütün path-lər üçün
                document.cookie = `${cookieName}=; expires=${pastDate}; path=/; domain=${domain}; Secure`;
                document.cookie = `${cookieName}=; expires=${pastDate}; path=/; domain=${baseDomain}; Secure`;

                // 6. HttpOnly təqlidi (mümkün olsa)
                document.cookie = `${cookieName}=; expires=${pastDate}; path=/; domain=${domain}; HttpOnly`;
                document.cookie = `${cookieName}=; expires=${pastDate}; path=/; domain=${baseDomain}; HttpOnly`;

                console.log(`✅ Cookie təmizləmə cəhdi: ${cookieName}`);

            } catch (e) {
                console.warn(`⚠️ Cookie təmizləmə xətası ${cookieName}:`, e);
            }
        });

        // Cari document.cookie-də olan BÜTÜN cookies-ləri təmizlə
        try {
            const allCookies = document.cookie.split(';');
            allCookies.forEach(cookie => {
                const cookieParts = cookie.trim().split('=');
                const name = cookieParts[0];

                if (name) {
                    // Cookie təmizlə
                    document.cookie = `${name}=; expires=${pastDate}; path=/; domain=${domain}`;
                    document.cookie = `${name}=; expires=${pastDate}; path=/; domain=${baseDomain}`;
                    document.cookie = `${name}=; expires=${pastDate}; path=/`;

                    console.log(`✅ Cari cookie silindi: ${name}`);
                }
            });
        } catch (e) {
            console.warn('Cari cookies-ləri oxuma/xətası:', e);
        }

        console.log('✅ Cookies təmizləmə prosesi tamamlandı');
    },

    // Login səhifəsinə yönləndirmək
    redirectToLogin: function() {
        console.log('🔀 Login səhifəsinə yönləndirilir...');

        // Cari səhifəni yadda saxla
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('last_accessed_page', currentPath);

        // Login səhifəsi
        let loginPage = localStorage.getItem('last_login_page') || '../login.html';

        // Əgər login.html artıq cari səhifədirsə, yönləndirmə
        if (window.location.pathname.includes('login.html')) {
            console.log('ℹ️ Artıq login səhifəsindəyik');
            return;
        }

        console.log(`🔀 Yönləndirilir: ${loginPage}`);

        // Təmiz redirect
        window.location.href = loginPage;
    },

     // İstifadəçi logout etmək - BACKEND ƏLAQƏLİ
    logout: async function() {
        console.log('👋 Backend logout edilir...');

        try {
            // 1. Əvvəlcə backend logout endpoint-ə request göndər
            const result = await this.performBackendLogout();

            if (result && result.success) {
                console.log('✅ Backend logout uğurlu:', result.message);
            } else {
                console.warn('⚠️ Backend logout cavabı uğursuz oldu');
            }
        } catch (error) {
            console.error('❌ Backend logout xətası:', error);
            // Backend xəta olsa belə, frontend auth datanı təmizlə
        }

        // 2. Hər halda frontend auth datanı təmizlə
        this.clearAllCookies();

        // 3. Login səhifəsinə yönləndir
        this.redirectToLogin();
    },

    // Backend logout endpoint-ə sorğu göndər
    performBackendLogout: async function() {
        console.log('🌐 Backend logout request göndərilir...');

        try {
            // makeApiRequest funksiyasını istifadə et
            if (typeof window.makeApiRequest === 'function') {
                const response = await window.makeApiRequest(
                    '/api/v1/auth/logout',
                    'POST',
                    null,
                    true // auth tələb olunur
                );

                console.log('🔍 Backend logout response:', response);
                return response;
            } else {
                // Əgər makeApiRequest yoxdursa, fetch istifadə et
                const token = this.getToken();
                if (!token) {
                    console.warn('⚠️ Logout üçün token yoxdur');
                    return null;
                }

                const response = await fetch('/api/v1/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include' // Cookies üçün
                });

                if (response.ok) {
                    return await response.json();
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
        } catch (error) {
            console.error('❌ Backend logout sorğu xətası:', error);
            throw error;
        }
    },

    // Auth yoxlama
    checkAuth: function() {
        console.log('🔐 Auth yoxlanılır...');

        const token = this.getToken();

        // 1. Token yoxdursa
        if (!token) {
            console.error('❌ Token tapılmadı');
            this.showNotification('Token tapılmadı', 'danger');
            setTimeout(() => this.redirectToLogin(), 1500);
            return false;
        }

        // 2. Token expired-dirsə
        if (this.isTokenExpired(token)) {
            console.error('❌ Token vaxtı bitmişdir');
            this.showNotification('Session vaxtı bitmişdir. Yenidən login olun.', 'danger');

            // Auth data təmizlə
            this.clearAuthData();

            // 2 saniyədən sonra redirect et
            setTimeout(() => this.redirectToLogin(), 2000);
            return false;
        }

        // 3. Token hələ də etibarlıdır
        const payload = this.parseTokenPayload(token);
        if (payload) {
            const currentTime = Math.floor(Date.now() / 1000);
            const timeLeft = payload.exp - currentTime;

            console.log(`✅ Token etibarlıdır. ${Math.floor(timeLeft / 60)} dəqiqə ${timeLeft % 60} saniyə qalıb`);

            // 5 dəqiqədən az qalıbsa, xəbərdarlıq göstər
            if (timeLeft < 300) { // 5 dəqiqə
                this.showWarningNotification(timeLeft);
            }
        }

        return true;
    },

    // Notification göstərmək
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `auth-notification auth-notification-${type}`;
        notification.innerHTML = `
            <div class="auth-notification-content">
                <i class="fas ${type === 'danger' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // CSS əlavə et (əgər yoxdursa)
        if (!document.querySelector('#auth-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'auth-notification-styles';
            style.textContent = `
                .auth-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 99999;
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                }
                
                .auth-notification-danger {
                    background: linear-gradient(135deg, #ff6b6b, #ff4757);
                    color: white;
                }
                
                .auth-notification-warning {
                    background: linear-gradient(135deg, #ffa502, #ff7f00);
                    color: white;
                }
                
                .auth-notification-success {
                    background: linear-gradient(135deg, #2ed573, #1dd1a1);
                    color: white;
                }
                
                .auth-notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .auth-notification-content i {
                    font-size: 18px;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // 5 saniyədən sonra sil
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    },

    // Vaxtı bitmək üzrə xəbərdarlıq
    showWarningNotification: function(timeLeft) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        const notification = document.createElement('div');
        notification.className = 'auth-notification auth-notification-warning';
        notification.innerHTML = `
            <div class="auth-notification-content">
                <i class="fas fa-clock"></i>
                <div>
                    <strong>Session vaxtı bitmək üzrə</strong>
                    <p>${minutes} dəqiqə ${seconds} saniyə qalıb. Davam etmək üçün yenidən login olun.</p>
                    <button class="auth-refresh-btn">Yenidən Bağla</button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Refresh button event
        const refreshBtn = notification.querySelector('.auth-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                notification.remove();
                // Burada refresh token funksiyası əlavə edə bilərsiniz
                // this.refreshToken();
            });
        }

        // 10 saniyədən sonra sil
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    },

    // API çağırışlarını intercept etmək
    interceptApiRequests: function() {
        console.log('🔄 API interceptor aktiv edilir...');

        // makeApiRequest funksiyasını saxla
        const originalMakeApiRequest = window.makeApiRequest;

        if (!originalMakeApiRequest) {
            console.error('❌ makeApiRequest funksiyası tapılmadı');
            return;
        }

        // Yeni makeApiRequest
        window.makeApiRequest = async function(endpoint, method, data, requiresAuth = true) {
            console.log(`📡 Intercepted API: ${method} ${endpoint}`);

            // Auth tələb olunursa
            if (requiresAuth) {
                // Auth yoxla
                if (!AuthService.checkAuth()) {
                    console.error('❌ Auth yoxlaması uğursuz');
                    return {
                        error: 'Authentication failed',
                        status: 401,
                        detail: 'Token expired or not found'
                    };
                }
            }

            // Original funksiyanı çağır
            try {
                const result = await originalMakeApiRequest(endpoint, method, data, requiresAuth);

                // Əgər 401 error alınıbsa
                if (result && (result.status === 401 || result.error === 'HTTP 401')) {
                    console.error('❌ API 401 error - Token expired');

                    // Notification göstər
                    AuthService.showNotification('Session vaxtı bitmişdir. Yenidən login olun.', 'danger');

                    // Auth data təmizlə
                    AuthService.clearAuthData();

                    // 2 saniyədən sonra redirect et
                    setTimeout(() => {
                        AuthService.redirectToLogin();
                    }, 2000);

                    return result;
                }

                return result;

            } catch (error) {
                console.error('❌ API çağırış xətası:', error);
                return { error: error.message, status: 0 };
            }
        };

        console.log('✅ API interceptor aktiv edildi');
    },

    // Interval ilə auth yoxlama
    startAuthMonitor: function() {
        console.log('⏱️ Auth monitor başladılır...');

        // Hər 30 saniyədən bir yoxla
        this.authCheckInterval = setInterval(() => {
            console.log('🔄 Auth monitor yoxlanılır...');
            this.checkAuth();
        }, 30000); // 30 saniyə

        // Həm də fokus dəyişdikdə yoxla
        window.addEventListener('focus', () => {
            console.log('🎯 Window focus oldu, auth yoxlanılır...');
            this.checkAuth();
        });

        console.log('✅ Auth monitor aktiv edildi');
    },

    // Stop auth monitor
    stopAuthMonitor: function() {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            console.log('🛑 Auth monitor dayandırıldı');
        }
    },

    // Initialize auth system
    initialize: function() {
        console.log('🔐 Auth Service initialize edilir...');

        // Əvvəlcə auth yoxla
        if (!this.checkAuth()) {
            console.error('❌ Auth yoxlaması uğursuz oldu');
            return false;
        }

        // API interceptor qur
        this.interceptApiRequests();

        // Auth monitor başlat
        this.startAuthMonitor();

        // Page unload zamanı monitoru dayandır
        window.addEventListener('beforeunload', () => {
            this.stopAuthMonitor();
        });

        console.log('✅ Auth Service hazırdır');
        return true;
    }
};

// Global export
if (typeof window !== 'undefined') {
    window.AuthService = AuthService;

    // Global logout funksiyası
    window.logoutUser = function() {
        if (confirm('Hesabdan çıxmaq istədiyinizə əminsiniz?')) {
            AuthService.logout();
        }
    };
}