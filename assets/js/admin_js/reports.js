// assets/js/admin_js/reports.js

const API_ROOT = window.API_BASE || window.location.origin || 'https://guvenfinans.az';

function getAuthHeaders() {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('guven_token');
    return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
    };
}

async function fetchReport(endpoint) {
    const response = await fetch(`${API_ROOT}/api/v1/reports/${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}

window.loadReports = async function() {
    try {
        const [gender, birthdays, ageDistribution] = await Promise.all([
            fetchReport('gender'),
            fetchReport('birthdays'),
            fetchReport('age-distribution')
        ]);

        displayReports({ gender, birthdays, ageDistribution });
        updateReportStats({ gender, birthdays, ageDistribution });
    } catch (error) {
        console.error('Hesabatları yükləmək xətası:', error);
        if (typeof showError === 'function') {
            showError('Hesabatları yükləmək mümkün olmadı: ' + error.message);
        }
    }
};

function displayReports(data) {
    const reportsBody = document.getElementById('reportsBody');
    if (!reportsBody) return;

    const birthdayCount = Array.isArray(data.birthdays) ? data.birthdays.length : (data.birthdays?.count || 0);
    const genderData = data.gender?.data || data.gender;
    const ageData = data.ageDistribution?.data || data.ageDistribution;

    reportsBody.innerHTML = `
        <tr>
            <td>${new Date().toLocaleDateString('az-AZ')}</td>
            <td>${genderData?.male ?? genderData?.men ?? 0}</td>
            <td>${genderData?.female ?? genderData?.women ?? 0}</td>
            <td>${birthdayCount}</td>
            <td>${ageData?.['18-25'] ?? 0}</td>
            <td>${ageData?.['26-35'] ?? 0}</td>
        </tr>
    `;
}

function updateReportStats(stats) {
    const genderData = stats.gender?.data || stats.gender || {};
    const ageData = stats.ageDistribution?.data || stats.ageDistribution || {};
    const birthdayCount = Array.isArray(stats.birthdays) ? stats.birthdays.length : (stats.birthdays?.count || 0);

    const elements = {
        monthlyRegistrationsReport: (genderData.male || genderData.men || 0) + (genderData.female || genderData.women || 0),
        newCompaniesReport: ageData['18-25'] || 0,
        newEmployeesReport: birthdayCount,
        approvalRateReport: '-'
    };

    Object.keys(elements).forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
}

window.exportReport = function() {
    if (typeof showNotification === 'function') {
        showNotification('Yeni API-də export endpoint mövcud deyil.', 'warning');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.menu-item[data-page="reports"]').forEach(item => {
        item.addEventListener('click', function() {
            setTimeout(() => window.loadReports(), 300);
        });
    });
});
