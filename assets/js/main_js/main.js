// assets/js/index.js - TAM DÜZGÜN VERSİYA

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== GÜVƏN FİNANS AUTH STATUS ===');
    console.log('auth_token:', localStorage.getItem('auth_token') ? 'VAR' : 'YOX');
    console.log('guven_token:', localStorage.getItem('guven_token') ? 'VAR' : 'YOX');
    console.log('user_email:', localStorage.getItem('user_email'));
    console.log('user_name:', localStorage.getItem('user_name'));

    const loader = document.getElementById('gti-loader');
    const siteShell = document.getElementById('site-shell');
    const body = document.body;
    const MIN_DURATION = 1350;
    const startTime = performance.now();

    const navigationEntry = performance.getEntriesByType('navigation')[0];
    const legacyNavType = performance.navigation?.type === 1 ? 'reload' : 'navigate';
    const navigationType = navigationEntry?.type || legacyNavType;
    const loaderAlreadyShown = sessionStorage.getItem('gtiLoaderShown') === '1';
    const shouldShowLoader = navigationType === 'reload' || !loaderAlreadyShown;

    const revealSite = () => {
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => loader.remove(), 360);
        }
        body.classList.add('loaded');
        body.classList.remove('loader-active');
        if (siteShell) siteShell.style.pointerEvents = 'auto';
    };

    if (shouldShowLoader) {
        body.classList.add('loader-active');
        sessionStorage.setItem('gtiLoaderShown', '1');

        const elapsed = () => performance.now() - startTime;
        const remaining = Math.max(0, MIN_DURATION - elapsed());
        setTimeout(revealSite, remaining);
    } else {
        if (loader) loader.remove();
        body.classList.add('loaded');
        body.classList.remove('loader-active');
        if (siteShell) siteShell.style.pointerEvents = 'auto';
    }

    const header = document.getElementById('main-header');

    // Header rəng dəyişmə effekti
    if (header && !header.classList.contains('no-scroll-effect')) {
        const updateHeaderState = () => {
            if (window.scrollY > 10) header.classList.add('header-scrolled');
            else header.classList.remove('header-scrolled');
        };
        updateHeaderState();
        window.addEventListener('scroll', updateHeaderState, { passive: true });
    }

    // Telefon linki təsdiqi
    const phoneLink = document.getElementById('header-phone-link');
    if (phoneLink) {
        phoneLink.addEventListener('click', (e) => {
            if (!confirm('Hörmətli istifadəçi, bu nömrəyə zəng etmək istəyirsiniz?')) {
                e.preventDefault();
            }
        });
    }

    // Mobil menyu açılıb-bağlanması
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

    if (mobileMenuToggle && mobileMenuOverlay) {
        const setMobileMenuState = (isActive) => {
            mobileMenuOverlay.classList.toggle('is-active', isActive);
            mobileMenuToggle.classList.toggle('is-open', isActive);
            mobileMenuOverlay.setAttribute('aria-hidden', (!isActive).toString());
            mobileMenuToggle.setAttribute('aria-expanded', isActive.toString());
            document.body.classList.toggle('menu-open', isActive);

            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !isActive);
                icon.classList.toggle('fa-times', isActive);
            }
        };

        mobileMenuToggle.addEventListener('click', () => {
            const isActive = !mobileMenuOverlay.classList.contains('is-active');
            setMobileMenuState(isActive);
        });

        mobileMenuOverlay.addEventListener('click', (event) => {
            if (event.target === mobileMenuOverlay) {
                setMobileMenuState(false);
            }
        });

        const overlayLinks = mobileMenuOverlay.querySelectorAll('a, .mobile-auth-btn, .mobile-contact-link');
        overlayLinks.forEach((link) => link.addEventListener('click', () => setMobileMenuState(false)));

        const desktopMediaQuery = window.matchMedia('(min-width: 769px)');
        desktopMediaQuery.addEventListener('change', (event) => {
            if (event.matches) {
                setMobileMenuState(false);
            }
        });
    }

    // Naviqasiya linkləri üçün hamar sürüşdürmə
    const scrollLinks = document.querySelectorAll('a[data-scroll-target]');
    const headerOffset = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--header-offset')
    ) || 0;

    const scrollToSection = (targetId) => {
        const target = document.getElementById(targetId);
        if (!target) return false;

        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        return true;
    };

    scrollLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('data-scroll-target');
            if (!targetId) return;

            const didScroll = scrollToSection(targetId);
            if (didScroll) {
                event.preventDefault();
                link.blur();
            }
        });
    });

    // PARTNERS carousel drag
    const carousel = document.querySelector('[data-projects-carousel]');
    if (carousel) {
        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;

        const startDrag = (e) => {
            isDown = true;
            carousel.classList.add('is-dragging');
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        };

        const stopDrag = () => {
            isDown = false;
            carousel.classList.remove('is-dragging');
        };

        const moveDrag = (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2;
            carousel.scrollLeft = scrollLeft - walk;
        };

        carousel.addEventListener('mousedown', startDrag);
        carousel.addEventListener('mouseleave', stopDrag);
        window.addEventListener('mouseup', stopDrag);
        carousel.addEventListener('mousemove', moveDrag);
    }

    // Projects slider arrows
    const slider = document.getElementById('projects-container');
    const prevBtn = document.getElementById('project-prev-btn');
    const nextBtn = document.getElementById('project-next-btn');

    if (slider && prevBtn && nextBtn) {
        const updateButtons = () => {
            if (slider.scrollLeft <= 5) prevBtn.classList.add('is-hidden');
            else prevBtn.classList.remove('is-hidden');

            if (Math.ceil(slider.scrollLeft) >= slider.scrollWidth - slider.clientWidth - 5)
                nextBtn.classList.add('is-hidden');
            else nextBtn.classList.remove('is-hidden');
        };

        slider.addEventListener('scroll', updateButtons);
        window.addEventListener('resize', updateButtons);
        updateButtons();

        nextBtn.addEventListener('click', () => {
            const cols = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
            const scrollAmount = slider.clientWidth / cols;
            slider.scrollBy({ left: scrollAmount + 24, behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            const cols = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
            const scrollAmount = slider.clientWidth / cols;
            slider.scrollBy({ left: -(scrollAmount + 24), behavior: 'smooth' });
        });
    }

    // Konsultasiya formu göndər
    const consultForm = document.querySelector('.consult-form');
    if (consultForm) {
        consultForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = this.querySelector('input[type="text"]').value;
            const phone = this.querySelector('input[type="tel"]').value;
            const message = this.querySelector('textarea').value;

            if (!name || !phone) {
                alert('Zəhmət olmasa ad və telefon nömrənizi daxil edin.');
                return;
            }

            console.log('📞 Konsultasiya sorğusu:', { name, phone, message });
            alert('Sorğunuz qeydə alındı. Tezliklə sizinlə əlaqə saxlayacağıq.');

            // Formu təmizlə
            this.reset();
        });
    }

    // ==================== SAYTI BAŞLAT ====================
    // DOM tam yükləndikdə saytı başlat
    initializePage();
});

// ==================== AUTHENTICATION FUNKSİYALARI ====================

function checkAuthStatus() {
    console.log('🔐 Auth status yoxlanılır...');

    // Həm köhnə, həm də yeni token formatlarını yoxla
    const authToken = localStorage.getItem('auth_token') || localStorage.getItem('guven_token');
    const userEmail = localStorage.getItem('user_email');
    const userName = localStorage.getItem('user_name');

    console.log('Giriş statusu:', !!authToken);
    console.log('İstifadəçi email:', userEmail);
    console.log('İstifadəçi adı:', userName);

    const isLoggedIn = !!authToken;

    // Desktop düymələrini yoxla
    const desktopLoginBtn = document.getElementById('login-btn');
    const desktopRegisterBtn = document.getElementById('register-btn');
    const desktopProfileBtn = document.getElementById('nav-profile-btn');

    // Mobil düymələri yoxla
    const mobileLoginBtn = document.querySelector('.mobile-auth-solid:not(.mobile-profile-btn)');
    const mobileRegisterBtn = document.querySelector('.mobile-auth-outline');
    const mobileProfileBtn = document.getElementById('mobile-profile-btn');

    if (isLoggedIn) {
        try {
            // Desktop düymələri
            if (desktopLoginBtn) {
                desktopLoginBtn.style.display = 'none';
                desktopLoginBtn.hidden = true;
            }
            if (desktopRegisterBtn) {
                desktopRegisterBtn.style.display = 'none';
                desktopRegisterBtn.hidden = true;
            }
            if (desktopProfileBtn) {
                desktopProfileBtn.style.display = 'flex';
                desktopProfileBtn.hidden = false;

                // İstifadəçi adını düzəlt (əgər varsa)
                const profileSpan = desktopProfileBtn.querySelector('span');
                if (profileSpan && userName) {
                    // Adın ilk hərfini böyük et
                    const firstName = userName.split(' ')[0];
                    const displayName = firstName.length > 10 ?
                        firstName.substring(0, 10) + '...' : firstName;
                    profileSpan.textContent = displayName;
                } else if (profileSpan && userEmail) {
                    // Email-dən istifadə et
                    const username = userEmail.split('@')[0];
                    const displayName = username.length > 10 ?
                        username.substring(0, 10) + '...' : username;
                    profileSpan.textContent = displayName;
                }
            }

            // Mobil düymələr
            if (mobileLoginBtn) {
                mobileLoginBtn.style.display = 'none';
                mobileLoginBtn.hidden = true;
            }
            if (mobileRegisterBtn) {
                mobileRegisterBtn.style.display = 'none';
                mobileRegisterBtn.hidden = true;
            }
            if (mobileProfileBtn) {
                mobileProfileBtn.style.display = 'block';
                mobileProfileBtn.hidden = false;

                // Mobil üçün də adı düzəlt
                if (userName) {
                    const firstName = userName.split(' ')[0];
                    mobileProfileBtn.textContent = `Profil (${firstName})`;
                } else if (userEmail) {
                    const username = userEmail.split('@')[0];
                    mobileProfileBtn.textContent = `Profil (${username})`;
                } else {
                    mobileProfileBtn.textContent = 'Profil';
                }
            }

            console.log('✅ Profil düymələri göstərildi');

        } catch (error) {
            console.error('❌ Profil düymələri göstərilərkən xəta:', error);
            showLoginButtons();
        }
    } else {
        // Giriş edilməyibsə, login/register düymələrini göstər
        showLoginButtons();
    }
}

function showLoginButtons() {
    console.log('🔓 Login düymələri göstərilir');

    // Desktop
    const desktopLoginBtn = document.getElementById('login-btn');
    const desktopRegisterBtn = document.getElementById('register-btn');
    const desktopProfileBtn = document.getElementById('nav-profile-btn');

    if (desktopLoginBtn) {
        desktopLoginBtn.style.display = 'flex';
        desktopLoginBtn.hidden = false;
    }
    if (desktopRegisterBtn) {
        desktopRegisterBtn.style.display = 'flex';
        desktopRegisterBtn.hidden = false;
    }
    if (desktopProfileBtn) {
        desktopProfileBtn.style.display = 'none';
        desktopProfileBtn.hidden = true;
    }

    // Mobil
    const mobileLoginBtn = document.querySelector('.mobile-auth-solid:not(.mobile-profile-btn)');
    const mobileRegisterBtn = document.querySelector('.mobile-auth-outline');
    const mobileProfileBtn = document.getElementById('mobile-profile-btn');

    if (mobileLoginBtn) {
        mobileLoginBtn.style.display = 'block';
        mobileLoginBtn.hidden = false;
    }
    if (mobileRegisterBtn) {
        mobileRegisterBtn.style.display = 'block';
        mobileRegisterBtn.hidden = false;
    }
    if (mobileProfileBtn) {
        mobileProfileBtn.style.display = 'none';
        mobileProfileBtn.hidden = true;
    }
}

function logout() {
    console.log('🚪 Çıxış edilir...');

    // LocalStorage-dan bütün auth məlumatlarını sil
    localStorage.removeItem('auth_token');
    localStorage.removeItem('guven_token');
    localStorage.removeItem('guven_token_type');
    localStorage.removeItem('guven_user_role');
    localStorage.removeItem('guven_user_id');
    localStorage.removeItem('guven_user');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('guvenfinans-isLoggedIn');
    localStorage.removeItem('guvenfinans-userData');

    // Düymələri yenilə
    showLoginButtons();

    // Ana səhifəyə yönləndir
    window.location.href = 'index.html';
}

function setupProfileButtons() {
    // Desktop profil düyməsi
    const desktopProfileBtn = document.getElementById('nav-profile-btn');
    if (desktopProfileBtn) {
        desktopProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const authToken = localStorage.getItem('auth_token') || localStorage.getItem('guven_token');
            if (authToken) {
                // Dashboard səhifəsinə yönləndir
                window.location.href = 'dashboard.html';
            } else {
                // Login səhifəsinə yönləndir
                window.location.href = 'login.html';
            }
        });
    }

    // Mobil profil düyməsi
    const mobileProfileBtn = document.getElementById('mobile-profile-btn');
    if (mobileProfileBtn) {
        mobileProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const authToken = localStorage.getItem('auth_token') || localStorage.getItem('guven_token');
            if (authToken) {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    // Login düyməsi üçün əlavə yoxlama
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            const authToken = localStorage.getItem('auth_token') || localStorage.getItem('guven_token');
            if (authToken) {
                e.preventDefault();
                window.location.href = 'dashboard.html';
            }
        });
    }
}

// ==================== XİDMƏTLƏR FUNKSİYALARI ====================

function loadServicesFromStorage() {
    console.log('🔄 Ana səhifə xidmətləri yüklənir...');

    const savedServices = localStorage.getItem('guvenfinans-active-services');
    console.log('LocalStorage məlumatı:', savedServices);

    if (savedServices) {
        try {
            const services = JSON.parse(savedServices);
            console.log('✅ Xidmətlər yükləndi:', services.length);
            renderServicesOnPage(services);
        } catch (error) {
            console.error('❌ JSON parse xətası:', error);
            loadDefaultServices();
        }
    } else {
        console.log('📂 Default xidmətlər yüklənir');
        loadDefaultServices();
    }
}

function loadDefaultServices() {
    const defaultServices = [
        {
            id: 1,
            name: "Mühasibatlıq xidmətləri",
            items: [
                "Mühasibatlığın qurulması və idarə edilməsi",
                "Müəssisələr üçün balansın hazırlanması və hesabatların verilməsi",
                "Əmək haqqının hesablanması"
            ],
            cta: "Ətraflı...",
            target: "konsultasiya"
        },
        {
            id: 2,
            name: "Vergi xidmətləri",
            items: [
                "VÖEN alınması və qeydiyyat işləri",
                "ƏDV qeydiyyatı və qeydiyyatın ləğvi",
                "Bank rekvizitlərinin alınması",
                "Kassa aparatlarının qurulması"
            ],
            cta: "Ətraflı...",
            target: "konsultasiya"
        },
        {
            id: 3,
            name: "İnsan Resursları",
            items: [
                "Kadr inzibatçılığı və sənədləşməsi üzrə məsləhət",
                "Sənədlərin ekspertizası və rəy"
            ],
            cta: "Ətraflı...",
            target: "konsultasiya"
        },
        {
            id: 4,
            name: "Hüquqi xidmətlər",
            items: [
                "Şirkət iclaslarında iştirak və hüquqi müşayiət",
                "Müqavilələrin hazırlanması və yoxlanması"
            ],
            cta: "Ətraflı...",
            target: "konsultasiya"
        },
        {
            id: 5,
            name: "İKT",
            items: [
                "IT Texniki dəstək (Help desk)",
                "Şəbəkə sisteminin çəkilişi və qurulması",
                "Analoq telefon sisteminin quraşdırılması"
            ],
            cta: "Ətraflı...",
            target: "konsultasiya"
        }
    ];

    // Save to localStorage
    localStorage.setItem('guvenfinans-active-services', JSON.stringify(defaultServices));

    // Render et
    renderServicesOnPage(defaultServices);
}

function renderServicesOnPage(services) {
    console.log('🎨 Xidmətlər render edilir:', services.length);

    const servicesGrid = document.querySelector('.services-grid');
    if (!servicesGrid) {
        console.error('❌ services-grid tapılmadı');
        return;
    }

    let html = '';

    services.forEach(service => {
        let itemsHtml = '';
        service.items.forEach(item => {
            itemsHtml += `<li>${item}</li>`;
        });

        html += `
            <article class="service-card">
                <h3 class="service-title">${service.name}</h3>
                <ul class="service-list">
                    ${itemsHtml}
                </ul>
                <a href="#${service.target}" data-scroll-target="${service.target}" class="service-btn">
                    ${service.cta}
                </a>
            </article>
        `;
    });

    servicesGrid.innerHTML = html;
    console.log('✅ Xidmətlər render edildi');
}

// ==================== PARTNYORLAR FUNKSİYALARI ====================

function loadPartners() {
    console.log('🔄 Partnyorlar yüklənir...');

    const partnersContainer = document.getElementById('partners-container');
    if (!partnersContainer) {
        console.error('❌ partners-container tapılmadı');
        return;
    }

    // LocalStorage-dan partnyorları yüklə
    const savedPartners = localStorage.getItem('guvenfinans-partners');

    if (savedPartners) {
        try {
            const partners = JSON.parse(savedPartners);
            renderPartners(partners);
        } catch (error) {
            console.error('❌ JSON parse xətası:', error);
            loadDefaultPartners();
        }
    } else {
        console.log('📂 Default partnyorlar yüklənir');
        loadDefaultPartners();
    }
}

function loadDefaultPartners() {
    const defaultPartners = [
        {
            id: 1,
            name: "Microsoft",
            logo: "https://cdn.worldvectorlogo.com/logos/microsoft.svg",
            website: "https://microsoft.com",
            order: 1,
            active: true
        },
        {
            id: 2,
            name: "Google",
            logo: "https://cdn.worldvectorlogo.com/logos/google-2015.svg",
            website: "https://google.com",
            order: 2,
            active: true
        },
        {
            id: 3,
            name: "Amazon AWS",
            logo: "https://cdn.worldvectorlogo.com/logos/aws-2.svg",
            website: "https://aws.amazon.com",
            order: 3,
            active: true
        },
        {
            id: 4,
            name: "Oracle",
            logo: "https://cdn.worldvectorlogo.com/logos/oracle-6.svg",
            website: "https://oracle.com",
            order: 4,
            active: true
        },
        {
            id: 5,
            name: "IBM",
            logo: "https://cdn.worldvectorlogo.com/logos/ibm.svg",
            website: "https://ibm.com",
            order: 5,
            active: true
        },
        {
            id: 6,
            name: "SAP",
            logo: "https://cdn.worldvectorlogo.com/logos/sap-2015.svg",
            website: "https://sap.com",
            order: 6,
            active: true
        }
    ];

    // Save to localStorage
    localStorage.setItem('guvenfinans-partners', JSON.stringify(defaultPartners));

    // Render et
    renderPartners(defaultPartners);
}

function renderPartners(partners) {
    const container = document.getElementById('partners-container');
    if (!container) return;

    console.log('🎨 Partnyorlar render edilir:', partners.length);

    const activePartners = partners.filter(p => p.active);

    if (activePartners.length === 0) {
        container.innerHTML = '<p class="empty-msg">Heç bir partnyor tapılmadı</p>';
        return;
    }

    let html = '';

    activePartners.forEach(partner => {
        // Placeholder URL-i düzəldin
        const placeholderUrl = `https://via.placeholder.com/150x80/007bff/ffffff?text=${encodeURIComponent(partner.name.substring(0, 15))}&font-size=14`;

        html += `
            <div class="partner-item" data-partner-id="${partner.id}">
                <a href="${partner.website || '#'}" target="_blank" class="partner-link-full" ${!partner.website ? 'onclick="return false;"' : ''}>
                    <div class="partner-logo-container">
                        ${partner.logo ?
                            `<img src="${partner.logo}" alt="${partner.name}" class="partner-logo"
                                  onerror="this.onerror=null; this.src='${placeholderUrl}'">` :
                            `<div class="partner-placeholder">${partner.name.charAt(0)}</div>`
                        }
                    </div>
                </a>
                <div class="partner-info">
                    <h4 class="partner-name">${partner.name}</h4>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    console.log('✅ Partnyorlar render edildi');
}

// ==================== LAYİHƏLƏR FUNKSİYALARI ====================

function loadProjects() {
    console.log('🔄 Layihələr yüklənir...');

    const projectsContainer = document.getElementById('projects-container');
    if (!projectsContainer) return;

    const savedProjects = localStorage.getItem('guvenfinans-projects');

    if (savedProjects) {
        try {
            const projects = JSON.parse(savedProjects);
            renderProjectsOnPage(projects);
            setupProjectSlider(); // Slider-i quraşdır
        } catch (error) {
            console.error('❌ JSON parse xətası:', error);
            loadDefaultProjects();
        }
    } else {
        loadDefaultProjects();
    }
}

function loadDefaultProjects() {
    const defaultProjects = [
        {
            id: 1,
            name: "ERP Sistem İmplementasiyası",
            mediaType: "image",
            mediaUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            description: "Böyük şirkət üçün ERP sisteminin tam implementasiyası",
            category: "ERP",
            client: "ABC Şirkəti",
            order: 1,
            active: true
        },
        {
            id: 2,
            name: "CRM Sistem Demo",
            mediaType: "video",
            mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            description: "CRM sisteminin işləmə prinsipi",
            category: "CRM",
            client: "XYZ Corp",
            order: 2,
            active: true
        },
        {
            id: 3,
            name: "Mobil Bankçılıq Tətbiqi",
            mediaType: "youtube",
            mediaUrl: "dQw4w9WgXcQ",
            description: "Bank üçün innovativ mobil tətbiq",
            category: "Mobil Tətbiq",
            client: "Milli Bank",
            order: 3,
            active: true
        },
        {
            id: 4,
            name: "Veb Sayt Redizaynı",
            mediaType: "image",
            mediaUrl: "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            description: "Müasir və istifadəçi dostu veb sayt dizaynı",
            category: "Veb Dizayn",
            client: "Tech Solutions",
            order: 4,
            active: true
        },
        {
            id: 5,
            name: "Bulud İnfrastruktur Qurulması",
            mediaType: "image",
            mediaUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            description: "Təhlükəsiz və miqyaslanan bulud infrastruktur",
            category: "Bulud",
            client: "Data Corp",
            order: 5,
            active: true
        },
        {
            id: 6,
            name: "AI Analytics Platform",
            mediaType: "video",
            mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            description: "AI ilə gücləndirilmiş analitika platforması",
            category: "AI",
            client: "Innovate AI",
            order: 6,
            active: true
        }
    ];

    localStorage.setItem('guvenfinans-projects', JSON.stringify(defaultProjects));
    renderProjectsOnPage(defaultProjects);
    setupProjectSlider(); // Slider-i quraşdır
}

function renderProjectsOnPage(projects) {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const activeProjects = projects.filter(p => p.active)
        .sort((a, b) => a.order - b.order);

    if (activeProjects.length === 0) {
        container.innerHTML = '<p class="empty-msg">Heç bir layihə tapılmadı</p>';
        return;
    }

    let html = '';

    activeProjects.forEach(project => {
        // Placeholder generator
        const getPlaceholder = () => {
            const colors = ['007bff', '28a745', 'dc3545', 'ffc107', '17a2b8'];
            const color = colors[Math.abs(project.name.length) % colors.length];
            const text = project.name.substring(0, 2).toUpperCase();

            if (project.mediaType === 'video') {
                return `<div class="project-placeholder video-placeholder">
                    <i class="fas fa-play-circle"></i>
                    <span>${text}</span>
                </div>`;
            } else if (project.mediaType === 'youtube') {
                return `<div class="project-placeholder youtube-placeholder">
                    <i class="fab fa-youtube"></i>
                    <span>${text}</span>
                </div>`;
            }

            return `<div class="project-placeholder">
                <span>${text}</span>
            </div>`;
        };

        // Media content generator
        let mediaContent = '';
        let mediaIcon = '';

        if (project.mediaType === 'image' && project.mediaUrl) {
            mediaContent = `
                <img src="${project.mediaUrl}" alt="${project.name}" class="project-media"
                     onerror="this.classList.add('media-error')">
            `;
        } else if (project.mediaType === 'video' && project.mediaUrl) {
            mediaContent = `
                <div class="project-video-container">
                    <video class="project-media" playsinline>
                        <source src="${project.mediaUrl}" type="video/mp4">
                    </video>
                    <div class="video-controls">
                        <button class="video-play-btn">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
            `;
            mediaIcon = '<i class="fas fa-video project-media-icon"></i>';
        } else if (project.mediaType === 'youtube' && project.mediaUrl) {
            mediaContent = `
                <div class="project-youtube-container">
                    <div class="youtube-thumbnail">
                        <img src="https://img.youtube.com/vi/${project.mediaUrl}/hqdefault.jpg"
                             alt="${project.name}" class="project-media"
                             onerror="this.classList.add('media-error')">
                        <div class="youtube-play-btn">
                            <i class="fab fa-youtube"></i>
                        </div>
                    </div>
                </div>
            `;
            mediaIcon = '<i class="fab fa-youtube project-media-icon youtube-icon"></i>';
        } else {
            mediaContent = getPlaceholder();
        }

        html += `
            <div class="project-item" data-project-id="${project.id}" data-media-type="${project.mediaType}" data-media-url="${project.mediaUrl || ''}">
                <div class="project-media-container">
                    ${mediaContent}
                    ${mediaIcon}
                </div>
                <div class="project-info">
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-desc">${project.description}</p>
                    <div class="project-meta">
                        ${project.category ? `<span class="project-category">${project.category}</span>` : ''}
                        ${project.client ? `<span class="project-client">${project.client}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Video və YouTube kontrollarını təmin et
    setupProjectMediaControls();
}

function setupProjectMediaControls() {
    // Video kontrolları
    document.querySelectorAll('.project-video-container').forEach(container => {
        const video = container.querySelector('video');
        const playBtn = container.querySelector('.video-play-btn');

        if (video && playBtn) {
            playBtn.addEventListener('click', function() {
                if (video.paused) {
                    video.play();
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                } else {
                    video.pause();
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
            });

            video.addEventListener('play', function() {
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            });

            video.addEventListener('pause', function() {
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            });
        }
    });

    // YouTube kontrolları
    document.querySelectorAll('.project-youtube-container').forEach(container => {
        const playBtn = container.querySelector('.youtube-play-btn');

        if (playBtn) {
            playBtn.addEventListener('click', function() {
                const projectItem = this.closest('.project-item');
                const youtubeId = projectItem.dataset.mediaUrl;

                if (youtubeId) {
                    // YouTube iframe aç
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = '0';

                    container.innerHTML = '';
                    container.appendChild(iframe);
                }
            });
        }
    });
}

// ==================== SLIDER FUNKSİYALARI ====================

function setupProjectSlider() {
    const slider = document.getElementById('projects-container');
    const prevBtn = document.getElementById('project-prev-btn');
    const nextBtn = document.getElementById('project-next-btn');

    if (!slider || !prevBtn || !nextBtn) {
        console.error('❌ Slider elementləri tapılmadı');
        return;
    }

    console.log('🎬 Layihə slider-i quraşdırılır...');

    // Düymələrin vəziyyətini yenilə
    const updateButtons = () => {
        const isAtStart = slider.scrollLeft <= 10;
        const isAtEnd = Math.ceil(slider.scrollLeft) >= slider.scrollWidth - slider.clientWidth - 10;

        prevBtn.classList.toggle('is-hidden', isAtStart);
        nextBtn.classList.toggle('is-hidden', isAtEnd);

        // ARIA attributes
        prevBtn.setAttribute('aria-disabled', isAtStart);
        nextBtn.setAttribute('aria-disabled', isAtEnd);
    };

    // Scroll event listener
    slider.addEventListener('scroll', updateButtons, { passive: true });

    // Resize event listener
    window.addEventListener('resize', updateButtons, { passive: true });

    // Növbəti düyməsi
    nextBtn.addEventListener('click', () => {
        scrollToNextItem(slider);
    });

    // Əvvəlki düyməsi
    prevBtn.addEventListener('click', () => {
        scrollToPrevItem(slider);
    });

    // Keyboard navigation
    slider.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollToPrevItem(slider);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollToNextItem(slider);
        }
    });

    // Touch/swipe support
    let startX = 0;
    let scrollLeft = 0;
    let isDragging = false;

    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX;
        scrollLeft = slider.scrollLeft;
        isDragging = true;
        slider.classList.add('dragging');
    }, { passive: true });

    slider.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    });

    slider.addEventListener('touchend', () => {
        isDragging = false;
        slider.classList.remove('dragging');
    });

    // Mouse drag support
    slider.addEventListener('mousedown', (e) => {
        startX = e.pageX;
        scrollLeft = slider.scrollLeft;
        isDragging = true;
        slider.classList.add('dragging');
        e.preventDefault();
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.pageX;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    });

    slider.addEventListener('mouseup', () => {
        isDragging = false;
        slider.classList.remove('dragging');
    });

    slider.addEventListener('mouseleave', () => {
        isDragging = false;
        slider.classList.remove('dragging');
    });

    // İlkin vəziyyəti təyin et
    updateButtons();
}

function scrollToNextItem(slider) {
    if (!slider) return;

    const items = slider.querySelectorAll('.project-item');
    if (items.length === 0) return;

    // Cari görünən elementləri tap
    const containerWidth = slider.clientWidth;
    const itemWidth = items[0].offsetWidth;
    const gap = 30; // CSS-dəki gap dəyəri
    const itemsPerView = Math.floor((containerWidth + gap) / (itemWidth + gap));

    // Cari scroll pozisiyasına əsasən növbəti qrupa keç
    const currentScroll = slider.scrollLeft;
    const scrollAmount = itemsPerView * (itemWidth + gap);

    slider.scrollTo({
        left: currentScroll + scrollAmount,
        behavior: 'smooth'
    });
}

function scrollToPrevItem(slider) {
    if (!slider) return;

    const items = slider.querySelectorAll('.project-item');
    if (items.length === 0) return;

    // Cari görünən elementləri tap
    const containerWidth = slider.clientWidth;
    const itemWidth = items[0].offsetWidth;
    const gap = 30;
    const itemsPerView = Math.floor((containerWidth + gap) / (itemWidth + gap));

    // Cari scroll pozisiyasına əsasən əvvəlki qrupa keç
    const currentScroll = slider.scrollLeft;
    const scrollAmount = itemsPerView * (itemWidth + gap);

    slider.scrollTo({
        left: Math.max(0, currentScroll - scrollAmount),
        behavior: 'smooth'
    });
}

// ==================== ADMIN PANEL ƏLAQƏSİ ====================

function connectToAdminPanel() {
    console.log('🔗 Admin panel ilə əlaqə qurulur...');

    // Admin panel açıqdırsa, xidmətləri soruş
    if (window.opener && !window.opener.closed) {
        try {
            // Xidmətləri soruş
            window.opener.postMessage({
                type: 'GET_SERVICES'
            }, '*');

            // Partnyorları soruş
            window.opener.postMessage({
                type: 'GET_PARTNERS'
            }, '*');

            console.log('📤 Admin panelyə sorğular göndərildi');
        } catch (error) {
            console.error('❌ Admin panelyə sorğu göndərilmədi:', error);
        }
    }

    // Message listener
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'SERVICES_DATA') {
            console.log('📥 Admin paneldən xidmətlər alındı:', event.data.services.length);

            // LocalStorage-a yadda saxla
            localStorage.setItem('guvenfinans-active-services', JSON.stringify(event.data.services));

            // Render et
            renderServicesOnPage(event.data.services);
        }

        if (event.data && event.data.type === 'UPDATE_SERVICES') {
            console.log('🔄 Admin paneldən xidmət yeniləməsi alındı');

            // LocalStorage-a yadda saxla
            localStorage.setItem('guvenfinans-active-services', JSON.stringify(event.data.services));

            // Render et
            renderServicesOnPage(event.data.services);
        }

        if (event.data && event.data.type === 'PARTNERS_DATA') {
            console.log('📥 Admin paneldən partnyorlar alındı:', event.data.partners.length);

            // LocalStorage-a yadda saxla
            localStorage.setItem('guvenfinans-partners', JSON.stringify(event.data.partners));

            // Render et
            renderPartners(event.data.partners);
        }

        if (event.data && event.data.type === 'UPDATE_PARTNERS') {
            console.log('🔄 Admin paneldən partnyor yeniləməsi alındı');

            // LocalStorage-a yadda saxla
            localStorage.setItem('guvenfinans-partners', JSON.stringify(event.data.partners));

            // Render et
            renderPartners(event.data.partners);
        }

        if (event.data && event.data.type === 'UPDATE_PROJECTS') {
            console.log('🔄 Admin paneldən layihə yeniləməsi alındı');
            renderProjectsOnPage(event.data.projects);
        }
    });
}

// ==================== LOCALSTORAGE EVENT LISTENER ====================

window.addEventListener('storage', function(event) {
    console.log('📦 Storage event:', event.key);

    if (event.key === 'guvenfinans-active-services') {
        console.log('🔄 Xidmətlər yenilənir...');

        try {
            if (event.newValue) {
                const services = JSON.parse(event.newValue);
                renderServicesOnPage(services);
                console.log('✅ Xidmətlər avtomatik yeniləndi');
            }
        } catch (error) {
            console.error('❌ Xidmətlər yenilənərkən xəta:', error);
        }
    }

    if (event.key === 'guvenfinans-partners') {
        console.log('🔄 Partnyorlar yenilənir...');

        try {
            if (event.newValue) {
                const partners = JSON.parse(event.newValue);
                renderPartners(partners);
                console.log('✅ Partnyorlar avtomatik yeniləndi');
            }
        } catch (error) {
            console.error('❌ Partnyorlar yenilənərkən xəta:', error);
        }
    }

    if (event.key === 'guvenfinans-projects') {
        console.log('🔄 Layihələr yenilənir...');

        try {
            if (event.newValue) {
                const projects = JSON.parse(event.newValue);
                renderProjectsOnPage(projects);
                console.log('✅ Layihələr avtomatik yeniləndi');
            }
        } catch (error) {
            console.error('❌ Layihələr yenilənərkən xəta:', error);
        }
    }

    // Auth status dəyişiklikləri
    if (event.key === 'auth_token' || event.key === 'guven_token' || event.key === 'user_email') {
        console.log('🔄 Auth status dəyişdi, yenilənir...');
        setTimeout(() => {
            checkAuthStatus();
        }, 100);
    }
});

// ==================== İNİT FUNKSİYALARI ====================

function initializePage() {
    console.log('🏠 Ana səhifə başladılır...');

    // Auth statusunu yoxla (ƏN ƏVVƏL)
    checkAuthStatus();

    // Profil düymələrini quraşdır
    setupProfileButtons();

    // Xidmətləri yüklə
    loadServicesFromStorage();

    // Partnyorları yüklə
    loadPartners();

    // Admin panel ilə əlaqə qur
    connectToAdminPanel();

    // Layihələri yüklə (ən sonra)
    setTimeout(() => {
        loadProjects();
    }, 100);

    // Hər 5 saniyədən bir auth statusunu yenilə
    setInterval(() => {
        checkAuthStatus();
    }, 5000);

    // Stats animasiyası
    animateStats();
}

// Stats animasiyası
function animateStats() {
    const stats = document.querySelectorAll('.stat-count');
    if (stats.length === 0) return;

    let animationStarted = false;

    function startAnimation() {
        if (animationStarted) return;

        stats.forEach(stat => {
            const text = stat.textContent;
            const numberMatch = text.match(/\d+/);
            if (!numberMatch) return;

            const targetValue = parseInt(numberMatch[0]);
            const suffix = text.replace(numberMatch[0], '');
            const duration = 1500;
            const startTime = Date.now();
            const startValue = 0;

            function updateCounter() {
                const currentTime = Date.now();
                const progress = Math.min((currentTime - startTime) / duration, 1);
                const currentValue = Math.floor(progress * targetValue);

                stat.textContent = currentValue + suffix;

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                }
            }

            updateCounter();
        });

        animationStarted = true;
    }

    // Intersection Observer ilə scroll-da animasiya başlat
    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startAnimation();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        observer.observe(statsSection);
    }
}

// Sayt tam yüklənəndə auth statusunu yenilə
window.addEventListener('load', function() {
    console.log('🔄 Sayt tam yükləndi, auth statusu yoxlanılır...');
    setTimeout(() => {
        checkAuthStatus();
    }, 500);
});