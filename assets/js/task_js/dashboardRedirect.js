// assets/js/task_js/dashboardRedirect.js
// Dashboard yönləndirmələri və role idarəetməsi

class DashboardRedirect {
    constructor() {
        console.log('🚀 Dashboard Redirect başladılır...');
    }

    // ==================== ROLE DETECTION ====================
    getUserRole() {
        try {
            console.log('🔍 İstifadəçi rolu yoxlanılır...');

            // 1. taskManager-dən yoxla
            if (window.taskManager && window.taskManager.userData && window.taskManager.userData.role) {
                const role = window.taskManager.userData.role;
                console.log('👤 Rol taskManager-dən götürüldü:', role);
                return role;
            }

            // 2. Token-dən yoxla
            const token = this.getAuthToken();
            if (token) {
                const payload = this.parseTokenPayload(token);
                if (payload && payload.role) {
                    console.log('🔐 Rol token-dən götürüldü:', payload.role);
                    return payload.role;
                }
            }

            // 3. localStorage-dan yoxla
            const storedRole = localStorage.getItem('guven_user_role') ||
                               localStorage.getItem('current_role') ||
                               localStorage.getItem('userRole');

            if (storedRole) {
                console.log('💾 Rol localStorage-dan götürüldü:', storedRole);
                return storedRole;
            }

            // 4. SessionStorage-dan yoxla
            const sessionRole = sessionStorage.getItem('current_role') ||
                                sessionStorage.getItem('userRole');

            if (sessionRole) {
                console.log('📝 Rol sessionStorage-dan götürüldü:', sessionRole);
                return sessionRole;
            }

            console.warn('⚠️ Rol tapılmadı, default olaraq "employee" qəbul edilir');
            return 'employee';

        } catch (error) {
            console.error('❌ Rol yoxlanışı xətası:', error);
            return 'employee';
        }
    }

    // ==================== TOKEN OPERATIONS ====================
    getAuthToken() {
        const AUTH_TOKEN_KEYS = ['guven_token', 'access_token', 'accessToken', 'token'];

        for (const key of AUTH_TOKEN_KEYS) {
            const localValue = localStorage.getItem(key);
            if (localValue && localValue.trim() && localValue !== 'null' && localValue !== 'undefined') {
                return localValue.trim();
            }

            const sessionValue = sessionStorage.getItem(key);
            if (sessionValue && sessionValue.trim() && sessionValue !== 'null' && sessionValue !== 'undefined') {
                return sessionValue.trim();
            }
        }

        return '';
    }

    parseTokenPayload(token) {
        if (!token) return null;

        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                // Base64 decode
                const base64Url = parts[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                return JSON.parse(jsonPayload);
            }
        } catch (error) {
            console.error('❌ Token parse xətası:', error);
        }

        return null;
    }

    // ==================== DASHBOARD REDIRECT ====================
    getDashboardUrl(role = '') {
        const userRole = role || this.getUserRole();
        console.log('🔄 Dashboard URL-si müəyyən edilir, rol:', userRole);

        const roleLower = userRole.toLowerCase();

        // Role mapping
        if (roleLower.includes('company_admin') ||
            roleLower.includes('owner') ||
            roleLower.includes('admin') && !roleLower.includes('super')) {
            return '../owner/owp.html';
        }
        else if (roleLower.includes('employee') ||
                 roleLower.includes('worker') ||
                 roleLower.includes('staff')) {
            return '../worker/wp.html';
        }
        else if (roleLower.includes('super_admin') ||
                 roleLower.includes('superadmin')) {
            return '../admin.html';
        }
        else {
            console.warn('⚠️ Tanınmayan rol:', userRole, '- Əsas səhifəyə yönləndirilir');
            return '../index.html';
        }
    }

    redirectToDashboard(role = '') {
        const dashboardUrl = this.getDashboardUrl(role);
        console.log('📍 Yönləndirilən URL:', dashboardUrl);
        window.location.href = dashboardUrl;
    }

    // ==================== BUTTON MANAGEMENT ====================
    updateBackButtonText() {
        const backButton = document.getElementById('backPanelBtn');
        const backButtonText = backButton ? backButton.querySelector('span') : null;

        if (!backButtonText) {
            console.warn('⚠️ Back button tapılmadı');
            return;
        }

        const userRole = this.getUserRole();
        const roleLower = userRole.toLowerCase();

        let buttonText = 'Panelə qayıt';

        if (roleLower.includes('company_admin') ||
            roleLower.includes('owner') ||
            roleLower.includes('admin') && !roleLower.includes('super')) {
            buttonText = 'Panelə Qayıt';
        }
        else if (roleLower.includes('employee') ||
                 roleLower.includes('worker') ||
                 roleLower.includes('staff')) {
            buttonText = 'Panelə Qayıt';
        }
        else if (roleLower.includes('super_admin') ||
                 roleLower.includes('superadmin')) {
            buttonText = 'Admin Panelinə Qayıt';
        }

        backButtonText.textContent = buttonText;
        console.log('🏷️ Button mətnini dəyişdi:', buttonText);
    }

    // ==================== INITIALIZATION ====================
    setupBackButtons() {
        console.log('🔧 Back button-lar qurulur...');

        const backHomeBtn = document.getElementById('backHomeBtn');
        const backPanelBtn = document.getElementById('backPanelBtn');

        // Əsas səhifə button-u
        if (backHomeBtn) {
            backHomeBtn.addEventListener('click', () => {
                window.location.href = '../index.html';
            });
            console.log('✅ Back home button quruldu');
        }

        // Panelə qayıt button-u
        if (backPanelBtn) {
            backPanelBtn.addEventListener('click', () => {
                this.redirectToDashboard();
            });
            console.log('✅ Back panel button quruldu');
        }

        // Button mətnini yenilə
        this.updateBackButtonText();

        console.log('✅ Back button-lar quruldu');
    }

    // ==================== TEST FUNCTION ====================
    testRoleDetection() {
        console.log('🧪 === ROL TESTİ BAŞLAYIR ===');
        console.log('1. Token:', this.getAuthToken() ? 'Var' : 'Yoxdur');

        const token = this.getAuthToken();
        if (token) {
            const payload = this.parseTokenPayload(token);
            console.log('2. Token payload:', payload);
        }

        console.log('3. localStorage guven_user_role:', localStorage.getItem('guven_user_role'));
        console.log('4. localStorage userRole:', localStorage.getItem('userRole'));
        console.log('5. window.taskManager:', window.taskManager ? 'Var' : 'Yoxdur');

        if (window.taskManager && window.taskManager.userData) {
            console.log('6. taskManager.userData:', window.taskManager.userData);
        }

        const detectedRole = this.getUserRole();
        console.log('7. Aşkar edilən rol:', detectedRole);

        const dashboardUrl = this.getDashboardUrl(detectedRole);
        console.log('8. Dashboard URL:', dashboardUrl);

        console.log('✅ === ROL TESTİ TAMAMLANDI ===');
        return detectedRole;
    }
}

// Global instance yarat
window.dashboardRedirect = new DashboardRedirect();

// HTML yükləndikdə avtomatik işə düş
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM hazırdır, Dashboard Redirect işə düşür...');

    // Test et (istəyə bağlı)
    // window.dashboardRedirect.testRoleDetection();

    // Back button-ları qur
    window.dashboardRedirect.setupBackButtons();
});