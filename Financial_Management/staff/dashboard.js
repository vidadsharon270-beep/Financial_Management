/* ==========================================================================
   dashboard.js — Staff dashboard data + rendering.
   Staff see the day-to-day operational modules (recording transactions,
   processing invoices, collections, cash handling) but not the org-wide
   analytics/tax modules reserved for admins.
   ========================================================================== */
const STAFF_DASHBOARD_DATA = {
    stats: [
        { label: 'Transactions Today', value: '86', icon: 'receipt_long' },
        { label: 'Invoices to Process', value: '14', icon: 'upload_file' },
        { label: 'Collections Due', value: '$32,400', icon: 'currency_exchange' },
        { label: 'Pending Approvals', value: '9', icon: 'pending_actions' }
    ],
    quickActions: [
        'Record Transaction',
        'Process Invoice',
        'Log Collection',
        'Update Ledger Entry'
    ],
    modules: [
        'General Ledger',
        'Accounts Payable (AP)',
        'Accounts Receivable (AR)',
        'Disbursement Management',
        'Collection Management',
        'Cash Management',
        'Budget Management'
    ],
    analytics: {
        overviewTitle: 'Cash Flow Overview',
        overviewMetric: '$32,400',
        overviewSubtitle: 'Collections and disbursements you\u2019ve logged this month.',
        overviewTrend: 'This Month',
        overviewData: [
            { label: 'Week 1', value: 30 },
            { label: 'Week 2', value: 48 },
            { label: 'Week 3', value: 55 },
            { label: 'Week 4', value: 70 }
        ],
        breakdownTitle: 'Transaction Breakdown',
        breakdownTotal: 'Total 86 today',
        breakdownSegments: [
            { label: 'Invoices', value: '35%', color: '#4f46e5' },
            { label: 'Collections', value: '30%', color: '#34d399' },
            { label: 'Disbursements', value: '20%', color: '#facc15' },
            { label: 'Ledger Entries', value: '15%', color: '#fb7185' }
        ]
    },
    activity: [
        { label: 'Invoice received', time: '20 min ago', status: 'Pending' },
        { label: 'Payment processed', time: '1 hour ago', status: 'Completed' },
        { label: 'Transaction completed', time: '3 hours ago', status: 'Completed' },
        { label: 'Budget updated', time: 'Yesterday', status: 'Updated' }
    ]
};

const moduleIconMap = {
    'General Ledger': 'book',
    'Accounts Payable (AP)': 'receipt_long',
    'Accounts Receivable (AR)': 'payments',
    'Disbursement Management': 'account_balance',
    'Collection Management': 'currency_exchange',
    'Budget Management': 'account_balance_wallet',
    'Cash Management': 'wallet'
};

const actionIconMap = {
    'Record Transaction': 'add',
    'Process Invoice': 'upload_file',
    'Log Collection': 'currency_exchange',
    'Update Ledger Entry': 'edit_note'
};

const quickActionDescriptions = {
    'Record Transaction': 'Enter a new financial transaction',
    'Process Invoice': 'Review and process a pending invoice',
    'Log Collection': 'Record an incoming payment or collection',
    'Update Ledger Entry': 'Edit or annotate a general ledger entry'
};

const activityIconMap = {
    'Transaction completed': 'check_circle',
    'Invoice received': 'description',
    'Payment processed': 'payments',
    'Budget updated': 'account_balance_wallet'
};

function getStatusBadge(status) {
    const normalized = String(status || '').toLowerCase();
    const statusMap = {
        completed: 'status-pill status-pill-success',
        ready: 'status-pill status-pill-success',
        updated: 'status-pill status-pill-info',
        pending: 'status-pill status-pill-warning',
        scheduled: 'status-pill status-pill-info',
        new: 'status-pill status-pill-accent'
    };
    return statusMap[normalized] || 'status-pill status-pill-neutral';
}

function renderLineChart(dataPoints) {
    const points = dataPoints.map((point, index) => {
        const value = Math.min(100, Math.max(20, Number(point.value) || 20));
        return { x: 20 + index * 80, y: 150 - value };
    });
    const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const fillPath = `${linePath} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

    return `
        <div class="dashboard-line-chart">
            <svg viewBox="0 0 320 180" aria-hidden="true">
                <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.9" />
                        <stop offset="100%" stop-color="#c7d2fe" stop-opacity="0.08" />
                    </linearGradient>
                </defs>
                <path d="${fillPath}" fill="url(#lineGradient)" />
                <path d="${linePath}" fill="none" stroke="#4338ca" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                ${points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#4338ca" stroke="#ffffff" stroke-width="2" />`).join('')}
            </svg>
        </div>
    `;
}

function renderDonutChart(segments, centerLabel) {
    return `
        <div class="donut-chart-wrapper">
            <div class="donut-chart" style="background: conic-gradient(${segments.map(s => `${s.color} ${s.value}`).join(', ')});"></div>
            <div class="donut-center-text">
                <p>Total</p>
                <p>${centerLabel}</p>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const data = STAFF_DASHBOARD_DATA;

    const dashboardStatsGrid = document.getElementById('dashboard-stats-grid');
    const dashboardChartOverview = document.getElementById('dashboard-chart-overview');
    const dashboardChartBreakdown = document.getElementById('dashboard-chart-breakdown');
    const dashboardQuickActionsList = document.getElementById('dashboard-quick-actions-list');
    const dashboardActivityBody = document.getElementById('dashboard-activity-tbody');
    const sidebarModulesNav = document.getElementById('sidebar-modules-nav');

    if (!dashboardStatsGrid || !dashboardChartOverview || !dashboardChartBreakdown || !dashboardQuickActionsList || !dashboardActivityBody) return;

    // Sidebar modules
    if (sidebarModulesNav) {
        sidebarModulesNav.innerHTML = data.modules.map(name => `
            <a href="#" class="sidebar-subsystem-link !py-3">
                <span class="material-symbols-outlined sidebar-subsystem-link-icon">${moduleIconMap[name] || 'apps'}</span>
                <span class="text-sm">${name}</span>
            </a>
        `).join('');
    }

    // Stat cards
    const getTrendData = () => {
        const isPositive = Math.random() > 0.3;
        const value = Math.floor(Math.random() * 20) + 1;
        return { isPositive, text: isPositive ? `+${value}% this week` : `-${value}% this week` };
    };

    dashboardStatsGrid.innerHTML = data.stats.map(stat => {
        const trend = getTrendData();
        return `
            <div class="premium-stat-card">
                <div class="premium-stat-icon">
                    <span class="material-symbols-outlined">${stat.icon}</span>
                </div>
                <h3 class="premium-stat-value">${stat.value}</h3>
                <p class="premium-stat-label">${stat.label}</p>
                <div class="premium-stat-trend ${trend.isPositive ? 'positive' : 'negative'}">
                    <span class="material-symbols-outlined">${trend.isPositive ? 'trending_up' : 'trending_down'}</span>
                    <span>${trend.text}</span>
                </div>
            </div>
        `;
    }).join('');

    // Quick actions
    dashboardQuickActionsList.innerHTML = data.quickActions.map(action => `
        <button type="button" class="quick-action-card">
            <div class="quick-action-icon">
                <span class="material-symbols-outlined">${actionIconMap[action] || 'bolt'}</span>
            </div>
            <div class="flex-1">
                <p class="quick-action-title">${action}</p>
                <p class="quick-action-desc">${quickActionDescriptions[action] || 'Quick action'}</p>
            </div>
            <span class="material-symbols-outlined quick-action-arrow">arrow_forward</span>
        </button>
    `).join('');

    // Charts
    const analytics = data.analytics;
    dashboardChartOverview.innerHTML = `
        <div class="premium-chart-card">
            <div class="premium-chart-header">
                <div>
                    <p class="premium-chart-section-label">${analytics.overviewTitle}</p>
                    <h3 class="premium-chart-title">${analytics.overviewMetric}</h3>
                    <p class="premium-chart-subtitle">${analytics.overviewSubtitle}</p>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <button class="premium-chart-filter-btn">
                        <span class="material-symbols-outlined">tune</span>
                        Filter
                    </button>
                    <p class="premium-chart-updated">${analytics.overviewTrend}</p>
                </div>
            </div>
            ${renderLineChart(analytics.overviewData)}
        </div>
    `;

    dashboardChartBreakdown.innerHTML = `
        <div class="premium-chart-card">
            <div class="premium-chart-header">
                <div>
                    <p class="premium-chart-section-label">${analytics.breakdownTitle}</p>
                    <h3 class="premium-chart-title">${analytics.breakdownTotal}</h3>
                </div>
            </div>
            <div class="premium-donut-wrapper">
                ${renderDonutChart(analytics.breakdownSegments, data.stats[0].value)}
                <div class="premium-donut-legend">
                    ${analytics.breakdownSegments.map(segment => `
                        <div class="premium-donut-legend-item">
                            <span class="premium-donut-legend-color" style="background: ${segment.color};"></span>
                            <span class="premium-donut-legend-label">${segment.label}</span>
                            <span class="premium-donut-legend-value">${segment.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // Recent activity
    dashboardActivityBody.innerHTML = data.activity.map(item => `
        <tr class="premium-activity-row">
            <td class="premium-activity-cell">
                <div class="premium-activity-icon">
                    <span class="material-symbols-outlined">${activityIconMap[item.label] || 'notifications'}</span>
                </div>
                <div class="flex-1">
                    <p class="premium-activity-title">${item.label}</p>
                </div>
            </td>
            <td class="premium-activity-cell">
                <span class="${getStatusBadge(item.status)}">${item.status}</span>
            </td>
            <td class="premium-activity-cell">
                <span class="premium-activity-time">${item.time}</span>
            </td>
            <td class="premium-activity-cell">
                <button class="premium-activity-btn" title="View Details">
                    <span class="material-symbols-outlined">visibility</span>
                </button>
            </td>
        </tr>
    `).join('');
});
