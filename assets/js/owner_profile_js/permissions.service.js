// permissions.service.js - Yalnız worktypes ilə işləyən versiya

/**
 * Permissions Service
 * Departament iş növlərinin idarə edilməsi
 */
class PermissionsService {
    constructor(apiService) {
        console.log('🔐 PermissionsService başladıldı');
        this.api = apiService;
        this.currentCompanyId = null;
        this.currentUser = null;
        this.selectedDepartmentId = null;
        this.selectedDepartmentName = '';
        this.selectedDepartmentType = '';

        this.departmentTypes = {
            'Maliyyə': 'finance',
            'İKT': 'ict',
            'İnsan Resursları': 'hr',
            'Marketinq': 'marketing',
            'Satış': 'sales',
            'Əməliyyat': 'operations',
            'Rəhbərlik': 'management'
        };

        // Departament üzrə nümunə iş növləri
        this.sampleWorkTypesByDept = {
            'finance': [
                { work_type_name: 'Maliyyə Hesabatlarının Hazırlanması', work_type_code: 'FIN-ACC' },
                { work_type_name: 'Məftətin Zərərinin Yoxlanılması', work_type_code: 'FIN-AUD' },
                { work_type_name: 'Balans Hesabatının Hazırlanması', work_type_code: 'FIN-BAL' },
                { work_type_name: 'Vergi Hesabatlarının Hazırlanması', work_type_code: 'FIN-TAX' },
                { work_type_name: 'Vergidən Gələn Məktubların Cavablandırılması', work_type_code: 'FIN-LET' },
                { work_type_name: 'Baş Maliyyəçi', work_type_code: 'FIN-MGR' },
                { work_type_name: 'Maliyyə Analitiki', work_type_code: 'FIN-ANA' }
            ],
            'ict': [
                { work_type_name: 'Frontend Developer', work_type_code: 'ICT-FED' },
                { work_type_name: 'Backend Developer', work_type_code: 'ICT-BED' },
                { work_type_name: 'Machine Learning & Deep Learning', work_type_code: 'ICT-ML' },
                { work_type_name: 'DevOps Engineer', work_type_code: 'ICT-DEV' },
                { work_type_name: 'System Administrator', work_type_code: 'ICT-SYS' },
                { work_type_name: 'CTO / Texnologiya Direktoru', work_type_code: 'ICT-CTO' },
                { work_type_name: 'Network Administrator', work_type_code: 'ICT-NET' }
            ],
            'hr': [
                { work_type_name: 'HR Menecer', work_type_code: 'HR-MGR' },
                { work_type_name: 'Rekrutment Spesialist', work_type_code: 'HR-REC' },
                { work_type_name: 'Əmək Münasibətləri Spesialist', work_type_code: 'HR-EMP' },
                { work_type_name: 'Təlim və İnkişaf Meneceri', work_type_code: 'HR-TRN' },
                { work_type_name: 'Əmək Haqqı və Mükafat Spesialist', work_type_code: 'HR-PAY' }
            ],
            'marketing': [
                { work_type_name: 'Marketinq Meneceri', work_type_code: 'MKT-MGR' },
                { work_type_name: 'Rəqəmsal Marketinq Spesialist', work_type_code: 'MKT-DIG' },
                { work_type_name: 'Məzmun Meneceri', work_type_code: 'MKT-CON' },
                { work_type_name: 'Sosial Media Meneceri', work_type_code: 'MKT-SOC' },
                { work_type_name: 'SEO Spesialist', work_type_code: 'MKT-SEO' }
            ]
        };

        // Helper funksiyaları
        this.closeModalById = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) modal.remove();
        };

        this.escapeHtml = (text) => {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };

        this.showSuccessMessage = (message) => {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Uğurlu!',
                    text: message,
                    timer: 3000
                });
            } else {
                alert('✅ ' + message);
            }
        };

        this.showErrorMessage = (message) => {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Xəta!',
                    text: message
                });
            } else {
                alert('❌ ' + message);
            }
        };

        this.showInfoMessage = (message) => {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'info',
                    title: 'Məlumat',
                    text: message
                });
            } else {
                alert('ℹ️ ' + message);
            }
        };

        this.confirmAction = async (message) => {
            if (typeof Swal !== 'undefined') {
                const result = await Swal.fire({
                    title: 'Əminsiniz?',
                    text: message,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Bəli, davam et!',
                    cancelButtonText: 'Ləğv et'
                });
                return result.isConfirmed;
            } else {
                return confirm(message);
            }
        };
    }

    /**
     * Departament tipini təyin et
     */
    getDepartmentType(departmentName) {
        const deptNameLower = departmentName.toLowerCase();

        if (deptNameLower.includes('maliyyə') || deptNameLower.includes('finans')) {
            return 'finance';
        } else if (deptNameLower.includes('ikt') || deptNameLower.includes('texnologiya') ||
                  deptNameLower.includes('it') || deptNameLower.includes('informasiya')) {
            return 'ict';
        } else if (deptNameLower.includes('insan') || deptNameLower.includes('hr') ||
                  deptNameLower.includes('kadr')) {
            return 'hr';
        } else if (deptNameLower.includes('marketinq') || deptNameLower.includes('reklam')) {
            return 'marketing';
        } else if (deptNameLower.includes('satış') || deptNameLower.includes('sales')) {
            return 'sales';
        } else if (deptNameLower.includes('əməliyyat') || deptNameLower.includes('operation')) {
            return 'operations';
        } else if (deptNameLower.includes('rəhbər') || deptNameLower.includes('menecer')) {
            return 'management';
        } else {
            return 'general';
        }
    }

    /**
     * Nümunə iş növlərini gətir
     */
    getSampleWorkTypes(departmentType) {
        return this.sampleWorkTypesByDept[departmentType] || [];
    }

    /**
     * İş növü rəngini gətir
     */
    getWorkTypeColor(departmentType) {
        const colors = {
            'finance': '#F59E0B',    // yellow-500
            'ict': '#3B82F6',        // blue-500
            'hr': '#10B981',         // green-500
            'marketing': '#EF4444',  // red-500
            'sales': '#8B5CF6',      // purple-500
            'operations': '#F97316', // orange-500
            'management': '#6366F1', // indigo-500
            'general': '#6B7280'     // gray-500
        };
        return colors[departmentType] || '#3B82F6';
    }

    /**
     * İş növü təsviri gətir
     */
    getWorkTypeDescription(workTypeName, departmentType) {
        const descriptions = {
            'finance': {
                'Maliyyə Hesabatlarının Hazırlanması': 'Maliyyə hesabatlarının hazırlanması və təhlili',
                'Məftətin Zərərinin Yoxlanılması': 'Mühasibat sənədlərinin yoxlanılması və audit',
                'Balans Hesabatının Hazırlanması': 'Balans hesabatı və aktiv-passiv idarəetmə',
                'Vergi Hesabatlarının Hazırlanması': 'Vergi hesabatları və büdcə planlaşdırılması',
                'Vergidən Gələn Məktubların Cavablandırılması': 'Vergi orqanları ilə yazışmalar',
                'Baş Maliyyəçi': 'Maliyyə departamentinin rəhbərliyi',
                'Maliyyə Analitiki': 'Maliyyə məlumatlarının təhlili və hesabatlar'
            },
            'ict': {
                'Frontend Developer': 'İstifadəçi interfeysinin hazırlanması',
                'Backend Developer': 'Server tərəfi proqramlaşdırma',
                'Machine Learning & Deep Learning': 'AI və maşın öyrənmə modelləri',
                'DevOps Engineer': 'İnfrastruktur və deployment idarəetməsi',
                'System Administrator': 'Server və şəbəkə idarəetməsi',
                'CTO / Texnologiya Direktoru': 'Texnologiya strategiyası və rəhbərlik',
                'Network Administrator': 'Şəbəkə infrastrukturunun idarə edilməsi'
            },
            'hr': {
                'HR Menecer': 'İnsan resursları departamentinin rəhbərliyi',
                'Rekrutment Spesialist': 'Yeni işçilərin işə qəbulu və seçimi',
                'Əmək Münasibətləri Spesialist': 'İşçi-işəgötürən münasibətlərinin idarə edilməsi',
                'Təlim və İnkişaf Meneceri': 'İşçilərin peşəkar inkişafı üçün təlimlər',
                'Əmək Haqqı və Mükafat Spesialist': 'Maaş sistemlərinin və bonusların idarə edilməsi'
            },
            'marketing': {
                'Marketinq Meneceri': 'Marketinq strategiyasının hazırlanması və idarə edilməsi',
                'Rəqəmsal Marketinq Spesialist': 'Rəqəmsal kanallar vasitəsilə marketinq kampaniyaları',
                'Məzmun Meneceri': 'Məzmun strategiyası və yaradılması',
                'Sosial Media Meneceri': 'Sosial media platformalarının idarə edilməsi',
                'SEO Spesialist': 'Axtarış sistemləri üçün optimallaşdırma'
            }
        };

        return descriptions[departmentType]?.[workTypeName] || `${workTypeName} iş növü üçün təsvir`;
    }

    /**
     * Departament icazələri modulunu aç
     */
    async openDepartmentPermissions() {
        try {
            console.log('👁️ Departament iş növləri modulu açılır...');

            // 1. User və şirkət məlumatlarını al
            if (!this.currentUser || !this.currentCompanyId) {
                await this.loadCurrentUser();
            }

            // 2. Şirkətin departamentlərini gətir
            const departments = await this.getCompanyDepartments(this.currentCompanyId);

            if (!departments || departments.length === 0) {
                this.showInfoMessage('Bu şirkətdə heç bir departament tapılmadı. Əvvəlcə departament yaradın.');
                await this.showCreateDepartmentModal();
                return;
            }

            // 3. Modal yarat
            this.createDepartmentPermissionsModal(departments);

        } catch (error) {
            console.error('❌ Departament iş növləri açıla bilmədi:', error);
            this.showErrorMessage('Departament iş növləri yüklənərkən xəta: ' + error.message);
        }
    }

    /**
     * Cari user məlumatlarını yüklə
     */
    async loadCurrentUser() {
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');

            if (userData && userData.user) {
                this.currentUser = userData.user;
                this.currentCompanyId = userData.user.company_id;
                console.log('✅ User məlumatları yükləndi:', {
                    id: this.currentUser.id,
                    companyId: this.currentCompanyId
                });
            } else {
                throw new Error('User məlumatları tapılmadı');
            }
        } catch (error) {
            console.error('❌ User məlumatları yüklənə bilmədi:', error);
            this.currentUser = { id: 1, email: 'demo@example.com' };
            this.currentCompanyId = 1;
        }
    }

    /**
     * Şirkətin departamentlərini gətir
     */
    async getCompanyDepartments(companyId) {
        try {
            console.log(`🏢 Şirkət ${companyId} departamentləri gətirilir...`);
            const response = await this.api.get(`/departments/company/${companyId}/all`);

            if (response && Array.isArray(response)) {
                console.log(`✅ ${response.length} departament gətirildi`);
                return response;
            } else if (response && response.data && Array.isArray(response.data)) {
                console.log(`✅ ${response.data.length} departament gətirildi`);
                return response.data;
            } else {
                console.warn('⚠️ Departamentlər gətirilə bilmədi');
                return [];
            }
        } catch (error) {
            console.error('❌ Departamentlər gətirilərkən xəta:', error);
            return [];
        }
    }

    /**
     * Departament icazələri modalını yarat
     */
    async createDepartmentPermissionsModal(departments) {
        this.closeModalById('departmentPermissionsModal');

        const modalHTML = `
            <div id="departmentPermissionsModal" class="companies-modal fixed inset-0 z-[150] overflow-y-auto bg-black bg-opacity-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                    <div class="inline-block w-full max-w-6xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden">
                        <div class="px-8 py-6 border-b">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                        <i class="fa-solid fa-briefcase text-purple-600"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-bold text-gray-900">Departament İş Növləri</h3>
                                        <p class="text-gray-600 text-sm">${departments.length} departament tapıldı</p>
                                    </div>
                                </div>
                                <button onclick="window.closeDepartmentPermissionsModal()"
                                        class="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                    <i class="fa-solid fa-times text-gray-600"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="flex flex-col lg:flex-row min-h-[600px]">
                            <!-- Sol panel: Departament siyahısı -->
                            <div class="lg:w-1/3 border-r p-6">
                                <div class="flex justify-between items-center mb-4">
                                    <h4 class="font-bold text-gray-800">Departamentlər</h4>
                                    <button onclick="window.showCreateDepartmentModal()"
                                            class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                                        <i class="fa-solid fa-plus mr-1"></i> Yeni
                                    </button>
                                </div>
                                <div class="space-y-2 max-h-[500px] overflow-y-auto pr-2" id="departmentsList">
                                    ${this.renderDepartmentsList(departments)}
                                </div>
                            </div>
                            
                            <!-- Sağ panel: İş növləri -->
                            <div class="lg:w-2/3 p-6">
                                <div id="permissionsContent" class="text-center py-20">
                                    <i class="fa-solid fa-arrow-left text-gray-300 text-4xl mb-4"></i>
                                    <h4 class="text-lg font-semibold text-gray-700 mb-2">Departament Seçin</h4>
                                    <p class="text-gray-500">Sol paneldən iş növlərini idarə etmək istədiyiniz departamenti seçin.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="px-8 py-4 border-t bg-gray-50">
                            <div class="flex justify-end gap-3">
                                <button onclick="window.closeDepartmentPermissionsModal()"
                                        class="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Bağla
                                </button>
                                <button onclick="window.refreshDepartments()"
                                        class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Yenilə
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Global funksiyaları təyin et
        window.closeDepartmentPermissionsModal = () => {
            this.closeModalById('departmentPermissionsModal');
        };

        window.refreshDepartments = async () => {
            const departments = await this.getCompanyDepartments(this.currentCompanyId);
            const departmentsList = document.getElementById('departmentsList');
            if (departmentsList) {
                departmentsList.innerHTML = this.renderDepartmentsList(departments);
            }
        };

        window.showCreateDepartmentModal = () => {
            this.showCreateDepartmentModal();
        };

        // Departament seçim event-lərini qur
        this.setupDepartmentSelection(departments);
    }

    /**
     * Departament siyahısını render et
     */
    renderDepartmentsList(departments) {
        let html = '';

        departments.forEach(dept => {
            const isActive = dept.is_active !== false;
            const deptType = this.getDepartmentType(dept.department_name);
            const iconClass = this.getDepartmentIcon(deptType);
            const bgColor = this.getDepartmentColor(deptType);

            html += `
                <div class="department-item p-3 rounded-lg cursor-pointer transition-all hover:bg-purple-50 border border-transparent hover:border-purple-200"
                     data-dept-id="${dept.id}"
                     data-dept-type="${deptType}"
                     onclick="window.selectDepartment(${dept.id}, '${this.escapeHtml(dept.department_name)}', '${deptType}')">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center">
                                <i class="${iconClass}"></i>
                            </div>
                            <div>
                                <h5 class="font-semibold text-gray-800">${this.escapeHtml(dept.department_name)}</h5>
                                ${dept.department_code ? `<p class="text-sm text-gray-600">${this.escapeHtml(dept.department_code)}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            ${isActive ? 
                                '<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Aktiv</span>' : 
                                '<span class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Deaktiv</span>'
                            }
                        </div>
                    </div>
                    ${dept.description ? `<p class="text-xs text-gray-500 mt-1 ml-13">${this.escapeHtml(dept.description)}</p>` : ''}
                </div>
            `;
        });

        return html;
    }

    /**
     * Departament ikonu
     */
    getDepartmentIcon(deptType) {
        const icons = {
            'finance': 'fa-solid fa-coins text-yellow-600',
            'ict': 'fa-solid fa-computer text-blue-600',
            'hr': 'fa-solid fa-users text-green-600',
            'marketing': 'fa-solid fa-bullhorn text-red-600',
            'sales': 'fa-solid fa-chart-line text-purple-600',
            'operations': 'fa-solid fa-gears text-orange-600',
            'management': 'fa-solid fa-user-tie text-indigo-600',
            'general': 'fa-solid fa-building text-gray-600'
        };
        return icons[deptType] || icons.general;
    }

    /**
     * Departament rəngi
     */
    getDepartmentColor(deptType) {
        const colors = {
            'finance': 'bg-yellow-100',
            'ict': 'bg-blue-100',
            'hr': 'bg-green-100',
            'marketing': 'bg-red-100',
            'sales': 'bg-purple-100',
            'operations': 'bg-orange-100',
            'management': 'bg-indigo-100',
            'general': 'bg-gray-100'
        };
        return colors[deptType] || colors.general;
    }

    /**
     * Departament seçim event-lərini qur
     */
    setupDepartmentSelection(departments) {
        window.selectDepartment = async (departmentId, departmentName, departmentType) => {
            console.log(`🎯 Departament seçildi: ${departmentName} (ID: ${departmentId}, Tip: ${departmentType})`);

            this.selectedDepartmentId = departmentId;
            this.selectedDepartmentName = departmentName;
            this.selectedDepartmentType = departmentType;

            try {
                // Departament iş növlərini gətir
                const workTypes = await this.getDepartmentWorkTypes(departmentId);

                // UI-də göstər
                this.showDepartmentContent(departmentId, departmentName, departmentType, workTypes);

                // Aktiv departamenti işarələ
                document.querySelectorAll('.department-item').forEach(item => {
                    const itemDeptId = parseInt(item.getAttribute('data-dept-id'));
                    if (itemDeptId === departmentId) {
                        item.classList.add('bg-purple-50', 'border-purple-200');
                        item.classList.remove('hover:bg-purple-50');
                    } else {
                        item.classList.remove('bg-purple-50', 'border-purple-200');
                        item.classList.add('hover:bg-purple-50');
                    }
                });

            } catch (error) {
                console.error('❌ Departament məlumatları gətirilərkən xəta:', error);
                this.showErrorMessage(`${departmentName} departamentinin iş növləri gətirilə bilmədi.`);
            }
        };
    }

    /**
     * Departament iş növlərini gətir
     */
    async getDepartmentWorkTypes(departmentId) {
        try {
            console.log(`💼 Departament ${departmentId} iş növləri gətirilir...`);
            const response = await this.api.get(`/worktypes/department/${departmentId}`);

            if (response && Array.isArray(response)) {
                console.log(`✅ ${response.length} iş növü gətirildi`);
                return response;
            } else if (response && response.data && Array.isArray(response.data)) {
                console.log(`✅ ${response.data.length} iş növü gətirildi`);
                return response.data;
            } else {
                console.warn('⚠️ İş növləri gətirilə bilmədi, boş siyahı qaytarılır');
                return [];
            }
        } catch (error) {
            console.error('❌ İş növləri gətirilərkən xəta:', error);
            return [];
        }
    }

    /**
     * Departament məzmununu göstər (iş növləri)
     */
    showDepartmentContent(departmentId, departmentName, departmentType, workTypes) {
        const sampleWorkTypes = this.getSampleWorkTypes(departmentType);

        const html = `
            <div>
                <!-- Üst panel: Departament məlumatları -->
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <div class="h-12 w-12 rounded-xl ${this.getDepartmentColor(departmentType)} flex items-center justify-center">
                            <i class="${this.getDepartmentIcon(departmentType)} text-lg"></i>
                        </div>
                        <div>
                            <h4 class="text-lg font-bold text-gray-900">${this.escapeHtml(departmentName)}</h4>
                            <p class="text-gray-600">Departament İş Növləri</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        ${workTypes.length === 0 && sampleWorkTypes.length > 0 ? `
                            <button onclick="window.addSampleWorkTypes('${departmentType}')"
                                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <i class="fa-solid fa-magic mr-1"></i> Nümunə İş Növləri
                            </button>
                        ` : ''}
                        <button onclick="window.showAddWorkTypeModal()"
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fa-solid fa-plus mr-1"></i> Yeni İş Növü
                        </button>
                    </div>
                </div>

                <!-- İş növləri paneli -->
                <div id="worktypesContent">
                    ${workTypes.length > 0 ? this.renderWorkTypesTable(workTypes) : `
                        <div class="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                            <i class="fa-solid fa-briefcase text-gray-300 text-4xl mb-4"></i>
                            <h4 class="text-lg font-semibold text-gray-700 mb-2">İş növü tapılmadı</h4>
                            <p class="text-gray-500 mb-4">Bu departamentə hələ iş növləri əlavə edilməyib.</p>
                            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                                <button onclick="window.addSampleWorkTypes('${departmentType}')"
                                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    <i class="fa-solid fa-magic mr-1"></i> Nümunə iş növləri Əlavə Et
                                </button>
                                <button onclick="window.showAddWorkTypeModal()"
                                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <i class="fa-solid fa-plus mr-1"></i> Öz İş növlərini Yarat
                                </button>
                            </div>
                        </div>
                    `}
                </div>

                <!-- Nümunə iş növləri paneli (əgər iş növləri yoxdursa) -->
                ${workTypes.length === 0 ? `
                    <div class="mt-8">
                        <h5 class="font-bold text-gray-800 mb-4">${this.getDepartmentTitle(departmentType)} üçün Tövsiyə Edilən İş Növləri</h5>
                        ${this.renderSampleWorkTypes(sampleWorkTypes, departmentType)}
                    </div>
                ` : ''}
            </div>
        `;

        const contentDiv = document.getElementById('permissionsContent');
        if (contentDiv) {
            contentDiv.innerHTML = html;
            this.setupGlobalFunctions();
        }
    }

    /**
     * İş növləri cədvəlini render et
     */
    renderWorkTypesTable(workTypes) {
        return `
            <div class="flex justify-between items-center mb-4">
                <h5 class="font-bold text-gray-800">İş növləri (${workTypes.length})</h5>
                <div class="flex gap-2">
                    <button onclick="window.showAddWorkTypeModal()"
                            class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                        <i class="fa-solid fa-plus mr-1"></i> Yeni iş növü
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto rounded-lg border border-gray-200">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İş Növü Adı</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kodu</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rəng</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ödənişli</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saatlıq Qiymət</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Əməliyyatlar</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${workTypes.map(workType => this.renderWorkTypeRow(workType)).join('')}
                    </tbody>
                </table>
            </div>
            
            ${workTypes.length > 10 ? `
                <div class="mt-4 text-center">
                    <p class="text-sm text-gray-600">Cəmi ${workTypes.length} iş növü göstərilir</p>
                </div>
            ` : ''}
        `;
    }

    /**
     * İş növü sətrini render et
     */
    renderWorkTypeRow(workType) {
        const isActive = workType.is_active !== false;
        const isBillable = workType.is_billable === true;
        const colorStyle = workType.color_code ? `style="background-color: ${workType.color_code}"` : '';
        const hourlyRate = workType.hourly_rate ? `${workType.hourly_rate} ₼/saat` : '-';

        return `
            <tr class="hover:bg-gray-50" id="worktype-row-${workType.id}">
                <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="h-8 w-8 rounded-lg flex items-center justify-center mr-3" ${colorStyle}>
                            <i class="fa-solid fa-briefcase text-white text-sm"></i>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">${this.escapeHtml(workType.work_type_name)}</div>
                            ${workType.description ? `<div class="text-xs text-gray-500 truncate max-w-xs">${this.escapeHtml(workType.description)}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    ${workType.work_type_code || '-'}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <div class="h-6 w-6 rounded-full border border-gray-300" ${colorStyle} title="${workType.color_code || '#3B82F6'}"></div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full ${isBillable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${isBillable ? 'Bəli' : 'Xeyr'}
                    </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    ${hourlyRate}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${isActive ? 'Aktiv' : 'Deaktiv'}
                    </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                        <button onclick="window.editWorkType(${workType.id})"
                                class="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button onclick="window.deleteWorkType(${workType.id}, '${this.escapeHtml(workType.work_type_name)}')"
                                class="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Nümunə iş növlərini render et
     */
    renderSampleWorkTypes(sampleWorkTypes, departmentType) {
        if (sampleWorkTypes.length === 0) {
            return `
                <div class="text-center py-8">
                    <p class="text-gray-500">Bu departament tipi üçün nümunə iş növləri hazırlanmayıb.</p>
                </div>
            `;
        }

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                ${sampleWorkTypes.map(workType => `
                    <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex-1">
                                <h6 class="font-semibold text-gray-800">${workType.work_type_name}</h6>
                                <div class="flex items-center gap-2 mt-1">
                                    ${workType.work_type_code ? `<span class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">${workType.work_type_code}</span>` : ''}
                                </div>
                            </div>
                            <button onclick="window.addSingleWorkType('${this.escapeHtml(JSON.stringify(workType))}')"
                                    class="ml-2 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                        <div class="text-xs text-gray-600 mt-2">
                            ${this.getWorkTypeDescription(workType.work_type_name, departmentType)}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="text-center">
                <button onclick="window.addAllSampleWorkTypes('${departmentType}')"
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <i class="fa-solid fa-bolt mr-1"></i> Bütün Nümunə İş Növlərini Əlavə Et
                </button>
                <p class="text-xs text-gray-500 mt-2">Bütün nümunə iş növləri bir dəfəyə əlavə edəcək</p>
            </div>
        `;
    }

    /**
     * Departament başlığını gətir
     */
    getDepartmentTitle(deptType) {
        const titles = {
            'finance': 'Maliyyə',
            'ict': 'İKT',
            'hr': 'İnsan Resursları',
            'marketing': 'Marketinq',
            'sales': 'Satış',
            'operations': 'Əməliyyat',
            'management': 'Rəhbərlik',
            'general': 'Ümumi'
        };
        return titles[deptType] || 'Departament';
    }

    /**
     * Global funksiyaları təyin et
     */
    setupGlobalFunctions() {
        window.showAddWorkTypeModal = () => {
            this.showAddWorkTypeModal();
        };

        window.saveNewWorkType = () => {
            this.saveNewWorkType();
        };

        window.editWorkType = (workTypeId) => {
            this.showEditWorkTypeModal(workTypeId);
        };

        window.deleteWorkType = (workTypeId, workTypeName) => {
            this.deleteWorkType(workTypeId, workTypeName);
        };

        window.addSampleWorkTypes = (departmentType) => {
            this.addSampleWorkTypes(departmentType);
        };

        window.addSingleWorkType = (sampleData) => {
            this.addSingleWorkType(sampleData);
        };

        window.addAllSampleWorkTypes = (departmentType) => {
            this.addSampleWorkTypes(departmentType);
        };
    }

    /**
     * Nümunə İŞ NÖVLƏRİ əlavə et
     */
    async addSampleWorkTypes(departmentType) {
        const sampleWorkTypes = this.getSampleWorkTypes(departmentType);

        if (sampleWorkTypes.length === 0) {
            this.showInfoMessage('Bu departament tipi üçün nümunə iş növləri yoxdur.');
            return;
        }

        const confirmed = await this.confirmAction(`${sampleWorkTypes.length} nümunə iş növü əlavə etmək istədiyinizə əminsiniz?`);

        if (!confirmed) return;

        // Department company_id-sini tap
        let companyId = this.currentCompanyId;
        if (!companyId && this.selectedDepartmentId) {
            try {
                const deptResponse = await this.api.get(`/departments/${this.selectedDepartmentId}`);
                const department = deptResponse.data || deptResponse;
                companyId = department.company_id;
            } catch (error) {
                console.error('❌ Department məlumatları gətirilə bilmədi:', error);
                this.showErrorMessage('Departament məlumatları gətirilə bilmədi');
                return;
            }
        }

        try {
            let addedCount = 0;
            for (const sample of sampleWorkTypes) {
                const workTypeData = {
                    company_id: companyId,
                    department_id: this.selectedDepartmentId,
                    work_type_name: sample.work_type_name,
                    work_type_code: sample.work_type_code,
                    description: this.getWorkTypeDescription(sample.work_type_name, departmentType),
                    color_code: this.getWorkTypeColor(departmentType),
                    is_billable: true,
                    hourly_rate: null,
                    is_active: true
                };

                const response = await this.api.post('/worktypes/', workTypeData);
                if (response && (response.id || response.success)) {
                    addedCount++;
                }
            }

            this.showSuccessMessage(`${addedCount} nümunə iş növü uğurla əlavə edildi!`);
            await this.refreshWorkTypes();
        } catch (error) {
            console.error('❌ Nümunə iş növləri əlavə edilərkən xəta:', error);
            this.showErrorMessage('Nümunə iş növləri əlavə edilərkən xəta baş verdi.');
        }
    }

    /**
     * Tək nümunə iş növü əlavə et
     */
    async addSingleWorkType(sampleData) {
        try {
            const sample = JSON.parse(sampleData);

            // Department company_id-sini tap
            let companyId = this.currentCompanyId;
            if (!companyId && this.selectedDepartmentId) {
                try {
                    const deptResponse = await this.api.get(`/departments/${this.selectedDepartmentId}`);
                    const department = deptResponse.data || deptResponse;
                    companyId = department.company_id;
                } catch (error) {
                    console.error('❌ Department məlumatları gətirilə bilmədi:', error);
                }
            }

            const workTypeData = {
                company_id: companyId,
                department_id: this.selectedDepartmentId,
                work_type_name: sample.work_type_name,
                work_type_code: sample.work_type_code,
                description: this.getWorkTypeDescription(sample.work_type_name, this.selectedDepartmentType),
                color_code: this.getWorkTypeColor(this.selectedDepartmentType),
                is_billable: true,
                hourly_rate: null,
                is_active: true
            };

            const response = await this.api.post('/worktypes/', workTypeData);
            if (response && (response.id || response.success)) {
                this.showSuccessMessage(`"${sample.work_type_name}" iş növü uğurla əlavə edildi!`);
                await this.refreshWorkTypes();
            } else {
                throw new Error('İş növü əlavə edilə bilmədi');
            }
        } catch (error) {
            console.error('❌ Nümunə iş növü əlavə edilərkən xəta:', error);
            this.showErrorMessage('İş növü əlavə edilərkən xəta baş verdi.');
        }
    }


    /**
     * Yeni İŞ NÖVÜ yarat
     */
    async saveNewWorkType() {
        try {
            const form = document.getElementById('addWorkTypeForm');
            if (!form) {
                console.error('❌ Form tapılmadı');
                return;
            }

            const formData = new FormData(form);

            const workTypeData = {
                company_id: parseInt(formData.get('company_id')),
                department_id: parseInt(formData.get('department_id')),
                work_type_name: formData.get('work_type_name'),
                work_type_code: formData.get('work_type_code') || null,
                description: formData.get('description') || null,
                color_code: formData.get('color_code') || "#3B82F6",
                is_billable: formData.has('is_billable') ? formData.get('is_billable') === 'on' : true,
                hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate')) : null,
                is_active: formData.has('is_active') ? formData.get('is_active') === 'on' : true
            };

            console.log('📝 Yeni İŞ NÖVÜ yaradılır...', workTypeData);

            const response = await this.api.post('/worktypes/', workTypeData);

            if (response && (response.id || response.success)) {
                this.showSuccessMessage('İş növü uğurla yaradıldı!');

                // Modalı bağla
                window.closeAddWorkTypeModal();

                // İş növləri siyahısını yenilə
                await this.refreshWorkTypes();
            } else {
                throw new Error('İş növü yaradıla bilmədi');
            }
        } catch (error) {
            console.error('❌ İş növü yaradılarkən xəta:', error);
            this.showErrorMessage('Xəta baş verdi: ' + (error.message || 'Bilinməyən xəta'));
        }
    }

    /**
     * İş növləri siyahısını yenilə
     */
    async refreshWorkTypes() {
        if (!this.selectedDepartmentId) return;

        try {
            const workTypes = await this.getDepartmentWorkTypes(this.selectedDepartmentId);
            const contentDiv = document.getElementById('permissionsContent');

            if (contentDiv) {
                // Yenidən content göstər
                this.showDepartmentContent(
                    this.selectedDepartmentId,
                    this.selectedDepartmentName,
                    this.selectedDepartmentType,
                    workTypes
                );
            }
        } catch (error) {
            console.error('❌ İş növləri yenilənərkən xəta:', error);

            // Əgər endpoint yoxdursa, bəlkə də hələ deploy edilməyib
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                this.showErrorMessage('İş növləri endpointi tapılmadı. Zəhmət olmasa backend-i yoxlayın.');
            }
        }
    }

    /**
     * İş növünü redaktə etmə modalı
     */
    async showEditWorkTypeModal(workTypeId) {
        try {
            // İş növü məlumatlarını gətir
            const response = await this.api.get(`/worktypes/${workTypeId}`);
            const workType = response.data || response;

            const modalHTML = `
                <div id="editWorkTypeModal" class="companies-modal fixed inset-0 z-[160] overflow-y-auto bg-black bg-opacity-50">
                    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                        <div class="inline-block w-full max-w-md my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden">
                            <div class="px-6 py-4 border-b">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                            <i class="fa-solid fa-edit text-blue-600"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-lg font-bold text-gray-900">İş Növünü Redaktə Et</h3>
                                            <p class="text-gray-600 text-sm">${workType.work_type_name}</p>
                                        </div>
                                    </div>
                                    <button onclick="window.closeEditWorkTypeModal()"
                                            class="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                        <i class="fa-solid fa-times text-gray-600"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="p-6">
                                <form id="editWorkTypeForm">
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                                İş növü adı *
                                            </label>
                                            <input type="text" name="work_type_name" required
                                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                   value="${this.escapeHtml(workType.work_type_name || '')}">
                                        </div>
                                        
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                                    İş növü kodu
                                                </label>
                                                <input type="text" name="work_type_code"
                                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                       value="${this.escapeHtml(workType.work_type_code || '')}">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                                    Rəng kodu
                                                </label>
                                                <input type="color" name="color_code" value="${workType.color_code || '#3B82F6'}"
                                                       class="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer">
                                            </div>
                                        </div>
                                        
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label class="flex items-center h-full">
                                                    <input type="checkbox" name="is_billable" ${workType.is_billable ? 'checked' : ''}
                                                           class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2">
                                                    <span class="text-sm text-gray-700">Ödənişli iş</span>
                                                </label>
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                                    Saatlıq qiymət (₼)
                                                </label>
                                                <input type="number" name="hourly_rate" step="0.01" min="0"
                                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                       value="${workType.hourly_rate || ''}">
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                                Təsvir
                                            </label>
                                            <textarea name="description" rows="3"
                                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                   placeholder="İş növü təsviri ...">${this.escapeHtml(workType.description || '')}</textarea>
                                        </div>
                                        
                                        <div>
                                            <label class="flex items-center">
                                                <input type="checkbox" name="is_active" ${workType.is_active !== false ? 'checked' : ''}
                                                       class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2">
                                                <span class="text-sm text-gray-700">İş növünü aktiv et</span>
                                            </label>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            
                            <div class="px-6 py-4 border-t bg-gray-50">
                                <div class="flex justify-end gap-3">
                                    <button onclick="window.closeEditWorkTypeModal()"
                                            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                        Ləğv et
                                    </button>
                                    <button onclick="window.updateWorkType(${workTypeId})"
                                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        Yenilə
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            window.closeEditWorkTypeModal = () => {
                this.closeModalById('editWorkTypeModal');
            };

            /**
             * İş növünü yenilə (aktiv/deaktiv et)
             */
            window.updateWorkType = async (workTypeId) => {
                const form = document.getElementById('editWorkTypeForm');
                if (!form) {
                    console.error('❌ Form tapılmadı');
                    return;
                }

                const formData = new FormData(form);

                // Status checkbox-unu yoxla
                const isActive = formData.has('is_active') ? formData.get('is_active') === 'on' : true;

                // Əgər deaktiv edilirsə, təsdiq al
                if (!isActive) {
                    const deactivateConfirmed = await this.confirmAction(
                        `Bu iş növünü DEAKTİV etmək istədiyinizə əminsiniz?\n\n` +
                        `✅ İş növü cədvəldə qalacaq\n` +
                        `❌ Yeni işçilər bu iş növünü seçə bilməyəcək\n` +
                        `📊 Köhnə məlumatlar saxlanılacaq\n\n` +
                        `Deaktiv etmək üçün "DEAKTİV ET" düyməsini basın:`
                    );

                    if (!deactivateConfirmed) return;
                }

                const workTypeData = {
                    work_type_name: formData.get('work_type_name'),
                    work_type_code: formData.get('work_type_code') || null,
                    description: formData.get('description') || null,
                    color_code: formData.get('color_code') || "#3B82F6",
                    is_billable: formData.has('is_billable') ? formData.get('is_billable') === 'on' : true,
                    hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate')) : null,
                    is_active: isActive
                };

                try {
                    const response = await this.api.put(`/worktypes/${workTypeId}`, workTypeData);

                    if (response && (response.success || response.id)) {
                        const statusMsg = isActive ? 'aktiv edildi' : 'deaktiv edildi';
                        this.showSuccessMessage(`İş növü uğurla ${statusMsg}!`);
                        window.closeEditWorkTypeModal();
                        await this.refreshWorkTypes();
                    } else {
                        throw new Error('İş növü yenilənə bilmədi');
                    }
                } catch (error) {
                    console.error('❌ İş növü yenilənərkən xəta:', error);
                    this.showErrorMessage('Xəta baş verdi: ' + (error.message || 'Bilinməyən xəta'));
                }


                try {
                    const response = await this.api.put(`/worktypes/${wtId}`, workTypeData);

                    if (response && (response.success || response.id)) {
                        this.showSuccessMessage('İş növü uğurla yeniləndi!');
                        window.closeEditWorkTypeModal();
                        await this.refreshWorkTypes();
                    } else {
                        throw new Error('İş növü yenilənə bilmədi');
                    }
                } catch (error) {
                    console.error('❌ İş növü yenilənərkən xəta:', error);
                    this.showErrorMessage('Xəta baş verdi: ' + (error.message || 'Bilinməyən xəta'));
                }
            };

        } catch (error) {
            console.error('❌ İş növü məlumatları gətirilərkən xəta:', error);
            this.showErrorMessage('İş növü məlumatları gətirilə bilmədi.');
        }
    }

    /**
     * İş növünü sil
     */
    async deleteWorkType(workTypeId, workTypeName) {
        const confirmed = await this.confirmAction(`"${workTypeName}" iş növünü silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`);

        if (!confirmed) return;

        try {
            console.log(`🗑️ İş növü silinir: ${workTypeName} (ID: ${workTypeId})`);

            // DELETE endpointini çağır
            await this.api.delete(`/worktypes/${workTypeId}`);

            // Uğur mesajı göstər
            this.showSuccessMessage(`"${workTypeName}" iş növü uğurla silindi!`);

            // İş növləri siyahısını yenilə
            await this.refreshWorkTypes();

            // Əgər silinən iş növü cədvəldədirsə, onu gizlət
            const workTypeRow = document.getElementById(`worktype-row-${workTypeId}`);
            if (workTypeRow) {
                workTypeRow.remove();
            }

        } catch (error) {
            console.error('❌ İş növü silinərkən xəta:', error);

            // Əgər 404 xətasıdırsa, bu normaldır (artıq silinib)
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                this.showSuccessMessage(`"${workTypeName}" iş növü artıq silinib.`);
                await this.refreshWorkTypes();
            } else {
                this.showErrorMessage('İş növü silinərkən xəta baş verdi: ' + error.message);
            }
        }
    }

    /**
     * Yeni departament yaratmaq üçün modal göstər
     */
    async showCreateDepartmentModal() {
        const modalHTML = `
            <div id="createDepartmentModal" class="companies-modal fixed inset-0 z-[160] overflow-y-auto bg-black bg-opacity-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                    <div class="inline-block w-full max-w-md my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden">
                        <div class="px-6 py-4 border-b">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <i class="fa-solid fa-plus text-blue-600"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-bold text-gray-900">Yeni Departament</h3>
                                        <p class="text-gray-600 text-sm">Departament məlumatlarını daxil edin</p>
                                    </div>
                                </div>
                                <button onclick="window.closeCreateDepartmentModal()"
                                        class="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                    <i class="fa-solid fa-times text-gray-600"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="p-6">
                            <form id="createDepartmentForm">
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            Departament adı *
                                        </label>
                                        <input type="text" name="department_name" required
                                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                               placeholder="Məs: İnsan Resursları">
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            Departament tipi
                                        </label>
                                        <select name="department_type" 
                                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">Avtomatik təyin</option>
                                            <option value="finance">Maliyyə</option>
                                            <option value="ict">İKT / Texnologiya</option>
                                            <option value="hr">İnsan Resursları</option>
                                            <option value="marketing">Marketinq</option>
                                            <option value="sales">Satış</option>
                                            <option value="operations">Əməliyyat</option>
                                            <option value="management">Rəhbərlik</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            Departament kodu
                                        </label>
                                        <input type="text" name="department_code"
                                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                               placeholder="Məs: HR-001">
                                        <p class="text-xs text-gray-500 mt-1">Boş buraxsanız, avtomatik yaradılacaq</p>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            Təsvir
                                        </label>
                                        <textarea name="description" rows="2"
                                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                               placeholder="Departamentin məqsədi və funksiyaları"></textarea>
                                    </div>
                                    
                                    <div>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="is_active" checked
                                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2">
                                            <span class="text-sm text-gray-700">Departamenti aktiv et</span>
                                        </label>
                                    </div>
                                    
                                    <div>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="add_sample_worktypes" checked
                                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2">
                                            <span class="text-sm text-gray-700">Nümunə iş növləri avtomatik əlavə et</span>
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div class="px-6 py-4 border-t bg-gray-50">
                            <div class="flex justify-end gap-3">
                                <button onclick="window.closeCreateDepartmentModal()"
                                        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Ləğv et
                                </button>
                                <button onclick="window.createNewDepartment()"
                                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Departament Yarat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        window.closeCreateDepartmentModal = () => {
            this.closeModalById('createDepartmentModal');
        };

        window.createNewDepartment = async () => {
            const form = document.getElementById('createDepartmentForm');
            const formData = new FormData(form);

            const departmentData = {
                company_id: this.currentCompanyId,
                department_name: formData.get('department_name'),
                department_type: formData.get('department_type') || null,
                department_code: formData.get('department_code') || null,
                description: formData.get('description') || null,
                is_active: formData.has('is_active') ? formData.get('is_active') === 'on' : true,
                add_sample_worktypes: formData.has('add_sample_worktypes') ? formData.get('add_sample_worktypes') === 'on' : true
            };

            try {
                console.log('📝 Yeni departament yaradılır...', departmentData);
                const response = await this.api.post('/departments/new_departament', departmentData);

                if (response && response.id) {
                    this.showSuccessMessage('Departament uğurla yaradıldı!');
                    window.closeCreateDepartmentModal();

                    // Siyahını yenilə
                    if (typeof window.refreshDepartments === 'function') {
                        await window.refreshDepartments();

                        // Nümunə iş növləri əlavə et
                        if (departmentData.add_sample_worktypes) {
                            const deptType = departmentData.department_type || this.getDepartmentType(departmentData.department_name);
                            setTimeout(async () => {
                                await this.addSampleWorkTypes(deptType);
                            }, 1000);
                        }
                    }
                } else {
                    throw new Error('Departament yaradıla bilmədi');
                }
            } catch (error) {
                console.error('❌ Departament yaradılarkən xəta:', error);
                this.showErrorMessage('Xəta baş verdi: ' + (error.message || 'Bilinməyən xəta'));
            }
        };
    }

    /**
     * İş növü kodunun bazada olub-olmadığını yoxlayan funksiya (OPTİMİZASIYA EDİLMİŞ)
     */
    async checkWorkTypeCodeExists(workTypeCode, companyId = null, excludeId = null) {
        try {
            console.log(`🔍 checkWorkTypeCodeExists çağırıldı: ${workTypeCode}, company: ${companyId}`);

            if (!workTypeCode || workTypeCode.trim() === '') {
                return {
                    exists: false,
                    valid: false,
                    duplicate: false,
                    message: 'Kod boşdur'
                };
            }

            // Əgər companyId yoxdursa, formdan al
            if (!companyId) {
                const form = document.getElementById('addWorkTypeForm');
                if (form) {
                    const formData = new FormData(form);
                    companyId = formData.get('company_id');
                    console.log(`📋 Formdan companyId alındı: ${companyId}`);
                }
            }

            if (!companyId) {
                console.warn('⚠️ Company ID tapılmadı');
                return {
                    exists: false,
                    valid: false,
                    duplicate: false,
                    message: 'Şirkət ID-si tələb olunur'
                };
            }

            // 1. Format yoxla
            const isValidFormat = /^[A-Z0-9_-]{2,20}$/i.test(workTypeCode);

            if (!isValidFormat) {
                console.log(`❌ Format yanlış: ${workTypeCode}`);
                return {
                    exists: false,
                    valid: false,
                    duplicate: false,
                    message: 'Kod formatı yanlışdır (2-20 simvol, yalnız hərf, rəqəm, "-", "_")'
                };
            }

            // 2. Backend-dən duplicate yoxla
            console.log(`🌐 Backend-ə sorğu göndərilir: /worktypes/check-duplicate?company_id=${companyId}&code=${workTypeCode}`);

            const params = new URLSearchParams({
                company_id: companyId,
                code: workTypeCode
            });

            if (excludeId) {
                params.append('exclude_id', excludeId);
            }

            const response = await this.api.get(`/worktypes/check-duplicate?${params.toString()}`);

            console.log('📥 Backend cavabı:', response);

            if (response && response.duplicate) {
                return {
                    exists: true,
                    valid: true,
                    duplicate: true,
                    message: response.message || `'${workTypeCode}' kodu artıq bu şirkətdə mövcuddur`,
                    existing_worktype: response.existing_worktype
                };
            } else {
                return {
                    exists: false,
                    valid: true,
                    duplicate: false,
                    message: response?.message || 'Kod istifadə edilə bilər'
                };
            }

        } catch (error) {
            console.error('❌ Duplicate yoxlama xətası:', error);

            // Əgər 404 xətası alınarsa (endpoint tapılmasa), sadə format validation qaytar
            if (error.response && error.response.status === 404) {
                console.log('⚠️ Duplicate endpoint tapılmadı, sadə format validation edilir');

                // Sadəcə format validation qaytar
                const isValidFormat = /^[A-Z0-9_-]{2,20}$/i.test(workTypeCode);

                if (isValidFormat) {
                    return {
                        exists: false,
                        valid: true,
                        duplicate: false,
                        message: 'Kod formatı uyğundur (duplicate yoxlanılmadı)'
                    };
                } else {
                    return {
                        exists: false,
                        valid: false,
                        duplicate: false,
                        message: 'Kod formatı yanlışdır'
                    };
                }
            }

            // Digər xətalar
            return {
                exists: false,
                valid: false,
                duplicate: false,
                message: 'Xəta baş verdi: ' + (error.message || 'Bilinməyən xəta')
            };
        }
    }

    /**
     * Real-time kod validation qur
     */
    setupWorkTypeCodeValidation() {
        // Modal açıldıqdan sonra validation qur
        setTimeout(() => {
            const codeInput = document.getElementById('workTypeCodeInput');
            if (!codeInput) return;

            let timeoutId;

            codeInput.addEventListener('input', (e) => {
                const code = e.target.value.trim();

                // Debounce (800ms gözlə)
                clearTimeout(timeoutId);

                // Format validation
                this.validateCodeFormatInRealTime(code);

                // Əgər kod minimum 2 simvoldursa və format düzgündürsə, duplicate yoxla
                if (code.length >= 2 && /^[A-Z0-9_-]+$/i.test(code)) {
                    timeoutId = setTimeout(async () => {
                        await this.checkDuplicateInRealTime(code);
                    }, 800);
                }
            });

            // Focus itirdikdə də yoxla
            codeInput.addEventListener('blur', async (e) => {
                const code = e.target.value.trim();
                if (code.length >= 2) {
                    await this.checkDuplicateInRealTime(code);
                }
            });

            console.log('✅ Real-time validation quruldu');
        }, 100);
    }

    /**
     * Kod formatını real-time yoxla
     */
    validateCodeFormatInRealTime(code) {
        const codeInput = document.getElementById('workTypeCodeInput');
        if (!codeInput) return;

        const validationMessage = document.getElementById('codeValidationMessage') ||
                                  this.createValidationMessageElement();

        if (!validationMessage) return;

        if (code.length === 0) {
            validationMessage.innerHTML = `
                <span class="text-blue-600">
                    <i class="fa-solid fa-info-circle mr-1"></i> Kod boş saxlanıla bilər (avtomatik yaradılacaq)
                </span>
            `;
            codeInput.classList.remove('border-red-500', 'ring-1', 'ring-red-500', 'border-green-500', 'border-yellow-500');
            return;
        }

        if (code.length < 2) {
            validationMessage.innerHTML = `
                <span class="text-red-600">
                    <i class="fa-solid fa-exclamation-triangle mr-1"></i> Kod minimum 2 simvol olmalıdır
                </span>
            `;
            codeInput.classList.remove('border-green-500', 'border-yellow-500');
            codeInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
            return;
        }

        if (code.length > 20) {
            validationMessage.innerHTML = `
                <span class="text-red-600">
                    <i class="fa-solid fa-exclamation-triangle mr-1"></i> Kod maksimum 20 simvol ola bilər
                </span>
            `;
            codeInput.classList.remove('border-green-500', 'border-yellow-500');
            codeInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
            return;
        }

        const isValidFormat = /^[A-Z0-9_-]+$/i.test(code);
        if (!isValidFormat) {
            validationMessage.innerHTML = `
                <span class="text-red-600">
                    <i class="fa-solid fa-exclamation-triangle mr-1"></i> Kod yalnız hərf, rəqəm, "-" və "_" simvollarından ibarət ola bilər
                </span>
            `;
            codeInput.classList.remove('border-green-500', 'border-yellow-500');
            codeInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
            return;
        }

        // Format düzgündür, yoxlanılır mesajı
        validationMessage.innerHTML = `
            <span class="text-yellow-600 animate-pulse">
                <i class="fa-solid fa-spinner fa-spin mr-1"></i> Kod yoxlanılır...
            </span>
        `;
        codeInput.classList.remove('border-red-500', 'ring-1', 'ring-red-500', 'border-green-500');
        codeInput.classList.add('border-yellow-500');
    }

    /**
     * Real-time duplicate check
     */
    async checkDuplicateInRealTime(code) {
        const codeInput = document.getElementById('workTypeCodeInput');
        const validationMessage = document.getElementById('codeValidationMessage');

        if (!codeInput || !validationMessage) return;

        const result = await this.checkWorkTypeCodeExists(code);

        if (result.exists) {
            const duplicateName = result.duplicateInfo?.work_type_name || 'naməlum';
            validationMessage.innerHTML = `
                <span class="text-red-600">
                    <i class="fa-solid fa-times-circle mr-1"></i> "${code}" kodu artıq bazada mövcuddur (${duplicateName})
                </span>
            `;
            codeInput.classList.remove('border-yellow-500', 'border-green-500');
            codeInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
        } else {
            validationMessage.innerHTML = `
                <span class="text-green-600">
                    <i class="fa-solid fa-check-circle mr-1"></i> Kod mövcud deyil, istifadə edilə bilər
                </span>
            `;
            codeInput.classList.remove('border-yellow-500', 'border-red-500', 'ring-1', 'ring-red-500');
            codeInput.classList.add('border-green-500');
        }
    }

    /**
     * Validation mesaj elementi yarat
     */
    createValidationMessageElement() {
        const codeInput = document.getElementById('workTypeCodeInput');
        if (!codeInput) return null;

        let validationDiv = codeInput.parentNode.querySelector('.code-validation-message');

        if (!validationDiv) {
            validationDiv = document.createElement('div');
            validationDiv.className = 'code-validation-message mt-1 text-sm';
            validationDiv.id = 'codeValidationMessage';
            codeInput.parentNode.appendChild(validationDiv);
        }

        return validationDiv;
    }

    /**
     * Yeni iş növü əlavə etmə modalını yenilə (validation ilə)
     */
    async showAddWorkTypeModal() {
        if (!this.selectedDepartmentId) {
            this.showErrorMessage('Əvvəlcə departament seçin!');
            return;
        }

        // Department company_id-sini tap
        let companyId = this.currentCompanyId;
        if (!companyId) {
            try {
                const deptResponse = await this.api.get(`/departments/${this.selectedDepartmentId}`);
                const department = deptResponse.data || deptResponse;
                companyId = department.company_id;
            } catch (error) {
                console.error('❌ Department məlumatları gətirilə bilmədi:', error);
                this.showErrorMessage('Departament məlumatları gətirilə bilmədi');
                return;
            }
        }

        const modalHTML = `
            <div id="addWorkTypeModal" class="companies-modal fixed inset-0 z-[160] overflow-y-auto bg-black bg-opacity-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                    <div class="inline-block w-full max-w-md my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden">
                        <div class="px-6 py-4 border-b">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <i class="fa-solid fa-briefcase text-blue-600"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-bold text-gray-900">Yeni İş Növü</h3>
                                        <p class="text-gray-600 text-sm">Departament: ${this.escapeHtml(this.selectedDepartmentName)}</p>
                                        <p class="text-xs text-gray-500">Şirkət ID: ${companyId}</p>
                                    </div>
                                </div>
                                <button onclick="window.closeAddWorkTypeModal()"
                                        class="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                    <i class="fa-solid fa-times text-gray-600"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="p-6">
                            <form id="addWorkTypeForm">
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            İş növü adı *
                                        </label>
                                        <input type="text" name="work_type_name" required
                                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                               placeholder="Məs: Web Development"
                                               id="workTypeNameInput">
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            İş növü kodu
                                            <span class="text-xs text-gray-500 ml-1">(Şirkət üzrə uniqe olmalıdır)</span>
                                        </label>
                                        <input type="text" name="work_type_code"
                                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                               placeholder="Məs: WEB-DEV"
                                               id="workTypeCodeInput">
                                        <!-- Validation mesajı üçün yer -->
                                        <div id="codeValidationMessage" class="mt-1 text-sm"></div>
                                    </div>
                                    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                                Rəng kodu
                                            </label>
                                            <input type="color" name="color_code" value="#3B82F6"
                                                   class="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                                Kod formatı
                                            </label>
                                            <select id="codeFormat" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                                <option value="auto">Avtomatik</option>
                                                <option value="prefix_id">AD_001</option>
                                                <option value="dept_code">DEPT-CODE</option>
                                                <option value="custom">Özəl</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="flex items-center h-full">
                                                <input type="checkbox" name="is_billable" checked
                                                       class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2">
                                                <span class="text-sm text-gray-700">Ödənişli iş</span>
                                            </label>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                                Saatlıq qiymət (₼)
                                            </label>
                                            <input type="number" name="hourly_rate" step="0.01" min="0"
                                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                   placeholder="0.00">
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            Təsvir
                                        </label>
                                        <textarea name="description" rows="3"
                                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                               placeholder="İş növü təsviri ..."></textarea>
                                    </div>
                                    
                                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <div class="flex items-start">
                                            <i class="fa-solid fa-info-circle text-yellow-500 mt-0.5 mr-2"></i>
                                            <div>
                                                <p class="text-sm text-yellow-800 font-medium">Kod Uniqeliği:</p>
                                                <p class="text-xs text-yellow-700 mt-1">
                                                    İş növü kodu <strong>şirkətiniz daxilində uniqe</strong> olmalıdır. 
                                                    Hər şirkət öz kodlarını müstəqil idarə edir.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="is_active" checked
                                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2">
                                            <span class="text-sm text-gray-700">İş növünü aktiv et</span>
                                        </label>
                                    </div>
                                    
                                    <!-- Hidden inputs -->
                                    <input type="hidden" name="company_id" value="${companyId}">
                                    <input type="hidden" name="department_id" value="${this.selectedDepartmentId}">
                                </div>
                            </form>
                        </div>
                        
                        <div class="px-6 py-4 border-t bg-gray-50">
                            <div class="flex justify-end gap-3">
                                <button onclick="window.closeAddWorkTypeModal()"
                                        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Ləğv et
                                </button>
                                <button onclick="window.validateAndSaveWorkType()"
                                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    İş Növü Yarat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Global funksiyaları təyin et
        window.closeAddWorkTypeModal = () => {
            this.closeModalById('addWorkTypeModal');
        };

        window.validateAndSaveWorkType = async () => {
            await this.validateAndSaveWorkType();
        };

        // Real-time validation qur
        this.setupWorkTypeCodeValidation();
    }

    /**
     * Validasiya edib save et (YENİ VERSİYA)
     */
    async validateAndSaveWorkType() {
        try {
            console.log('🔄 İş növü validasiya və save başladı...');

            const form = document.getElementById('addWorkTypeForm');
            if (!form) {
                console.error('❌ Form tapılmadı');
                this.showErrorMessage('Form tapılmadı!');
                return;
            }

            const formData = new FormData(form);

            // 1. İş növü adını yoxla
            const workTypeName = formData.get('work_type_name');
            if (!workTypeName || workTypeName.trim() === '') {
                this.showErrorMessage('İş növü adı tələb olunur!');
                const nameInput = document.getElementById('workTypeNameInput');
                if (nameInput) nameInput.focus();
                return;
            }

            // 2. Şirkət ID-ni yoxla
            const companyId = formData.get('company_id');
            if (!companyId) {
                this.showErrorMessage('Şirkət seçilməyib!');
                return;
            }

            // 3. Departament ID-ni yoxla
            const departmentId = formData.get('department_id');
            if (!departmentId) {
                this.showErrorMessage('Departament seçilməyib!');
                return;
            }

            // 4. İş növü kodunu yoxla
            let workTypeCode = formData.get('work_type_code') || '';
            workTypeCode = workTypeCode.trim();
            let isAutoGenerated = false;

            if (workTypeCode === '') {
                // Kod boşdursa, avtomatik generasiya et
                workTypeCode = this.generateAutoWorkTypeCode({
                    work_type_name: workTypeName,
                    department_id: departmentId,
                    company_id: companyId
                });

                console.log(`🔧 Avtomatik kod generasiya edildi: ${workTypeCode}`);
                isAutoGenerated = true;

                // Inputa yaz
                const codeInput = document.getElementById('workTypeCodeInput');
                if (codeInput) {
                    codeInput.value = workTypeCode;
                }

                // FormData-da yenilə
                formData.set('work_type_code', workTypeCode);
            }

            // 5. Format validation
            console.log(`🔍 Kod validasiyası: ${workTypeCode}`);

            // isValidFormat dəyişənini təyin et
            let isValidFormat = false;

            if (workTypeCode.length < 2) {
                this.showErrorMessage('Kod minimum 2 simvol olmalıdır!');
                const codeInput = document.getElementById('workTypeCodeInput');
                if (codeInput) codeInput.focus();
                return;
            }

            if (workTypeCode.length > 20) {
                this.showErrorMessage('Kod maksimum 20 simvol ola bilər!');
                const codeInput = document.getElementById('workTypeCodeInput');
                if (codeInput) codeInput.focus();
                return;
            }

            // Təyin et
            isValidFormat = /^[A-Z0-9_-]+$/i.test(workTypeCode);

            if (!isValidFormat) {
                this.showErrorMessage('Kod yalnız hərf, rəqəm, "-" və "_" simvollarından ibarət ola bilər!');
                const codeInput = document.getElementById('workTypeCodeInput');
                if (codeInput) codeInput.focus();
                return;
            }

            // 6. Backend duplicate yoxlaması (əgər avtomatik generasiya edilməyibsə)
            if (!isAutoGenerated) {
                console.log(`🔍 Backend duplicate yoxlanılır: ${workTypeCode}, company: ${companyId}`);

                try {
                    const duplicateCheck = await this.checkWorkTypeCodeExists(workTypeCode, companyId);

                    if (duplicateCheck.duplicate) {
                        this.showErrorMessage(duplicateCheck.message);

                        // Inputu highlight et
                        const codeInput = document.getElementById('workTypeCodeInput');
                        if (codeInput) {
                            codeInput.classList.add('border-red-500', 'ring-2', 'ring-red-500');
                            codeInput.focus();
                            codeInput.select();
                        }

                        return;
                    }

                    if (!duplicateCheck.valid) {
                        this.showErrorMessage(duplicateCheck.message);
                        const codeInput = document.getElementById('workTypeCodeInput');
                        if (codeInput) codeInput.focus();
                        return;
                    }

                    console.log('✅ Backend duplicate yoxlaması uğurlu');

                } catch (error) {
                    console.warn('⚠️ Backend duplicate yoxlaması alınmadı, davam edilir:', error);
                    // Əgər backend cavab verməsə də, davam et
                }
            } else {
                console.log('✅ Avtomatik kod generasiya edildi, backend yoxlamasına ehtiyac yoxdur');
            }

            console.log('✅ Validasiya uğurludur, save edilir...');

            // 7. Save et
            await this.saveNewWorkType(formData);

        } catch (error) {
            console.error('❌ Validasiya zamanı xəta:', error);
            this.showErrorMessage('Xəta baş verdi: ' + (error.message || 'Bilinməyən xəta'));
        }
    }

    /**
     * Avtomatik kod generasiya et
     */
    generateAutoWorkTypeCode(formData) {
        const workTypeName = formData.work_type_name || '';
        const departmentId = formData.department_id || this.selectedDepartmentId || '00';
        const companyId = formData.company_id || this.currentCompanyId || 'CMP';

        if (!workTypeName) {
            return `WT_${Date.now().toString().slice(-6)}`;
        }

        // Adın hərflərini götür
        const words = workTypeName.split(' ');
        let prefix = '';

        if (words.length === 1) {
            // Bir sözdürsə, ilk 3 hərf
            prefix = workTypeName.substring(0, 3).toUpperCase();
        } else {
            // Bir neçə sözdürsə, hər sözün ilk hərfi
            prefix = words.map(word => word.charAt(0).toUpperCase()).join('');
        }

        // Prefix-in minimum uzunluğu 2 olmalıdır
        if (prefix.length < 2) {
            prefix = workTypeName.substring(0, 3).toUpperCase();
        }

        // Xüsusi simvolları təmizlə
        prefix = prefix.replace(/[^A-Z]/g, '');

        // Şirkət ID-sini qısald
        const companyShort = companyId.toString().slice(-3);

        // Tarix və random ədəd əlavə et
        const now = new Date();
        const dateStr = now.getFullYear().toString().slice(-2) +
                       (now.getMonth() + 1).toString().padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');

        return `${prefix}_${companyShort}_${dateStr}${randomNum}`;
    }

    /**
     * Yeni iş növünü yadda saxla (xəta emalı ilə)
     */
    async saveNewWorkType(formData = null) {
        try {
            let workTypeData;

            if (!formData) {
                const form = document.getElementById('addWorkTypeForm');
                if (!form) {
                    console.error('❌ Form tapılmadı');
                    return;
                }
                formData = new FormData(form);
            }

            workTypeData = {
                company_id: parseInt(formData.get('company_id')),
                department_id: parseInt(formData.get('department_id')),
                work_type_name: formData.get('work_type_name'),
                work_type_code: formData.get('work_type_code') || null,
                description: formData.get('description') || null,
                color_code: formData.get('color_code') || "#3B82F6",
                is_billable: formData.has('is_billable') ? formData.get('is_billable') === 'on' : true,
                hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate')) : null,
                is_active: formData.has('is_active') ? formData.get('is_active') === 'on' : true
            };

            console.log('📝 Yeni İŞ NÖVÜ yaradılır...', workTypeData);

            const response = await this.api.post('/worktypes/', workTypeData);

            if (response && (response.id || response.success)) {
                this.showSuccessMessage(`"${workTypeData.work_type_name}" iş növü uğurla yaradıldı!`);

                // Modalı bağla
                window.closeAddWorkTypeModal();

                // İş növləri siyahısını yenilə
                await this.refreshWorkTypes();
            } else {
                throw new Error('İş növü yaradıla bilmədi');
            }
        } catch (error) {
            console.error('❌ İş növü yaradılarkən xəta:', error);

            // Backend xətasını emal et
            let errorMessage = 'Xəta baş verdi: ';

            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                if (status === 500) {
                    // 500 xətası - çox güman duplicate koddur
                    if (errorData.detail && errorData.detail.includes('duplicate key') &&
                        errorData.detail.includes('work_type_code')) {

                        errorMessage = `"${workTypeData.work_type_code}" kodu artıq şirkətinizdə mövcuddur. ` +
                                       `Bu şirkət üçün kod uniqe olmalıdır.`;

                        // Inputu highlight et
                        const codeInput = document.getElementById('workTypeCodeInput');
                        if (codeInput) {
                            codeInput.classList.add('border-red-500', 'ring-2', 'ring-red-500');
                            codeInput.focus();
                            codeInput.select();

                            // Validation mesajını yenilə
                            const validationMessage = document.getElementById('codeValidationMessage');
                            if (validationMessage) {
                                validationMessage.innerHTML = `
                                    <span class="text-red-600 font-semibold">
                                        <i class="fa-solid fa-exclamation-circle mr-1"></i> 
                                        Bu kod artıq şirkətinizdə mövcuddur!
                                    </span>
                                `;
                            }
                        }

                    } else if (errorData.detail) {
                        errorMessage = errorData.detail;
                    } else {
                        errorMessage = 'Server xətası (500)';
                    }

                } else if (status === 409) {
                    errorMessage = `"${workTypeData.work_type_code}" kodu artıq şirkətinizdə mövcuddur. ` +
                                   `Hər şirkət üçün kodlar uniqe olmalıdır.`;
                } else if (errorData && errorData.message) {
                    errorMessage = errorData.message;
                }
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Bilinməyən xəta';
            }

            this.showErrorMessage(errorMessage);
        }
    }


}

// Global olaraq təyin et
window.PermissionsService = PermissionsService;

// Global funksiyalar
window.closeDepartmentPermissionsModal = function() {
    const modal = document.getElementById('departmentPermissionsModal');
    if (modal) modal.remove();
};

window.showCreateDepartmentModal = function() {
    if (window.permissionsService) {
        window.permissionsService.showCreateDepartmentModal();
    }
};

// Service-i başladıqda global funksiyaları təyin et
document.addEventListener('DOMContentLoaded', function() {
    if (window.permissionsService) {
        window.permissionsService.setupGlobalFunctions();
    }
});