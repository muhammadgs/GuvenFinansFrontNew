// history-manager.js - tam versiya
(function() {
    class HistoryManager {
        constructor(diagramTool) {
            this.diagramTool = diagramTool;
            this.history = [];
            this.historyIndex = -1;
            this.maxHistory = 50;
        }

        saveToHistory() {
            // Tarixə dəyişiklikləri qeyd et
            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }

            const state = {
                shapes: JSON.parse(JSON.stringify(this.diagramTool.shapes)),
                connections: JSON.parse(JSON.stringify(this.diagramTool.connections)),
                selectedShapes: Array.from(this.diagramTool.selectedShapes)
            };

            this.history.push(state);
            this.historyIndex++;

            // Maksimum tarixi həddini yoxla
            if (this.history.length > this.maxHistory) {
                this.history.shift();
                this.historyIndex--;
            }

            console.log('History saved. Index:', this.historyIndex, 'Total:', this.history.length);
        }

        undo() {
            console.log('Undo called. Current index:', this.historyIndex);

            if (this.historyIndex <= 0) {
                console.log('Cannot undo - already at beginning');
                return;
            }

            this.historyIndex--;
            this.restoreFromHistory();
            console.log('Undo successful. New index:', this.historyIndex);
        }

        redo() {
            console.log('Redo called. Current index:', this.historyIndex, 'History length:', this.history.length);

            if (this.historyIndex >= this.history.length - 1) {
                console.log('Cannot redo - already at latest');
                return;
            }

            this.historyIndex++;
            this.restoreFromHistory();
            console.log('Redo successful. New index:', this.historyIndex);
        }

        restoreFromHistory() {
            if (this.historyIndex < 0 || this.historyIndex >= this.history.length) {
                console.error('Invalid history index:', this.historyIndex);
                return;
            }

            const state = this.history[this.historyIndex];

            this.diagramTool.shapes = JSON.parse(JSON.stringify(state.shapes));
            this.diagramTool.connections = JSON.parse(JSON.stringify(state.connections));
            this.diagramTool.selectedShapes = new Set(state.selectedShapes);

            this.diagramTool.draw();
        }

        canUndo() {
            return this.historyIndex > 0;
        }

        canRedo() {
            return this.historyIndex < this.history.length - 1;
        }
    }

    window.HistoryManager = HistoryManager;
})();