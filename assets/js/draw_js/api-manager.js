// api-manager.js - CORRECTED ENDPOINTS
class ApiManager {
    constructor(diagramTool) {
        this.diagramTool = diagramTool;
        this.PROXY_URL = "https://guvenfinans.az/proxy.php";
        this.BACKEND_BASE = "http://vps.guvenfinans.az:8008";
        console.log('🔧 ApiManager initialized');

        this.token = localStorage.getItem('auth_token');
        if (!this.token) {
            console.warn('⚠️ No auth token found');
        }
    }

    // api-manager.js - makeRequest funksiyasını düzəldin

    async makeRequest(endpoint, method = 'GET', data = null) {
        try {
            console.log(`📡 ${method} ${endpoint}`);

            // ƏSAS DÜZƏLİŞ: auth/me endpoint-i üçün POST istifadə et
            if (endpoint === '/api/auth/me' || endpoint === '/api/v1/auth/me') {
                method = 'POST'; // Backend yalnız POST qəbul edir
                console.log('🔄 Overriding method to POST for auth/me');
            }

            const url = `${this.PROXY_URL}${endpoint}`;
            console.log(`🚀 Request URL: ${url}`);

            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const options = {
                method: method,
                headers: headers,
                credentials: 'include' // Cookies üçün
            };

            // auth/me üçün boş body göndər
            if (method === 'POST' && (endpoint.includes('auth/me'))) {
                options.body = JSON.stringify({});
            } else if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            console.log(`📥 Response: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Request failed:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            console.log('🔌 Testing connection...');

            // auth/me endpoint-inə POST ilə göndər
            const response = await this.makeRequest('/api/auth/me', 'POST', {});

            console.log('✅ Connection test successful:', response);
            return true;

        } catch (error) {
            console.error('❌ Connection test failed:', error);

            // Əgər endpoint fərqli ola bilərsə, /api/v1/auth/me yoxla
            try {
                console.log('🔄 Trying /api/v1/auth/me...');
                const response2 = await this.makeRequest('/api/v1/auth/me', 'POST', {});
                console.log('✅ Connection test successful with v1:', response2);
                return true;
            } catch (error2) {
                console.error('❌ Both endpoints failed');
                return false;
            }
        }
    }

    async testConnection() {
        try {
            console.log('🔌 Testing connection...');

            // DÜZƏLDİLMİŞ ENDPOINT: /api/auth/me (v1 yox!)
            const testEndpoint = '/api/auth/me';
            console.log(`🚀 Testing endpoint: ${testEndpoint}`);

            const response = await fetch(`${this.PROXY_URL}${testEndpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                },
                credentials: 'include',
                mode: 'cors'
            });

            console.log(`📡 Connection test response: ${response.status}`);

            // Connection var, hətta 401 olsa belə
            return response.status === 200 || response.status === 401;

        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }

    async saveDiagram(diagramData) {
        try {
            console.log('💾 Starting diagram save...');

            const payload = {
                name: diagramData.name || `Diagram_${new Date().toLocaleString()}`,
                description: diagramData.description || '',
                diagram_data: diagramData.diagram_data,
                tags: diagramData.tags || ["diagram", "flowdraw"],
                is_public: false,
                access_level: "private"
            };

            console.log('📦 Payload:', {
                name: payload.name,
                shapes: payload.diagram_data?.shapes?.length || 0,
                connections: payload.diagram_data?.connections?.length || 0
            });

            // Test connection first
            console.log('🔌 Testing connection before save...');
            const connected = await this.testConnection();
            console.log(`📡 Connection status: ${connected ? '✅ Connected' : '❌ Not connected'}`);

            if (!connected) {
                throw new Error('Cannot connect to server. Please check your connection.');
            }

            // DÜZƏLDİLMİŞ ENDPOINT: /api/diagrams/ (v1 yox!)
            const endpoint = '/api/diagrams/';
            console.log(`🚀 Saving to: ${endpoint}`);

            const result = await this.makeRequest(endpoint, 'POST', payload);

            console.log('✅ Save successful!', result);

            // Save diagram ID
            if (result && result.id) {
                this.diagramTool.currentDiagramId = result.id;
                localStorage.setItem('current_diagram_id', result.id);
            }

            return result;

        } catch (error) {
            console.error('❌ Save failed:', error);

            // Local backup
            const localId = this.saveToLocalStorage(diagramData);

            // User notification
            alert(`⚠️ ${error.message}\nDiagram has been saved locally as backup.`);

            return {
                id: localId,
                name: diagramData.name,
                saved_locally: true,
                message: 'Saved to local storage'
            };
        }
    }

    async getMyDiagrams(page = 1, perPage = 20) {
        try {
            console.log(`📋 Loading my diagrams (page ${page})...`);

            // DÜZƏLDİLMİŞ ENDPOINT: /api/diagrams/my-diagrams
            const endpoint = `/api/diagrams/my-diagrams?page=${page}&per_page=${perPage}`;
            const result = await this.makeRequest(endpoint, 'GET');

            console.log(`✅ Loaded ${result?.diagrams?.length || 0} diagrams`);
            return result || { diagrams: [], total: 0, page, per_page: perPage };

        } catch (error) {
            console.error('❌ Load diagrams failed:', error);

            // Local diagrams göstər
            const localDiagrams = JSON.parse(localStorage.getItem('local_diagrams') || '[]');
            return {
                diagrams: localDiagrams,
                total: localDiagrams.length,
                page: 1,
                per_page: perPage,
                total_pages: 1,
                from_local: true
            };
        }
    }

    saveToLocalStorage(diagramData) {
        try {
            const localId = `local_diagram_${Date.now()}`;
            const saveData = {
                ...diagramData,
                id: localId,
                saved_at: new Date().toISOString(),
                is_local: true
            };

            localStorage.setItem(localId, JSON.stringify(saveData));

            // Add to local list
            const localList = JSON.parse(localStorage.getItem('local_diagrams') || '[]');
            localList.push({
                id: localId,
                name: diagramData.name,
                saved_at: new Date().toISOString(),
                is_local: true
            });
            localStorage.setItem('local_diagrams', JSON.stringify(localList));

            console.log('💾 Saved to local storage:', localId);
            return localId;

        } catch (error) {
            console.error('❌ Local save failed:', error);
            return null;
        }
    }
}