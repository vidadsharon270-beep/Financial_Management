/* ==========================================================================
   dashboard.js — User (self-service) dashboard data + rendering.
   Regular users only see their own balance, transactions, and requests —
   no system-wide modules or org financials.
   ========================================================================== */
const USER_DASHBOARD_DATA = {
    stats: [
        { label: 'My Balance', value: '$4,120', icon: 'account_balance_wallet' },
        { label: 'Pending Reimbursements', value: '2', icon: 'hourglass_top' },
        { label: 'Open Requests', value: '1', icon: 'assignment' },
        { label: 'Last Payment', value: '$850', icon: 'payments' }
    ],
    quickActions: [
        'Submit Reimbursement Request',
        'View My Statements',
        'Download Report',
        'Request Budget Increase'
    ],
    modules: [
        'My Transactions',
        'My Invoices',
        'My Budget Requests',
        'My Reports'
    ],
    analytics: {
        overviewTitle: 'My Spending Overview',
        overviewMetric: '$850',
        overviewSubtitle: 'Your recorded transactions over the last few weeks.',
        overviewTrend: 'This Month',
        overviewData: [
            { label: 'Week 1', value: 25 },
            { label: 'Week 2', value: 40 },
            { label: 'Week 3', value: 35 },
            { label: 'Week 4', value: 55 }
        ],
        breakdownTitle: 'My Spending Breakdown',
        breakdownTotal: 'Total $850',
        breakdownSegments: [
            { label: 'Reimbursements', value: '45%', color: '#4f46e5' },
            { label: 'Subscriptions', value: '25%', color: '#34d399' },
            { label: 'Supplies', value: '20%', color: '#facc15' },
            { label: 'Other', value: '10%', color: '#fb7185' }
        ]
    },
    activity: [
        { label: 'Reimbursement request submitted', time: '1 hour ago', status: 'Pending' },
        { label: 'Statement downloaded', time: 'Today', status: 'Completed' },
        { label: 'Budget request approved', time: 'Yesterday', status: 'Updated' },
        { label: 'Payment received', time: '2 days ago', status: 'Completed' }
    ]
};

const moduleIconMap = {
    'My Transactions': 'receipt_long',
    'My Invoices': 'description',
    'My Budget Requests': 'request_quote',
    'My Reports': 'insert_chart'
};

const actionIconMap = {
    'Submit Reimbursement Request': 'add_card',
    'View My Statements': 'visibility',
    'Download Report': 'file_download',
    'Request Budget Increase': 'trending_up'
};

const quickActionDescriptions = {
    'Submit Reimbursement Request': 'Request reimbursement for an expense',
    'View My Statements': 'See your past account statements',
    'Download Report': 'Export a copy of your activity',
    'Request Budget Increase': 'Ask for an increase to your allocated budget'
};

const activityIconMap = {
    'Reimbursement request submitted': 'add_card',
    'Statement downloaded': 'file_download',
    'Budget request approved': 'account_balance_wallet',
    'Payment received': 'payments'
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
    const data = USER_DASHBOARD_DATA;

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
        const value = Math.floor(Math.random() * 15) + 1;
        return { isPositive, text: isPositive ? `+${value}% this month` : `-${value}% this month` };
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
