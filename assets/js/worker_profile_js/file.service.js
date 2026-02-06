/**
 * File Service - Şəkil yükləmə üçün
 */

class FileService {
    constructor(apiService) {
        this.api = apiService;
    }

    async uploadImage(file, type = 'profile') {
        console.log(`🖼️ ${type} şəkli yüklənir: ${file.name}`);

        try {
            // Əvvəlcə token-i test et
            console.log('🔍 Token test edilir...');
            const tokenTest = await this.api.testToken();
            console.log('🔑 Token test result:', tokenTest);

            if (!tokenTest.valid) {
                console.warn('⚠️ Token invalid, local storage istifadə olunacaq');
                throw new Error('Token invalid');
            }

            // Category təyin et
            const category = type === 'profile' ? 'USER_PROFILE' : 'COMPANY_LOGO';

            // Simple upload istifadə et
            const response = await this.api.simpleUpload(file, category);

            console.log('✅ Şəkil backend-ə yükləndi:', response);

            // Local storage-da da saxla (preview üçün)
            this.saveImageLocally(file, type);

            return {
                success: true,
                ...response
            };

        } catch (error) {
            console.error('❌ Şəkil yükləmə xətası:', error);

            // Local fallback
            console.log('🔄 Local storage fallback istifadə olunur');
            this.saveImageLocally(file, type);

            return {
                success: true,
                url: 'local',
                filename: file.name,
                size: file.size,
                message: 'Şəkil frontend-də saxlandı',
                uploaded_locally: true
            };
        }
    }

    saveImageLocally(file, type) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const key = type === 'profile' ? 'profileImage' : 'companyLogo';
            localStorage.setItem(key, e.target.result);

            // Şəkli dərhal göstər
            this.displayImage(e.target.result, type);

            console.log(`✅ Şəkil ${key} olaraq saxlandı`);
        };
        reader.readAsDataURL(file);
    }

    displayImage(imageData, type) {
        const container = type === 'profile'
            ? document.querySelector('#profileImageUpload .h-20.w-20')
            : document.querySelector('#companyImageUpload .h-20.w-20');

        if (!container) {
            console.warn('❌ Image container tapılmadı');
            return;
        }

        const img = document.createElement('img');
        img.src = imageData;
        img.className = 'w-full h-full object-cover';
        img.alt = type === 'profile' ? 'Profil şəkli' : 'Şirkət loqosu';

        if (type === 'profile') {
            img.classList.add('rounded-full');
        } else {
            img.classList.add('rounded-xl');
        }

        container.innerHTML = '';
        container.appendChild(img);
    }
    // Local şəkilləri yüklə
    loadLocalImages() {
        const profileImage = localStorage.getItem('profileImage');
        const companyLogo = localStorage.getItem('companyLogo');

        if (profileImage) {
            this.displayImage(profileImage, 'profile');
        }

        if (companyLogo) {
            this.displayImage(companyLogo, 'company');
        }

        return { profileImage, companyLogo };
    }

    // Profil şəklini backend-də yenilə
    async updateProfileImageInBackend(fileUrl) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) return;

            const response = await this.api.patch(`/users/${userId}`, {
                profile_image_url: fileUrl
            });

            console.log('✅ Profil şəkli backend-də yeniləndi');
            return response;
        } catch (error) {
            console.error('❌ Profil şəkli yeniləmə xətası:', error);
        }
    }

    // Current user ID almaq
    getCurrentUserId() {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.id;
            } catch (e) {
                console.error('Parse error:', e);
            }
        }
        return null;
    }
}

window.FileService = FileService;