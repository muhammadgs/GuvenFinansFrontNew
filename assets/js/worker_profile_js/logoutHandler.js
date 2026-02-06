// assets/js/logoutHandler.js
class LogoutHandler {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupLogoutButton();
        });
    }

    setupLogoutButton() {
        const logoutBtn = document.getElementById('logoutButton');
        if (!logoutBtn) return;

        // Köhnə event listener-ları sil
        logoutBtn.replaceWith(logoutBtn.cloneNode(true));
        const newLogoutBtn = document.getElementById('logoutButton');

        newLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.performLogout();
        });

        console.log('✅ Logout handler quruldu');
    }

    performLogout() {
        if (!confirm('Hesabdan çıxmaq istədiyinizə əminsiniz?')) {
            return;
        }

        // Loading göstər
        const logoutBtn = document.getElementById('logoutButton');
        const originalHTML = logoutBtn.innerHTML;
        logoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Çıxış edilir...';
        logoutBtn.disabled = true;

        // 1. API logout (əgər varsa)
        this.apiLogout().catch(() => {});

        // 2. Local data təmizlə
        this.clearAllData();

        // 3. Login səhifəsinə yönləndir
        setTimeout(() => {
            const loginUrl = this.getLoginUrl();
            console.log('📍 Yönləndirilir:', loginUrl);
            window.location.href = loginUrl;
        }, 800);
    }

    async apiLogout() {
        try {
            const token = localStorage.getItem('guven_token') ||
                          localStorage.getItem('access_token');

            if (token) {
                const response = await fetch('https://guvenfinans.az/proxy.php/api/v1/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    console.log('✅ API logout uğurlu');
                }
            }
        } catch (error) {
            console.warn('⚠️ API logout xətası:', error);
        }
    }

    clearAllData() {
        console.log('🧹 Bütün data təmizlənir...');

        // LocalStorage
        localStorage.clear();

        // SessionStorage
        sessionStorage.clear();

        // Cookies
        document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });

        console.log('✅ Data təmizləndi');
    }

    getLoginUrl() {
        const currentPath = window.location.pathname;
        console.log('📍 Cari yol:', currentPath);

        // Əgər worker_profile.html faylındadırsa
        if (currentPath.endsWith('worker_profile.html') ||
            currentPath.includes('/worker_profile_html/')) {
            return '../../login.html';
        }
        // Əgər task_html folderindədirsə
        else if (currentPath.includes('/task_html/')) {
            return '../../login.html';
        }
        // Digər hallar
        else {
            return '../login.html';
        }
    }
}

// Global instance yarat
window.logoutHandler = new LogoutHandler(); 