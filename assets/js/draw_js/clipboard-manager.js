// clipboard-manager.js - Clipboard funksiyaları
(function() {
    class ClipboardManager {
        constructor(diagramTool) {
            this.diagramTool = diagramTool;
            this.clipboard = null;
        }

        copySelected() {
            if (this.diagramTool.selectedShapes.size === 0) return;

            const selectedShapes = [];
            this.diagramTool.selectedShapes.forEach(shapeId => {
                const shape = this.diagramTool.shapes.find(s => s.id === shapeId);
                if (shape) {
                    // Shape-in kopyasını yarat
                    const shapeCopy = JSON.parse(JSON.stringify(shape));
                    selectedShapes.push(shapeCopy);
                }
            });

            this.clipboard = {
                type: 'shapes',
                data: selectedShapes,
                timestamp: Date.now()
            };

            // Status bar-da mesaj göstər
            this.diagramTool.updateStatusBar();
        }

        paste() {
            if (!this.clipboard) return;

            if (this.clipboard.type === 'shapes') {
                const offset = 20; // Pasted shapes-i bir az yerdəyişdir
                const pastedShapes = [];

                this.clipboard.data.forEach(shapeData => {
                    // Yeni ID yarat
                    const newId = 'shape_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                    // Shape-in kopyasını yarat
                    const newShape = {
                        ...shapeData,
                        id: newId,
                        x: shapeData.x + offset,
                        y: shapeData.y + offset
                    };

                    this.diagramTool.shapes.push(newShape);
                    pastedShapes.push(newId);
                });

                // Pasted shapes-i seç
                this.diagramTool.selectedShapes.clear();
                pastedShapes.forEach(id => {
                    this.diagramTool.selectedShapes.add(id);
                });

                // Yenidən çək və history-ə əlavə et
                this.diagramTool.saveToHistory();
                this.diagramTool.draw();
            }
        }

        cutSelected() {
            if (this.diagramTool.selectedShapes.size === 0) return;

            // Seçilmiş shapes-ləri kopyala
            this.copySelected();

            // Seçilmiş shapes-ləri sil
            this.diagramTool.deleteSelected();
        }

        selectAll() {
            this.diagramTool.selectedShapes.clear();

            this.diagramTool.shapes.forEach(shape => {
                this.diagramTool.selectedShapes.add(shape.id);
            });

            this.diagramTool.draw();
        }

        // Əlavə: Clipboard məzmununu yoxlamaq üçün
        hasClipboardContent() {
            return this.clipboard !== null;
        }

        // Əlavə: Clipboard-u təmizləmək üçün
        clearClipboard() {
            this.clipboard = null;
        }
    }

    // ClipboardManager-i qlobal scope-a əlavə et
    window.ClipboardManager = ClipboardManager;
})();