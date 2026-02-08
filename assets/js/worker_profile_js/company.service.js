/**
 * ŞİRKƏTLƏR MODAL MODULU
 * assets/js/owner_profile_js/company.service.js
 */

class CompaniesService {
    constructor() {
        this.companies = [];
        this.filteredCompanies = [];
        this.currentPage = 1;
        this.itemsPerPage = 8;
        this.searchTerm = '';
        this.filterStatus = 'all';

        // DOM elementləri
        this.modal = null;
        this.addModal = null;
        this.detailsModal = null;
        this.apiService = null;

        this.init();
    }

    /**
     * İNİTİALİZASIYA
     */
    init() {
        console.log('🔄 Şirkətlər modul meneceri işə salınır...');

        // DOM elementlərini tap
        this.modal = document.getElementById('companiesModal');
        this.addModal = document.getElementById('addCompanyModal');
        this.detailsModal = document.getElementById('companyDetailsModal');

        // API service-i tap
        if (window.app && window.app.api) {
            this.apiService = window.app.api;
        } else if (window.ApiService) {
            this.apiService = new ApiService();
        }

        // Event listener-ları qur
        this.setupEventListeners();

        // Səhifə yükləndikdə məlumatları gətir
        this.loadCompanies();

        console.log('✅ Şirkətlər modul meneceri hazır');
    }

    /**
     * EVENT LISTENER-LARI QUR
     */
    setupEventListeners() {
        // Açma düyməsi
        const openBtn = document.getElementById('openCompaniesModalBtn');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.open());
        }

        // Bağlama düyməsi
        const closeBtn = document.getElementById('closeCompaniesModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Axtarış
        const searchInput = document.getElementById('companySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterCompanies();
                this.renderTable();
            });
        }

        // Filter
        const filterSelect = document.getElementById('companyFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterStatus = e.target.value;
                this.filterCompanies();
                this.renderTable();
            });
        }

        // Pagination düymələri
        const prevBtn = document.getElementById('prevPageBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }

        const nextBtn = document.getElementById('nextPageBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }

        // Export düyməsi
        const exportBtn = document.getElementById('exportCompaniesBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCompanies());
        }

        // Əlavə şirkət düymələri
        const addCompanyBtn = document.getElementById('addCompanyBtn');
        if (addCompanyBtn) {
            addCompanyBtn.addEventListener('click', () => this.openAddCompanyForm());
        }

        const modalAddBtn = document.getElementById('modalAddCompanyBtn');
        if (modalAddBtn) {
            modalAddBtn.addEventListener('click', () => this.openAddCompanyForm());
        }

        // Əlavə forma düymələri
        const closeAddBtn = document.getElementById('closeAddCompanyModalBtn');
        if (closeAddBtn) {
            closeAddBtn.addEventListener('click', () => this.closeAddCompanyModal());
        }

        const cancelAddBtn = document.getElementById('cancelAddCompanyBtn');
        if (cancelAddBtn) {
            cancelAddBtn.addEventListener('click', () => this.closeAddCompanyModal());
        }

        // Əlavə forma submit
        const addForm = document.getElementById('addCompanyForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddCompany();
            });
        }

        // Overlay klikləri (modalı bağlamaq üçün)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('bg-black')) {
                if (this.modal && !this.modal.classList.contains('hidden')) {
                    this.close();
                }
                if (this.addModal && !this.addModal.classList.contains('hidden')) {
                    this.closeAddCompanyModal();
                }
                if (this.detailsModal && !this.detailsModal.classList.contains('hidden')) {
                    this.closeCompanyDetails();
                }
            }
        });

        // Escape düyməsi ilə bağlamaq
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.modal && !this.modal.classList.contains('hidden')) {
                    this.close();
                }
                if (this.addModal && !this.addModal.classList.contains('hidden')) {
                    this.closeAddCompanyModal();
                }
                if (this.detailsModal && !this.detailsModal.classList.contains('hidden')) {
                    this.closeCompanyDetails();
                }
            }
        });
    }

    /**
     * MODULU AÇ
     */
    async open() {
        try {
            console.log('🚀 Şirkətlər modulu açılır...');

            if (!this.modal) {
                console.error('❌ Şirkətlər modulu tapılmadı');
                return;
            }

            // Məlumatları yenilə
            await this.loadCompanies();

            // Modalı göstər
            this.modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            // Statistikaları hesabla
            this.calculateStatistics();

            // Cədvəli yüklə
            this.filterCompanies();
            this.renderTable();

            // Axtarış və filteri resetlə
            const searchInput = document.getElementById('companySearch');
            const filterSelect = document.getElementById('companyFilter');
            if (searchInput) searchInput.value = '';
            if (filterSelect) filterSelect.value = 'all';
            this.searchTerm = '';
            this.filterStatus = 'all';

            console.log('✅ Şirkətlər modulu açıldı');

        } catch (error) {
            console.error('❌ Modul açılmadı:', error);
            this.showError('Modul açılmadı: ' + error.message);
        }
    }

    /**
     * MODULU BAĞLA
     */
    close() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            console.log('🚪 Şirkətlər modulu bağlandı');
        }
    }

    /**
     * ŞİRKƏT MƏLUMATLARINI YÜKLƏ
     */
    async loadCompanies() {
        try {
            console.log('📥 Şirkət məlumatları yüklənir...');

            let companies = [];

            // Əgər API service varsa, ondan gətir
            if (this.apiService) {
                // Əvvəlcə localStorage-dən user-in şirkət kodunu al
                let userCompanyCode = null;
                try {
                    const userData = localStorage.getItem('userData');
                    if (userData) {
                        const parsedData = JSON.parse(userData);
                        if (parsedData.user) {
                            userCompanyCode = parsedData.user.company_code || parsedData.user.companyCode;
                        } else {
                            userCompanyCode = parsedData.company_code || parsedData.companyCode;
                        }
                    }
                } catch (e) {
                    console.log('ℹ️ localStorage oxuma xətası:', e);
                }

                if (userCompanyCode) {
                    try {
                        const response = await this.apiService.get(`/companies/${userCompanyCode}/sub-companies`);
                        if (response && response.sub_companies) {
                            companies = response.sub_companies;
                        } else if (Array.isArray(response)) {
                            companies = response;
                        }
                    } catch (apiError) {

                    }
                } else {

                }
            } else {
               
            }

            this.companies = companies;

            // Kartda sayı göstər
            const countText = document.getElementById('companiesCountText');
            if (countText) {
                countText.textContent = `${this.companies.length} bağlı şirkət tapıldı`;
            }

            console.log(`✅ ${this.companies.length} şirkət yükləndi`);

        } catch (error) {
            console.error('❌ Şirkət məlumatları yüklənmədi:', error);
            this.companies = [];
            this.showError('Şirkət məlumatları yüklənmədi: ' + error.message);
        }
    }

    /**
     * ŞİRKƏTLƏRİ FİLTER ET
     */
    filterCompanies() {
        this.filteredCompanies = this.companies.filter(company => {
            // Status filter
            if (this.filterStatus === 'active' && !company.is_active) return false;
            if (this.filterStatus === 'inactive' && company.is_active) return false;

            // Search filter
            if (this.searchTerm) {
                const searchFields = [
                    company.company_name,
                    company.company_code,
                    company.voen,
                    company.address,
                    company.phone,
                    company.email
                ].filter(Boolean).join(' ').toLowerCase();

                return searchFields.includes(this.searchTerm);
            }

            return true;
        });

        // Pagination reset
        this.currentPage = 1;
    }

    /**
     * STATİSTİKALARI HESABLA
     */
    calculateStatistics() {
        const total = this.companies.length;
        const active = this.companies.filter(c => c.is_active).length;
        const totalEmployees = this.companies.reduce((sum, c) =>
            sum + (c.total_employees || c.employee_count || 0), 0);

        // Son əlavə olunan şirkət
        let lastAdded = '-';
        if (this.companies.length > 0) {
            const sorted = [...this.companies].sort((a, b) =>
                new Date(b.created_at || b.registration_date || 0) -
                new Date(a.created_at || a.registration_date || 0)
            );
            if (sorted[0].registration_date) {
                lastAdded = new Date(sorted[0].registration_date).toLocaleDateString('az-AZ');
            }
        }

        // UI-da göstər
        this.updateElement('totalCompaniesCount', total);
        this.updateElement('activeCompaniesCount', active);
        this.updateElement('totalEmployeesCount', totalEmployees);
        this.updateElement('lastAddedDate', lastAdded);
    }

    /**
     * ELEMENTİ YENİLƏ
     */
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    /**
     * CƏDVƏLİ RENDER ET
     */
    renderTable() {
        const container = document.getElementById('companiesTableContainer');
        if (!container) return;

        // Pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageCompanies = this.filteredCompanies.slice(startIndex, endIndex);
        const totalPages = Math.ceil(this.filteredCompanies.length / this.itemsPerPage);

        // Pagination kontrollerləri
        this.updatePaginationControls(totalPages);

        // Boş vəziyyət
        if (this.filteredCompanies.length === 0) {
            container.innerHTML = this.createEmptyState();
            return;
        }

        // Cədvəl yarat
        container.innerHTML = this.createTableHTML(pageCompanies);

        // Showing text
        const showingStart = this.filteredCompanies.length > 0 ? startIndex + 1 : 0;
        const showingEnd = Math.min(endIndex, this.filteredCompanies.length);
        this.updateElement('showingText', `${showingStart}-${showingEnd} of ${this.filteredCompanies.length}`);

        // Cədvəl düymələri üçün event listener-lar əlavə et
        this.attachTableEventListeners();
    }

    /**
     * BOŞ VƏZİYYƏT ÜÇÜN HTML
     */
    createEmptyState() {
        return `
            <div class="text-center py-16">
                <div class="inline-block h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                    <i class="fa-solid fa-building text-3xl text-gray-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">Şirkət tapılmadı</h3>
                <p class="text-gray-500 mb-6">Axtarış kriteriyalarınıza uyğun şirkət tapılmadı</p>
                <button class="reset-search-btn px-6 py-3 bg-brand-blue text-white rounded-xl hover:bg-blue-600 transition font-medium">
                    <i class="fa-solid fa-refresh mr-2"></i> Bütün şirkətləri göstər
                </button>
            </div>
        `;
    }

    /**
     * CƏDVƏL HTML YARAT
     */
    createTableHTML(companies) {
        return `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-50 border-b">
                            <th class="text-left py-4 px-6 text-sm font-semibold text-gray-700">Şirkət</th>
                            <th class="text-left py-4 px-6 text-sm font-semibold text-gray-700">VOEN</th>
                            <th class="text-left py-4 px-6 text-sm font-semibold text-gray-700">İşçi</th>
                            <th class="text-left py-4 px-6 text-sm font-semibold text-gray-700">Tarix</th>
                            <th class="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                            <th class="text-left py-4 px-6 text-sm font-semibold text-gray-700">Əməliyyatlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${companies.map(company => this.createTableRow(company)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * CƏDVƏL SƏTRİ YARAT
     */
    createTableRow(company) {
        const statusClass = company.is_active
            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
            : 'bg-gradient-to-r from-red-500 to-rose-500';
        const statusText = company.is_active ? 'Aktiv' : 'Deaktiv';
        const regDate = company.registration_date
            ? new Date(company.registration_date).toLocaleDateString('az-AZ')
            : '-';
        const employeeCount = company.total_employees || company.employee_count || 0;

        return `
            <tr class="company-row border-b hover:bg-gray-50 transition-all duration-200" data-company-code="${company.company_code}">
                <td class="py-4 px-6">
                    <div class="flex items-center">
                        <div class="h-10 w-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-brand-blue/20 to-blue-100 flex items-center justify-center mr-3">
                            <i class="fa-solid fa-building text-brand-blue"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900">
                                ${company.company_name || company.company_code}
                            </div>
                            <div class="text-sm text-gray-500 mt-1">${company.company_code}</div>
                            ${company.address ? `
                            <div class="text-xs text-gray-400 mt-1 flex items-center">
                                <i class="fa-solid fa-location-dot mr-1"></i>
                                <span class="truncate max-w-xs">${company.address}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6">
                    <div class="font-medium text-gray-900">${company.voen || '—'}</div>
                </td>
                <td class="py-4 px-6">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200">
                        <i class="fa-solid fa-users mr-1.5"></i>${employeeCount}
                    </span>
                </td>
                <td class="py-4 px-6">
                    <div class="text-sm text-gray-500">
                        <i class="fa-solid fa-calendar-days mr-2"></i>${regDate}
                    </div>
                </td>
                <td class="py-4 px-6">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="py-4 px-6">
                    <div class="flex space-x-2">
                        <button class="view-company-btn px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1.5"
                                data-company-code="${company.company_code}"
                                title="Detallı baxış">
                            <i class="fa-solid fa-eye"></i>
                            <span class="hidden md:inline">Bax</span>
                        </button>
                        <button class="edit-company-btn px-3 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center gap-1.5"
                                data-company-code="${company.company_code}"
                                title="Redaktə et">
                            <i class="fa-solid fa-edit"></i>
                            <span class="hidden md:inline">Redaktə</span>
                        </button>
                        <button class="delete-company-btn px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1.5"
                                data-company-code="${company.company_code}"
                                title="Sil">
                            <i class="fa-solid fa-trash"></i>
                            <span class="hidden md:inline">Sil</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * CƏDVƏL DÜYMƏLƏRİ ÜÇÜN EVENT LISTENER-LAR
     */
    attachTableEventListeners() {
        // Reset search düyməsi
        const resetBtn = document.querySelector('.reset-search-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.searchTerm = '';
                this.filterStatus = 'all';
                const searchInput = document.getElementById('companySearch');
                const filterSelect = document.getElementById('companyFilter');
                if (searchInput) searchInput.value = '';
                if (filterSelect) filterSelect.value = 'all';
                this.filterCompanies();
                this.renderTable();
            });
        }

        // View düymələri
        document.querySelectorAll('.view-company-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const companyCode = e.currentTarget.dataset.companyCode;
                this.viewCompany(companyCode);
            });
        });

        // Edit düymələri
        document.querySelectorAll('.edit-company-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const companyCode = e.currentTarget.dataset.companyCode;
                this.editCompany(companyCode);
            });
        });

        // Delete düymələri
        document.querySelectorAll('.delete-company-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const companyCode = e.currentTarget.dataset.companyCode;
                this.deleteCompany(companyCode);
            });
        });
    }

    /**
     * PAGINATION KONTROLLERLƏRİ YENİLƏ
     */
    updatePaginationControls(totalPages) {
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages || totalPages === 0;
        }
    }

    /**
     * ƏVVƏLKİ SƏHİFƏ
     */
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
        }
    }

    /**
     * NÖVBƏTİ SƏHİFƏ
     */
    nextPage() {
        const totalPages = Math.ceil(this.filteredCompanies.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
        }
    }

    /**
     * ŞİRKƏT DETALLARINA BAX
     */
    async viewCompany(companyCode) {
        try {
            console.log(`👁️ Şirkət detalları yüklənir: ${companyCode}`);

            // Əvvəlcə cached şirkəti tap
            let company = this.companies.find(c => c.company_code === companyCode);

            // Əgər API varsa, tam məlumatları gətir
            if (this.apiService && companyCode) {
                try {
                    console.log(`🌐 API çağırışı: /companies/${companyCode}/full`);
                    const response = await this.apiService.get(`/companies/${companyCode}/full`);

                    console.log('📦 API Response:', response);

                    // API direkt company object-i qaytarır, response.company yoxdur!
                    if (response) {
                        company = response; // Əsas düzəliş BURADADIR!

                        // Debug üçün məlumatları yoxla
                        console.log('🔍 Company object keys:', Object.keys(company));
                        console.log('📊 Company data:', {
                            hasCompanyName: 'company_name' in company,
                            hasEmployeeCount: 'employee_count' in company,
                            hasTotalEmployees: 'total_employees' in company,
                            hasCeoInfo: 'ceo_info' in company,
                            hasAsanImzaInfo: 'asan_imza_info' in company,
                            companyName: company.company_name,
                            employeeCount: company.employee_count
                        });
                    } else {
                        console.log('⚠️ API boş response qaytardı');
                    }
                } catch (apiError) {
                    console.log('❌ API xətası:', apiError.message, apiError);
                    console.log('ℹ️ Cached məlumatlar istifadə edilir');
                }
            }

            if (!company) {
                this.showError('Şirkət tapılmadı');
                return;
            }

            // DEBUG: Company məlumatlarını yoxla
            console.log('🎯 Modal üçün company data:', company);

            // Bütün sahələri format et - GÜCLÜ VERSİYA
            const formatValue = (value) => {
                if (value === null || value === undefined || value === '' || value === '—') return '—';
                if (typeof value === 'object') return '—';
                return String(value);
            };

            const formatDate = (dateString) => {
                if (!dateString || dateString === '—') return '—';
                try {
                    return new Date(dateString).toLocaleDateString('az-AZ');
                } catch (e) {
                    console.warn('Date format xətası:', e, 'date:', dateString);
                    return dateString;
                }
            };

            const formatCurrency = (amount) => {
                if (!amount || amount === '—' || isNaN(amount)) return '—';
                try {
                    const numAmount = parseFloat(amount);
                    if (isNaN(numAmount)) return '—';
                    return numAmount.toLocaleString('az-AZ', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }) + ' ₼';
                } catch (e) {
                    console.warn('Currency format xətası:', e);
                    return '—';
                }
            };

            // CEO məlumatlarını çıxar
            let ceoData = {};
            if (company.ceo_info && typeof company.ceo_info === 'object') {
                ceoData = company.ceo_info;
            } else if (company.ceo_name || company.ceo_email || company.ceo_phone) {
                ceoData = {
                    ceo_name: company.ceo_name,
                    ceo_email: company.ceo_email,
                    ceo_phone: company.ceo_phone,
                    position: company.position || 'Direktor'
                };
            }

            // Asan İmza məlumatlarını çıxar
            let asanData = {};
            if (company.asan_imza_info && typeof company.asan_imza_info === 'object') {
                asanData = company.asan_imza_info;
            } else if (company.asan_imza_number || company.asan_id) {
                asanData = {
                    asan_imza_number: company.asan_imza_number,
                    asan_id: company.asan_id,
                    pin1: company.pin1,
                    pin2: company.pin2,
                    puk: company.puk
                };
            }

            // Modal məzmunu yarat - YENİ VERSİYA
            const modalContent = `
                <div class="px-8 py-6 border-b">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="h-14 w-14 rounded-xl bg-gradient-to-br from-brand-blue to-blue-500 flex items-center justify-center">
                                <i class="fa-solid fa-building text-2xl text-white"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-900">${formatValue(company.company_name)}</h3>
                                <p class="text-gray-600">${formatValue(company.company_code)}</p>
                            </div>
                        </div>
                        <button class="close-details-btn h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                            <i class="fa-solid fa-times text-gray-600"></i>
                        </button>
                    </div>
                </div>
                <div class="px-8 py-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Birinci sütun -->
                        <div class="space-y-4">    
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Status</label>
                                <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${company.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${company.is_active ? 'Aktiv' : 'Deaktiv'}
                                </span>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">İşçi sayı</label>
                                <p class="text-lg font-semibold">${formatValue(company.employee_count || company.total_employees || 0)}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Fəaliyyət sahəsi</label>
                                <p class="text-lg">${formatValue(company.industry_sector || company.activity_field || company.industry || '—')}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Quruluş forması</label>
                                <p class="text-lg">${formatValue(company.company_structure || company.legal_form || company.company_type || '—')}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">VÖEN kodu</label>
                                <p class="text-lg">${formatValue(company.voen)}</p>
                            </div>
                        </div>
                        
                        <!-- İkinci sütun -->
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Qeydiyyat tarixi</label>
                                <p class="text-lg font-semibold">${formatDate(company.registration_date)}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Telefon</label>
                                <p class="text-lg">${formatValue(ceoData.ceo_phone || company.phone || company.phone_number || '—')}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                <p class="text-lg">${formatValue(ceoData.ceo_email || company.email || company.email_address || '—')}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Ünvan</label>
                                <p class="text-lg">${formatValue(company.address || company.full_address || '—')}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Vebsayt</label>
                                <p class="text-lg">${formatValue(company.company_website || company.website || company.web_site || '—')}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Şəhər/Bölgə</label>
                                <p class="text-lg">${formatValue(company.city || company.region || '—')}</p>
                            </div>
                        </div>
                        
                        <!-- Üçüncü sütun -->
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Maliyyə məlumatları</label>
                                <div class="grid grid-cols-2 gap-2 mt-2">
                                    <div>
                                        <span class="text-sm text-gray-500">Kapital:</span>
                                        <p class="font-medium">${formatCurrency(company.capital || company.authorized_capital)}</p>
                                    </div>
                                    <div>
                                        <span class="text-sm text-gray-500">Dövriyyə:</span>
                                        <p class="font-medium">${formatCurrency(company.annual_turnover)}</p>
                                    </div>
                                    <div>
                                        <span class="text-sm text-gray-500">Bank hesabı:</span>
                                        <p class="font-medium">${formatValue(company.bank_account || '—')}</p>
                                    </div>
                                    <div>
                                        <span class="text-sm text-gray-500">Bank adı:</span>
                                        <p class="font-medium">${formatValue(company.bank_name || '—')}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Asan İmza məlumatları</label>
                                <div class="space-y-2">
                                    <div>
                                        <span class="text-sm text-gray-500">Asan İmza:</span>
                                        <p class="font-medium">${formatValue(asanData.asan_imza_number || company.asan_imza || '—')}</p>
                                    </div>
                                    <div>
                                        <span class="text-sm text-gray-500">Asan İD:</span>
                                        <p class="font-medium">${formatValue(asanData.asan_id || company.asan_id || '—')}</p>
                                    </div>
                                    <div>
                                        <span class="text-sm text-gray-500">Pin 1:</span>
                                        <p class="font-medium">${formatValue(asanData.pin1 || company.pin1 || '—')}</p>
                                    </div>
                                    <div>
                                        <span class="text-sm text-gray-500">Pin 2:</span>
                                        <p class="font-medium">${formatValue(asanData.pin2 || company.pin2 || '—')}</p>
                                    </div>
                                    <div>
                                        <span class="text-sm text-gray-500">Puk:</span>
                                        <p class="font-medium">${formatValue(asanData.puk || company.puk || '—')}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Rəhbər məlumatları</label>
                                <div class="space-y-1">
                                    <p class="font-medium">${formatValue(ceoData.ceo_name || company.director_name || company.ceo_name || '—')}</p>
                                    <p class="text-sm text-gray-500">${formatValue(ceoData.position || company.director_position || 'Direktor')}</p>
                                    <p class="text-sm">${formatValue(ceoData.ceo_phone || company.director_phone || '—')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Əlavə məlumatlar sətri -->
                    <div class="mt-6 pt-6 border-t">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Hesabat ili</label>
                                <p class="font-medium">${formatValue(company.reporting_year || new Date().getFullYear())}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Vergi oranı</label>
                                <p class="font-medium">${company.tax_rate ? company.tax_rate + '%' : '—'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">ƏDV statusu</label>
                                <p class="font-medium">${company.vat_registered ? 'ƏDV-li' : 'ƏDV-siz'}</p>
                            </div>
                        </div>
                    </div>
                    
                    ${company.description || company.notes || company.additional_info ? `
                    <div class="mt-6 pt-6 border-t">
                        <label class="block text-sm font-medium text-gray-500 mb-2">Qeydlər / Əlavə məlumat</label>
                        <div class="bg-gray-50 rounded-lg p-4">
                            <p class="text-gray-700">${formatValue(company.description || company.notes || company.additional_info)}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Fəaliyyət tarixçəsi -->
                    <div class="mt-6 pt-6 border-t">
                        <label class="block text-sm font-medium text-gray-500 mb-3">Fəaliyyət tarixçəsi</label>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Yaradılma tarixi:</span>
                                <span class="font-medium">${formatDate(company.created_at)}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Son yenilənmə:</span>
                                <span class="font-medium">${formatDate(company.updated_at)}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Son giriş:</span>
                                <span class="font-medium">${formatDate(company.last_login || company.last_login_at || '—')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Əməliyyat düymələri -->
                    <div class="mt-8 pt-6 border-t flex justify-end space-x-4">
                        <button class="edit-company-action-btn px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
                                data-company-code="${company.company_code}">
                            <i class="fa-solid fa-edit"></i>
                            Redaktə et
                        </button>
                        <button class="download-company-btn px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                                data-company-code="${company.company_code}">
                            <i class="fa-solid fa-download"></i>
                            Məlumatları yüklə
                        </button>
                        <button class="print-company-btn px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                                data-company-code="${company.company_code}">
                            <i class="fa-solid fa-print"></i>
                            Çap et
                        </button>
                    </div>
                </div>
            `;

            // DEBUG: Modal content-i yoxla
            console.log('📝 Modal content yaradıldı');

            if (this.detailsModal) {
                const contentDiv = document.getElementById('companyDetailsContent');
                if (contentDiv) {
                    contentDiv.innerHTML = modalContent;
                    console.log('✅ Modal content əlavə edildi');

                    // Bağlama düyməsi üçün event listener
                    const closeBtn = contentDiv.querySelector('.close-details-btn');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => this.closeCompanyDetails());
                    }

                    // Əməliyyat düymələri üçün event listener-lar
                    const editBtn = contentDiv.querySelector('.edit-company-action-btn');
                    if (editBtn) {
                        editBtn.addEventListener('click', (e) => {
                            const companyCode = e.currentTarget.dataset.companyCode;
                            this.editCompany(companyCode);
                        });
                    }

                    const downloadBtn = contentDiv.querySelector('.download-company-btn');
                    if (downloadBtn) {
                        downloadBtn.addEventListener('click', (e) => {
                            const companyCode = e.currentTarget.dataset.companyCode;
                            this.downloadCompanyData(companyCode);
                        });
                    }

                    const printBtn = contentDiv.querySelector('.print-company-btn');
                    if (printBtn) {
                        printBtn.addEventListener('click', (e) => {
                            const companyCode = e.currentTarget.dataset.companyCode;
                            this.printCompanyData(companyCode);
                        });
                    }

                    this.detailsModal.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                    console.log('🎉 Modal göstərildi');
                } else {
                    console.error('❌ companyDetailsContent div-i tapılmadı');
                }
                } else {
                    console.error('❌ detailsModal tapılmadı');
                }

            } catch (error) {
                console.error('❌ Şirkət detalları göstərilmədi:', error);
                this.showError('Şirkət detalları göstərilmədi: ' + error.message);
            }
        }

    /**
     * ŞİRKƏT DETALLARINI BAĞLA
     */
    closeCompanyDetails() {
        if (this.detailsModal) {
            this.detailsModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * ŞİRKƏT MƏLUMATLARINI YÜKLƏ
     */
    downloadCompanyData(companyCode) {
        const company = this.companies.find(c => c.company_code === companyCode);
        if (!company) {
            this.showError('Şirkət tapılmadı');
            return;
        }

        console.log(`📥 Şirkət məlumatları yüklənir: ${companyCode}`);
        this.showSuccess('Şirkət məlumatları yüklənmə prosesi başladı...');
    }

    /**
     * ŞİRKƏT MƏLUMATLARINI ÇAP ET
     */
    printCompanyData(companyCode) {
        const company = this.companies.find(c => c.company_code === companyCode);
        if (!company) {
            this.showError('Şirkət tapılmadı');
            return;
        }

        console.log(`🖨️ Şirkət məlumatları çap edilir: ${companyCode}`);
        this.showSuccess('Çap prosesi başladı...');
    }

    /**
     * ŞİRKƏTİ REDAKTƏ ET
     */
    async editCompany(companyCode) {
        const company = this.companies.find(c => c.company_code === companyCode);
        if (!company) {
            this.showError('Şirkət tapılmadı');
            return;
        }

        console.log(`✏️ Şirkət redaktə edilir: ${companyCode}`);

        // Burada redaktə formasını açın
        // this.openEditCompanyForm(company);

        this.showSuccess('Redaktə forması açıldı');
    }

    /**
     * ŞİRKƏTİ SİL
     */
    async deleteCompany(companyCode) {
        const company = this.companies.find(c => c.company_code === companyCode);
        if (!company) return;

        if (confirm(`"${company.company_name}" şirkətini silmək istədiyinizə əminsiniz?\n\nBu əməliyyat geri qaytarıla bilməz.`)) {
            try {
                console.log(`🗑️ "${company.company_code}" şirkəti silinir...`);

                // API çağırışı
                if (this.apiService) {
                    const response = await this.apiService.delete(`/companies/${companyCode}`);
                    if (response.success) {
                        this.companies = this.companies.filter(c => c.company_code !== companyCode);
                        this.filterCompanies();
                        this.renderTable();
                        this.calculateStatistics();

                        // Kartda sayı yenilə
                        const countText = document.getElementById('companiesCountText');
                        if (countText) {
                            countText.textContent = `${this.companies.length} bağlı şirkət tapıldı`;
                        }

                        this.showSuccess('Şirkət uğurla silindi!');
                    } else {
                        this.showError('Şirkət silinmədi: ' + response.message);
                    }
                } else {
                    // Mock delete
                    this.companies = this.companies.filter(c => c.company_code !== companyCode);
                    this.filterCompanies();
                    this.renderTable();
                    this.calculateStatistics();

                    const countText = document.getElementById('companiesCountText');
                    if (countText) {
                        countText.textContent = `${this.companies.length} bağlı şirkət tapıldı`;
                    }

                    this.showSuccess('Şirkət uğurla silindi!');
                }

            } catch (error) {
                console.error('❌ Şirkət silinmədi:', error);
                this.showError('Şirkət silinmədi: ' + error.message);
            }
        }
    }

    /**
     * ƏLAVƏ ŞİRKƏT FORMASINI AÇ
     */
    openAddCompanyForm() {
        if (this.addModal) {
            this.addModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * ƏLAVƏ ŞİRKƏT FORMASINI BAĞLA
     */
    closeAddCompanyModal() {
        if (this.addModal) {
            this.addModal.classList.add('hidden');
            document.body.style.overflow = 'auto';

            // Formu təmizlə
            const form = document.getElementById('addCompanyForm');
            if (form) form.reset();
        }
    }

    /**
     * YENİ ŞİRKƏT ƏLAVƏ ET
     */
    async handleAddCompany() {
        try {
            const name = document.getElementById('newCompanyName').value;
            const code = document.getElementById('newCompanyCode').value;
            const voen = document.getElementById('newCompanyVoen').value;
            const status = document.getElementById('newCompanyStatus').value;
            const address = document.getElementById('newCompanyAddress').value;

            if (!name || !code || !voen) {
                this.showError('Zəhmət olmasa bütün tələb olunan sahələri doldurun');
                return;
            }

            console.log('➕ Yeni şirkət əlavə edilir:', { name, code, voen });

            const newCompany = {
                company_code: code,
                company_name: name,
                voen: voen,
                address: address,
                is_active: status === 'active',
                total_employees: 0,
                registration_date: new Date().toISOString().split('T')[0],
                phone: '',
                email: '',
                asan_imza: '',
                asan_id: '',
                pin1: '',
                pin2: '',
                puk: '',
                activity_field: '',
                legal_form: '',
                voen_code: '',
                website: '',
                city: '',
                authorized_capital: 0,
                annual_turnover: 0,
                bank_account: '',
                bank_name: '',
                director_name: '',
                director_position: '',
                director_phone: '',
                reporting_year: new Date().getFullYear(),
                tax_rate: 0,
                vat_registered: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // API çağırışı
            if (this.apiService) {
                const response = await this.apiService.post('/companies', newCompany);
                if (response && response.company) {
                    this.companies.unshift(response.company);
                    this.filterCompanies();
                    this.renderTable();
                    this.calculateStatistics();

                    const countText = document.getElementById('companiesCountText');
                    if (countText) {
                        countText.textContent = `${this.companies.length} bağlı şirkət tapıldı`;
                    }

                    this.closeAddCompanyModal();
                    this.showSuccess('Yeni şirkət uğurla əlavə edildi!');
                } else {
                    this.showError('Şirkət əlavə edilmədi: ' + (response.message || 'Xəta baş verdi'));
                }
            } else {
                // Mock əlavə
                this.companies.unshift(newCompany);
                this.filterCompanies();
                this.renderTable();
                this.calculateStatistics();

                const countText = document.getElementById('companiesCountText');
                if (countText) {
                    countText.textContent = `${this.companies.length} bağlı şirkət tapıldı`;
                }

                this.closeAddCompanyModal();
                this.showSuccess('Yeni şirkət uğurla əlavə edildi!');
            }

        } catch (error) {
            console.error('❌ Şirkət əlavə edilmədi:', error);
            this.showError('Şirkət əlavə edilmədi: ' + error.message);
        }
    }

    /**
     * ŞİRKƏTLƏRİ EXPORT ET
     */
    exportCompanies() {
        try {
            console.log('📤 Şirkət məlumatları export edilir...');

            // JSON formatında export
            const dataStr = JSON.stringify(this.companies, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

            const exportFileDefaultName = `sirketler_${new Date().toISOString().split('T')[0]}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();

            this.showSuccess('Şirkət məlumatları uğurla export edildi!');

        } catch (error) {
            console.error('❌ Export xətası:', error);
            this.showError('Export əməliyyatı uğursuz oldu: ' + error.message);
        }
    }



    /**
     * UĞUR MESAJI GÖSTƏR
     */
    showSuccess(message) {
        alert('✅ ' + message);
    }

    /**
     * XƏTA MESAJI GÖSTƏR
     */
    showError(message) {
        alert('❌ ' + message);
    }
}

// Global obyekt yarat
document.addEventListener('DOMContentLoaded', function() {
    window.companiesModal = new CompaniesService();
});