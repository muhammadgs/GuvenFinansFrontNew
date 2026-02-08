/**
 * İşçilərin idarə edilməsi üçün xidmət - TAM VERSİYA (DEPARTAMENT ƏLAVƏ EDİLMİŞ)
 */
class EmployeesService {
    constructor(apiService) {
        this.api = apiService;
        this.currentCompanyCode = this.getCurrentCompanyCode();
        this.employeesCache = {};
        this.departmentsCache = {};
        this.currentDepartments = [];
    }

    /**
     * Bütün işçiləri gətir
     */
    async getAllEmployees(companyCode) {
        try {
            console.log(`📋 İşçilər gətirilir - Şirkət Kodu: ${companyCode}`);
            const response = await this.api.get(`/users/company/${companyCode}`);

            if (response && Array.isArray(response)) {
                console.log(`✅ ${response.length} işçi gətirildi`);
                return response;
            } else {
                console.warn('⚠️ İşçilər gətirilərkən format xətası');
                return [];
            }
        } catch (error) {
            console.error('❌ İşçilər gətirilərkən xəta:', error);
            return [];
        }
    }

    /**
     * Şirkət departamentlərini gətir
     */
    async getCompanyDepartments(companyCode) {
        try {
            console.log(`🏢 Şirkət ${companyCode} departamentləri gətirilir...`);

            if (this.departmentsCache[companyCode]) {
                console.log('✅ Departamentlər cache-dən gətirildi');
                return this.departmentsCache[companyCode];
            }

            // Şirkət ID-sini tapmağa çalış
            const companyId = await this.getCompanyIdFromCode(companyCode);

            if (companyId) {
                try {
                    const response = await this.api.get(`/departments/company/${companyId}/all`);

                    if (response && Array.isArray(response)) {
                        console.log(`✅ ${response.length} departament gətirildi (company_id: ${companyId})`);
                        this.departmentsCache[companyCode] = response;
                        this.currentDepartments = response;
                        return response;
                    }
                } catch (apiError) {
                    console.warn('⚠️ Departament API xətası (company_id ilə):', apiError);
                }
            }

            // Alternativ olaraq şirkət koduna görə cəhd et
            try {
                const response = await this.api.get(`/departments/company/${companyCode}`);

                if (response && Array.isArray(response)) {
                    console.log(`✅ ${response.length} departament gətirildi (company_code: ${companyCode})`);
                    this.departmentsCache[companyCode] = response;
                    this.currentDepartments = response;
                    return response;
                }
            } catch (altError) {
                console.warn('⚠️ Departament API xətası (company_code ilə):', altError);
            }

            return [];

        } catch (error) {
            console.error('❌ Departamentlər gətirilərkən xəta:', error);
            return [];
        }
    }

    /**
     * Şirkət kodundan ID tap
     */
    async getCompanyIdFromCode(companyCode) {
        try {
            // LocalStorage-dan yoxla
            const savedUser = localStorage.getItem('userData');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                if (parsedUser.user && parsedUser.user.company_code === companyCode && parsedUser.user.company_id) {
                    return parsedUser.user.company_id;
                }
                if (parsedUser.company_id) {
                    return parsedUser.company_id;
                }
            }

            // window.app-dən yoxla
            if (window.app && window.app.user && window.app.user.company_code === companyCode && window.app.user.company_id) {
                return window.app.user.company_id;
            }

            // Şirkət kodundan rəqəmsal hissə çıxar
            const numericMatch = companyCode.match(/\d+/g);
            if (numericMatch) {
                const numericId = parseInt(numericMatch.join(''));
                return numericId || 1;
            }

            return 1;
        } catch (error) {
            console.error('❌ Şirkət ID tapılmadı:', error);
            return 1;
        }
    }

    /**
     * Departament adını ID-yə görə tap
     */
    getDepartmentNameById(departmentId) {
        if (!departmentId) return 'Təyin edilməyib';

        if (this.currentDepartments && this.currentDepartments.length > 0) {
            const department = this.currentDepartments.find(dept =>
                dept.id == departmentId || dept.department_id == departmentId
            );
            if (department) return department.department_name;
        }

        for (const companyCode in this.departmentsCache) {
            const departments = this.departmentsCache[companyCode];
            const department = departments.find(dept =>
                dept.id == departmentId || dept.department_id == departmentId
            );
            if (department) return department.department_name;
        }

        return 'Təyin edilməyib';
    }

    /**
     * İşçilər modalını aç
     */
    async openEmployeesModal() {
        try {
            console.log('👥 İşçilər modalı açılır...');

            const companyCode = this.getCurrentCompanyCode();
            if (!companyCode) throw new Error('Şirkət kodu tapılmadı');

            const [employees, departments] = await Promise.all([
                this.getAllEmployees(companyCode),
                this.getCompanyDepartments(companyCode)
            ]);

            this.createEmployeesModal(employees, companyCode, departments);
            this.bindModalEvents();

            console.log('✅ İşçilər modalı hazır');
        } catch (error) {
            console.error('❌ İşçilər modalı açılarkən xəta:', error);
            throw error;
        }
    }

    /**
     * Cari şirkət kodunu tap
     */
    getCurrentCompanyCode() {
        try {
            const savedUser = localStorage.getItem('userData');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                if (parsedUser.user) {
                    return parsedUser.user.company_code || parsedUser.user.companyCode;
                } else {
                    return parsedUser.company_code || parsedUser.companyCode;
                }
            }

            if (window.app && window.app.user) {
                return window.app.user.company_code || window.app.user.companyCode;
            }

            return null;
        } catch (error) {
            console.error('❌ Şirkət kodu tapılarkən xəta:', error);
            return null;
        }
    }

    /**
     * İşçilər modalını yarat
     */
    createEmployeesModal(employees, companyCode, departments = []) {
        this.closeEmployeesModal();

        const departmentsInfo = departments.length > 0
            ? `<div class="text-xs text-blue-600 mt-1">${departments.length} departament mövcuddur</div>`
            : '';

        const departmentFilterOptions = departments.length > 0
            ? departments.map(dept =>
                `<option value="dept_${dept.id}">${dept.department_name}</option>`
              ).join('')
            : '';

        const modalHTML = `
            <div id="employeesModal" class="fixed inset-0 z-[100] overflow-y-auto bg-black bg-opacity-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                    <div class="inline-block w-full max-w-6xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
                        <!-- Modal Header -->
                        <div class="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div class="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                        <i class="fa-solid fa-users text-2xl text-white"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-2xl font-bold text-gray-900">
                                            İşçilərimin Listi
                                        </h3>
                                        <p class="text-gray-600 mt-1">Şirkət: ${companyCode}</p>
                                        ${departmentsInfo}
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <button id="modalAddEmployeeBtn"
                                            class="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition font-medium flex items-center gap-2 shadow-lg">
                                        <i class="fa-solid fa-user-plus"></i>
                                        Yeni İşçi
                                    </button>
                                    <button id="closeEmployeesModalBtn"
                                            class="h-12 w-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                                        <i class="fa-solid fa-times text-gray-600 text-lg"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Statistik kartlar -->
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                                <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-gray-600">Cəmi İşçi</p>
                                            <p class="text-2xl font-bold text-gray-900" id="totalEmployeesCount">${employees.length}</p>
                                        </div>
                                        <div class="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <i class="fa-solid fa-users text-blue-600"></i>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-gray-600">Aktiv İşçi</p>
                                            <p class="text-2xl font-bold text-gray-900" id="activeEmployeesCount">
                                                ${employees.filter(emp => emp.is_active === true || emp.status === 'active').length}
                                            </p>
                                        </div>
                                        <div class="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                                            <i class="fa-solid fa-user-check text-green-600"></i>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-gray-600">Departamentlər</p>
                                            <p class="text-2xl font-bold text-gray-900">${departments.length}</p>
                                        </div>
                                        <div class="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <i class="fa-solid fa-building text-purple-600"></i>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-gray-600">Son əlavə</p>
                                            <p class="text-lg font-bold text-gray-900" id="lastEmployeeAdded">
                                                ${employees.length > 0 ? this.formatDate(employees[0].created_at) : '-'}
                                            </p>
                                        </div>
                                        <div class="h-12 w-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                            <i class="fa-solid fa-calendar-plus text-orange-600"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Modal Body -->
                        <div class="flex-1 overflow-hidden flex flex-col">
                            <!-- Axtarış və filter -->
                            <div class="px-8 py-6 bg-gray-50 border-b">
                                <div class="flex flex-col md:flex-row gap-4">
                                    <div class="flex-1">
                                        <div class="relative">
                                            <i class="fa-solid fa-search absolute left-4 top-3.5 text-gray-400"></i>
                                            <input type="text"
                                                   id="employeeSearch"
                                                   placeholder="Ad, soyad, departament və ya email üzrə axtar..."
                                                   class="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <select id="employeeFilter"
                                                class="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                                            <option value="all">Hamısı</option>
                                            <option value="active">Yalnız aktiv</option>
                                            <option value="inactive">Yalnız deaktiv</option>
                                            ${departmentFilterOptions}
                                        </select>
                                        <button id="exportEmployeesBtn"
                                                class="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                                            <i class="fa-solid fa-download"></i>
                                            Export
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- İşçilər cədvəli -->
                            <div class="flex-1 overflow-auto">
                                <div class="px-8 py-6">
                                    ${this.renderEmployeesTable(employees, departments)}
                                </div>
                            </div>

                            <!-- Pagination -->
                            <div class="px-8 py-4 border-t bg-gray-50">
                                <div class="flex items-center justify-between">
                                    <div class="text-sm text-gray-600">
                                        <span id="showingText">1-${employees.length} of ${employees.length}</span>
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        <button id="refreshEmployeesBtn"
                                                class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                            <i class="fa-solid fa-rotate-right"></i>
                                            Yenilə
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        const modal = document.getElementById('employeesModal');
        if (modal) modal.classList.remove('hidden');
    }

    /**
     * İşçilər cədvəlini render et
     */
    renderEmployeesTable(employees, departments = []) {
        if (employees.length === 0) {
            return `
                <div class="text-center py-12">
                    <i class="fa-solid fa-users text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-700">İşçi tapılmadı</h3>
                    <p class="text-gray-500 mt-1">Bu şirkətə aid heç bir işçi yoxdur</p>
                    <button id="addFirstEmployeeBtn" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        İlk işçini əlavə et
                    </button>
                </div>
            `;
        }

        return `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ad Soyad</th>
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">Telefon</th>
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">Departament</th>
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">Vəzifə</th>
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">Əməliyyatlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employees.map(emp => {
                            let departmentName = 'Təyin edilməyib';
                            let departmentId = emp.department_id || emp.departmentId;
                            
                            if (departmentId && departments.length > 0) {
                                const department = departments.find(dept => 
                                    dept.id == departmentId || dept.department_id == departmentId
                                );
                                if (department) departmentName = department.department_name;
                            }
                            
                            return `
                            <tr class="border-b border-gray-100 hover:bg-gray-50">
                                <td class="py-3 px-4">
                                    <div class="flex items-center gap-3">
                                        <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                            ${(emp.first_name?.[0] || emp.ceo_name?.[0] || 'İ').toUpperCase()}
                                        </div>
                                        <div>
                                            <div class="font-medium">
                                                ${emp.first_name || emp.ceo_name || ''} 
                                                ${emp.last_name || emp.ceo_lastname || ''}
                                            </div>
                                            <div class="text-xs text-gray-500">${emp.username || ''}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-3 px-4">
                                    <div class="text-sm">${emp.email || emp.ceo_email || '-'}</div>
                                    ${emp.email_verified ? 
                                        '<span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">✓ Təsdiqlənib</span>' : 
                                        '<span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Təsdiqlənməyib</span>'}
                                </td>
                                <td class="py-3 px-4 text-sm">${emp.phone || emp.ceo_phone || '-'}</td>
                                <td class="py-3 px-4">
                                    <div class="text-sm font-medium">${departmentName}</div>
                                    ${departmentId ? `<div class="text-xs text-gray-500">ID: ${departmentId}</div>` : ''}
                                </td>
                                <td class="py-3 px-4">
                                    <div class="text-sm font-medium">${emp.position || emp.user_type || 'Təyin edilməyib'}</div>
                                    <div class="text-xs text-gray-500">${emp.user_type || ''}</div>
                                </td>
                                <td class="py-3 px-4">
                                    ${emp.is_active === true ? 
                                        '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Aktiv</span>' : 
                                        '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Deaktiv</span>'}
                                </td>
                                <td class="py-3 px-4">
                                    <div class="flex gap-2">
                                        <button class="view-employee-btn p-2 text-blue-600 hover:bg-blue-50 rounded-lg" data-id="${emp.id}">
                                            <i class="fa-solid fa-eye"></i>
                                        </button>
                                        <button class="edit-employee-btn p-2 text-green-600 hover:bg-green-50 rounded-lg" data-id="${emp.id}">
                                            <i class="fa-solid fa-edit"></i>
                                        </button>
                                        <button class="delete-employee-btn p-2 text-red-600 hover:bg-red-50 rounded-lg" data-id="${emp.id}">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Modal event-lərini bağla
     */
    bindModalEvents() {
        // Bağlama düyməsi
        const closeBtn = document.getElementById('closeEmployeesModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeEmployeesModal());
        }

        // Modal overlay
        const modal = document.getElementById('employeesModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeEmployeesModal();
            });
        }

        // Escape klaviatura
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                this.closeEmployeesModal();
            }
        });

        // Axtarış
        const searchInput = document.getElementById('employeeSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterEmployees(e.target.value));
        }

        // Filter
        const filterSelect = document.getElementById('employeeFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => this.filterByDepartment(e.target.value));
        }

        // Yeni işçi əlavə et
        const addBtn = document.getElementById('modalAddEmployeeBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.openAddEmployeeForm());

        // Yenilə
        const refreshBtn = document.getElementById('refreshEmployeesBtn');
        if (refreshBtn) refreshBtn.addEventListener('click', async () => await this.refreshEmployees());

        // İlk işçi əlavə et
        const addFirstBtn = document.getElementById('addFirstEmployeeBtn');
        if (addFirstBtn) addFirstBtn.addEventListener('click', () => this.openAddEmployeeForm());

        // İşçi əməliyyat düymələri
        document.querySelectorAll('.view-employee-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const employeeId = e.target.closest('button').dataset.id;
                this.viewEmployee(employeeId);
            });
        });

        document.querySelectorAll('.edit-employee-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const employeeId = e.target.closest('button').dataset.id;
                this.editEmployee(employeeId);
            });
        });

        document.querySelectorAll('.delete-employee-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const employeeId = e.target.closest('button').dataset.id;
                await this.deleteEmployee(employeeId);
            });
        });
    }

    /**
     * Tarixi formatla
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('az-AZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * Modalı bağla
     */
    closeEmployeesModal() {
        const modal = document.getElementById('employeesModal');
        if (modal) modal.remove();

        const editModal = document.getElementById('editEmployeeModal');
        if (editModal) editModal.remove();

        const addModal = document.getElementById('addEmployeeModal');
        if (addModal) addModal.remove();
    }

    /**
     * İşçiləri filterlə
     */
    filterEmployees(searchTerm) {
        const rows = document.querySelectorAll('#employeesModal tbody tr');
        searchTerm = searchTerm.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    /**
     * Departamentə görə filterlə
     */
    filterByDepartment(filterValue) {
        const rows = document.querySelectorAll('#employeesModal tbody tr');

        rows.forEach(row => {
            if (filterValue === 'all') {
                row.style.display = '';
                return;
            }

            if (filterValue === 'active') {
                const statusText = row.querySelector('td:nth-child(6)').textContent;
                row.style.display = statusText.includes('Aktiv') ? '' : 'none';
                return;
            }

            if (filterValue === 'inactive') {
                const statusText = row.querySelector('td:nth-child(6)').textContent;
                row.style.display = statusText.includes('Deaktiv') ? '' : 'none';
                return;
            }

            if (filterValue.startsWith('dept_')) {
                const departmentId = filterValue.replace('dept_', '');
                const departmentCell = row.querySelector('td:nth-child(4)');
                const deptIdText = departmentCell.querySelector('.text-xs.text-gray-500');

                if (deptIdText && deptIdText.textContent.includes(departmentId)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    }

    /**
     * İşçiləri yenilə - DÜZGÜN VERSİYA
     */
    async refreshEmployees() {
        let refreshBtn = null;
        let originalHtml = '';

        try {
            console.log('🔄 İşçilər yenilənir...');

            // Refresh düyməsini tap və disable et
            refreshBtn = document.getElementById('refreshEmployeesBtn');
            if (refreshBtn) {
                originalHtml = refreshBtn.innerHTML;
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yenilənir...';
            }

            const companyCode = this.getCurrentCompanyCode();
            if (!companyCode) {
                this.showErrorMessage('Şirkət kodu tapılmadı');
                return;
            }

            // 1. Təzə məlumatları gətir
            const employees = await this.getAllEmployees(companyCode);
            const departments = await this.getCompanyDepartments(companyCode);

            // 2. YALNIZ TBODY hissəsini yenilə
            const tbody = document.querySelector('#employeesModal tbody');
            if (tbody) {
                tbody.innerHTML = this.renderTableRows(employees, departments);

                // 3. Yalnız cədvəl event-lərini bağla
                this.bindTableActions();
            }

            if (tbody) {
                console.log('✅ Tbody tapıldı, yenilənir...');

                // 1. Əvvəlcə köhnə content-i sil (visual feedback üçün)
                tbody.style.opacity = '0.5';

                // 2. Yeni content-i əlavə et
                const newContent = this.renderTableRows(employees, departments);
                tbody.innerHTML = newContent;

                // 3. Render-i təmin et
                setTimeout(() => {
                    tbody.style.opacity = '1';
                    // Force reflow/re-render
                    tbody.offsetHeight; // Bu sətir reflow-u trigger edir
                }, 50);

                // 3. Yalnız cədvəl event-lərini bağla
                this.bindTableActions();

                console.log('✅ Tbody yeniləndi, yeni sətir sayı:', document.querySelectorAll('#employeesModal tbody tr').length);
            }

            // 4. Statistikaları yenilə
            this.updateStatistics(employees);

            // 5. Showing text-i yenilə
            const showingText = document.getElementById('showingText');
            if (showingText) {
                showingText.textContent = `1-${employees.length} of ${employees.length}`;
            }

            console.log('✅ İşçilər yeniləndi');
            this.showSuccessMessage('Siyahı yeniləndi');

        } catch (error) {
            console.error('❌ Xəta:', error);
            this.showErrorMessage('Xəta: ' + error.message);
        } finally {
            // ✅ Refresh düyməsini həmişə enable et
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = originalHtml || '<i class="fa-solid fa-rotate-right"></i> Yenilə';
            }
        }
    }

    /**
     * Statistikaları yenilə
     */
    updateStatistics(employees) {
        try {
            console.log('📊 Statistikalar yenilənir...');

            // Total employees count
            const totalElement = document.getElementById('totalEmployeesCount');
            if (totalElement) {
                totalElement.textContent = employees.length;
            }

            // Active employees count
            const activeElement = document.getElementById('activeEmployeesCount');
            if (activeElement) {
                const activeCount = employees.filter(emp =>
                    emp.is_active === true ||
                    emp.is_active === 1 ||
                    emp.is_active === 'true'
                ).length;
                activeElement.textContent = activeCount;
            }

            // Last employee added
            const lastAddedElement = document.getElementById('lastEmployeeAdded');
            if (lastAddedElement && employees.length > 0) {
                // Tarixə görə sırala
                const sorted = [...employees].sort((a, b) =>
                    new Date(b.created_at || 0) - new Date(a.created_at || 0)
                );
                const lastEmployee = sorted[0];
                if (lastEmployee.created_at) {
                    lastAddedElement.textContent = this.formatDate(lastEmployee.created_at);
                } else {
                    lastAddedElement.textContent = '-';
                }
            }

            console.log('✅ Statistikalar yeniləndi');

        } catch (error) {
            console.warn('⚠️ Statistikalar yenilənərkən xəta:', error);
        }
    }

    /**
     * Cədvəl sətirlərini render et
     */
    renderTableRows(employees, departments = []) {
        if (employees.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center py-12">
                        <i class="fa-solid fa-users text-4xl text-gray-300 mb-4"></i>
                        <h3 class="text-lg font-semibold text-gray-700">İşçi tapılmadı</h3>
                        <p class="text-gray-500 mt-1">Bu şirkətə aid heç bir işçi yoxdur</p>
                        <button id="addFirstEmployeeBtn" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                            İlk işçini əlavə et
                        </button>
                    </td>
                </tr>
            `;
        }

        return employees.map(emp => {
            let departmentName = 'Təyin edilməyib';
            let departmentId = emp.department_id || emp.departmentId;

            if (departmentId && departments.length > 0) {
                const department = departments.find(dept =>
                    dept.id == departmentId || dept.department_id == departmentId
                );
                if (department) departmentName = department.department_name;
            }

            return `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                        <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                            ${(emp.first_name?.[0] || emp.ceo_name?.[0] || 'İ').toUpperCase()}
                        </div>
                        <div>
                            <div class="font-medium">
                                ${emp.first_name || emp.ceo_name || ''} 
                                ${emp.last_name || emp.ceo_lastname || ''}
                            </div>
                            <div class="text-xs text-gray-500">${emp.username || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-4">
                    <div class="text-sm">${emp.email || emp.ceo_email || '-'}</div>
                    ${emp.email_verified ? 
                        '<span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">✓ Təsdiqlənib</span>' : 
                        '<span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Təsdiqlənməyib</span>'}
                </td>
                <td class="py-3 px-4 text-sm">${emp.phone || emp.ceo_phone || '-'}</td>
                <td class="py-3 px-4">
                    <div class="text-sm font-medium">${departmentName}</div>
                    ${departmentId ? `<div class="text-xs text-gray-500">ID: ${departmentId}</div>` : ''}
                </td>
                <td class="py-3 px-4">
                    <div class="text-sm font-medium">${emp.position || emp.user_type || 'Təyin edilməyib'}</div>
                    <div class="text-xs text-gray-500">${emp.user_type || ''}</div>
                </td>
                <td class="py-3 px-4">
                    ${emp.is_active === true ? 
                        '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Aktiv</span>' : 
                        '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Deaktiv</span>'}
                </td>
                <td class="py-3 px-4">
                    <div class="flex gap-2">
                        <button class="view-employee-btn p-2 text-blue-600 hover:bg-blue-50 rounded-lg" data-id="${emp.id}">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="edit-employee-btn p-2 text-green-600 hover:bg-green-50 rounded-lg" data-id="${emp.id}">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button class="delete-employee-btn p-2 text-red-600 hover:bg-red-50 rounded-lg" data-id="${emp.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    /**
     * Yalnız cədvəl action düymələrinin event-lərini bağla
     */
    bindTableActions() {
        // Köhnə event listener-ları sil
        document.querySelectorAll('.view-employee-btn, .edit-employee-btn, .delete-employee-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });

        // Yeniləri bağla
        document.querySelectorAll('.view-employee-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const employeeId = e.currentTarget.getAttribute('data-id');
                this.viewEmployee(employeeId);
            });
        });

        document.querySelectorAll('.edit-employee-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const employeeId = e.currentTarget.getAttribute('data-id');
                this.editEmployee(employeeId);
            });
        });

        document.querySelectorAll('.delete-employee-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const employeeId = e.currentTarget.getAttribute('data-id');
                await this.deleteEmployee(employeeId);
            });
        });
    }


    /**
     * Yeni işçi formu aç
     */
    async openAddEmployeeForm() {
        this.closeEditModal();

        const companyCode = this.getCurrentCompanyCode();
        if (!companyCode) {
            this.showErrorMessage('Şirkət kodu tapılmadı');
            return;
        }

        const departments = await this.getCompanyDepartments(companyCode);

        const departmentOptions = departments.length > 0
            ? departments.map(dept =>
                `<option value="${dept.id}">${dept.department_name}</option>`
              ).join('')
            : '<option value="">Departament yoxdur</option>';

        const modalHTML = `
            <div id="addEmployeeModal" class="fixed inset-0 z-[110] overflow-y-auto bg-black bg-opacity-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                    <div class="inline-block w-full max-w-4xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden">
                        <!-- Modal Header -->
                        <div class="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                                        <i class="fa-solid fa-user-plus text-green-600"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-bold text-gray-900">Yeni İşçi Əlavə Et</h3>
                                        <p class="text-gray-600 text-sm">Yeni işçi məlumatlarını daxil edin</p>
                                    </div>
                                </div>
                                <button id="closeAddEmployeeModalBtn"
                                        class="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                    <i class="fa-solid fa-times text-gray-600"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Modal Body -->
                        <div class="px-8 py-6 max-h-[70vh] overflow-y-auto">
                            <form id="addEmployeeForm" class="space-y-6">
                                <!-- Şəxsi Məlumatlar -->
                                <div class="bg-blue-50 rounded-xl p-5">
                                    <h4 class="text-lg font-semibold text-blue-800 mb-4">Şəxsi Məlumatlar</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Ad *</label>
                                            <input type="text" required id="addEmployeeFirstName" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                                   placeholder="Ad">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Soyad *</label>
                                            <input type="text" required id="addEmployeeLastName" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                                   placeholder="Soyad">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Ata adı</label>
                                            <input type="text" id="addEmployeeFatherName" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                                   placeholder="Ata adı">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Doğum tarixi</label>
                                            <input type="date" id="addEmployeeBirthDate" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Cinsiyyət</label>
                                            <select id="addEmployeeGender" 
                                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="">Seçin</option>
                                                <option value="male">Kişi</option>
                                                <option value="female">Qadın</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Əlaqə Məlumatları -->
                                <div class="bg-green-50 rounded-xl p-5">
                                    <h4 class="text-lg font-semibold text-green-800 mb-4">Əlaqə Məlumatları</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                            <input type="email" required id="addEmployeeEmail" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                                   placeholder="email@example.com">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                                            <input type="tel" id="addEmployeePhone" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                                   placeholder="+994501234567">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">FİN Kod</label>
                                            <input type="text" id="addEmployeeFinCode" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                                   placeholder="1234567">
                                        </div>
                                    </div>
                                </div>
                               
                                <!-- İş Məlumatları -->
                                <div class="bg-purple-50 rounded-xl p-5">
                                    <h4 class="text-lg font-semibold text-purple-800 mb-4">İş Məlumatları</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Departament *</label>
                                            <select required id="addEmployeeDepartment" 
                                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="">Seçin</option>
                                                ${departmentOptions}
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Şöbə</label>
                                            <input type="text" id="addEmployeePosition" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                                   placeholder="Məsələn: Developer">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">İşə qəbul tarixi</label>
                                            <input type="date" id="addEmployeeHireDate" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Status -->
                                <div class="bg-yellow-50 rounded-xl p-5">
                                    <h4 class="text-lg font-semibold text-yellow-800 mb-4">Status</h4>
                                    <div class="space-y-3">
                                        <div class="flex items-center">
                                            <input type="checkbox" id="addEmployeeIsActive" checked
                                                   class="h-4 w-4 text-blue-600 border-gray-300 rounded">
                                            <label for="addEmployeeIsActive" class="ml-2 text-sm text-gray-700">Aktiv işçi</label>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Təsdiq düymələri -->
                                <div class="flex justify-end gap-3 pt-4">
                                    <button type="button" id="cancelAddEmployeeBtn" 
                                            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                                        Ləğv et
                                    </button>
                                    <button type="submit" id="submitAddEmployeeBtn" 
                                            class="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2">
                                        <i class="fa-solid fa-check"></i>
                                        Əlavə et
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        this.bindAddEmployeeEvents();
    }

    /**
     * İşçiyə bax
     */
    async viewEmployee(employeeId) {
        try {
            console.log(`👁️ İşçi detalları gətirilir: ${employeeId}`);
            const employee = await this.getEmployeeById(employeeId);
            this.showEmployeeDetails(employee);
        } catch (error) {
            console.error('❌ İşçi məlumatları gətirilərkən xəta:', error);
            this.showErrorMessage('Xəta: ' + error.message);
        }
    }

    showEmployeeDetails(employee) {
        const modalHTML = `
            <div id="employeeDetailsModal" class="fixed inset-0 z-[130] overflow-y-auto bg-black bg-opacity-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                    <div class="inline-block w-full max-w-2xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden">
                        <div class="px-8 py-6 border-b">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                        <i class="fa-solid fa-user text-blue-600"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-bold text-gray-900">
                                            ${employee.first_name || employee.name || ''} ${employee.last_name || employee.surname || ''}
                                        </h3>
                                        <p class="text-gray-600 text-sm">ID: ${employee.id}</p>
                                    </div>
                                </div>
                                <button onclick="document.getElementById('employeeDetailsModal').remove()"
                                        class="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                    <i class="fa-solid fa-times text-gray-600"></i>
                                </button>
                            </div>
                        </div>
                        <div class="px-8 py-6">
                            <div class="space-y-4">
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-sm text-gray-500">Email</p>
                                        <p class="font-medium">${employee.email || '-'}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">Telefon</p>
                                        <p class="font-medium">${employee.phone || '-'}</p>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-sm text-gray-500">Vəzifə</p>
                                        <p class="font-medium">${employee.position || '-'}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">Departament</p>
                                        <p class="font-medium">${this.getDepartmentNameById(employee.department_id)}</p>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">Status</p>
                                    <span class="px-3 py-1 rounded-full text-xs font-medium ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                        ${employee.is_active ? 'Aktiv' : 'Deaktiv'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
    }

    /**
     * İşçini redaktə et
     */
    async editEmployee(employeeId) {
        try {
            console.log(`✏️ İşçi redaktəsi: ${employeeId}`);
            const employee = await this.getEmployeeById(employeeId);
            this.createEditEmployeeModal(employee);
        } catch (error) {
            console.error('❌ İşçi redaktəsi xətası:', error);
            this.showErrorMessage('Xəta: ' + error.message);
        }
    }

    /**
     * Redaktə modalını yarat
     */
    createEditEmployeeModal(employee) {
        this.closeEditModal();

        const companyCode = this.getCurrentCompanyCode();
        const departments = this.departmentsCache[companyCode] || [];

        const departmentOptions = departments.length > 0
            ? departments.map(dept =>
                `<option value="${dept.id}" ${(employee.department_id == dept.id) ? 'selected' : ''}>
                    ${dept.department_name}
                </option>`
              ).join('')
            : '<option value="">Departament yoxdur</option>';

        const modalHTML = `
            <div id="editEmployeeModal" class="fixed inset-0 z-[120] overflow-y-auto bg-black bg-opacity-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                    <div class="inline-block w-full max-w-5xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden">
                        <!-- Modal Header -->
                        <div class="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                                        <i class="fa-solid fa-user-edit text-green-600"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-bold text-gray-900">İşçi Redaktəsi</h3>
                                        <p class="text-gray-600 text-sm">ID: ${employee.id}</p>
                                    </div>
                                </div>
                                <button id="closeEditEmployeeModalBtn"
                                        class="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                    <i class="fa-solid fa-times text-gray-600"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Modal Body -->
                        <div class="px-8 py-6 max-h-[70vh] overflow-y-auto">
                            <form id="editEmployeeForm" class="space-y-6">
                                <input type="hidden" id="editEmployeeId" value="${employee.id}">
                                
                                <!-- Şəxsi Məlumatlar -->
                                <div class="bg-blue-50 rounded-xl p-5">
                                    <h4 class="text-lg font-semibold text-blue-800 mb-4">Şəxsi Məlumatlar</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Ad *</label>
                                            <input type="text" required id="editEmployeeFirstName" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   value="${employee.first_name || employee.name || employee.ceo_name || ''}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Soyad *</label>
                                            <input type="text" required id="editEmployeeLastName" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   value="${employee.last_name || employee.surname || employee.ceo_lastname || ''}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Ata adı</label>
                                            <input type="text" id="editEmployeeFatherName" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   value="${employee.father_name || ''}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Doğum tarixi</label>
                                            <input type="date" id="editEmployeeBirthDate" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   value="${employee.birth_date || ''}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Cinsiyyət</label>
                                            <select id="editEmployeeGender" 
                                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="">Seçin</option>
                                                <option value="male" ${employee.gender === 'male' ? 'selected' : ''}>Kişi</option>
                                                <option value="female" ${employee.gender === 'female' ? 'selected' : ''}>Qadın</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Əlaqə və Sənəd Məlumatları -->
                                <div class="bg-green-50 rounded-xl p-5">
                                    <h4 class="text-lg font-semibold text-green-800 mb-4">Əlaqə və Sənəd Məlumatları</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                            <input type="email" required id="editEmployeeEmail" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   value="${employee.email || employee.ceo_email || ''}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                                            <input type="tel" id="editEmployeePhone" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   value="${employee.phone || employee.ceo_phone || ''}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">FİN Kod</label>
                                            <input type="text" id="editEmployeeFinCode" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   value="${employee.fin_code || ''}">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- İş Məlumatları -->
                                <div class="bg-purple-50 rounded-xl p-5">
                                    <h4 class="text-lg font-semibold text-purple-800 mb-4">İş Məlumatları</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Departament *</label>
                                            <select required id="editEmployeeDepartment" 
                                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="">Seçin</option>
                                                ${departmentOptions}
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Şöbə</label>
                                            <input type="text" id="editEmployeePosition" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   value="${employee.position || 'Employee'}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Maaş</label>
                                            <input type="number" id="editEmployeeSalary" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   value="${employee.salary || ''}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Bank hesabı</label>
                                            <input type="text" id="editEmployeeBankAccount" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   value="${employee.bank_account || ''}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">İş növü</label>
                                            <select id="editEmployeeEmploymentType" 
                                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="full_time" ${employee.employment_type === 'full_time' ? 'selected' : ''}>Tam ştat</option>
                                                <option value="part_time" ${employee.employment_type === 'part_time' ? 'selected' : ''}>Yarımştat</option>
                                                <option value="contract" ${employee.employment_type === 'contract' ? 'selected' : ''}>Müqavilə</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">İşə qəbul tarixi</label>
                                            <input type="date" id="editEmployeeHireDate" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                   value="${employee.hire_date || ''}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Valyuta</label>
                                            <select id="editEmployeeCurrency" 
                                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="AZN" ${employee.currency === 'AZN' ? 'selected' : ''}>AZN</option>
                                                <option value="USD" ${employee.currency === 'USD' ? 'selected' : ''}>USD</option>
                                                <option value="EUR" ${employee.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Status və Hüquqlar -->
                                <div class="bg-yellow-50 rounded-xl p-5">
                                    <h4 class="text-lg font-semibold text-yellow-800 mb-4">Status və Hüquqlar</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="space-y-3">
                                            <div class="flex items-center">
                                                <input type="checkbox" id="editEmployeeIsActive" 
                                                       ${employee.is_active === true || employee.is_active === 1 || employee.is_active === 'true' || employee.is_active === undefined ? 'checked' : ''}
                                                       class="h-4 w-4 text-blue-600 border-gray-300 rounded">
                                                <label for="editEmployeeIsActive" class="ml-2 text-sm text-gray-700">Aktiv işçi</label>
                                            </div>                                                   
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Təsdiq düymələri -->
                                <div class="flex justify-end gap-3 pt-4">
                                    <button type="button" id="cancelEditEmployeeBtn" 
                                            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                                        Ləğv et
                                    </button>
                                    <button type="submit" id="submitEditEmployeeBtn" 
                                            class="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2">
                                        <i class="fa-solid fa-save"></i>
                                        Yadda saxla
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        this.bindEditEmployeeEvents();
    }

    /**
     * İşçi sil
     */
    async deleteEmployee(employeeId) {
        if (!confirm(`İşçi #${employeeId} silinsin?`)) return;

        try {
            const employee = await this.getEmployeeById(employeeId);
            const employeeName = `${employee.first_name || employee.name || ''} ${employee.last_name || employee.surname || ''}`.trim();

            const confirmed = confirm(`"${employeeName}" adlı işçini silmək istədiyinizə əminsiniz?\n\nBu əməliyyat geri qaytarıla bilməz!`);
            if (!confirmed) return;

            console.log(`🗑️ İşçi silinir: ${employeeId}`);
            await this.api.delete(`/users/${employeeId}/soft`);

            this.showSuccessMessage(`"${employeeName}" uğurla silindi`);
            await this.refreshEmployees();

        } catch (error) {
            console.error('❌ İşçi silinərkən xəta:', error);
            if (error.message.includes('403') || error.response?.status === 403) {
                this.showErrorMessage('Bu istifadəçini silmək üçün icazəniz yoxdur.');
            } else {
                this.showErrorMessage('Xəta baş verdi: ' + error.message);
            }
        }
    }

    /**
     * Uğurlu mesaj göstər
     */
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-[200] animate-fade-in';
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fa-solid fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * Xəta mesajı göstər
     */
    showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-[200] animate-fade-in';
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fa-solid fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    /**
     * Edit modalını bağla
     */
    closeEditModal() {
        const editModal = document.getElementById('editEmployeeModal');
        if (editModal) editModal.remove();
    }

    /**
     * Add modalını bağla
     */
    closeAddModal() {
        const addModal = document.getElementById('addEmployeeModal');
        if (addModal) addModal.remove();
    }

    /**
     * Tək işçini gətir
     */
    async getEmployeeById(employeeId) {
        try {
            console.log(`🔄 İşçi gətirilir: ${employeeId}`);

            if (this.employeesCache[employeeId]) {
                console.log(`✅ İşçi cache-dən gətirildi: ${employeeId}`);
                return this.employeesCache[employeeId];
            }

            const companyCode = this.getCurrentCompanyCode();
            if (companyCode) {
                try {
                    console.log(`📥 API-dən şirkət işçiləri gətirilir: ${companyCode}`);
                    const employees = await this.getAllEmployees(companyCode);
                    employees.forEach(emp => this.employeesCache[emp.id] = emp);

                    if (this.employeesCache[employeeId]) {
                        console.log(`✅ İşçi şirkət siyahısından tapıldı: ${employeeId}`);
                        return this.employeesCache[employeeId];
                    }
                } catch (cacheError) {
                    console.warn('❌ Cache doldurma xətası:', cacheError);
                }
            }

            console.log(`🔄 İşçi gətirilir: ${employeeId}`);

            if (this.employeesCache[employeeId]) {
                console.log(`✅ İşçi cache-dən gətirildi: ${employeeId}`);
                return this.employeesCache[employeeId];
            }

            console.log(`🎯 Direct API call for user: ${employeeId}`);
            const response = await this.api.get(`/users/${employeeId}`);

            if (response) {
                console.log(`✅ İşçi API-dən gətirildi: ${employeeId}`, response);

                // ✅ Cache-i təmizlə və yenilə
                this.employeesCache[employeeId] = response;

                // ✅ Response formatını yoxla və düzəlt
                const formattedResponse = this.formatEmployeeResponse(response);
                return formattedResponse;
            }

            throw new Error('İşçi tapılmadı');

        } catch (error) {
            console.error('❌ İşçi gətirilərkən xəta:', error);

            if (error.message.includes('403') || error.message.includes('Bu işçiyə baxmaq üçün icazəniz yoxdur')) {
                console.warn('⚠️ Access denied, trying to find in cache...');

                if (this.employeesCache[employeeId]) {
                    console.log(`✅ Found in local cache despite 403: ${employeeId}`);
                    return this.employeesCache[employeeId];
                }

                try {
                    const companyCode = this.getCurrentCompanyCode();
                    if (companyCode) {
                        console.log(`🔄 Getting company employees for cache...`);
                        const employees = await this.getAllEmployees(companyCode);
                        employees.forEach(emp => this.employeesCache[emp.id] = emp);

                        if (this.employeesCache[employeeId]) {
                            console.log(`✅ Found in refreshed cache: ${employeeId}`);
                            return this.employeesCache[employeeId];
                        }
                    }
                } catch (cacheError) {
                    console.error('❌ Cache refresh error:', cacheError);
                }

                return this.createDefaultEmployee(employeeId);
            }

            throw error;
        }
    }

    /**
     * Employee response formatını düzəlt
     */
    formatEmployeeResponse(employee) {
        // ✅ Frontend-in gözlədiyi formatda düzəlt
        return {
            id: employee.id,
            email: employee.email || employee.ceo_email || '',
            phone: employee.phone || employee.ceo_phone || '',
            first_name: employee.first_name || employee.ceo_name || '',
            last_name: employee.last_name || employee.ceo_lastname || '',
            ceo_name: employee.ceo_name || employee.first_name || '',
            ceo_lastname: employee.ceo_lastname || employee.last_name || '',
            ceo_email: employee.ceo_email || employee.email || '',
            ceo_phone: employee.ceo_phone || employee.phone || '',
            father_name: employee.father_name || '',
            position: employee.position || 'Employee',
            gender: employee.gender || '',
            birth_date: employee.birth_date || '',
            fin_code: employee.fin_code || '',
            department_id: employee.department_id || null,
            salary: employee.salary || null,
            bank_account: employee.bank_account || '',
            employment_type: employee.employment_type || 'full_time',
            hire_date: employee.hire_date || '',
            currency: employee.currency || 'AZN',
            is_active: employee.is_active !== undefined ? employee.is_active : true,
            is_admin: employee.is_admin || false,
            is_super_admin: employee.is_super_admin || false,
            email_verified: employee.email_verified || false,
            phone_verified: employee.phone_verified || false,
            is_telegram_verified: employee.is_telegram_verified || false,
            telegram_username: employee.telegram_username || '',
            profile_image_url: employee.profile_image_url || '',
            user_type: employee.user_type || 'employee',
            company_code: employee.company_code || '',
            voen: employee.voen || '',
            created_at: employee.created_at || new Date().toISOString(),
            updated_at: employee.updated_at || new Date().toISOString(),
            last_login_at: employee.last_login_at || null,
            uuid: employee.uuid || '',
            role: employee.role || 'employee'
        };
    }

    createDefaultEmployee(employeeId) {
        console.log(`🆕 Creating default employee for ID: ${employeeId}`);

        return {
            id: employeeId,
            email: `user${employeeId}@company.com`,
            phone: '+99450XXXXXXX',
            first_name: 'İşçi',
            last_name: employeeId.toString(),
            position: 'Employee',
            department: '',
            company_code: this.getCurrentCompanyCode() || 'Unknown',
            created_at: new Date().toISOString(),
            salary: '',
            bank_account: '',
            employment_type: 'full_time',
            hire_date: '',
            currency: 'AZN',
            fin_code: '',
            gender: '',
            birth_date: '',
            role: 'employee'
        };
    }

    /**
     * İşçi əlavə et
     */
    async addEmployee(employeeData) {
        try {
            console.log('➕ Yeni işçi əlavə edilir:', employeeData);

            // Şirkət kodu tap
            let companyCode = this.currentCompanyCode ||
                             localStorage.getItem('currentCompanyCode') ||
                             employeeData.company_code;

            if (!companyCode) {
                const savedUser = localStorage.getItem('userData');
                if (savedUser) {
                    const parsedUser = JSON.parse(savedUser);
                    companyCode = parsedUser.user?.company_code ||
                                  parsedUser.company_code ||
                                  parsedUser.user?.companyCode;
                }

                if (!companyCode && window.app?.user) {
                    companyCode = window.app.user.company_code || window.app.user.companyCode;
                }

                if (!companyCode) throw new Error('Şirkət kodu tapılmadı!');
            }

            console.log('🏢 İstifadə olunan company_code:', companyCode);

            const requestData = {
                // Users cədvəli üçün
                ceo_name: employeeData.first_name || employeeData.ceo_name,
                ceo_lastname: employeeData.last_name || employeeData.ceo_lastname,
                ceo_email: employeeData.email || employeeData.ceo_email,
                ceo_phone: employeeData.phone || employeeData.ceo_phone || "+994501234567",
                ceo_password: employeeData.ceo_password || "123456",
                company_code: companyCode,
                position: employeeData.position || "Employee",
                is_active: employeeData.is_active !== undefined ? employeeData.is_active : true,
                father_name: employeeData.father_name || null,
                birth_date: employeeData.birth_date || null,
                gender: employeeData.gender || null,
                fin_code: employeeData.fin_code || null,
                department_id: employeeData.department_id || null,  // ✅ users cədvəlinə
                voen: "",

                // Employees cədvəli üçün (işə qəbul edərkən)
                salary: employeeData.salary || null,  // ✅ employees cədvəlinə
                bank_account: employeeData.bank_account || null,
                employment_type: employeeData.employment_type || null,
                hire_date: employeeData.hire_date || null,
                currency: employeeData.currency || 'AZN'
            };

            console.log('📤 Backend-ə göndərilən data:', JSON.stringify(requestData, null, 2));

            const response = await this.api.post('/users/employee', requestData);

            if (response) {
                console.log('✅ İşçi uğurla əlavə edildi:', response);
                return response;
            } else {
                throw new Error('İşçi əlavə edilərkən xəta baş verdi');
            }
        } catch (error) {
            console.error('❌ İşçi əlavə edilərkən xəta:', error);
            throw error;
        }
    }

    /**
     * İşçi məlumatlarını yenilə
     */
    async updateEmployee(employeeId, employeeData) {
        try {
            console.log(`✏️ İşçi yenilənir #${employeeId}:`, employeeData);

            // Boolean dəyərləri çevir
            if (employeeData.is_active !== undefined) employeeData.is_active = Boolean(employeeData.is_active);
            if (employeeData.is_admin !== undefined) employeeData.is_admin = Boolean(employeeData.is_admin);
            if (employeeData.is_super_admin !== undefined) employeeData.is_super_admin = Boolean(employeeData.is_super_admin);
            if (employeeData.email_verified !== undefined) employeeData.email_verified = Boolean(employeeData.email_verified);
            if (employeeData.phone_verified !== undefined) employeeData.phone_verified = Boolean(employeeData.phone_verified);

            // ✅ Sadəcə backend-ə göndəriləcək məlumatları seç
            const backendData = {
                // Users cədvəli üçün
                ceo_name: employeeData.first_name || employeeData.ceo_name,
                ceo_lastname: employeeData.last_name || employeeData.ceo_lastname,
                father_name: employeeData.father_name || null,
                email: employeeData.email,
                phone: employeeData.phone || null,
                position: employeeData.position,
                gender: employeeData.gender || null,
                birth_date: employeeData.birth_date || null,
                fin_code: employeeData.fin_code || null,
                department_id: employeeData.department_id || null,  // ✅ users cədvəlinə gedir
                is_active: employeeData.is_active,

                // Employees cədvəli üçün
                salary: employeeData.salary || null,  // ✅ employees cədvəlinə gedir
                bank_account: employeeData.bank_account || null,
                employment_type: employeeData.employment_type || null,
                hire_date: employeeData.hire_date || null,
                currency: employeeData.currency || 'AZN'
            };

            console.log('📤 Backend-ə göndərilən data:', backendData);

            const response = await this.api.put(`/users/${employeeId}`, backendData);

            if (response) {
                console.log('✅ İşçi uğurla yeniləndi:', response);
                return response;
            } else {
                throw new Error('İşçi yenilənərkən xəta baş verdi');
            }
        } catch (error) {
            console.error('❌ İşçi yenilənərkən xəta:', error);
            throw error;
        }
    }

    /**
     * Yeni işçi formu event-lərini bağla
     */
    bindAddEmployeeEvents() {
        const closeBtn = document.getElementById('closeAddEmployeeModalBtn');
        const cancelBtn = document.getElementById('cancelAddEmployeeBtn');
        const form = document.getElementById('addEmployeeForm');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeAddModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeAddModal());

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const submitBtn = document.getElementById('submitAddEmployeeBtn');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Əlavə edilir...';
                }

                try {
                    const employeeData = {
                        first_name: document.getElementById('addEmployeeFirstName').value,
                        last_name: document.getElementById('addEmployeeLastName').value,
                        father_name: document.getElementById('addEmployeeFatherName').value || null,
                        birth_date: document.getElementById('addEmployeeBirthDate').value || null,
                        gender: document.getElementById('addEmployeeGender').value || null,
                        email: document.getElementById('addEmployeeEmail').value,
                        phone: document.getElementById('addEmployeePhone').value || null,
                        fin_code: document.getElementById('addEmployeeFinCode').value || null,
                        department_id: document.getElementById('addEmployeeDepartment').value || null,
                        position: document.getElementById('addEmployeePosition').value,
                        hire_date: document.getElementById('addEmployeeHireDate').value || null,
                        is_active: document.getElementById('addEmployeeIsActive').checked,
                        ceo_name: document.getElementById('addEmployeeFirstName').value,
                        ceo_lastname: document.getElementById('addEmployeeLastName').value,
                        ceo_email: document.getElementById('addEmployeeEmail').value,
                        ceo_phone: document.getElementById('addEmployeePhone').value || null,
                        voen: this.currentCompanyCode,
                        company_code: this.currentCompanyCode,
                        ceo_password: "123456",
                        user_type: "employee"
                    };

                    console.log('📤 Yeni işçi məlumatları:', employeeData);

                    const response = await this.addEmployee(employeeData);

                    this.showSuccessMessage('İşçi uğurla əlavə edildi');
                    this.closeAddModal();
                    await this.refreshEmployees();

                } catch (error) {
                    console.error('❌ Əlavə etmə xətası:', error);
                    this.showErrorMessage('Xəta: ' + (error.response?.data?.detail || error.message));
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Əlavə et';
                    }
                }
            });
        }
    }

    /**
     * Redaktə formu event-lərini bağla
     */
    bindEditEmployeeEvents() {
        const closeBtn = document.getElementById('closeEditEmployeeModalBtn');
        const cancelBtn = document.getElementById('cancelEditEmployeeBtn');
        const form = document.getElementById('editEmployeeForm');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeEditModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeEditModal());

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const employeeIdInput = document.getElementById('editEmployeeId');
                if (!employeeIdInput) {
                    console.error('❌ Employee ID input tapılmadı');
                    this.showErrorMessage('Xəta: İşçi ID-si tapılmadı');
                    return;
                }

                const employeeId = employeeIdInput.value;
                console.log(`✏️ İşçi yenilənir #${employeeId}`);

                const submitBtn = document.getElementById('submitEditEmployeeBtn');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saxlanılır...';
                }

                try {
                    const getValue = (id) => {
                        const element = document.getElementById(id);
                        return element ? element.value : null;
                    };

                    const getChecked = (id) => {
                        const element = document.getElementById(id);
                        return element ? element.checked : false;
                    };

                    const employeeData = {
                        // Users cədvəli üçün
                        first_name: getValue('editEmployeeFirstName'),
                        last_name: getValue('editEmployeeLastName'),
                        father_name: getValue('editEmployeeFatherName') || null,
                        birth_date: getValue('editEmployeeBirthDate') || null,
                        gender: getValue('editEmployeeGender') || null,
                        email: getValue('editEmployeeEmail'),
                        phone: getValue('editEmployeePhone') || null,
                        fin_code: getValue('editEmployeeFinCode') || null,
                        department_id: getValue('editEmployeeDepartment') || null,  // ✅ users cədvəlinə
                        position: getValue('editEmployeePosition'),
                        is_active: getChecked('editEmployeeIsActive'),

                        // Employees cədvəli üçün
                        salary: getValue('editEmployeeSalary') || null,  // ✅ employees cədvəlinə
                        bank_account: getValue('editEmployeeBankAccount') || null,
                        employment_type: getValue('editEmployeeEmploymentType') || null,
                        hire_date: getValue('editEmployeeHireDate') || null,
                        currency: getValue('editEmployeeCurrency') || 'AZN'
                    };

                    console.log('📤 Göndərilən məlumat:', employeeData);

                    await this.updateEmployee(employeeId, employeeData);

                    this.showSuccessMessage('İşçi məlumatları uğurla yeniləndi');
                    this.closeEditModal();
                    await this.refreshEmployees();

                } catch (error) {
                    console.error('❌ Yeniləmə xətası:', error);
                    this.showErrorMessage('Xəta: ' + error.message);
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Yadda saxla';
                    }
                }
            });
        }
    }
}

window.EmployeesService = EmployeesService;