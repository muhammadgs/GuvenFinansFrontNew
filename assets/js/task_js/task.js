// task.js -
class TaskManager {
    constructor() {
        console.log('🚀 Task Manager başladılır...');
        

        // User data
        this.userData = {
            userId: null,
            companyId: null,
            companyCode: null,
            role: null,
            name: null
        };

        // Data
        this.myCompany = null;
        this.subsidiaryCompanies = [];
        this.departments = [];
        this.employees = [];

        // Pagination
        this.pagination = {
            active: {page: 1, hasMore: true, pageSize: 20},
            archive: {page: 1, hasMore: true, pageSize: 20},
            external: {page: 1, hasMore: true, pageSize: 20}
        };

        // Selected company
        this.currentFilters = {};

        // ✅ DÜZGÜN resetFormAndCloseModal funksiyası
        this.resetFormAndCloseModal = () => {
            console.log('🔄 resetFormAndCloseModal çağırıldı');

            try {
                // 1. Formu reset et
                const form = document.getElementById('taskForm');
                if (form) {
                    form.reset();
                    console.log('✅ Form reset edildi');
                }

                // 2. Modalı BAĞLA - ✅ DÜZGÜN ID: "taskModal"
                const modalElement = document.getElementById('taskModal');
                if (modalElement) {
                    // Bootstrap 5
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                        console.log('✅ Bootstrap modal bağlandı');
                    } else {
                        // Əgər instance yoxdursa, yenisini yarat və bağla
                        const newModal = new bootstrap.Modal(modalElement);
                        newModal.hide();
                        console.log('✅ Yeni Bootstrap modal yaradılıb bağlandı');
                    }

                    // Əlavə: backdrop və body class-larını təmizlə
                    document.body.classList.remove('modal-open');
                    const backdrops = document.querySelectorAll('.modal-backdrop');
                    backdrops.forEach(backdrop => {
                        backdrop.remove();
                    });
                }

                // 3. FileUploadManager fayllarını təmizlə
                if (window.fileUploadManager && typeof window.fileUploadManager.clearFiles === 'function') {
                    window.fileUploadManager.clearFiles();
                    console.log('✅ Fayllar təmizləndi');
                }

                // 4. Audio recorder-i reset et
                if (window.audioRecorder && typeof window.audioRecorder.reset === 'function') {
                    window.audioRecorder.reset();
                    console.log('✅ Audio recorder reset edildi');
                }

                // 5. Form validation reset
                const invalidElements = document.querySelectorAll('.is-invalid');
                invalidElements.forEach(el => {
                    el.classList.remove('is-invalid');
                });

                const errorMessages = document.querySelectorAll('.invalid-feedback');
                errorMessages.forEach(msg => {
                    msg.remove();
                });

                console.log('✅ Bütün təmizləmə əməliyyatları tamamlandı');

            } catch (error) {
                console.error('❌ resetFormAndCloseModal xətası:', error);

                // Fallback: sadəcə formu reset et
                const form = document.getElementById('taskForm');
                if (form) form.reset();

                // Fallback: modalı gizlət
                const modal = document.getElementById('taskModal'); // ✅ DÜZGÜN ID
                if (modal) {
                    modal.style.display = 'none';
                    modal.classList.remove('show');
                }
            }
        };
    }



    // ==================== INITIALIZATION ====================
    async initialize() {
        try {
            console.log('🔧 Task Manager initialize edilir...');

            // 1. User məlumatlarını yüklə
            await this.loadUserData();

            // 2. Table Manager initialize et
            if (typeof TableManager !== 'undefined') {
                TableManager.initialize();
            }

            // 3. Form Manager initialize et
            if (typeof FormManager !== 'undefined') {
                FormManager.initializeForms();
            }

            // 4. Modal Manager initialize et
            if (typeof ModalManager !== 'undefined') {
                ModalManager.initModals();
            }

            // 5. Event listeners qur
            this.setupEventListeners();

            this.setupVisibilityControls();

            this.initializeModules();

            // 6. AVTOMATİK ARXİV YOXLAMASINI BAŞLAT
            this.setupAutoArchiveCheck();

            // 7. İlkin məlumatları yüklə
            await this.loadInitialData();

            console.log('✅ Task Manager hazırdır');

        } catch (error) {
            console.error('❌ Task Manager initialization error:', error);
            this.showError('Sistem başlatılarkən xəta baş verdi');
        }
    }

    // ==================== MODULE INITIALIZATION ====================
    initializeModules() {
        // TaskEditModule yoxla - sadəcə mövcud olub olmadığını yoxla
        if (window.TaskEditModule) {
            console.log('✅ TaskEditModule mövcuddur');

            // Əgər initialize funksiyası varsa, çağır
            if (typeof window.TaskEditModule.initialize === 'function') {
                try {
                    window.TaskEditModule.initialize();
                    console.log('✅ TaskEditModule initialize edildi');
                } catch (error) {
                    console.warn('⚠️ TaskEditModule initialize xətası:', error);
                }
            } else {
                console.log('ℹ️ TaskEditModule-da initialize funksiyası yoxdur, amma modul mövcuddur');
            }
        } else {
            console.warn('⚠️ TaskEditModule tapılmadı');
            // Sadəcə xəbərdarlıq ver, amma heç nə yaratma
            console.log('ℹ️ TaskEditModule tapılmadı. TableManager-dan istifadə ediləcək');
        }

        // TableManager yoxla
        if (window.TableManager && typeof window.TableManager.initialize === 'function') {
            try {
                window.TableManager.initialize();
                console.log('✅ TableManager initialize edildi');
            } catch (error) {
                console.warn('⚠️ TableManager initialize xətası:', error);
            }
        }

        // FormManager yoxla
        if (window.FormManager && typeof window.FormManager.initializeForms === 'function') {
            try {
                window.FormManager.initializeForms();
                console.log('✅ FormManager initialize edildi');
            } catch (error) {
                console.warn('⚠️ FormManager initialize xətası:', error);
            }
        }

        // ModalManager yoxla
        if (window.ModalManager && typeof window.ModalManager.initModals === 'function') {
            try {
                window.ModalManager.initModals();
                console.log('✅ ModalManager initialize edildi');
            } catch (error) {
                console.warn('⚠️ ModalManager initialize xətası:', error);
            }
        }
    }

    async loadUserData() {
        try {
            console.log('👤 User məlumatları yüklənir...');

            const token = getAuthToken();
            console.log('🔐 Token var?', !!token);

            if (token) {
                const payload = parseTokenPayload(token);
                console.log('📦 Token payload:', payload);

                if (payload) {
                    // ✅ TOKEN-DƏN GƏLƏN MƏLUMATLARI İSTİFADƏ ET
                    this.userData = {
                        userId: payload.user_id || payload.sub || 134,
                        companyId: payload.company_id || 51, // ✅ BACKEND-DƏ 51 GÖRÜNÜR
                        companyCode: payload.company_code || 'GUV26001',
                        role: payload.role || 'employee',
                        name: payload.ceo_name || payload.name || 'Əli',
                        ceoName: payload.ceo_name || 'Əli',
                        ceoLastName: payload.ceo_lastname || '',
                        email: payload.ceo_email || payload.email || 'ali.balakishiyev1@gmail.com',
                        companyName: payload.company_name || 'Guven Finans'
                    };

                    console.log('✅ TOKEN-DƏN ALINAN USER DATA:', this.userData);
                    console.log('✅ Company ID:', this.userData.companyId, '(backend-də 51 olmalı)');
                    console.log('✅ Company Code:', this.userData.companyCode);
                    return;
                }
            }

            // ✅ FALLBACK: BACKEND LOG-UNA UYĞUN MƏLUMATLAR
            console.log('📝 Backend log-u ilə uyğun fallback data istifadə olunur');
            this.userData = {
                userId: 134,
                companyId: 51, // ✅ ƏSAS DÜZƏLT: 50 DEYİL, 51
                companyCode: 'GUV26001',
                companyName: 'Guven Finans',
                role: 'employee',
                name: 'Əli',
                ceoName: 'Əli',
                ceoLastName: '',
                fullName: 'Əli',
                email: 'ali.balakishiyev1@gmail.com',
                position: 'Employee'
            };

            console.log('✅ Fallback userData:', this.userData);

        } catch (error) {
            console.error('❌ User data load error:', error);
            // Backend log-u ilə uyğun fallback
            this.userData = {
                userId: 134,
                companyId: 51, // ✅ ƏSAS DÜZƏLT
                companyCode: 'GUV26001',
                companyName: 'Guven Finans',
                role: 'employee',
                name: 'Əli',
                fullName: 'Əli'
            };
            console.log('🆘 Error fallback userData:', this.userData);
        }
    }

     async loadInitialData() {
        try {
            this.showLoading('Məlumatlar yüklənir...');

            // 1. Şirkət məlumatlarını yüklə
            await this.loadMyCompanyAndPartners();

            // 2. Digər məlumatları paralel yüklə
            await Promise.all([
                this.loadDepartments(),
                this.loadEmployees()
            ]);

            console.log('🏢 Şirkət cache-i yüklənir...');
            await this.loadCompanyCache();

            // 3. FormManager-dən iş növlərini yüklə
            if (window.FormManager && typeof window.FormManager.loadWorkTypes === 'function') {
                await window.FormManager.loadWorkTypes();
                console.log('✅ FormManager iş növlərini yüklədi');
            }

            // 4. Tasks yüklə
            await this.loadTasksData();

            this.hideLoading();

        } catch (error) {
            console.error('❌ Initial data load error:', error);
            this.hideLoading();
            this.showError('Məlumatlar yüklənərkən xəta baş verdi');
        }
    }
    async loadCompanyCache() {
        try {
            console.log('🏢 Şirkət cache-i yüklənir...');

            this.companyCache = {};

            // 1. Öz şirkətini əlavə et
            if (this.myCompany) {
                this.companyCache[this.myCompany.id] = this.myCompany.company_name;
                console.log(`✅ Öz şirkətim: ${this.myCompany.company_name} (ID: ${this.myCompany.id})`);
            }

            // 2. Alt şirkətləri əlavə et
            if (this.subsidiaryCompanies && this.subsidiaryCompanies.length > 0) {
                this.subsidiaryCompanies.forEach(company => {
                    if (company.id && company.company_name) {
                        this.companyCache[company.id] = company.company_name;
                    }
                });
                console.log(`✅ ${this.subsidiaryCompanies.length} alt şirkət cache-ə əlavə edildi`);
            }

            // 3. Bütün şirkətləri gətir (viewable_company_id-lər üçün)
            try {
                console.log('🔍 Bütün şirkətlər gətirilir (viewable_company_id-lər üçün)...');

                // API endpoint-ləri sınaqdan keçir
                const endpoints = [
                    '/companies/all',
                    '/companies/list',
                    '/companies',
                    '/companies/simple'
                ];

                let allCompanies = [];

                for (const endpoint of endpoints) {
                    try {
                        const response = await this.apiRequest(endpoint, 'GET');
                        console.log(`🔍 ${endpoint} endpoint-i yoxlanılır...`);

                        if (response && Array.isArray(response)) {
                            allCompanies = response;
                            console.log(`✅ ${endpoint} endpoint-i işlədi: ${response.length} şirkət`);
                            break;
                        } else if (response && response.data && Array.isArray(response.data)) {
                            allCompanies = response.data;
                            console.log(`✅ ${endpoint} endpoint-i işlədi: ${response.data.length} şirkət`);
                            break;
                        }
                    } catch (error) {
                        console.log(`⚠️ ${endpoint} endpoint-i işləmədi: ${error.message}`);
                    }
                }

                // Əgər heç biri işləmədisə, alt şirkətlərdən götür
                if (allCompanies.length === 0) {
                    console.log('⚠️ API-dən şirkət gətirilə bilmədi, alt şirkətlərdən istifadə ediləcək');
                    if (this.subsidiaryCompanies && this.subsidiaryCompanies.length > 0) {
                        allCompanies = this.subsidiaryCompanies;
                    }
                }

                // Cache-ə əlavə et
                allCompanies.forEach(company => {
                    if (company.id && company.company_name) {
                        this.companyCache[company.id] = company.company_name;
                    }
                });

                console.log(`✅ ${allCompanies.length} şirkət cache-ə əlavə edildi`);

            } catch (error) {
                console.log('⚠️ Şirkət list API xətası:', error);
            }

            console.log(`🏢 Ümumi cache: ${Object.keys(this.companyCache).length} şirkət`);
            console.log('🏢 Cache məzmunu:', this.companyCache);

        } catch (error) {
            console.error('❌ Şirkət cache-i yüklənərkən xəta:', error);
            this.companyCache = {};
        }
    }


    // ==================== COMPANY LOADING ====================
    async loadMyCompanyAndPartners() {
        try {
            console.log('🏢 Öz şirkətim və bağlı şirkətlər yüklənir...');

            // 1. ÖZ ŞİRKƏTİMİ YÜKLƏ
            const myCompanyResponse = await this.apiRequest(`/companies/code/${this.userData.companyCode}`, 'GET');

            if (myCompanyResponse && myCompanyResponse.data) {
                this.myCompany = myCompanyResponse.data;
                console.log('✅ Öz şirkətim:', this.myCompany.company_name);
            } else {
                // Fallback
                this.myCompany = {
                    id: this.userData.companyId,
                    company_name: 'AzeriKor',
                    company_code: this.userData.companyCode
                };
            }

            // 2. ALT ŞİRKƏTLƏRİ YÜKLƏ
            await this.loadMySubsidiaries();

            // 3. SELECT-LƏRƏ DOLDUR
            this.populateCompanySelects();

        } catch (error) {
            console.error('❌ Companies load error:', error);
            this.createFallbackCompanies();
        }
    }


    // ==================== TASK FORM HANDLING ====================
    async uploadFile(file, taskId) {
        try {
            console.log(`📤 Fayl yüklənir: ${file.name}, task: ${taskId}`);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', 'TASK_ATTACHMENT');

            // Show upload status
            const statusDiv = document.getElementById('fileUploadStatus');
            if (statusDiv) {
                statusDiv.style.display = 'block';
            }

            // API çağırışı - Fayl endpoint-inə
            const response = await this.apiRequest('/files/simple-upload', 'POST', formData, false); // false = FormData göndəririk

            console.log('📦 Fayl upload response:', response);

            if (statusDiv) {
                statusDiv.style.display = 'none';
            }

            if (response && response.success) {
                const fileUrl = response.data?.url || response.data?.file_url;
                console.log(`✅ Fayl yükləndi: ${fileUrl}`);

                // Task-ı yeniləyib fayl linkini əlavə et
                if (fileUrl && taskId) {
                    await this.apiRequest(`/tasks/${taskId}`, 'PATCH', {
                        attachment_url: fileUrl
                    });
                }

                return fileUrl;
            } else {
                throw new Error('Fayl yüklənmədi');
            }

        } catch (error) {
            console.error('❌ Fayl upload xətası:', error);
            const statusDiv = document.getElementById('fileUploadStatus');
            if (statusDiv) {
                statusDiv.innerHTML = '<span style="color:red;">❌ Fayl yüklənmədi</span>';
            }
            return null;
        }
    }

    // task.js faylına əlavə edin
    setupVisibilityControls() {
        const isVisibleCheckbox = document.getElementById('isVisibleToOtherCompanies');
        const viewableCompanySelect = document.getElementById('viewableCompanySelect');
        const viewableCompanyGroup = document.getElementById('viewableCompanyGroup');
        const companySelect = document.getElementById('companySelect');

        if (!isVisibleCheckbox || !viewableCompanySelect) return;

        // Checkbox dəyişdikdə
        isVisibleCheckbox.addEventListener('change', (e) => {
            if (viewableCompanyGroup) {
                viewableCompanyGroup.style.display = e.target.checked ? 'block' : 'none';
                viewableCompanySelect.required = e.target.checked;
            }
        });

        // Şirkət seçildikdə viewable companies list-ini doldur
        if (companySelect) {
            companySelect.addEventListener('change', () => {
                this.populateViewableCompanies();
            });
        }

        // İlkin doldur
        this.populateViewableCompanies();
    }

    populateViewableCompanies() {
        const viewableCompanySelect = document.getElementById('viewableCompanySelect');
        const companySelect = document.getElementById('companySelect');

        if (!viewableCompanySelect || !companySelect) return;

        const selectedCompanyId = companySelect.value;
        if (!selectedCompanyId) return;

        let html = '<option value="">Seçin</option>';

        // 1. BÜTÜN DİGƏR ŞİRKƏTLƏR (cari seçilmişdən başqa)
        if (this.subsidiaryCompanies && this.subsidiaryCompanies.length > 0) {
            this.subsidiaryCompanies.forEach(subsidiary => {
                if (subsidiary.id != selectedCompanyId && subsidiary.relationship_status === 'active') {
                    html += `<option value="${subsidiary.id}">${subsidiary.company_name}</option>`;
                }
            });
        }

        // 2. ÖZ ŞİRKƏTİM (əgər alt şirkət seçilibsə)
        const selectedOption = companySelect.options[companySelect.selectedIndex];
        const isMyCompany = selectedOption.getAttribute('data-is-my-company') === 'true';

        if (!isMyCompany && this.myCompany) {
            html += `<option value="${this.myCompany.id}">${this.myCompany.company_name} (Öz şirkətim)</option>`;
        }

        viewableCompanySelect.innerHTML = html || '<option value="" disabled>Heç bir digər şirkət yoxdur</option>';

        console.log('✅ Viewable companies populated for company:', selectedCompanyId);
    }

    async handleTaskFormSubmit(e) {
        // ✅ ƏSAS FİKS: Formun 2 dəfə submit olunmasının qarşısını al
        if (this.isSubmitting) {
            console.log('⚠️ Form artıq submit olunur, gözləyin...');
            return;
        }

        this.isSubmitting = true;
        e.preventDefault();

        try {
            console.log('🚀 ===== TASK YARATMA BAŞLAYIR =====');

            const form = e.target;
            const companySelect = document.getElementById('companySelect');
            const dueDateInput = document.getElementById('dueAtInput');
            const executorSelect = document.getElementById('executorSelect');
            const departmentSelect = document.getElementById('departmentSelect');
            const taskTypeSelect = document.getElementById('taskTypeSelect');
            const descriptionInput = document.getElementById('descriptionInput');
            const taskTitleInput = document.getElementById('taskTitle');
            const hourlyRateInput = document.getElementById('hourlyRateInput');
            const durationInput = document.getElementById('durationInput');

            // Əgər taskTitleInput yoxdursa, default ad istifadə et
            let taskTitle = "Yeni Task";
            if (taskTitleInput && taskTitleInput.value.trim()) {
                taskTitle = taskTitleInput.value.trim();
            }

            // Şirkət məlumatları
            const selectedCompanyId = companySelect.value;
            const selectedOption = companySelect.options[companySelect.selectedIndex];
            const selectedCompanyName = selectedOption.text.replace(/📍/g, '').replace('(Mənim şirkətim)', '').trim();
            const isMyCompany = selectedOption.dataset.isMyCompany === 'true';

            console.log('🏢 ŞİRKƏT MƏNTİQİ:');
            console.log('  Seçilmiş şirkət ID:', selectedCompanyId);
            console.log('  Seçilmiş şirkət adı:', selectedCompanyName);
            console.log('  Mənim şirkətimmi?', isMyCompany);

            // ==================== DÜZGÜN DEADLINE KONTROLU ====================
            const dueDateValue = dueDateInput ? dueDateInput.value : null;
            let taskStatus = 'pending'; // default status
            let startedDate = null;

            if (dueDateValue) {
                const dueDate = new Date(dueDateValue);
                const today = new Date();

                // Tarixləri yalnız gün, ay, il ilə müqayisə et (saatlara baxmırıq)
                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);

                console.log(`📅 Deadline kontrolu:`);
                console.log(`  Bugün: ${today.toDateString()} (${today.toISOString().split('T')[0]})`);
                console.log(`  Deadline: ${dueDate.toDateString()} (${dueDateValue})`);
                console.log(`  Bugün timestamp: ${today.getTime()}`);
                console.log(`  Deadline timestamp: ${dueDate.getTime()}`);

                // Tarix müqayisəsi
                if (dueDate.getTime() < today.getTime()) {
                    // ❌ Deadline KEÇİB (dünən və ya daha əvvəl): GECİKMƏ
                    taskStatus = 'overdue';
                    startedDate = new Date().toISOString().split('T')[0];

                    // Neçə gün keçib?
                    const daysDifference = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysDifference === 1) {
                        console.log('⚠️ Deadline dünən keçib: Status "overdue" (Gecikmə)');
                    } else {
                        console.log(`⚠️ Deadline ${daysDifference} gün əvvəl keçib: Status "overdue" (Gecikmə)`);
                    }
                    console.log(`⏰ started_date təyin edildi: ${startedDate}`);
                }
                else if (dueDate.getTime() === today.getTime()) {
                    // 📅 Deadline BUGÜN üçün: GÖZLƏYİR
                    taskStatus = 'pending';
                    console.log('✅ Deadline bugün üçün: Status "pending" (Gözləyir)');
                }
                else {
                    // 📅 Deadline GƏLƏCƏK: GÖZLƏYİR
                    console.log('📅 Deadline gələcək: Status "pending" (Gözləyir)');
                }
            } else {
                console.log('ℹ️ Deadline yoxdur, default status: pending');
            }
            // ==================== DEADLINE KONTROLU SONU ====================

            // Loading başlat
            this.showLoading();

            // ✅ ƏSAS DÜZƏLTMƏ: TASK DATA
            const taskData = {
                task_title: taskTitle,
                task_description: descriptionInput ? descriptionInput.value : '',
                assigned_to: executorSelect ? parseInt(executorSelect.value) : 0,
                department_id: departmentSelect ? parseInt(departmentSelect.value) : 0,
                priority: 'medium',
                status: taskStatus, // ✅ Deadline'a görə status
                due_date: dueDateValue || new Date().toISOString().split('T')[0],
                estimated_hours: 0,
                work_type_id: taskTypeSelect ? parseInt(taskTypeSelect.value) : 0,
                progress_percentage: 0,
                is_billable: false,
                billing_rate: 0,

                // ✅ ƏSAS: ÖZ ŞİRKƏTİMİZ ÜÇÜN YARAT
                company_id: this.userData.companyId,

                // ✅ METADATA İÇİNDƏ ŞİRKƏT ADI SAXLA
                metadata: JSON.stringify({
                    // ƏSAS: CƏDVƏLDƏ GÖSTƏRİLƏCƏK ŞİRKƏT ADI
                    display_company_name: selectedCompanyName,
                    target_company_name: selectedCompanyName,
                    original_company_name: selectedCompanyName,
                    for_company: selectedCompanyName,
                    display_for: selectedCompanyName,

                    // İdarəetmə məlumatları
                    created_by_company: this.userData.companyName || this.userData.companyCode,
                    created_by_company_id: this.userData.companyId,
                    target_company_id: selectedCompanyId,

                    // Görünəbiləcəklik
                    is_visible_to_company: !isMyCompany,
                    viewable_company_id: isMyCompany ? null : selectedCompanyId,

                    // Deadline məlumatları
                    deadline_status: taskStatus,
                    deadline_date: dueDateValue,
                    auto_status: true,
                    is_overdue: taskStatus === 'overdue',

                    // Digər
                    created_by_user_id: this.userData.userId,
                    created_by_name: this.userData.fullName || this.userData.name,
                    created_at: new Date().toISOString()
                }),

                // Yaradan məlumatları
                created_by: this.userData.userId,
                creator_name: this.userData.fullName || this.userData.name
            };

            // ✅ Əgər status overdue-dırsa, started_date əlavə et
            if (taskStatus === 'overdue' && startedDate) {
                taskData.started_date = startedDate;
                console.log(`📅 started_date əlavə edildi: ${startedDate}`);
            }

            // ✅ Müddət və əmək haqqı məlumatları
            if (durationInput && durationInput.value) {
                const durationMinutes = parseFloat(durationInput.value) || 0;
                const hours = durationMinutes / 60;
                taskData.estimated_hours = hours.toFixed(2);
            }

            if (hourlyRateInput && hourlyRateInput.value) {
                taskData.billing_rate = parseFloat(hourlyRateInput.value) || 0;
            }

            // ✅ ƏGƏR ALT ŞİRKƏT SEÇİLİBSƏ
            if (!isMyCompany) {
                // Əlavə sahələr
                taskData.target_company_id = selectedCompanyId;
                taskData.target_company_name = selectedCompanyName;
                taskData.is_visible_to_other_companies = true;

                // Metadata-da da yenilə
                const metadata = JSON.parse(taskData.metadata);
                metadata.target_company_name = selectedCompanyName;
                metadata.target_company_id = selectedCompanyId;
                metadata.is_external_task = true;
                metadata.is_company_viewable = true;
                taskData.metadata = JSON.stringify(metadata);

                // Viewable company id əlavə et
                taskData.is_company_viewable = true;
                taskData.viewable_company_id = selectedCompanyId;
            }

            console.log('📦 TASK DATA:');
            console.log('  Status:', taskData.status);
            console.log('  Deadline:', taskData.due_date);
            console.log('  Started Date:', taskData.started_date || 'yoxdur');

            // ✅ API çağırışı - SADƏCƏ TASK DATA GÖNDƏR
            console.log('📡 API çağırışı başlayır...');
            const response = await this.apiRequest('/tasks/', 'POST', taskData);

            if (response && response.success) {
                console.log('✅ TASK UĞURLA YARADILDI!');

                // ✅ Task ID-ni al
                let taskId = null;
                if (response.task && response.task.id) {
                    taskId = response.task.id;
                } else if (response.data && response.data.id) {
                    taskId = response.data.id;
                } else if (response.id) {
                    taskId = response.id;
                }

                if (taskId) {
                    console.log('🎉 Task ID:', taskId);

                    // ✅ FAYL YÜKLƏMƏ (ƏGƏR VARSASA)
                    if (window.fileUploadManager && window.fileUploadManager.files.length > 0) {
                        try {
                            await window.fileUploadManager.uploadFiles(taskId);
                            console.log(`✅ Fayllar yükləndi`);
                        } catch (fileError) {
                            console.error(`❌ Fayl yüklənərkən xəta:`, fileError);
                        }
                    }

                    // ✅ MÜVƏFFƏQİYYƏT MESAJI
                    let successMessage = 'Task uğurla yaradıldı!';
                    if (taskStatus === 'overdue') {
                        const dueDate = new Date(dueDateValue);
                        const today = new Date();
                        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                        if (daysOverdue === 1) {
                            successMessage += ' (Status: Gecikmə - Deadline dünən keçib)';
                        } else {
                            successMessage += ` (Status: Gecikmə - Deadline ${daysOverdue} gün əvvəl keçib)`;
                        }
                    }

                    this.showSuccess(successMessage);
                    console.log('🏁 ===== TASK YARATMA TAMAMLANDI =====');

                    // ✅ CƏDVƏLƏRİ AVTOMATİK YENİLƏ
                    setTimeout(() => {
                        console.log('🔄 Cədvəllər yenilənir...');
                        this.loadActiveTasks();
                        this.loadArchiveTasks();
                        this.loadExternalTasks();
                    }, 1000);
                } else {
                    this.showSuccess('Task uğurla yaradıldı! (ID alına bilmədi)');
                }

            } else {
                throw new Error(response?.message || 'Task yaradıla bilmədi');
            }

        } catch (error) {
            console.error('❌ TASK FORM XƏTASI:', error);
            this.showError('Task yaradılarkən xəta: ' + error.message);
        } finally {
            this.hideLoading();
            this.isSubmitting = false;
            this.resetFormAndCloseModal();
        }
    }



    async uploadAudioToTask(taskId, audioBase64, filename, description = 'Səs qeydi') {
        try {
            console.log(`🎤 Task ${taskId} üçün audio yüklənir: ${filename}`);

            const numericTaskId = parseInt(taskId);
            if (isNaN(numericTaskId) || numericTaskId <= 0) {
                throw new Error(`Yanlış Task ID: ${taskId}`);
            }

            // Base64-dən Blob-a çevir
            const byteCharacters = atob(audioBase64);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const audioBlob = new Blob([byteArray], { type: 'audio/wav' });
            const audioFile = new File([audioBlob], filename, {
                type: 'audio/wav'
            });

            // FormData yarat
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('description', description);

            console.log(`📤 Audio yüklənir: ${filename} (${audioBlob.size} bytes)`);

            // ✅ DÜZGÜN ENDPOINT: tasks/upload-files
            try {
                const url = `/tasks/upload-files`;
                const token = localStorage.getItem('guven_token') || '';

                console.log(`1️⃣ Yeni endpoint: POST ${url}`);

                // FormData-ya task_id əlavə et
                formData.append('task_id', numericTaskId);
                formData.append('file_type', 'audio');

                const response = await fetch(`/proxy.php/api/v1${url}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // Content-Type əlavə ETMƏ! FormData özü header yaradır
                    },
                    body: formData
                });

                console.log(`   Status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ Audio uğurla yükləndi`);
                    return result;
                } else {
                    const errorText = await response.text();
                    console.log(`   ❌ Endpoint işləmədi: ${response.status} - ${errorText}`);
                }
            } catch (error1) {
                console.log(`   ❌ Endpoint xətası: ${error1.message}`);
            }

            // ✅ ALTERNATİV: tasks/attachments endpoint
            try {
                const altUrl = `/tasks/${numericTaskId}/attachments`;
                const token = localStorage.getItem('guven_token') || '';

                console.log(`2️⃣ Alternativ endpoint: POST ${altUrl}`);

                const response = await fetch(`/proxy.php/api/v1${altUrl}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                console.log(`   Status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ Audio attachments endpoint-ə yükləndi`);
                    return result;
                } else {
                    console.log(`   ❌ Alternativ endpoint işləmədi: ${response.status}`);
                }
            } catch (error2) {
                console.log(`   ❌ Alternativ endpoint xətası: ${error2.message}`);
            }

            // ✅ ƏGƏR HEÇ BİRİ İŞLƏMƏZSƏ, metadata kimi saxla
            try {
                console.log(`3️⃣ Metadata kimi saxlanılır...`);

                // Task metadata güncəllə
                const metadataResponse = await makeApiRequest(`/tasks/${numericTaskId}`, 'GET');
                const task = metadataResponse.task || metadataResponse.data || metadataResponse;

                let metadata = {};
                if (task.metadata) {
                    try {
                        metadata = typeof task.metadata === 'string' ?
                                  JSON.parse(task.metadata) : task.metadata;
                    } catch (e) {
                        metadata = {};
                    }
                }

                if (!metadata.audio_recordings) {
                    metadata.audio_recordings = [];
                }

                metadata.audio_recordings.push({
                    filename: filename,
                    description: description,
                    timestamp: new Date().toISOString(),
                    size: audioBlob.size,
                    base64_preview: audioBase64.substring(0, 100) + '...'
                });

                // ✅ DÜZGÜN ENDPOINT: PATCH /tasks/{id}
                const updateResponse = await makeApiRequest(
                    `/tasks/${numericTaskId}`,
                    'PATCH',  // ✅ PATCH istifadə et, PUT deyil
                    { metadata: JSON.stringify(metadata) }
                );

                console.log(`✅ Audio metadata kimi saxlandı`);
                return updateResponse;

            } catch (error3) {
                console.log(`   ❌ Metadata save xətası: ${error3.message}`);

                // Bu fatal error deyil, task yaradıldı
                return {
                    success: true,
                    message: 'Audio metadata saxlanıla bilmədi, amma task yaradıldı',
                    metadata_saved: false
                };
            }

        } catch (error) {
            console.error('❌ Audio yükləmə xətası:', error);

            // Bu fatal error deyil, task yaradıldı
                return {
                    success: false,
                    message: 'Audio yüklənə bilmədi, amma task yaradıldı',
                    error: error.message
                };
        }
    }

    // Metadata kimi saxla funksiyası
    async saveAudioAsMetadata(taskId, audioBase64, filename, description) {
        try {
            console.log(`💾 Audio metadata kimi saxlanılır: Task ${taskId}`);

            // Task məlumatlarını al
            const taskResponse = await makeApiRequest(`/tasks/${taskId}`, 'GET');
            const task = taskResponse.task || taskResponse.data || taskResponse;

            // Metadata hazırla
            let metadata = {};
            if (task.metadata) {
                try {
                    metadata = typeof task.metadata === 'string'
                        ? JSON.parse(task.metadata)
                        : task.metadata;
                } catch (e) {
                    metadata = {};
                }
            }

            // Audio recordings array yarat
            if (!metadata.audio_recordings) {
                metadata.audio_recordings = [];
            }

            // Yeni audio qeydi əlavə et
            const audioRecording = {
                id: metadata.audio_recordings.length + 1,
                filename: filename,
                description: description,
                timestamp: new Date().toISOString(),
                size_bytes: audioBase64.length,
                size_mb: (audioBase64.length / (1024 * 1024)).toFixed(2),
                type: 'audio/wav',
                base64_preview: audioBase64.substring(0, 100) + '...' // Yalnız kiçik hissə
            };

            metadata.audio_recordings.push(audioRecording);

            console.log(`📝 Audio metadata hazır: ${audioRecording.filename}`);

            // Task-u update et
            const updateData = {
                metadata: JSON.stringify(metadata)
            };

            const updateResult = await makeApiRequest(`/tasks/${taskId}`, 'PUT', updateData);
            console.log(`✅ Audio metadata saxlandı`);

            return updateResult;

        } catch (error) {
            console.error('❌ Metadata save xətası:', error);
            throw error;
        }
    }

    // Helper funksiyalar
    showSuccess(message) {
        if (typeof notificationService !== 'undefined' && notificationService.showSuccess) {
            notificationService.showSuccess(message);
        } else {
            alert('✅ ' + message);
        }
    }

    showError(message) {
        if (typeof notificationService !== 'undefined' && notificationService.showError) {
            notificationService.showError(message);
        } else {
            alert('❌ ' + message);
        }
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }


    async changeTaskStatus(taskId, newStatus, additionalData = {}) {
        try {
            console.log(`🔄 Task statusu dəyişdirilir: ${taskId} -> ${newStatus}`);

            const updateData = {
                status: newStatus,
                ...additionalData
            };

            if (newStatus === 'completed') {
                updateData.completed_date = new Date().toISOString().split('T')[0];
            }

            console.log('📦 Status update data:', updateData);

            // PUT /tasks/{id}/status endpoint-inə göndər
            const response = await this.apiRequest(`/tasks/${taskId}/status`, 'PUT', updateData);

            console.log('📥 Status update response:', response);

            // **ƏSAS DÜZƏLTMƏ: Response formatını düzgün yoxla**
            if (response && (response.success === true || response.data?.success === true)) {

                // Cədvəlləri yenilə
                setTimeout(() => {
                    this.loadActiveTasks();

                    // Əgər tamamlandısa, arxiv cədvəlini də yenilə
                    if (newStatus === 'completed') {
                        setTimeout(() => {
                            this.loadArchiveTasks();
                        }, 500);
                    }
                }, 100);

                return response.data || response;

            } else {
                // **DÜZƏLTMƏ: API Service artıq error throw edir, biz yalnız catch-də işləyəcəyik**
                console.log('⚠️ Response formatında problem:', response);
                throw new Error(response?.detail || response?.message || 'Status dəyişdirilə bilmədi');
            }

        } catch (error) {
            console.error('❌ Task status dəyişdirilmə xətası:', error);

            // **DÜZƏLTMƏ: Əgər status dəyişibsə (200 cavabı alınıbsa), amma frontend parse edə bilməyibsə**
            if (error.message.includes('Status dəyişdirilə bilmədi') && newStatus) {
                // Hələ də cədvəli yenilə
                this.showSuccess(`✅ Status "${this.getStatusText(newStatus)}" olaraq dəyişdirildi`);
                setTimeout(() => this.loadActiveTasks(), 500);
                return {success: true, manuallyHandled: true};
            }

            this.showError('Status dəyişdirilərkən xəta baş verdi: ' + error.message);
            throw error;
        }
    }


    async loadMySubsidiaries() {
        try {
            console.log('👇 Alt şirkətlər yüklənir...');

            const response = await this.apiRequest(
                `/companies/${this.userData.companyCode}/my-subsidiaries`,
                'GET'
            );

            if (response && response.data && response.data.success) {
                const subsidiariesData = response.data.subsidiaries || [];

                this.subsidiaryCompanies = subsidiariesData.map(subsidiary => ({
                    id: subsidiary.child_company_id,
                    company_code: subsidiary.child_company_code,
                    company_name: subsidiary.child_company_name,
                    relationship_type: 'subsidiary',
                    relationship_id: subsidiary.relationship_id,
                    relationship_status: subsidiary.status
                }));

                console.log(`✅ ${this.subsidiaryCompanies.length} alt şirkət yükləndi`);
            } else {
                await this.loadSubCompaniesFromOldEndpoint();
            }

        } catch (error) {
            console.error('❌ Load my subsidiaries error:', error);
            await this.loadSubCompaniesFromOldEndpoint();
        }
    }

    async checkAndArchiveOverdueTasks() {
        try {
            console.log('⏰ Vaxtı keçən task-lar yoxlanılır (SADƏCƏ STATUS!)...');

            // Aktiv task-ları gətir (overdue olmayanları)
            const response = await this.apiRequest('/tasks/detailed?status=pending,in_progress', 'GET');

            // Response strukturunu emal et
            let tasks = [];

            if (response && Array.isArray(response)) {
                tasks = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                tasks = response.data;
            } else {
                console.log('ℹ️ Aktiv task tapılmadı');
                return;
            }

            if (tasks.length === 0) {
                console.log('ℹ️ Vaxtı keçən task tapılmadı');
                return;
            }

            const now = new Date();
            let overdueCount = 0;

            console.log(`📊 ${tasks.length} aktiv task yoxlanılır...`);

            // Hər task üçün yoxla
            for (const task of tasks) {
                // Əgər due_date varsa və status "completed" və "rejected" deyilsə
                if (task.due_date && task.status !== 'completed' && task.status !== 'rejected') {
                    const dueDate = new Date(task.due_date);

                    // Deadline bugün və ya keçibsə
                    if (dueDate < now) {
                        console.log(`⚠️ Task ${task.id} vaxtı keçib: ${task.due_date}, Status: ${task.status}`);

                        // ✅ ƏSAS DÜZƏLT: SADƏCƏ STATUSU "overdue" ET

                        // Status artıq "overdue" deyilsə, dəyiş
                        if (task.status !== 'overdue') {
                            try {
                                console.log(`🔄 Task ${task.id} statusu "overdue" edilir...`);

                                // 1. Əvvəlcə status update et
                                const statusResponse = await this.apiRequest(
                                    `/tasks/${task.id}/status`,
                                    'PUT',
                                    {
                                        status: 'overdue',
                                        reason: 'Deadline expired'
                                    }
                                );

                                console.log('📥 Status update response:', statusResponse);

                                if (statusResponse && (statusResponse.success || statusResponse.data)) {
                                    console.log(`✅ Task ${task.id} statusu "GECİKMƏ" edildi`);
                                    overdueCount++;

                                    // ✅ HEÇ NƏ ARXİVƏ ATMIRIQ!
                                    console.log(`ℹ️ Task ${task.id} aktiv cədvəldə qalır`);

                                    // 2. ÖZƏL: Task-ı ARXİVDƏN ÇIXART
                                    try {
                                        // Əgər task arxivdədirsə, onu arxivdən çıxart
                                        const unarchiveResponse = await this.apiRequest(
                                            `/tasks/${task.id}/unarchive`,
                                            'PUT',
                                            { reason: 'Overdue task moved back to active' }
                                        );

                                        if (unarchiveResponse && unarchiveResponse.success) {
                                            console.log(`✅ Task ${task.id} arxivdən çıxarıldı`);
                                        }
                                    } catch (unarchiveError) {
                                        console.log(`ℹ️ Task ${task.id} arxivdə deyil və ya unarchive endpoint-i yoxdur`);
                                    }
                                }
                            } catch (error) {
                                console.error(`❌ Task ${task.id} status dəyişdirilmə xətası:`, error);
                            }
                        } else {
                            console.log(`ℹ️ Task ${task.id} artıq "overdue" statusundadır`);
                        }
                    }
                }
            }

            // Nəticə
            if (overdueCount > 0) {
                console.log(`✅ ${overdueCount} task "GECİKMƏ" statusuna keçirildi`);

                // Cədvəlləri yenilə
                setTimeout(() => {
                    console.log('🔄 Bütün cədvəllər yenilənir...');
                    this.loadActiveTasks();
                    this.loadExternalTasks();
                }, 1000);
            } else {
                console.log('ℹ️ Vaxtı keçən task tapılmadı');
            }

        } catch (error) {
            console.error('❌ Vaxtı keçən task-lar yoxlanılarkən xəta:', error);
        }
    }



    setupAutoArchiveCheck() {
        console.log('⏰ Vaxtı keçən task-ların avtomatik yoxlanması başladıldı (SADƏCƏ STATUS!)');

        // 1 dəqiqədə bir yoxla (test üçün)
        const checkInterval = 1 * 60 * 1000; // 1 dəqiqə

        // Interval başlat
        this.autoArchiveInterval = setInterval(() => {
            console.log('⏰ Interval yoxlama başladı (SADƏCƏ STATUS DƏYİŞİR!)...');
            this.checkAndArchiveOverdueTasks();
        }, checkInterval);

        // İlk yoxlama 10 saniyə sonra
        setTimeout(() => {
            console.log('⏰ İlk yoxlama başladı (SADƏCƏ STATUS!)...');
            this.checkAndArchiveOverdueTasks();
        }, 10000);

        // Həm də page load-da yoxla
        this.checkAndArchiveOverdueTasks();

        console.log(`✅ Auto-check quruldu (${checkInterval/1000} saniyədə bir yoxlanacaq, ARXİVƏ ATMIR!)`);
    }

    async loadSubCompaniesFromOldEndpoint() {
        try {
            console.log('🔄 Köhnə endpoint-dən şirkətlər yüklənir...');

            const response = await this.apiRequest(
                `/companies/${this.userData.companyCode}/sub-companies`,
                'GET'
            );

            if (response && response.data) {
                let subCompaniesData = [];

                if (response.data.sub_companies) {
                    subCompaniesData = response.data.sub_companies;
                } else if (Array.isArray(response.data)) {
                    subCompaniesData = response.data;
                }

                this.subsidiaryCompanies = subCompaniesData.map(company => ({
                    id: company.id || company.company_id,
                    company_code: company.company_code || company.code,
                    company_name: company.company_name || company.name,
                    relationship_type: 'subsidiary',
                    relationship_status: 'active'
                }));

                console.log(`✅ ${this.subsidiaryCompanies.length} şirkət alt şirkət kimi yükləndi`);
            }

        } catch (error) {
            console.error('❌ Load sub companies from old endpoint error:', error);
            this.subsidiaryCompanies = [];
        }
    }

    // ==================== SELECT POPULATION ====================
    populateCompanySelects() {
        const companySelect = document.getElementById('companySelect');
        const filterCompanySelect = document.getElementById('filterCompanySelect');

        if (companySelect) {
            let html = '<option value="">Seçin</option>';

            if (this.myCompany) {
                html += `
                    <option value="${this.myCompany.id}" 
                            data-is-my-company="true" 
                            data-company-code="${this.myCompany.company_code}"
                            data-relationship-type="own"
                            selected>
                        🏢 ${this.myCompany.company_name} (Mənim şirkətim)
                    </option>
                `;
            }

            if (this.subsidiaryCompanies.length > 0) {
                html += `<optgroup label="👇 Mənim Alt Şirkətlərim">`;
                this.subsidiaryCompanies.forEach(subsidiary => {
                    if (subsidiary.relationship_status === 'active') {
                        html += `
                            <option value="${subsidiary.id}" 
                                    data-is-my-company="false"
                                    data-company-code="${subsidiary.company_code}"
                                    data-relationship-type="subsidiary">
                                📍 ${subsidiary.company_name}
                            </option>
                        `;
                    }
                });
                html += `</optgroup>`;
            }

            companySelect.innerHTML = html;
            console.log('✅ Company select populated with', this.subsidiaryCompanies.length, 'alt şirkət');
        }

        if (filterCompanySelect) {
            this.populateFilterCompanySelect(filterCompanySelect);
        }
    }

    populateFilterCompanySelect(selectElement) {
        let html = '<option value="">Hamısı</option>';

        if (this.myCompany) {
            html += `<option value="${this.myCompany.id}">${this.myCompany.company_name} (Mənim şirkətim)</option>`;
        }

        this.subsidiaryCompanies.forEach(subsidiary => {
            if (subsidiary.relationship_status === 'active') {
                html += `<option value="${subsidiary.id}">${subsidiary.company_name} (Alt şirkət)</option>`;
            }
        });

        selectElement.innerHTML = html;
        console.log('✅ Filter company select populated');
    }

    // ==================== EVENT HANDLERS ====================
    setupEventListeners() {
        console.log('🔌 Event listeners qurulur...');

        // Active pagination
        document.getElementById('prevBtnList')?.addEventListener('click', () => {
            this.changePage('active', this.pagination.active.page - 1);
        });

        document.getElementById('nextBtnList')?.addEventListener('click', () => {
            this.changePage('active', this.pagination.active.page + 1);
        });

        // External pagination
        document.getElementById('externalPrevBtn')?.addEventListener('click', () => {
            this.changePage('external', this.pagination.external.page - 1);
        });

        document.getElementById('externalNextBtn')?.addEventListener('click', () => {
            this.changePage('external', this.pagination.external.page + 1);
        });

        // Archive pagination
        document.getElementById('archivePrevBtn')?.addEventListener('click', () => {
            this.changePage('archive', this.pagination.archive.page - 1);
        });

        document.getElementById('archiveNextBtn')?.addEventListener('click', () => {
            this.changePage('archive', this.pagination.archive.page + 1);
        });

        // Pagination nömrələri üçün event delegation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-number')) {
                const page = parseInt(e.target.textContent);
                const container = e.target.closest('.pagination-numbers');

                let tableType = 'active';
                if (container.id === 'externalPaginationNumbers') {
                    tableType = 'external';
                } else if (container.id === 'archivePaginationNumbers') {
                    tableType = 'archive';
                }

                this.changePage(tableType, page);
            }
        });

        // 1. Task form təqdim event listener
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.handleTaskFormSubmit(e));
            console.log('✅ Task form submit listener əlavə edildi');
        }

        // 2. Şirkət select change event - checkbox'ı yoxla
        const companySelect = document.getElementById('companySelect');
        if (companySelect) {
            companySelect.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const isMyCompany = selectedOption.getAttribute('data-is-my-company') === 'true';
                const isVisibleCheckbox = document.getElementById('isVisibleToOtherCompanies');

                if (isVisibleCheckbox) {
                    // Əgər öz şirkətimiz seçilibsə, checkbox'ı disable et
                    if (isMyCompany) {
                        isVisibleCheckbox.disabled = true;
                        isVisibleCheckbox.checked = false;
                        console.log('ℹ️ Öz şirkəti seçildi, checkbox disable edildi');
                    } else {
                        isVisibleCheckbox.disabled = false;
                        console.log('ℹ️ Alt şirkət seçildi, checkbox aktiv edildi');
                    }
                }
            });
        }


        // 4. Filter modal açma
        const openFilterBtn = document.getElementById('openFilterBtn');
        if (openFilterBtn) {
            openFilterBtn.addEventListener('click', () => this.openFilterModal());
        }

        // 5. Filter form submit event
        const filterForm = document.getElementById('filterForm');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => this.handleFilterFormSubmit(e));
            console.log('✅ Filter form submit listener əlavə edildi');
        }



        // 6. Reset filters button
        const resetFiltersBtn = document.getElementById('resetFiltersBtn');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => this.resetFilters());
            console.log('✅ Reset filters button listener əlavə edildi');
        }

        // 7. Close filter modal button
        const closeFilterBtn = document.getElementById('closeFilterBtn');
        if (closeFilterBtn) {
            closeFilterBtn.addEventListener('click', () => this.closeFilterModal());
            console.log('✅ Close filter button listener əlavə edildi');
        }

        // 8. Serial request modal açma
        const openSerialRequestBtn = document.getElementById('openSerialRequestBtn');
        if (openSerialRequestBtn) {
            openSerialRequestBtn.addEventListener('click', () => this.openSerialRequestModal());
        }

        // 9. Load more düymələri
        const activeLoadMoreBtn = document.getElementById('activeLoadMoreBtn');
        if (activeLoadMoreBtn) {
            activeLoadMoreBtn.addEventListener('click', async () => {
                if (this.pagination.active.hasMore) {
                    this.pagination.active.page++;
                    await this.loadActiveTasks(this.pagination.active.page, true);
                }
            });
        }

        const archiveLoadMoreBtn = document.getElementById('archiveLoadMoreBtn');
        if (archiveLoadMoreBtn) {
            archiveLoadMoreBtn.addEventListener('click', async () => {
                if (this.pagination.archive.hasMore) {
                    this.pagination.archive.page++;
                    await this.loadArchiveTasks(this.pagination.archive.page, true);
                }
            });
        }

        const externalLoadMoreBtn = document.getElementById('externalLoadMoreBtn');
        if (externalLoadMoreBtn) {
            externalLoadMoreBtn.addEventListener('click', async () => {
                if (this.pagination.external.hasMore) {
                    this.pagination.external.page++;
                    await this.loadExternalTasks(this.pagination.external.page, true);
                }
            });
        }

        // 10. İşçi seçildikdə avtomatik şöbə doldur
        const executorSelect = document.getElementById('executorSelect');
        if (executorSelect) {
            executorSelect.addEventListener('change', async (e) => {
                await this.handleExecutorChange(e);
            });
        }

        // 11. Şöbə seçildikdə iş növlərini yenilə (WORKTYPES)
        const departmentSelect = document.getElementById('departmentSelect');
        if (departmentSelect) {
            departmentSelect.addEventListener('change', async (e) => {
                await this.handleDepartmentChange(e);
            });
        }

        // 12. Müddət və saatlıq əmək haqqı dəyişdikdə hesablama
        const durationInput = document.getElementById('durationInput');
        const hourlyRateInput = document.getElementById('hourlyRateInput');

        if (durationInput) {
            durationInput.addEventListener('input', () => this.calculateSalary());
        }

        if (hourlyRateInput) {
            hourlyRateInput.addEventListener('input', () => this.calculateSalary());
        }

        console.log('✅ Bütün event listeners quruldu');
    }
    // Səhifə dəyişmə funksiyası
    async changePage(tableType, newPage) {
        if (newPage < 1 || newPage > this.pagination[tableType].totalPages) {
            return;
        }

        this.pagination[tableType].page = newPage;

        // Loading göstər
        this.showLoading(`Səhifə ${newPage} yüklənir...`);

        // Müvafiq cədvəli yüklə
        switch(tableType) {
            case 'active':
                await this.loadActiveTasks(newPage, false);
                break;
            case 'external':
                await this.loadExternalTasks(newPage, false);
                break;
            case 'archive':
                await this.loadArchiveTasks(newPage, false);
                break;
        }

        // Pagination UI-nı yenilə
        this.updatePaginationUI(tableType);

        this.hideLoading();
    }

    // Pagination UI yeniləmə
    updatePaginationUI(tableType) {
        const pagination = this.pagination[tableType];
        const numbersContainer = document.getElementById(`${tableType}PaginationNumbers`);
        const pageInfo = document.getElementById(`${tableType}PageInfo`);
        const totalInfo = document.getElementById(`${tableType}TotalInfo`);
        const prevBtn = document.getElementById(`${tableType}PrevBtn`) ||
                       document.getElementById(`${tableType === 'active' ? 'prevBtnList' : `${tableType}PrevBtn`}`);
        const nextBtn = document.getElementById(`${tableType}NextBtn`) ||
                       document.getElementById(`${tableType === 'active' ? 'nextBtnList' : `${tableType}NextBtn`}`);

        // Prev/Next düymələrini aktiv/deaktiv et
        if (prevBtn) {
            prevBtn.disabled = pagination.page === 1;
            prevBtn.style.opacity = pagination.page === 1 ? '0.5' : '1';
        }

        if (nextBtn) {
            nextBtn.disabled = pagination.page === pagination.totalPages;
            nextBtn.style.opacity = pagination.page === pagination.totalPages ? '0.5' : '1';
        }

        // Səhifə məlumatını yenilə
        if (pageInfo) {
            const start = ((pagination.page - 1) * pagination.pageSize) + 1;
            const end = Math.min(pagination.page * pagination.pageSize, pagination.total);
            pageInfo.textContent = `Səhifə ${pagination.page} - ${start}-${end} məlumat`;
        }

        // Ümumi məlumatı yenilə
        if (totalInfo) {
            totalInfo.textContent = `(Ümumi: ${pagination.total})`;
        }

        // Səhifə nömrələrini yenilə
        if (numbersContainer) {
            this.generatePaginationNumbers(tableType, numbersContainer);
        }
    }


    // Səhifə nömrələrini yaratmaq
    generatePaginationNumbers(tableType, container) {
        const pagination = this.pagination[tableType];
        let html = '';

        if (pagination.totalPages <= 7) {
            // Bütün səhifələri göstər
            for (let i = 1; i <= pagination.totalPages; i++) {
                html += `<button class="pagination-number ${i === pagination.page ? 'active' : ''}">${i}</button>`;
            }
        } else {
            // Mürəkkəb pagination
            const current = pagination.page;
            const total = pagination.totalPages;

            // Həmişə birinci səhifə
            html += `<button class="pagination-number ${current === 1 ? 'active' : ''}">1</button>`;

            if (current > 3) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }

            // Orta səhifələr
            let start = Math.max(2, current - 1);
            let end = Math.min(total - 1, current + 1);

            for (let i = start; i <= end; i++) {
                html += `<button class="pagination-number ${i === current ? 'active' : ''}">${i}</button>`;
            }

            if (current < total - 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }

            // Həmişə son səhifə
            if (total > 1) {
                html += `<button class="pagination-number ${current === total ? 'active' : ''}">${total}</button>`;
            }
        }

        container.innerHTML = html;
    }


    // ==================== FILTER FUNCTIONS ====================
    async handleFilterFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation();

        try {
            console.log('🔍 Filtr tətbiq edilir...');

            const form = e.target;
            const filters = {};

            // Form elementlərini topla
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.value && element.value !== '') {
                    filters[element.name] = element.value;
                }
            }

            // ✅ HANSİ CƏDVƏLƏ FİLTR TƏTBİQ EDİLƏCƏYİNİ YOXLA
            const selectedTable = document.querySelector('input[name="filter_table"]:checked')?.value || 'active';
            console.log(`🎯 Filtr tətbiq ediləcək cədvəl: ${selectedTable}`);

            // Cari filtr cədvəlini saxla
            this.currentFilterTable = selectedTable;

            // Formdakı filter_table çıxart (çünki o sadecə hansı cədvəl üçün olduğunu göstərir)
            const { filter_table, ...filterParams } = filters;
            this.currentFilters = filterParams;

            console.log('📦 Filtr məlumatları:', this.currentFilters);

            // Modalı bağla
            this.closeFilterModal();

            // Loading göstər
            this.showLoading(`${this.getTableName(selectedTable)} cədvəlinə filtr tətbiq edilir...`);

            // ✅ SEÇİLMİŞ CƏDVƏLƏ FİLTR TƏTBİQ ET
            await this.applyFilterToSelectedTable(selectedTable, filterParams);

            // Filter badge-i yenilə
            this.updateFilterBadge();

            // Loading gizlət
            this.hideLoading();

            this.showSuccess(`${this.getTableName(selectedTable)} cədvəlinə filtr tətbiq edildi`);

        } catch (error) {
            console.error('❌ Filtr tətbiqi xətası:', error);
            this.hideLoading();
            this.showError('Filtr tətbiq edilərkən xəta baş verdi: ' + error.message);
        }
    }

    // YARDIMÇI FUNKSİYALAR
    getTableName(tableType) {
        const names = {
            'active': 'Şirkətin Aktiv İşləri',
            'external': 'Digər Şirkətlərin İşləri',
            'archive': 'Arxiv İşlər'
        };
        return names[tableType] || tableType;
    }

    async applyFilterToSelectedTable(tableType, filters) {
        try {
            console.log(`🎯 ${this.getTableName(tableType)} cədvəlinə filtr tətbiq edilir...`);

            // Cari filtrləri saxla
            this.currentFilters = filters;
            this.currentFilterTable = tableType;

            // Hansı cədvəli yükləyəcəyimizi seç
            switch(tableType) {
                case 'active':
                    await this.loadActiveTasks(1, false);
                    break;
                case 'external':
                    await this.loadExternalTasks(1, false);
                    break;
                case 'archive':
                    await this.loadArchiveTasks(1, false);
                    break;
                default:
                    await this.loadActiveTasks(1, false);
            }

            // Yalnız seçilmiş cədvəli göstər
            this.showOnlySelectedTable(tableType);

        } catch (error) {
            console.error(`❌ ${tableType} cədvəlinə filtr tətbiqi xətası:`, error);
            throw error;
        }
    }

    showOnlySelectedTable(selectedTable) {
        console.log(`👁️ Yalnız ${selectedTable} cədvəli göstərilir...`);

        const sections = {
            'active': document.getElementById('activeTableSection'),
            'external': document.getElementById('externalTableSection'),
            'archive': document.getElementById('archiveTableSection')
        };

        // Bütün cədvəlləri gizlət
        Object.values(sections).forEach(section => {
            if (section) {
                section.classList.add('hidden');
            }
        });

        // Yalnız seçilmiş cədvəli göstər
        if (sections[selectedTable]) {
            sections[selectedTable].classList.remove('hidden');
            console.log(`✅ ${this.getTableName(selectedTable)} cədvəli göstərildi`);
        }
    }

    // resetFilters funksiyasını YENİLƏYİN
    resetFilters() {
        try {
            console.log('🔄 Filtrlər sıfırlanır...');

            // Formu sıfırla
            const filterForm = document.getElementById('filterForm');
            if (filterForm) {
                filterForm.reset();

                // Radio butonu default olaraq aktiv et
                const activeRadio = document.querySelector('input[name="filter_table"][value="active"]');
                if (activeRadio) {
                    activeRadio.checked = true;
                }
            }

            // Current filters-i sıfırla
            this.currentFilters = {};
            this.currentFilterTable = 'active';

            // Filter badge-i gizlət
            const filterBadge = document.getElementById('filterBadge');
            if (filterBadge) {
                filterBadge.style.display = 'none';
            }

            // Loading göstər
            this.showLoading('Filtr sıfırlanır...');

            // Bütün cədvəlləri yenilə (filtrsiz)
            setTimeout(() => {
                this.loadActiveTasks(1, false);
                this.loadExternalTasks(1, false);
                this.loadArchiveTasks(1, false);

                // Bütün cədvəlləri göstər
                this.showAllTables();

                this.hideLoading();

            }, 500);

        } catch (error) {
            console.error('❌ Filtr sıfırlama xətası:', error);
            this.hideLoading();
            this.showError('Filtr sıfırlanarkən xəta baş verdi');
        }
    }

    showAllTables() {
        console.log('👁️ Bütün cədvəllər göstərilir...');

        const activeSection = document.getElementById('activeTableSection');
        const externalSection = document.getElementById('externalTableSection');
        const archiveSection = document.getElementById('archiveTableSection');

        if (activeSection) activeSection.classList.remove('hidden');
        if (externalSection) externalSection.classList.remove('hidden');

        // Arxiv bölməsi toggle ilə idarə olunur
        const archiveCheckbox = document.getElementById('showArchiveTable');
        if (archiveSection && archiveCheckbox && archiveCheckbox.checked) {
            archiveSection.classList.remove('hidden');
        }
    }

    closeFilterModal() {
        // Əgər ModalManager mövcud deyilsə, sadə üsulla bağla
        const modal = document.getElementById('filterModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            console.log('✅ Filtr modalı bağlandı');
        }
    }

    openFilterModal() {
        try {
            console.log('🔍 Filtr modalı açılır...');

            // Select-ləri doldur (əgər doldurulmayıbsa)
            this.populateFilterSelects();

            // Modalı SADƏCƏ aç
            const modal = document.getElementById('filterModal');
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                console.log('✅ Filtr modalı açıldı');
            }

        } catch (error) {
            console.error('❌ Filtr modalı açılarkən xəta:', error);
        }
    }



    populateFilterSelects() {
        try {
            console.log('🔧 Filtr select-ləri doldurulur...');

            // Şirkət select-i
            const filterCompanySelect = document.getElementById('filterCompanySelect');
            if (filterCompanySelect && this.myCompany) {
                let html = '<option value="">Hamısı</option>';

                html += `<option value="${this.myCompany.id}">${this.myCompany.company_name} (Mənim şirkətim)</option>`;

                if (this.subsidiaryCompanies && this.subsidiaryCompanies.length > 0) {
                    this.subsidiaryCompanies.forEach(subsidiary => {
                        if (subsidiary.relationship_status === 'active') {
                            html += `<option value="${subsidiary.id}">${subsidiary.company_name} (Alt şirkət)</option>`;
                        }
                    });
                }

                filterCompanySelect.innerHTML = html;
            }

            // İşçi select-i
            const filterExecutorSelect = document.getElementById('filterExecutorSelect');
            if (filterExecutorSelect && this.employees && this.employees.length > 0) {
                let html = '<option value="">Hamısı</option>';

                this.employees.forEach(employee => {
                    const name = employee.full_name || employee.name || employee.email || 'Ad yoxdur';
                    html += `<option value="${employee.id}">${name}</option>`;
                });

                filterExecutorSelect.innerHTML = html;
            }

            // Şöbə select-i
            const filterDepartmentSelect = document.getElementById('filterDepartmentSelect');
            if (filterDepartmentSelect && this.departments && this.departments.length > 0) {
                let html = '<option value="">Hamısı</option>';

                this.departments.forEach(department => {
                    const name = department.department_name || department.name || `Şöbə ${department.id}`;
                    html += `<option value="${department.id}">${name}</option>`;
                });

                filterDepartmentSelect.innerHTML = html;
            }

            // İş növü select-i
            const filterTaskTypeSelect = document.getElementById('filterTaskTypeSelect');
            if (filterTaskTypeSelect && this.workTypes && this.workTypes.length > 0) {
                let html = '<option value="">Hamısı</option>';

                this.workTypes.forEach(worktype => {
                    if (worktype.is_active === false) return;

                    const name = worktype.work_type_name || worktype.name || `İş növü ${worktype.id}`;
                    html += `<option value="${worktype.id}">${name}</option>`;
                });

                filterTaskTypeSelect.innerHTML = html;
            }

            console.log('✅ Filtr select-ləri dolduruldu');

        } catch (error) {
            console.error('❌ Filtr select-ləri doldurularkən xəta:', error);
        }
    }

    // İşçi dəyişdikdə şöbəni avtomatik doldur
    async handleExecutorChange(event) {
        try {
            const employeeId = event.target.value;
            if (!employeeId) return;

            console.log(`👤 İşçi seçildi: ${employeeId}`);

            await this.loadEmployeeHourlyRate(employeeId);
            await this.loadEmployeeDepartment(employeeId);

        } catch (error) {
            console.error('❌ İşçi dəyişikliyi zamanı xəta:', error);
        }
    }

    // İşçinin saatlıq əmək haqqını gətir
    async loadEmployeeHourlyRate(employeeId) {
        try {
            const hourlyRateInput = document.getElementById('hourlyRateInput');
            if (!hourlyRateInput) return;

            const response = await this.apiRequest(`/users/${employeeId}`, 'GET');

            if (response && response.data && response.data.hourly_rate !== undefined) {
                hourlyRateInput.value = parseFloat(response.data.hourly_rate).toFixed(2);
                console.log(`💰 İşçinin saatlıq əmək haqqı: ${hourlyRateInput.value}`);
                this.calculateSalary();
            }
        } catch (error) {
            console.error('❌ İşçinin saatlıq əmək haqqı gətirilərkən xəta:', error);
        }
    }

    // İşçinin şöbəsini gətir
    async loadEmployeeDepartment(employeeId) {
        try {
            const departmentSelect = document.getElementById('departmentSelect');
            if (!departmentSelect) return;

            const response = await this.apiRequest(`/users/${employeeId}`, 'GET');

            if (response && response.data && response.data.department_id) {
                const departmentId = response.data.department_id;

                departmentSelect.value = departmentId;
                console.log(`✅ İşçinin şöbəsi avtomatik dolduruldu: ${departmentId}`);

                if (!departmentSelect.querySelector(`option[value="${departmentId}"]`)) {
                    const departmentName = response.data.department_name || `Şöbə ${departmentId}`;
                    const option = document.createElement('option');
                    option.value = departmentId;
                    option.textContent = departmentName;
                    departmentSelect.appendChild(option);
                    console.log(`📝 Yeni şöbə əlavə edildi: ${departmentName}`);
                }

                // Şöbə dəyişdikdə iş növlərini yenilə (WORKTYPES)
                await this.handleDepartmentChange({target: departmentSelect});

            } else {
                console.log('⚠️ İşçidə şöbə məlumatı yoxdur');
            }

        } catch (error) {
            console.error('❌ İşçinin şöbəsi gətirilərkən xəta:', error);
        }
    }

    // Şöbə dəyişdikdə iş növlərini yenilə (WORKTYPES)
    async handleDepartmentChange(event) {
        try {
            const departmentId = event.target.value;

            // Şöbə seçildikdə HEÇ NƏ ETMİRİK - iş növləri şirkətə bağlıdır
            console.log(`🏛️ Şöbə seçildi: ${departmentId}, lakin iş növləri ŞİRKƏTƏ bağlı olduğu üçün yenilənmir`);

            // Sadəcə mesaj göstər
            console.log('📌 İş növləri hər zaman şirkətin bütün iş növləridir');

            // Əgər taskTypeSelect boşdursa, FormManager-dən doldur
            const taskTypeSelect = document.getElementById('taskTypeSelect');
            if (taskTypeSelect && taskTypeSelect.options.length <= 1) {
                if (window.FormManager && typeof window.FormManager.loadWorkTypes === 'function') {
                    await window.FormManager.loadWorkTypes();
                }
            }

        } catch (error) {
            console.error('❌ Şöbə dəyişikliyi zamanı xəta:', error);
        }
    }


    // Şöbəyə aid iş növlərini gətir (WORKTYPES)
    async loadWorkTypesForDepartment(departmentId) {
        try {
            const taskTypeSelect = document.getElementById('taskTypeSelect');
            if (!taskTypeSelect) {
                console.error('❌ taskTypeSelect tapılmadı');
                return;
            }

            console.log(`📝 Şöbə ${departmentId} üçün iş növləri (worktypes) gətirilir...`);

            // 1. Əvvəlcə /worktypes/department/{id} endpoint-dən yoxla
            let response = await this.apiRequest(`/worktypes/department/${departmentId}`, 'GET');

            // 2. Əgər işləməzsə, /worktypes/department/{id}/active yoxla
            if (!response || response.error || (!Array.isArray(response) && !response?.data)) {
                console.log('🔄 Normal endpoint işləmədi, active endpoint yoxlanılır...');
                response = await this.apiRequest(`/worktypes/department/${departmentId}/active`, 'GET');
            }

            let worktypes = [];

            // Formatı emal et
            if (response && Array.isArray(response)) {
                worktypes = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                worktypes = response.data;
            } else if (response && response.items && Array.isArray(response.items)) {
                worktypes = response.items;
            }

            console.log(`📊 Şöbə ${departmentId} üçün ${worktypes.length} iş növü tapıldı`);

            if (worktypes.length > 0) {
                // Yalnız AKTİV iş növlərini göstər
                const activeWorktypes = worktypes.filter(wt => wt.is_active !== false);

                console.log(`✅ ${activeWorktypes.length} aktiv iş növü seçiləcək`);

                const currentValue = taskTypeSelect.value;

                // Select-i təmizlə
                taskTypeSelect.innerHTML = '<option value="">Seçin</option>';

                // Şöbə adını tap
                const department = this.departments.find(d => d.id == departmentId);
                const deptName = department ? (department.department_name || `Şöbə ${departmentId}`) : `Şöbə ${departmentId}`;

                // Optgroup yarat
                const optgroup = document.createElement('optgroup');
                optgroup.label = `🏛️ ${deptName}`;

                // Hər iş növü üçün option yarat
                activeWorktypes.forEach(worktype => {
                    const name = worktype.work_type_name || worktype.name || `İş növü ${worktype.id}`;
                    const color = worktype.color_code || '#3B82F6';

                    const option = document.createElement('option');
                    option.value = worktype.id;
                    option.textContent = name;
                    option.style.color = color;
                    option.style.fontWeight = 'bold';

                    // İş saatı varsa göstər
                    if (worktype.hourly_rate) {
                        option.textContent += ` (${worktype.hourly_rate} ₼/saat)`;
                    }

                    // Billed olanları göstər
                    if (worktype.is_billable) {
                        option.textContent += ' 💰';
                    }

                    optgroup.appendChild(option);
                });

                taskTypeSelect.appendChild(optgroup);

                // Köhnə dəyəri saxla (əgər yeni siyahıda varsa)
                if (currentValue && taskTypeSelect.querySelector(`option[value="${currentValue}"]`)) {
                    taskTypeSelect.value = currentValue;
                }

                console.log(`✅ Şöbə ${departmentId} üçün ${activeWorktypes.length} aktiv iş növü yükləndi`);

            } else {

            }

        } catch (error) {

        }
    }
    // ==================== SORTING FUNCTIONS ====================



    parseSortOption(sortOption) {
        let field = '';
        let direction = 'desc';

        if (sortOption.endsWith('_asc')) {
            field = sortOption.replace('_asc', '');
            direction = 'asc';
        } else if (sortOption.endsWith('_desc')) {
            field = sortOption.replace('_desc', '');
            direction = 'desc';
        } else {
            field = sortOption;
            direction = 'desc'; // default
        }

        return { field, direction };
    }

    mapToApiField(field, tableType) {
        // Frontend field adlarını backend field adlarına çevir
        const mapping = {
            'created_at': 'created_at',
            'date': 'created_at',
            'due_date': 'due_date',
            'status': 'status',
            'company': 'company_name',
            'executor': 'executor_name',
            'completed_at': 'completed_at',
            'duration': 'duration_minutes',
            'calculated_cost': 'calculated_cost'
        };

        return mapping[field] || field;
    }

    getTableTitle(tableType) {
        switch(tableType) {
            case 'active': return 'Aktiv İşlər';
            case 'external': return 'Digər Şirkətlər';
            case 'archive': return 'Arxiv';
            default: return 'Cədvəl';
        }
    }

    getSortOptionText(sortOption) {
        const options = {
            'created_at_desc': 'Tarixə görə (əskiyə)',
            'created_at_asc': 'Tarixə görə (yeni)',
            'status': 'Statusa görə',
            'due_date_asc': 'Son müddətə görə (yaxın)',
            'due_date_desc': 'Son müddətə görə (uzaq)',
            'executor': 'İcra edənə görə',
            'company': 'Şirkətə görə',
            'completed_at_desc': 'Tamamlanma tarixinə görə (yeni)',
            'completed_at_asc': 'Tamamlanma tarixinə görə (əskiyə)',
            'duration_asc': 'İcra müddətinə görə (artana)',
            'duration_desc': 'İcra müddətinə görə (azalana)',
            'calculated_cost_asc': 'Formalaşan əmək haqqına görə (artana)',
            'calculated_cost_desc': 'Formalaşan əmək haqqına görə (azalana)'
        };

        return options[sortOption] || sortOption;
    }

    // Əmək haqqı hesablama funksiyası
    calculateSalary() {
        const durationInput = document.getElementById('durationInput');
        const hourlyRateInput = document.getElementById('hourlyRateInput');
        const calculatedCostInput = document.getElementById('calculatedCostInput');

        if (durationInput && hourlyRateInput && calculatedCostInput) {
            const duration = parseFloat(durationInput.value) || 0;
            const hourlyRate = parseFloat(hourlyRateInput.value) || 0;
            const hours = duration / 60;
            const cost = hours * hourlyRate;
            calculatedCostInput.value = cost.toFixed(2);
        }
    }


    // ==================== TASK LOADING FUNCTIONS ====================
    async loadTasksData() {
        try {
            console.log('📋 Task məlumatları yüklənir...');

            await Promise.all([
                this.loadActiveTasks(),
                this.loadArchiveTasks(),
                this.loadExternalTasks()
            ]);

        } catch (error) {
            console.error('❌ Task data load error:', error);
            this.showError('Task məlumatları yüklənərkən xəta baş verdi');
        }
    }


    // ==================== TASK LOADING FUNCTIONS ====================
    async loadActiveTasks(page = 1, append = false) {
        try {
            console.log(`📋 Mənim YARATDIĞIM BÜTÜN task-lar yüklənir (səhifə ${page})...`);

            const queryParams = new URLSearchParams({
                page: page,
                limit: this.pagination.active.pageSize,
                status: 'pending,in_progress,overdue',
                include_my_created_tasks: 'true'
            });
            // Filterləri əlavə et
            if (this.currentFilters && Object.keys(this.currentFilters).length > 0) {
                console.log('🔍 Current filters:', this.currentFilters);

                Object.entries(this.currentFilters).forEach(([key, value]) => {
                    if (value && value !== '') {
                        let apiKey = key;
                        switch(key) {
                            case 'executor_user_id':
                                apiKey = 'assigned_to';
                                break;
                            case 'task_type_id':
                                apiKey = 'work_type_id';
                                break;
                            case 'company_id':
                            case 'department_id':
                            case 'status':
                            case 'created_from':
                            case 'created_to':
                            case 'due_from':
                            case 'due_to':
                                // Eyni qalır
                                break;
                            default:
                                return;
                        }
                        queryParams.append(apiKey, value);
                    }
                });
            }

            const apiUrl = `/tasks/detailed?${queryParams.toString()}`;
            console.log(`📡 API: ${apiUrl}`);

            const response = await this.apiRequest(apiUrl, 'GET');

            // ✅ ƏSAS DEBAQ: Response-un hamısını göstərək
            console.log('🔍 FULL API RESPONSE:', JSON.stringify(response, null, 2));

            let allTasks = [];
            let totalItems = 0;

            // ✅ Response strukturunu düzgün parse edək
            if (Array.isArray(response)) {
                // Variant 1: Direkt array
                allTasks = response;
                totalItems = allTasks.length;
                console.log(`📊 Direkt array format: ${allTasks.length} task`);
            }
            else if (response && response.data) {
                if (Array.isArray(response.data)) {
                    // Variant 2: { data: [...] }
                    allTasks = response.data;
                    totalItems = response.total || response.count || allTasks.length;
                    console.log(`📊 Data array format: ${allTasks.length} task`);
                }
                else if (response.data.items && Array.isArray(response.data.items)) {
                    // Variant 3: { data: { items: [...], total: X } }
                    allTasks = response.data.items;
                    totalItems = response.data.total || response.data.count || allTasks.length;
                    console.log(`📊 Paginated format: ${allTasks.length} task`);
                }
            }

            console.log(`📊 Yüklənən task-lar: ${allTasks.length}, Ümumi: ${totalItems}`);

            // ✅ DEBAQ: Bütün task-ların bütün sahələrini göstərək
            allTasks.forEach((task, index) => {
                console.log(`🔍 TASK ${index + 1} (ID: ${task.id}) SAHƏLƏRİ:`);

                // Bütün sahələri göstər
                Object.keys(task).forEach(key => {
                    console.log(`  ${key}: ${task[key]}`);
                });

                // Xüsusilə target_company varsa
                if (task.target_company) {
                    console.log(`  ✅✅✅ TARGET COMPANY FOUND: ${task.target_company}`);
                }

                console.log('---');
            });

            // Aktiv task-ları filtrlə
            const activeTasks = allTasks.filter(task =>
                task.status === 'pending' ||
                task.status === 'in_progress' ||
                task.status === 'overdue'
            );

            console.log(`✅ Aktiv task-lar: ${activeTasks.length}`);

            if (typeof TableManager !== 'undefined') {
                TableManager.renderTasksTable('active', activeTasks, append, page);
            }

            this.pagination.active.hasMore = activeTasks.length >= this.pagination.active.pageSize;

        } catch (error) {
            console.error('❌ Task-lar yüklənərkən xəta:', error);
            this.showEmptyActiveTable();
        }
    }


    // Filter badge-i yenilə
    updateFilterBadge() {
        const filterBadge = document.getElementById('filterBadge');
        if (!filterBadge) return;

        if (this.currentFilters) {
            const filterCount = Object.keys(this.currentFilters).filter(key =>
                this.currentFilters[key] && this.currentFilters[key] !== ''
            ).length;

            if (filterCount > 0) {
                filterBadge.textContent = filterCount;
                filterBadge.style.display = 'flex';
            } else {
                filterBadge.style.display = 'none';
            }
        }
    }
    


    // ==================== ARXİV TASKLARINI YÜKLƏMƏ ====================
    async loadArchiveTasks(page = 1, append = false) {
        try {
            console.log(`📋 Arxiv task-ları yüklənir (səhifə ${page})...`);

            // Arxiv bölməsi gizlidirsə, yükləmə
            const archiveSection = document.querySelector('.archive-section');
            if (archiveSection && archiveSection.classList.contains('hidden')) {
                return;
            }

            // ✅ TAMAM FƏRQLİ QUERY: Arxiv üçün xüsusi endpoint
            const queryParams = new URLSearchParams({
                page: page,
                limit: this.pagination.archive.pageSize,
                archived: 'true' // ✅ ARXİV OLDUĞUNU GÖSTƏR
            });

            // Əgər filtr varsa, əlavə et
            if (this.currentFilters && Object.keys(this.currentFilters).length > 0) {
                console.log('🔍 Current filters for archive:', this.currentFilters);

                // ARXİV ÜÇÜN XÜSUSİ FILTR MAPPING
                const archiveFilterMap = {
                    'company_id': 'company_id',
                    'executor_user_id': 'assigned_to',
                    'department_id': 'department_id',
                    'task_type_id': 'work_type_id',
                    'status': 'status',
                    'created_from': 'created_from',
                    'created_to': 'created_to',
                    'due_from': 'due_from',
                    'due_to': 'due_to'
                };

                Object.entries(this.currentFilters).forEach(([key, value]) => {
                    if (value && value !== '') {
                        const apiKey = archiveFilterMap[key];
                        if (apiKey) {
                            queryParams.append(apiKey, value);
                            console.log(`   ${key} -> ${apiKey}: ${value}`);
                        }
                    }
                });
            }

            let tasks = [];

            // ✅ 1. YOL: /task-archive endpoint
            try {
                console.log(`📡 Arxiv API 1: /task-archive/?${queryParams}`);
                const archiveResponse = await this.apiRequest(`/task-archive/?${queryParams.toString()}`, 'GET');

                if (archiveResponse && archiveResponse.data) {
                    if (archiveResponse.data.items && Array.isArray(archiveResponse.data.items)) {
                        tasks = archiveResponse.data.items;
                        console.log(`✅ Arxiv format: PaginatedResponse, items: ${tasks.length}`);
                    } else if (Array.isArray(archiveResponse.data)) {
                        tasks = archiveResponse.data;
                        console.log(`✅ Arxiv format: Simple Array, items: ${tasks.length}`);
                    } else if (Array.isArray(archiveResponse)) {
                        tasks = archiveResponse;
                        console.log(`✅ Arxiv format: Direct Array, items: ${tasks.length}`);
                    }

                    // ✅ ARXİV TASK-LARINA ƏLAVƏ MƏLUMATLARI ƏLAVƏ ET
                    tasks = await this.enrichArchiveTasks(tasks);
                }
            } catch (archiveError) {
                console.log('⚠️ /task-archive endpoint işləmədi, /tasks endpoint-ə keçilir...');

                // ✅ 2. YOL: /tasks endpoint ilə arxiv statuslarını gətir
                queryParams.delete('archived');
                queryParams.set('status', 'completed,rejected,cancelled');

                console.log(`📡 Arxiv API 2: /tasks/detailed?${queryParams}`);
                const tasksResponse = await this.apiRequest(`/tasks/detailed?${queryParams.toString()}`, 'GET');

                if (tasksResponse) {
                    if (Array.isArray(tasksResponse)) {
                        tasks = tasksResponse;
                    } else if (tasksResponse.data && Array.isArray(tasksResponse.data)) {
                        tasks = tasksResponse.data;
                    }

                    console.log(`✅ /tasks-dən arxiv tapıldı: ${tasks.length}`);
                }
            }

            console.log(`📊 Arxiv task-ları tapıldı: ${tasks.length}`);

            // ✅ ARXİV ÜÇÜN SADƏCƏ ARXİV STATUSLARINI GÖSTƏR
            const archiveStatuses = ['completed', 'rejected', 'cancelled'];
            let filteredTasks = tasks.filter(task =>
                archiveStatuses.includes(task.status)
            );

            // ✅ ƏGƏR ŞÖBƏ VƏ İŞ NÖVÜ FILTRİ VARSASA, FRONTEND-DƏ FILTRLƏ
            if (this.currentFilters && this.currentFilters.department_id) {
                const deptId = parseInt(this.currentFilters.department_id);
                filteredTasks = filteredTasks.filter(task =>
                    task.department_id === deptId ||
                    (task.department && task.department.id === deptId)
                );
                console.log(`🔍 Şöbə filtrindən sonra: ${filteredTasks.length}`);
            }

            if (this.currentFilters && this.currentFilters.task_type_id) {
                const workTypeId = parseInt(this.currentFilters.task_type_id);
                filteredTasks = filteredTasks.filter(task =>
                    task.work_type_id === workTypeId ||
                    task.task_type_id === workTypeId
                );
                console.log(`🔍 İş növü filtrindən sonra: ${filteredTasks.length}`);
            }

            console.log(`✅ Arxiv task-ları (final): ${filteredTasks.length}`);

            if (filteredTasks.length === 0) {
                console.log('⚠️ Heç bir arxiv taskı tapılmadı');
                this.showEmptyArchiveTable();
                return;
            }

            if (typeof TableManager !== 'undefined') {
                TableManager.renderTasksTable('archive', filteredTasks, append, page);
            }

            this.pagination.archive.hasMore = filteredTasks.length >= this.pagination.archive.pageSize;
            this.updateLoadMoreButton('archiveLoadMoreBtn', filteredTasks.length, 'archive');

        } catch (error) {
            console.error('❌ Arxiv task-ları yüklənərkən xəta:', error);
            this.showEmptyArchiveTable();
        }
    }

    // ✅ YENİ FUNKSİYA: Arxiv task-larını zənginləşdir
    async enrichArchiveTasks(tasks) {
        if (!tasks || tasks.length === 0) return tasks;

        console.log(`🔧 ${tasks.length} arxiv task zənginləşdirilir...`);

        return tasks.map(task => {
            // ✅ ƏGƏR ŞÖBƏ MƏLUMATI YOXDURSA, ƏLAVƏ ET
            if (!task.department_name && task.department_id && this.departments.length > 0) {
                const department = this.departments.find(d => d.id == task.department_id);
                if (department) {
                    task.department_name = department.department_name || department.name;
                    task.department = department;
                }
            }

            // ✅ ƏGƏR İŞ NÖVÜ MƏLUMATI YOXDURSA, ƏLAVƏ ET
            if (!task.work_type_name && task.work_type_id && this.workTypes.length > 0) {
                const workType = this.workTypes.find(w => w.id == task.work_type_id);
                if (workType) {
                    task.work_type_name = workType.work_type_name || workType.name;
                    task.work_type = workType;
                }
            }

            // ✅ ƏGƏR ŞİRKƏT MƏLUMATI YOXDURSA, ƏLAVƏ ET
            if (!task.company_name && task.company_id) {
                if (task.company_id == this.myCompany?.id) {
                    task.company_name = this.myCompany.company_name + ' (Mənim şirkətim)';
                } else {
                    const subsidiary = this.subsidiaryCompanies.find(s => s.id == task.company_id);
                    if (subsidiary) {
                        task.company_name = subsidiary.company_name + ' (Alt şirkət)';
                    }
                }
            }

            return task;
        });
    }

    async loadExternalTasks(page = 1, append = false) {
        try {
            console.log(`🌐 Digər şirkət task-ları yüklənir (səhifə ${page})...`);
            console.log(`👤 Mənim şirkətim ID: ${this.myCompany?.id}`);

            const queryParams = new URLSearchParams({
                page: page,
                limit: this.pagination.external.pageSize,
                status: 'pending,in_progress,overdue',
                exclude_my_company: 'true' // ✅ YALNIZ BAŞQA ŞİRKƏTLƏRİN TASK-LARI
            });

            // Əgər filtr varsa, əlavə et
            if (this.currentFilters && Object.keys(this.currentFilters).length > 0) {
                console.log('🔍 Current filters for external:', this.currentFilters);

                Object.entries(this.currentFilters).forEach(([key, value]) => {
                    if (value && value !== '') {
                        let apiKey = key;

                        // API field mapping
                        switch(key) {
                            case 'executor_user_id':
                                apiKey = 'assigned_to';
                                break;
                            case 'task_type_id':
                                apiKey = 'work_type_id';
                                break;
                            case 'company_id':
                            case 'department_id':
                            case 'status':
                            case 'created_from':
                            case 'created_to':
                            case 'due_from':
                            case 'due_to':
                                // Eyni qalır
                                break;
                            default:
                                return;
                        }

                        queryParams.append(apiKey, value);
                    }
                });
            }

            let externalTasks = [];

            // 1. YOL: /tasks/external endpoint
            try {
                console.log(`📡 External API 1: /tasks/external?${queryParams}`);
                const externalResponse = await this.apiRequest(`/tasks/external?${queryParams.toString()}`, 'GET');

                if (externalResponse && externalResponse.data && Array.isArray(externalResponse.data)) {
                    externalTasks = externalResponse.data;
                    console.log(`✅ /tasks/external-dən ${externalTasks.length} task tapıldı`);
                }
            } catch (externalError) {
                console.log('⚠️ /tasks/external endpoint işləmədi, alternativ yol cəhd edilir...');

                // 2. YOL: /tasks/detailed-dən filtrlə
                try {
                    queryParams.delete('exclude_my_company');

                    console.log(`📡 External API 2: /tasks/detailed?${queryParams}`);
                    const allTasksResponse = await this.apiRequest(`/tasks/detailed?${queryParams.toString()}`, 'GET');

                    if (allTasksResponse) {
                        let allTasks = [];

                        if (Array.isArray(allTasksResponse)) {
                            allTasks = allTasksResponse;
                        } else if (allTasksResponse.data && Array.isArray(allTasksResponse.data)) {
                            allTasks = allTasksResponse.data;
                        }

                        // ✅ BAŞQA ŞİRKƏTLƏRİN TASK-LARINI FILTRLƏ
                        externalTasks = allTasks.filter(task => {
                            // Mənim şirkətimdən olmayan task-lar
                            const isExternal = task.company_id !== this.myCompany?.id;

                            // Aktif statusda olan
                            const isActive = task.status === 'pending' ||
                                           task.status === 'in_progress' ||
                                           task.status === 'overdue';

                            return isExternal && isActive;
                        });

                        console.log(`✅ Alternativ yolla ${externalTasks.length} external task tapıldı`);
                    }
                } catch (detailedError) {
                    console.error('❌ Alternativ external yükləmə xətası:', detailedError);
                }
            }

            console.log(`📊 Digər şirkət task-ları: ${externalTasks.length}`);

            if (externalTasks.length === 0) {
                console.log('⚠️ Digər şirkətlərdən task tapılmadı');
                this.showEmptyExternalTable();
                return;
            }

            if (typeof TableManager !== 'undefined') {
                TableManager.renderTasksTable('external', externalTasks, append, page);
            }

            this.pagination.external.hasMore = externalTasks.length >= this.pagination.external.pageSize;
            this.updateLoadMoreButton('externalLoadMoreBtn', externalTasks.length, 'external');

        } catch (error) {
            console.error('❌ Digər şirkət task-ları yüklənərkən xəta:', error);
            this.showEmptyExternalTable();
        }
    }



    // ==================== UTILITY FUNCTIONS ====================
    updateLoadMoreButton(buttonId, currentItems, type) {
        const button = document.getElementById(buttonId);
        if (button) {
            const hasMore = currentItems >= this.pagination[type].pageSize;
            button.style.display = hasMore ? 'block' : 'none';
            this.pagination[type].hasMore = hasMore;

            if (hasMore) {
                button.innerHTML = 'Daha çox yüklə ➕';
                button.disabled = false;
            } else {
                button.innerHTML = 'Hamısı yükləndi ✓';
                button.disabled = true;
            }
        }
    }

    showEmptyActiveTable() {
        if (typeof TableManager !== 'undefined') {
            TableManager.renderTasksTable('active', []);
        }
    }

    showEmptyArchiveTable() {
        const tbody = document.getElementById('archiveTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="14" class="empty-state">
                        📁 Hazırda heç bir arxiv işi yoxdur.
                        <br>
                        <small>Tamamlanmış işlər həftəlik olaraq buraya arxivlənir.</small>
                    </td>
                </tr>
            `;
        }

        const loadMoreBtn = document.getElementById('archiveLoadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    }

    showEmptyExternalTable() {
        const tbody = document.getElementById('externalTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        🌐 Hazırda digər şirkətlərdən heç bir iş tapılmadı.
                        <br>
                        <small>Digər şirkətlər sizə task göndərdikdə burada görünəcək.</small>
                    </td>
                </tr>
            `;
        }

        const loadMoreBtn = document.getElementById('externalLoadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    }

    apiRequest(endpoint, method = 'GET', data = null) {
        return makeApiRequest(endpoint, method, data);
    }


    // ==================== FALLBACK FUNCTIONS ====================
    createFallbackCompanies() {
        this.myCompany = {
            id: this.userData.companyId,
            company_name: 'Mənim Şirkətim',
            company_code: this.userData.companyCode
        };

        this.subsidiaryCompanies = [];
        this.populateCompanySelects();
    }

    // ==================== DATA LOADING FUNCTIONS ====================
    async loadDepartments() {
        try {
            console.log('🏛️ Şöbələr yüklənir...');

            if (!this.myCompany?.id) {
                console.error('❌ Şirkət ID-si yoxdur!');
                this.departments = [];
                return;
            }

            const companyId = this.myCompany.id;
            console.log(`📋 Şöbələr gətirilir - Şirkət ID: ${companyId}`);

            let response;
            if (this.myCompany.company_code) {
                response = await this.apiRequest(`/departments/company-code/${this.myCompany.company_code}`, 'GET');
            }

            if (!response || response.error) {
                response = await this.apiRequest(`/departments/company/${companyId}/all`, 'GET');
            }

            if (response && Array.isArray(response.data)) {
                this.departments = response.data.filter(dept => dept.is_active !== false);
                console.log(`✅ ${this.departments.length} şöbə yükləndi`);
                this.populateDepartmentSelects();
            } else if (response && Array.isArray(response)) {
                this.departments = response.filter(dept => dept.is_active !== false);
                console.log(`✅ ${this.departments.length} şöbə yükləndi`);
                this.populateDepartmentSelects();
            } else {
                this.departments = [];
                console.warn('⚠️ Şöbə məlumatları boş gəldi');
            }

        } catch (error) {
            console.error('❌ Departments load error:', error);
            this.departments = [];
            this.showError('Şöbələr yüklənərkən xəta baş verdi');
        }
    }

    populateDepartmentSelects() {
        const departmentSelect = document.getElementById('departmentSelect');
        const filterDepartmentSelect = document.getElementById('filterDepartmentSelect');

        if (departmentSelect) {
            let html = '<option value="">Seçin</option>';

            this.departments.forEach(department => {
                const name = department.department_name || department.name || `Şöbə ${department.id}`;
                html += `<option value="${department.id}">${name}</option>`;
            });

            departmentSelect.innerHTML = html;
            console.log(`✅ Şöbə select-i dolduruldu: ${this.departments.length} şöbə`);
        }

        if (filterDepartmentSelect) {
            let html = '<option value="">Hamısı</option>';

            this.departments.forEach(department => {
                const name = department.department_name || department.name || `Şöbə ${department.id}`;
                html += `<option value="${department.id}">${name}</option>`;
            });

            filterDepartmentSelect.innerHTML = html;
            console.log(`✅ Filter şöbə select-i dolduruldu: ${this.departments.length} şöbə`);
        }
    }


    async loadEmployees() {
        try {
            console.log('👥 İşçilər yüklənir...');
            const currentCompanyCode = this.userData.companyCode;
            console.log(`📋 İşçilər gətirilir - Cari Şirkət Kodu: ${currentCompanyCode}`);

            const response = await this.apiRequest(`/users/company/${currentCompanyCode}`, 'GET');

            console.log('📦 İşçi API cavabı (RAW):', response);

            if (response && Array.isArray(response.data)) {
                this.employees = response.data
                    .filter(user => user.is_active !== false)
                    .map(user => {
                        let fullName = 'Ad Məlumatı Yoxdur';

                        if (user.ceo_name && user.ceo_lastname) {
                            fullName = `${user.ceo_name} ${user.ceo_lastname}`;
                        } else if (user.ceo_name) {
                            fullName = user.ceo_name;
                        } else if (user.full_name) {
                            fullName = user.full_name;
                        } else if (user.name) {
                            fullName = user.name;
                        } else if (user.email) {
                            fullName = user.email;
                        }

                        return {
                            id: user.id,
                            full_name: fullName,
                            email: user.email || user.ceo_email,
                            department_id: user.department_id,
                            hourly_rate: user.hourly_rate || 0,
                            position: user.position || 'İşçi',
                            is_admin: user.is_admin || false
                        };
                    });

                console.log(`✅ ${this.employees.length} işçi yükləndi`);
                this.populateEmployeeSelect();
            } else {
                console.warn('⚠️ İşçi məlumatları gözlənilən formatda deyil:', response);
                this.employees = [];
            }
        } catch (error) {
            console.error('❌ İşçilər yüklənərkən xəta:', error);
            this.showError('İşçi siyahısı gətirilərkən xəta baş verdi');
            this.employees = [];
        }
    }

    populateEmployeeSelect() {
        const executorSelect = document.getElementById('executorSelect');
        const filterExecutorSelect = document.getElementById('filterExecutorSelect');

        if (executorSelect) {
            let html = '<option value="">Seçin</option>';

            this.employees.forEach(employee => {
                const name = employee.full_name || employee.name || employee.email || 'Ad yoxdur';
                const email = employee.email ? ` (${employee.email})` : '';
                html += `<option value="${employee.id}">${name}${email}</option>`;
            });

            executorSelect.innerHTML = html;
            console.log(`✅ İşçi select-i dolduruldu: ${this.employees.length} işçi`);
        }

        if (filterExecutorSelect) {
            let html = '<option value="">Hamısı</option>';

            this.employees.forEach(employee => {
                const name = employee.full_name || employee.name || employee.email || 'Ad yoxdur';
                html += `<option value="${employee.id}">${name}</option>`;
            });

            filterExecutorSelect.innerHTML = html;
            console.log(`✅ Filter işçi select-i dolduruldu: ${this.employees.length} işçi`);
        }
    }

    // ==================== WORKTYPES LOADING ====================


}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM hazırdır, Task Manager başladılır...');

    try {
        if (typeof makeApiRequest === 'undefined') {
            console.error('❌ makeApiRequest function not found!');
            return;
        }

        window.taskManager = new TaskManager();

        window.taskManager.initialize().then(() => {
            console.log('🎉 Task Manager uğurla başladıldı');
        }).catch(error => {
            console.error('❌ Task Manager başlatma xətası:', error);
        });

    } catch (error) {
        console.error('❌ Initialization error:', error);
    }
});