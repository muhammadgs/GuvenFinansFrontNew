/**
 * Main Application File
 */

class ProfileApp {
    constructor() {
        console.log('🚀 Profil tətbiqi başladılır...');

        // Servisləri yarat
        this.api = new ApiService();
        this.auth = new AuthService(this.api);
        this.ui = new UIService();  // ✅ ƏVVƏLCƏ UI yarat
        this.profile = new ProfileService(this.api, this.auth);

        // ✅ ƏSAS DÜZƏLİŞ: ProfileService-ə UI referansını təyin et
        this.profile.setUI(this.ui);

        // Qalan servislər
        this.fileService = new FileService(this.api);
        this.employeesService = new EmployeesService(this.api);
        this.companiesService = new CompaniesService(this.api);
        this.permissionsService = new PermissionsService(this.api);
        this.obligationsService = new ObligationsService(this.api);
        this.positionsService = new PositionsService(this.api);
        this.salaryService = new SalaryService(this.api);

        // App state
        this.currentCompanyCode = null;
        this.currentCompanyId = null;
        this.currentUserId = null;

        // Başlat
        this.init();
    }

    async init() {
        try {
            // 1. Auth yoxla
            const isAuthenticated = await this.auth.checkAuthStatus();
            if (!isAuthenticated) {
                console.log('🔴 Auth uğursuz - ApiService artıq yönləndirəcək');
                return;
            }

            console.log('✅ Authentication uğurlu');

            // 2. Current user məlumatlarını yüklə
            await this.loadCurrentUserData();

            // 3. Header-i dəyişdir (ƏVVƏLCƏ BU)
            this.updateHeaderFinalSolution();

            // 4. Profil məlumatlarını yüklə (ŞİRKƏT ADI DA DAXİL)
            console.log('🎯 Profil və şirkət adı yüklənir...');
            await this.loadProfileAndUpdateHeader();

            // 5. Əlavə debug - Şirkət adını yoxla
            console.log('🔍 Şirkət adı yoxlanılır...');
            const companyInput = document.getElementById('company_name');
            if (companyInput) {
                console.log('✅ company_name input-u:', {
                    value: companyInput.value,
                    placeholder: companyInput.placeholder
                });

                // Əgər boşdursa, localStorage-dan doldur
                if (!companyInput.value) {
                    const savedData = localStorage.getItem('userData');
                    if (savedData) {
                        try {
                            const parsed = JSON.parse(savedData);
                            if (parsed.user?.company_name) {
                                companyInput.value = parsed.user.company_name;
                                console.log('🔄 Şirkət adı localStorage-dan dolduruldu:', parsed.user.company_name);
                            }
                        } catch (e) {
                            console.error('❌ localStorage parse error:', e);
                        }
                    }
                }
            }

            // 6. Event listeners qur
            this.setupEventListeners();

            // 7. Şirkət məlumatlarını yüklə
            await this.loadCompanyData();

            this.setupModalListeners();

            // 8. Modul event listener-larını qur
            this.bindModuleButtons();

            // 9. App hazırdır
            this.isInitialized = true;
            this.ui.showNotification('Səhifə hazırdır', 'success');
            console.log('✅ Profil tətbiqi hazırdır!');

        } catch (error) {
            console.error('❌ Başlatma xətası:', error);
        }
    }

    /**
     * Optimallaşdırılmış header yeniləmə funksiyası
     */
    async loadProfileAndUpdateHeader() {
        try {
            console.log('🎯 Profil və header eyni anda yüklənir...');

            // 1. Profil məlumatlarını yüklə
            const profileData = await this.profile.loadProfile();

            // 2. Header-i BİR DƏFƏ yenilə
            this.updateHeaderWithProfileData(profileData);

            // 3. Formu doldur (əgər lazımdırsa)
            if (this.ui.populateForm) {
                this.ui.populateForm(profileData);
            }

            console.log('✅ Profil və header uğurla yeniləndi');
        } catch (error) {
            console.error('❌ Profil yükləmə xətası:', error);
        }
    }

    /**
     * Header-i profildən gələn məlumatlarla yenilə
     */
    updateHeaderWithProfileData(profileData) {
        if (!profileData) return;

        let userName;
        let companyName ;

        // 1. ƏVVƏLCƏ localStorage-dan şirkət adını yoxla
        const savedData = localStorage.getItem('userData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.user && parsed.user.company_name) {
                    companyName = parsed.user.company_name;
                    console.log('🏢 Şirkət adı localStorage-dan:', companyName);
                }
            } catch (e) {
                console.error('❌ localStorage parse error:', e);
            }
        }

        // 2. Əgər hələ "Güvən Finans"dırsa, profildən yoxla
        if (companyName === 'Güvən Finans' && profileData.company_name) {
            companyName = profileData.company_name;
            console.log('🏢 Şirkət adı profildən:', companyName);
        }

        // 3. İstifadəçi adı
        if (profileData.ceo_name && profileData.ceo_lastname) {
            userName = `${profileData.ceo_name} ${profileData.ceo_lastname}`;
        } else if (profileData.firstName && profileData.lastName) {
            userName = `${profileData.firstName} ${profileData.lastName}`;
        }

        console.log('📝 Final header update:', {
            userName,
            companyName,
            hasCompanyInProfile: !!profileData.company_name
        });

        // 4. Header-i yenilə
        this.updateHeaderElements(companyName, userName);
    }

    async loadCurrentUserData() {
        try {
            const userResponse = await this.api.getCurrentUser();
            if (userResponse && userResponse.success && userResponse.user) {
                this.currentUserId = userResponse.user.id;

                // ✅ ƏSAS DÜZƏLİŞ: company_code formatını təmin et
                if (userResponse.user.company_code) {
                    this.currentCompanyCode = userResponse.user.company_code;
                } else if (userResponse.user.companyCode) {
                    this.currentCompanyCode = userResponse.user.companyCode;
                } else {
                    console.warn('⚠️ User object-də company_code tapılmadı');
                }

                // ✅ ƏSAS DÜZƏLİŞ: company_id formatını təmin et
                if (userResponse.user.company_id) {
                    this.currentCompanyId = parseInt(userResponse.user.company_id);
                } else {
                    // Əgər user object-də company_id yoxdursa, API-dən gətir
                    await this.fetchCompanyIdFromCode();
                }

                // ✅ ƏSAS DÜZƏLİŞ: window.app.user-i set et
                window.app = window.app || this;
                window.app.user = {
                    id: this.currentUserId,
                    company_code: this.currentCompanyCode,
                    company_id: this.currentCompanyId,
                    ...userResponse.user
                };

                // ✅ ƏSAS DÜZƏLİŞ: localStorage-də düzgün formatda saxla
                const userDataToStore = {
                    success: true,
                    user: {
                        id: this.currentUserId,
                        company_code: this.currentCompanyCode,
                        company_id: this.currentCompanyId,
                        companyCode: this.currentCompanyCode, // ikinci format
                        ...userResponse.user
                    },
                    message: 'User data loaded'
                };

                localStorage.setItem('userData', JSON.stringify(userDataToStore));

                console.log('👤 User loaded:', {
                    id: this.currentUserId,
                    companyCode: this.currentCompanyCode,
                    companyId: this.currentCompanyId
                });

                console.log('💾 User data saved to localStorage:', this.currentCompanyCode);
            } else {
                console.warn('⚠️ User response formatı düzgün deyil:', userResponse);
            }
        } catch (error) {
            console.error('❌ User data load error:', error);

        }
    }

    /**
     * Header-dakı user adını PROFİL SERVİSİNDƏN alaraq güncəllə
     */
    updateHeaderFromProfileService() {
        try {
            console.log('🎯 Header update from ProfileService başladılır...');

            // 1. Profil servisindən məlumatları al
            if (!this.profile || !this.profile.loadProfile) {
                console.log('❌ ProfileService yoxdur');
                return;
            }

            // 2. Birbaşa API-dən yenidən məlumatları gətir
            this.api.get(`/users/${this.currentUserId}`)
                .then(userData => {
                    console.log('📥 Direct API user data for header:', userData);

                    if (!userData) {
                        console.log('❌ User data gəlmədi');
                        return;
                    }

                    // 3. Adı tap
                    let userName = 'Sahibkar';
                    if (userData.ceo_name && userData.ceo_lastname) {
                        userName = `${userData.ceo_name} ${userData.ceo_lastname}`;
                        console.log('✅ Ceo adı tapıldı (direct API):', userName);
                    } else if (userData.first_name && userData.last_name) {
                        userName = `${userData.first_name} ${userData.last_name}`;
                        console.log('✅ First/last name tapıldı (direct API):', userName);
                    }

                    // 4. Şirkət adını tap
                    let companyName = 'Güvən Finans';
                    if (userData.company_name) {
                        companyName = userData.company_name;
                        console.log('✅ Şirkət adı tapıldı (direct API):', companyName);
                    } else if (userData.companyName) {
                        companyName = userData.companyName;
                    }

                    // 5. Header-dakı elementləri tap və dəyiş
                    this.updateHeaderElements(companyName, userName);
                })
                .catch(error => {
                    console.error('❌ Direct API error:', error);
                });

        } catch (error) {
            console.error('❌ ProfileService header update xətası:', error);
        }
    }

    /**
     * Header elementlərini tap və dəyiş
     */
    updateHeaderElements(companyName, userName) {
        try {
            console.log('🔍 Header elementləri axtarılır...');

            // 1. Header-dakı user info div-i tap
            const userInfoDiv = document.querySelector('.flex.items-center.gap-3.rounded-2xl.bg-white.px-4.py-2.shadow-soft');

            if (userInfoDiv) {
                console.log('✅ User info div tapıldı');

                // Div içindəki p elementlərini tap
                const pElements = userInfoDiv.querySelectorAll('p');

                // Şirkət adı (ilk p elementi)
                if (pElements[0]) {
                    console.log(`Şirkət adı dəyişdirilir: "${pElements[0].textContent}" → "${companyName}"`);
                    pElements[0].textContent = companyName;
                }

                // User adı (ikinci p elementi)
                if (pElements[1]) {
                    console.log(`User adı dəyişdirilir: "${pElements[1].textContent}" → "${userName}"`);
                    pElements[1].textContent = userName;
                }

                console.log('✅ Header uğurla dəyişdirildi');
                return;
            }

            console.log('❌ User info div tapılmadı, alternativ axtarış...');

            // 2. Əgər div tapılmadısa, bütün p elementlərində axtar
            document.querySelectorAll('p').forEach((p, index) => {
                const text = p.textContent.trim();

                // "Sahibkar" yazanı tap
                if (text === 'Sahibkar') {
                    console.log(`✅ "Sahibkar" tapıldı və dəyişdirilir (element ${index})`);
                    p.textContent = userName;
                }

                // "Güvən Finans" yazanı tap
                if (text === 'Güvən Finans') {
                    console.log(`✅ "Güvən Finans" tapıldı və dəyişdirilir (element ${index})`);
                    p.textContent = companyName;
                }
            });

        } catch (error) {
            console.error('❌ Header elements update xətası:', error);
        }
    }

    /**
     * Final header update - hər şeyi cəhd edir
     */
    updateHeaderFinalSolution() {
        try {
            console.log('🚀 FINAL Header solution başladılır...');

            // Məlumatları hazırla
            let userName = 'Sahibkar';
            let companyName = 'Güvən Finans';

            // 1. Əvvəlcə localStorage-dən yoxla
            const savedUser = localStorage.getItem('userData');
            if (savedUser) {
                try {
                    const parsed = JSON.parse(savedUser);
                    if (parsed.user) {
                        const user = parsed.user;

                        if (user.ceo_name && user.ceo_lastname) {
                            userName = `${user.ceo_name} ${user.ceo_lastname}`;
                            console.log('✅ localStorage ceo adı:', userName);
                        }

                        if (user.company_name) {
                            companyName = user.company_name;
                            console.log('✅ localStorage şirkət adı:', companyName);
                        }
                    }
                } catch (e) {
                    console.error('❌ localStorage parse error:', e);
                }
            }

            // 2. Header-dakı bütün elementləri tap
            const header = document.querySelector('header');
            if (header) {
                console.log('✅ Header tapıldı');

                // Header içindəki bütün p elementlərini tap
                header.querySelectorAll('p').forEach((p, index) => {
                    const text = p.textContent.trim();

                    // "Sahibkar" yazanı tap
                    if (text === 'Sahibkar') {
                        p.textContent = userName;
                        console.log(`✅ Header-də "Sahibkar" dəyişdirildi: ${userName}`);
                    }

                    // "Güvən Finans" yazanı tap
                    if (text === 'Güvən Finans') {
                        p.textContent = companyName;
                        console.log(`✅ Header-də "Güvən Finans" dəyişdirildi: ${companyName}`);
                    }
                });
            }

            // 3. Əgər hələ də dəyişməyibsə, bütün səhifədə axtar
            setTimeout(() => {
                document.querySelectorAll('p').forEach(p => {
                    if (p.textContent.includes('Sahibkar')) {
                        p.textContent = userName;
                        console.log('⏱️ Timeout: "Sahibkar" dəyişdirildi');
                    }
                    if (p.textContent.includes('Güvən Finans')) {
                        p.textContent = companyName;
                        console.log('⏱️ Timeout: "Güvən Finans" dəyişdirildi');
                    }
                });
            }, 1000);

        } catch (error) {
            console.error('❌ Final header solution xətası:', error);
        }
    }

    async fetchCompanyIdFromCode() {
        try {
            if (!this.currentCompanyCode) return;

            console.log(`🔍 Şirkət ID gətirilir: ${this.currentCompanyCode}`);

            const response = await this.api.get(`/companies/code/${this.currentCompanyCode}`);

            if (response && response.id) {
                this.currentCompanyId = response.id;
                console.log(`✅ Şirkət ID tapıldı: ${this.currentCompanyId}`);
            }
        } catch (error) {
            console.error('❌ Şirkət ID gətirmə xətası:', error);
            // Default dəyər
            this.currentCompanyId = 1;
        }
    }

    /**
     * Header-dakı user məlumatlarını güncəllə (SADƏ VERSİYA)
     */
    updateHeaderUserInfoSimple() {
        try {
            if (!this.currentUserData) {
                console.log('⚠️ currentUserData yoxdur');
                return;
            }

            const user = this.currentUserData;

            // Adı tap
            let userName = 'Sahibkar';
            if (user.ceo_name && user.ceo_lastname) {
                userName = `${user.ceo_name} ${user.ceo_lastname}`;
            }

            // Şirkət adını tap
            let companyName = user.company_name || user.companyName || 'Güvən Finans';

            console.log('📝 Simple header update:', { companyName, userName });

            // Bütün səhifədə axtar
            const allElements = document.querySelectorAll('p');

            for (let element of allElements) {
                // Şirkət adı üçün
                if (element.textContent === 'Güvən Finans' && element.classList.contains('text-sm') && element.classList.contains('font-semibold')) {
                    element.textContent = companyName;
                    console.log('✅ Şirkət adı tapıldı və güncəlləndi');
                }

                // User adı üçün
                if (element.textContent === 'Sahibkar' && element.classList.contains('text-xs') && element.classList.contains('text-slate-500')) {
                    element.textContent = userName;
                    console.log('✅ User adı tapıldı və güncəlləndi');
                }
            }

        } catch (error) {
            console.error('❌ Simple header update xətası:', error);
        }
    }


    async loadProfileData() {
        try {
            console.log('📋 Profil məlumatları yüklənir...');
            const profileData = await this.profile.loadProfile();
            this.ui.populateForm(profileData);
            this.ui.updateStatusIndicators(profileData);
            console.log('✅ Profil məlumatları yükləndi');
        } catch (error) {
            console.error('❌ Profil yükləmə xətası:', error);
        }
    }

    async loadCompanyData() {
        try {
            if (!this.currentCompanyCode) {
                console.warn('⚠️ Şirkət kodu yoxdur');
                return;
            }

            console.log('🏢 Şirkət məlumatları yüklənir...');

            const companyData = await this.companiesService.loadCompanyData(this.currentCompanyCode);
        } catch (error) {

        }
    }

    setupEventListeners() {
        console.log('🔧 Event listeners qurulur...');

        // Settings menu
        const toggle = document.getElementById('settingsToggle');
        const menu = document.getElementById('settingsMenu');
        if (toggle && menu) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('hidden');
            });
            document.addEventListener('click', () => menu.classList.add('hidden'));
        }

        // Logout
        const logoutBtn = document.getElementById('logoutButton');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (confirm('Hesabdan çıxmaq istədiyinizə əminsiniz?')) {
                    try {
                        await this.auth.logout();
                        this.ui.showNotification('Uğurla çıxış edildi', 'success');
                        setTimeout(() => window.location.href = 'index.html', 1000);
                    } catch (error) {
                        console.error('Logout error:', error);
                        this.ui.showNotification('Çıxış zamanı xəta baş verdi', 'error');
                    }
                }
            });
        }

        // Save profile
        const saveBtn = document.getElementById('saveProfileBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveProfile());
        }

        // Image uploads
        this.setupImageUpload('profileImageUpload', 'profileImageInput', true);
        this.setupImageUpload('companyImageUpload', 'companyImageInput', false);

        // Verification buttons
        ['verifyEmail', 'verifyPhone', 'verifyTelegram'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this[`verify${btnId.replace('verify', '')}`]());
            }
        });

        // Password toggle
        const togglePass = document.getElementById('togglePassword');
        const passInput = document.getElementById('password');
        if (togglePass && passInput) {
            togglePass.addEventListener('click', () => {
                const type = passInput.type === 'password' ? 'text' : 'password';
                passInput.type = type;
                const icon = togglePass.querySelector('i');
                if (icon) icon.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
            });
        }

        console.log('✅ Event listeners quruldu');
    }

    // Modul düymələrini bağlamaq
    bindModuleButtons() {
        console.log('🔧 Modul düymələri bağlanır...');

        // Event listener dublikasiyasını qarşısını almaq üçün flag
        if (this._moduleButtonsBound) {
            console.log('⚠️ Modul düymələri artıq bağlanıb');
            return;
        }

        this._moduleButtonsBound = true;

        // Bütün modul kartlarını tap
        const cards = document.querySelectorAll('.border.border-slate-200.rounded-2xl.p-6');

        cards.forEach((card, index) => {
            // Göz düyməsi (baxış)
            const viewBtn = card.querySelector('button.text-slate-400.hover\\:text-brand-blue');
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openModuleView(index);
                });
            }

            // Əlavə et düyməsi (əlavə)
            const addBtn = card.querySelector('button.text-sm.text-brand-blue.hover\\:underline');
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openModuleAdd(index);
                });
            }
        });

        // ==================== DEPARTAMENT İCAZƏLƏRİ ====================
        // Bu hissəni kart dövrəsindən ÇIXARDIN və ayrıca yazın

        const openPermissionsModalBtn = document.getElementById('openPermissionsModalBtn');
        const addPermissionBtn = document.getElementById('addPermissionBtn');

        // Köhnə event listener-ları sil
        if (openPermissionsModalBtn) {
            openPermissionsModalBtn.replaceWith(openPermissionsModalBtn.cloneNode(true));
        }
        if (addPermissionBtn) {
            addPermissionBtn.replaceWith(addPermissionBtn.cloneNode(true));
        }

        // YENİ Düymələri tap (clone edildikdən sonra)
        const newOpenPermissionsModalBtn = document.getElementById('openPermissionsModalBtn');
        const newAddPermissionBtn = document.getElementById('addPermissionBtn');

        // Event listener əlavə et
        if (newOpenPermissionsModalBtn) {
            console.log('✅ Permissions düyməsi tapıldı, event listener əlavə edilir...');

            const handlePermissionsClick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔐 Departament icazələri modulu açılır (SADƏCƏ 1 DƏFƏ)...');

                // Debounce: 500ms gözlə
                if (this._permissionsClickDebounce) {
                    console.log('⏱️ Çox tez klik, gözləyin...');
                    return;
                }

                this._permissionsClickDebounce = true;
                setTimeout(() => {
                    this._permissionsClickDebounce = false;
                }, 500);

                try {
                    // 1. Əgər modal artıq açıqdırsa, bağla
                    const existingModal = document.getElementById('departmentPermissionsModal');
                    if (existingModal) {
                        console.log('⚠️ Modal artıq açıqdır, bağlanır...');
                        existingModal.remove();
                        return;
                    }

                    // 2. PermissionsService-dən istifadə et
                    if (this.permissionsService && typeof this.permissionsService.openDepartmentPermissions === 'function') {
                        await this.permissionsService.openDepartmentPermissions();
                    } else {
                        console.error('PermissionsService və ya openDepartmentPermissions metodu tapılmadı');
                        this.ui.showNotification('Departament icazələri modulu hazır deyil', 'error');
                    }
                } catch (error) {
                    console.error('❌ Permissions modulu xətası:', error);
                    this.ui.showNotification('Modul açıla bilmədi: ' + error.message, 'error');
                }
            };

            newOpenPermissionsModalBtn.addEventListener('click', handlePermissionsClick);
        }

        if (newAddPermissionBtn) {
            console.log('✅ Add Permission düyməsi tapıldı...');

            newAddPermissionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('➕ İcazələr tənzimlənir...');

                // Eyni funksiyanı çağır
                if (newOpenPermissionsModalBtn) {
                    newOpenPermissionsModalBtn.click();
                }
            });
        }

        console.log('✅ Modul düymələri bağlandı');
    }

    openModuleView(index) {
        const modules = [
            'employees',
            'companies',
            'permissions',
            'obligations',
            'positions',
            'salary'
        ];

        if (modules[index]) {
            console.log(`👁️ ${modules[index]} modulu açılır (baxış)`);
            this[`open${modules[index].charAt(0).toUpperCase() + modules[index].slice(1)}Module`]();
        }
    }

    openModuleAdd(index) {
        const modules = [
            'addEmployee',
            'addCompany',
            'addPermission',
            'addObligation',
            'addPosition',
            'assignSalary'
        ];

        if (modules[index]) {
            console.log(`➕ ${modules[index]} funksiyası çağırılır`);
            this[modules[index]]();
        }
    }

    setupImageUpload(uploadId, inputId, isProfile) {
        const uploadArea = document.getElementById(uploadId);
        const fileInput = document.getElementById(inputId);
        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files[0]) {
                try {
                    await this.fileService.uploadImage(e.target.files[0], isProfile ? 'profile' : 'company');
                    this.ui.showNotification('Şəkil uğurla yükləndi!', 'success');
                } catch (error) {
                    this.ui.showNotification('Şəkil yüklənərkən xəta baş verdi', 'error');
                }
            }
        });
    }

    // Form məlumatlarını almaq
    getFormData() {
        const formData = {
            firstName: document.getElementById('firstName')?.value || '',
            lastName: document.getElementById('lastName')?.value || '',
            fatherName: document.getElementById('fatherName')?.value || '',
            gender: document.getElementById('gender')?.value || '',
            birthDate: document.getElementById('birthDate')?.value || '',
            voen: document.getElementById('voen')?.value || '',
            asanImza: document.getElementById('asanImza')?.value || '',
            asanId: document.getElementById('asanId')?.value || '',
            pin1: document.getElementById('pin1')?.value || '',
            pin2: document.getElementById('pin2')?.value || '',
            puk: document.getElementById('puk')?.value || '',
            finCode: document.getElementById('finCode')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            telegramUsername: document.getElementById('telegramUsername')?.value || '',
            password: document.getElementById('password')?.value || '',

            // ✅ ƏSAS DÜZƏLİŞ: ŞİRKƏT ADINI DA ƏLAVƏ ET
            company_name: document.getElementById('company_name')?.value || ''
        };

        console.log('📝 Form data (with company_name):', formData.company_name);
        return formData;
    }

    async saveProfile() {
        const saveBtn = document.getElementById('saveProfileBtn');
        if (!saveBtn) return;

        this.ui.setLoading(saveBtn, true);

        try {
            const formData = this.getFormData();
            console.log('🔍 DEBUG: Form data company_name:', formData.company_name);

            const validation = this.profile.validateProfileData(formData);
            if (!validation.isValid) {
                this.ui.showFormErrors(validation.errors.map(msg => ({message: msg})));
                throw new Error('Form validasiya xətası');
            }

            await this.profile.updateProfile(formData);

            // ✅ ƏSAS DÜZƏLİŞ: Header-i DƏRHAI YENİLƏ
            if (formData.company_name && formData.company_name.trim() !== '') {
                console.log('🔄 Header şirkət adı ilə yenilənir:', formData.company_name);

                // 1. Header-dakı şirkət adını TAP və DEBUG et
                const companyDisplay = document.getElementById('companyNameDisplay');
                console.log('🔍 DEBUG companyNameDisplay elementi:', {
                    element: companyDisplay,
                    exists: !!companyDisplay,
                    currentText: companyDisplay?.textContent,
                    parent: companyDisplay?.parentElement,
                    allWithId: document.querySelectorAll('[id*="company"]')
                });

                if (companyDisplay) {
                    console.log(`✅ Element tapıldı, dəyişdirilir: "${companyDisplay.textContent}" → "${formData.company_name}"`);
                    companyDisplay.textContent = formData.company_name;
                } else {
                    console.error('❌ companyNameDisplay elementi TAPILMADI!');
                    // Alternativ yolları yoxla
                    this.debugFindHeaderElements();
                }

                // 2. window.app.user obyektini yenilə
                if (window.app && window.app.user) {
                    window.app.user.company_name = formData.company_name;
                }

                // 3. Profil app-də də yenilə
                if (this.currentUserData) {
                    this.currentUserData.company_name = formData.company_name;
                }
            }

            // ✅ İstifadəçi adını da yenilə
            if (formData.firstName && formData.lastName) {
                const userName = `${formData.firstName} ${formData.lastName}`;
                const userDisplay = document.getElementById('userNameDisplay');
                console.log('🔍 DEBUG userNameDisplay elementi:', {
                    element: userDisplay,
                    exists: !!userDisplay,
                    currentText: userDisplay?.textContent
                });

                if (userDisplay) {
                    userDisplay.textContent = userName;
                }
            }

            this.ui.showNotification('Profil məlumatlarınız uğurla yeniləndi!', 'success');

            const passwordField = document.getElementById('password');
            if (passwordField) passwordField.value = '';

        } catch (error) {
            console.error('❌ Profil saxlama xətası:', error);
            if (!error.message.includes('Token') && !error.message.includes('401')) {
                this.ui.showNotification('Profil saxlanarkən xəta baş verdi', 'error');
            }
        } finally {
            this.ui.setLoading(saveBtn, false);
        }
    }

    verifyEmail() {
        const email = document.getElementById('email')?.value;
        if (!email) {
            this.ui.showNotification('Email ünvanı daxil edin', 'error');
            return;
        }
        this.auth.verifyUserEmail(email)
            .then(() => this.ui.showNotification('Təsdiqləmə email-i göndərildi', 'success'))
            .catch(() => this.ui.showNotification('Email təsdiqləmə xətası', 'error'));
    }

    verifyPhone() {
        const phone = document.getElementById('phone')?.value;
        if (!phone) {
            this.ui.showNotification('Telefon nömrəsi daxil edin', 'error');
            return;
        }
        this.auth.verifyUserPhone(phone)
            .then(() => this.ui.showNotification('SMS təsdiqləmə kodu göndərildi', 'success'))
            .catch(() => this.ui.showNotification('Telefon təsdiqləmə xətası', 'error'));
    }

    verifyTelegram() {
        const username = document.getElementById('telegramUsername')?.value;
        if (!username) {
            this.ui.showNotification('Telegram username daxil edin', 'error');
            return;
        }
        this.auth.verifyUserTelegram(username)
            .then(() => this.ui.showNotification('Telegram təsdiqləmə linki göndərildi', 'success'))
            .catch(() => this.ui.showNotification('Telegram təsdiqləmə xətası', 'error'));
    }

    // ==================== MODUL FUNKSİYALARI ====================


    // main.js faylında bu funksiyanı ƏLAVƏ EDİN:
    setupModalListeners() {
        console.log('🔧 Modal düymələri bağlanır...');

        // ==================== 1. İŞÇİLƏR MODAL DÜYMƏSİ ====================
        const employeesBtn = document.getElementById('openEmployeesModalBtn');
        if (employeesBtn) {
            console.log('✅ İşçilər düyməsi tapıldı');

            // Köhnə event listener-ları sil
            employeesBtn.replaceWith(employeesBtn.cloneNode(true));
            const newEmployeesBtn = document.getElementById('openEmployeesModalBtn');

            newEmployeesBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('👥 İşçilər düyməsinə klik edildi');

                try {
                    // Debounce
                    if (this._employeesClickDebounce) {
                        console.log('⏱️ Çox tez klik, gözləyin...');
                        return;
                    }

                    this._employeesClickDebounce = true;
                    setTimeout(() => {
                        this._employeesClickDebounce = false;
                    }, 500);

                    // Cari şirkət kodunu yoxla
                    if (!this.currentCompanyCode) {
                        console.warn('⚠️ Şirkət kodu yoxdur, localStorage yoxlanılır...');
                        await this.loadUserDataFromStorage();
                    }

                    if (!this.currentCompanyCode) {
                        this.ui.showNotification('Şirkət kodu tapılmadı', 'error');
                        return;
                    }

                    console.log(`🏢 İşçilər gətirilir: ${this.currentCompanyCode}`);

                    // EmployeesService-dən istifadə et
                    if (this.employeesService && typeof this.employeesService.openEmployeesModal === 'function') {
                        await this.employeesService.openEmployeesModal();
                    } else {
                        console.error('EmployeesService hazır deyil');
                        this.ui.showNotification('İşçilər modulu hazır deyil', 'error');
                    }
                } catch (error) {
                    console.error('❌ İşçilər modulu xətası:', error);
                    this.ui.showNotification('Xəta: ' + error.message, 'error');
                }
            });

            console.log('✅ İşçilər düyməsi bağlandı');
        }

        // ==================== 2. ŞİRKƏTLƏR MODAL DÜYMƏSİ ====================
        const companiesBtn = document.getElementById('openCompaniesModalBtn');
        if (companiesBtn) {
            console.log('✅ Şirkətlər düyməsi tapıldı');

            // Köhnə event listener-ları sil
            companiesBtn.replaceWith(companiesBtn.cloneNode(true));
            const newCompaniesBtn = document.getElementById('openCompaniesModalBtn');

            newCompaniesBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🏢 Şirkətlər düyməsinə klik edildi');

                try {
                    // Debounce
                    if (this._companiesClickDebounce) {
                        console.log('⏱️ Çox tez klik, gözləyin...');
                        return;
                    }

                    this._companiesClickDebounce = true;
                    setTimeout(() => {
                        this._companiesClickDebounce = false;
                    }, 500);

                    console.log('🚀 Şirkətlər modulu açılır...');

                    // User məlumatlarını təmin et
                    if (!this.currentCompanyCode) {
                        console.warn('⚠️ Şirkət kodu yoxdur, localStorage yoxlanılır...');
                        await this.loadUserDataFromStorage();

                        if (!this.currentCompanyCode) {
                            this.ui.showNotification('Şirkət kodu tapılmadı', 'error');
                            return;
                        }
                    }

                    console.log(`🏢 Cari şirkət: ${this.currentCompanyCode}`);

                    // ÜÇ YOLU YOXLA:

                    // 1. YOL: companies.modal.js faylından (global obyekt)
                    if (window.companiesModal && typeof window.companiesModal.open === 'function') {
                        console.log('📦 Global companiesModal istifadə edilir...');
                        await window.companiesModal.open();
                        return;
                    }

                    // 2. YOL: main.js-dəki instance
                    if (this.companiesService && typeof this.companiesService.open === 'function') {
                        console.log('📦 Local companiesService istifadə edilir...');
                        await this.companiesService.open();
                        return;
                    }

                    // 3. YOL: Yeni instance yarat
                    console.log('🆕 Yeni CompaniesService instance yaradılır...');
                    const CompaniesServiceClass = window.CompaniesService || CompaniesService;
                    if (typeof CompaniesServiceClass === 'function') {
                        this.companiesService = new CompaniesServiceClass();
                        await this.companiesService.open();
                        return;
                    }

                    // Əgər heç biri işləməsə
                    console.error('❌ CompaniesService tapılmadı');
                    this.ui.showNotification('Şirkətlər modulu hazır deyil', 'error');

                } catch (error) {
                    console.error('❌ Şirkətlər modulu xətası:', error);
                    this.ui.showNotification('Xəta: ' + error.message, 'error');
                }
            });

            console.log('✅ Şirkətlər düyməsi bağlandı');
        }

        // ==================== 3. ÜST ŞİRKƏTLƏR (PARTNİORLAR) DÜYMƏSİ ====================
        const partnersBtn = document.getElementById('openPartniorModalBtn');
        if (partnersBtn) {
            console.log('✅ Üst Şirkətlər düyməsi tapıldı');

            // Köhnə event listener-ları sil
            partnersBtn.replaceWith(partnersBtn.cloneNode(true));
            const newPartnersBtn = document.getElementById('openPartniorModalBtn');

            newPartnersBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🤝 Üst Şirkətlər düyməsinə klik edildi');

                try {
                    // Debounce
                    if (this._partnersClickDebounce) {
                        console.log('⏱️ Çox tez klik, gözləyin...');
                        return;
                    }

                    this._partnersClickDebounce = true;
                    setTimeout(() => {
                        this._partnersClickDebounce = false;
                    }, 500);

                    console.log('🚀 Üst Şirkətlər modulu açılır...');

                    // User məlumatlarını təmin et
                    if (!this.currentCompanyCode) {
                        console.warn('⚠️ Şirkət kodu tapılmadı, localStorage yoxlanılır...');
                        const hasUserData = await this.loadUserDataFromStorage();

                        if (!hasUserData || !this.currentCompanyCode) {
                            this.ui.showNotification('Şirkət kodu tapılmadı. Yenidən daxil olun.', 'error');
                            return;
                        }
                    }

                    console.log(`🏢 Cari şirkət: ${this.currentCompanyCode}`);

                    // PartnersService instance yarat VƏ İNİT ET
                    if (!window.partnersModal) {
                        console.log('🆕 PartnersService instance yaradılır VƏ INIT EDİLİR...');
                        window.partnersModal = new PartnersService();

                        // init() METODUNU ÇAĞIR
                        window.partnersModal.init(this.currentCompanyCode);
                    } else if (window.partnersModal.currentCompanyCode !== this.currentCompanyCode) {
                        // Əgər şirkət kodu dəyişibsə, yenidən init et
                        console.log('🔄 Şirkət kodu dəyişib, yenidən init edilir...');
                        window.partnersModal.init(this.currentCompanyCode);
                    }

                    // API Service-in hazır olduğunu yoxla
                    if (!window.partnersModal.apiService) {
                        console.error('❌ API Service hazır deyil');
                        this.ui.showNotification('Modul hazır deyil. Yenidən yoxlayın.', 'error');
                        return;
                    }

                    console.log('📊 API Service hazır:', Object.keys(window.partnersModal.apiService));

                    // Modalı aç
                    if (window.partnersModal && typeof window.partnersModal.open === 'function') {
                        console.log('📦 Global partnersModal.open() çağırılır...');
                        await window.partnersModal.open(this.currentCompanyCode);
                    } else {
                        console.error('❌ partnersModal.open() metodu tapılmadı');
                        this.ui.showNotification('Üst Şirkətlər modulu hazır deyil', 'error');
                    }

                } catch (error) {
                    console.error('❌ Üst Şirkətlər modulu xətası:', error);
                    this.ui.showNotification('Xəta: ' + error.message, 'error');
                }
            });

            console.log('✅ Üst Şirkətlər düyməsi bağlandı');
        }

        // ==================== 4. SƏLAHİYYƏTLƏR DÜYMƏSİ ====================
        const permissionsBtn = document.getElementById('openPermissionsModalBtn');
        if (permissionsBtn) {
            console.log('✅ Səlahiyyətlər düyməsi tapıldı');

            // Köhnə event listener-ları sil
            permissionsBtn.replaceWith(permissionsBtn.cloneNode(true));
            const newPermissionsBtn = document.getElementById('openPermissionsModalBtn');

            newPermissionsBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔐 Səlahiyyətlər düyməsinə klik edildi');

                try {
                    // Debounce
                    if (this._permissionsClickDebounce) {
                        console.log('⏱️ Çox tez klik, gözləyin...');
                        return;
                    }

                    this._permissionsClickDebounce = true;
                    setTimeout(() => {
                        this._permissionsClickDebounce = false;
                    }, 500);

                    console.log('🚀 Departament icazələri modulu açılır...');

                    // User məlumatlarını təmin et
                    if (!this.currentCompanyCode) {
                        console.warn('⚠️ Şirkət kodu yoxdur, localStorage yoxlanılır...');
                        await this.loadUserDataFromStorage();
                    }

                    // PermissionsService-dən istifadə et
                    if (this.permissionsService && typeof this.permissionsService.openDepartmentPermissions === 'function') {
                        await this.permissionsService.openDepartmentPermissions();
                    } else {
                        console.error('PermissionsService hazır deyil');
                        this.ui.showNotification('Səlahiyyətlər modulu hazır deyil', 'error');
                    }

                } catch (error) {
                    console.error('❌ Səlahiyyətlər modulu xətası:', error);
                    this.ui.showNotification('Xəta: ' + error.message, 'error');
                }
            });

            console.log('✅ Səlahiyyətlər düyməsi bağlandı');
        }

        // ==================== 5. VƏZİFƏLƏR DÜYMƏSİ ====================
        const positionsBtn = document.getElementById('openPositionsModalBtn');
        if (positionsBtn) {
            console.log('✅ Vəzifələr düyməsi tapıldı');

            // Köhnə event listener-ları sil
            positionsBtn.replaceWith(positionsBtn.cloneNode(true));
            const newPositionsBtn = document.getElementById('openPositionsModalBtn');

            newPositionsBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('💼 Vəzifələr düyməsinə klik edildi');

                try {
                    // Debounce
                    if (this._positionsClickDebounce) {
                        console.log('⏱️ Çox tez klik, gözləyin...');
                        return;
                    }

                    this._positionsClickDebounce = true;
                    setTimeout(() => {
                        this._positionsClickDebounce = false;
                    }, 500);

                    console.log('🚀 Vəzifələr modulu açılır...');

                    // User məlumatlarını təmin et
                    if (!this.currentCompanyId && !this.currentCompanyCode) {
                        console.warn('⚠️ Şirkət məlumatları yoxdur, localStorage yoxlanılır...');
                        await this.loadUserDataFromStorage();
                    }

                    // PositionsService-dən istifadə et
                    if (this.positionsService && typeof this.positionsService.open === 'function') {
                        await this.positionsService.open();
                    } else {
                        console.error('PositionsService hazır deyil');
                        this.ui.showNotification('Vəzifələr modulu hazır deyil', 'error');
                    }

                } catch (error) {
                    console.error('❌ Vəzifələr modulu xətası:', error);
                    this.ui.showNotification('Xəta: ' + error.message, 'error');
                }
            });

            console.log('✅ Vəzifələr düyməsi bağlandı');
        }

        // ==================== 6. ÖHDƏLİKLƏR DÜYMƏSİ ====================
        const obligationsBtn = document.getElementById('openObligationsModalBtn');
        if (obligationsBtn) {
            console.log('✅ Öhdəliklər düyməsi tapıldı');

            // Köhnə event listener-ları sil
            obligationsBtn.replaceWith(obligationsBtn.cloneNode(true));
            const newObligationsBtn = document.getElementById('openObligationsModalBtn');

            newObligationsBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📋 Öhdəliklər düyməsinə klik edildi');

                try {
                    // Debounce
                    if (this._obligationsClickDebounce) {
                        console.log('⏱️ Çox tez klik, gözləyin...');
                        return;
                    }

                    this._obligationsClickDebounce = true;
                    setTimeout(() => {
                        this._obligationsClickDebounce = false;
                    }, 500);

                    console.log('🚀 Öhdəliklər modulu açılır...');

                    // User məlumatlarını təmin et
                    if (!this.currentCompanyId && !this.currentCompanyCode) {
                        console.warn('⚠️ Şirkət məlumatları yoxdur, localStorage yoxlanılır...');
                        await this.loadUserDataFromStorage();
                    }

                    // ObligationsService-dən istifadə et
                    if (this.obligationsService && typeof this.obligationsService.open === 'function') {
                        await this.obligationsService.open();
                    } else {
                        console.error('ObligationsService hazır deyil');
                        this.ui.showNotification('Öhdəliklər modulu hazır deyil', 'error');
                    }

                } catch (error) {
                    console.error('❌ Öhdəliklər modulu xətası:', error);
                    this.ui.showNotification('Xəta: ' + error.message, 'error');
                }
            });

            console.log('✅ Öhdəliklər düyməsi bağlandı');
        }

        console.log('✅ Bütün modal düymələri bağlandı');
    }

    // localStorage-dən user məlumatlarını yüklə
    async loadUserDataFromStorage() {
        try {
            const savedUser = localStorage.getItem('userData');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);

                if (parsed.user) {
                    this.currentCompanyCode = parsed.user.company_code || parsed.user.companyCode;
                    this.currentCompanyId = parsed.user.company_id;
                    this.currentUserId = parsed.user.id;
                } else {
                    this.currentCompanyCode = parsed.company_code || parsed.companyCode;
                    this.currentCompanyId = parsed.company_id;
                    this.currentUserId = parsed.id;
                }

                console.log('📋 localStorage-dən yükləndi:', this.currentCompanyCode);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ localStorage parsing error:', error);
            return false;
        }
    }

    showParentCompanyInfo() {
        const parentInfo = document.getElementById('parent-company-info');
        if (parentInfo) {
            parentInfo.classList.remove('hidden');

            // window.app.user-dən götür
            const user = window.app?.user || {};

            document.getElementById('parent-company-code').textContent = user.company_code || this.currentCompanyCode || '-';
            document.getElementById('parent-company-name').textContent = user.company_name || user.company_code || '-';
            document.getElementById('parent-total-subs').textContent = this.companiesService.currentCompany?.total_sub_companies || '0';

            // VOEN-i tapmaq üçün cəhd et
            if (user.voen) {
                document.getElementById('parent-company-voen').textContent = user.voen;
            } else if (this.companiesService.currentCompany && this.companiesService.currentCompany.voen) {
                document.getElementById('parent-company-voen').textContent = this.companiesService.currentCompany.voen;
            }
        }
    }


    addCompany() {
        this.ui.showNotification('Yeni şirkət əlavə etmə funksiyası tezliklə', 'info');
    }



    addPermission() {
        this.ui.showNotification('Yeni səlahiyyət əlavə etmə funksiyası tezliklə', 'info');
    }



    addObligation() {
        this.ui.showNotification('Yeni öhdəlik əlavə etmə funksiyası tezliklə', 'info');
    }



    addPosition() {
        this.ui.showNotification('Yeni vəzifə əlavə etmə funksiyası tezliklə', 'info');
    }


    assignSalary() {
        this.ui.showNotification('Maaş təyinatı funksiyası tezliklə', 'info');
    }

}


// Global funksiyalar
window.refreshSubCompanies = async function () {
    try {
        console.log('🔄 Alt şirkətlər yenilənir...');

        if (window.profileApp && window.profileApp.companiesService) {
            const companies = await window.profileApp.companiesService.getAllCompanies();

            if (window.profileApp.companiesService.displayCompaniesTable) {
                window.profileApp.companiesService.displayCompaniesTable(companies);
                window.profileApp.showParentCompanyInfo();
            }
        } else if (window.app && window.app.companiesService) {
            const companies = await window.app.companiesService.getAllCompanies();

            if (window.app.companiesService.displayCompaniesTable) {
                window.app.companiesService.displayCompaniesTable(companies);
                window.app.showParentCompanyInfo();
            }
        }
    } catch (error) {
        console.error('❌ Yeniləmə xətası:', error);
        // ✅ DƏYİŞİKLİK: Error mesajı göstərmə
        // alert(`Yeniləmə xətası: ${error.message}`);
    }
};


// Check localStorage button
window.checkLocalStorage = function () {
    const data = localStorage.getItem('userData');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            alert(`LocalStorage userData:\n\nCompany Code: ${parsed.user?.company_code || parsed.company_code || 'Not found'}\nUser ID: ${parsed.user?.id || parsed.id || 'Not found'}`);
        } catch (e) {
            alert('LocalStorage parsing error');
        }
    } else {
        alert('LocalStorage userData not found');
    }
};

// App-i başlat - DÜZƏLDİLMİŞ VERSİYA
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 DOM Content Loaded - App başladılır...');

        // ProfileApp instance yarat
        window.profileApp = new ProfileApp();

        // window.app referansını da qoy
        window.app = window.profileApp;

        console.log('✅ App instance yaradıldı:', window.profileApp);

    } catch (error) {
        console.error('❌ App başlatma xətası:', error);

    }
});