// tableManager.js - TƏMİZLƏNİB - Təkrarlar silinib


const TableManager = {

    // Element references
    tableBodies: {
        active: null,
        archive: null,
        external: null
    },
    metaElements: {
        active: null,
        archive: null,
        external: null
    },

    // ==================== INITIALIZATION ====================
    initialize: function () {
        console.log('📊 TableManager initialize edilir...');

        // Get table bodies
        this.tableBodies.active = document.getElementById('tableBody');
        this.tableBodies.archive = document.getElementById('archiveTableBody');
        this.tableBodies.external = document.getElementById('externalTableBody');

        // Get meta elements
        this.metaElements.active = document.getElementById('tableMeta');
        this.metaElements.archive = document.getElementById('archiveMeta');
        this.metaElements.external = document.getElementById('externalMeta');

        console.log('✅ TableManager hazırdır');


        return this;
    },

    // ==================== TABLE RENDERING ====================
    renderTasksTable: function (tableType, tasks, append = false, currentPage = 1) {

        const tbody = this.tableBodies[tableType];
        if (!tbody) {
            console.error(`❌ ${tableType} tbody tapılmadı`);
            return;
        }

        if (!append) {
            tbody.innerHTML = '';
        }

        if (!tasks || tasks.length === 0) {
            this.showEmptyTable(tableType, tbody);
            return;
        }

        // Arrow function istifadə et
        tasks.forEach((task, index) => {
            try {
                const row = this.createTaskRow(tableType, task, index, currentPage);
                tbody.appendChild(row);
            } catch (error) {
                console.error(`❌ ${tableType} sətir yaradılarkən xəta:`, error);
            }
        });

        this.updateTableMeta(tableType, tasks.length);
    },

    // ==================== TASK ROW CREATION ====================
    createTaskRow: function (tableType, task, index, currentPage) {

        const row = document.createElement('tr');

        try {
            let html = '';


            // Əgər funksiya yoxdursa, alternativ
            if (!this.createExternalRowHTML || typeof this.createExternalRowHTML !== 'function') {
                console.error('❌ createExternalRowHTML funksiyası mövcud deyil!');
                // Fallback funksiya yaradın
                this.createExternalRowHTML = this.createFallbackExternalRowHTML || function () {
                    return `<td colspan="10">Funksiya yoxdur</td>`;
                };
            }

            if (!this.createActiveRowHTML || typeof this.createActiveRowHTML !== 'function') {
                console.error('❌ createActiveRowHTML funksiyası mövcud deyil!');
                // Fallback funksiya yaradın
                this.createActiveRowHTML = this.createFallbackActiveRowHTML || function () {
                    return `<td colspan="15">Funksiya yoxdur</td>`;
                };
            }

            switch (tableType) {
                case 'active':
                    html = this.createActiveRowHTML(task, index, currentPage);
                    break;
                case 'archive':
                    html = this.createArchiveRowHTML(task, index, currentPage);
                    break;
                case 'external':
                    html = this.createExternalRowHTML(task, index, currentPage);
                    break;
                default:
                    html = this.createActiveRowHTML(task, index, currentPage);
            }

            if (!html || typeof html !== 'string') {
                throw new Error(`HTML yaradıla bilmədi: ${typeof html}`);
            }

            row.innerHTML = html;

        } catch (error) {
            console.error(`❌ ${tableType} sətir yaradılarkən xəta:`, error);
            row.innerHTML = `<td colspan="20">Xəta: ${error.message}</td>`;
        }

        return row;
    },

    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    },

    // ==================== FALLBACK FUNCTIONS ====================
    // Əgər əsas funksiyalar yoxdursa, fallback funksiyalar
    createFallbackExternalRowHTML: function (task, index, currentPage) {
        console.log('⚠️ Fallback createExternalRowHTML istifadə olunur');
        const serialNumber = (currentPage - 1) * 20 + index + 1;

        return `
            <td>${serialNumber}</td>
            <td>${this.formatDate(task.created_at)}</td>
            <td>${this.escapeHtml(task.company_name || '-')}</td>
            <td>${this.escapeHtml(task.creator_name || '-')}</td>
            <td>${this.escapeHtml(task.assigned_to_name || 'Təyin edilməyib')}</td>
            <td>${this.escapeHtml(task.task_title || task.title || '-')}</td>
            <td>${this.truncateText(task.task_description || task.description || '', 50)}</td>
            <td>${this.formatDate(task.due_date)}</td>
            <td><span class="status-badge ${this.getStatusClass(task.status)}">${this.getStatusText(task.status)}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="TableManager.viewExternalTask(${task.id})">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        `;
    },

    createFallbackActiveRowHTML: function (task, index, currentPage) {
        console.log('⚠️ Fallback createActiveRowHTML istifadə olunur');
        const serialNumber = (currentPage - 1) * 20 + index + 1;

        return `
            <td>${serialNumber}</td>
            <td>${this.formatDate(task.created_at)}</td>
            <td>${this.escapeHtml(task.company_name || '-')}</td>
            <td>${this.escapeHtml(task.creator_name || '-')}</td>
            <td>${this.escapeHtml(task.assigned_to_name || 'Təyin edilməyib')}</td>
            <td>${this.formatDate(task.due_date)}</td>
            <td><span class="status-badge ${this.getStatusClass(task.status)}">${this.getStatusText(task.status)}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="TableManager.viewTaskDetails(${task.id})">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        `;
    },

    // ==================== EXTERNAL TABLE ROW ====================
    createExternalRowHTML: async function (task, index, currentPage) {
        console.log(`🔍 EXTERNAL TASK: task_external cədvəlindən`);

        const serialNumber = (currentPage - 1) * 20 + index + 1;

        // Əgər task external cədvəlindəndirsə, metadata-dan əsaz task məlumatlarını götür
        let originalTaskTitle = task.task_title;
        let originalCompanyName = task.company_name;

        if (task.metadata) {
            try {
                const metadata = JSON.parse(task.metadata);
                if (metadata.original_company_name) {
                    originalCompanyName = metadata.original_company_name;
                }
                if (metadata.original_task_title) {
                    originalTaskTitle = metadata.original_task_title;
                }
            } catch (e) {
                console.error('❌ External task metadata parse xətası:', e);
            }
        }

        // ✅ DEBUG: Digər şirkət task məlumatları
        console.log('🔍 EXTERNAL TASK OBYEKTI:', {
            id: task.id,
            title: task.task_title,
            company_id: task.company_id,
            viewable_company_id: task.viewable_company_id,
            company_name: task.company_name,
            source_company_name: task.source_company_name,
            creator_name: task.creator_name,
            metadata: task.metadata
        });

        const hourlyRate = task.hourly_rate || task.billing_rate || task.rate || 0;
        const durationMinutes = task.duration_minutes ||
            (task.estimated_hours ? task.estimated_hours * 60 : 0) ||
            (task.actual_hours ? task.actual_hours * 60 : 0) || 0;
        const calculatedSalary = this.calculateSalary(hourlyRate, durationMinutes);

        let creatorName = task.creator_name || task.created_by_name || `ID: ${task.created_by}`;
        console.log('👤 Yaradan adı (external):', creatorName);

        const executorName = task.assigned_to_name ||
            task.executor_name ||
            (task.assigned_to ? `İşçi ID: ${task.assigned_to}` : 'Təyin edilməyib');

        // ✅ YENİ: ŞİRKƏT ADI MƏNTİQİ (digər şirkətlər üçün)
        let displayCompanyName = '';

        // Əvvəlcə cache boşdursa yüklə
        if (!window.taskManager?.companyCache || Object.keys(window.taskManager.companyCache).length === 0) {
            console.log('⚠️ External: Company cache boşdur, avtomatik yüklənməsi tələb olunur');
            if (window.taskManager?.loadCompanyCache) {
                await window.taskManager.loadCompanyCache();
            }
        }

        // 1. Backend-dən gələn sahələrdən
        if (task.company_name && task.company_name !== 'null' && task.company_name.trim() !== '') {
            displayCompanyName = task.company_name;
            console.log(`🏢 Digər şirkət adı (company_name): ${displayCompanyName}`);
        } else if (task.source_company_name) {
            displayCompanyName = task.source_company_name;
            console.log(`🏢 Digər şirkət adı (source_company_name): ${displayCompanyName}`);
        }

        // 2. Metadata-dan
        if (!displayCompanyName && task.metadata) {
            try {
                const metadata = JSON.parse(task.metadata);
                console.log('📦 External metadata:', metadata);

                if (metadata.original_company_name) {
                    displayCompanyName = metadata.original_company_name;
                    console.log(`🏢 Digər şirkət adı (metadata.original): ${displayCompanyName}`);
                } else if (metadata.created_by_company_name) {
                    displayCompanyName = metadata.created_by_company_name;
                    console.log(`🏢 Digər şirkət adı (metadata.created_by): ${displayCompanyName}`);
                } else if (metadata.for_company) {
                    displayCompanyName = metadata.for_company;
                    console.log(`🏢 Digər şirkət adı (metadata.for_company): ${displayCompanyName}`);
                }
            } catch (e) {
                console.error('❌ External metadata parse xətası:', e);
            }
        }

        // 3. Cache-dən
        if (!displayCompanyName && task.company_id && window.taskManager?.companyCache) {
            const cachedCompanyName = window.taskManager.companyCache[task.company_id];
            if (cachedCompanyName) {
                displayCompanyName = cachedCompanyName;
                console.log(`🏢 Digər şirkət adı (cache): ${displayCompanyName}`);
            }
        }

        // 4. Əgər hələ də yoxdursa, viewable_company_id-dən
        if (!displayCompanyName && task.viewable_company_id && window.taskManager?.companyCache) {
            const viewableCompanyName = window.taskManager.companyCache[task.viewable_company_id];
            if (viewableCompanyName) {
                displayCompanyName = viewableCompanyName;
                console.log(`🏢 Digər şirkət adı (viewable cache): ${displayCompanyName}`);
            }
        }

        // 5. Fallback
        if (!displayCompanyName) {
            if (task.company_id) {
                displayCompanyName = `Şirkət ID: ${task.company_id}`;
                console.log(`🏢 Digər şirkət adı (fallback ID): ${displayCompanyName}`);
            } else if (task.viewable_company_id) {
                displayCompanyName = `Viewable Şirkət ID: ${task.viewable_company_id}`;
                console.log(`🏢 Digər şirkət adı (fallback viewable): ${displayCompanyName}`);
            } else {
                displayCompanyName = 'Digər şirkət';
                console.log(`🏢 Digər şirkət adı (default): ${displayCompanyName}`);
            }
        }

        const departmentName = task.department_name ||
            task.department?.name ||
            (task.department_id ? `Şöbə ID: ${task.department_id}` : '-');
        const workTypeName = task.work_type_name ||
            task.work_type?.name ||
            (task.work_type_id ? `İş növü ID: ${task.work_type_id}` : '-');

        const description = task.task_description || task.description || '';
        const notes = task.notes || '';

        const currentUser = window.taskManager?.userData;
        const currentUserId = currentUser?.userId;
        const isAssignedToMe = task.assigned_to == currentUserId;

        let statusButtons = '';
        let editButton = '';
        let commentsButton = '';
        let detailsButton = '';

        // Status butonlarını yarat
        if (isAssignedToMe) {
            if (task.status === 'pending') {
                statusButtons = `
                    <button class="btn btn-sm btn-success" onclick="TableManager.takeExternalTask(${task.id})" title="Bu işi götür">
                        <i class="fa-solid fa-hand-paper"></i> Götür
                    </button>
                `;
                editButton = '';
            } else if (task.status === 'in_progress') {
                statusButtons = `
                    <span class="badge bg-warning">İŞLƏNİR</span>
                    <button class="btn btn-sm btn-primary" onclick="TableManager.completeTask(${task.id}, 'external')" title="Bu işi tamamlandı et">
                        <i class="fa-solid fa-check"></i> Tamamla
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="TableManager.rejectTask(${task.id}, 'external')" title="Bu işi rədd et">
                        <i class="fa-solid fa-ban"></i> Rədd et
                    </button>
                `;
                editButton = `
                    <button class="btn btn-sm btn-warning" onclick="TableManager.openEditModal(${task.id}, 'external')" title="Taskı redaktə et">
                        <i class="fa-solid fa-edit"></i> Edit
                    </button>
                `;
            }
        } else if (task.status === 'pending') {
            // Başqaları üçün "götür" butonu
            statusButtons = `
                <button class="btn btn-sm btn-info" onclick="TableManager.takeTaskFromOthers(${task.id})" title="Bu işi özümə götür">
                    <i class="fa-solid fa-user-plus"></i> Götür
                </button>
            `;
        }

        // ✅ DEADLINE KONTROLU (external task üçün)
        const now = new Date();
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const isOverdue = dueDate && dueDate < now &&
            task.status !== 'completed' &&
            task.status !== 'rejected';

        // Deadline keçibsə qırmızı class əlavə et
        const dueDateClass = isOverdue ? 'text-danger fw-bold overdue-date' : '';
        const dueDateIcon = isOverdue ?
            '<i class="fa-solid fa-exclamation-triangle ms-1" title="Bu taskın vaxtı keçib! Edit-də deadline-i uzada bilərsiniz."></i>' : '';

        // Əgər task vaxtı keçibsə və pending-dirsə, xüsusi status göstər
        let statusBadgeHTML = '';
        if (isOverdue && task.status === 'overdue') {
            statusBadgeHTML = `
                <span class="badge bg-danger" title="GECİKMƏ!">
                    <i class="fa-solid fa-clock"></i> GECİKMƏ
                </span>
            `;
        } else {
            statusBadgeHTML = `
                <span class="status-badge ${this.getStatusClass(task.status)}">
                    ${this.getStatusText(task.status)}
                </span>
            `;
        }

        commentsButton = `
            <button class="btn btn-sm btn-outline-info" 
                    onclick="TableManager.viewTaskComments(${task.id})">
                <i class="fa-solid fa-comments"></i> 
                <span class="comment-count">${task.comment_count || 0}</span>
            </button>
        `;

        detailsButton = `
            <button class="btn btn-sm btn-secondary" onclick="TableManager.viewExternalTask(${task.id})" title="Detallara bax">
                <i class="fa-solid fa-eye"></i>
            </button>
        `;

        // ✅ FAYL SÜTUNU
        let fileColumnHTML = '';

        if (task.attachments && task.attachments.length > 0) {
            const attachments = Array.isArray(task.attachments) ? task.attachments : JSON.parse(task.attachments);
            const hasMultipleFiles = attachments.length > 1;
            const firstAttachment = attachments[0];

            const getFileIcon = (attachment) => {
                const mimeType = attachment.mime_type || '';
                const filename = attachment.filename || '';
                const isAudioRecording = attachment.is_audio_recording || false;

                if (isAudioRecording || mimeType.includes('audio/') ||
                    filename.includes('səs-qeydi') || filename.includes('recording')) {
                    return '<i class="fas fa-microphone text-primary"></i>';
                } else if (mimeType.includes('image/')) {
                    return '<i class="fas fa-image text-primary"></i>';
                } else if (mimeType.includes('video/')) {
                    return '<i class="fas fa-video text-danger"></i>';
                } else if (mimeType.includes('pdf')) {
                    return '<i class="fas fa-file-pdf text-danger"></i>';
                } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet') ||
                          filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
                    return '<i class="fas fa-file-excel text-success"></i>';
                } else if (mimeType.includes('word') || mimeType.includes('document') ||
                          filename.endsWith('.docx') || filename.endsWith('.doc')) {
                    return '<i class="fas fa-file-word text-primary"></i>';
                } else if (mimeType.includes('zip') || mimeType.includes('archive') ||
                          filename.endsWith('.zip') || filename.endsWith('.rar')) {
                    return '<i class="fas fa-file-archive text-warning"></i>';
                } else {
                    return '<i class="fas fa-file text-secondary"></i>';
                }
            };

            const formatFileName = (filename) => {
                if (!filename) return 'Fayl';
                if (filename.length > 15) {
                    return filename.substring(0, 12) + '...';
                }
                return filename;
            };

            if (!hasMultipleFiles) {
                const fileIcon = getFileIcon(firstAttachment);
                const fileName = formatFileName(firstAttachment.filename);

                fileColumnHTML = `
                    <div class="file-preview-single" 
                         onclick="TableManager.previewFile(
                             '${firstAttachment.file_id}', 
                             '${firstAttachment.filename}', 
                             '${firstAttachment.mime_type || ''}',
                             ${firstAttachment.is_audio_recording || false}
                         )" 
                         style="cursor: pointer;" 
                         title="${firstAttachment.filename}">
                        <div class="file-icon">${fileIcon}</div>
                        <div class="file-name">${fileName}</div>
                    </div>
                `;
            } else {
                fileColumnHTML = `
                    <div class="file-preview-multiple">
                        <div class="file-count-badge" onclick="TableManager.showTaskFiles(${task.id})" 
                             style="cursor: pointer;" title="${attachments.length} fayl - Hamısına bax">
                            <i class="fas fa-paperclip"></i>
                            <span>${attachments.length}</span>
                        </div>
                    </div>
                `;
            }
        } else {
            fileColumnHTML = '<span class="text-muted">-</span>';
        }

        // Əməliyyat butonlarını birləşdir
        const actionButtons = `
            ${editButton || ''}
            ${commentsButton}
            ${detailsButton}
        `;

        // ✅ ƏSAS MESAJ: DEADLINE KEÇƏNDƏ MESAJ VER
        let overdueMessage = '';
        if (isOverdue) {
            overdueMessage = `
                <div class="alert alert-warning alert-sm mt-2" style="padding: 4px 8px; font-size: 12px;">
                    <i class="fa-solid fa-info-circle"></i> 
                    <strong>Deadline keçib!</strong>
                </div>
            `;
        }

        // HTML-dəki sütun sırasına uyğun:
        return `
            <td class="text-center">${serialNumber}</td>
            <td>${this.formatDate(task.created_at)}</td>
            <td>${this.escapeHtml(displayCompanyName)}</td>
            <td>${this.escapeHtml(creatorName)}</td>
            <td>${this.escapeHtml(executorName)}</td>
            <td class="actions-col">
                <div class="action-buttons">
                    ${actionButtons}
                </div>
            </td>
            <td>${this.escapeHtml(workTypeName)}</td>
            <td class="description-col">
                <div class="description-container">
                    <div class="truncated-description" id="desc-${task.id}" style="display: ${description.length > 100 ? 'block' : 'none'}">
                        ${this.truncateText(description, 100)}
                    </div>
                    <div class="full-description" id="full-desc-${task.id}" style="display: none">
                        ${this.escapeHtml(description)}
                    </div>
                    ${description.length > 100 ? `
                    <button class="expand-btn" onclick="TableManager.toggleDescription(${task.id})" 
                            title="Tam açıqlamaya bax">
                        <i class="fas fa-expand-alt"></i> Tam bax
                    </button>
                    ` : ''}
                    ${overdueMessage}
                </div>
            </td>
            <td class="file-col">
                ${fileColumnHTML}
            </td>
            <td class="${dueDateClass}" title="${isOverdue ? 'Bu taskın vaxtı keçib! Edit-də deadline-i uzada bilərsiniz.' : ''}">
                ${this.formatDate(task.due_date || task.due_at)}
                ${dueDateIcon}
            </td>
            <td>
                <div class="status-section">
                    ${statusBadgeHTML}
                    ${statusButtons}
                </div>
            </td>
            <td>${this.formatDate(task.completed_date || task.completed_at)}</td>
            <td>${durationMinutes}</td>
            <td>${parseFloat(hourlyRate).toFixed(2)}</td>
            <td>${calculatedSalary} ₼</td>
            <td>${this.escapeHtml(departmentName)}</td>
        `;
    },



    // tableManager.js - createActiveRowHTML funksiyası
    createActiveRowHTML: function(task, index, currentPage) {
        console.log(`🔍 REAL createActiveRowHTML çağırıldı: task ${task.id}`);

        // ✅ ƏSAS DEBUG: Backend-dən gələn bütün sahələri göstər
        console.log('🔍 TASK OBYEKTI (FULL):', {
            id: task.id,
            title: task.task_title,
            // Şirkət sahələri
            company_id: task.company_id,
            target_company: task.target_company,
            target_company_name: task.target_company_name,
            company_name: task.company_name,
            viewable_company_id: task.viewable_company_id,
            creator_company: task.creator_company,
            creator_name: task.creator_name,
            // Metadata
            metadata: task.metadata,
            // Bütün sahələr
            allKeys: Object.keys(task)
        });

        // Hər bir sahəni ayrıca yoxla
        console.log('🔍 ŞİRKƏT SAHƏLƏRİ:');
        Object.keys(task).forEach(key => {
            if (key.includes('company') || key.includes('target') || key.includes('creator') || key.includes('viewable')) {
                console.log(`  ${key}: ${task[key]}`);
            }
        });

        const serialNumber = (currentPage - 1) * 20 + index + 1;
        const hourlyRate = task.hourly_rate || task.billing_rate || task.rate || 0;
        const durationMinutes = task.duration_minutes ||
                              (task.estimated_hours ? task.estimated_hours * 60 : 0) ||
                              (task.actual_hours ? task.actual_hours * 60 : 0) || 0;
        const calculatedSalary = this.calculateSalary(hourlyRate, durationMinutes);

        let creatorName = task.creator_name || task.created_by_name || `ID: ${task.created_by}`;
        console.log('👤 Yaradan adı (final):', creatorName);

        const executorName = task.assigned_to_name ||
                            task.executor_name ||
                            (task.assigned_to ? `İşçi ID: ${task.assigned_to}` : 'Təyin edilməyib');

        // ✅ YENİ VƏ ƏSAS ŞİRKƏT ADI MƏNTİQİ
        let displayCompanyName = '';

        // 1. Birbaşa backend-dən gələn `viewable_company_name` (əgər varsa)
        if (task.viewable_company_name && task.viewable_company_name.trim() !== '') {
            displayCompanyName = task.viewable_company_name;
            console.log(`🏢 Şirkət adı (viewable_company_name): ${displayCompanyName}`);
        }

        // 2. Əgər yoxdursa, viewable_company_id-dən şirkət adını tap
        else if (task.viewable_company_id && window.taskManager?.companyCache) {
            // TaskManager-in companyCache obyektindən şirkət adını tap
            const cachedCompanyName = window.taskManager.companyCache[task.viewable_company_id];
            if (cachedCompanyName) {
                displayCompanyName = cachedCompanyName;
                console.log(`🏢 Şirkət adı (cache from viewable_company_id:${task.viewable_company_id}): ${displayCompanyName}`);
            } else {
                console.log(`⚠️ viewable_company_id ${task.viewable_company_id} üçün cache tapılmadı`);
            }
        }

        // 3. Metadata-dan oxumağa çalış
        if (!displayCompanyName && task.metadata) {
            try {
                const metadata = JSON.parse(task.metadata);
                console.log('📦 Parsed metadata:', metadata);

                if (metadata.original_company_name) {
                    displayCompanyName = metadata.original_company_name;
                    console.log(`🏢 Şirkət adı (metadata.original): ${displayCompanyName}`);
                } else if (metadata.display_for) {
                    displayCompanyName = metadata.display_for;
                    console.log(`🏢 Şirkət adı (metadata.display_for): ${displayCompanyName}`);
                } else if (metadata.for_company) {
                    displayCompanyName = metadata.for_company;
                    console.log(`🏢 Şirkət adı (metadata.for_company): ${displayCompanyName}`);
                } else if (metadata.created_by_company_name) {
                    displayCompanyName = metadata.created_by_company_name;
                    console.log(`🏢 Şirkət adı (metadata.created_by_company_name): ${displayCompanyName}`);
                }
            } catch (e) {
                console.error('❌ Metadata parse xətası:', e);
            }
        }

        // 4. Əgər hələ də tapılmadısa, başqa field-lardan
        if (!displayCompanyName) {
            if (task.original_company_name) {
                displayCompanyName = task.original_company_name;
                console.log(`🏢 Şirkət adı (original): ${displayCompanyName}`);
            } else if (task.target_company_name) {
                displayCompanyName = task.target_company_name;
                console.log(`🏢 Şirkət adı (target): ${displayCompanyName}`);
            } else if (task.company_name) {
                displayCompanyName = task.company_name;
                console.log(`🏢 Şirkət adı (company): ${displayCompanyName}`);
            } else {
                // 5. ƏN SON: company_id-dən istifadə et
                if (task.company_id && window.taskManager?.companyCache) {
                    const companyFromCache = window.taskManager.companyCache[task.company_id];
                    if (companyFromCache) {
                        displayCompanyName = companyFromCache;
                        console.log(`🏢 Şirkət adı (cache from company_id:${task.company_id}): ${displayCompanyName}`);
                    } else {
                        // 6. FALLBACK: ID göstər
                        displayCompanyName = `Şirkət ID: ${task.company_id}`;
                        console.log(`🏢 Şirkət adı (fallback company ID): ${displayCompanyName}`);
                    }
                } else {
                    displayCompanyName = `Şirkət ID: ${task.company_id || 'Məlum deyil'}`;
                    console.log(`🏢 Şirkət adı (default): ${displayCompanyName}`);
                }
            }
        }

        // Company cache boşdursa, avtomatik yüklə
        if (!window.taskManager?.companyCache || Object.keys(window.taskManager.companyCache).length === 0) {
            console.log('⚠️ Company cache boşdur, avtomatik yüklənməsi tələb olunur');
            if (window.taskManager?.loadCompanyCache) {
                window.taskManager.loadCompanyCache();
            }
        }

        const departmentName = task.department_name ||
                              task.department?.name ||
                              (task.department_id ? `Şöbə ID: ${task.department_id}` : '-');
        const workTypeName = task.work_type_name ||
                            task.work_type?.name ||
                            (task.work_type_id ? `İş növü ID: ${task.work_type_id}` : '-');

        const description = task.task_description || task.description || '';

        // ✅ DEADLINE KONTROLU
        const now = new Date();
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Deadline keçibsə?
        let isOverdue = false;
        let isYesterday = false;
        let daysOverdue = 0;

        if (dueDate) {
            // Tarixləri müqayisə etmək üçün saatları sıfırla
            const dueDateOnly = new Date(dueDate);
            dueDateOnly.setHours(0, 0, 0, 0);

            const nowDateOnly = new Date(now);
            nowDateOnly.setHours(0, 0, 0, 0);

            // Neçə gün keçib?
            daysOverdue = Math.floor((nowDateOnly - dueDateOnly) / (1000 * 60 * 60 * 24));

            isOverdue = dueDateOnly < nowDateOnly;
            isYesterday = daysOverdue === 1; // Dünən keçibsə
        }

        console.log(`📅 Task ${task.id}: Deadline ${task.due_date}, Days overdue: ${daysOverdue}, Is yesterday: ${isYesterday}`);

        const currentUser = window.taskManager?.userData;
        const currentUserId = currentUser?.userId;
        const isAssignedToMe = task.assigned_to == currentUserId;
        const isCreator = task.created_by == currentUserId;
        const isAdmin = currentUser?.role === 'company_admin' || currentUser?.role === 'admin';

        // ✅ ƏMƏLİYYAT BUTONLARI
        let editButton = '';
        let commentsButton = '';
        let detailsButton = '';

        // ✅ EDIT BUTONUNU YARAT - HƏR VAXT GÖSTƏR (əgər icazə varsa)
        let canEdit = false;

        // Edit icazəsini yoxla
        if (isAdmin || isCreator || isAssignedToMe) {
            canEdit = true;
        }

        // ✅ HƏR VAXT EDIT BUTTON OLSUN (əgər icazə varsa)
        if (canEdit) {
            editButton = `
                <button class="btn btn-sm btn-warning" onclick="TableManager.openEditModal(${task.id}, 'active')" 
                        title="Taskı redaktə et (Deadline-i uzada bilərsiniz)">
                    <i class="fa-solid fa-edit"></i> Edit
                </button>
            `;
        }

        commentsButton = `
            <button class="btn btn-sm btn-info" onclick="TableManager.viewTaskComments(${task.id})" title="Comment-lərə bax">
                <i class="fa-solid fa-comments"></i>
            </button>
        `;

        detailsButton = `
            <button class="btn btn-sm btn-secondary" onclick="TableManager.viewTaskDetails(${task.id})" title="Detallara bax">
                <i class="fa-solid fa-eye"></i>
            </button>
        `;

        // ✅ STATUS BÖLMƏSİ
        let statusBadgeHTML = '';
        let statusButtonHTML = '';

        // ƏSAS MƏNTİQ: DÜNƏN vs BUGÜN
        if (task.status === 'pending' || task.status === 'overdue') {
            if (isYesterday) {
                // ❌ DÜNƏN KEÇİB: "Gecikmə" + "Götür" buttonu
                statusBadgeHTML = `
                    <span class="badge bg-danger" title="Dünən deadline keçib! Tarix: ${this.formatDate(task.due_date)}">
                        <i class="fa-solid fa-clock"></i> GECİKMƏ
                    </span>
                `;

                // Dünən keçibsə, HƏR KƏS "Götür" butonu görsün
                statusButtonHTML = `
                    <button class="btn btn-sm btn-warning" onclick="TableManager.takeTaskFromOthers(${task.id})" title="Bu gecikmiş işi özümə götür">
                        <i class="fa-solid fa-hand-paper"></i> Götür
                    </button>
                `;

            } else if (isOverdue && daysOverdue > 1) {
                // ❌ 2+ GÜN KEÇİB: "Gecikmə" + "Götür" buttonu
                statusBadgeHTML = `
                    <span class="badge bg-danger" title="${daysOverdue} gün əvvəl deadline keçib!">
                        <i class="fa-solid fa-clock"></i> GECİKMƏ (${daysOverdue}gün)
                    </span>
                `;

                statusButtonHTML = `
                    <button class="btn btn-sm btn-warning" onclick="TableManager.takeTaskFromOthers(${task.id})" title="Bu gecikmiş işi özümə götür">
                        <i class="fa-solid fa-hand-paper"></i> Götür
                    </button>
                `;

            } else {
                // ✅ BUGÜN VƏ YA GƏLƏCƏK: "Gözləyir" + "İşə başla" buttonu
                statusBadgeHTML = `
                    <span class="status-badge status-pending" title="Tarix: ${this.formatDate(task.due_date)}">
                        <i class="fa-solid fa-clock"></i> Gözləyir
                    </span>
                `;

                if (isAssignedToMe) {
                    statusButtonHTML = `
                        <button class="btn btn-sm btn-success" onclick="TableManager.startTask(${task.id})" title="Bu işə başla">
                            <i class="fa-solid fa-play"></i> İşə başla
                        </button>
                    `;
                } else {
                    statusButtonHTML = `
                        <button class="btn btn-sm btn-info" onclick="TableManager.takeTaskFromOthers(${task.id})" title="Bu işi özümə götür">
                            <i class="fa-solid fa-user-plus"></i> Götür
                        </button>
                    `;
                }
            }
        }
        else if (task.status === 'in_progress') {
            statusBadgeHTML = `
                <span class="status-badge status-in-progress">
                    <i class="fa-solid fa-spinner"></i> İşlənir
                </span>
            `;

            if (isAssignedToMe) {
                statusButtonHTML = `
                    <span class="badge bg-warning">İŞLƏNİR</span>
                    <button class="btn btn-sm btn-primary" onclick="TableManager.completeTask(${task.id}, 'active')" title="Bu işi tamamlandı et">
                        <i class="fa-solid fa-check"></i> Tamamla
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="TableManager.rejectTask(${task.id}, 'active')" title="Bu işi rədd et">
                        <i class="fa-solid fa-ban"></i> İmtina et
                    </button>
                `;
            }
        }
        else if (task.status === 'completed') {
            statusBadgeHTML = `
                <span class="status-badge status-completed">
                    <i class="fa-solid fa-check-circle"></i> Tamamlandı
                </span>
            `;
        }
        else if (task.status === 'rejected') {
            statusBadgeHTML = `
                <span class="status-badge status-rejected">
                    <i class="fa-solid fa-ban"></i> Rədd edildi
                </span>
            `;
        }

        // ✅ Deadline tarixi üçün xüsusi styling - YANIB-SÖNƏN
        let dueDateClass = '';
        let dueDateIcon = '';
        let dueDateTitle = '';

        if (dueDate) {
            if (isYesterday) {
                // DÜNƏN KEÇİB: Qırmızı + ⚠️ ikonu (YANIB-SÖNƏN)
                dueDateClass = 'text-danger fw-bold blinking-text';
                dueDateIcon = '<i class="fa-solid fa-exclamation-triangle ms-1 blinking-icon"></i>';
                dueDateTitle = '⚠️ Dünən deadline keçib! Bu gecikmiş işi götürə bilərsiniz.';
            } else if (isOverdue && daysOverdue > 1) {
                // 2+ GÜN KEÇİB: Qırmızı + ⚠️ ikonu (YANIB-SÖNƏN)
                dueDateClass = 'text-danger fw-bold blinking-text';
                dueDateIcon = `<i class="fa-solid fa-exclamation-triangle ms-1 blinking-icon"></i>`;
                dueDateTitle = `⚠️ ${daysOverdue} gün əvvəl deadline keçib! Bu gecikmiş işi götürə bilərsiniz.`;
            } else if (daysOverdue === 0) {
                // BUGÜN: Yaşıl
                dueDateClass = 'text-success fw-bold';
                dueDateTitle = '✅ Deadline bugün';
            } else {
                // GƏLƏCƏK
                dueDateClass = '';
                dueDateTitle = `Deadline: ${this.formatDate(task.due_date)}`;
            }
        }

        // ✅ FAYL SÜTUNU - YENİLƏNİŞ
        let fileColumnHTML = '';

        if (task.attachments && task.attachments.length > 0) {
            const attachments = Array.isArray(task.attachments) ? task.attachments : JSON.parse(task.attachments);
            const hasMultipleFiles = attachments.length > 1;
            const firstAttachment = attachments[0];

            // Fayl ikonunu müəyyən et
            const getFileIcon = (attachment) => {
                const mimeType = attachment.mime_type || '';
                const filename = attachment.filename || '';
                const isAudioRecording = attachment.is_audio_recording || false;

                if (isAudioRecording || mimeType.includes('audio/') ||
                    filename.includes('səs-qeydi') || filename.includes('recording')) {
                    return '<i class="fas fa-microphone text-primary"></i>';
                } else if (mimeType.includes('image/')) {
                    return '<i class="fas fa-image text-primary"></i>';
                } else if (mimeType.includes('video/')) {
                    return '<i class="fas fa-video text-danger"></i>';
                } else if (mimeType.includes('pdf')) {
                    return '<i class="fas fa-file-pdf text-danger"></i>';
                } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet') ||
                          filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
                    return '<i class="fas fa-file-excel text-success"></i>';
                } else if (mimeType.includes('word') || mimeType.includes('document') ||
                          filename.endsWith('.docx') || filename.endsWith('.doc')) {
                    return '<i class="fas fa-file-word text-primary"></i>';
                } else if (mimeType.includes('zip') || mimeType.includes('archive') ||
                          filename.endsWith('.zip') || filename.endsWith('.rar')) {
                    return '<i class="fas fa-file-archive text-warning"></i>';
                } else {
                    return '<i class="fas fa-file text-secondary"></i>';
                }
            };

            // Fayl adını formatla
            const formatFileName = (filename) => {
                if (!filename) return 'Fayl';
                if (filename.length > 15) {
                    return filename.substring(0, 12) + '...';
                }
                return filename;
            };

            // Tək fayl üçün
            if (!hasMultipleFiles) {
                const fileIcon = getFileIcon(firstAttachment);
                const fileName = formatFileName(firstAttachment.filename);

                fileColumnHTML = `
                    <div class="file-preview-single" 
                         onclick="TableManager.previewFile(
                             '${firstAttachment.file_id}', 
                             '${firstAttachment.filename}', 
                             '${firstAttachment.mime_type || ''}',
                             ${firstAttachment.is_audio_recording || false}
                         )" 
                         style="cursor: pointer;" 
                         title="${firstAttachment.filename}">
                        <div class="file-icon">${fileIcon}</div>
                        <div class="file-name">${fileName}</div>
                    </div>
                `;
            } else {
                // Çoxlu fayl üçün
                fileColumnHTML = `
                    <div class="file-preview-multiple">
                        <div class="file-count-badge" onclick="TableManager.showTaskFiles(${task.id})" 
                             style="cursor: pointer;" title="${attachments.length} fayl - Hamısına bax">
                            <i class="fas fa-paperclip"></i>
                            <span>${attachments.length}</span>
                        </div>
                    </div>
                `;
            }
        } else {
            fileColumnHTML = '<span class="text-muted">-</span>';
        }

        // ✅ ƏSAS MESAJ: DEADLINE KEÇƏNDƏ MESAJ VER
        let overdueMessage = '';
        if (isOverdue) {
            overdueMessage = `
                <div class="alert alert-warning alert-sm mt-2" style="padding: 4px 8px; font-size: 12px;">
                    <i class="fa-solid fa-info-circle"></i> 
                </div>
            `;
        }

        // ✅ HTML-dəki sütun sırasına uyğun qaytar:
        return `
            <td>${serialNumber}</td>
            <td>${this.formatDate(task.created_at)}</td>
            <td>${this.escapeHtml(displayCompanyName)}</td>
            <td>${this.escapeHtml(creatorName)}</td>
            <td>${this.escapeHtml(executorName)}</td>
            <td class="actions-col">
                <div class="action-buttons">
                    ${editButton}
                    ${commentsButton}
                    ${detailsButton}
                </div>
            </td>
            <td>${this.escapeHtml(workTypeName)}</td>
            <td class="description-col">
                <div class="description-container">
                    <div class="truncated-description" id="desc-${task.id}" style="display: ${description.length > 10 ? 'block' : 'none'}">
                        ${this.truncateText(description, 10)}
                    </div>
                    <div class="full-description" id="full-desc-${task.id}" style="display: none">
                        ${this.escapeHtml(description)}
                    </div>
                    ${description.length > 10 ? `
                    <button class="expand-btn" onclick="TableManager.toggleDescription(${task.id})" 
                            title="Tam açıqlamaya bax">
                        <i class="fas fa-expand-alt"></i> Tam bax
                    </button>
                    ` : ''}
                    ${overdueMessage}
                </div>
            </td>
            <td class="file-col">
                ${fileColumnHTML}
            </td>
            <td class="${dueDateClass}" title="${dueDateTitle}">
                ${this.formatDate(task.due_date || task.due_at)}
                ${dueDateIcon}
            </td>
            <td>
                <div class="status-section">
                    ${statusBadgeHTML}
                    ${statusButtonHTML}
                </div>
            </td>
            <td>${this.formatDate(task.completed_date || task.completed_at)}</td>
            <td>${durationMinutes}</td>
            <td>${parseFloat(hourlyRate).toFixed(2)}</td>
            <td>${calculatedSalary} ₼</td>
            <td>${this.escapeHtml(departmentName)}</td>
        `;
    },




    // Yeni funksiyalar əlavə edin
    previewFile: async function(fileId, filename, mimeType, isAudioRecording = false) {
        try {
            console.log(`👁️ Fayl preview: ${fileId}, ${filename}, ${mimeType}, audio: ${isAudioRecording}`);

            if (isAudioRecording || mimeType.startsWith('audio/')) {
                this.openAudioPreviewModal(fileId, filename);
            } else if (mimeType.startsWith('image/')) {
                this.openImagePreviewModal(fileId, filename);
            } else if (mimeType.startsWith('video/')) {
                this.openVideoPreviewModal(fileId, filename);
            } else if (mimeType.includes('pdf')) {
                this.openPdfPreviewModal(fileId, filename);
            } else {
                this.downloadFile(fileId, filename);
            }
        } catch (error) {
            console.error('❌ Fayl preview xətası:', error);
            this.showError('Fayl açıla bilmədi');
        }
    },

    openAudioPreviewModal: function(fileId, filename) {
        const modalHTML = `
            <div class="modal-backdrop" id="audioPreviewModal">
                <div class="modal modal-md">
                    <div class="modal-header">
                        <div class="modal-title">
                            <i class="fas fa-microphone"></i>
                            Səs Qeydi
                        </div>
                        <button class="close-btn" onclick="TableManager.closeModal('audioPreviewModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <div class="audio-player-container">
                            <audio id="audioPlayer" controls autoplay style="width: 100%;">
                                Fayl yüklənir...
                            </audio>
                            <div class="audio-info">
                                <span>${this.escapeHtml(filename)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="secondary-btn" onclick="TableManager.closeModal('audioPreviewModal')">
                            <i class="fas fa-times"></i> Bağla
                        </button>
                        <button class="primary-btn" onclick="TableManager.downloadFile('${fileId}', '${filename}')">
                            <i class="fas fa-download"></i> Yüklə
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Audio yüklə
        this.loadAudioForPreview(fileId);
    },

    loadAudioForPreview: async function(fileId) {
        try {
            const response = await this.apiRequest(`/files/${fileId}/download`, 'GET');

            if (response && response.url) {
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    audioPlayer.src = response.url;
                }
            }
        } catch (error) {
            console.error('❌ Audio yüklənərkən xəta:', error);
            this.showError('Audio faylı yüklənə bilmədi');
        }
    },

    showTaskFiles: async function(taskId) {
        try {
            const response = await this.apiRequest(`/tasks/${taskId}`, 'GET');

            if (response && response.data) {
                const task = response.data;
                const attachments = task.attachments || [];

                if (attachments.length === 0) {
                    this.showInfo('Bu task-da fayl yoxdur');
                    return;
                }

                let filesHTML = '';

                attachments.forEach((attachment, index) => {
                    const isAudio = attachment.is_audio_recording ||
                                  (attachment.mime_type && attachment.mime_type.startsWith('audio/'));

                    filesHTML += `
                        <div class="file-item">
                            <div class="file-icon">
                                ${isAudio ? '<i class="fas fa-microphone"></i>' : 
                                  attachment.mime_type && attachment.mime_type.startsWith('image/') ? '<i class="fas fa-image"></i>' :
                                  attachment.mime_type && attachment.mime_type.startsWith('video/') ? '<i class="fas fa-video"></i>' :
                                  attachment.mime_type && attachment.mime_type.includes('pdf') ? '<i class="fas fa-file-pdf"></i>' :
                                  '<i class="fas fa-file"></i>'}
                            </div>
                            <div class="file-info">
                                <div class="file-name">${attachment.filename}</div>
                                <div class="file-meta">
                                    ${attachment.size ? `<span class="file-size">${this.formatFileSize(attachment.size)}</span>` : ''}
                                    ${attachment.uploaded_at ? `<span class="file-date">${this.formatDate(attachment.uploaded_at)}</span>` : ''}
                                </div>
                            </div>
                            <div class="file-actions">
                                <button class="btn btn-sm btn-primary" 
                                        onclick="TableManager.previewFile(
                                            '${attachment.file_id}', 
                                            '${attachment.filename}', 
                                            '${attachment.mime_type || ''}',
                                            ${attachment.is_audio_recording || false}
                                        )">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-success" 
                                        onclick="TableManager.downloadFile('${attachment.file_id}', '${attachment.filename}')">
                                    <i class="fas fa-download"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });

                const modalHTML = `
                    <div class="modal-backdrop" id="taskFilesModal">
                        <div class="modal modal-lg">
                            <div class="modal-header">
                                <div class="modal-title">
                                    <i class="fas fa-paperclip"></i>
                                    Task Faylları (${attachments.length})
                                </div>
                                <button class="close-btn" onclick="TableManager.closeModal('taskFilesModal')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="modal-content">
                                <div class="files-list">
                                    ${filesHTML}
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="secondary-btn" onclick="TableManager.closeModal('taskFilesModal')">
                                    <i class="fas fa-times"></i> Bağla
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
        } catch (error) {
            console.error('❌ Task faylları gətirilərkən xəta:', error);
            this.showError('Fayllar gətirilə bilmədi');
        }
    },

    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    },

    formatFileSize: function(bytes) {
        if (!bytes) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    downloadFile: async function(fileId, filename) {
        try {
            const url = `/api/v1/files/${fileId}/download`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);

                this.showSuccess('Fayl yükləndi');
            } else {
                throw new Error('Fayl yüklənə bilmədi');
            }
        } catch (error) {
            console.error('❌ Fayl yükləmə xətası:', error);
            this.showError('Fayl yüklənə bilmədi');
        }
    },

    // ==================== TASK ACTIONS FUNCTIONS ====================
    takeTaskFromOthers: async function (taskId) {
        try {
            if (!confirm('Bu işi özünüzə götürmək istədiyinizə əminsiniz?')) {
                return;
            }

            console.log(`🤝 Başqasının task-ı götürülür: ${taskId}`);

            const currentUser = window.taskManager?.userData;
            if (!currentUser) {
                throw new Error('User məlumatları tapılmadı');
            }

            const updateData = {
                assigned_to: currentUser.userId,
                assigned_to_name: currentUser.fullName || currentUser.name,
                updated_at: new Date().toISOString()
            };

            if (confirm('İşə dərhal başlamaq istəyirsiniz?')) {
                updateData.status = 'in_progress';
                updateData.started_at = new Date().toISOString();
            }

            console.log('📦 Task özümüzə götürülür (PATCH):', updateData);

            const response = await this.apiRequest(`/tasks/${taskId}`, 'PATCH', updateData);

            if (response && !response.error) {

                // ✅ AVTOMATİK YENİLƏMƏ
                this.autoRefreshAfterAction(taskId, 'active', 'taken');

            } else {
                throw new Error('İş götürülə bilmədi');
            }

        } catch (error) {
            console.error('❌ İş götürülərkən xəta:', error);
            this.showError('Xəta: ' + error.message);
        }
    },



    takeExternalTask: async function (taskId) {
        try {
            if (!confirm('Bu işi götürmək istədiyinizə əminsiniz?')) {
                return;
            }

            console.log(`🤝 Xarici task götürülür: ${taskId}`);

            const currentUser = window.taskManager?.userData;
            if (!currentUser) {
                throw new Error('User məlumatları tapılmadı');
            }

            const updateData = {
                assigned_to: currentUser.userId,
                status: 'in_progress',
                assigned_to_name: currentUser.fullName || currentUser.name,
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('📦 Update data göndərilir (PATCH):', updateData);

            const response = await this.apiRequest(`/tasks/${taskId}`, 'PATCH', updateData);

            if (response && !response.error) {


                // ✅ AVTOMATİK YENİLƏMƏ
                this.autoRefreshAfterAction(taskId, 'external', 'taken');

            } else {
                throw new Error('İş götürülə bilmədi');
            }

        } catch (error) {
            console.error('❌ İş götürülərkən xəta:', error);
            this.showError('Xəta: ' + error.message);
        }
    },

    startTask: async function (taskId) {
        try {
            if (!confirm('Bu işə başlamaq istədiyinizə əminsiniz?')) {
                return;
            }

            console.log(`▶️ Task başladılır: ${taskId}`);

            const updateData = {
                status: 'in_progress',
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('📦 Start task data (PATCH):', updateData);

            const response = await this.apiRequest(`/tasks/${taskId}`, 'PATCH', updateData);

            if (response && !response.error) {

            } else {
                throw new Error('İş başladıla bilmədi');
            }

        } catch (error) {
            console.error('❌ İş başladılarkən xəta:', error);
            this.showError('Xəta: ' + error.message);
        }
    },


    completeTask: async function(taskId, tableType = 'active') {
        try {
            console.log(`🔵 completeTask başladı: ${taskId}, table: ${tableType}`);

            // Task məlumatlarını götür
            console.log(`📥 Task məlumatları yüklənir: ${taskId}`);
            const taskResponse = await this.apiRequest(`/tasks/${taskId}`, 'GET');

            if (!taskResponse || taskResponse.error) {
                console.error('❌ Task tapılmadı:', taskResponse);
                throw new Error('Task tapılmadı');
            }

            const task = taskResponse.data || taskResponse;
            console.log(`✅ Task məlumatları yükləndi:`, {
                id: task.id,
                title: task.task_title || task.title,
                status: task.status,
                tags: task.tags,
                tagsType: typeof task.tags
            });

            const taskTitle = task.task_title || task.title || 'Task';
            const confirmMsg = `"${taskTitle}" task-ını tamamlandı olaraq qeyd etmək istədiyinizə əminsiniz?`;

            if (!confirm(confirmMsg)) {
                console.log('❌ İstifadəçi ləğv etdi');
                return;
            }

            // 1. Task statusunu completed et
            const updateData = {
                status: 'completed',
                completed_date: new Date().toISOString()
            };

            console.log(`🔄 Task yenilənir (PATCH): ${taskId}`, updateData);
            const updateResponse = await this.apiRequest(`/tasks/${taskId}`, 'PATCH', updateData);

            if (updateResponse && !updateResponse.error) {
                this.playTaskSound('taskCompleted');
                this.showSuccess('✅ İş tamamlandı!');

                try {
                    // CURRENT USER MƏLUMATLARI
                    const currentUser = window.taskManager?.userData;
                    if (!currentUser) {
                        throw new Error('User məlumatları tapılmadı');
                    }

                    // ✅ ARXİV DATA-SI HAZIRLA - AÇIQ ŞƏKİLDƏ NULL GÖNDƏR
                    const archiveData = {
                        original_task_id: taskId,
                        task_title: task.task_title || task.title || 'Task',
                        assigned_to: task.assigned_to,
                        company_id: task.company_id,
                        created_by: task.created_by,

                        // ✅ creator_name əlavə et
                        creator_name: task.creator_name || this.getCreatorName(task),

                        // Digər sahələr
                        task_code: task.task_code || `TASK-${taskId}`,
                        task_description: task.task_description || task.description || '',
                        assigned_by: task.assigned_by || task.created_by,
                        department_id: task.department_id || null,
                        priority: task.priority || 'medium',
                        status: 'completed',
                        due_date: task.due_date || task.due_at || null,
                        completed_date: new Date().toISOString(),
                        estimated_hours: task.estimated_hours || 0,
                        actual_hours: task.actual_hours || 0,
                        work_type_id: task.work_type_id || null,
                        progress_percentage: 100,
                        is_billable: task.is_billable || false,
                        billing_rate: task.billing_rate || task.hourly_rate || 0,

                        // ✅ ƏSAS FİKS: AÇIQ ŞƏKİLDƏ NULL GÖNDƏR
                        // Backend-in avtomatik '[]' string-ə çevirməsinin qarşısını almaq üçün
                        tags: null,

                        started_date: task.started_date || task.started_at || null,
                        archive_reason: 'Tamamlandığı üçün arxivləndi'
                    };

                    console.log('📦 Arxiv data hazırlandı:');
                    console.log('  tags:', archiveData.tags, 'Type:', typeof archiveData.tags);
                    console.log('  creator_name:', archiveData.creator_name);

                    // ✅ ARXİV REQUEST-İ GÖNDƏR
                    const archiveResponse = await this.apiRequest('/task-archive/archive', 'POST', archiveData);
                    console.log('📥 Arxiv API cavabı:', archiveResponse);

                    if (archiveResponse && archiveResponse.success !== false && !archiveResponse.error) {
                        this.showSuccess('✅ Task arxivə köçürüldü!');

                        // Arxiv cədvəlini yenilə
                        setTimeout(() => {
                            if (window.taskManager?.loadArchiveTasks) {
                                window.taskManager.loadArchiveTasks();
                            }
                        }, 1000);

                    } else {
                        console.warn(`⚠️ Task arxivlənmədi:`, archiveResponse);

                        let errorMsg = 'Task arxivə köçürülmədi, lakin tamamlandı qeyd edildi';
                        if (archiveResponse?.detail) {
                            errorMsg = `Arxiv xətası: ${archiveResponse.detail}`;
                        } else if (archiveResponse?.error) {
                            errorMsg = `Arxiv xətası: ${archiveResponse.error}`;
                        }

                        this.showError(errorMsg);
                    }
                } catch (archiveError) {
                    console.error(`❌ Arxiv xətası:`, archiveError);
                    // Arxiv xətası task-ın tamamlanmasına mane olmamalıdır
                    this.showError('Arxiv xətası: ' + archiveError.message);
                }

                // ✅ AVTOMATİK YENİLƏMƏ
                this.autoRefreshAfterAction(taskId, tableType, 'completed');

            } else {
                console.error('❌ Task tamamlandı edilə bilmədi:', updateResponse);
                throw new Error('Task tamamlandı edilə bilmədi');
            }

        } catch (error) {
            console.error('❌ Task tamamlanarkən xəta:', error);
            this.showError('Xəta: ' + error.message);
        }
    },

    // Helper function: Yaradan adını al
    getCreatorName: function(task) {
        if (task.creator_name) {
            return task.creator_name;
        }

        if (task.created_by_name) {
            return task.created_by_name;
        }

        const currentUser = window.taskManager?.userData;
        if (currentUser && task.created_by == currentUser.userId) {
            return currentUser.fullName || currentUser.name;
        }

        return `ID: ${task.created_by}`;
    },

    rejectTask: async function (taskId, tableType = 'active') {
        try {
            const comment = prompt('Rədd etmə səbəbini yazın (məcburi):', '');

            if (!comment || comment.trim() === '') {
                alert('❌ Rədd etmə səbəbi məcburidir!');
                return;
            }

            if (!confirm(`Bu işi imtina etmək istədiyinizə əminsiniz?\n\nSəbəb: ${comment}`)) {
                return;
            }

            console.log(`❌ Task imtina edilir: ${taskId}`);

            const updateData = {
                status: 'rejected',
                reason: comment
            };

            const response = await this.apiRequest(`/tasks/${taskId}`, 'PATCH', updateData);

            if (response && !response.error) {
                // ✅ Səs çıxart
                this.playTaskSound('taskRejected');
                this.showSuccess('✅ İş imtina edildi!');

                // ✅ AVTOMATİK YENİLƏMƏ
                this.autoRefreshAfterAction(taskId, tableType, 'rejected');

            } else {
                throw new Error('Task imtina edilə bilmədi');
            }

        } catch (error) {
            console.error('❌ Task imtina edilərkən xəta:', error);
            this.showError('Xəta: ' + error.message);
        }
    },


    openEditModal: async function (taskId, tableType = 'active') {
        try {
            console.log(`✏️ Edit modal açılır: ${taskId}, ${tableType}`);

            const response = await this.apiRequest(`/tasks/${taskId}`, 'GET');

            if (!response || response.error) {
                throw new Error('Task məlumatları tapılmadı');
            }

            const task = response.data || response;

            if (window.TaskEditModule && typeof window.TaskEditModule.openEditTaskModal === 'function') {
                window.TaskEditModule.openEditTaskModal(taskId, tableType);
            } else {
                this.showEditModal(task, tableType);
            }

        } catch (error) {
            console.error('❌ Edit modal açılarkən xəta:', error);
            this.showError('Xəta: ' + error.message);
        }
    },

    // ==================== API REQUEST FUNCTION ====================
    apiRequest: async function(endpoint, method = 'GET', data = null) {
        try {
            console.log(`📡 TableManager API Request: ${method} ${endpoint}`);

            // Global makeApiRequest funksiyasından istifadə et
            if (typeof window.makeApiRequest === 'function') {
                return await window.makeApiRequest(endpoint, method, data);
            } else {
                console.error('❌ makeApiRequest function not found!');
                throw new Error('API request function not available');
            }
        } catch (error) {
            console.error('❌ TableManager API Request Error:', error);
            throw error;
        }
    },

    // ==================== FILE UPLOAD FUNCTIONS ====================
    openFileUpload: function(taskId, tableType) {
        console.log(`📤 Fayl yükləmə modalı: ${taskId}, ${tableType}`);

        const modalHTML = `
            <div class="modal-backdrop" id="fileUploadModal">
                <div class="modal modal-md">
                    <div class="modal-header">
                        <div class="modal-title">
                            <i class="fas fa-upload"></i>
                            Fayl Əlavə Et
                        </div>
                        <button class="close-btn" onclick="TableManager.closeModal('fileUploadModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <div class="upload-container">
                            <!-- File Upload Area -->
                            <div class="upload-area" id="uploadArea">
                                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                                <p class="upload-text">Faylı buraya sürüşdürün və ya klik edin</p>
                                <p class="upload-subtext">Maksimum 100MB. Dəstəklənən formatlar: PDF, JPG, PNG, MP3, MP4, DOC, XLS</p>
                                <input type="file" id="fileInput" style="display: none;" multiple>
                            </div>
                            
                            <div class="file-list" id="fileList"></div>
                            
                            <!-- Audio Recording Section -->
                            <div class="recording-section">
                                <button class="btn btn-primary" onclick="TableManager.startAudioRecording()" id="recordButton">
                                    <i class="fas fa-microphone"></i> Səs Qeydi Başlat
                                </button>
                                <button class="btn btn-danger" onclick="TableManager.stopAudioRecording()" id="stopButton" style="display: none;">
                                    <i class="fas fa-stop"></i> Dayandır
                                </button>
                                <div class="recording-status" id="recordingStatus" style="display: none;">
                                    <i class="fas fa-circle text-danger recording-pulse"></i>
                                    <span>Qeyd edilir...</span>
                                    <span id="recordingTime">00:00</span>
                                </div>
                            </div>
                            
                            <!-- Audio Preview -->
                            <div class="audio-preview" id="audioPreview" style="display: none;">
                                <div class="audio-info">
                                    <span id="audioFilename"></span>
                                    <span id="audioDuration"></span>
                                </div>
                                <audio id="previewAudio" controls style="width: 100%;"></audio>
                            </div>
                            
                            <div class="notes-section">
                                <label for="uploadNotes">Qeydlər (isteğe bağlı):</label>
                                <textarea id="uploadNotes" class="form-control" rows="3" 
                                          placeholder="Fayl haqqında qeydlər..."></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="secondary-btn" onclick="TableManager.closeModal('fileUploadModal')">
                            <i class="fas fa-times"></i> Ləğv et
                        </button>
                        <button class="primary-btn" onclick="TableManager.uploadFiles(${taskId}, '${tableType}')" id="uploadButton">
                            <i class="fas fa-upload"></i> Yüklə
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Köhnə modalı sil
        const oldModal = document.getElementById('fileUploadModal');
        if (oldModal) oldModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Upload area interaktiv edir
        this.setupUploadArea();

        // Task ID və table type saxla
        window.currentTaskForUpload = { taskId, tableType };
    },

    setupUploadArea: function() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');

                if (e.dataTransfer.files.length > 0) {
                    this.handleSelectedFiles(e.dataTransfer.files);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleSelectedFiles(e.target.files);
                }
            });
        }
    },

    handleSelectedFiles: function(files) {
        const fileList = document.getElementById('fileList');
        if (!fileList) return;

        fileList.innerHTML = '';

        Array.from(files).forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-icon">
                    <i class="${this.getFileIconClass(file)}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                </div>
                <button class="remove-file-btn" onclick="TableManager.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;

            fileList.appendChild(fileItem);
        });

        // Faylları global dəyişəndə saxla
        window.selectedFiles = files;
    },

    getFileIconClass: function(file) {
        if (file.type.startsWith('audio/')) return 'fas fa-microphone text-primary';
        if (file.type.startsWith('image/')) return 'fas fa-image text-primary';
        if (file.type.startsWith('video/')) return 'fas fa-video text-danger';
        if (file.type.includes('pdf')) return 'fas fa-file-pdf text-danger';
        if (file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))
            return 'fas fa-file-excel text-success';
        if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc'))
            return 'fas fa-file-word text-primary';
        if (file.type.includes('zip') || file.name.endsWith('.zip') || file.name.endsWith('.rar'))
            return 'fas fa-file-archive text-warning';
        return 'fas fa-file text-secondary';
    },

    removeFile: function(index) {
        if (window.selectedFiles && window.selectedFiles.length > index) {
            // Faylı sil
            const fileList = Array.from(window.selectedFiles);
            fileList.splice(index, 1);
            window.selectedFiles = fileList;

            // UI-dan sil
            this.handleSelectedFiles(window.selectedFiles);
        }
    },

    // ==================== AUDIO RECORDING FUNCTIONS ====================
    audioRecorder: null,
    audioChunks: [],
    isRecording: false,
    recordingTimer: null,
    recordingStartTime: null,

    startAudioRecording: async function() {
        try {
            console.log('🎤 Səs qeydi başladılır...');

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.showError('Səs qeydi cihazınız dəstəklənmir');
                return;
            }

            // Microfon icazəsini al
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // MediaRecorder yarat
            this.audioRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            // Data toplama
            this.audioRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // Qeyd bitdikdə
            this.audioRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

                // Preview göstər
                this.showAudioPreview(audioBlob);

                // Stream-i dayandır
                stream.getTracks().forEach(track => track.stop());

                // UI yenilə
                document.getElementById('recordButton').style.display = 'none';
                document.getElementById('stopButton').style.display = 'none';
                document.getElementById('recordingStatus').style.display = 'none';

                // Audio blob-u saxla
                window.recordedAudioBlob = audioBlob;

            };

            // Başlat
            this.audioRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            // UI yenilə
            document.getElementById('recordButton').style.display = 'none';
            document.getElementById('stopButton').style.display = 'block';
            document.getElementById('recordingStatus').style.display = 'flex';

            // Timer başlat
            this.startRecordingTimer();

            // 5 dəqiqə limit
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopAudioRecording();
                    this.showInfo('Maksimum qeyd müddəti (5 dəqiqə) bitdi');
                }
            }, 5 * 60 * 1000);

            console.log('✅ Səs qeydi başladı');

        } catch (error) {
            console.error('❌ Səs qeydi başladılarkən xəta:', error);
            this.showError('Mikrofon icazəsi lazımdır: ' + error.message);
        }
    },

    stopAudioRecording: function() {
        if (this.audioRecorder && this.isRecording) {
            this.audioRecorder.stop();
            this.isRecording = false;
            this.stopRecordingTimer();
            console.log('⏹️ Səs qeydi dayandırıldı');
        }
    },

    startRecordingTimer: function() {
        const timerElement = document.getElementById('recordingTime');
        if (!timerElement) return;

        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;

            timerElement.textContent =
                `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 1000);
    },

    stopRecordingTimer: function() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    },

    showAudioPreview: function(audioBlob) {
        const audioPreview = document.getElementById('audioPreview');
        const previewAudio = document.getElementById('previewAudio');
        const audioFilename = document.getElementById('audioFilename');

        if (!audioPreview || !previewAudio) return;

        const audioURL = URL.createObjectURL(audioBlob);
        previewAudio.src = audioURL;

        // Filename göstər
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ses-qeydi-${timestamp}.webm`;
        if (audioFilename) {
            audioFilename.textContent = filename;
        }

        // Duration hesabla
        previewAudio.onloadedmetadata = () => {
            const duration = previewAudio.duration;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            const durationElement = document.getElementById('audioDuration');
            if (durationElement) {
                durationElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        };

        audioPreview.style.display = 'block';
    },

    // ==================== UPLOAD FUNCTIONS ====================
    uploadFiles: async function(taskId, tableType) {
        try {
            const files = window.selectedFiles || [];
            const audioBlob = window.recordedAudioBlob;
            const notes = document.getElementById('uploadNotes')?.value || '';

            if (files.length === 0 && !audioBlob) {
                this.showError('❌ Heç bir fayl və ya səs qeydi seçilməyib');
                return;
            }

            const uploadButton = document.getElementById('uploadButton');
            if (uploadButton) {
                uploadButton.disabled = true;
                uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yüklənir...';
            }

            let uploadedCount = 0;
            let totalCount = files.length + (audioBlob ? 1 : 0);

            // Normal faylları yüklə
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('task_id', taskId);

                if (notes) {
                    formData.append('description', notes);
                }

                console.log(`📤 Fayl yüklənir: ${file.name}`);

                try {
                    const response = await this.uploadApiRequest(`/tasks/${taskId}/upload`, 'POST', formData);

                    if (response && !response.error) {
                        uploadedCount++;
                        console.log(`✅ ${file.name} uğurla yükləndi (${uploadedCount}/${totalCount})`);
                    } else {
                        console.error(`❌ ${file.name} yüklənərkən xəta:`, response?.error);
                    }
                } catch (error) {
                    console.error(`❌ ${file.name} yüklənərkən xəta:`, error);
                }
            }

            // Səs qeydini yüklə
            if (audioBlob) {
                try {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const audioFile = new File([audioBlob], `ses-qeydi-${timestamp}.webm`, {
                        type: 'audio/webm'
                    });

                    const formData = new FormData();
                    formData.append('file', audioFile);
                    formData.append('task_id', taskId);
                    formData.append('is_audio_recording', 'true');
                    formData.append('description', notes || 'Səs qeydi');

                    console.log(`🎤 Səs qeydi yüklənir...`);

                    const response = await this.uploadApiRequest(`/tasks/${taskId}/upload`, 'POST', formData);

                    if (response && !response.error) {
                        uploadedCount++;
                        console.log(`✅ Səs qeydi uğurla yükləndi (${uploadedCount}/${totalCount})`);
                    } else {
                        console.error('❌ Səs qeydi yüklənərkən xəta:', response?.error);
                    }
                } catch (error) {
                    console.error('❌ Səs qeydi yüklənərkən xəta:', error);
                }
            }

            // Nəticə
            this.showSuccess(`✅ ${uploadedCount} fayl uğurla yükləndi!`);

            // Modal bağla
            this.closeModal('fileUploadModal');

            // Cədvəli yenilə
            setTimeout(() => {
                if (tableType === 'active' && window.taskManager) {
                    window.taskManager.loadActiveTasks();
                } else if (tableType === 'external' && window.taskManager) {
                    window.taskManager.loadExternalTasks();
                } else if (tableType === 'archive' && window.taskManager) {
                    window.taskManager.loadArchiveTasks();
                }
            }, 1000);

        } catch (error) {
            console.error('❌ Fayl yükləmə xətası:', error);
            this.showError('Yükləmə uğursuz oldu: ' + error.message);
        } finally {
            const uploadButton = document.getElementById('uploadButton');
            if (uploadButton) {
                uploadButton.disabled = false;
                uploadButton.innerHTML = '<i class="fas fa-upload"></i> Yüklə';
            }

            // Temizle
            window.selectedFiles = [];
            window.recordedAudioBlob = null;
        }
    },

    uploadApiRequest: async function(url, method = 'POST', data = null) {
        try {
            console.log(`📤 Upload API: ${method} ${url}`);

            const token = localStorage.getItem('guven_token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            // FormData göndərilirsə, xüsusi header etmə
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const config = {
                method: method,
                headers: headers,
                body: data
            };

            const fullUrl = `/proxy.php/api/v1${url}`;
            console.log(`🌐 Full URL: ${fullUrl}`);

            const response = await fetch(fullUrl, config);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();

        } catch (error) {
            console.error('❌ Upload API Error:', error);
            throw error;
        }
    },



    showInfo: function(message) {
        if (typeof notificationService !== 'undefined' && notificationService.showInfo) {
            notificationService.showInfo(message);
        } else {
            alert('ℹ️ ' + message);
        }
    },

    showEditModal: function (task, tableType) {
        console.log('📝 Edit modal göstərilir:', task);

        try {
            // Modal elementləri
            const modal = document.getElementById('editTaskModal');
            const form = document.getElementById('editTaskForm');

            if (!modal || !form) {
                console.error('❌ Edit modal və ya form tapılmadı');
                return;
            }

            // Formu doldur
            document.getElementById('editTaskId').value = task.id;
            document.getElementById('editTableType').value = tableType;
            document.getElementById('editTaskTitle').value = task.task_title || task.title || '';
            document.getElementById('editTaskDescription').value = task.task_description || task.description || '';
            document.getElementById('editTaskNotes').value = task.notes || '';

            // ✅ ƏSAS: DEADLINE-İ DÜZGÜN FORMATDA GÖSTƏR
            let dueDate = '';
            if (task.due_date) {
                const dateObj = new Date(task.due_date);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                dueDate = `${year}-${month}-${day}`;
            }
            document.getElementById('editDueDate').value = dueDate;

            // İşçi seçimi
            const executorSelect = document.getElementById('editExecutorSelect');
            if (executorSelect) {
                executorSelect.value = task.assigned_to || '';
            }

            // Şöbə seçimi
            const departmentSelect = document.getElementById('editDepartmentSelect');
            if (departmentSelect) {
                departmentSelect.value = task.department_id || '';
            }

            // İş növü seçimi
            const taskTypeSelect = document.getElementById('editTaskTypeSelect');
            if (taskTypeSelect) {
                taskTypeSelect.value = task.work_type_id || task.task_type_id || '';
            }

            // Müddət və əmək haqqı
            document.getElementById('editDurationInput').value = task.duration_minutes ||
                (task.estimated_hours ? task.estimated_hours * 60 : 0);
            document.getElementById('editHourlyRateInput').value = task.billing_rate || task.hourly_rate || 0;
            document.getElementById('editCalculatedCostInput').value = this.calculateSalary(
                task.billing_rate || task.hourly_rate || 0,
                task.duration_minutes || (task.estimated_hours ? task.estimated_hours * 60 : 0)
            );

            // ✅ ƏSAS: DEADLINE KEÇƏNDƏ XƏBƏRDARLIQ MESAJI
            const now = new Date();
            const taskDueDate = task.due_date ? new Date(task.due_date) : null;
            const isOverdue = taskDueDate && taskDueDate < now;

            if (isOverdue) {
                // Xəbərdarlıq mesajı əlavə et
                const warningDiv = document.createElement('div');
                warningDiv.className = 'alert alert-warning mt-3';
                warningDiv.innerHTML = `
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <strong>Diqqət!</strong> Bu taskın deadline-i keçib (${this.formatDate(task.due_date)}).
                    Yeni deadline tarixi seçərək taskı yenidən aktiv edə bilərsiniz.
                `;

                // Forma əlavə et
                const dueDateField = document.getElementById('editDueDate').parentNode;
                dueDateField.parentNode.insertBefore(warningDiv, dueDateField.nextSibling);
            }

            // Modal aç
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            console.log('✅ Edit modal hazırdır');

        } catch (error) {
            console.error('❌ Edit modal göstərilərkən xəta:', error);
            this.showError('Modal göstərilə bilmədi');
        }
    },



    closeEditModal: function () {
        const modal = document.getElementById('taskEditModalOverlay');
        if (modal) {
            modal.remove();
        }
    },

    // ==================== TOGGLE FUNCTIONS ====================
    toggleDescription: function (taskId) {
        const truncated = document.getElementById(`desc-${taskId}`);
        const full = document.getElementById(`full-desc-${taskId}`);
        const button = truncated?.nextElementSibling?.nextElementSibling ||
            truncated?.parentElement?.querySelector('.expand-btn');

        if (truncated && full) {
            if (truncated.style.display === 'none') {
                truncated.style.display = 'block';
                full.style.display = 'none';
                if (button) {
                    button.innerHTML = '<i class="fas fa-expand-alt"></i> Tam bax';
                    button.title = 'Tam açıqlamaya bax';
                }
            } else {
                truncated.style.display = 'none';
                full.style.display = 'block';
                if (button) {
                    button.innerHTML = '<i class="fas fa-compress-alt"></i> Qısa bax';
                    button.title = 'Qısa versiyaya qayıt';
                }
            }
        }
    },


    // ==================== NOTIFICATION FUNCTIONS ====================
    showSuccess: function (message) {
        if (typeof notificationService !== 'undefined' && notificationService.showSuccess) {
            notificationService.showSuccess(message);
        } else {
            alert('✅ ' + message);
        }
    },

    showError: function (message) {
        if (typeof notificationService !== 'undefined' && notificationService.showError) {
            notificationService.showError(message);
        } else {
            alert('❌ ' + message);
        }
    },

    // ==================== ARCHIVE TABLE ROW ====================
    createArchiveRowHTML: function(task, index, currentPage) {
        console.log(`🔍 REAL createArchiveRowHTML çağırıldı: task ${task.id}`);

        const serialNumber = (currentPage - 1) * 20 + index + 1;
        const hourlyRate = task.hourly_rate || task.billing_rate || task.rate || 0;
        const durationMinutes = task.duration_minutes ||
            (task.estimated_hours ? task.estimated_hours * 60 : 0) ||
            (task.actual_hours ? task.actual_hours * 60 : 0) || 0;
        const calculatedSalary = this.calculateSalary(hourlyRate, durationMinutes);

        let creatorName = task.creator_name || task.created_by_name || `ID: ${task.created_by}`;
        console.log('👤 Yaradan adı (archive):', creatorName);

        const executorName = task.assigned_to_name ||
            task.executor_name ||
            (task.assigned_to ? `İşçi ID: ${task.assigned_to}` : 'Təyin edilməyib');

        // ✅ ŞİRKƏT ADI - SADƏ VERSİYA
        let displayCompanyName = '';

        if (task.company_name && task.company_name !== 'null' && task.company_name.trim() !== '') {
            displayCompanyName = task.company_name;
            console.log(`🏢 Arxiv şirkət adı: ${displayCompanyName}`);
        } else if (task.company_id && window.taskManager?.companyCache) {
            displayCompanyName = window.taskManager.companyCache[task.company_id] || `Şirkət ID: ${task.company_id}`;
            console.log(`🏢 Arxiv şirkət adı (cache): ${displayCompanyName}`);
        } else if (task.company_id) {
            displayCompanyName = `Şirkət ID: ${task.company_id}`;
            console.log(`🏢 Arxiv şirkət adı (fallback): ${displayCompanyName}`);
        } else {
            displayCompanyName = '-';
            console.log(`🏢 Arxiv şirkət adı (default): ${displayCompanyName}`);
        }

        const departmentName = task.department_name ||
            task.department?.name ||
            (task.department_id ? `Şöbə ID: ${task.department_id}` : '-');
        const workTypeName = task.work_type_name ||
            task.work_type?.name ||
            (task.work_type_id ? `İş növü ID: ${task.work_type_id}` : '-');

        const description = task.task_description || task.description || '';

        // ✅ DEADLINE KONTROLU
        const now = new Date();
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const isOverdue = dueDate && dueDate < now &&
            task.status !== 'completed' &&
            task.status !== 'rejected';

        // Deadline keçibsə qırmızı class əlavə et
        const dueDateClass = isOverdue ? 'text-danger fw-bold overdue-date' : '';
        const dueDateIcon = isOverdue ?
            '<i class="fa-solid fa-exclamation-triangle ms-1" title="Bu taskın vaxtı keçib!"></i>' : '';

        const currentUser = window.taskManager?.userData;
        const currentUserId = currentUser?.userId;
        const isCreator = task.created_by == currentUserId;
        const isAdmin = currentUser?.role === 'company_admin' || currentUser?.role === 'admin';

        // ✅ EDIT BUTONU
        let editButton = '';
        let commentsButton = '';
        let detailsButton = '';

        // Arxiv task-lar üçün edit icazəsini yoxla
        let canEdit = false;
        if (isAdmin || isCreator) {
            canEdit = true;
        }

        if (canEdit) {
            editButton = `
                <button class="btn btn-sm btn-warning" onclick="TableManager.openEditModal(${task.id}, 'archive')" 
                        title="Arxiv taskını redaktə et">
                    <i class="fa-solid fa-edit"></i> Edit
                </button>
            `;
        }

        commentsButton = `
            <button class="btn btn-sm btn-info" onclick="TableManager.viewTaskComments(${task.id})" title="Comment-lərə bax">
                <i class="fa-solid fa-comments"></i>
            </button>
        `;

        detailsButton = `
            <button class="btn btn-sm btn-secondary" onclick="TableManager.viewTaskDetails(${task.id})" title="Detallara bax">
                <i class="fa-solid fa-eye"></i>
            </button>
        `;

        // ✅ STATUS BÖLMƏSİ
        let statusBadgeHTML = '';

        if (task.status === 'overdue') {
            statusBadgeHTML = `
                <span class="badge bg-danger" title="Vaxtı keçib: ${this.formatDate(task.due_date)}">
                    <i class="fa-solid fa-clock"></i> GECİKMƏ
                </span>
            `;
        } else {
            statusBadgeHTML = `
                <span class="status-badge ${this.getStatusClass(task.status)}">
                    ${this.getStatusText(task.status)}
                </span>
            `;
        }

        // ✅ FAYL SÜTUNU
        let fileColumnHTML = '-';

        if (task.attachments && task.attachments.length > 0) {
            const attachments = Array.isArray(task.attachments) ? task.attachments : JSON.parse(task.attachments);

            if (attachments.length === 1) {
                const attachment = attachments[0];
                fileColumnHTML = `
                    <div class="file-preview-single" 
                         onclick="TableManager.previewFile(
                             '${attachment.file_id || ''}', 
                             '${attachment.filename || ''}', 
                             '${attachment.mime_type || ''}',
                             ${attachment.is_audio_recording || false}
                         )" 
                         style="cursor: pointer;" 
                         title="${attachment.filename || 'Fayl'}">
                        <i class="fas fa-paperclip"></i>
                    </div>
                `;
            } else if (attachments.length > 1) {
                fileColumnHTML = `
                    <div class="file-preview-multiple">
                        <div class="file-count-badge" onclick="TableManager.showTaskFiles(${task.id})" 
                             style="cursor: pointer;" title="${attachments.length} fayl">
                            <i class="fas fa-paperclip"></i>
                            <span>${attachments.length}</span>
                        </div>
                    </div>
                `;
            }
        }

        const archivedDate = task.archived_at || task.archived_date || '-';

        // ✅ HTML QAYTAR
        return `
            <td>${serialNumber}</td>
            <td>${this.formatDate(task.created_at)}</td>
            <td>${this.escapeHtml(displayCompanyName)}</td>
            <td>${this.escapeHtml(creatorName)}</td>
            <td>${this.escapeHtml(executorName)}</td>
            <td class="actions-col">
                <div class="action-buttons">
                    ${editButton}
                    ${commentsButton}
                    ${detailsButton}
                </div>
            </td>
            <td>${this.escapeHtml(workTypeName)}</td>
            <td class="description-col">
                <div class="description-container">
                    <div class="truncated-description" id="desc-${task.id}" style="display: ${description.length > 100 ? 'block' : 'none'}">
                        ${this.truncateText(description, 100)}
                    </div>
                    <div class="full-description" id="full-desc-${task.id}" style="display: none">
                        ${this.escapeHtml(description)}
                    </div>
                    ${description.length > 100 ? `
                    <button class="expand-btn" onclick="TableManager.toggleDescription(${task.id})" 
                            title="Tam açıqlamaya bax">
                        <i class="fas fa-expand-alt"></i> Tam bax
                    </button>
                    ` : ''}
                </div>
            </td>
            <td class="file-col">
                ${fileColumnHTML}
            </td>
            <td class="${dueDateClass}" title="${isOverdue ? 'Bu taskın vaxtı keçib!' : ''}">
                ${this.formatDate(task.due_date || task.due_at)}
                ${dueDateIcon}
            </td>
            <td>
                <div class="status-section">
                    ${statusBadgeHTML}
                </div>
            </td>
            <td>${this.formatDate(task.completed_date || task.completed_at)}</td>
            <td>${this.formatDate(archivedDate)}</td>
            <td>${durationMinutes}</td>
            <td>${parseFloat(hourlyRate).toFixed(2)}</td>
            <td>${calculatedSalary} ₼</td>
            <td>${this.escapeHtml(departmentName)}</td>
        `;
    },

    // ==================== TASK DETAILS FUNCTIONS ====================
    viewExternalTask: async function (taskId) {
        try {
            console.log(`👁️ Xarici task detalları: ${taskId}`);

            let response = await this.apiRequest(`/tasks/${taskId}`, 'GET');

            if (!response || response.error) {
                alert('❌ Task məlumatları tapılmadı!');
                return;
            }

            const task = response.data || response;
            this.showTaskDetailsModal(task, 'external');

        } catch (error) {
            console.error('❌ Xarici task detalları göstərilərkən xəta:', error);
            alert('❌ Xəta: ' + error.message);
        }
    },

    viewTaskDetails: async function (taskId) {
        try {
            console.log(`👁️ Task detalları: ${taskId}`);


            const response = await this.apiRequest(`/tasks/${taskId}`, 'GET');

            if (!response || response.error) {
                console.error('❌ API xətası:', response);

                // 403 xətası alınsa belə, xüsusi mesaj verək
                if (response.status === 403 ||
                    response.data?.detail?.includes('görə bilməzsiniz') ||
                    response.error?.includes('görə bilməzsiniz')) {

                    // Backend icazə vermir, amma frontend-də söndürdük
                    this.showError('Backend bu task-ı görüntüləməyə icazə vermir.');
                    return;
                }

                this.showError('Task məlumatları tapılmadı!');
                return;
            }

            const task = response.data || response;

            console.log('✅ Task məlumatları uğurla alındı:', {
                id: task.id,
                title: task.task_title,
                company: task.company_name
            });

            // ✅ Hər kəs üçün detalları göstər
            this.showTaskDetailsModal(task, 'active');

        } catch (error) {
            console.error('❌ Task detalları göstərilərkən xəta:', error);

            // Xüsusi backend mesajını göstər
            if (error.response?.status === 403) {
                this.showError('Backend icazə vermir: ' + (error.response.data?.detail || 'Bu taskı görə bilməzsiniz'));
            } else {
                this.showError('Xəta: ' + error.message);
            }
        }
    },




    viewTaskComments: async function (taskId) {
        try {
            console.log(`🔍 Viewing comments for task ${taskId}`);

            // Modal var mı?
            const existingModal = document.getElementById('commentsModalOverlay');
            const existingTaskId = existingModal?.dataset.taskId;

            // Əgər eyni task üçün modal varsa, yenilə
            if (existingModal && existingTaskId == taskId) {
                console.log('🔄 Refreshing existing modal');
                await this.refreshComments(taskId);
                return;
            }

            // Yeni modal üçün comment-ləri götür
            const response = await this.apiRequest(`/comments/task/${taskId}`, 'GET');

            if (response && !response.error) {
                const comments = response.items || response.data || response || [];
                console.log(`✅ Found ${comments.length} comments`);

                // Modal-i göstər (append=false - köhnələri sil)
                this.showCommentsModal(taskId, comments, false);
            } else {
                console.warn('⚠️ No comments found');
                this.showCommentsModal(taskId, [], false);
            }

        } catch (error) {
            console.error('❌ Error viewing comments:', error);
            this.showCommentsModal(taskId, [], false);
        }
    },

    refreshComments: async function (taskId) {
        try {
            console.log(`🔄 Refreshing comments for task ${taskId}`);

            const response = await this.apiRequest(`/comments/task/${taskId}`, 'GET');

            if (response && !response.error) {
                // ƏSAS DÜZƏLTMƏ: Response strukturu yoxla
                let comments = [];

                if (Array.isArray(response)) {
                    comments = response;
                } else if (response.data && Array.isArray(response.data)) {
                    comments = response.data;
                } else if (response.items && Array.isArray(response.items)) {
                    comments = response.items;
                } else {
                    comments = [];
                }

                console.log(`✅ Refreshed: ${comments.length} comments`);

                // Modal-i yenilə
                this.updateCommentsModal(comments);
            } else {
                console.warn('⚠️ No comments found or error');
                this.updateCommentsModal([]);
            }

        } catch (error) {
            console.error('❌ Error refreshing comments:', error);
            this.showToast('❌ Comment-lər yenilənərkən xəta', 'error');
        }
    },

    showTaskDetailsModal: function (task, taskType) {
        const modalHTML = `
            <div class="task-details-modal-overlay" id="taskDetailsModalOverlay">
                <div class="task-details-modal">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-info-circle"></i> Task Detalları</h3>
                        <button class="close-btn" onclick="TableManager.closeTaskDetailsModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="task-details-grid">
                            <div class="detail-group">
                                <label>Task Başlığı:</label>
                                <div class="detail-value">${this.escapeHtml(task.task_title || task.title || 'Adsız')}</div>
                            </div>
                            
                            <div class="detail-group">
                                <label>Açıqlama:</label>
                                <div class="detail-value">${this.escapeHtml(task.task_description || task.description || 'Yoxdur')}</div>
                            </div>
                            
                            <div class="detail-group">
                                <label>Qeydlər:</label>
                                <div class="detail-value">${this.escapeHtml(task.notes || 'Yoxdur')}</div>
                            </div>
                            
                            <div class="detail-row">
                                <div class="detail-group">
                                    <label>Status:</label>
                                    <div class="detail-value">
                                        <span class="status-badge ${this.getStatusClass(task.status)}">
                                            ${this.getStatusText(task.status)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div class="detail-group">
                                    <label>Prioritet:</label>
                                    <div class="detail-value">
                                        <span class="priority-badge priority-${task.priority || 'medium'}">
                                            ${this.getPriorityText(task.priority)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-row">
                                <div class="detail-group">
                                    <label>Yaradılma Tarixi:</label>
                                    <div class="detail-value">${this.formatDate(task.created_at)}</div>
                                </div>
                                
                                <div class="detail-group">
                                    <label>Son Tarix:</label>
                                    <div class="detail-value">${this.formatDate(task.due_date || task.due_at)}</div>
                                </div>
                            </div>
                            
                            <div class="detail-row">
                                <div class="detail-group">
                                    <label>Şirkət:</label>
                                    <div class="detail-value">${this.escapeHtml(task.company_name || 'Naməlum')}</div>
                                </div>
                                
                                <div class="detail-group">
                                    <label>İşçi:</label>
                                    <div class="detail-value">${this.escapeHtml(task.assigned_to_name || 'Təyin edilməyib')}</div>
                                </div>
                            </div>
                            
                            ${task.attachment_url ? `
                            <div class="detail-group">
                                <label>Fayl:</label>
                                <div class="detail-value">
                                    <a href="${task.attachment_url}" target="_blank" class="file-link">
                                        <i class="fa-solid fa-file"></i> Fayla bax
                                    </a>
                                </div>
                            </div>
                            ` : ''}
                            
                            <div class="detail-group">
                                <label>Proqress:</label>
                                <div class="detail-value">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${task.progress_percentage || 0}%"></div>
                                        <span class="progress-text">${task.progress_percentage || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="TableManager.closeTaskDetailsModal()">
                                <i class="fa-solid fa-times"></i> Bağla
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const oldModal = document.getElementById('taskDetailsModalOverlay');
        if (oldModal) oldModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    showCommentsModal: function (taskId, comments, append = false) {
        try {
            console.log(`🎯 showCommentsModal: taskId=${taskId}, comments=${comments?.length || 0}, append=${append}`);

            // Modal var mı?
            let modal = document.getElementById('commentsModalOverlay');

            if (!modal) {
                // Modal yoxdursa, yaradaq
                this.createCommentsModal(taskId, comments);
                console.log('✅ New modal created');
            } else {
                // Modal varsa, task ID-ni yenilə
                modal.dataset.taskId = taskId;

                // Comment-ləri əlavə et və ya yenilə
                if (append && comments && comments.length > 0) {
                    this.appendCommentsToModal(comments);
                    console.log(`📝 Appended ${comments.length} comments`);
                } else {
                    this.updateCommentsModal(comments || []);
                    console.log(`🔄 Updated modal with ${comments?.length || 0} comments`);
                }

                // Input field-i təmizlə
                const commentInput = document.getElementById('newCommentText');
                if (commentInput) {
                    commentInput.value = '';
                    commentInput.focus();
                }
            }

        } catch (error) {
            console.error('❌ Error in showCommentsModal:', error);
        }
    },

    updateCommentsModal: function (comments) {
        try {
            const commentsList = document.getElementById('commentsList');
            if (!commentsList) {
                console.error('❌ Comments list not found');
                return;
            }

            console.log(`🔄 Updating modal with ${comments.length} comments`);
            console.log('🔍 Comments structure:', comments);

            if (!comments || comments.length === 0) {
                commentsList.innerHTML = '<div class="no-comments">Heç bir comment yoxdur</div>';
                return;
            }

            let html = '';

            comments.forEach((comment, index) => {
                // ƏSAS DÜZƏLTMƏ: comment.data obyektindən istifadə et
                const commentData = comment.data || comment;

                console.log(`📝 Comment ${index} details:`, {
                    id: commentData.id,
                    hasUser: !!commentData.user,
                    userKeys: commentData.user ? Object.keys(commentData.user) : 'No user',
                    commentText: commentData.comment_text
                });

                let userName = 'Anonim';

                if (commentData.user) {
                    console.log(`👤 Comment ${index} user:`, commentData.user);

                    if (commentData.user.full_name_with_lastname) {
                        userName = this.escapeHtml(commentData.user.full_name_with_lastname);
                    }
                    else if (commentData.user.full_name) {
                        const fullName = commentData.user.full_name;
                        const lastName = commentData.user.last_name || '';
                        userName = this.escapeHtml(`${fullName} ${lastName}`.trim());
                    }
                    else if (commentData.user.name) {
                        userName = this.escapeHtml(commentData.user.name);
                    }
                    else if (commentData.user.username) {
                        userName = this.escapeHtml(commentData.user.username);
                    }
                    else if (commentData.user.email) {
                        userName = this.escapeHtml(commentData.user.email.split('@')[0]);
                    }
                } else {
                    console.log(`❌ Comment ${index} has no user object`);

                    if (commentData.created_by_name) {
                        userName = this.escapeHtml(commentData.created_by_name);
                    } else if (commentData.user_id) {
                        const currentUser = window.taskManager?.userData;
                        if (currentUser && commentData.user_id == currentUser.userId) {
                            userName = this.escapeHtml(currentUser.fullName || currentUser.name || 'Siz');
                        } else {
                            userName = `İstifadəçi ID: ${commentData.user_id}`;
                        }
                    }
                }

                // Tarix
                const dateStr = this.formatDate(commentData.created_at);
                const commentText = commentData.comment_text || '';

                console.log(`📅 Comment ${index}: ${userName} - ${dateStr}`);

                html += `
                    <div class="comment-item" data-comment-id="${commentData.id}">
                        <div class="comment-header">
                            <span class="comment-author">${userName}</span>
                            <span class="comment-date">${dateStr}</span>
                        </div>
                        <div class="comment-text">${this.escapeHtml(commentText)}</div>
                    </div>
                `;
            });

            commentsList.innerHTML = html;
            console.log('✅ Modal updated');

        } catch (error) {
            console.error('❌ Error updating modal:', error);
        }
    },

    createCommentsModal: function (taskId, initialComments = []) {
        try {
            console.log(`🆕 Creating new modal for task ${taskId}`);
            console.log('🔍 Initial comments:', initialComments);

            let commentsHTML = '';

            if (initialComments && initialComments.length > 0) {
                commentsHTML = initialComments.map((comment, index) => {
                    // ƏSAS DÜZƏLTMƏ: comment.data obyektindən istifadə et
                    const commentData = comment.data || comment;

                    console.log(`📝 Processing initial comment ${index}:`, commentData);

                    let userName = 'Anonim';

                    if (commentData.user) {
                        console.log(`👤 Comment ${index} has user object:`, commentData.user);

                        if (commentData.user.full_name_with_lastname) {
                            userName = this.escapeHtml(commentData.user.full_name_with_lastname);
                        }
                        else if (commentData.user.full_name) {
                            const fullName = commentData.user.full_name;
                            const lastName = commentData.user.last_name || '';
                            userName = this.escapeHtml(`${fullName} ${lastName}`.trim());
                        }
                        else if (commentData.user.name) {
                            userName = this.escapeHtml(commentData.user.name);
                        }
                        else if (commentData.user.username) {
                            userName = this.escapeHtml(commentData.user.username);
                        }
                        else if (commentData.user.email) {
                            userName = this.escapeHtml(commentData.user.email.split('@')[0]);
                        }
                    } else {
                        console.log(`❌ Comment ${index} has no user object`);

                        if (commentData.created_by_name) {
                            userName = this.escapeHtml(commentData.created_by_name);
                        } else if (commentData.user_id) {
                            const currentUser = window.taskManager?.userData;
                            if (currentUser && commentData.user_id == currentUser.userId) {
                                userName = this.escapeHtml(currentUser.fullName || currentUser.name || 'Siz');
                            } else {
                                userName = `İstifadəçi ID: ${commentData.user_id}`;
                            }
                        }
                    }

                    const dateStr = this.formatDate(commentData.created_at);
                    const commentText = commentData.comment_text || '';

                    console.log(`📅 Comment ${index}: ${userName} - ${dateStr}`);

                    return `
                        <div class="comment-item" data-comment-id="${commentData.id}">
                            <div class="comment-header">
                                <span class="comment-author">${userName}</span>
                                <span class="comment-date">${dateStr}</span>
                            </div>
                            <div class="comment-text">${this.escapeHtml(commentText)}</div>
                        </div>
                    `;
                }).join('');
            } else {
                commentsHTML = '<div class="no-comments">Heç bir comment yoxdur</div>';
            }

            const modalHTML = `
                <div class="comments-modal-overlay" id="commentsModalOverlay" data-task-id="${taskId}">
                    <div class="comments-modal">
                        <div class="modal-header">
                            <h3><i class="fa-solid fa-comments"></i> Comment-lər (Task ${taskId})</h3>
                            <button class="close-btn" onclick="TableManager.closeCommentsModal()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="comments-list" id="commentsList">
                                ${commentsHTML}
                            </div>
                            
                            <div class="add-comment">
                                <textarea id="newCommentText" class="form-control" placeholder="Yeni comment əlavə et..." rows="3"></textarea>
                                <button class="btn btn-primary" onclick="TableManager.addComment(${taskId})">
                                    <i class="fa-solid fa-paper-plane"></i> Göndər
                                </button>
                            </div>
                            
                            <div class="modal-actions">
                                <button type="button" class="btn btn-secondary" onclick="TableManager.closeCommentsModal()">
                                    <i class="fa-solid fa-times"></i> Bağla
                                </button>
                                <button type="button" class="btn btn-info" onclick="TableManager.refreshComments(${taskId})">
                                    <i class="fa-solid fa-sync-alt"></i> Yenilə
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            console.log('✅ Modal created successfully');

        } catch (error) {
            console.error('❌ Error creating modal:', error);
        }
    },

    appendCommentsToModal: function (comments) {
        try {
            console.log('🔍 appendCommentsToModal - comments:', comments);

            const commentsList = document.getElementById('commentsList');
            if (!commentsList) return;

            // Əvvəlcə "no comments" mesajını silək
            const noComments = commentsList.querySelector('.no-comments');
            if (noComments) noComments.remove();

            let html = '';

            comments.forEach((comment, index) => {
                console.log(`📝 Comment ${index}:`, comment);

                // ƏSAS DÜZƏLTMƏ: comment.data obyektindən istifadə et
                const commentData = comment.data || comment;
                console.log(`📦 Comment data:`, commentData);
                console.log(`👤 Comment user:`, commentData.user);

                let userName = 'Anonim';
                let commentText = '';
                let commentDate = '';

                // ƏSAS DÜZƏLTMƏ: commentData-dan məlumatları al
                if (commentData.user) {
                    console.log('✅ User object exists in commentData');

                    if (commentData.user.full_name_with_lastname) {
                        userName = this.escapeHtml(commentData.user.full_name_with_lastname);
                    }
                    else if (commentData.user.full_name) {
                        const fullName = commentData.user.full_name;
                        const lastName = commentData.user.last_name || '';
                        userName = this.escapeHtml(`${fullName} ${lastName}`.trim());
                    }
                    else if (commentData.user.name) {
                        userName = this.escapeHtml(commentData.user.name);
                    }
                    else if (commentData.user.username) {
                        userName = this.escapeHtml(commentData.user.username);
                    }
                    else if (commentData.user.email) {
                        userName = this.escapeHtml(commentData.user.email.split('@')[0]);
                    }
                } else {
                    console.log('❌ User object not found in commentData');

                    // Əgər user_id varsa
                    if (commentData.user_id) {
                        console.log(`👤 Using user_id: ${commentData.user_id}`);
                        userName = `İstifadəçi ID: ${commentData.user_id}`;
                    }
                }

                // Comment text-i al
                commentText = commentData.comment_text || '';
                console.log(`📝 Comment text: ${commentText}`);

                // Tarix
                commentDate = this.formatDate(commentData.created_at);
                console.log(`📅 Date: ${commentDate}`);

                html += `
                    <div class="comment-item" data-comment-id="${commentData.id}">
                        <div class="comment-header">
                            <span class="comment-author">${userName}</span>
                            <span class="comment-date">${commentDate}</span>
                        </div>
                        <div class="comment-text">${this.escapeHtml(commentText)}</div>
                    </div>
                `;
            });

            // Yeni comment-ləri əvvələ əlavə edək (ən yeni üstdə)
            commentsList.insertAdjacentHTML('afterbegin', html);
            console.log(`📝 Appended ${comments.length} comments to modal`);

        } catch (error) {
            console.error('❌ Error appending comments:', error);
        }
    },

    addComment: async function (taskId) {
        try {
            const commentText = document.getElementById('newCommentText').value;

            if (!commentText.trim()) {
                this.showError('Zəhmət olmasa comment yazın!');
                return;
            }

            console.log(`📝 Adding comment to task ${taskId}: ${commentText}`);

            const response = await this.apiRequest('/comments/', 'POST', {
                task_id: taskId,
                comment_text: commentText
            });

            if (response && !response.error) {
                console.log('✅ Comment response:', response);

                // ƏSAS DÜZƏLTMƏ: Response strukturu yoxla
                const commentData = response.data || response;
                console.log('📦 Comment data:', commentData);

                // Əgər commentData.user yoxdursa, current user məlumatlarını əlavə et
                if (!commentData.user) {
                    const currentUser = this.getCurrentUser();
                    if (currentUser) {
                        commentData.user = {
                            id: currentUser.userId,
                            full_name: currentUser.fullName || currentUser.name,
                            last_name: currentUser.lastName || '',
                            full_name_with_lastname: currentUser.fullName || currentUser.name,
                            email: currentUser.email,
                            username: currentUser.name
                        };
                        console.log('👤 Added current user data to comment:', commentData.user);
                    }
                }

                // Input-u təmizlə
                document.getElementById('newCommentText').value = '';

                // Yeni comment-i əlavə et - ƏSAS DÜZƏLTMƏ: commentData ilə
                this.appendCommentsToModal([{ data: commentData }]);
                

                // Modal-da comment sayını yenilə
                this.updateCommentCount(taskId);

            } else {
                throw new Error('Comment əlavə edilə bilmədi');
            }

        } catch (error) {
            console.error('❌ Comment əlavə edilərkən xəta:', error);
            this.showError('Xəta: ' + error.message);
        }
    },

    showToast: function (message, type = 'info') {
        // Sadə toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 4px;
            z-index: 9999;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },


    // ==================== WEBSOCKET INTEGRATION ====================
    initializeWebSocket: function() {
        try {
            console.log('🔌 WebSocket listener qoşulur...');

            // WebSocket yoxdursa, bir neçə saniyə gözlə və yenidən cəhd et
            if (!window.WebSocketManager) {
                console.warn('⚠️ WebSocketManager tapılmadı, 3 saniyə sonra yenidən cəhd ediləcək');
                setTimeout(() => {
                    this.initializeWebSocket();
                }, 3000);
                return;
            }

            // Task bildirişləri üçün listener
            if (window.WebSocketManager.on) {
                window.WebSocketManager.on('task_notification', (data) => {
                    console.log('🔔 WebSocket task bildirişi alındı:', data);
                    this.handleWebSocketNotification(data);
                });

                window.WebSocketManager.on('system_message', (data) => {
                    console.log('🔔 WebSocket system message:', data);
                    this.handleSystemMessage(data);
                });
            } else if (window.WebSocketManager.addEventListener) {
                // Əgər başqa bir WebSocket manager istifadə olunursa
                window.WebSocketManager.addEventListener('message', (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'task_notification') {
                            this.handleWebSocketNotification(data);
                        }
                    } catch (e) {
                        console.error('WebSocket message parse xətası:', e);
                    }
                });
            }

            console.log('✅ WebSocket listener qoşuldu');

        } catch (error) {
            console.error('❌ WebSocket initialize xətası:', error);
        }
    },

    handleWebSocketNotification: function(data) {
        try {
            const { type, event, message, title, icon, task } = data;

            console.log(`🔔 WebSocket Notification: ${event}`, {
                event: event,
                hasSoundManager: !!window.SoundManager,
                hasTaskManager: !!window.taskManager,
                taskTitle: task?.task_title
            });

            // ✅ 1. SƏS ÇAL
            if (window.SoundManager) {
                console.log(`🔊 Səs çalınır: ${event}`);

                // Event tipinə görə səs seç
                if (window.SoundManager.playForWebSocketEvent) {
                    // Əgər xüsusi WebSocket funksiyası varsa
                    window.SoundManager.playForWebSocketEvent(event);
                } else if (window.SoundManager.playSound) {
                    // Standart səs funksiyası
                    const soundMap = {
                        'task_created': 'taskAdded',
                        'task_completed': 'taskCompleted',
                        'task_rejected': 'taskRejected',
                        'task_assigned': 'taskAssigned',
                        'task_updated': 'taskAdded',
                        'task_started': 'taskAdded'
                    };

                    const soundType = soundMap[event] || 'taskAdded';
                    window.SoundManager.playSound(soundType);
                } else {
                    console.warn('⚠️ SoundManager-da playSound funksiyası tapılmadı');
                }
            } else {
                console.warn('⚠️ SoundManager tapılmadı, fallback səs istifadə edilir');
                this.playFallbackSound('taskAdded');
            }

            // ✅ 2. TOAST NOTIFICATION GÖSTƏR
            this.showWebSocketToast(data);

            // ✅ 3. CƏDVƏLİ YENİLƏ (əgər cari tab-dadırsa)
            if (task && task.company_id) {
                this.refreshTableIfNeeded(task);
            }

            // ✅ 4. BROWSER NOTIFICATION (əgər arxa plandadırsa)
            if (document.hidden) {
                this.showBrowserNotification(data);
            }

        } catch (error) {
            console.error('❌ WebSocket notification handle xətası:', error);
        }
    },

    showWebSocketToast: function(data) {
        try {
            const { event, message, title, icon = '🔔', task } = data;

            // Toast mesajı yarat
            const toast = document.createElement('div');
            toast.className = 'websocket-toast notification-toast';

            // Əgər style yoxdursa, əlavə et
            if (!document.querySelector('#toastStyles')) {
                const style = document.createElement('style');
                style.id = 'toastStyles';
                style.textContent = `
                    .websocket-toast {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: white;
                        border-left: 4px solid #4cd964;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                        z-index: 9999;
                        max-width: 350px;
                        animation: slideIn 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    .toast-icon {
                        font-size: 24px;
                    }
                    .toast-content {
                        flex: 1;
                    }
                    .toast-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                        color: #333;
                    }
                    .toast-message {
                        color: #666;
                        font-size: 14px;
                    }
                    .toast-close {
                        background: none;
                        border: none;
                        font-size: 20px;
                        cursor: pointer;
                        color: #999;
                    }
                    .toast-task {
                        font-size: 12px;
                        color: #888;
                        margin-top: 3px;
                    }
                `;
                document.head.appendChild(style);
            }

            // Mesaj mətni
            let displayTitle = title;
            let displayMessage = message;

            if (!displayTitle) {
                const titleMap = {
                    'task_created': '➕ Yeni Task',
                    'task_completed': '✅ Task Tamamlandı',
                    'task_rejected': '❌ Task İmtina',
                    'task_assigned': '👤 Task Təyin Edildi',
                    'task_updated': '✏️ Task Yeniləndi',
                    'task_started': '🚀 Task Başladı'
                };
                displayTitle = titleMap[event] || '🔔 Yeni Bildiriş';
            }

            toast.innerHTML = `
                <div class="toast-icon">${icon}</div>
                <div class="toast-content">
                    <div class="toast-title">${displayTitle}</div>
                    <div class="toast-message">${displayMessage || ''}</div>
                    ${task?.task_title ? `<div class="toast-task">${task.task_title}</div>` : ''}
                </div>
                <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
            `;

            document.body.appendChild(toast);

            // 5 saniyədən sonra sil
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (toast.parentElement) {
                            toast.remove();
                        }
                    }, 300);
                }
            }, 5000);

        } catch (error) {
            console.error('❌ Toast göstərilərkən xəta:', error);
        }
    },

    refreshTableIfNeeded: function(task) {
        try {
            if (!task) return;

            // Cari user məlumatları
            const currentUser = window.taskManager?.userData;
            if (!currentUser) return;

            // Əgər task bu şirkətə aiddirsə
            if (task.company_id && task.company_id === currentUser.companyId) {
                // Hansı tab aktivdir?
                const activeTab = document.querySelector('.nav-tabs .active');
                if (!activeTab) return;

                const tabId = activeTab.id;

                // 2 saniyə gözlə, sonra yenilə
                setTimeout(() => {
                    try {
                        switch(tabId) {
                            case 'active-tab':
                            case 'nav-active':
                                if (window.taskManager?.loadActiveTasks) {
                                    window.taskManager.loadActiveTasks();
                                    console.log('🔄 Aktiv cədvəl yeniləndi (WebSocket)');
                                }
                                break;

                            case 'archive-tab':
                            case 'nav-archive':
                                if (window.taskManager?.loadArchiveTasks) {
                                    window.taskManager.loadArchiveTasks();
                                    console.log('🔄 Arxiv cədvəli yeniləndi (WebSocket)');
                                }
                                break;

                            case 'external-tab':
                            case 'nav-external':
                                if (window.taskManager?.loadExternalTasks) {
                                    window.taskManager.loadExternalTasks();
                                    console.log('🔄 Xarici cədvəl yeniləndi (WebSocket)');
                                }
                                break;
                        }
                    } catch (refreshError) {
                        console.error('Cədvəl yenilənərkən xəta:', refreshError);
                    }
                }, 2000);
            }

        } catch (error) {
            console.error('❌ Cədvəl yenilənərkən xəta:', error);
        }
    },

    showBrowserNotification: function(data) {
        try {
            if (!('Notification' in window)) return;

            if (Notification.permission === 'default') {
                Notification.requestPermission();
                return;
            }

            if (Notification.permission !== 'granted') return;

            const { title, message, task, event } = data;

            // Notification başlığı
            let notificationTitle = title;
            if (!notificationTitle) {
                const titleMap = {
                    'task_created': 'Yeni Task',
                    'task_completed': 'Task Tamamlandı',
                    'task_rejected': 'Task İmtina',
                    'task_assigned': 'Task Təyin Edildi'
                };
                notificationTitle = titleMap[event] || 'Task Bildirişi';
            }

            // Notification mətni
            let notificationBody = message || '';
            if (task?.task_title) {
                notificationBody = task.task_title + (message ? ` - ${message}` : '');
            }

            const notification = new Notification(notificationTitle, {
                body: notificationBody,
                icon: '/favicon.ico',
                tag: 'task-notification-' + Date.now(),
                requireInteraction: false
            });

            notification.onclick = function() {
                window.focus();
                notification.close();
            };

            // 5 saniyə sonra avtomatik bağla
            setTimeout(() => {
                notification.close();
            }, 5000);

        } catch (error) {
            console.error('❌ Browser notification xətası:', error);
        }
    },

    handleSystemMessage: function(data) {
        try {
            const { message, message_type } = data;

            console.log(`🔔 System Message: ${message_type} - ${message}`);

            // Urgent mesajlar üçün səs
            if (message_type === 'urgent' && window.SoundManager) {
                if (window.SoundManager.playSound) {
                    window.SoundManager.playSound('taskCompleted');
                }
            }

            // Notification göstər
            this.showToast(message, message_type === 'error' ? 'error' : 'info');

        } catch (error) {
            console.error('❌ System message handle xətası:', error);
        }
    },

    showToast: function(message, type = 'info') {
        try {
            // Köhnə toastları sil
            const oldToasts = document.querySelectorAll('.simple-toast');
            oldToasts.forEach(toast => {
                if (toast.parentElement) {
                    toast.remove();
                }
            });

            const toast = document.createElement('div');
            toast.className = `simple-toast toast-${type}`;
            toast.textContent = message;

            // Stil
            toast.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'success' ? '#4cd964' : 
                            type === 'error' ? '#ff3b30' : 
                            type === 'warning' ? '#ff9500' : '#007aff'};
                color: white;
                border-radius: 8px;
                z-index: 9998;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: fadeInUp 0.3s ease;
                font-size: 14px;
                max-width: 300px;
                word-wrap: break-word;
            `;

            // Animation style
            if (!document.querySelector('#toastAnimation')) {
                const style = document.createElement('style');
                style.id = 'toastAnimation';
                style.textContent = `
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(toast);

            // 3 saniyədən sonra sil
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(-20px)';
                    setTimeout(() => {
                        if (toast.parentElement) {
                            toast.remove();
                        }
                    }, 300);
                }
            }, 3000);

        } catch (error) {
            console.error('❌ Toast xətası:', error);
        }
    },

    updateCommentCount: async function (taskId) {
        try {
            // Task-in comment sayını yenilə (əgər task list-də göstərirsizsə)
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                const commentCountElement = taskElement.querySelector('.comment-count');
                if (commentCountElement) {
                    // API-dən yeni sayı götür
                    const response = await this.apiRequest(`/comments/task/${taskId}`, 'GET');
                    const count = response?.total || 0;
                    commentCountElement.textContent = count;
                }
            }
        } catch (error) {
            console.error('❌ Error updating comment count:', error);
        }
    },

    closeTaskDetailsModal: function () {
        const modal = document.getElementById('taskDetailsModalOverlay');
        if (modal) {
            modal.remove();
        }
    },

    closeCommentsModal: function () {
        const modal = document.getElementById('commentsModalOverlay');
        if (modal) {
            modal.remove();
        }
    },

    // ==================== HELPER FUNCTIONS ====================
    createFileLink: function (fileUrl) {
        if (!fileUrl) return '-';
        return `<a href="${fileUrl}" target="_blank" class="file-link"><i class="fa-solid fa-file"></i> Fayl</a>`;
    },

    calculateSalary: function (hourlyRate, durationMinutes) {
        if (!hourlyRate || !durationMinutes) return '0.00';
        const hours = durationMinutes / 60;
        const salary = hours * parseFloat(hourlyRate);
        return salary.toFixed(2);
    },

    formatDate: function (dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('az-AZ');
        } catch (e) {
            return dateString;
        }
    },

    getStatusText: function (status) {
        const statusMap = {
            'pending': 'Gözləyir',
            'in_progress': 'İşlənir',
            'completed': 'Tamamlandı',
            'overdue': 'Gözləyir', // Yeniləndi
            'rejected': 'Rədd edildi'
        };
        return statusMap[status] || status;
    },

    getStatusClass: function (status) {
        const classMap = {
            'pending': 'status-pending',
            'in_progress': 'status-in-progress',
            'completed': 'status-completed',
            'overdue': 'status-pending', // Qırmızı rəng üçün
            'rejected': 'status-rejected'
        };
        return classMap[status] || '';
    },

    getPriorityText: function (priority) {
        const priorityMap = {
            'low': 'Aşağı',
            'medium': 'Orta',
            'high': 'Yüksək',
            'critical': 'Kritik'
        };
        return priorityMap[priority] || priority;
    },

    truncateText: function (text, length) {
        if (!text) return '';
        if (text.length <= length) return this.escapeHtml(text);
        return this.escapeHtml(text.substring(0, length)) + '...';
    },

    escapeHtml: function (text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showEmptyTable: function (tableType, tbody) {
        let message = '';
        let subMessage = '';
        let colspan = 0;

        switch (tableType) {
            case 'active':
                message = '📋 Hazırda heç bir aktiv iş yoxdur';
                subMessage = 'Yeni iş yaratmaq üçün "Yeni İş" düyməsinə basın';
                colspan = 16;
                break;
            case 'archive':
                message = '📁 Hazırda heç bir arxiv işi yoxdur';
                subMessage = 'Tamamlanmış işlər həftəlik olaraq buraya arxivlənir';
                colspan = 15;
                break;
            case 'external':
                message = '🌐 Hazırda digər şirkətlərdən heç bir iş tapılmadı';
                subMessage = 'Digər şirkətlər sizə task göndərdikdə burada görünəcək';
                colspan = 12;
                break;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="empty-state">
                    ${message}
                    <br>
                    <small>${subMessage}</small>
                </td>
            </tr>
        `;
    },






    updateTableMeta: function (tableType, taskCount) {
        const element = this.metaElements[tableType];
        if (!element) return;

        const labels = {
            'active': 'aktiv iş',
            'archive': 'arxiv işi',
            'external': 'xarici iş'
        };

        element.textContent = `${taskCount} ${labels[tableType] || 'iş'}`;
    },
    // ==================== AUTO REFRESH FUNCTIONS ====================
    autoRefreshAfterAction: function(taskId, tableType, actionType = null) {
        try {
            console.log(`🔄 Auto refresh başladı: task ${taskId}, table ${tableType}, action ${actionType}`);

            // 1.5 saniyə gözlə, sonra yenilə
            setTimeout(() => {
                if (window.taskManager) {
                    console.log(`🔁 ${tableType} cədvəli yenilənir...`);

                    switch (tableType) {
                        case 'active':
                            window.taskManager.loadActiveTasks();
                            break;
                        case 'archive':
                            window.taskManager.loadArchiveTasks();
                            break;
                        case 'external':
                            window.taskManager.loadExternalTasks();
                            break;
                        default:
                            // Bütün cədvəlləri yenilə
                            window.taskManager.loadActiveTasks();
                            window.taskManager.loadArchiveTasks();
                            window.taskManager.loadExternalTasks();
                    }

                    // Əgər action tipi varsa, xüsusi mesaj göstər
                    if (actionType) {
                        const messages = {
                            'taken': '✅ İş uğurla özünüzə götürüldü və cədvəl yeniləndi!',
                            'completed': '✅ İş tamamlandı və cədvəl yeniləndi!',
                            'rejected': '✅ İş imtina edildi və cədvəl yeniləndi!'
                        };

                        if (messages[actionType]) {
                            this.showSuccess(messages[actionType]);
                        }
                    }
                } else {
                    console.warn('⚠️ taskManager tapılmadı, auto refresh edilə bilmədi');
                }
            }, 1500); // 1.5 saniyə gözlə

        } catch (error) {
            console.error('❌ Auto refresh xətası:', error);
        }
    },


    // ==================== SOUND FUNCTIONS ====================
    playTaskSound: function (soundType) {
        try {
            if (typeof SoundManager !== 'undefined' && SoundManager.playSound) {
                SoundManager.playSound(soundType);
            } else {
                // Fallback: sadə səs
                this.playFallbackSound(soundType);
            }
        } catch (error) {
            console.error('Səs oynadıla bilmədi:', error);
        }
    },

    playFallbackSound: function (soundType) {
        try {
            // Sadə browser səs API
            if (!window.AudioContext && !window.webkitAudioContext) {
                console.log('AudioContext dəstəklənmir');
                return;
            }

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Fərqli səs növləri üçün fərqli frekanslar
            const frequencies = {
                taskCompleted: 523.25, // C5
                taskAdded: 659.25,    // E5
                taskRejected: 392.00,  // G4
                notification: 440.00   // A4
            };

            oscillator.frequency.value = frequencies[soundType] || 440;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

        } catch (error) {
            console.log('Fallback səs də oynadıla bilmədi:', error);
        }
    },

    showTaskNotification: function (title, message) {
        // Browser notifications
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/assets/images/logo.png'
            });
        }

        // Daxili notification sistemi
        if (typeof notificationService !== 'undefined' && notificationService.showInfo) {
            notificationService.showInfo(message);
        }
    },
};



// tableManager.js faylının ƏN SONUNA bu kodu əlavə edin (əlavə etdiyiniz kodu silin):

// Global export for browser - BUNU ƏLAVƏ EDİN
if (typeof window !== 'undefined') {
    window.TableManager = TableManager;
    window.tableManager = TableManager; // tableManager da istifadə olunur

    console.log('✅ TableManager exported to window as both TableManager and tableManager');

    // Initialize automatically if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            TableManager.initialize && TableManager.initialize();
        });
    } else {
        TableManager.initialize && TableManager.initialize();
    }
}

