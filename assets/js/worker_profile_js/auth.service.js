/**
 * Auth Service - Fixed version for response.user structure
 */

class AuthService {
    constructor(apiService) {
        this.api = apiService;
        this.currentUser = null;
    }

    // Login statusunu yoxlamaq
    async checkAuthStatus() {
        console.log('🔐 Auth status yoxlanılır...');

        try {


            // Əvvəlcə token var mı yoxla
            if (!this.api.hasToken()) {
                console.log('🔴 Token yoxdur, login səhifəsinə yönləndirilir...');
                this.api.redirectToLogin();
                return false;
            }

            const response = await this.api.getCurrentUser();
            console.log('📄 API Response:', response);

            // Əgər response null-dursa (redirect olubsa)
            if (response === null) {
                return false;
            }

            if (response && response.success && response.user) {
                this.currentUser = response.user;
                console.log('✅ Auth successful for user:', this.currentUser.email);
                return true;
            }

            console.warn('⚠️ Auth uğursuz');
            return false;



            if (response && response.success && response.user) {
                this.currentUser = response.user;
                console.log('✅ Auth successful for user:', this.currentUser.email);

                // Məlumatları localStorage-də saxla
                this.saveUserData(response);

                return true;
            }

            console.warn('⚠️ API response missing success or user');
            console.log('Response structure:', {
                success: response?.success,
                hasUser: !!response?.user,
                message: response?.message
            });

            return false;

        } catch (error) {
            console.error('❌ Auth xətası:', error.message);

            // Əgər cached data varsa istifadə et
            const cachedUser = this.getCachedUserData();
            if (cachedUser) {
                console.log('⚠️ Using cached user data due to API error');
                this.currentUser = cachedUser;
                return true;
            }

            return false;
        }
    }

    // User məlumatlarını saxla
    saveUserData(response) {
        if (!response || !response.user) return;

        // 1. guven_user_data kimi saxla
        localStorage.setItem('guven_user_data', JSON.stringify({
            success: true,
            user: response.user,
            timestamp: Date.now(),
            source: 'api-response'
        }));

        // 2. user kimi də saxla
        localStorage.setItem('user', JSON.stringify(response.user));

        // 3. Əgər email varsa, email key ilə də saxla
        if (response.user.email) {
            localStorage.setItem('user_email', response.user.email);
        }

        // 4. guven_last_me_body kimi də saxla (digər hissələr üçün)
        localStorage.setItem('guven_last_me_body', JSON.stringify(response));

        console.log('💾 User data saved to localStorage:', response.user.email);
    }

    // Cached user data almaq
    getCachedUserData() {
        // 1. guven_last_me_body-dən
        const lastMeBody = localStorage.getItem('guven_last_me_body');
        if (lastMeBody) {
            try {
                const parsed = JSON.parse(lastMeBody);
                if (parsed.success && parsed.user) {
                    console.log('✅ Cached data from guven_last_me_body');
                    return parsed.user;
                }
            } catch (e) {
                console.error('Parse guven_last_me_body error:', e);
            }
        }

        // 2. guven_user_data-dan
        const guvenData = localStorage.getItem('guven_user_data');
        if (guvenData) {
            try {
                const parsed = JSON.parse(guvenData);
                if (parsed.user) {
                    console.log('✅ Cached data from guven_user_data');
                    return parsed.user;
                }
            } catch (e) {
                console.error('Parse guven_user_data error:', e);
            }
        }

        // 3. user
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                console.log('✅ Cached data from user');
                return JSON.parse(userData);
            } catch (e) {
                console.error('Parse user error:', e);
            }
        }

        return null;
    }

    // ✅ YENİ METOD: User ID-ni almaq
    getUserId() {
        console.log('🔍 getUserId çağırıldı');

        // 1. Əvvəlcə currentUser-dən yoxla
        if (this.currentUser && this.currentUser.id) {
            console.log('✅ User ID currentUser-dən:', this.currentUser.id);
            return this.currentUser.id;
        }

        // 2. localStorage-dən guven_user_data yoxla
        const guvenData = localStorage.getItem('guven_user_data');
        if (guvenData) {
            try {
                const parsed = JSON.parse(guvenData);
                if (parsed.user && parsed.user.id) {
                    console.log('✅ User ID guven_user_data-dan:', parsed.user.id);
                    this.currentUser = parsed.user; // Cache et
                    return parsed.user.id;
                }
            } catch (e) {
                console.error('❌ Parse guven_user_data error:', e);
            }
        }

        // 3. Token-dən parse et
        const token = localStorage.getItem('guven_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.sub || payload.user_id || payload.id;
                if (userId) {
                    console.log('✅ User ID token-dən:', userId);
                    return userId;
                }
            } catch (e) {
                console.error('❌ Token parse error:', e);
            }
        }

        // 4. window.app-dən yoxla
        if (window.app && window.app.currentUserId) {
            console.log('✅ User ID window.app-dən:', window.app.currentUserId);
            return window.app.currentUserId;
        }

        console.warn('⚠️ User ID tapılmadı');
        return null;
    }

    // ✅ İkinci yeni metod: getCurrentUserId (alternativ ad)
    getCurrentUserId() {
        return this.getUserId(); // Eyni funksiya
    }

    // Logout
    async logout() {
        try {
            await this.api.logout();
        } catch (error) {
            console.warn('Logout API xətası:', error);
        }

        // Local təmizlik
        this.clearLocalData();
        this.currentUser = null;

        console.log('✅ Logout completed');
        return true;
    }

    // Local data təmizləmə
    clearLocalData() {
        this.api.clearToken();

        // Bütün guven_ prefiksliləri sil
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('guven_')) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });

        // Digər auth related keys
        localStorage.removeItem('user');
        localStorage.removeItem('user_email');
        localStorage.removeItem('profileImage');
        localStorage.removeItem('companyLogo');
        localStorage.removeItem('authToken');

        console.log('🧹 All auth data cleared from localStorage');
    }

    // Getter'lər
    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    hasToken() {
        return this.api.hasToken();
    }
}

window.AuthService = AuthService;