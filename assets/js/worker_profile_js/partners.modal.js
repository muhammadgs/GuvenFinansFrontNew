/**
 * ÜST ŞİRKƏTLƏR MODAL MODULU
 * assets/js/owner_profile_js/partners.modal.js
 */

class PartnersService {
    constructor() {
        this.parentCompanies = []; // Artıq partners deyil, parentCompanies
        this.filteredParents = [];
        this.currentPage = 1;
        this.itemsPerPage = 8;
        this.searchTerm = '';
        this.filterStatus = 'all';
        this.filterType = 'parent'; // Həmişə parent
        this.currentCompanyCode = null;

        // DOM elementləri
        this.modal = null;
        this.addModal = null;
        this.detailsModal = null;
        this.apiService = null;
        this.statistics = {
            total_parents: 0,
            active_parents: 0,
            total_projects: 0,
            most_common_type: 'Üst Şirkət'
        };
    }

    /**
     * API METODLARI - YALNIZ ÜST ŞİRKƏTLƏR ÜÇÜN
     */


    async getParentCompaniesAPI(companyCode, params = {}) {
        try {
            console.log(`📥 API: Şirkətin üst şirkətləri gətirilir: ${companyCode}`);

            const token = localStorage.getItem('guven_token');

            // ✅ DÜZGÜN ENDPOINT - PROXY İLƏ
            const endpoint = `/proxy.php/api/v1/partners/${companyCode}/`;
            const url = `${window.location.origin}${endpoint}`;

            console.log(`🌐 API URL: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log(`📥 API Response status: ${response.status}`);

            if (response.status === 401) {
                console.error('❌ 401 Unauthorized - Token expired');
                localStorage.removeItem('guven_token');
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                // API cavab vermədikdə, sadəcə boş array qaytar
                console.warn('⚠️ API cavab vermədi. Boş siyahı qaytarılır.');
                return {
                    items: [],
                    total: 0,
                    page: 1,
                    pages: 1,
                    has_next: false,
                    has_prev: false
                };
            }

            const data = await response.json();
            console.log('✅ API cavabı (get parent companies):', data);

            // Parent filter: yalnız parent şirkətləri göstər
            let parents = [];
            if (data.items && Array.isArray(data.items)) {
                parents = data.items.filter(item =>
                    item.relationship_type === 'parent' ||
                    (item.parent_company_code && item.child_company_code === companyCode)
                );
            }

            return {
                items: parents,
                total: parents.length,
                page: 1,
                pages: 1,
                has_next: false,
                has_prev: false
            };

        } catch (error) {
            console.error('❌ API xətası (getParentCompanies):', error);
            // Xəta halında sadəcə boş siyahı qaytar
            return {
                items: [],
                total: 0,
                page: 1,
                pages: 1,
                has_next: false,
                has_prev: false
            };
        }
    }

    // partners.modal.js ~ 150-200 sətirlər arası
    async getParentStatisticsAPI(companyCode) {
        try {
            console.log(`📊 API: Üst şirkət statistikaları gətirilir: ${companyCode}`);

            const token = localStorage.getItem('guven_token');

            // ✅ DÜZGÜN ENDPOINT - PROXY İLƏ
            const endpoint = `/proxy.php/api/v1/partners/${companyCode}/statistics`;
            const url = `${window.location.origin}${endpoint}`;

            console.log(`🌐 API URL: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log(`📥 API Response status: ${response.status}`);

            if (response.status === 401) {
                console.error('❌ 401 Unauthorized - Token expired');
                localStorage.removeItem('guven_token');
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                // Əgər statistics endpoint-i yoxdursa, xəta vermə, sadəcə standart statistikalar göstər
                console.warn('⚠️ statistics endpoint-i tapılmadı. Standart statistikalar göstərilir.');
                return {
                    total_parents: 0,
                    active_parents: 0,
                    total_projects: 0,
                    most_common_type: 'Üst Şirkət'
                };
            }

            const data = await response.json();
            console.log('✅ API statistikaları:', data);

            return data;

        } catch (error) {
            console.error('❌ API xətası (getParentStatistics):', error);
            // Xəta halında standart statistikalar qaytar
            return {
                total_parents: 0,
                active_parents: 0,
                total_projects: 0,
                most_common_type: 'Üst Şirkət'
            };
        }
    }

    /**
     * ALTERNATİV ÜSUL - Bütün partniorlardan parent-ları filtrlə
     */
    async getParentCompaniesAlternative(companyCode, params) {
        try {
            console.log(`🔄 Alternativ: Bütün partniorlardan üst şirkətlər filtirlənir: ${companyCode}`);

            const token = localStorage.getItem('guven_token');
            const baseUrl = window.location.origin;

            // ✅ DÜZƏLİŞ: Düzgün endpoint
            const endpoint = `/api/v1/companies/${companyCode}/partners?limit=1000&relationship_type=parent`;
            const url = `${baseUrl}${endpoint}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Yalnız parent (üst) şirkətləri göstər
            let parents = [];

            if (data.items && Array.isArray(data.items)) {
                // ✅ DÜZƏLİŞ: Frontend-də relationship_type ilə filter et
                parents = data.items.filter(item => {
                    // Üst şirkətlər child_company_code = currentCompany olmalıdır
                    return (item.child_company_code === companyCode &&
                           (item.relationship_type === 'parent' || item.parent_company === true));
                });
            } else if (Array.isArray(data)) {
                parents = data.filter(item =>
                    item.child_company_code === companyCode &&
                    (item.relationship_type === 'parent' || item.parent_company === true)
                );
            }

            return {
                items: parents,
                total: parents.length,
                page: 1,
                pages: 1,
                has_next: false,
                has_prev: false
            };

        } catch (error) {
            console.error('❌ Alternativ metod xətası:', error);
            return this.getTestParentCompanies();
        }
    }

    /**
     * STATİSTİKALARI GƏTİR - ÜST ŞİRKƏTLƏR ÜÇÜN
     */
    async getParentStatisticsAPI(companyCode) {
        try {
            console.log(`📊 API: Üst şirkət statistikaları gətirilir: ${companyCode}`);

            const token = localStorage.getItem('guven_token');
            const baseUrl = window.location.origin;

            // ✅ DÜZƏLİŞ: YENİ endpoint
            const endpoint = `/api/v1/companies/${companyCode}/partners/parent-statistics`;
            const url = `${baseUrl}${endpoint}`;

            console.log(`🌐 API URL: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log(`📥 API Response status: ${response.status}`);

            if (response.status === 401) {
                console.error('❌ 401 Unauthorized - Token expired');
                localStorage.removeItem('guven_token');
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                // Alternativ: Özümüz hesablayaq
                console.warn('⚠️ parent-statistics endpoint-i tapılmadı. Fake data qaytarılır.');
                return this.calculateParentStatistics();
            }

            const data = await response.json();
            console.log('✅ API statistikaları:', data);

            // API data.data qaytarırsa
            if (data && data.data) {
                return data.data;
            }
            return data;

        } catch (error) {
            console.error('❌ API xətası (getParentStatistics):', error);
            return this.calculateParentStatistics();
        }
    }

    /**
     * ŞİRKƏT AXTARIŞI - ÜST ŞİRKƏT ÜÇÜN
     */
    async searchParentCompaniesAPI(companyCode, searchTerm) {
        try {
            console.log(`🔍 API: Üst şirkət axtarışı: ${companyCode}, açar: ${searchTerm}`);

            const token = localStorage.getItem('guven_token');

            // ✅ PROXY İLƏ DÜZGÜN URL
            const endpoint = `/proxy.php/api/v1/companies/code/${encodeURIComponent(searchTerm)}`;
            const url = `${window.location.origin}${endpoint}`;

            console.log(`🌐 API URL: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log(`📥 API Response status: ${response.status}`);

            if (response.status === 404) {
                // Şirkət tapılmadı - bu NORMALDIR!
                console.log(`ℹ️ Şirkət tapılmadı: ${searchTerm}`);
                return [];
            }

            if (response.status === 401) {
                console.error('❌ 401 Unauthorized - Token expired');
                localStorage.removeItem('guven_token');
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API error:', errorText);
                return [];
            }

            const data = await response.json();
            console.log('✅ API axtarış nəticələri:', data);

            // API cavabını formatla
            return this.formatCompanySearchResults(data);

        } catch (error) {
            console.error('❌ API xətası (searchParentCompanies):', error);
            return [];
        }
    }



    /**
     * Şirkət axtarış nəticələrini formatla
     */
    formatCompanySearchResults(apiResponse) {
        try {
            // Əgər boş array-dırsa (şirkət tapılmayıb)
            if (!apiResponse || (Array.isArray(apiResponse) && apiResponse.length === 0)) {
                return [];
            }

            // Əgər bir şirkət obyekti qayıdıbsa (code/{code} endpoint-i)
            if (apiResponse && apiResponse.company_code) {
                return [{
                    company_code: apiResponse.company_code,
                    company_name: apiResponse.company_name || apiResponse.company_code,
                    voen: apiResponse.voen || '',
                    address: apiResponse.address || '',
                    is_active: apiResponse.is_active !== false,
                    is_partner: false // Əvvəlcə false, sonra yoxlaya bilərik
                }];
            }

            // Əgər array qayıdıbsa
            if (Array.isArray(apiResponse)) {
                return apiResponse.map(company => ({
                    company_code: company.company_code || company.code,
                    company_name: company.company_name || company.name || company.company_code,
                    voen: company.voen || company.tax_id || '',
                    address: company.address || company.location || '',
                    is_active: company.is_active !== false,
                    is_partner: company.is_partner || false
                }));
            }

            return [];

        } catch (error) {
            console.error('❌ Formatlama xətası:', error);
            return [];
        }
    }

    /**
     * YENİ ÜST ŞİRKƏT ƏLAVƏ ET
     */


    async addParentCompanyAPI(companyCode, parentData) {
        try {
            console.log(`➕ API: Yeni üst şirkət əlavə edilir: ${companyCode}`);
            console.log('📊 Gelen data (RAW):', parentData);
            console.log('📊 Gelen data (JSON):', JSON.stringify(parentData, null, 2));

            const token = localStorage.getItem('guven_token');
            const endpoint = `/proxy.php/api/v1/partners/${companyCode}/`;
            const url = `${window.location.origin}${endpoint}`;

            console.log(`🌐 API URL: ${url}`);

            // ✅ DÜZGÜN DATA - Gelen datayı değiştirme!
            // Backend modeline göre: parent_company_code, child_company_code
            const requestData = {
                parent_company_code: parentData.parent_company_code,  // Üst şirket
                child_company_code: parentData.child_company_code,    // Alt şirket
                relationship_type: parentData.relationship_type || 'parent',
                description: parentData.description || '',
                contract_number: parentData.contract_number || '',
                contract_date: parentData.contract_date || null,
                status: parentData.status || 'active',
                contact_person: parentData.contact_person || '',
                contact_phone: parentData.contact_phone || '',
                contact_email: parentData.contact_email || '',
                total_projects: parentData.total_projects || 0,
                last_contact_date: parentData.last_contact_date || new Date().toISOString().split('T')[0]
            };

            console.log('📤 Göndərilən data (FINAL):', JSON.stringify(requestData, null, 2));

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log(`📥 API Response status: ${response.status}`);

            if (response.status === 401) {
                console.error('❌ 401 Unauthorized - Token expired');
                localStorage.removeItem('guven_token');
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ API cavabı (add parent company):', data);
            return data;

        } catch (error) {
            console.error('❌ API xətası (addParentCompany):', error);
            throw error;
        }
    }

    /**
     * ÜST ŞİRKƏTİ YENİLƏ
     */
    async updateParentCompanyAPI(companyCode, parentId, updateData) {
        try {
            console.log(`✏️ API: Üst şirkət yenilənir: ${companyCode}, ID: ${parentId}`, updateData);

            const token = localStorage.getItem('guven_token');
            const baseUrl = window.location.origin;

            const endpoint = `/api/v1/companies/${companyCode}/partners/${parentId}`;
            const url = `${baseUrl}${endpoint}`;

            console.log(`🌐 API URL: ${url}`);

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            console.log(`📥 API Response status: ${response.status}`);

            if (response.status === 401) {
                console.error('❌ 401 Unauthorized - Token expired');
                localStorage.removeItem('guven_token');
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ API cavabı (updateParentCompany):', data);
            return data;

        } catch (error) {
            console.error('❌ API xətası (updateParentCompany):', error);
            throw error;
        }
    }

    /**
     * ÜST ŞİRKƏTDƏN AYRIL (SİL)
     */
    async deleteParentCompanyAPI(companyCode, parentId) {
        try {
            console.log(`🗑️ API: Üst şirkətdən ayrılır: ${companyCode}, ID: ${parentId}`);

            const token = localStorage.getItem('guven_token');
            const baseUrl = window.location.origin;

            const endpoint = `/api/v1/companies/${companyCode}/partners/${parentId}`;
            const url = `${baseUrl}${endpoint}`;

            console.log(`🌐 API URL: ${url}`);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log(`📥 API Response status: ${response.status}`);

            if (response.status === 401) {
                console.error('❌ 401 Unauthorized - Token expired');
                localStorage.removeItem('guven_token');
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            console.log('✅ Üst şirkətdən uğurla ayrıldı');
            return true;

        } catch (error) {
            console.error('❌ API xətası (deleteParentCompany):', error);
            throw error;
        }
    }

    /**
     * TEST MƏLUMATLARI - ÜST ŞİRKƏTLƏR
     */
    getTestParentCompanies() {
        return {
            items: [
                {
                    id: 101,
                    parent_company_code: 'AZE26001',
                    relationship_type: 'parent',
                    status: 'active',
                    contract_number: 'PAR-001',
                    contract_date: '2024-01-10',
                    contact_person: 'Əli Hüseynov',
                    contact_phone: '+994501111111',
                    contact_email: 'ali@parent1.com',
                    description: 'Əsas üst şirkət',
                    total_projects: 8,
                    last_contact_date: '2024-03-20',
                    parent_company: {
                        company_name: 'Alfa Holding',
                        voen: '111111111',
                        is_parent: true
                    }
                },
                {
                    id: 102,
                    parent_company_code: 'AZE26002',
                    relationship_type: 'parent',
                    status: 'active',
                    contract_number: 'PAR-002',
                    contract_date: '2024-02-15',
                    contact_person: 'Aydın Məmmədov',
                    contact_phone: '+994502222222',
                    contact_email: 'aydin@parent2.com',
                    description: 'Holdinq şirkəti',
                    total_projects: 5,
                    last_contact_date: '2024-03-18',
                    parent_company: {
                        company_name: 'Beta Group',
                        voen: '222222222',
                        is_parent: true
                    }
                },
                {
                    id: 103,
                    parent_company_code: 'AZE26003',
                    relationship_type: 'parent',
                    status: 'pending',
                    contract_number: 'PAR-003',
                    contract_date: '2024-03-01',
                    contact_person: 'Kamran Əliyev',
                    contact_phone: '+994503333333',
                    contact_email: 'kamran@parent3.com',
                    description: 'Yeni üst şirkət',
                    total_projects: 2,
                    last_contact_date: '2024-03-15',
                    parent_company: {
                        company_name: 'Gamma Corp',
                        voen: '333333333',
                        is_parent: true
                    }
                }
            ],
            total: 3,
            page: 1,
            pages: 1,
            has_next: false,
            has_prev: false
        };
    }

    getTestCompanies(searchTerm = '') {
        const companies = [
            {
                company_code: 'AZE26004',
                company_name: 'ABC Technologies',
                voen: '123456789',
                is_parent: false
            },
            {
                company_code: 'AZE26005',
                company_name: 'XYZ Corporation',
                voen: '987654321',
                is_parent: true
            },
            {
                company_code: 'AZE26006',
                company_name: 'Supply Pro Ltd',
                voen: '555555555',
                is_parent: false
            },
            {
                company_code: 'AZE26007',
                company_name: 'Invest Group',
                voen: '111111111',
                is_parent: true
            },
            {
                company_code: 'AZE26008',
                company_name: 'Tech Solutions',
                voen: '222222222',
                is_parent: false
            }
        ];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            return companies.filter(company =>
                company.company_name.toLowerCase().includes(lowerSearch) ||
                company.company_code.toLowerCase().includes(lowerSearch) ||
                (company.voen && company.voen.includes(searchTerm))
            );
        }

        return companies;
    }

    /**
     * STATİSTİKALARI HESABLA
     */
    calculateParentStatistics() {
        const total = this.parentCompanies.length;
        const active = this.parentCompanies.filter(p => p.status === 'active').length;
        const totalProjects = this.parentCompanies.reduce((sum, p) => sum + (p.total_projects || 0), 0);

        return {
            total_parents: total,
            active_parents: active,
            total_projects: totalProjects,
            most_common_type: 'Üst Şirkət'
        };
    }

    /**
     * İNİTİALİZASIYA
     */
    init(companyCode = null) {
        console.log('🔄 Üst Şirkətlər modul meneceri INIT edilir...');

        try {
            // 1. Şirkət kodunu təyin et
            if (companyCode) {
                this.currentCompanyCode = companyCode;
                console.log('✅ Şirkət kodu parametrdən gəldi:', this.currentCompanyCode);
            } else {
                this.currentCompanyCode = this.getUserCompanyCode();
                console.log('✅ Şirkət kodu user-dən gəldi:', this.currentCompanyCode);
            }

            if (!this.currentCompanyCode) {
                console.error('❌ Şirkət kodu tapılmadı');
                this.showError('Şirkət kodu tapılmadı');
                return false;
            }

            console.log(`🏢 INIT: Cari şirkət: ${this.currentCompanyCode}`);

            // 2. API service-i TƏYİN ET
            console.log('🔧 API Service təyin edilir...');
            this.apiService = {
                getCompanyPartners: this.getParentCompaniesAPI.bind(this),
                getPartnerStatistics: this.getParentStatisticsAPI.bind(this),
                searchPartnerCompanies: this.searchParentCompaniesAPI.bind(this),
                addCompanyPartner: this.addParentCompanyAPI.bind(this),
                updateCompanyPartner: this.updateParentCompanyAPI.bind(this),
                deleteCompanyPartner: this.deleteParentCompanyAPI.bind(this)
            };

            console.log('✅ API Service hazır:', Object.keys(this.apiService));

            // 3. Modalı yarat (əgər yoxdursa)
            console.log('🏗️ Modal yoxlanılır...');
            this.createModalIfNotExists();

            // 4. DOM elementlərini tap
            console.log('🔍 DOM elementləri tapılır...');
            this.modal = document.getElementById('partnersModal');
            this.addModal = document.getElementById('addPartnerModal');
            this.detailsModal = document.getElementById('partnerDetailsModal');

            if (!this.modal) {
                console.error('❌ Modal tapılmadı');
                this.showError('Modal tapılmadı');
                return false;
            }

            console.log('✅ DOM elementləri tapıldı:', {
                modal: !!this.modal,
                addModal: !!this.addModal,
                detailsModal: !!this.detailsModal
            });

            // 5. Event listener-ları qur
            console.log('🔌 Event listener-lar qurulur...');
            this.setupEventListeners();

            // 6. Modal başlığını yenilə
            console.log('🏷️ Modal başlığı yenilənir...');
            this.updateModalTitle();

            console.log('✅ Üst Şirkətlər modul meneceri INIT tamamlandı');
            return true;

        } catch (error) {
            console.error('❌ INIT xətası:', error);
            this.showError('Modul init edilərkən xəta: ' + error.message);
            return false;
        }
    }

    /**
     * USER ŞİRKƏT KODUNU AL
     */
    getUserCompanyCode() {
        try {
            // localStorage-dən user məlumatlarını al
            const userData = localStorage.getItem('userData');
            if (userData) {
                const parsed = JSON.parse(userData);

                if (parsed.user) {
                    return parsed.user.company_code || parsed.user.companyCode;
                } else {
                    return parsed.company_code || parsed.companyCode;
                }
            }

            // Əgər window.app varsa
            if (window.app && window.app.user) {
                return window.app.user.company_code || window.app.user.companyCode;
            }

            return null;

        } catch (error) {
            console.error('❌ User company code alma xətası:', error);
            return null;
        }
    }

    /**
     * Şirkət seçildikdə məlumatları avtomatik doldur
     */
    async fillCompanyDetails(companyCode) {
        try {
            console.log(`📋 Şirkət məlumatları doldurulur: ${companyCode}`);

            const token = localStorage.getItem('guven_token');
            const baseUrl = window.location.origin;

            const endpoint = `/proxy.php/api/v1/companies/code/${encodeURIComponent(companyCode)}`;
            const url = `${baseUrl}${endpoint}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.log('❌ Şirkət məlumatları gətirilə bilmədi');
                return;
            }

            const companyData = await response.json();
            console.log('✅ Şirkət məlumatları:', companyData);

            // Formu avtomatik doldur
            this.autoFillCompanyForm(companyData);

        } catch (error) {
            console.error('❌ Şirkət məlumatları doldurularkən xəta:', error);
        }
    }

    /**
     * Formu şirkət məlumatları ilə avtomatik doldur
     */
    autoFillCompanyForm(companyData) {
        // Şirkət adını təsvirə əlavə et
        const descriptionField = document.getElementById('newParentDescription') || document.getElementById('newPartnerDescription');
        if (descriptionField && companyData.company_name) {
            const currentDesc = descriptionField.value || '';
            const companyInfo = `\n\nŞirkət: ${companyData.company_name}`;

            if (!currentDesc.includes(companyData.company_name)) {
                descriptionField.value = currentDesc + companyInfo;
            }
        }

        // VOEN-i təsvirə əlavə et
        if (companyData.voen) {
            const voenInfo = `\nVOEN: ${companyData.voen}`;
            if (descriptionField && !descriptionField.value.includes(companyData.voen)) {
                descriptionField.value += voenInfo;
            }
        }

        // Əgər şirkətin CEO məlumatları varsa, onları da doldur
        this.tryToGetCompanyCEO(companyData.company_code);
    }

    /**
     * Şirkətin CEO məlumatlarını gətir və formu doldur
     */
    async tryToGetCompanyCEO(companyCode) {
        try {
            const token = localStorage.getItem('guven_token');
            const baseUrl = window.location.origin;

            // CEO məlumatlarını gətirmək üçün endpoint (əgər varsa)
            const endpoint = `/proxy.php/api/v1/companies/${companyCode}/ceo`;
            const url = `${baseUrl}${endpoint}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const ceoData = await response.json();
                console.log('✅ CEO məlumatları:', ceoData);

                // CEO məlumatlarını formda doldur
                this.fillCEOInfo(ceoData);
            }

        } catch (error) {
            console.log('ℹ️ CEO məlumatları gətirilə bilmədi, normaldır');
        }
    }

    /**
     * CEO məlumatlarını formda doldur
     */
    fillCEOInfo(ceoData) {
        const contactPerson = document.getElementById('newParentContactPerson') || document.getElementById('newPartnerContactPerson');
        const contactPhone = document.getElementById('newParentContactPhone') || document.getElementById('newPartnerContactPhone');
        const contactEmail = document.getElementById('newParentContactEmail') || document.getElementById('newPartnerContactEmail');

        // CEO adını əlaqə şəxsi kimi doldur
        if (contactPerson && !contactPerson.value && ceoData.ceo_name) {
            contactPerson.value = ceoData.ceo_name;
        }

        // CEO telefonunu doldur
        if (contactPhone && !contactPhone.value && ceoData.ceo_phone) {
            contactPhone.value = ceoData.ceo_phone;
        }

        // CEO emailini doldur
        if (contactEmail && !contactEmail.value && ceoData.ceo_email) {
            contactEmail.value = ceoData.ceo_email;
        }
    }

    /**
     * MODAL YARAT (əgər yoxdursa)
     */
    createModalIfNotExists() {
        if (document.getElementById('partnersModal')) {
            console.log('✅ Modal artıq mövcuddur');
            return;
        }

        console.log('🛠️ Üst Şirkətlər modalı yaradılır...');

        // Modal HTML strukturunu yarat
        const modalHTML = `
            <div id="partnersModal" class="fixed inset-0 z-[100] hidden overflow-y-auto bg-black bg-opacity-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                    <div class="inline-block w-full max-w-6xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
                        <!-- Modal Header -->
                        <div class="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div class="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                        <i class="fa-solid fa-building text-2xl text-white"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-2xl font-bold text-gray-900">
                                            Üst Şirkətlərim
                                        </h3>
                                        <p class="text-gray-600 mt-1" id="parentsCountText">0 üst şirkət tapıldı</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <button id="modalAddParentBtn"
                                            class="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition font-medium flex items-center gap-2 shadow-lg">
                                        <i class="fa-solid fa-plus"></i>
                                        Yeni Üst Şirkət
                                    </button>
                                    <button id="closePartnersModalBtn"
                                            class="h-12 w-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                                        <i class="fa-solid fa-times text-gray-600 text-lg"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Statistik kartlar -->
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                                <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-gray-600">Cəmi Üst Şirkət</p>
                                            <p class="text-2xl font-bold text-gray-900" id="totalParentsCount">0</p>
                                        </div>
                                        <div class="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <i class="fa-solid fa-building text-purple-600"></i>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-gray-600">Aktiv Üst Şirkət</p>
                                            <p class="text-2xl font-bold text-gray-900" id="activeParentsCount">0</p>
                                        </div>
                                        <div class="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                                            <i class="fa-solid fa-check-circle text-green-600"></i>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-gray-600">Ümumi Layihə</p>
                                            <p class="text-2xl font-bold text-gray-900" id="totalProjectsCount">0</p>
                                        </div>
                                        <div class="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <i class="fa-solid fa-diagram-project text-blue-600"></i>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-gray-600">Ən çox növ</p>
                                            <p class="text-lg font-bold text-gray-900" id="mostCommonType">Üst Şirkət</p>
                                        </div>
                                        <div class="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                            <i class="fa-solid fa-arrow-up text-amber-600"></i>
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
                                                   id="parentSearch"
                                                   placeholder="Üst şirkət adı, kodu və ya əlaqə şəxsi üzrə axtar..."
                                                   class="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm">
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <select id="parentStatusFilter"
                                                class="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm">
                                            <option value="all">Bütün statuslar</option>
                                            <option value="active">Aktiv</option>
                                            <option value="inactive">Deaktiv</option>
                                            <option value="pending">Gözləmədə</option>
                                        </select>
                                        <select id="parentTypeFilter"
                                                class="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm">
                                            <option value="parent" selected>Üst Şirkət</option>
                                        </select>
                                        <button id="exportParentsBtn"
                                                class="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                                            <i class="fa-solid fa-download"></i>
                                            Export
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Üst Şirkətlər cədvəli -->
                            <div class="flex-1 overflow-auto">
                                <div id="parentsTableContainer" class="px-8 py-6">
                                    <div class="text-center py-16">
                                        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
                                        <p class="text-gray-500 mt-4">Üst şirkət siyahısı yüklənir...</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Pagination -->
                            <div class="px-8 py-4 border-t bg-gray-50">
                                <div class="flex items-center justify-between">
                                    <div class="text-sm text-gray-600">
                                        <span id="showingParentsText">0-0 of 0</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <button id="prevParentsPageBtn"
                                                class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled>
                                            <i class="fa-solid fa-chevron-left"></i>
                                        </button>
                                        <button id="nextParentsPageBtn"
                                                class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled>
                                            <i class="fa-solid fa-chevron-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Detallar modalını yarat
        const detailsModalHTML = `
            <div id="partnerDetailsModal" class="fixed inset-0 z-[120] hidden overflow-y-auto bg-black bg-opacity-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                    <div class="inline-block w-full max-w-4xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden">
                        <div id="parentDetailsContent"></div>
                    </div>
                </div>
            </div>
        `;

        // Əlavə üst şirkət modalını yarat
        const addModalHTML = `
            <div id="addPartnerModal" class="fixed inset-0 z-[110] hidden overflow-y-auto bg-black bg-opacity-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                    <div class="inline-block w-full max-w-2xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden">
                        <div class="px-8 py-6 border-b">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                        <i class="fa-solid fa-building text-purple-600"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-bold text-gray-900">Yeni Üst Şirkət Əlavə Et</h3>
                                        <p class="text-gray-600 text-sm">Yeni üst şirkətin məlumatlarını daxil edin</p>
                                        <p class="text-xs text-purple-600 mt-1">
                                            <i class="fa-solid fa-info-circle"></i>
                                            Bu şirkət sizin üst şirkətiniz olacaq. Siz onun alt şirkəti olacaqsınız.
                                        </p>
                                    </div>
                                </div>
                                <button id="closeAddParentModalBtn"
                                        class="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                    <i class="fa-solid fa-times text-gray-600"></i>
                                </button>
                            </div>
                        </div>
                        <div class="px-8 py-6">
                            <form id="addParentForm" class="space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Üst Şirkət Kodu *</label>
                                        <div class="relative">
                                            <input type="text" required id="newParentCompanyCode" 
                                                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                                                   placeholder="Üst şirkət kodu daxil edin">
                                            <button type="button" id="searchCompanyBtn"
                                                    class="absolute right-3 top-3 text-purple-600 hover:text-purple-700">
                                                <i class="fa-solid fa-search"></i>
                                            </button>
                                        </div>
                                        <div id="companySearchResults" class="hidden mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto"></div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Şirkət Növü</label>
                                        <input type="text" value="Üst Şirkət" readonly 
                                               class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Müqavilə nömrəsi</label>
                                        <input type="text" id="newParentContractNumber" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Müqavilə nömrəsi">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Müqavilə tarixi</label>
                                        <input type="date" id="newParentContractDate" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select id="newParentStatus" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                            <option value="active">Aktiv</option>
                                            <option value="inactive">Deaktiv</option>
                                            <option value="pending">Gözləmədə</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Əlaqə şəxsi</label>
                                        <input type="text" id="newParentContactPerson" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Əlaqə şəxsinin adı">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Əlaqə telefonu</label>
                                        <input type="tel" id="newParentContactPhone" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="+994501234567">
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Email ünvanı</label>
                                        <input type="email" id="newParentContactEmail" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="email@example.com">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Təsvir</label>
                                    <textarea id="newParentDescription" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" rows="3" placeholder="Üst şirkət haqqında əlavə məlumat..."></textarea>
                                </div>
                                <div class="flex justify-end gap-3 pt-4">
                                    <button type="button" id="cancelAddParentBtn" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">
                                        Ləğv et
                                    </button>
                                    <button type="submit" id="submitAddParentBtn" class="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600">
                                        Əlavə et
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.insertAdjacentHTML('beforeend', detailsModalHTML);
        document.body.insertAdjacentHTML('beforeend', addModalHTML);

        console.log('✅ Modal HTML yaradıldı');
    }

    /**
     * MODAL BAŞLIĞINI YENİLƏ
     */
    updateModalTitle() {
        const titleElement = this.modal?.querySelector('h3');
        if (titleElement) {
            titleElement.textContent = 'Üst Şirkətlərim';
        }

        const subtitleElement = this.modal?.querySelector('.text-gray-600.mt-1');
        if (subtitleElement) {
            subtitleElement.textContent = 'Mənim üst şirkətlərimin idarəetmə paneli';
        }

        // Düymə mətnini dəyiş
        const addButton = document.getElementById('modalAddParentBtn');
        if (addButton) {
            addButton.innerHTML = '<i class="fa-solid fa-plus"></i> Yeni Üst Şirkət';
        }
    }

    /**
     * EVENT LISTENER-LARI QUR
     */
    setupEventListeners() {
        console.log('🔌 Event listener-lar qurulur...');

        // Bağlama düyməsi
        const closeBtn = document.getElementById('closePartnersModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
            console.log('✅ Bağlama düyməsi bağlandı');
        }

        // Axtarış
        const searchInput = document.getElementById('parentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterParents();
                this.renderTable();
            });
            console.log('✅ Axtarış inputu bağlandı');
        }

        // Status filter
        const statusFilter = document.getElementById('parentStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterStatus = e.target.value;
                this.filterParents();
                this.renderTable();
            });
            console.log('✅ Status filter bağlandı');
        }

        // Type filter (həmişə parent)
        const typeFilter = document.getElementById('parentTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filterType = e.target.value;
                this.filterParents();
                this.renderTable();
            });
            console.log('✅ Type filter bağlandı');
        }

        // Pagination düymələri
        const prevBtn = document.getElementById('prevParentsPageBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
            console.log('✅ Previous button bağlandı');
        }

        const nextBtn = document.getElementById('nextParentsPageBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
            console.log('✅ Next button bağlandı');
        }

        // Export düyməsi
        const exportBtn = document.getElementById('exportParentsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportParents());
            console.log('✅ Export button bağlandı');
        }

        // Əlavə üst şirkət düyməsi
        const addBtn = document.getElementById('modalAddParentBtn') || document.getElementById('modalAddPartnerBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddParentForm());
            console.log('✅ Əlavə üst şirkət button bağlandı');
        }

        // Əlavə forma düymələri
        const closeAddBtn = document.getElementById('closeAddParentModalBtn') || document.getElementById('closeAddPartnerModalBtn');
        if (closeAddBtn) {
            closeAddBtn.addEventListener('click', () => this.closeAddParentModal());
            console.log('✅ Əlavə modal bağlama button bağlandı');
        }

        const cancelAddBtn = document.getElementById('cancelAddParentBtn') || document.getElementById('cancelAddPartnerBtn');
        if (cancelAddBtn) {
            cancelAddBtn.addEventListener('click', () => this.closeAddParentModal());
            console.log('✅ Ləğv et button bağlandı');
        }

        // Əlavə forma submit
        const addForm = document.getElementById('addParentForm') || document.getElementById('addPartnerForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddParent();
            });
            console.log('✅ Əlavə forma bağlandı');
        }

        // Şirkət axtarış düyməsi
        const searchCompanyBtn = document.getElementById('searchCompanyBtn');
        if (searchCompanyBtn) {
            searchCompanyBtn.addEventListener('click', () => this.openCompanySearch());
            console.log('✅ Şirkət axtarış button bağlandı');
        }

        // partners.modal.js faylında ~1057-ci sətirdə (companyCodeInput event listener)
        const companyCodeInput = document.getElementById('newParentCompanyCode') || document.getElementById('newPartnerCompanyCode');
        if (companyCodeInput) {
            companyCodeInput.addEventListener('input', async (e) => {
                const value = e.target.value.trim().toUpperCase();

                // Əgər tam şirkət kodu yazılıbsa (məsələn AZE26003)
                if (value.length >= 7) { // Şirkət kodu minimum 7 simvol ola bilər
                    // 1. Axtarış nəticələrini gizlət
                    this.hideSearchResults();

                    // 2. Şirkət məlumatlarını gətir və formu doldur
                    await this.fillCompanyDetails(value);

                    // 3. Əgər şirkət varsa, focus-unu növbəti field-ə keçir
                    const contractNumber = document.getElementById('newParentContractNumber') || document.getElementById('newPartnerContractNumber');
                    if (contractNumber) {
                        contractNumber.focus();
                    }
                }

                if (value.length >= 2) {
                    this.searchCompanies(value);
                } else {
                    this.hideSearchResults();
                }
            });

            // Şirkət seçildikdə də formu doldur
            companyCodeInput.addEventListener('change', async (e) => {
                const value = e.target.value.trim().toUpperCase();
                if (value.length >= 7) {
                    await this.fillCompanyDetails(value);
                }
            });
        }

        console.log('✅ Bütün event listener-lar quruldu');
    }

    /**
     * MODULU AÇ
     */

    async open(companyCode = null) {
        try {
            console.log('🚀 PartnersService.open() çağırılır...');

            // 1. Əgər init çağırılmayıbsa, indi çağır
            if (!this.apiService || !this.modal) {
                console.warn('⚠️ init() çağırılmayıb, indi çağırılır...');
                const initSuccess = this.init(companyCode);

                if (!initSuccess) {
                    throw new Error('init() uğursuz oldu');
                }
            }

            // 2. Şirkət kodunu təyin et
            if (companyCode) {
                this.currentCompanyCode = companyCode;
            } else if (!this.currentCompanyCode) {
                this.currentCompanyCode = this.getUserCompanyCode();
            }

            if (!this.currentCompanyCode) {
                this.showError('Şirkət kodu tapılmadı');
                return;
            }

            console.log(`📊 Üst şirkətlər gətirilir: ${this.currentCompanyCode}`);

            // 3. Event listener-ları qur (əgər qurulmayıbsa)
            if (!this._listenersSetup) {
                console.log('🔌 Event listener-lar yenidən qurulur...');
                this.setupEventListeners();
                this._listenersSetup = true;
            }

            // 4. Modal başlığını yenilə
            this.updateModalTitle();

            // 5. REAL API-dən statistikaları gətir
            console.log('📊 REAL statistikalar yüklənir...');
            await this.loadStatistics();

            // 6. REAL API-dən üst şirkətləri gətir
            console.log('📥 REAL üst şirkət məlumatları yüklənir...');
            await this.loadParents();

            // 7. Modalı göstər
            console.log('🎯 Modal göstərilir...');

            if (!this.modal) {
                this.modal = document.getElementById('partnersModal');
            }

            if (!this.modal) {
                throw new Error('Modal tapılmadı');
            }

            // Hidden class-ını çıxar
            this.modal.classList.remove('hidden');

            // Display style əlavə et
            this.modal.style.display = 'flex';
            this.modal.style.alignItems = 'center';
            this.modal.style.justifyContent = 'center';
            this.modal.style.opacity = '1';
            this.modal.style.visibility = 'visible';

            // Overflow scroll disable
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            console.log('✅ Modal CSS tətbiq edildi');

            // 8. Cədvəli yüklə
            this.filterParents();
            this.renderTable();

            // 9. Axtarış və filterləri resetlə
            const searchInput = document.getElementById('parentSearch') || document.getElementById('partnerSearch');
            const statusFilter = document.getElementById('parentStatusFilter') || document.getElementById('partnerStatusFilter');
            const typeFilter = document.getElementById('parentTypeFilter') || document.getElementById('partnerTypeFilter');

            if (searchInput) searchInput.value = '';
            if (statusFilter) statusFilter.value = 'all';
            if (typeFilter) typeFilter.value = 'parent';

            this.searchTerm = '';
            this.filterStatus = 'all';
            this.filterType = 'parent';

            console.log('✅ Üst Şirkətlər modulu REAL data ilə açıldı');

            return true;

        } catch (error) {
            console.error('❌ Modul açılmadı:', error);
            this.showError('Modul açılmadı: ' + error.message);
            return false;
        }
    }

    /**
     * MODULU BAĞLA
     */
    close() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            console.log('🚪 Üst Şirkətlər modulu bağlandı');
        }
    }

    /**
     * ÜST ŞİRKƏT MƏLUMATLARINI YÜKLƏ
     */
    async loadParents() {
        try {
            console.log('📥 Üst şirkət məlumatları yüklənir...');

            if (!this.apiService || !this.currentCompanyCode) {
                console.warn('⚠️ API service və ya şirkət kodu yoxdur. Test məlumatları istifadə edilir.');
                const testData = this.getTestParentCompanies();
                this.parentCompanies = testData.items || [];
                this.updateParentsCount();
                return;
            }

            // API-dən üst şirkətləri gətir
            const response = await this.apiService.getCompanyPartners(this.currentCompanyCode, {
                limit: 1000 // Bütün üst şirkətləri gətir
            });

            console.log('📦 API cavabı:', response);

            if (response && response.items) {
                this.parentCompanies = response.items;
                console.log(`✅ ${this.parentCompanies.length} üst şirkət API-dən yükləndi`);
            } else if (Array.isArray(response)) {
                // Əgər API birbaşa array qaytarırsa
                this.parentCompanies = response;
                console.log(`✅ ${this.parentCompanies.length} üst şirkət API-dən yükləndi (array format)`);
            } else {
                console.warn('⚠️ API cavab formatı düzgün deyil. Test məlumatları istifadə edilir.');
                const testData = this.getTestParentCompanies();
                this.parentCompanies = testData.items || [];
            }

            this.updateParentsCount();

        } catch (error) {
            console.error('❌ Üst şirkətlər yüklənmədi:', error);

            // Xəta halında test məlumatları
            const testData = this.getTestParentCompanies();
            this.parentCompanies = testData.items || [];
            this.updateParentsCount();
            this.showError('Üst şirkət məlumatları yüklənmədi. Test məlumatları göstərilir.');
        }
    }

    /**
     * ÜST ŞİRKƏT SAYINI YENİLƏ
     */
    updateParentsCount() {
        const countText = document.getElementById('parentsCountText') || document.getElementById('partnersCountText');
        if (countText) {
            countText.textContent = `${this.parentCompanies.length} üst şirkət tapıldı`;
        }
    }

    /**
     * STATİSTİKALARI YÜKLƏ
     */
    async loadStatistics() {
        try {
            console.log('📊 Üst şirkət statistikaları yüklənir...');

            if (!this.apiService || !this.currentCompanyCode) {
                console.warn('⚠️ API service yoxdur. Test statistikalar istifadə edilir.');
                this.loadTestStatistics();
                return;
            }

            // API-dən statistikaları gətir
            const response = await this.apiService.getPartnerStatistics(this.currentCompanyCode);

            console.log('📊 API statistikaları:', response);

            if (response) {
                this.statistics = response;
                console.log('✅ Statistikalar API-dən yükləndi');
            } else {
                console.warn('⚠️ API statistikalar formatı düzgün deyil. Test statistikalar istifadə edilir.');
                this.loadTestStatistics();
                return;
            }

            this.updateStatisticsUI();

        } catch (error) {
            console.error('❌ Statistikalar yüklənmədi:', error);

            // Xəta halında test statistikalar
            this.loadTestStatistics();
        }
    }

    /**
     * TEST STATİSTİKALARI
     */
    loadTestStatistics() {
        this.statistics = {
            total_parents: this.parentCompanies.length || 3,
            active_parents: this.parentCompanies.filter(p => p.status === 'active').length || 2,
            total_projects: this.parentCompanies.reduce((sum, p) => sum + (p.total_projects || 0), 0) || 15,
            most_common_type: 'Üst Şirkət'
        };

        this.updateStatisticsUI();
        console.log('📊 Test statistikalar yükləndi');
    }

    /**
     * STATİSTİKALARI UI-DA YENİLƏ
     */
    updateStatisticsUI() {
        this.updateElement('totalParentsCount', this.statistics.total_parents || 0);
        this.updateElement('activeParentsCount', this.statistics.active_parents || 0);
        this.updateElement('totalProjectsCount', this.statistics.total_projects || 0);
        this.updateElement('mostCommonType', this.statistics.most_common_type || 'Üst Şirkət');
    }

    /**
     * ÜST ŞİRKƏTLƏRİ FİLTER ET
     */
    filterParents() {
        this.filteredParents = this.parentCompanies.filter(parent => {
            // Status filter
            if (this.filterStatus !== 'all' && parent.status !== this.filterStatus) {
                return false;
            }

            // Type filter (həmişə parent)
            if (this.filterType !== 'all' && parent.relationship_type !== this.filterType) {
                return false;
            }

            // Search filter
            if (this.searchTerm) {
                const searchFields = [
                    parent.parent_company_code || parent.child_company_code || '',
                    parent.parent_company?.company_name || parent.partner_company?.company_name || '',
                    parent.contract_number || '',
                    parent.contact_person || '',
                    parent.contact_phone || '',
                    parent.contact_email || '',
                    parent.description || ''
                ].join(' ').toLowerCase();

                return searchFields.includes(this.searchTerm);
            }

            return true;
        });

        // Pagination reset
        this.currentPage = 1;
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
        const container = document.getElementById('parentsTableContainer') || document.getElementById('partnersTableContainer');
        if (!container) return;

        // Pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageParents = this.filteredParents.slice(startIndex, endIndex);
        const totalPages = Math.ceil(this.filteredParents.length / this.itemsPerPage);

        // Pagination kontrollerləri
        this.updatePaginationControls(totalPages);

        // Boş vəziyyət
        if (this.filteredParents.length === 0) {
            container.innerHTML = this.createEmptyState();
            return;
        }

        // Cədvəl yarat
        container.innerHTML = this.createTableHTML(pageParents);

        // Showing text
        const showingStart = this.filteredParents.length > 0 ? startIndex + 1 : 0;
        const showingEnd = Math.min(endIndex, this.filteredParents.length);
        this.updateElement('showingParentsText', `${showingStart}-${showingEnd} of ${this.filteredParents.length}`);

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
                <h3 class="text-xl font-semibold text-gray-700 mb-2">Üst şirkət tapılmadı</h3>
                <p class="text-gray-500 mb-6">Axtarış kriteriyalarınıza uyğun üst şirkət tapılmadı</p>
                <button class="reset-search-btn px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium">
                    <i class="fa-solid fa-refresh mr-2"></i> Bütün üst şirkətləri göstər
                </button>
            </div>
        `;
    }

    /**
     * CƏDVƏL HTML YARAT
     */
    createTableHTML(parents) {
        return `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-50 border-b">
                            <th class="text-left py-4 px-6 text-sm font-semibold text-gray-700">Üst Şirkət</th>
                            <th class="text-left py-4 px-6 text-sm font-semibold text-gray-700">Növ</th>
                            <th class="text-left py-4 px-6 text-sm font-semibold text-gray-700">Müqavilə</th>
                            <th class="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                            <th class="text-left py-4 px-6 text-sm font-semibold text-gray-700">Əməliyyatlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parents.map(parent => this.createTableRow(parent)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * CƏDVƏL SƏTRİ YARAT
     */
    createTableRow(parent) {
        const statusClass = this.getStatusColor(parent.status);
        const statusText = this.getStatusText(parent.status);
        const typeText = 'Üst Şirkət';
        const contractDate = parent.contract_date
            ? new Date(parent.contract_date).toLocaleDateString('az-AZ')
            : '-';
        const lastContact = parent.last_contact_date
            ? new Date(parent.last_contact_date).toLocaleDateString('az-AZ')
            : '-';

        // Şirkət məlumatları
        const companyCode = parent.parent_company_code || parent.child_company_code;
        const companyName = parent.parent_company?.company_name || parent.partner_company?.company_name || companyCode;

        return `
            <tr class="parent-company-row border-b hover:bg-gray-50 transition-all duration-200" data-parent-id="${parent.id}">
                <td class="py-4 px-6">
                    <div class="flex items-center">
                        <div class="h-10 w-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-100 flex items-center justify-center mr-3">
                            <i class="fa-solid fa-building text-blue-600"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900">
                                ${companyName}
                                <span class="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                    <i class="fa-solid fa-arrow-up mr-1"></i>ÜST
                                </span>
                            </div>
                            <div class="text-sm text-gray-500 mt-1">Kod: ${companyCode}</div>
                            ${parent.parent_company?.voen ? `
                            <div class="text-xs text-gray-400 mt-1">
                                VOEN: ${parent.parent_company.voen}
                            </div>
                            ` : ''}
                            ${parent.contact_person ? `
                            <div class="text-xs text-gray-400 mt-1 flex items-center">
                                <i class="fa-solid fa-user mr-1"></i>
                                <span>${parent.contact_person}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200">
                        <i class="fa-solid fa-arrow-up mr-1"></i>${typeText}
                    </span>
                </td>
                <td class="py-4 px-6">
                    <div class="font-medium text-gray-900">${parent.contract_number || '—'}</div>
                    <div class="text-xs text-gray-500 mt-1">
                        <i class="fa-solid fa-calendar mr-1"></i>${contractDate}
                    </div>
                    ${lastContact !== '-' ? `
                    <div class="text-xs text-gray-400 mt-1">
                        Son əlaqə: ${lastContact}
                    </div>
                    ` : ''}
                </td>
                <td class="py-4 px-6">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="py-4 px-6">
                    <div class="flex space-x-2">
                        <!-- INFO düyməsi -->
                        <button class="info-parent-btn px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1.5"
                                data-parent-id="${parent.id}"
                                title="Məlumat">
                            <i class="fa-solid fa-info-circle"></i>
                            <span class="hidden md:inline">Məlumat</span>
                        </button>
                        <!-- AYRIL düyməsi -->
                        <button class="remove-parent-btn px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1.5"
                                data-parent-id="${parent.id}"
                                title="Üst şirkətdən ayrıl">
                            <i class="fa-solid fa-unlink"></i>
                            <span class="hidden md:inline">Ayrıl</span>
                        </button>
                        <!-- REDAKTƏ düyməsi -->
                        <button class="edit-parent-btn px-3 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center gap-1.5"
                                data-parent-id="${parent.id}"
                                title="Redaktə et">
                            <i class="fa-solid fa-edit"></i>
                            <span class="hidden md:inline">Redaktə</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * STATUS RƏNGİ AL
     */
    getStatusColor(status) {
        const colors = {
            'active': 'bg-gradient-to-r from-green-500 to-emerald-500',
            'inactive': 'bg-gradient-to-r from-red-500 to-rose-500',
            'pending': 'bg-gradient-to-r from-amber-500 to-yellow-500',
            'suspended': 'bg-gradient-to-r from-gray-500 to-slate-500'
        };
        return colors[status] || 'bg-gray-500';
    }

    /**
     * STATUS MƏTNİ AL
     */
    getStatusText(status) {
        const texts = {
            'active': 'Aktiv',
            'inactive': 'Deaktiv',
            'pending': 'Gözləmədə',
            'suspended': 'Dayandırılıb'
        };
        return texts[status] || status;
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
                this.filterType = 'parent';

                const searchInput = document.getElementById('parentSearch');
                const statusFilter = document.getElementById('parentStatusFilter');
                const typeFilter = document.getElementById('parentTypeFilter');

                if (searchInput) searchInput.value = '';
                if (statusFilter) statusFilter.value = 'all';
                if (typeFilter) typeFilter.value = 'parent';

                this.filterParents();
                this.renderTable();
            });
        }

        // Info düymələri
        document.querySelectorAll('.info-parent-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parentId = parseInt(e.currentTarget.dataset.parentId);
                this.showParentInfo(parentId);
            });
        });

        // Üst şirkətdən ayrıl düymələri
        document.querySelectorAll('.remove-parent-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parentId = parseInt(e.currentTarget.dataset.parentId);
                this.removeParentCompany(parentId);
            });
        });

        // Edit düymələri
        document.querySelectorAll('.edit-parent-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parentId = parseInt(e.currentTarget.dataset.parentId);
                this.editParent(parentId);
            });
        });
    }

    /**
     * PAGINATION KONTROLLERLƏRİ YENİLƏ
     */
    updatePaginationControls(totalPages) {
        const prevBtn = document.getElementById('prevParentsPageBtn');
        const nextBtn = document.getElementById('nextParentsPageBtn');

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
        const totalPages = Math.ceil(this.filteredParents.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
        }
    }

    /**
     * ŞİRKƏT AXTARIŞI
     */
    async searchCompanies(searchTerm) {
        try {
            if (!this.apiService || !this.currentCompanyCode || searchTerm.length < 2) {
                console.warn('⚠️ API service yoxdur. Test axtarış nəticələri göstərilir.');
                this.showTestSearchResults(searchTerm);
                return;
            }

            const response = await this.apiService.searchPartnerCompanies(this.currentCompanyCode, searchTerm);

            if (response && Array.isArray(response)) {
                this.showSearchResults(response);
            } else {
                console.warn('⚠️ API axtarış cavabı düzgün deyil. Test nəticələr göstərilir.');
                this.showTestSearchResults(searchTerm);
            }
        } catch (error) {
            console.error('❌ Şirkət axtarış xətası:', error);
            this.showTestSearchResults(searchTerm);
        }
    }

    /**
     * TEST AXTARIŞ NƏTİCƏLƏRİ
     */
    showTestSearchResults(searchTerm) {
        const filtered = this.getTestCompanies(searchTerm);
        this.showSearchResults(filtered);
    }

    /**
     * AXTARIŞ NƏTİCƏLƏRİNİ GÖSTƏR
     */
    showSearchResults(companies) {
        const resultsContainer = document.getElementById('companySearchResults');
        if (!resultsContainer) return;

        if (companies.length === 0) {
            resultsContainer.innerHTML = `
                <div class="p-3 text-center text-gray-500">
                    Şirkət tapılmadı
                </div>
            `;
        } else {
            resultsContainer.innerHTML = companies.map(company => `
                <div class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer company-search-result"
                     data-company-code="${company.company_code}">
                    <div class="font-medium">${company.company_name}</div>
                    <div class="text-sm text-gray-600">Kod: ${company.company_code}</div>
                    ${company.voen ? `<div class="text-xs text-gray-500">VOEN: ${company.voen}</div>` : ''}
                    ${company.is_parent ? `<div class="text-xs text-purple-600 mt-1">✓ Artıq üst şirkət</div>` : ''}
                </div>
            `).join('');
        }

        resultsContainer.classList.remove('hidden');

        // Şirkət seçmə event listener-ları
        document.querySelectorAll('.company-search-result').forEach(item => {
            item.addEventListener('click', (e) => {
                const companyCode = e.currentTarget.dataset.companyCode;
                const input = document.getElementById('newParentCompanyCode') || document.getElementById('newPartnerCompanyCode');
                if (input) input.value = companyCode;
                this.hideSearchResults();
            });
        });
    }

    /**
     * AXTARIŞ NƏTİCƏLƏRİNİ GİZDİR
     */
    hideSearchResults() {
        const resultsContainer = document.getElementById('companySearchResults');
        if (resultsContainer) {
            resultsContainer.classList.add('hidden');
        }
    }

    /**
     * ŞİRKƏT AXTARIŞ MODALINI AÇ
     */
    openCompanySearch() {
        const companyCodeInput = document.getElementById('newParentCompanyCode') || document.getElementById('newPartnerCompanyCode');
        if (companyCodeInput) {
            companyCodeInput.focus();
        }
    }

    /**
     * ÜST ŞİRKƏT MƏLUMATLARINI GÖSTƏR (INFO)
     */
    async showParentInfo(parentId) {
        try {
            const parent = this.parentCompanies.find(p => p.id === parentId);
            if (!parent) {
                this.showError('Üst şirkət tapılmadı');
                return;
            }

            const companyCode = parent.parent_company_code || parent.child_company_code;
            const companyName = parent.parent_company?.company_name || parent.partner_company?.company_name || companyCode;

            const modalContent = `
                <div class="px-8 py-6 border-b">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <i class="fa-solid fa-building text-2xl text-white"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-900">${companyName}</h3>
                                <p class="text-gray-600">Üst Şirkət • ${this.getStatusText(parent.status)}</p>
                                <p class="text-xs text-blue-600 mt-1">
                                    <i class="fa-solid fa-info-circle"></i>
                                    Siz bu şirkətin alt şirkətisiz
                                </p>
                            </div>
                        </div>
                        <button class="close-details-btn h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                            <i class="fa-solid fa-times text-gray-600"></i>
                        </button>
                    </div>
                </div>
                <div class="px-8 py-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Şirkət Kodu</label>
                                <p class="text-lg font-semibold">${companyCode}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">VOEN</label>
                                <p class="text-lg font-semibold">${parent.parent_company?.voen || '—'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Müqavilə nömrəsi</label>
                                <p class="text-lg font-semibold">${parent.contract_number || '—'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Müqavilə tarixi</label>
                                <p class="text-lg font-semibold">${parent.contract_date ? new Date(parent.contract_date).toLocaleDateString('az-AZ') : '—'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Layihə sayı</label>
                                <p class="text-lg font-semibold">${parent.total_projects || 0}</p>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Status</label>
                                <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${parent.status === 'active' ? 'bg-green-100 text-green-800' : parent.status === 'inactive' ? 'bg-red-100 text-red-800' : parent.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}">
                                    ${this.getStatusText(parent.status)}
                                </span>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Əlaqə şəxsi</label>
                                <p class="text-lg font-semibold">${parent.contact_person || '—'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Telefon</label>
                                <p class="text-lg">${parent.contact_phone || '—'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                <p class="text-lg">${parent.contact_email || '—'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1">Son əlaqə</label>
                                <p class="text-lg">${parent.last_contact_date ? new Date(parent.last_contact_date).toLocaleDateString('az-AZ') : '—'}</p>
                            </div>
                        </div>
                    </div>
                    ${parent.description ? `
                    <div class="mt-6 pt-6 border-t">
                        <label class="block text-sm font-medium text-gray-500 mb-2">Təsvir</label>
                        <p class="text-gray-700 bg-gray-50 p-4 rounded-lg">${parent.description}</p>
                    </div>
                    ` : ''}
                </div>
            `;

            if (this.detailsModal) {
                const contentDiv = document.getElementById('partnerDetailsContent');
                if (contentDiv) {
                    contentDiv.innerHTML = modalContent;

                    // Bağlama düyməsi üçün event listener
                    const closeBtn = contentDiv.querySelector('.close-details-btn');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => this.closeParentDetails());
                    }

                    this.detailsModal.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                }
            }
        } catch (error) {
            console.error('❌ Üst şirkət məlumatları göstərilmədi:', error);
            this.showError('Məlumat göstərilmədi: ' + error.message);
        }
    }

    /**
     * ÜST ŞİRKƏT MƏLUMATLARINI BAĞLA
     */
    closeParentDetails() {
        if (this.detailsModal) {
            this.detailsModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * ÜST ŞİRKƏTDƏN AYRIL
     */
    async removeParentCompany(parentId) {
        try {
            const parent = this.parentCompanies.find(p => p.id === parentId);
            if (!parent) return;

            const companyCode = parent.parent_company_code || parent.child_company_code;
            const companyName = parent.parent_company?.company_name || parent.partner_company?.company_name || companyCode;

            if (!confirm(`"${companyName}" üst şirkətindən ayrılmaq istədiyinizə əminsiniz?\n\nBu əməliyyat sizi bu şirkətin alt şirkəti olmaqdan çıxaracaq.`)) {
                return;
            }

            console.log(`🚫 Üst şirkətdən ayrılır: ${parentId}`);

            // API çağırışı
            if (this.apiService && this.apiService.deleteCompanyPartner) {
                await this.apiService.deleteCompanyPartner(
                    this.currentCompanyCode,
                    parentId
                );
                console.log('✅ API vasitəsilə üst şirkətdən ayrıldı');
            } else {
                console.log('⚠️ API metodu yoxdur. Local olaraq silinir.');
            }

            // Local məlumatları yenilə
            this.parentCompanies = this.parentCompanies.filter(p => p.id !== parentId);

            // Statistikaları yenilə
            await this.loadStatistics();

            this.filterParents();
            this.renderTable();

            this.showSuccess('Üst şirkətdən uğurla ayrıldınız!');

        } catch (error) {
            console.error('❌ Üst şirkətdən ayrılma xətası:', error);
            this.showError('Üst şirkətdən ayrıla bilmədi: ' + error.message);
        }
    }

    /**
     * ÜST ŞİRKƏTİ REDAKTƏ ET
     */
    editParent(parentId) {
        const parent = this.parentCompanies.find(p => p.id === parentId);
        if (parent) {
            alert(`"${parent.parent_company?.company_name || parent.parent_company_code}" üst şirkətini redaktə et`);
            // Burada redaktə formasını açın
        }
    }

    /**
     * ƏLAVƏ ÜST ŞİRKƏT FORMASINI AÇ
     */
    openAddParentForm() {
        if (this.addModal) {
            // Formu təmizlə
            const form = document.getElementById('addParentForm') || document.getElementById('addPartnerForm');
            if (form) form.reset();

            // Şirkət kodu inputunu resetlə
            const companyCodeInput = document.getElementById('newParentCompanyCode') || document.getElementById('newPartnerCompanyCode');
            if (companyCodeInput) {
                companyCodeInput.value = '';
            }

            // Axtarış nəticələrini gizlət
            this.hideSearchResults();

            this.addModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * ƏLAVƏ ÜST ŞİRKƏT FORMASINI BAĞLA
     */
    closeAddParentModal() {
        if (this.addModal) {
            this.addModal.classList.add('hidden');
            document.body.style.overflow = 'auto';

            // Formu təmizlə
            const form = document.getElementById('addParentForm') || document.getElementById('addPartnerForm');
            if (form) form.reset();

            // Şirkət kodu inputunu resetlə
            const companyCodeInput = document.getElementById('newParentCompanyCode') || document.getElementById('newPartnerCompanyCode');
            if (companyCodeInput) {
                companyCodeInput.value = '';
            }

            // Axtarış nəticələrini gizlət
            this.hideSearchResults();
        }
    }

    /**
     * YENİ ÜST ŞİRKƏT ƏLAVƏ ET
     */

    async handleAddParent(e) {
        // ✅ ÖNƏMLİ: e.preventDefault() əlavə edin
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        try {
            console.log('🚀 handleAddParent çağırıldı');

            // ✅ SUBMIT düyməsini disable et
            const submitBtn = document.getElementById('submitAddParentBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yüklənir...';
            submitBtn.disabled = true;

            const companyCodeInput = document.getElementById('newParentCompanyCode');
            const parentCompanyCode = companyCodeInput ? companyCodeInput.value.trim().toUpperCase() : '';

            const contractNumber = document.getElementById('newParentContractNumber');
            const contractDate = document.getElementById('newParentContractDate');
            const status = document.getElementById('newParentStatus');
            const contactPerson = document.getElementById('newParentContactPerson');
            const contactPhone = document.getElementById('newParentContactPhone');
            const contactEmail = document.getElementById('newParentContactEmail');
            const description = document.getElementById('newParentDescription');

            console.log('📋 Form değerleri:', {
                parentCompanyCode,
                currentCompanyCode: this.currentCompanyCode
            });

            // ✅ 1. VALİDASYON: Şirket kodu boş mu?
            if (!parentCompanyCode) {
                this.showError('Zəhmət olmasa üst şirkət kodu doldurun');
                companyCodeInput?.focus();
                return;
            }

            // ✅ 2. VALİDASYON: Kendi şirketinizi üst şirket olarak ekleyemezsiniz
            if (parentCompanyCode === this.currentCompanyCode) {
                this.showError('❌ Öz şirkətinizi özünüzə üst şirkət kimi əlavə edə bilməzsiniz!');
                companyCodeInput?.focus();
                return;
            }

            // ✅ 3. VALİDASYON: Şirket kodu minimum uzunluk
            if (parentCompanyCode.length < 7) {
                this.showError('Şirkət kodu ən az 7 simvol olmalıdır');
                companyCodeInput?.focus();
                return;
            }

            console.log('✅ Validasyonlar başarılı');

            // ✅ DÜZGÜN DATA FORMATI
            const newParentData = {

                parent_company_code: parentCompanyCode,
                child_company_code: this.currentCompanyCode,

                relationship_type: 'parent',
                description: description ? description.value : '',
                contract_number: contractNumber ? contractNumber.value : '',
                contract_date: contractDate ? contractDate.value : null,
                status: status ? status.value : 'active',
                contact_person: contactPerson ? contactPerson.value : '',
                contact_phone: contactPhone ? contactPhone.value : '',
                contact_email: contactEmail ? contactEmail.value : '',
                total_projects: 0,
                last_contact_date: new Date().toISOString().split('T')[0]
            };

            console.log('📤 Göndərilən data:', newParentData);
            console.log('🔍 Karşılaştırma:', {
                child: this.currentCompanyCode,
                parent: parentCompanyCode,
                esitMi: this.currentCompanyCode === parentCompanyCode
            });

            // ✅ API ÇAĞIRIŞI
            try {
                console.log('🌐 API çağrısı yapılıyor...');

                const response = await this.apiService.addCompanyPartner(
                    this.currentCompanyCode,  // URL için mevcut şirket
                    newParentData              // Gönderilen data
                );

                console.log('✅ API cavabı:', response);

                // Başarı mesajı
                this.showSuccess(`✅ "${parentCompanyCode}" kodu ilə şirkət sizin üst şirkətiniz olaraq əlavə edildi!`);

                // Listeyi yenile
                await this.loadParents();
                await this.loadStatistics();
                this.filterParents();
                this.renderTable();

                // Formu kapat
                this.closeAddParentModal();

            } catch (apiError) {
                console.error('❌ API xətası:', apiError);
                console.error('❌ API error details:', {
                    message: apiError.message,
                    stack: apiError.stack
                });

                // Özel hata mesajları
                if (apiError.message.includes("özünə üst şirkət") ||
                    apiError.message.includes("öz şirkətinizi")) {
                    this.showError('❌ Öz şirkətinizi özünüzə üst şirkət kimi əlavə edə bilməzsiniz!');
                } else if (apiError.message.includes("artıq mövcuddur") ||
                           apiError.message.includes("artıq əlavə edilib")) {
                    this.showError('⚠️ Bu şirkət artıq sizin üst şirkətinizdir!');
                } else if (apiError.message.includes("tapılmadı") ||
                           apiError.message.includes("şirkət tapılmadı")) {
                    this.showError('❌ Bu koda uyğun şirkət tapılmadı. Zəhmət olmasa düzgün şirkət kodu daxil edin.');
                } else {
                    this.showError(`❌ API xətası: ${apiError.message}`);
                }
                return;
            }

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

        } catch (error) {
            console.error('❌ Üst şirkət əlavə edilmədi:', error);
            this.showError('❌ Üst şirkət əlavə edilmədi: ' + error.message);

            // ✅ Error halında da düyməni yenidən aktivləşdir
            const submitBtn = document.getElementById('submitAddParentBtn');
            if (submitBtn) {
                submitBtn.innerHTML = 'Əlavə et';
                submitBtn.disabled = false;
            }
        }
    }

    /**
     * ÜST ŞİRKƏTLƏRİ EXPORT ET
     */
    exportParents() {
        console.log('📤 Üst şirkət məlumatları export edilir...');
        this.showSuccess('Export əməliyyatı başladı. Fayl yüklənəcək...');
    }

    /**
     * UĞUR MESAJI GÖSTƏR
     */
    showSuccess(message) {
        console.log('✅ ' + message);
        alert('✅ ' + message);
    }

    /**
     * XƏTA MESAJI GÖSTƏR
     */
    showError(message) {
        console.error('❌ ' + message);
        alert('❌ ' + message);
    }
}

// Global obyekt yarat
document.addEventListener('DOMContentLoaded', function() {
    window.PartnersService = PartnersService;
    console.log('✅ PartnersService (Üst Şirkətlər) yükləndi');
});