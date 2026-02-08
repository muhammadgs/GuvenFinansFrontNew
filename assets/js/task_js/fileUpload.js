// FileUploadManager.js faylını aşağıdakı kimi düzəldin:

class FileUploadManager {
    constructor() {
        console.log('✅ FileUploadManager yaradılır...');

        this.files = [];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4', 'video/avi', 'video/quicktime',
            'audio/mpeg', 'audio/wav', 'audio/ogg',
            'application/zip', 'application/x-rar-compressed'
        ];

        // DOM elementləri
        this.dropzone = null;
        this.fileInput = null;
        this.fileList = null;
        this.uploadButton = null;

        // Notification service
        this.notificationService = null;

        // ✅ ƏSAS FİKS: initialize funksiyasını constructor-da çağır
        this.initNotificationService();
        this.initialize();

        console.log('✅ FileUploadManager hazırdır');
    }

    // ✅ Initialize funksiyasını əlavə edin
    initialize() {
        console.log('🔄 FileUploadManager initialize edilir...');

        try {
            // DOM elementləri tap
            this.dropzone = document.getElementById('fileDropzone');
            this.fileInput = document.getElementById('fileInput');
            this.fileList = document.getElementById('fileList');
            this.uploadButton = document.getElementById('uploadFilesBtn');

            // Event listener-lar əlavə et
            this.setupEventListeners();

            // Fayl siyahısını yenilə
            this.updateFileList();

            console.log('✅ FileUploadManager initialize tamamlandı');

        } catch (error) {
            console.error('❌ FileUploadManager initialize xətası:', error);
        }
    }

    setupEventListeners() {
        console.log('🔌 FileUploadManager event listener-lar qurulur...');

        // Əgər elementlər varsa
        if (this.dropzone) {
            this.dropzone.addEventListener('click', () => {
                if (this.fileInput) {
                    this.fileInput.click();
                }
            });

            this.dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.dropzone.classList.add('dragover');
            });

            this.dropzone.addEventListener('dragleave', () => {
                this.dropzone.classList.remove('dragover');
            });

            this.dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                this.dropzone.classList.remove('dragover');

                if (e.dataTransfer.files.length) {
                    this.handleFiles(e.dataTransfer.files);
                }
            });
        }

        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    this.handleFiles(e.target.files);
                }
            });
        }

        console.log('✅ Event listener-lar quruldu');
    }

    initNotificationService() {
        // Əvvəlcə window.notificationService yoxla
        if (window.notificationService && typeof window.notificationService.showSuccess === 'function') {
            this.notificationService = window.notificationService;
            console.log('✅ FileUploadManager: notificationService tapıldı');
        }
        // Əgər yoxdursa, fallback yarat
        else {
            console.log('⚠️ FileUploadManager: notificationService tapılmadı, fallback yaradılır...');
            this.notificationService = {
                showSuccess: function(msg) {
                    console.log('✅ [FileUpload] Success:', msg);
                    if (window.showNotification) {
                        window.showNotification('success', msg);
                    } else if (window.showSuccessMessage) {
                        window.showSuccessMessage(msg);
                    } else {
                        alert('✅ ' + msg);
                    }
                },
                showError: function(msg) {
                    console.log('❌ [FileUpload] Error:', msg);
                    if (window.showNotification) {
                        window.showNotification('error', msg);
                    } else if (window.showErrorMessage) {
                        window.showErrorMessage(msg);
                    } else {
                        alert('❌ ' + msg);
                    }
                },
                showInfo: function(msg) {
                    console.log('ℹ️ [FileUpload] Info:', msg);
                    if (window.showNotification) {
                        window.showNotification('info', msg);
                    } else {
                        alert('ℹ️ ' + msg);
                    }
                },
                showWarning: function(msg) {
                    console.log('⚠️ [FileUpload] Warning:', msg);
                    if (window.showNotification) {
                        window.showNotification('warning', msg);
                    } else {
                        alert('⚠️ ' + msg);
                    }
                }
            };
            console.log('✅ FileUploadManager: fallback notificationService yaradıldı');
        }
    }

    // showNotification funksiyası
    showNotification(type, message) {
        console.log(`📢 FileUploadManager.showNotification: ${type} - ${message}`);

        if (!this.notificationService) {
            this.initNotificationService();
        }

        // Global showNotification varsa, onu istifadə et
        if (window.showNotification && typeof window.showNotification === 'function') {
            window.showNotification(type, message);
            return;
        }

        // notificationService ilə davam et
        if (this.notificationService) {
            switch(type.toLowerCase()) {
                case 'success':
                    this.notificationService.showSuccess(message);
                    break;
                case 'error':
                    this.notificationService.showError(message);
                    break;
                case 'info':
                    this.notificationService.showInfo(message);
                    break;
                case 'warning':
                    this.notificationService.showWarning(message);
                    break;
            }
        } else {
            console.log(`📢 [${type.toUpperCase()}] ${message}`);
        }
    }

    handleFiles(files) {
        console.log(`📁 ${files.length} fayl işlənir...`);

        let validFiles = 0;
        let invalidFiles = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validation
            if (file.size > this.maxFileSize) {
                this.showNotification('error', `${file.name} ölçüsü çox böyük (maksimum: 50MB)`);
                invalidFiles++;
                continue;
            }

            if (!this.allowedTypes.includes(file.type) && !this.isAllowedExtension(file.name)) {
                this.showNotification('error', `${file.name} tipi dəstəklənmir`);
                invalidFiles++;
                continue;
            }

            // Fayl əlavə et
            this.files.push(file);
            validFiles++;
            console.log(`✅ Fayl əlavə edildi: ${file.name} (${(file.size/1024).toFixed(2)} KB)`);
        }

        // Fayl siyahısını yenilə
        this.updateFileList();

        // Mesaj göstər
        if (validFiles > 0) {
            this.showNotification('success', `${validFiles} fayl əlavə edildi`);
        }
        if (invalidFiles > 0) {
            this.showNotification('warning', `${invalidFiles} fayl uyğun deyil`);
        }

        console.log(`📊 Nəticə: ${validFiles} uyğun, ${invalidFiles} uyğun deyil`);
    }

    isAllowedExtension(filename) {
        const allowedExtensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.webp',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
            '.mp4', '.avi', '.mov', '.mkv', '.wmv',
            '.mp3', '.wav', '.ogg', '.m4a',
            '.zip', '.rar', '.7z'
        ];

        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return allowedExtensions.includes(extension);
    }

    updateFileList() {
        if (!this.fileList) {
            console.log('⚠️ fileList elementi tapılmadı');
            return;
        }

        // Təmizlə
        this.fileList.innerHTML = '';

        if (this.files.length === 0) {
            this.fileList.innerHTML = '<div class="text-muted text-center py-3">Fayl yoxdur</div>';
            return;
        }

        // Hər fayl üçün element yarat
        this.files.forEach((file, index) => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item d-flex align-items-center justify-content-between mb-2 p-2 border rounded';

            const fileSize = (file.size / 1024).toFixed(2);

            fileElement.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file me-2"></i>
                    <span class="file-name">${file.name}</span>
                    <small class="text-muted ms-2">(${fileSize} KB)</small>
                </div>
                <button type="button" class="btn btn-sm btn-danger btn-remove-file" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;

            this.fileList.appendChild(fileElement);
        });

        // Remove button event listener-ları əlavə et
        document.querySelectorAll('.btn-remove-file').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.btn-remove-file').dataset.index);
                this.removeFile(index);
            });
        });

        console.log(`📋 Fayl siyahısı yeniləndi: ${this.files.length} fayl`);
    }

    removeFile(index) {
        if (index >= 0 && index < this.files.length) {
            const removedFile = this.files[index];
            this.files.splice(index, 1);

            this.updateFileList();
            this.showNotification('info', `"${removedFile.name}" silindi`);

            console.log(`🗑️ Fayl silindi: ${removedFile.name}`);
        }
    }

    clearFiles() {
        const count = this.files.length;
        this.files = [];
        this.updateFileList();

        console.log(`🧹 ${count} fayl təmizləndi`);
        return count;
    }

    async uploadFiles(taskId) {
        console.log(`📤 FileUploadManager.uploadFiles çağırıldı: taskId=${taskId}, fayl sayı=${this.files.length}`);

        if (this.files.length === 0) {
            console.log('📭 Yüklənəcək fayl yoxdur');
            return { success: true, uploaded: [], errors: [] };
        }

        // Task ID validation
        const numericTaskId = parseInt(taskId);
        if (isNaN(numericTaskId) || numericTaskId <= 0) {
            this.showNotification('error', 'Yanlış Task ID formatı');
            console.error('❌ Yanlış Task ID:', taskId);
            return {
                success: false,
                uploaded: [],
                errors: ['Yanlış Task ID formatı']
            };
        }

        console.log(`✅ Valid task ID: ${numericTaskId}`);

        const uploadedFiles = [];
        const errors = [];
        const uploadPromises = [];

        // Hər fayl üçün upload promise yarat
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];

            const uploadPromise = new Promise(async (resolve) => {
                try {
                    console.log(`📁 Fayl yüklənir (${i+1}/${this.files.length}): ${file.name} (${(file.size/1024).toFixed(2)} KB)`);

                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('description', `Task #${numericTaskId} üçün əlavə edildi`);

                    // ✅ Yeni backend endpoint-i
                    const url = `/proxy.php/api/v1/tasks/${numericTaskId}/upload-file`;
                    console.log(`📤 POST request göndərilir: ${url}`);

                    const token = localStorage.getItem('token') || '';

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    console.log(`📥 Response status: ${response.status} ${response.statusText}`);

                    let result;
                    try {
                        const responseText = await response.text();
                        console.log(`📝 Response text (first 200 chars):`, responseText.substring(0, 200));

                        if (responseText) {
                            result = JSON.parse(responseText);
                        } else {
                            result = {};
                        }
                    } catch (parseError) {
                        console.error('❌ JSON parse xətası:', parseError);
                        throw new Error('Server response format səhv');
                    }

                    if (response.ok && !result.error) {
                        console.log(`✅ Fayl yükləndi: ${file.name}`);
                        uploadedFiles.push(result.data || result);
                        resolve({ success: true, file: file.name });
                    } else {
                        const errorMsg = result?.error || result?.message || result?.detail || `HTTP ${response.status}`;
                        console.error(`❌ Fayl yüklənmədi: ${file.name}`, errorMsg);
                        errors.push(`${file.name}: ${errorMsg}`);
                        resolve({ success: false, file: file.name, error: errorMsg });
                    }

                } catch (error) {
                    console.error(`❌ Fayl xətası: ${file.name}`, error);
                    errors.push(`${file.name}: ${error.message}`);
                    resolve({ success: false, file: file.name, error: error.message });
                }
            });

            uploadPromises.push(uploadPromise);
        }

        // Bütün faylların yüklənməsini gözlə
        await Promise.all(uploadPromises);

        // Faylları təmizlə
        const clearedCount = this.clearFiles();

        // Nəticələri göstər
        if (errors.length > 0) {
            const errorMessage = errors.length > 3
                ? `${errors.length} fayldan ${uploadedFiles.length}-i yükləndi`
                : errors.join(', ');
            this.showNotification('warning', `Bəzi fayllar yüklənmədi: ${errorMessage}`);
        }

        if (uploadedFiles.length > 0) {
            this.showNotification('success', `${uploadedFiles.length} fayl uğurla yükləndi`);
        }

        console.log(`📊 Upload nəticəsi: ${uploadedFiles.length} uğurlu, ${errors.length} xəta, ${clearedCount} fayl təmizləndi`);

        return {
            success: errors.length === 0,
            uploaded: uploadedFiles,
            errors: errors
        };
    }
}

// Global obyekt yarat
window.fileUploadManager = new FileUploadManager();
console.log('🌐 FileUploadManager global obyekt yaradıldı');