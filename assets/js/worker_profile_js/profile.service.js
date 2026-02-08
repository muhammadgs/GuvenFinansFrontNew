/**
 * Profile Service - Yenilənmiş versiya
 */

class ProfileService {
    constructor(apiService, authService, uiService = null) {  // ← uiService parametri var
        this.api = apiService;
        this.auth = authService;
        this.ui = uiService;  // ← Amma siz göndərmirsiniz
    }

    // Əlavə setUI metodu (əgər lazımdırsa)
    setUI(uiService) {
        this.ui = uiService;
        console.log('✅ ProfileService UI referansı təyin edildi');
    }

    // Profil məlumatlarını yükləmək
    async loadProfile() {
        console.log('📋 Profil məlumatları yüklənir...');

        try {
            const userId = this.auth.getUserId();
            if (!userId) {
                throw new Error('User ID tapılmadı');
            }

            // 1. Birbaşa API-dən user məlumatlarını gətir
            const userData = await this.api.get(`/users/${userId}`);
            console.log('📥 User data received:', userData);

            if (!userData) {
                throw new Error('İstifadəçi məlumatları alına bilmədi');
            }

            // 2. ƏGƞƏR USERDATA-DA company_name YOXDURSA, şirkət məlumatlarını ayrıca gətir
            if (!userData.company_name && userData.company_id) {
                console.log('🏢 Şirkət adı tapılmadı, ayrıca gətirilir...');
                try {
                    const companyData = await this.api.get(`/companies/${userData.company_id}`);
                    if (companyData && companyData.company_name) {
                        userData.company_name = companyData.company_name;
                        console.log('✅ Şirkət adı gətirildi:', companyData.company_name);
                    }
                } catch (companyError) {
                    console.warn('⚠️ Şirkət məlumatları gətirilmədi:', companyError);
                }
            }

            // ✅ ƏSAS DÜZƏLİŞ: RAW məlumatları da saxla
            const formattedData = this.formatProfileData(userData);

            const result = {
                ...formattedData,
                // Original məlumatları da əlavə et
                originalData: userData
            };

            console.log('📝 Formatted result:', {
                firstName: result.firstName,
                lastName: result.lastName,
                company_name: result.company_name,
                hasCompanyName: !!result.company_name
            });

            // Əgər UI varsa, formu doldur
            if (this.ui && this.ui.populateForm) {
                // Əvvəlcə input-u yoxla
                if (this.ui.checkCompanyNameInput) {
                    this.ui.checkCompanyNameInput();
                }

                // Sonra formu doldur
                this.ui.populateForm(result);

                // Debug
                if (this.ui.debugFormInputs) {
                    setTimeout(() => this.ui.debugFormInputs(), 500);
                }
            }

            return result;
        } catch (error) {
            console.error('❌ Profil yükləmə xətası:', error);
            throw error;
        }
    }

    // Profil məlumatlarını formatlamaq - DÜZƏLDİLMİŞ
    formatProfileData(userData) {
        console.log('🔧 Formatting profile data (FULL):', userData);

        // ✅ ƏSAS DÜZƏLİŞ: Həm ceo_name/ceo_lastname, həm də firstName/lastName saxla
        return {
            // Şəxsi məlumatlar - İKİ FORMATDA
            firstName: userData.ceo_name || userData.first_name || userData.name || '',
            lastName: userData.ceo_lastname || userData.last_name || userData.surname || '',
            // ✅ RAW məlumatları da saxla
            ceo_name: userData.ceo_name || '',
            ceo_lastname: userData.ceo_lastname || '',

            fatherName: userData.father_name || '',
            gender: userData.gender || '',
            birthDate: userData.birth_date ? this.formatDate(userData.birth_date) : '',
            voen: userData.voen || '',

            // ASAN məlumatları
            asanImza: userData.asan_imza || userData.asan_imza_number || '',
            asanId: userData.asan_id || '',
            pin1: userData.pin1 || '',
            pin2: userData.pin2 || '',
            puk: userData.puk || '',
            finCode: userData.fin_code || '',

            // Əlaqə məlumatları
            email: userData.ceo_email || userData.email || '',
            phone: userData.ceo_phone || userData.phone || '',
            companyCode: userData.company_code || '',
            // ✅ Şirkət adını da əlavə et
            company_name: userData.company_name || '',

            // Telegram
            telegramUsername: userData.telegram_username || '',

            // Statuslar
            emailVerified: userData.email_verified || false,
            phoneVerified: userData.phone_verified || false,
            telegramVerified: userData.is_telegram_verified || false,
            isActive: userData.is_active !== false,

            // Position
            position: userData.position || '',

            // ID'lər
            id: userData.id,
            companyId: userData.company_id,

            // ✅ Bütün orijinal məlumatları saxla
            originalData: userData
        };
    }

    // Profil məlumatlarını yeniləmək - DÜZƏLDİLMİŞ
    async updateProfile(profileData) {
        console.log('💾 Profil yenilənir...');
        console.log('📤 Update data:', profileData);

        // Database field adları ilə göndər
        const updateData = {
            ceo_name: profileData.firstName || '',
            ceo_lastname: profileData.lastName || '',
            father_name: profileData.fatherName || '',
            gender: profileData.gender || null,
            birth_date: profileData.birthDate ? this.parseDate(profileData.birthDate) : null,
            voen: profileData.voen || '',
            asan_imza_number: profileData.asanImza || '',
            asan_id: profileData.asanId || '',
            pin1: profileData.pin1 || '',
            pin2: profileData.pin2 || '',
            puk: profileData.puk || '',
            fin_code: profileData.finCode || '',
            ceo_email: profileData.email || '',
            ceo_phone: profileData.phone || '',
            telegram_username: profileData.telegramUsername || '',
        };

        // Şifrə (əgər varsa)
        if (profileData.password && profileData.password.trim() !== '') {
            updateData.ceo_password = profileData.password;
        }

        const userId = this.auth.getUserId();
        if (!userId) {
            throw new Error('User ID tapılmadı');
        }

        console.log('📤 Sending to API:', updateData);

        try {
            // PATCH istifadə et
            const response = await this.api.patch(`/users/${userId}`, updateData);
            console.log('✅ API Response:', response);

            if (!response) {
                throw new Error('API cavabı alınmadı');
            }

            // ✅ ƏSAS DÜZƏLİŞ: Formu yenidən yüklə
            console.log('🔄 Form yenidən yüklənir...');
            await this.loadProfile();

            // ✅ ƏSAS DÜZƏLİŞ: Auth-da user məlumatlarını yenilə
            if (this.auth.currentUser) {
                this.auth.currentUser = {
                    ...this.auth.currentUser,
                    ceo_name: updateData.ceo_name,
                    ceo_lastname: updateData.ceo_lastname,
                    ceo_email: updateData.ceo_email,
                    ceo_phone: updateData.ceo_phone
                };
                localStorage.setItem('userData', JSON.stringify(this.auth.currentUser));
            }

            console.log('✅ Profil tam yeniləndi və form dolduruldu');
            return response;

        } catch (error) {
            console.error('❌ Profil yeniləmə xətası:', error);
            throw error;
        }
    }

    // Profil məlumatlarını formatlamaq
    formatProfileData(userData) {
        console.log('🔧 Formatting profile data:', userData);

        return {
            // Şəxsi məlumatlar
            firstName: userData.ceo_name || userData.first_name || userData.name || '',
            lastName: userData.ceo_lastname || userData.last_name || userData.surname || '',
            fatherName: userData.father_name || '',

            gender: userData.gender || '',
            birthDate: userData.birth_date ? this.formatDate(userData.birth_date) : '',
            voen: userData.voen || '',

            // ASAN məlumatları
            asanImza: userData.asan_imza || userData.asan_imza_number || '',
            asanId: userData.asan_id || '',
            pin1: userData.pin1 || '',
            pin2: userData.pin2 || '',
            puk: userData.puk || '',
            finCode: userData.fin_code || '',

            // Əlaqə məlumatları
            email: userData.ceo_email || userData.email || '',
            phone: userData.ceo_phone || userData.phone || '',
            companyCode: userData.company_code || '',

            // Telegram
            telegramUsername: userData.telegram_username || '',

            // Statuslar
            emailVerified: userData.email_verified || false,
            phoneVerified: userData.phone_verified || false,
            telegramVerified: userData.is_telegram_verified || false,
            isActive: userData.is_active !== false,

            // Position
            position: userData.position || '',

            // ID'lər
            id: userData.id,
            companyId: userData.company_id
        };
    }

    // Local şəkilləri yüklə
    loadLocalImages() {
        try {
            return {
                profileImage: localStorage.getItem('profileImage'),
                companyLogo: localStorage.getItem('companyLogo')
            };
        } catch (error) {
            console.error('❌ Local images error:', error);
            return { profileImage: null, companyLogo: null };
        }
    }

    // Tarix formatları
    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch (e) {
            console.warn('⚠️ Date format error:', dateString, e);
            return '';
        }
    }

    parseDate(dateString) {
        if (!dateString) return null;
        try {
            return new Date(dateString).toISOString();
        } catch (e) {
            console.warn('⚠️ Date parse error:', dateString, e);
            return null;
        }
    }

    // Form validasiyası
    validateProfileData(data) {
        const errors = [];

        if (!data.email?.trim()) errors.push('Email tələb olunur');
        if (!data.phone?.trim()) errors.push('Telefon tələb olunur');

        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Düzgün email ünvanı daxil edin');
        }

        if (data.phone && !this.isValidPhone(data.phone)) {
            errors.push('Düzgün telefon nömrəsi daxil edin (+994XXXXXXXXX)');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^\+994\d{9}$/;
        return phoneRegex.test(phone);
    }
}

window.ProfileService = ProfileService;