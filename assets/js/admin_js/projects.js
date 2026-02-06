// assets/js/admin_js/projects.js

let currentProjectId = null;
let projectsData = [];



// Media tipinə görə inputları göstər/gizlət
window.toggleMediaInput = function() {
    console.log('🔘 toggleMediaInput çağırıldı');
    const mediaType = document.getElementById('projectMediaType').value;
    console.log('Media tipi seçildi:', mediaType);

    // Bütün input qruplarını gizlət
    document.getElementById('imageInputGroup').classList.add('hidden');
    document.getElementById('videoInputGroup').classList.add('hidden');
    document.getElementById('youtubeInputGroup').classList.add('hidden');

    // Seçilən input qrupunu göstər
    if (mediaType === 'image') {
        document.getElementById('imageInputGroup').classList.remove('hidden');
        console.log('✅ Şəkil inputu göstərildi');

        // Şəkil yükləmə düyməsini əlavə et
        setTimeout(() => addFileUploadButton('projectImage', 'image'), 100);
    } else if (mediaType === 'video') {
        document.getElementById('videoInputGroup').classList.remove('hidden');
        console.log('✅ Video inputu göstərildi');

        // Video yükləmə düyməsini əlavə et
        setTimeout(() => addFileUploadButton('projectVideo', 'video'), 100);
    } else if (mediaType === 'youtube') {
        document.getElementById('youtubeInputGroup').classList.remove('hidden');
        console.log('✅ YouTube inputu göstərildi');
    }

    // Preview-i yenilə
    updateMediaPreview();
};

// Media preview-i yenilə
function updateMediaPreview() {
    console.log('🔘 updateMediaPreview çağırıldı');
    const mediaType = document.getElementById('projectMediaType').value;
    let mediaUrl = '';

    if (mediaType === 'image') {
        mediaUrl = document.getElementById('projectImage').value;
    } else if (mediaType === 'video') {
        mediaUrl = document.getElementById('projectVideo').value;
    } else if (mediaType === 'youtube') {
        mediaUrl = document.getElementById('projectYoutube').value;
    }

    const previewContainer = document.getElementById('mediaPreviewContainer');
    const preview = document.getElementById('mediaPreview');

    if (!previewContainer || !preview) {
        console.error('❌ Preview elementləri tapılmadı');
        return;
    }

    if (!mediaUrl) {
        previewContainer.style.display = 'none';
        console.log('⚠️ Media URL yoxdur, preview gizlədildi');
        return;
    }

    let previewHtml = '';

    if (mediaType === 'image') {
        previewHtml = `
            <div style="text-align:center;">
                <img src="${mediaUrl}" alt="Şəkil preview" 
                     style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; border: 1px solid #ddd;"
                     onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\'padding: 20px; text-align: center; color: #666;\'>Şəkil yüklənmədi</div>'">
                <div style="margin-top:10px;font-size:12px;color:#666;">Şəkil Önizləməsi</div>
            </div>
        `;
    } else if (mediaType === 'video') {
        previewHtml = `
            <div style="text-align:center;">
                <video controls style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid #ddd;">
                    <source src="${mediaUrl}" type="video/mp4">
                    Video dəstəklənmir
                </video>
                <div style="margin-top:10px;font-size:12px;color:#666;">
                    Video Önizləməsi (Kontrollar ilə oynaya bilərsiniz)
                </div>
            </div>
        `;
    } else if (mediaType === 'youtube') {
        previewHtml = `
            <div style="text-align:center;">
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; border: 1px solid #ddd;">
                    <iframe 
                        src="https://www.youtube.com/embed/${mediaUrl}" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>
                <div style="margin-top:10px;font-size:12px;color:#666;">
                    YouTube Video Önizləməsi
                </div>
            </div>
        `;
    }

    preview.innerHTML = previewHtml;
    previewContainer.style.display = 'block';
    console.log('✅ Media preview yeniləndi:', mediaType);
}

// Layihə placeholder generator
function getProjectPlaceholder(name, mediaType = 'image') {
    const colors = ['007bff', '28a745', 'dc3545', 'ffc107', '17a2b8'];
    const color = colors[Math.abs(name.length) % colors.length];
    const text = name.substring(0, 2).toUpperCase();

    if (mediaType === 'video') {
        return `<div style="width:100%;height:100%;background:linear-gradient(135deg, #${color}, #${colors[(Math.abs(name.length)+1)%colors.length]});color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px;">
                    <i class="fas fa-play-circle" style="font-size:48px;margin-bottom:10px;"></i>
                    <span style="font-size:14px;font-weight:bold;">${text}</span>
                </div>`;
    } else if (mediaType === 'youtube') {
        return `<div style="width:100%;height:100%;background:linear-gradient(135deg, #ff0000, #cc0000);color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px;">
                    <i class="fab fa-youtube" style="font-size:48px;margin-bottom:10px;"></i>
                    <span style="font-size:14px;font-weight:bold;">${text}</span>
                </div>`;
    }

    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23${color}"/><text x="50%" y="50%" font-family="Arial" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">${text}</text></svg>`;
}

// Ana səhifəyə məlumat göndərmək
window.sendProjectsToMainPage = function() {
    console.log('📤 Ana səhifəyə layihələr göndərilir...');
    try {
        if (window.opener && !window.opener.closed) {
            const activeProjects = projectsData.filter(p => p.active)
                .sort((a, b) => a.order - b.order);

            window.opener.postMessage({
                type: 'UPDATE_PROJECTS',
                projects: activeProjects
            }, '*');
            console.log('✅ Ana səhifəyə layihələr göndərildi:', activeProjects.length);
        }

        localStorage.setItem('guvenfinans-projects', JSON.stringify(projectsData));
        console.log('💾 Layihələr localStorage-a saxlandı');
    } catch (error) {
        console.error('❌ Ana səhifəyə layihələr göndərilmədi:', error);
    }
};

// Layihələri yüklə
window.loadProjects = function() {
    console.log('🔄 loadProjects çağırıldı');

    const savedProjects = localStorage.getItem('guvenfinans-projects');

    if (savedProjects) {
        try {
            projectsData = JSON.parse(savedProjects);
            console.log('📁 LocalStorage-dan yüklənən layihələr:', projectsData.length);
        } catch (error) {
            console.error('❌ JSON parse xətası:', error);
            loadDefaultProjects();
        }
    } else {
        loadDefaultProjects();
    }

    renderProjectsTable();
    updateProjectPreview();
};

function loadDefaultProjects() {
    console.log('📂 Default layihələr yüklənir...');
    projectsData = [
        {
            id: 1,
            name: "ERP Sistem İmplementasiyası",
            mediaType: "image",
            mediaUrl: "",
            description: "Böyük şirkət üçün ERP sisteminin tam implementasiyası",
            fullDescription: "Bu layihədə müştərimiz üçün tam funksional ERP sistemini implement etdik. Sistemə maliyyə, inventar, satış və insan resursları modulları daxildir. Müştərinin bütün biznes prosesləri avtomatlaşdırıldı və hesabat sistemləri quruldu.",
            category: "ERP",
            client: "ABC Şirkəti",
            startDate: "2023-01-15",
            endDate: "2023-06-30",
            order: 1,
            active: true
        },
        {
            id: 2,
            name: "CRM Sistem Demo",
            mediaType: "video",
            mediaUrl: "",
            description: "CRM sisteminin işləmə prinsipi",
            fullDescription: "CRM sistemimizin demo videosu. Sistem müştəri münasibətlərinin idarə edilməsi, satış proseslərinin avtomatlaşdırılması və hesabatların yaradılması üçün hazırlanmışdır.",
            category: "CRM",
            client: "XYZ Corp",
            startDate: "2023-03-01",
            endDate: "2023-08-15",
            order: 2,
            active: true
        },
        {
            id: 3,
            name: "Mobil Bankçılıq Tətbiqi",
            mediaType: "youtube",
            mediaUrl: "dQw4w9WgXcQ",
            description: "Bank üçün innovativ mobil tətbiq",
            fullDescription: "Bank müştəriləri üçün iOS və Android platformalarında işləyən tam funksional mobil bankçılıq tətbiqi hazırladıq. Tətbiqə pul köçürmələri, ödənişlər, hesab balansı və kart idarəetməsi daxildir.",
            category: "Mobil Tətbiq",
            client: "Milli Bank",
            startDate: "2023-05-10",
            endDate: "2023-11-20",
            order: 3,
            active: true
        },
        {
            id: 4,
            name: "Veb Sayt Redizaynı",
            mediaType: "image",
            mediaUrl: "",
            description: "Müasir və istifadəçi dostu veb sayt dizaynı",
            fullDescription: "Müştərinin köhnəlmiş veb saytını tamamilə yenidən dizayn etdik. Yeni sayt mobil uyğun, sürətli və SEO optimallaşdırılmışdır.",
            category: "Veb Dizayn",
            client: "Tech Solutions",
            startDate: "2023-02-20",
            endDate: "2023-04-15",
            order: 4,
            active: true
        }
    ];

    localStorage.setItem('guvenfinans-projects', JSON.stringify(projectsData));
    console.log('✅ Default layihələr yükləndi və saxlandı');
}

function renderProjectsTable() {
    console.log('🎨 Layihələr cədvəli render edilir...');
    const tableBody = document.getElementById('projectsListBody');
    if (!tableBody) {
        console.error('❌ projectsListBody tapılmadı');
        return;
    }

    if (projectsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Heç bir layihə tapılmadı</td>
            </tr>
        `;
        console.log('⚠️ Heç bir layihə yoxdur');
        return;
    }

    const sortedProjects = [...projectsData].sort((a, b) => a.order - b.order);

    let html = '';

    sortedProjects.forEach((project, index) => {
        const placeholder = getProjectPlaceholder(project.name, project.mediaType);
        let mediaIcon = '';
        let mediaTypeText = '';

        if (project.mediaType === 'video') {
            mediaIcon = '<i class="fas fa-video ml-5" style="color:#dc3545;"></i>';
            mediaTypeText = '<span class="badge badge-danger ml-2">Video</span>';
        } else if (project.mediaType === 'youtube') {
            mediaIcon = '<i class="fab fa-youtube ml-5" style="color:#ff0000;"></i>';
            mediaTypeText = '<span class="badge badge-danger ml-2" style="background:#ff0000;">YouTube</span>';
        } else {
            mediaTypeText = '<span class="badge badge-primary ml-2">Şəkil</span>';
        }

        html += `
            <tr data-project-id="${project.id}">
                <td>${index + 1}</td>
                <td>
                    <div style="display:flex;align-items:center;">
                        <strong>${project.name}</strong> 
                        ${mediaIcon}
                        ${mediaTypeText}
                    </div>
                </td>
                <td>
                    <div style="width:80px;height:60px;display:flex;align-items:center;justify-content:center;border:1px solid #ddd;border-radius:4px;overflow:hidden;background:#f8f9fa;cursor:pointer;" onclick="viewProject(${project.id})">
                        ${project.mediaUrl ? 
                            (project.mediaType === 'image' ? 
                                `<img src="${project.mediaUrl}" alt="${project.name}" 
                                      style="width:100%;height:100%;object-fit:cover;"
                                      onerror="this.onerror=null; this.parentElement.innerHTML='${placeholder}'">` :
                                project.mediaType === 'video' ?
                                `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #007bff, #0056b3);color:white;">
                                    <i class="fas fa-play-circle" style="font-size:24px;"></i>
                                </div>` :
                                `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#ff0000;color:white;">
                                    <i class="fab fa-youtube" style="font-size:24px;"></i>
                                </div>`
                            ) : 
                            placeholder
                        }
                    </div>
                </td>
                <td style="max-width:200px;">
                    <div style="font-size:12px;color:#666;line-height:1.4;">
                        ${project.description}
                        ${project.category ? `<div class="mt-5"><strong>Kateqoriya:</strong> ${project.category}</div>` : ''}
                        ${project.client ? `<div><strong>Müştəri:</strong> ${project.client}</div>` : ''}
                    </div>
                </td>
                <td>${project.order}</td>
                <td>
                    <span class="badge ${project.active ? 'badge-success' : 'badge-secondary'}">
                        ${project.active ? 'Aktiv' : 'Deaktiv'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProject(${project.id})" title="Redaktə et">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="viewProject(${project.id})" title="Bax">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="toggleProjectActive(${project.id})" title="${project.active ? 'Deaktiv et' : 'Aktiv et'}">
                        <i class="fas fa-power-off"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProject(${project.id})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
    console.log('✅ Layihələr cədvəli render edildi');
}

function updateProjectPreview(project = null) {
    console.log('🔘 updateProjectPreview çağırıldı');
    const preview = document.getElementById('projectPreview');
    if (!preview) {
        console.error('❌ projectPreview tapılmadı');
        return;
    }

    if (!project) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <p>Soldan layihə seçin və ya yeni layihə yaradın.</p>
            </div>
        `;
        console.log('⚠️ Preview üçün layihə yoxdur');
        return;
    }

    let mediaHtml = '';
    const placeholder = getProjectPlaceholder(project.name, project.mediaType);

    if (project.mediaUrl) {
        if (project.mediaType === 'image') {
            mediaHtml = `
                <img src="${project.mediaUrl}" alt="${project.name}" 
                     style="width:100%;max-width:400px;height:200px;object-fit:cover;border-radius:8px;border:2px solid #ddd;margin:0 auto;display:block;"
                     onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='${placeholder}'">
            `;
        } else if (project.mediaType === 'video') {
            mediaHtml = `
                <div style="position:relative;width:100%;max-width:400px;height:200px;border-radius:8px;overflow:hidden;background:#000;margin:0 auto;border:2px solid #ddd;">
                    <video controls style="width:100%;height:100%;">
                        <source src="${project.mediaUrl}" type="video/mp4">
                        Video dəstəklənmir
                    </video>
                    <div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.7);color:white;padding:5px 10px;border-radius:4px;font-size:12px;">
                        <i class="fas fa-play"></i> Video
                    </div>
                </div>
            `;
        } else if (project.mediaType === 'youtube') {
            mediaHtml = `
                <div style="position:relative;width:100%;max-width:400px;padding-bottom:56.25%;height:0;border-radius:8px;overflow:hidden;margin:0 auto;border:2px solid #ddd;">
                    <iframe 
                        src="https://www.youtube.com/embed/${project.mediaUrl}" 
                        style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                    <div style="position:absolute;top:10px;left:10px;background:rgba(255,0,0,0.7);color:white;padding:5px 10px;border-radius:4px;font-size:12px;">
                        <i class="fab fa-youtube"></i> YouTube
                    </div>
                </div>
            `;
        }
    } else {
        mediaHtml = `
            <div style="width:100%;max-width:400px;height:200px;margin:0 auto;border-radius:8px;overflow:hidden;border:2px solid #ddd;">
                ${placeholder}
            </div>
        `;
    }

    // Tarixi formatla
    const formatDate = (dateStr) => {
        if (!dateStr) return '?';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('az-AZ');
        } catch (error) {
            return '?';
        }
    };

    preview.innerHTML = `
        <div class="preview-card" style="background:#f8f9ff;border:2px solid #28a745;border-radius:8px;padding:20px;">
            <div class="preview-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #ddd;">
                <h4 style="color:#2c3e50;margin:0;">${project.name}</h4>
                <div>
                    <span class="badge ${project.active ? 'badge-success' : 'badge-danger'}">
                        ${project.active ? 'Aktiv' : 'Deaktiv'}
                    </span>
                    <span class="badge ${project.mediaType === 'image' ? 'badge-primary' : project.mediaType === 'video' ? 'badge-danger' : 'badge-danger'}" style="background:${project.mediaType === 'youtube' ? '#ff0000' : ''}">
                        ${project.mediaType === 'image' ? 'Şəkil' : project.mediaType === 'video' ? 'Video' : 'YouTube'}
                    </span>
                </div>
            </div>
            
            <div class="preview-body">
                <div class="media-preview-large" style="margin-bottom:20px;">
                    ${mediaHtml}
                </div>
                
                <div class="project-info-preview" style="background:white;border-radius:8px;padding:15px;">
                    <p style="margin-bottom:10px;"><strong><i class="fas fa-align-left"></i> Açıqlama:</strong><br>${project.description}</p>
                    
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:15px;margin-top:15px;padding-top:15px;border-top:1px solid #eee;">
                        <div>
                            <p style="margin:0;"><strong><i class="fas fa-tag"></i> Kateqoriya:</strong><br>${project.category || 'Yoxdur'}</p>
                        </div>
                        <div>
                            <p style="margin:0;"><strong><i class="fas fa-user-tie"></i> Müştəri:</strong><br>${project.client || 'Yoxdur'}</p>
                        </div>
                        <div>
                            <p style="margin:0;"><strong><i class="fas fa-calendar"></i> Tarix:</strong><br>${formatDate(project.startDate)} - ${formatDate(project.endDate)}</p>
                        </div>
                        <div>
                            <p style="margin:0;"><strong><i class="fas fa-sort-numeric-up"></i> Sıra:</strong><br>${project.order}</p>
                        </div>
                        <div>
                            <p style="margin:0;"><strong><i class="fas fa-hashtag"></i> ID:</strong><br>${project.id}</p>
                        </div>
                    </div>
                    
                    ${project.fullDescription ? `
                        <div style="margin-top:15px;padding-top:15px;border-top:1px solid #eee;">
                            <p style="margin:0;"><strong><i class="fas fa-file-alt"></i> Tam Açıqlama:</strong><br>${project.fullDescription}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    console.log('✅ Layihə preview yeniləndi');
}

// Layihə əlavə et modalını göstər
window.showAddProjectModal = function() {
    console.log('🔘 showAddProjectModal çağırıldı');

    currentProjectId = null;

    const modal = document.getElementById('projectModal');
    if (modal) {
        document.getElementById('projectModalTitle').textContent = 'Yeni Layihə Əlavə Et';
        document.getElementById('projectId').value = '';
        document.getElementById('projectName').value = '';
        document.getElementById('projectMediaType').value = 'image';
        document.getElementById('projectImage').value = '';
        document.getElementById('projectVideo').value = '';
        document.getElementById('projectYoutube').value = '';
        document.getElementById('projectDescription').value = '';
        document.getElementById('projectFullDescription').value = '';
        document.getElementById('projectCategory').value = '';
        document.getElementById('projectClient').value = '';
        document.getElementById('projectStartDate').value = '';
        document.getElementById('projectEndDate').value = '';
        document.getElementById('projectOrder').value = projectsData.length > 0 ?
            Math.max(...projectsData.map(p => p.order)) + 1 : 1;
        document.getElementById('projectIsActive').checked = true;

        document.getElementById('mediaPreviewContainer').style.display = 'none';

        // Media inputları tənzimlə
        toggleMediaInput();

        if (typeof window.showModal !== 'undefined') {
            window.showModal('projectModal');
        } else {
            console.error('❌ showModal funksiyası yoxdur');
            modal.classList.remove('hidden');
        }

        console.log('✅ Yeni layihə modalı açıldı');
    } else {
        console.error('❌ projectModal tapılmadı');
        // Fallback: sadə prompt ilə
        const name = prompt('Yeni layihə adı:');
        if (name && name.trim() !== '') {
            const newProject = {
                id: projectsData.length > 0 ? Math.max(...projectsData.map(p => p.id)) + 1 : 1,
                name: name.trim(),
                mediaType: 'image',
                mediaUrl: '',
                description: '',
                fullDescription: '',
                category: '',
                client: '',
                startDate: '',
                endDate: '',
                order: projectsData.length > 0 ? Math.max(...projectsData.map(p => p.order)) + 1 : 1,
                active: true
            };
            projectsData.push(newProject);
            renderProjectsTable();
            updateProjectPreview(newProject);
            sendProjectsToMainPage();
            showSuccess('Yeni layihə əlavə edildi');
        }
    }
};

// Layihə redaktə et
window.editProject = function(projectId) {
    console.log('🔘 editProject çağırıldı:', projectId);

    const project = projectsData.find(p => p.id === projectId);
    if (!project) {
        console.error('❌ Layihə tapılmadı:', projectId);
        return;
    }

    currentProjectId = projectId;

    const modal = document.getElementById('projectModal');
    if (modal) {
        document.getElementById('projectModalTitle').textContent = 'Layihəni Redaktə Et';
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectMediaType').value = project.mediaType || 'image';
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('projectFullDescription').value = project.fullDescription || '';
        document.getElementById('projectCategory').value = project.category || '';
        document.getElementById('projectClient').value = project.client || '';
        document.getElementById('projectStartDate').value = project.startDate || '';
        document.getElementById('projectEndDate').value = project.endDate || '';
        document.getElementById('projectOrder').value = project.order;
        document.getElementById('projectIsActive').checked = project.active;

        // Media URL-i düzgün inputa qoy
        if (project.mediaType === 'image') {
            document.getElementById('projectImage').value = project.mediaUrl || '';
        } else if (project.mediaType === 'video') {
            document.getElementById('projectVideo').value = project.mediaUrl || '';
        } else if (project.mediaType === 'youtube') {
            document.getElementById('projectYoutube').value = project.mediaUrl || '';
        }

        // Media inputları tənzimlə
        toggleMediaInput();

        // Preview göstər
        if (project.mediaUrl) {
            updateMediaPreview();
        } else {
            document.getElementById('mediaPreviewContainer').style.display = 'none';
        }

        if (typeof window.showModal !== 'undefined') {
            window.showModal('projectModal');
        } else {
            console.error('❌ showModal funksiyası yoxdur');
            modal.classList.remove('hidden');
        }

        console.log('✅ Layihə redaktə modalı açıldı');
    } else {
        console.error('❌ projectModal tapılmadı');
        // Fallback: sadə prompt ilə
        const newName = prompt('Layihə adını dəyişin:', project.name);
        if (newName && newName.trim() !== '') {
            project.name = newName.trim();
            renderProjectsTable();
            updateProjectPreview(project);
            sendProjectsToMainPage();
            showSuccess('Layihə yeniləndi');
        }
    }
};

// Layihə yadda saxla
window.saveProject = function() {
    console.log('🔘 saveProject çağırıldı');

    const id = document.getElementById('projectId').value;
    const name = document.getElementById('projectName').value.trim();
    const mediaType = document.getElementById('projectMediaType').value;
    const description = document.getElementById('projectDescription').value.trim();
    const fullDescription = document.getElementById('projectFullDescription').value.trim();
    const category = document.getElementById('projectCategory').value.trim();
    const client = document.getElementById('projectClient').value.trim();
    const startDate = document.getElementById('projectStartDate').value;
    const endDate = document.getElementById('projectEndDate').value;
    const order = parseInt(document.getElementById('projectOrder').value) || 1;
    const active = document.getElementById('projectIsActive').checked;

    // Media URL-i al
    let mediaUrl = '';
    if (mediaType === 'image') {
        mediaUrl = document.getElementById('projectImage').value.trim();
    } else if (mediaType === 'video') {
        mediaUrl = document.getElementById('projectVideo').value.trim();
    } else if (mediaType === 'youtube') {
        mediaUrl = document.getElementById('projectYoutube').value.trim();
    }

    // Validation
    if (!name) {
        showError('Layihə adı daxil edilməlidir!');
        return;
    }

    if (!description) {
        showError('Qısa açıqlama daxil edilməlidir!');
        return;
    }

    if (mediaType === 'image' && mediaUrl && !isValidUrl(mediaUrl)) {
        showError('Şəkil URL düzgün formatda deyil!');
        return;
    }

    if (mediaType === 'video' && mediaUrl && !isValidUrl(mediaUrl)) {
        showError('Video URL düzgün formatda deyil!');
        return;
    }

    if (mediaType === 'youtube' && mediaUrl && mediaUrl.includes(' ')) {
        showError('YouTube Video ID boşluq olmamalıdır!');
        return;
    }

    let project;

    if (id) {
        // Update existing project
        project = projectsData.find(p => p.id === parseInt(id));
        if (project) {
            project.name = name;
            project.mediaType = mediaType;
            project.mediaUrl = mediaUrl;
            project.description = description;
            project.fullDescription = fullDescription;
            project.category = category;
            project.client = client;
            project.startDate = startDate;
            project.endDate = endDate;
            project.order = order;
            project.active = active;

            showSuccess('Layihə yeniləndi!');
            console.log('✅ Layihə yeniləndi:', project.id);
        }
    } else {
        // Add new project
        const newId = projectsData.length > 0 ? Math.max(...projectsData.map(p => p.id)) + 1 : 1;
        project = {
            id: newId,
            name,
            mediaType,
            mediaUrl,
            description,
            fullDescription,
            category,
            client,
            startDate,
            endDate,
            order,
            active
        };

        projectsData.push(project);
        showSuccess('Yeni layihə əlavə edildi!');
        console.log('✅ Yeni layihə əlavə edildi:', newId);
    }

    // Save to localStorage
    localStorage.setItem('guvenfinans-projects', JSON.stringify(projectsData));

    // Update table and preview
    renderProjectsTable();
    updateProjectPreview(project);

    // Send to main page
    sendProjectsToMainPage();

    // Close modal
    if (typeof window.closeModal !== 'undefined') {
        window.closeModal('projectModal');
    } else {
        const modal = document.getElementById('projectModal');
        if (modal) modal.classList.add('hidden');
    }
};

// Layihəni sil
window.deleteProject = function(projectId) {
    console.log('🔘 deleteProject çağırıldı:', projectId);

    const project = projectsData.find(p => p.id === projectId);
    if (!project) {
        console.error('❌ Layihə tapılmadı:', projectId);
        return;
    }

    currentProjectId = projectId;

    const deleteModal = document.getElementById('deleteProjectModal');
    if (deleteModal) {
        document.getElementById('deleteProjectMessage').textContent =
            `"${project.name}" layihəsini silmək istədiyinizə əminsiniz?`;

        if (typeof window.showModal !== 'undefined') {
            window.showModal('deleteProjectModal');
        } else {
            deleteModal.classList.remove('hidden');
        }

        console.log('✅ Silmə modalı açıldı');
    } else {
        console.error('❌ deleteProjectModal tapılmadı');
        // Fallback: confirm ilə
        if (confirm(`"${project.name}" layihəsini silmək istədiyinizə əminsiniz?`)) {
            projectsData = projectsData.filter(p => p.id !== projectId);
            localStorage.setItem('guvenfinans-projects', JSON.stringify(projectsData));
            renderProjectsTable();
            updateProjectPreview(null);
            sendProjectsToMainPage();
            showSuccess('Layihə silindi!');
        }
    }
};

// Silməni təsdiqlə
window.confirmDeleteProject = function() {
    console.log('🔘 confirmDeleteProject çağırıldı:', currentProjectId);

    if (currentProjectId) {
        projectsData = projectsData.filter(p => p.id !== currentProjectId);
        localStorage.setItem('guvenfinans-projects', JSON.stringify(projectsData));
        renderProjectsTable();
        updateProjectPreview(null);
        sendProjectsToMainPage();
        showSuccess('Layihə silindi!');

        if (typeof window.closeModal !== 'undefined') {
            window.closeModal('deleteProjectModal');
        } else {
            const modal = document.getElementById('deleteProjectModal');
            if (modal) modal.classList.add('hidden');
        }

        currentProjectId = null;
        console.log('✅ Layihə silindi');
    } else {
        console.error('❌ currentProjectId yoxdur');
    }
};

// Aktiv/deaktiv et
window.toggleProjectActive = function(projectId) {
    console.log('🔘 toggleProjectActive çağırıldı:', projectId);

    const project = projectsData.find(p => p.id === projectId);
    if (!project) {
        console.error('❌ Layihə tapılmadı:', projectId);
        return;
    }

    project.active = !project.active;
    localStorage.setItem('guvenfinans-projects', JSON.stringify(projectsData));
    renderProjectsTable();
    sendProjectsToMainPage();

    if (project.active) {
        showSuccess('Layihə aktiv edildi!');
    } else {
        showSuccess('Layihə deaktiv edildi!');
    }

    console.log('✅ Layihə aktivlik statusu dəyişdirildi:', project.active);
};

// Layihəyə bax
window.viewProject = function(projectId) {
    console.log('🔘 viewProject çağırıldı:', projectId);

    const project = projectsData.find(p => p.id === projectId);
    if (!project) {
        console.error('❌ Layihə tapılmadı:', projectId);
        return;
    }

    const viewModal = document.getElementById('viewProjectModal');
    if (viewModal) {
        document.getElementById('viewProjectName').textContent = project.name;
        document.getElementById('viewProjectDescription').textContent = project.description;
        document.getElementById('viewProjectFullDescription').textContent = project.fullDescription || 'Tam açıqlama yoxdur';
        document.getElementById('viewProjectCategory').textContent = project.category || 'Yoxdur';
        document.getElementById('viewProjectClient').textContent = project.client || 'Yoxdur';

        // Tarixləri formatla
        const formatDate = (dateStr) => {
            if (!dateStr) return 'Yoxdur';
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('az-AZ');
            } catch (error) {
                return 'Yoxdur';
            }
        };

        document.getElementById('viewProjectDates').textContent =
            `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`;

        document.getElementById('viewProjectOrder').textContent = project.order;
        document.getElementById('viewProjectStatus').textContent = project.active ? 'Aktiv' : 'Deaktiv';
        document.getElementById('viewProjectStatus').className = project.active ? 'badge badge-success' : 'badge badge-danger';

        // Media göstər
        const mediaContainer = document.getElementById('viewProjectMedia');
        let mediaHtml = '';

        if (project.mediaUrl) {
            if (project.mediaType === 'image') {
                mediaHtml = `
                    <div style="text-align:center;margin-bottom:15px;">
                        <img src="${project.mediaUrl}" alt="${project.name}" 
                             style="max-width:100%;max-height:300px;border-radius:8px;border:2px solid #ddd;"
                             onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\'padding: 40px; text-align: center; color: #666; background:#f8f9fa; border-radius:8px; border:1px solid #ddd;\'><i class=\'fas fa-image fa-3x mb-3\'></i><br>Şəkil yüklənmədi</div>'">
                        <div style="margin-top:10px;font-size:12px;color:#666;">Şəkil</div>
                    </div>
                `;
            } else if (project.mediaType === 'video') {
                mediaHtml = `
                    <div style="text-align:center;margin-bottom:15px;">
                        <div style="position:relative;padding-bottom:56.25%;height:0;border-radius:8px;overflow:hidden;border:2px solid #ddd;">
                            <video controls style="position:absolute;top:0;left:0;width:100%;height:100%;">
                                <source src="${project.mediaUrl}" type="video/mp4">
                                Video dəstəklənmir
                            </video>
                            <div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.7);color:white;padding:5px 10px;border-radius:4px;font-size:12px;">
                                <i class="fas fa-play"></i> Video
                            </div>
                        </div>
                        <div style="margin-top:10px;font-size:12px;color:#666;">Video</div>
                    </div>
                `;
            } else if (project.mediaType === 'youtube') {
                mediaHtml = `
                    <div style="text-align:center;margin-bottom:15px;">
                        <div style="position:relative;padding-bottom:56.25%;height:0;border-radius:8px;overflow:hidden;border:2px solid #ddd;">
                            <iframe 
                                src="https://www.youtube.com/embed/${project.mediaUrl}" 
                                style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen>
                            </iframe>
                            <div style="position:absolute;top:10px;left:10px;background:rgba(255,0,0,0.7);color:white;padding:5px 10px;border-radius:4px;font-size:12px;">
                                <i class="fab fa-youtube"></i> YouTube
                            </div>
                        </div>
                        <div style="margin-top:10px;font-size:12px;color:#666;">YouTube Video</div>
                    </div>
                `;
            }
        } else {
            mediaHtml = `
                <div style="text-align:center;margin-bottom:15px;padding:40px;background:#f8f9fa;border-radius:8px;border:1px solid #ddd;">
                    <i class="fas fa-${project.mediaType === 'image' ? 'image' : project.mediaType === 'video' ? 'video' : 'youtube'} fa-3x mb-3" style="color:#aaa;"></i>
                    <br>
                    <span style="color:#666;">Media yüklənməyib</span>
                </div>
            `;
        }

        mediaContainer.innerHTML = mediaHtml;

        if (typeof window.showModal !== 'undefined') {
            window.showModal('viewProjectModal');
        } else {
            viewModal.classList.remove('hidden');
        }

        console.log('✅ Layihə baxış modalı açıldı');
    } else {
        console.error('❌ viewProjectModal tapılmadı');
        alert(`Layihə: ${project.name}\nAçıqlama: ${project.description}\nKateqoriya: ${project.category || 'Yoxdur'}\nMüştəri: ${project.client || 'Yoxdur'}`);
    }
};

// Export layihələr
window.exportProjects = function() {
    console.log('🔘 exportProjects çağırıldı');

    const dataStr = JSON.stringify(projectsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `guvenfinans-projects-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showSuccess('Layihələr uğurla export edildi!');
    console.log('✅ Layihələr export edildi');
};

// Import layihələr
window.importProjects = function() {
    console.log('🔘 importProjects çağırıldı');

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!Array.isArray(importedData)) {
                    throw new Error('Import edilən fayl düzgün formatda deyil');
                }

                if (confirm(`Import etmək ${importedData.length} layihə tapıldı. Əvvəlki layihələr silinsin mi? (Cancel basaraq yeni layihələr əlavə edə bilərsiniz)`)) {
                    projectsData = importedData;
                } else {
                    // Yeni ID-lər təyin et
                    const maxId = projectsData.length > 0 ? Math.max(...projectsData.map(p => p.id)) : 0;
                    importedData.forEach((project, index) => {
                        project.id = maxId + index + 1;
                    });
                    projectsData = [...projectsData, ...importedData];
                }

                localStorage.setItem('guvenfinans-projects', JSON.stringify(projectsData));
                renderProjectsTable();
                updateProjectPreview(null);
                sendProjectsToMainPage();
                showSuccess('Layihələr uğurla import edildi!');
                console.log('✅ Layihələr import edildi');
            } catch (error) {
                console.error('❌ Import xətası:', error);
                showError('Fayl oxuna bilmədi və ya formatı düzgün deyil!');
            }
        };

        reader.readAsText(file);
    };

    input.click();
};

// Sıra sıfırla
window.resetProjectOrders = function() {
    console.log('🔘 resetProjectOrders çağırıldı');

    if (!confirm('Bütün layihələrin sıra nömrələrini sıfırlamaq istədiyinizə əminsiniz?')) {
        return;
    }

    projectsData.forEach((project, index) => {
        project.order = index + 1;
    });

    localStorage.setItem('guvenfinans-projects', JSON.stringify(projectsData));
    renderProjectsTable();
    sendProjectsToMainPage();
    showSuccess('Sıra nömrələri sıfırlandı!');
    console.log('✅ Sıra nömrələri sıfırlandı');
};

// Sıranı yuxarı apar
window.moveProjectUp = function(projectId) {
    console.log('🔘 moveProjectUp çağırıldı:', projectId);

    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;

    const currentOrder = project.order;
    const prevProject = projectsData.find(p => p.order === currentOrder - 1);

    if (prevProject) {
        project.order = currentOrder - 1;
        prevProject.order = currentOrder;

        localStorage.setItem('guvenfinans-projects', JSON.stringify(projectsData));
        renderProjectsTable();
        sendProjectsToMainPage();
        console.log('✅ Layihə yuxarı aparıldı');
    }
};

// Sıranı aşağı apar
window.moveProjectDown = function(projectId) {
    console.log('🔘 moveProjectDown çağırıldı:', projectId);

    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;

    const currentOrder = project.order;
    const nextProject = projectsData.find(p => p.order === currentOrder + 1);

    if (nextProject) {
        project.order = currentOrder + 1;
        nextProject.order = currentOrder;

        localStorage.setItem('guvenfinans-projects', JSON.stringify(projectsData));
        renderProjectsTable();
        sendProjectsToMainPage();
        console.log('✅ Layihə aşağı aparıldı');
    }
};

// Fayl yükləmə funksiyaları
function showFileUploadModal(mediaType) {
    const modalHtml = `
        <div class="modal-overlay" id="fileUploadModal">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Fayl Yüklə</h3>
                    <button class="modal-close" onclick="closeModal('fileUploadModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="file-upload-container">
                        <div class="upload-area" id="uploadArea">
                            <i class="fas fa-cloud-upload-alt fa-3x" style="color:#007bff;"></i>
                            <p>Faylı bura sürüşdürün və ya klik edin</p>
                            <small>Dəstəklənən formatlar: ${mediaType === 'image' ? 'JPG, PNG, GIF, SVG' : 'MP4, WebM, OGG'}</small>
                            <input type="file" id="fileInput" accept="${mediaType === 'image' ? '.jpg,.jpeg,.png,.gif,.svg' : '.mp4,.webm,.ogg'}" style="display:none;">
                        </div>
                        <div class="upload-progress hidden" id="uploadProgress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill" style="width:0%"></div>
                            </div>
                            <div class="progress-text" id="progressText">0%</div>
                        </div>
                        <div class="upload-preview mt-20 hidden" id="uploadPreview"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeModal('fileUploadModal')">Ləğv et</button>
                    <button class="btn btn-primary" onclick="uploadFile('${mediaType}')" id="uploadBtn">Yüklə</button>
                </div>
            </div>
        </div>
    `;

    // Köhnə modalı sil
    const oldModal = document.getElementById('fileUploadModal');
    if (oldModal) oldModal.remove();

    // Yeni modal əlavə et
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Event listener-ları əlavə et
    setupUploadArea();

    // Modalı göstər
    document.getElementById('fileUploadModal').classList.remove('hidden');
}

function setupUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#007bff';
        uploadArea.style.backgroundColor = '#f0f8ff';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = '#f8f9fa';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = '#f8f9fa';

        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            showFilePreview();
        }
    });

    fileInput.addEventListener('change', showFilePreview);
}

function showFilePreview() {
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('uploadPreview');
    const uploadBtn = document.getElementById('uploadBtn');

    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    const fileType = file.type;

    preview.innerHTML = '';
    preview.classList.remove('hidden');

    if (fileType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <div style="text-align:center;">
                    <img src="${e.target.result}" alt="Preview" 
                         style="max-width:100%;max-height:200px;border-radius:8px;">
                    <p style="margin-top:10px;font-size:14px;">
                        <strong>${file.name}</strong><br>
                        ${(file.size / 1024).toFixed(2)} KB
                    </p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else if (fileType.startsWith('video/')) {
        preview.innerHTML = `
            <div style="text-align:center;">
                <video controls style="max-width:100%;max-height:200px;border-radius:8px;">
                    <source src="${URL.createObjectURL(file)}" type="${fileType}">
                    Video dəstəklənmir
                </video>
                <p style="margin-top:10px;font-size:14px;">
                    <strong>${file.name}</strong><br>
                    ${(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
            </div>
        `;
    }

    uploadBtn.disabled = false;
}

function uploadFile(mediaType) {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) {
        showError('Zəhmət olmasa fayl seçin!');
        return;
    }

    const file = fileInput.files[0];
    const maxSize = mediaType === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for videos

    if (file.size > maxSize) {
        showError(`Fayl çox böyükdür! Maksimum: ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);
        return;
    }

    // Progress bar-ı göstər
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadBtn = document.getElementById('uploadBtn');

    progressDiv.classList.remove('hidden');
    uploadBtn.disabled = true;

    // Burada real server upload funksiyası olmalıdır
    // Nümunə kimi simulasiya edirik
    simulateUpload(file, mediaType, progressFill, progressText, uploadBtn);
}

function simulateUpload(file, mediaType, progressFill, progressText, uploadBtn) {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;

        if (progress >= 100) {
            clearInterval(interval);

            // Upload tamamlandıqdan sonra
            setTimeout(() => {
                // Real serverdə fayl yüklənəndə URL qaytarılmalıdır
                // Nümunə kimi local URL istifadə edirik
                const fileUrl = URL.createObjectURL(file);

                // Əlaqəli input field-ə URL-i əlavə et
                if (mediaType === 'image') {
                    document.getElementById('projectImage').value = fileUrl;
                } else if (mediaType === 'video') {
                    document.getElementById('projectVideo').value = fileUrl;
                }

                // Preview-i yenilə
                updateMediaPreview();

                // Modalı bağla
                closeModal('fileUploadModal');

                showSuccess('Fayl uğurla yükləndi!');
            }, 500);
        }
    }, 200);
}

// File upload modalını bağlamaq
function closeFileUploadModal() {
    const modal = document.getElementById('fileUploadModal');
    if (modal) modal.classList.add('hidden');
}

// Yerli fayllar üçün əlavə et düyməsi
function addFileUploadButton(inputElementId, mediaType) {
    const inputElement = document.getElementById(inputElementId);
    if (!inputElement) return;

    const container = inputElement.parentElement;

    // Əgər əlavə et düyməsi artıq yoxdursa, əlavə et
    if (!container.querySelector('.file-upload-btn')) {
        const uploadBtn = document.createElement('button');
        uploadBtn.type = 'button';
        uploadBtn.className = 'btn btn-sm btn-outline file-upload-btn';
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Fayl Yüklə';
        uploadBtn.style.marginTop = '5px';
        uploadBtn.onclick = () => showFileUploadModal(mediaType);

        container.appendChild(uploadBtn);
    }
}

// Səhifə yükləndikdə layihələri yüklə
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOMContentLoaded - Projects.js');

    // Event listener-ları əlavə et
    const mediaInputs = ['projectImage', 'projectVideo', 'projectYoutube'];
    mediaInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', updateMediaPreview);
            input.addEventListener('change', updateMediaPreview);
        }
    });

    // Media type dəyişdikdə
    const mediaTypeSelect = document.getElementById('projectMediaType');
    if (mediaTypeSelect) {
        mediaTypeSelect.addEventListener('change', toggleMediaInput);
    }

    // Layihələri yüklə
    loadProjects();

    console.log('✅ Projects.js uğurla yükləndi');
});

// Global olaraq əlçatan et
window.projectsData = projectsData;
window.loadProjects = loadProjects;
window.renderProjectsTable = renderProjectsTable;
window.updateProjectPreview = updateProjectPreview;