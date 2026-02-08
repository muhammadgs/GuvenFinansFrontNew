// Admin Panel JavaScript - core.js
const API_BASE = "https://guvenfinans.az/proxy.php";
let currentUser = {};
window.API_BASE = API_BASE;
window.deleteType = null;
let currentPage = 'dashboard';
let itemsPerPage = 10;

// Seçilmiş elementlər üçün dəyişənlər
let selectedUserId = null;
let selectedApplicationId = null;
deleteType = null;

// Notification container
let notificationContainer = null;
console.log('core.js yükləndi, API_BASE:', API_BASE);

// ===== MOBILE SIDEBAR FUNCTIONALITY =====
console.log('📱 Mobil modul yüklənir...');

// Check if mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Initialize mobile sidebar
function initMobileSidebar() {
    console.log('📱 Mobil menyu işə salınır...');

    // Create overlay for mobile sidebar if not exists
    let overlay = document.getElementById('sidebarOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'sidebarOverlay';
        overlay.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999;';
        document.body.appendChild(overlay);
        console.log('✅ Overlay yaradıldı');
    }

    // Get elements
    const sidebar = document.getElementById('adminSidebar');
    const menuToggle = document.getElementById('menuToggle');

    if (!sidebar) {
        console.error('❌ Sidebar tapılmadı!');
        return;
    }

    if (!menuToggle) {
        console.error('❌ Menu toggle button tapılmadı!');
        return;
    }

    // Toggle sidebar function - SADƏ VERSİYA
    window.toggleSidebar = function() {
        console.log('🔘 Menyu klik edildi');

        const sidebar = document.getElementById('adminSidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (!sidebar || !overlay) return;

        const isActive = sidebar.classList.contains('active');

        if (isActive) {
            // Bağla
            sidebar.classList.remove('active');
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
            console.log('📂 Menyu bağlandı');
        } else {
            // Aç
            sidebar.classList.add('active');
            overlay.style.display = 'block';
            if (isMobile()) {
                document.body.style.overflow = 'hidden';
            }
            console.log('📂 Menyu açıldı');
        }
    };

    // Close sidebar when clicking on overlay
    overlay.addEventListener('click', function() {
        console.log('📂 Overlay klik edildi, menyu bağlanır');
        window.toggleSidebar();
    });

    // Close sidebar when clicking on a menu item (on mobile)
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            if (isMobile()) {
                setTimeout(() => {
                    window.toggleSidebar();
                }, 300);
            }
        });
    });

    // Close sidebar on window resize (if resized to desktop)
    window.addEventListener('resize', function() {
        const sidebar = document.getElementById('adminSidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (!isMobile() && sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        // Adjust content padding
        adjustContentPadding();
    });

    console.log('✅ Mobil menyu hazırdır');
}

// Adjust content padding for mobile header
function adjustContentPadding() {
    const adminContent = document.getElementById('adminContent');
    const header = document.querySelector('.admin-header');

    if (adminContent && header) {
        if (isMobile()) {
            const headerHeight = header.offsetHeight;
            adminContent.style.paddingTop = (headerHeight + 15) + 'px';
            console.log('📏 Content padding ayarlandı:', headerHeight + 'px');
        } else {
            adminContent.style.paddingTop = '';
        }
    }
}

// Setup menu toggle button visibility
function setupMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    if (!menuToggle) return;

    if (isMobile()) {
        menuToggle.style.display = 'flex';
        console.log('📱 Menu toggle göstərildi');
    } else {
        menuToggle.style.display = 'none';
        console.log('💻 Menu toggle gizlədildi');
    }
}

// Initialize mobile functionality
function initMobile() {
    console.log('🚀 Mobil funksionallıq başladılır...');

    // Setup menu toggle
    setupMenuToggle();

    // Initialize sidebar
    initMobileSidebar();

    // Adjust content padding
    adjustContentPadding();

    // Add touch-friendly styles
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        console.log('👆 Touch device aşkar edildi');
    }

    console.log('✅ Mobil funksionallıq hazırdır');
}

// Safe API call funksiyası
if (typeof safeApiCall === 'undefined') {
    console.log('⚠️ safeApiCall yoxdur, müvəqqəti versiya yaradılır...');

    window.safeApiCall = async function(url, options = {}) {
        try {
            console.log(`📡 API Call: ${url}`);

            const token = localStorage.getItem('guven_token');

            const defaultHeaders = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            if (token) {
                defaultHeaders['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ API Call Error:', error);
            if (typeof showError === 'function') {
                showError(`API xətası: ${error.message}`);
            }
            throw error;
        }
    };
}

// Xidmətləri localStorage-a saxla və ana səhifəyə göndər
window.saveServicesToStorage = function(servicesData) {
    console.log('📁 Xidmətlər localStorage-a saxlanılır:', servicesData.length);

    // Bütün xidmətləri saxla
    localStorage.setItem('guvenfinans-services', JSON.stringify(servicesData));

    // Aktiv xidmətləri ayrıca saxla (ana səhifə üçün)
    const activeServices = servicesData
        .filter(s => s.active)
        .sort((a, b) => a.order - b.order);

    localStorage.setItem('guvenfinans-active-services', JSON.stringify(activeServices));

    console.log('✅ ' + activeServices.length + ' aktiv xidmət saxlandı');

    // Əgər ana səhifə açıqdırsa, onu yenilə
    updateMainPageServices(activeServices);
};

// Ana səhifəni yenilə
function updateMainPageServices(services) {
    console.log('🔄 Ana səhifə yenilənir...');

    // Ana səhifədə xidmətlər bölməsini yenilə
    if (window.opener && !window.opener.closed) {
        // Əgər ana səhifə ayrı pəncərədə açıqdırsa
        try {
            window.opener.postMessage({
                type: 'UPDATE_SERVICES',
                services: services
            }, '*');
            console.log('✅ Ana səhifəyə mesaj göndərildi');
        } catch (error) {
            console.error('❌ Ana səhifəyə mesaj göndərilmədi:', error);
        }
    }

    // Həm də localStorage event-i göndər
    const event = new StorageEvent('storage', {
        key: 'guvenfinans-active-services',
        newValue: JSON.stringify(services)
    });
    window.dispatchEvent(event);
}

// Ana səhifə ilə əlaqə qurmaq üçün
window.connectToMainPage = function() {
    console.log('🔗 Ana səhifə ilə əlaqə qurulur...');

    // Message listener əlavə et
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'GET_SERVICES') {
            console.log('📥 Ana səhifədən xidmətlər sorğusu alındı');

            const savedServices = localStorage.getItem('guvenfinans-active-services');
            if (savedServices) {
                const services = JSON.parse(savedServices);

                // Cavab göndər
                event.source.postMessage({
                    type: 'SERVICES_DATA',
                    services: services
                }, event.origin);

                console.log('✅ Xidmətlər göndərildi');
            }
        }
    });

    console.log('✅ Message listener əlavə edildi');
};

// ============================================
// ƏSAS DOM LOAD EVENT
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== ADMIN PANEL BAŞLADI ===');
    console.log('📱 Window width:', window.innerWidth);
    console.log('📱 isMobile:', isMobile());

    // Əvvəlcə mobil funksionallığı işə sal
    initMobile();

    // Window resize event
    window.addEventListener('resize', function() {
        console.log('🔄 Window resize:', window.innerWidth);
        setupMenuToggle();
        adjustContentPadding();

        // Desktop-a keçid etdikdə sidebar-i bağla
        if (!isMobile()) {
            const sidebar = document.getElementById('adminSidebar');
            const overlay = document.getElementById('sidebarOverlay');
            if (sidebar) sidebar.classList.remove('active');
            if (overlay) overlay.style.display = 'none';
        }
    });

    // Global mobile check function
    window.isMobileView = function() {
        return isMobile();
    };

    console.log('📱 Mobil funksionallıq yükləndi, admin panel yüklənir...');

    // Notification container yarat
    createNotificationContainer();

    // Yüklənməni gizlət
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }, 1000);

    try {
        // Cari istifadəçi məlumatlarını yüklə
        await loadCurrentUser();

        // Dashboard məlumatlarını yüklə
        await loadDashboardData();

        // Menyu klik hadisələri
        setupMenuEvents();

        // Çıxış button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutUser);
        }

        // İlkin səhifəni yüklə
        showPage(currentPage);

        console.log('✅ Admin panel uğurla yükləndi');
    } catch (error) {
        console.error('❌ Admin panel yüklənərkən xəta:', error);
        showError('Admin panel yüklənərkən xəta baş verdi. Səhifəni yenidən yükləyin.');
    }

    // Xidmətlər üçün manual event əlavə et
    setupServicesManual();

});

function createNotificationContainer() {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notificationContainer';
    notificationContainer.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
    `;
    document.body.appendChild(notificationContainer);
}

function setupMenuEvents() {
    const menuItems = document.querySelectorAll('.menu-item');
    console.log('Menu item-lər tapıldı:', menuItems.length);

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const page = this.getAttribute('data-page');
            console.log('Menu klik edildi:', page);

            showPage(page);

            // Aktiv menunu güncəllə
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Xidmətlər üçün manual setup
function setupServicesManual() {
    const servicesBtn = document.querySelector('[data-page="content-services"]');
    if (servicesBtn) {
        console.log('✅ Xidmətlər button-u tapıldı');

        // Köhnə event-ləri sil
        const newServicesBtn = servicesBtn.cloneNode(true);
        servicesBtn.parentNode.replaceChild(newServicesBtn, servicesBtn);

        // Yeni event əlavə et
        newServicesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Xidmətlər manual event işə düşdü');
            showPage('content-services');

            // Aktiv menunu güncəllə
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
        });
    }
}

function showPage(pageName) {
    console.log('=== Səhifə dəyişir: ' + pageName + ' ===');

    // Page name mapping dictionary - HTML-dəki ID-lərə uyğun
    const pageMappings = {
        'dashboard': 'dashboardPage',
        'pending': 'pendingPage',
        'all-users': 'allUsersPage',
        'companies': 'companiesPage',
        'employees': 'employeesPage',
        'reports': 'reportsPage',
        'settings': 'settingsPage',
        'content-services': 'contentServicesPage',
        'content-partners': 'contentPartnersPage',
        'content-projects': 'contentProjectPage',
        'logs': 'logsPage'
    };

    const pageId = pageMappings[pageName] || pageName + 'Page';
    console.log('Axtarılan page ID:', pageId);

    // Bütün səhifələri gizlət
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        if (page) {
            page.classList.add('hidden');
            page.style.display = 'none';
        }
    });

    // İstənilən səhifəni göstər
    const pageElement = document.getElementById(pageId);
    console.log(pageId + ' elementi:', pageElement);

    if (pageElement) {
        pageElement.classList.remove('hidden');
        pageElement.style.display = 'block';
        currentPage = pageName;

        console.log('✅ ' + pageName + ' səhifəsi göstərildi');

        // BÜTÜN MENU ITEM-LƏRDƏN ACTIVE CLASS-I SİL
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        // YALNIZ SEÇİLƏN MENU ITEM-Ə ACTIVE CLASS-I ƏLAVƏ ET
        const activeMenuItem = document.querySelector(`.menu-item[data-page="${pageName}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
            console.log('🎯 Aktiv menu item:', pageName);
        }

        // Səhifə xüsusi məlumatlarını yüklə
        switch(pageName) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'pending':
                loadPendingRegistrations();
                break;
            case 'all-users':
                loadAllUsers(); // ✅ Bu funksiya çağırılacaq
                break;
            case 'companies':
                loadCompanies();
                break;
            case 'employees':
                loadEmployeesPage();
                break;
            case 'reports':
                loadReports();
                break;
            case 'logs':
                loadLogs();
                break;
            case 'settings':
                loadSettings();
                break;
            case 'content-services':
                console.log('🎯 Xidmətlər səhifəsi yüklənir...');
                loadServices();
                break;
            case 'content-partners':
                console.log('🤝 Partnyorlar səhifəsi yüklənir...');
                loadPartners();
                break;
            case 'content-projects': // ✅ BU CASE-İ ƏLAVƏ EDİN
                console.log('🚀 Layihələr səhifəsi yüklənir...');
                if (typeof window.loadProjects === 'function') {
                    window.loadProjects();
                } else {
                    console.error('❌ loadProjects funksiyası tapılmadı');
                }
                break;
            default:
                console.log('⚠️ Naməlum səhifə:', pageName);
        }
    } else {
        console.error('❌ ' + pageId + ' elementi tapılmadı!');
        // Dashboard-a qayıt
        const dashboardPage = document.getElementById('dashboardPage');
        if (dashboardPage) {
            dashboardPage.classList.remove('hidden');
            dashboardPage.style.display = 'block';
            currentPage = 'dashboard';

            // Aktiv menu item-ı da düzəlt
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            const dashboardMenuItem = document.querySelector('.menu-item[data-page="dashboard"]');
            if (dashboardMenuItem) {
                dashboardMenuItem.classList.add('active');
            }
        }
    }
}



// Employees səhifəsi
function loadEmployeesPage() {
    if (typeof window.loadEmployees === 'function') {
        window.loadEmployees();
    }
}

// Global refresh funksiyası
window.refreshData = function() {
    console.log('Refresh edilir:', currentPage);

    switch(currentPage) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'pending':
            loadPendingRegistrations(1);
            break;
        case 'all-users':
            loadAllUsers(1);
            break;
        case 'companies':
            loadCompanies(1);
            break;
        case 'employees':
            if (typeof window.loadEmployees === 'function') {
                window.loadEmployees(1);
            }
            break;
        case 'reports':
            loadReports();
            break;
        case 'logs':
            loadLogs();
            break;
        case 'settings':
            loadSettings();
            break;
        case 'content-services':
            loadServices();
            break;
    }
    showSuccess('Məlumatlar yeniləndi');
};

// Notification funksiyaları
function showNotification(message, type = 'info') {
    if (!notificationContainer) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: white;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};
        display: flex;
        justify-content: space-between;
        align-items: center;
        animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          type === 'warning' ? 'fa-exclamation-triangle' : 
                          'fa-info-circle'}" 
               style="color:${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};font-size:20px"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#6c757d;cursor:pointer">
            <i class="fas fa-times"></i>
        </button>
    `;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

// Badge class-ı yoxdursa yarat
if (!document.querySelector('.badge-success')) {
    const style = document.createElement('style');
    style.textContent = `
        .badge { display:inline-block; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:600; color:white; }
        .badge-success { background-color:#28a745; }
        .badge-danger { background-color:#dc3545; }
        .badge-warning { background-color:#ffc107; }
        .badge-info { background-color:#17a2b8; }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* Test üçün */
        .mobile-test {
            position: fixed;
            top: 10px;
            left: 10px;
            background: red;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            z-index: 9999;
        }
    `;
    document.head.appendChild(style);
}


// Qalan funksiyalar (sizin mövcud funksiyalarınız)
async function loadCurrentUser() {
    console.log('loadCurrentUser çağırıldı');
    // İstifadəçi məlumatlarını yüklə
}

async function loadDashboardData() {
    console.log('loadDashboardData çağırıldı');
    // Dashboard məlumatlarını yüklə
}

async function loadPendingRegistrations() {
    console.log('loadPendingRegistrations çağırıldı');
    // Gözləmədə olanları yüklə
}

async function loadAllUsers(page = 1) {
    try {
        console.log('👥 Bütün istifadəçilər yüklənir, səhifə:', page);

        const token = localStorage.getItem('guven_token');
        if (!token) {
            console.error('❌ Token tapılmadı');
            showError('Giriş edilməyib. Yenidən daxil olun.');
            return;
        }

        // Filter parametrləri
        let url = `${API_BASE}/api/v1/admin/users?page=${page}&limit=10`;

        const search = document.getElementById('usersSearch');
        const statusFilter = document.getElementById('usersStatusFilter');
        const typeFilter = document.getElementById('usersTypeFilter');

        if (search && search.value) {
            url += `&search=${encodeURIComponent(search.value)}`;
        }

        if (statusFilter && statusFilter.value !== 'all') {
            url += `&status=${statusFilter.value}`;
        }

        if (typeFilter && typeFilter.value !== 'all') {
            url += `&user_type=${typeFilter.value}`;
        }

        console.log('📡 Request URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP xətası: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ İstifadəçilər alındı:', data.items?.length || 0);

        // İstifadəçiləri göstər
        displayAllUsers(data.items || []);

        // Pagination qur (əgər funksiya varsa)
        if (typeof setupPagination === 'function') {
            setupPagination('usersPagination', data.pages || 1, page, loadAllUsers);
        }

    } catch (error) {
        console.error('❌ İstifadəçilər yüklənərkən xəta:', error);

        const tbody = document.getElementById('allUsersBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Məlumatlar yüklənərkən xəta baş verdi: ${error.message}</p>
                        <button class="btn btn-sm btn-primary mt-2" onclick="loadAllUsers(${page})">
                            <i class="fas fa-redo"></i> Yenidən yüklə
                        </button>
                    </td>
                </tr>
            `;
        }

        showError(`İstifadəçilər yüklənərkən xəta: ${error.message}`);
    }
}

function displayAllUsers(users) {
    const tbody = document.getElementById('allUsersBody');
    if (!tbody) {
        console.error('❌ allUsersBody elementi tapılmadı');
        return;
    }

    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">
                    <div class="alert alert-info mb-0">
                        <i class="fas fa-info-circle me-2"></i>
                        Heç bir istifadəçi tapılmadı
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';

    users.forEach(user => {
        // Status müəyyən et
        let statusClass = 'status-pending';
        let statusText = 'Gözləmədə';
        let statusIcon = 'fa-clock';

        if (user.is_active === true || user.status === 'active') {
            statusClass = 'status-active';
            statusText = 'Aktiv';
            statusIcon = 'fa-check-circle';
        } else if (user.status === 'rejected') {
            statusClass = 'status-rejected';
            statusText = 'Rədd edilib';
            statusIcon = 'fa-times-circle';
        } else if (user.status === 'blocked') {
            statusClass = 'status-rejected';
            statusText = 'Bloklanıb';
            statusIcon = 'fa-ban';
        }

        const fullName = `${user.name || user.ceo_name || ''} ${user.surname || user.ceo_lastname || ''}`.trim() || '-';
        const userType = getUserTypeText(user.user_type);
        const date = user.created_at ? formatDate(user.created_at) : '-';

        html += `
            <tr>
                <td>${user.id || '-'}</td>
                <td><strong>${fullName}</strong></td>
                <td>${user.email || user.ceo_email || '-'}</td>
                <td>${user.phone || user.ceo_phone || '-'}</td>
                <td>
                    <span class="badge bg-secondary">${userType}</span>
                </td>
                <td>${user.company_name || '-'}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        <i class="fas ${statusIcon}"></i> ${statusText}
                    </span>
                </td>
                <td>${date}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewUser(${user.id})" title="Bax">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editUser(${user.id})" title="Redaktə et">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${statusClass === 'status-pending' ? `
                            <button class="action-btn approve" onclick="approveUser(${user.id})" title="Təsdiqlə">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn reject" onclick="rejectUser(${user.id})" title="Rədd et">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="action-btn delete" onclick="deleteUser(${user.id})" title="Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // Status badge-lər üçün CSS tətbiq et
    applyStatusColors();
}

// Helper funksiyalar
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        console.error('Tarix format xətası:', error);
        return '-';
    }
}

function getUserTypeText(type) {
    const types = {
        'admin': 'Sistem Admini',
        'company_admin': 'Şirkət Admini',
        'ceo': 'CEO',
        'employee': 'İşçi',
        'user': 'İstifadəçi'
    };
    return types[type] || type || 'Naməlum';
}

function applyStatusColors() {
    const statusBadges = document.querySelectorAll('.status-badge');
    statusBadges.forEach(badge => {
        const statusClass = badge.classList[1]; // status-active, status-pending, status-rejected
        badge.classList.remove('status-active', 'status-pending', 'status-rejected');

        if (statusClass === 'status-active') {
            badge.classList.add('status-active');
        } else if (statusClass === 'status-rejected') {
            badge.classList.add('status-rejected');
        } else {
            badge.classList.add('status-pending');
        }
    });
}

// Global funksiyalar
window.searchUsers = function() {
    loadAllUsers(1);
};

window.viewUser = function(id) {
    console.log('İstifadəçiyə bax:', id);
    // View modal aç
    showSuccess('İstifadəçi məlumatları göstəriləcək...');
};

window.editUser = function(id) {
    console.log('İstifadəçini redaktə et:', id);
    // Edit modal aç
    showSuccess('İstifadəçi redaktəsi...');
};

window.approveUser = function(id) {
    if (confirm('Bu istifadəçini təsdiqləmək istədiyinizə əminsiniz?')) {
        console.log('İstifadəçi təsdiqlənir:', id);
        showSuccess('İstifadəçi təsdiqləndi');
        loadAllUsers(); // Yenilə
    }
};

window.rejectUser = function(id) {
    if (confirm('Bu istifadəçini rədd etmək istədiyinizə əminsiniz?')) {
        console.log('İstifadəçi rədd edilir:', id);
        showSuccess('İstifadəçi rədd edildi');
        loadAllUsers(); // Yenilə
    }
};

window.deleteUser = function(id) {
    if (confirm('Bu istifadəçini silmək istədiyinizə əminsiniz?')) {
        console.log('İstifadəçi silinir:', id);
        showSuccess('İstifadəçi silindi');
        loadAllUsers(); // Yenilə
    }
};

window.showAddUserModal = function() {
    console.log('Yeni istifadəçi modalı açılır');
    // Modal açma kodu
    showSuccess('Yeni istifadəçi əlavə etmə formu');
};

async function loadCompanies() {
    console.log('loadCompanies çağırıldı');
    // Şirkətləri yüklə
}

async function loadReports() {
    console.log('loadReports çağırıldı');
    // Hesabatları yüklə
}

async function loadLogs() {
    console.log('loadLogs çağırıldı');
    // Logları yüklə
}

async function loadSettings() {
    console.log('loadSettings çağırıldı');
    // Tənzimləmələri yüklə
}

function logoutUser() {
    console.log('logoutUser çağırıldı');
    // Çıxış et
}



// Emergency fix function
window.forceShowContent = function() {
    console.log('🚨 EMERGENCY: Force showing content');

    const adminContent = document.getElementById('adminContent');
    const dashboardPage = document.getElementById('dashboardPage');

    if (adminContent) {
        adminContent.style.display = 'block';
        adminContent.style.visibility = 'visible';
        adminContent.style.opacity = '1';
        adminContent.style.position = 'relative';
        adminContent.style.zIndex = '1';
        adminContent.style.marginLeft = '0';
        adminContent.style.transform = 'none';
    }

    if (dashboardPage) {
        dashboardPage.style.display = 'block';
        dashboardPage.classList.remove('hidden');
    }

    document.body.style.overflow = 'auto';
    document.body.style.backgroundColor = '#f5f7fa';

    console.log('✅ Content forced to show');
};

console.log('✅ core.js tam yükləndi');