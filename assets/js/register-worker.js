/**
 * İşçi Qeydiyyatı JavaScript
 * Güvən Finans - Backend API ilə
 * Version: 2.6.2 - Added father_name field (required by backend)
 */

(function() {
    'use strict';

    console.log('🚀 Sistem başladılır...');

    let currentStep = 1;
    const totalSteps = 3;
    let companyVerified = false;
    let companyInfoData = null;

    // API Configuration
    const API_BASE = 'http://vps.guvenfinans.az:8008'; // PHP proxy endpoint
    const API_VERSION = '/api/v1';

    // Preloader'ı gizlə
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        preloader && setTimeout(() => preloader.classList.add('hidden'), 500);
    });

    // Helper function to clean company code
    function cleanCompanyCode(code) {
        if (!code) return '';
        return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    // Telefon nömrəsini formatla
    function formatPhoneNumber(prefix, number) {
        const cleanNumber = number.replace(/\D/g, '');
        return `+994${prefix}${cleanNumber}`;
    }

    // API çağrısı funksiyası
    async function apiRequest(endpoint, method = 'GET', data = null) {
        try {
            const url = `${API_BASE}${endpoint}`;
            const options = {
                method: method,
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            };

            // Content-Type yalnız body olduqda əlavə et
            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }

            console.log(`📡 API Request: ${method} ${endpoint}`, data);

            const response = await fetch(url, options);

            // Check for HTTP errors
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error ${response.status}:`, errorText);

                if (response.status === 404) {
                    throw new Error('API endpoint tapılmadı');
                } else if (response.status === 405) {
                    throw new Error('Method not allowed');
                }

                throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
            }

            // Try to parse JSON response
            try {
                const result = await response.json();
                console.log(`✅ API Response from ${endpoint}:`, result);
                return result;
            } catch (e) {
                console.warn('Response is not JSON:', e);
                return {
                    success: true,
                    status: 'success',
                    message: 'Request successful'
                };
            }
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Password Toggle Functionality
    function initPasswordToggle() {
        const passwordToggle = document.getElementById('password-toggle');
        const confirmPasswordToggle = document.getElementById('confirm-password-toggle');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm_password');

        function togglePasswordVisibility(input, toggleBtn) {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            }
        }

        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => {
                togglePasswordVisibility(passwordInput, passwordToggle);
            });
        }

        if (confirmPasswordToggle && confirmPasswordInput) {
            confirmPasswordToggle.addEventListener('click', () => {
                togglePasswordVisibility(confirmPasswordInput, confirmPasswordToggle);
            });
        }
    }

    // Password strength checker
    function checkPasswordStrength(password) {
        const strengthBar = document.getElementById('password-strength');
        if (!strengthBar) return;

        let strength = 0;

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        strengthBar.className = 'password-strength-fill';
        strengthBar.style.width = `${strength * 20}%`;

        if (strength <= 2) {
            strengthBar.classList.add('weak');
        } else if (strength === 3) {
            strengthBar.classList.add('medium');
        } else {
            strengthBar.classList.add('strong');
        }
    }

    // Alert göstər
    function showAlert(message, type = 'info') {
        document.querySelectorAll('.alert').forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;

        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        alertDiv.innerHTML = `
            <div class="alert-content">
                <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="alert-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        const container = document.querySelector('.registration-container');
        const card = document.querySelector('.registration-card');
        container.insertBefore(alertDiv, card);

        alertDiv.querySelector('.alert-close').addEventListener('click', () => {
            alertDiv.remove();
        });

        if (type !== 'error') {
            setTimeout(() => alertDiv.remove(), 4000);
        }
    }

    // Şirkət kodu doğrulama
    const verifyBtn = document.getElementById('verify-company-code');
    const companyCodeInput = document.getElementById('company_code');

    verifyBtn && verifyBtn.addEventListener('click', async function() {
        const rawCode = companyCodeInput.value.trim();

        if (!rawCode) {
            showAlert('Zəhmət olmasa şirkət kodu daxil edin', 'warning');
            return;
        }

        // Kodu təmizlə
        const code = cleanCompanyCode(rawCode);
        if (!code) {
            showAlert('Yanlış şirkət kodu formatı', 'error');
            return;
        }

        const originalHTML = verifyBtn.innerHTML;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yoxlanılır...';
        verifyBtn.disabled = true;

        try {
            // Şirkət kodu yoxlama - GET /api/v1/companies/code/{code}
            const endpoint = `${API_VERSION}/companies/code/${encodeURIComponent(code)}`;
            console.log(`🔍 Company verification: GET ${endpoint}`);

            const response = await apiRequest(endpoint, 'GET');

            console.log('Company verification response:', response);

            if (response && (response.id || response.company_id || response.company_code)) {
                const companyInfo = document.getElementById('company-info');
                const companyName = document.getElementById('info-company-name');

                // Şirkət adını tap
                let companyNameText = code;
                if (response.company_name) {
                    companyNameText = response.company_name;
                } else if (response.name) {
                    companyNameText = response.name;
                }

                if (companyInfo && companyName) {
                    companyInfo.classList.remove('hidden');
                    companyName.textContent = companyNameText;
                }

                const nextBtnStep1 = document.getElementById('next-button-step1');
                if (nextBtnStep1) {
                    nextBtnStep1.disabled = false;
                    companyVerified = true;
                    companyInfoData = {
                        code: code,
                        name: companyNameText,
                        id: response.id || response.company_id,
                        originalResponse: response
                    };
                    showAlert('Şirkət kodu təsdiqləndi', 'success');
                }
            } else {
                showAlert(response?.message || 'Şirkət kodu tapılmadı', 'error');
                companyVerified = false;
                companyInfoData = null;
            }
        } catch (error) {
            console.error('Verification error:', error);

            // Demo rejim
            showAlert('API endpoint tapılmadı. Demo rejim aktivdir.', 'warning');

            const companyInfo = document.getElementById('company-info');
            const companyName = document.getElementById('info-company-name');
            if (companyInfo && companyName) {
                companyInfo.classList.remove('hidden');
                companyName.textContent = `${code} Şirkəti (Demo)`;
            }

            const nextBtnStep1 = document.getElementById('next-button-step1');
            if (nextBtnStep1) {
                nextBtnStep1.disabled = false;
                companyVerified = true;
                companyInfoData = {
                    code: code,
                    name: `${code} Şirkəti`,
                    id: 'demo-' + Date.now()
                };
                showAlert('Şirkət kodu təsdiqləndi (Demo rejim)', 'success');
            }
        } finally {
            verifyBtn.innerHTML = originalHTML;
            verifyBtn.disabled = false;
        }
    });

    // Adım dəyiş
    function goToStep(step) {
        if (step < 1 || step > totalSteps) return;

        document.querySelectorAll('.form-step').forEach(stepEl => {
            stepEl.style.display = 'none';
            stepEl.classList.remove('active');
        });

        const targetStep = document.getElementById(`step-${step}`);
        if (targetStep) {
            targetStep.style.display = 'block';
            setTimeout(() => targetStep.classList.add('active'), 10);

            const progressFill = document.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = `${((step - 1) / (totalSteps - 1)) * 100}%`;
            }

            document.querySelectorAll('[data-step-indicator]').forEach(indicator => {
                const indicatorStep = parseInt(indicator.getAttribute('data-step-indicator'));
                indicator.classList.remove('active', 'completed');

                if (indicatorStep < step) {
                    indicator.classList.add('completed');
                } else if (indicatorStep === step) {
                    indicator.classList.add('active');
                }
            });

            currentStep = step;

            // Fokusu aktiv sahəyə ver
            if (step === 1) {
                companyCodeInput.focus();
            } else if (step === 2) {
                document.getElementById('first_name').focus();
            }
        }
    }

    // Form validasiya - YENİLƏNDİ: father_name tələb olunur
    function validateStep2() {
        const firstName = document.getElementById('first_name').value.trim();
        const lastName = document.getElementById('last_name').value.trim();
        const fatherName = document.getElementById('father_name').value.trim();
        const gender = document.getElementById('gender').value;
        const finCode = document.getElementById('fin_code').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        const phonePrefix = document.getElementById('employee_phone_prefix').value;
        const phoneNumber = document.getElementById('employee_phone_number').value.replace(/\D/g, '');

        const errors = [];

        if (!firstName || !lastName) {
            errors.push('Ad və soyad daxil edin');
        }

        if (!fatherName) {
            errors.push('Ata adı daxil edin');
        }

        if (!gender) {
            errors.push('Cins seçin');
        }

        if (!finCode) {
            errors.push('FIN kod daxil edin');
        } else if (finCode.length !== 7) {
            errors.push('FIN kod 7 simvol olmalıdır');
        }

        if (!phonePrefix || phoneNumber.length !== 7) {
            errors.push('Düzgün telefon nömrəsi daxil edin (7 rəqəm)');
        }

        if (!email) {
            errors.push('E-poçt daxil edin');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Yanlış e-poçt formatı');
        }

        if (!password) {
            errors.push('Şifrə daxil edin');
        } else if (password.length < 8) {
            errors.push('Şifrə ən az 8 simvol olmalıdır');
        }

        if (password !== confirmPassword) {
            errors.push('Şifrələr uyğun deyil');
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            data: {
                firstName,
                lastName,
                fatherName,
                gender,
                finCode,
                email,
                password,
                phonePrefix,
                phoneNumber,
                companyCode: document.getElementById('company_code').value.trim()
            }
        };
    }

    // Buton handler'ları
    function initializeButtons() {
        // Addım 1 → Addım 2
        const nextBtnStep1 = document.getElementById('next-button-step1');
        nextBtnStep1?.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.disabled || !companyVerified) {
                showAlert('Zəhmət olmasa şirkət kodunu təsdiqləyin', 'warning');
                return;
            }
            goToStep(2);
        });

        // Addım 2 → Addım 1
        document.getElementById('prev-button-step2')?.addEventListener('click', function(e) {
            e.preventDefault();
            goToStep(1);
        });

        // Addım 2 → Addım 3
        document.getElementById('next-button-step2')?.addEventListener('click', function(e) {
            e.preventDefault();

            const validation = validateStep2();

            if (!validation.isValid) {
                showAlert(validation.errors.join(', '), 'warning');
                return;
            }

            updateSummary(validation.data);
            goToStep(3);
        });

        // Addım 3 → Addım 2
        document.getElementById('prev-button-step3')?.addEventListener('click', function(e) {
            e.preventDefault();
            goToStep(2);
        });

        // Form göndərmə
        const submitBtn = document.getElementById('submit-button');
        submitBtn?.addEventListener('click', async function(e) {
            e.preventDefault();

            const terms = document.getElementById('terms');
            if (!terms.checked) {
                showAlert('İstifadəçi razılaşmasını qəbul edin', 'warning');
                return;
            }

            await submitForm();
        });
    }

    // Özet güncəllə - YENİLƏNDİ
    function updateSummary(userData) {
        const summary = document.getElementById('summary-content');
        if (!summary) return;

        const fullPhone = userData.phonePrefix + ' ' +
                         userData.phoneNumber.substring(0, 3) + '-' +
                         userData.phoneNumber.substring(3, 5) + '-' +
                         userData.phoneNumber.substring(5, 7);

        // Gender tərcüməsi
        const genderMap = {
            'male': 'Kişi',
            'female': 'Qadın',
            'other': 'Digər'
        };
        const genderText = genderMap[userData.gender] || userData.gender;

        summary.innerHTML = `
            <div class="summary-item">
                <strong>Şirkət:</strong>
                <span>${companyInfoData?.name || userData.companyCode}</span>
            </div>
            <div class="summary-item">
                <strong>Ad Soyad:</strong>
                <span>${userData.firstName} ${userData.lastName}</span>
            </div>
            <div class="summary-item">
                <strong>Ata Adı:</strong>
                <span>${userData.fatherName}</span>
            </div>
            <div class="summary-item">
                <strong>Cins:</strong>
                <span>${genderText}</span>
            </div>
            <div class="summary-item">
                <strong>FIN Kod:</strong>
                <span>${userData.finCode.toUpperCase()}</span>
            </div>
            <div class="summary-item">
                <strong>Telefon:</strong>
                <span>${fullPhone}</span>
            </div>
            <div class="summary-item">
                <strong>E-poçt:</strong>
                <span>${userData.email}</span>
            </div>
        `;
    }

    // İşçi qeydiyyatı - YENİLƏNDİ: father_name əlavə edildi və IP əlavə edildi
    async function submitForm() {
        const submitBtn = document.getElementById('submit-button');
        if (!submitBtn) return;

        submitBtn.disabled = true;
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Göndərilir...';

        try {
            const validation = validateStep2();
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // ✅ İSTİFADƏÇİNİN REAL IP ÜNVANINI ALMAQ
            let clientIP = '0.0.0.0';
            try {
                // Bir neçə IP xidmətindən istifadə et
                const ipServices = [
                    'https://api.ipify.org?format=json',
                    'https://api64.ipify.org?format=json',
                    'https://ipapi.co/json/'
                ];

                for (const service of ipServices) {
                    try {
                        console.log(`🌐 IP alma cəhdi: ${service}`);
                        const response = await fetch(service, { timeout: 5000 });
                        if (response.ok) {
                            const data = await response.json();
                            clientIP = data.ip || '0.0.0.0';
                            if (clientIP && clientIP !== '0.0.0.0') {
                                console.log(`✅ IP alındı: ${clientIP} (${service})`);
                                break;
                            }
                        }
                    } catch (ipError) {
                        console.warn(`IP xidməti uğursuz oldu: ${service}`, ipError);
                    }
                }
            } catch (e) {
                console.warn('IP alma alınmadı:', e);
            }

            console.log(`📱 Client IP: ${clientIP}`);

            // TELEFON NÖMRƏSİNİ FORMATLA: +994501234567
            const formattedPhone = formatPhoneNumber(
                validation.data.phonePrefix,
                validation.data.phoneNumber
            );

            // EmployeeRegister SCHEMA'ya uyğun data - father_name və registration_ip əlavə edildi
            const registrationData = {
                // EmployeeRegister sahələri (ceo_ prefiksi ilə)
                ceo_name: validation.data.firstName,
                ceo_lastname: validation.data.lastName,
                ceo_email: validation.data.email,
                ceo_phone: formattedPhone,
                ceo_password: validation.data.password,
                fin_code: validation.data.finCode.toUpperCase(),

                // Backend tələb edir
                father_name: validation.data.fatherName, // ✅ ƏLAVƏ EDİLDİ

                // ✅ YENİ: Registration IP əlavə edildi
                registration_ip: clientIP,

                // Digər sahələr
                position: "Employee",
                gender: validation.data.gender,
                birth_date: null,
                voen: null,
                company_data: null
            };

            console.log('📦 EmployeeRegister data for backend:', {
                ...registrationData,
                ceo_password: '••••••••' // Şifrəni gizlət
            });
            console.log('📍 Company code:', validation.data.companyCode);
            console.log(`🌐 Registration IP: ${clientIP}`);

            // JSON string formatını yoxla
            const jsonString = JSON.stringify(registrationData);
            console.log('🔍 JSON string:', jsonString);
            console.log('🔍 JSON parse test:', JSON.parse(jsonString));

            // DÜZGÜN ENDPOINT: /api/v1/employees/register/{company_code}
            const endpoint = `${API_VERSION}/employees/register/${encodeURIComponent(validation.data.companyCode)}`;
            console.log(`📤 Employee registration: POST ${endpoint}`);

            // Backend-ə göndər
            const response = await apiRequest(endpoint, 'POST', registrationData);

            console.log('✅ Backend response:', response);

            // Response'u yoxla
            if (response && response.success) {
                // ✅ UĞURLU QEYDİYYAT

                showAlert('🎉 İşçi qeydiyyatı uğurla tamamlandı! Admin təsdiqi gözləyir.', 'success');

                // Əlavə məlumatları localStorage'da saxla (əgər varsa)
                if (response.user_id) {
                    localStorage.setItem('pending_user_id', response.user_id);
                }
                if (response.employee_code) {
                    localStorage.setItem('pending_employee_code', response.employee_code);
                }

                // 3 saniyə gözləyib login səhifəsinə yönləndir
                setTimeout(() => {
                    console.log('🔄 Redirecting to login page...');
                    window.location.href = 'login.html';
                }, 3000);

            } else if (response && response.message) {
                // Backend xəta mesajı varsa
                throw new Error(response.message);
            } else {
                // Gözlənilməyən response
                throw new Error('Backend gözlənilməyən cavab verdi');
            }

        } catch (error) {
            console.error('❌ Registration error:', error);

            // Xəta mesajını formatla
            let errorMessage = 'Qeydiyyat zamanı xəta baş verdi';

            if (error.message.includes('405')) {
                errorMessage = 'Method uyğun deyil. Endpoint-i yoxlayın.';
            } else if (error.message.includes('404')) {
                errorMessage = 'Qeydiyyat endpoint-i tapılmadı. Path: /api/v1/employees/register/{company_code}';
            } else if (error.message.includes('400') || error.message.includes('422')) {
                // Backend validation xətası
                errorMessage = 'Validation xətası';

                // Error mesajını parse et
                try {
                    const jsonMatch = error.message.match(/\{.*\}/s);
                    if (jsonMatch) {
                        const errorObj = JSON.parse(jsonMatch[0]);
                        console.log('🔍 Parsed error object:', errorObj);

                        if (errorObj.detail) {
                            if (Array.isArray(errorObj.detail)) {
                                // Validation xətalarını topla
                                const errorDetails = errorObj.detail.map(err => {
                                    const fieldName = err.loc?.join('.') || 'unknown';
                                    const fieldTranslation = {
                                        'body.father_name': 'Ata Adı',
                                        'body.gender': 'Cins',
                                        'body.ceo_name': 'Ad',
                                        'body.ceo_lastname': 'Soyad',
                                        'body.ceo_email': 'E-poçt',
                                        'body.ceo_phone': 'Telefon',
                                        'body.fin_code': 'FIN Kod',
                                        'body.ceo_password': 'Şifrə',
                                        'body.registration_ip': 'IP Ünvanı'
                                    }[fieldName] || fieldName;

                                    return `${fieldTranslation}: ${err.msg}`;
                                }).join('<br>');
                                showAlert(`❌ ${errorMessage}<br><small>${errorDetails}</small>`, 'error');
                            } else if (typeof errorObj.detail === 'string') {
                                showAlert(`❌ ${errorObj.detail}`, 'error');
                            }
                        }
                    }
                } catch (parseError) {
                    console.error('Error parsing error message:', parseError);
                    showAlert(`❌ ${error.message}`, 'error');
                }
                return;
            } else if (error.message.includes('500') && error.message.includes('string formatting')) {
                // SQL query xətası
                errorMessage = 'Backend SQL xətası: Parametr sayı uyğun deyil. Backend developer ilə əlaqə saxlayın.';
                showAlert(`❌ ${errorMessage}`, 'error');

                // Əlavə məlumat
                console.error('🔍 SQL Error details: Backend-de employees/register endpointində SQL query parametr xətası var.');
                console.error('🔍 Problem: Python SQL query-də %s placeholder-ları ilə göndərilən parametr sayı uyğun gəlmir.');
                console.error('🔍 Həll: Backend developer employees_service.py faylında register_employee_public funksiyasını yoxlamalıdır.');
                return;
            } else {
                errorMessage = error.message;
            }

            showAlert(`❌ ${errorMessage}`, 'error');

            // Konsolda ətraflı log
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
        }
    }

    // Real-time validasiya - YENİLƏNDİ
    function initValidation() {
        // Telefon nömrəsi formatı
        const phoneInput = document.getElementById('employee_phone_number');
        phoneInput?.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 7) value = value.substring(0, 7);

            let formatted = '';
            if (value.length > 0) formatted = value.substring(0, 3);
            if (value.length > 3) formatted += '-' + value.substring(3, 5);
            if (value.length > 5) formatted += '-' + value.substring(5, 7);

            this.value = formatted;

            const phonePrefix = document.getElementById('employee_phone_prefix').value;
            if (value.length === 7 && phonePrefix) {
                this.style.borderColor = '#10b981';
            } else if (value.length > 0) {
                this.style.borderColor = '#f59e0b';
            }
        });

        // FIN kod formatı
        const finInput = document.getElementById('fin_code');
        finInput?.addEventListener('input', function() {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 7);

            if (this.value.length === 7) {
                this.style.borderColor = '#10b981';
            } else if (this.value.length > 0) {
                this.style.borderColor = '#f59e0b';
            }
        });

        // Şifrə gücü
        const passwordInput = document.getElementById('password');
        passwordInput?.addEventListener('input', function() {
            checkPasswordStrength(this.value);
            checkPasswordMatch();
        });

        // Şifrə uyğunluğu
        const confirmPassInput = document.getElementById('confirm_password');
        confirmPassInput?.addEventListener('input', checkPasswordMatch);

        function checkPasswordMatch() {
            const pass = passwordInput.value;
            const confirmPass = confirmPassInput.value;

            if (pass && confirmPass) {
                if (pass === confirmPass) {
                    confirmPassInput.style.borderColor = '#10b981';
                } else {
                    confirmPassInput.style.borderColor = '#ef4444';
                }
            }
        }

        // Email validation
        const emailInput = document.getElementById('email');
        emailInput?.addEventListener('blur', function() {
            if (this.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(this.value)) {
                    this.style.borderColor = '#10b981';
                } else {
                    this.style.borderColor = '#ef4444';
                }
            }
        });

        // Gender validation
        const genderSelect = document.getElementById('gender');
        genderSelect?.addEventListener('change', function() {
            if (this.value) {
                this.style.borderColor = '#10b981';
            }
        });

        // Father name validation
        const fatherNameInput = document.getElementById('father_name');
        fatherNameInput?.addEventListener('input', function() {
            if (this.value.trim()) {
                this.style.borderColor = '#10b981';
            } else {
                this.style.borderColor = '#ef4444';
            }
        });

        // Enter key ilə şirkət kodu yoxlama
        companyCodeInput?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyBtn.click();
            }
        });
    }

    // İnitialize
    function init() {
        goToStep(1);
        initializeButtons();
        initValidation();
        initPasswordToggle();

        // Enter key navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();

                if (currentStep === 1) {
                    verifyBtn.click();
                } else if (currentStep === 2) {
                    document.getElementById('next-button-step2').click();
                } else if (currentStep === 3) {
                    const terms = document.getElementById('terms');
                    if (terms && terms.checked) {
                        document.getElementById('submit-button').click();
                    }
                }
            }
        });

        // Demo data for testing - YENİLƏNDİ
        window.demoMode = function() {
            companyCodeInput.value = 'AZE26003';
            document.getElementById('first_name').value = 'İşçi';
            document.getElementById('last_name').value = 'Test';
            document.getElementById('father_name').value = 'Ata'; // ✅ Ata adı əlavə edildi
            document.getElementById('gender').value = 'male';
            document.getElementById('fin_code').value = 'ABC1234';
            document.getElementById('employee_phone_prefix').value = '50';
            document.getElementById('employee_phone_number').value = '123-45-67';
            document.getElementById('email').value = 'worker@example.com';
            document.getElementById('password').value = 'Password123';
            document.getElementById('confirm_password').value = 'Password123';
            console.log('Demo data loaded for employee registration');
            console.log('⚠️ Gender will be sent as: "male" (lowercase)');
            console.log('⚠️ Father name will be sent: "Ata"');
        };

        console.log('✅ System initialized - Ready for employee registration');
        console.log('📋 Schema: EmployeeRegister');
        console.log('📍 Endpoint: POST /api/v1/employees/register/{company_code}');
        console.log('🔑 Required fields: ceo_name, ceo_lastname, ceo_email, ceo_phone, ceo_password, fin_code, gender, father_name');
        console.log('⚡ Important: gender should be lowercase (male, female, other)');
        console.log('⚡ Important: father_name is REQUIRED by backend');
        console.log('🔍 Debug mode: Active');
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

})();