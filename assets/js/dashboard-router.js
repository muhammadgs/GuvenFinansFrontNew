// assets/js/dashboard-router.js

(function () {
    var API_BASE = "https://guvenfinans.az/proxy.php";
    var USER_ME_ENDPOINT = "/api/v1/auth/me";
    var statusEl = document.getElementById('routing-status');

    var setStatus = function (message) {
        if (!statusEl) return;
        statusEl.textContent = message;
    };

    var showError = function (message) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.style.color = '#b00020';
    };

    var clearAuthStorage = function () {
        var keys = [
            'guven_token',
            'guven_token_type',
            'guven_user_role',
            'guven_user_id',
            'guven_user',
            'guven_user_name',
            'guven_company_name',
            'guven_last_role_raw',
            'guven_last_role_norm'
        ];
        for (var i = 0; i < keys.length; i++) {
            localStorage.removeItem(keys[i]);
        }
    };

    var normalizeRole = function (role) {
        var normalized = String(role || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/-/g, '_');

        if (normalized === 'companyadmin') return 'company_admin';
        if (normalized === 'superadmin') return 'super_admin';
        return normalized;
    };

    var extractRole = function (userData) {
        if (!userData) return '';
        return (
            userData.role ||
            userData.user_role ||
            (userData.user && (userData.user.role || userData.user.user_role)) ||
            (userData.data && (userData.data.role || (userData.data.user && userData.data.user.role))) ||
            ''
        );
    };

    var routeByRole = function (rawRole) {
        var raw = rawRole == null ? '' : String(rawRole);
        var normalized = normalizeRole(raw);

        localStorage.setItem('guven_last_role_raw', raw);
        localStorage.setItem('guven_last_role_norm', normalized);

        if (normalized === 'company_admin') {
            window.location.href = 'owner/owp.html';
            return;
        }
        if (normalized === 'employee') {
            window.location.href = 'worker/wp.html';
            return;
        }
        if (normalized === 'super_admin' || normalized === 'admin') {
            window.location.href = 'admin.html';
            return;
        }

        console.error('Unknown role for routing:', raw);
        showError('Unknown role: ' + raw + '. Please contact support.');
    };

    var token = localStorage.getItem('guven_token');
    var tokenTypeRaw = localStorage.getItem('guven_token_type');
    if (!token) {
        clearAuthStorage();
        window.location.href = 'login.html?reason=missing';
        return;
    }

    var normalizeTokenType = function (type) {
        var raw = String(type || '').trim();
        if (!raw) return 'Bearer';
        return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    };

    var tokenType = normalizeTokenType(tokenTypeRaw);

    var logTokenSnippet = function (t) {
        if (!t) return;
        var len = t.length;
        var head = t.slice(0, 6);
        var tail = t.slice(-6);
        console.log('[auth] token found length=' + len + ', head=' + head + ', tail=' + tail);
    };

    var storeDebugValue = function (key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (err) {
            console.warn('Failed to store debug key:', key, err);
        }
    };

    var handleAuthFailure = function (reason) {
        clearAuthStorage();
        window.location.href = 'login.html?reason=' + reason;
    };

    var fetchUserMe = function (attempt) {
        setStatus('Routing...');
        logTokenSnippet(token);

        fetch(API_BASE + USER_ME_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': tokenType + ' ' + token
            }
        })
            .then(function (response) {
                return response.text().then(function (bodyText) {
                    storeDebugValue('guven_last_me_status', String(response.status));
                    storeDebugValue('guven_last_me_body', bodyText);
                    console.log('[auth] /auth/me status=', response.status);
                    console.log('[auth] /auth/me body=', bodyText);
                    if (response.status === 401 || response.status === 403) {
                        handleAuthFailure('auth');
                        return null;
                    }
                    if (!response.ok) {
                        showError('Giriş məlumatları yoxlanıla bilmədi. Xəta kodu: ' + response.status);
                        return null;
                    }
                    var parsed = null;
                    try {
                        parsed = bodyText ? JSON.parse(bodyText) : {};
                    } catch (err) {
                        showError('İstifadəçi məlumatları oxuna bilmədi.');
                        return null;
                    }
                    return parsed;
                });
            })
            .then(function (userData) {
                if (!userData) return;
                var roleRaw = extractRole(userData);
                var roleNorm = normalizeRole(roleRaw);
                storeDebugValue('guven_last_role_raw', roleRaw == null ? '' : String(roleRaw));
                storeDebugValue('guven_last_role_norm', roleNorm);
                routeByRole(roleRaw);
            })
            .catch(function (err) {
                console.error('[auth] /auth/me fetch error', err);
                if (attempt < 1) {
                    setStatus('Retrying...');
                    setTimeout(function () {
                        fetchUserMe(attempt + 1);
                    }, 500);
                    return;
                }
                handleAuthFailure('auth');
            });
    };

    fetchUserMe(0);
})();
