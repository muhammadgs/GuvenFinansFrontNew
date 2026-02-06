// taskEditModule.js - AYRI FAYL
const TaskEditModule = {
    // ==================== TASK EDIT MODAL ====================
    openEditTaskModal: async function(taskId, taskType = 'active') {
        try {
            console.log(`✏️ Task redaktə modalı açılır: ${taskId} (${taskType})`);

            // BÜTÜN task'lar için AYNI endpoint'i kullan
            const endpoint = `/tasks/${taskId}`;

            const response = await makeApiRequest(endpoint, 'GET');

            if (!response || response.error) {
                alert('❌ Task məlumatları tapılmadı!');
                return;
            }

            const task = response.data || response;
            console.log('📋 Task məlumatları:', task);

            // Modal göstər
            this.showEditModal(task, taskType, taskId);

        } catch (error) {
            console.error('❌ Edit modal açılarkən xəta:', error);
            alert('❌ Xəta: ' + error.message);
        }
    },

    showEditModal: function(task, taskType, taskId) {
        // Önceki modal varsa sil
        const oldModal = document.getElementById('taskEditModalOverlay');
        if (oldModal) oldModal.remove();

        // Modal HTML'i oluştur
        const modalHTML = `
            <div class="task-edit-modal-overlay" id="taskEditModalOverlay">
                <div class="task-edit-modal">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-edit"></i> Task Redaktəsi</h3>
                        <button class="close-btn" onclick="TaskEditModule.closeEditModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="task-info-header">
                            <span class="task-type-badge ${taskType}">
                                ${taskType === 'external' ? '🌐 Xarici Task' : '🏢 Daxili Task'}
                            </span>
                            <span class="task-id">ID: ${taskId}</span>
                        </div>
                        
                        <form id="taskEditForm">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="editTaskTitle">Task Başlığı:</label>
                                    <input type="text" id="editTaskTitle" class="form-control" 
                                           value="${this.escapeHtml(task.task_title || task.title || '')}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editTaskDescription">Açıqlama:</label>
                                    <textarea id="editTaskDescription" class="form-control" rows="3">${this.escapeHtml(task.task_description || task.description || '')}</textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editTaskNotes">Qeydlər:</label>
                                    <textarea id="editTaskNotes" class="form-control" rows="2">${this.escapeHtml(task.notes || '')}</textarea>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="editDueDate">Son Tarix:</label>
                                        <input type="date" id="editDueDate" class="form-control" 
                                               value="${task.due_date ? task.due_date.split('T')[0] : ''}">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="editPriority">Prioritet:</label>
                                        <select id="editPriority" class="form-control">
                                            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Aşağı</option>
                                            <option value="medium" ${(!task.priority || task.priority === 'medium') ? 'selected' : ''}>Orta</option>
                                            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Yüksək</option>
                                            <option value="critical" ${task.priority === 'critical' ? 'selected' : ''}>Kritik</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="editStatus">Status:</label>
                                        <select id="editStatus" class="form-control">
                                            <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Gözləyir</option>
                                            <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>İşlənir</option>
                                            <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Tamamlandı</option>
                                            <option value="rejected" ${task.status === 'rejected' ? 'selected' : ''}>Imtina edildi</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="editProgress">Proqress (%):</label>
                                        <div class="progress-container">
                                            <input type="range" id="editProgress" class="form-control-range" 
                                                   min="0" max="100" step="5"
                                                   value="${task.progress_percentage || 0}">
                                            <span id="progressValue" class="progress-value">${task.progress_percentage || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="task-details-section">
                                    <div class="detail-item">
                                        <span class="detail-label">Şirkət:</span>
                                        <span class="detail-value">${this.escapeHtml(task.company_name || task.company_code || 'Bilinmir')}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Yaradan:</span>
                                        <span class="detail-value">${this.escapeHtml(task.creator_name || task.created_by_name || 'Bilinmir')}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Təyin edilib:</span>
                                        <span class="detail-value">${this.escapeHtml(task.assigned_to_name || 'Təyin edilməyib')}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <input type="hidden" id="editTaskId" value="${taskId}">
                                <input type="hidden" id="editTaskType" value="${taskType}">
                                
                                <button type="button" class="btn btn-primary" onclick="TaskEditModule.saveTaskEdit()">
                                    <i class="fa-solid fa-save"></i> Yadda Saxla
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="TaskEditModule.closeEditModal()">
                                    <i class="fa-solid fa-times"></i> Ləğv et
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Yeni modal ekle
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Progress slider event
        const progressSlider = document.getElementById('editProgress');
        const progressValue = document.getElementById('progressValue');

        if (progressSlider && progressValue) {
            progressSlider.addEventListener('input', function() {
                progressValue.textContent = this.value + '%';
            });
        }
    },

    closeEditModal: function() {
        const modal = document.getElementById('taskEditModalOverlay');
        if (modal) {
            modal.remove();
        }
    },

    saveTaskEdit: async function() {
        try {
            const taskId = document.getElementById('editTaskId').value;
            const taskType = document.getElementById('editTaskType').value;

            console.log(`💾 Task saxlanılır: ${taskId} (${taskType})`);

            // Form verilerini topla
            const updateData = {
                task_title: document.getElementById('editTaskTitle').value,
                task_description: document.getElementById('editTaskDescription').value,
                notes: document.getElementById('editTaskNotes').value,
                due_date: document.getElementById('editDueDate').value || null,
                priority: document.getElementById('editPriority').value,
                status: document.getElementById('editStatus').value,
                progress_percentage: parseInt(document.getElementById('editProgress').value) || 0
            };

            console.log('📦 Update data:', updateData);

            // Task tipine göre permission kontrolü
            if (taskType === 'external') {
                // Önce izin kontrolü yap
                if (!confirm(`⚠️ BU XARİCİ TASK-DIR!\n\n${taskId} nömrəli task başqa şirkətə aiddir. Yeniləmək istədiyinizə əminsiniz?`)) {
                    return;
                }
            }

            // API çağrısı - PATCH metodu ile
            const endpoint = `/tasks/${taskId}`;
            const response = await makeApiRequest(endpoint, 'PATCH', updateData);

            if (response && !response.error) {
                // Modal kapat
                this.closeEditModal();

                // Başarı mesajı
                alert('✅ Task uğurla yeniləndi!');

                // Tabloları yenile
                setTimeout(() => {
                    if (window.taskManager) {
                        if (taskType === 'active') {
                            window.taskManager.loadActiveTasks();
                        } else if (taskType === 'external') {
                            window.taskManager.loadExternalTasks();
                            window.taskManager.loadActiveTasks(); // Çünkü artık aktif olabilir
                        } else if (taskType === 'archive') {
                            window.taskManager.loadArchiveTasks();
                        }
                    }
                }, 1000);
            } else {
                throw new Error(response?.detail || response?.error || 'Task yenilənə bilmədi');
            }

        } catch (error) {
            console.error('❌ Task redaktə xətası:', error);
            alert('❌ Xəta: ' + error.message);
        }
    },

    // ==================== REJECT & COMPLETE FUNCTIONS ====================
    rejectTask: async function(taskId, taskType = 'active') {
        try {
            const reason = prompt('❌ Rədd etmə səbəbini yazın:');
            if (!reason || reason.trim() === '') {
                alert('❌ Rədd etmə səbəbi məcburidir!');
                return;
            }

            if (!confirm(`Bu işi rədd etmək istədiyinizə əminsiniz?\nSəbəb: ${reason}`)) {
                return;
            }

            const updateData = {
                status: 'rejected',
                notes: reason,
                updated_at: new Date().toISOString()
            };

            console.log(`❌ Task rədd edilir: ${taskId}`);
            const response = await makeApiRequest(`/tasks/${taskId}`, 'PATCH', updateData);

            if (response && !response.error) {
                alert('✅ İş rədd edildi!');
                setTimeout(() => {
                    if (window.taskManager) {
                        window.taskManager.loadActiveTasks();
                        window.taskManager.loadExternalTasks();
                    }
                }, 500);
            } else {
                throw new Error(response?.detail || 'Task rədd edilə bilmədi');
            }

        } catch (error) {
            console.error('❌ Task rədd edilərkən xəta:', error);
            alert('❌ Xəta: ' + error.message);
        }
    },

    completeTask: async function(taskId, taskType = 'active') {
        try {
            const comment = prompt('✅ Tamamlanma comment-i əlavə edin (isteğe bağlı):', '');

            const updateData = {
                status: 'completed',
                completed_date: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                progress_percentage: 100,
                ...(comment ? { notes: comment } : {})
            };

            console.log(`✅ Task tamamlanır: ${taskId}`);
            const response = await makeApiRequest(`/tasks/${taskId}`, 'PATCH', updateData);

            if (response && !response.error) {
                alert('✅ İş tamamlandı!');

                setTimeout(() => {
                    if (window.taskManager) {
                        window.taskManager.loadActiveTasks();
                        window.taskManager.loadExternalTasks();
                        window.taskManager.loadArchiveTasks();
                    }
                }, 1000);
            } else {
                throw new Error(response?.detail || 'Task tamamlandı edilə bilmədi');
            }

        } catch (error) {
            console.error('❌ Task tamamlanarkən xəta:', error);
            alert('❌ Xəta: ' + error.message);
        }
    },

    // ==================== HELPER FUNCTIONS ====================
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Global export
window.TaskEditModule = TaskEditModule;