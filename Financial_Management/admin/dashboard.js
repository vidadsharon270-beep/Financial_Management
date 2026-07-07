document.addEventListener('DOMContentLoaded', () => {
    const subsystemId = getSubsystemFromUrl() || 'financial-management';
    const subsystem = subsystemId ? getSubsystemById(subsystemId) : null;

    const dashboardHeading = document.getElementById('dashboard-heading');
    const dashboardSubheading = document.getElementById('dashboard-subheading');
    const dashboardCopy = document.getElementById('dashboard-copy');
    const dashboardUpdated = document.getElementById('dashboard-updated');
    const dashboardStatsGrid = document.getElementById('dashboard-stats-grid');
    const dashboardCharts = document.getElementById('dashboard-charts');
    const dashboardChartOverview = document.getElementById('dashboard-chart-overview');
    const dashboardChartBreakdown = document.getElementById('dashboard-chart-breakdown');
    const dashboardQuickActionsList = document.getElementById('dashboard-quick-actions-list');
    const dashboardActivityBody = document.getElementById('dashboard-activity-tbody');
    const sidebarBrandTitle = document.getElementById('sidebar-brand-title');
    const sidebarBrandCategory = document.getElementById('sidebar-brand-category');
    const sidebarSubsystemNavPanel = document.getElementById('sidebar-subsystem-nav-panel');
    const sidebarSubsystemModulesNav = document.getElementById('sidebar-subsystem-modules-nav');

    if (!dashboardHeading || !dashboardCopy || !dashboardStatsGrid || !dashboardCharts || !dashboardChartOverview || !dashboardChartBreakdown || !dashboardQuickActionsList || !dashboardActivityBody || !sidebarBrandTitle || !sidebarBrandCategory || !sidebarSubsystemNavPanel || !sidebarSubsystemModulesNav) return;

    const moduleIconMap = {
        'General Ledger': 'book',
        'Accounts Payable (AP)': 'receipt_long',
        'Accounts Receivable (AR)': 'payments',
        'Disbursement Management': 'account_balance',
        'Collection Management': 'currency_exchange',
        'Budget Management': 'account_balance_wallet',
        'Cash Management': 'wallet',
        'Financial Reporting & Analytics': 'analytics',
        'Tax Management': 'calculate'
    };

    const getModuleIcon = moduleName => {
        if (!moduleName) return 'apps';
        return moduleIconMap[moduleName] || 'apps';
    };

    const getStatusBadge = status => {
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
    };

    const actionIconMap = {
        'New Transaction': 'add',
        'Upload Invoice': 'upload_file',
        'Generate Report': 'insert_chart',
        'Budget Planning': 'query_stats',
        'Tax Filing': 'receipt_long',
        'Approve invoices': 'task_alt',
        'Create budget plan': 'account_balance',
        'Review cash forecast': 'analytics',
        'Export financial statements': 'file_download'
    };

    const renderLineChart = dataPoints => {
        const points = dataPoints.map((point, index) => {
            const value = Math.min(100, Math.max(20, Number(point.value) || 20));
            return {
                x: 20 + index * 60,
                y: 150 - value
            };
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
                    ${points.map(point => `
                        <circle cx="${point.x}" cy="${point.y}" r="4" fill="#4338ca" stroke="#ffffff" stroke-width="2" />
                    `).join('')}
                </svg>
            </div>
        `;
    };

    const renderDonutChart = segments => {
        return `
            <div class="donut-chart-wrapper">
                <div class="donut-chart" style="background: conic-gradient(${segments.map(segment => `${segment.color} ${segment.value}`).join(', ')});"></div>
                <div class="donut-center-text">
                    <p>Total</p>
                    <p>${subsystem?.stats?.[0]?.value || '$0'}</p>
                </div>
            </div>
        `;
    };

    if (!subsystem) {
        dashboardHeading.textContent = 'Welcome back 👋';
        if (dashboardSubheading) dashboardSubheading.textContent = 'Dashboard';
        dashboardCopy.textContent = 'Open the module selector and choose a subsystem to view its dedicated dashboard.';
        if (dashboardUpdated) dashboardUpdated.textContent = 'Last updated: Just now';
        dashboardStatsGrid.innerHTML = '';
        dashboardCharts.innerHTML = '';
        dashboardQuickActionsList.innerHTML = '<p class="text-sm text-on-surface-variant">Select a subsystem from the module selector to display statistics, charts, and activity.</p>';
        dashboardActivityBody.innerHTML = '<tr><td class="px-6 py-4 text-on-surface-variant" colspan="4">No activity available. Select a subsystem to view activity logs.</td></tr>';
        sidebarBrandTitle.textContent = 'No subsystem selected';
        sidebarBrandCategory.textContent = 'Choose a subsystem from the selector.';
        sidebarSubsystemModulesNav.innerHTML = '';
        sidebarSubsystemNavPanel.classList.add('hidden');
        return;
    }

    document.title = `${subsystem.title} — Dashboard`;
    dashboardHeading.textContent = 'Welcome back 👋';
    if (dashboardSubheading) dashboardSubheading.textContent = `${subsystem.title} Dashboard`;
    dashboardCopy.textContent = 'Manage and monitor your subsystem from one centralized workspace.';
    if (dashboardUpdated) dashboardUpdated.textContent = 'Last updated: Just now';
    sidebarBrandTitle.textContent = subsystem.title;
    sidebarBrandCategory.textContent = subsystem.category;
    sidebarSubsystemModulesNav.innerHTML = subsystem.modules.map(module => {
        const moduleName = typeof module === 'string' ? module : module.name;
        return `
            <a href="#" class="sidebar-subsystem-link !py-3">
                <span class="material-symbols-outlined sidebar-subsystem-link-icon">${getModuleIcon(moduleName)}</span>
                <span class="text-sm">${moduleName}</span>
            </a>
        `;
    }).join('');
    sidebarSubsystemNavPanel.classList.remove('hidden');

    // Example trend data (we'll generate random trends for demo)
    const getTrendData = () => {
        const isPositive = Math.random() > 0.3;
        const value = Math.floor(Math.random() * 30) + 1;
        return {
            isPositive,
            value,
            text: isPositive ? `+${value}% this month` : `-${value}% this month`
        };
    };

    dashboardStatsGrid.innerHTML = subsystem.stats.map(stat => {
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

    // Quick Actions as modern cards
    const quickActionDescriptions = {
        'New Transaction': 'Create a new financial transaction',
        'Upload Invoice': 'Upload and process invoices',
        'Generate Report': 'Create PDF and Excel reports',
        'Budget Planning': 'Plan and manage your budget',
        'Tax Filing': 'Prepare and file tax documents',
        'Approve invoices': 'Review and approve pending invoices',
        'Create budget plan': 'Build a new budget plan',
        'Review cash forecast': 'Check your cash flow forecast',
        'Export financial statements': 'Download financial statements'
    };

    dashboardQuickActionsList.innerHTML = subsystem.quickActions.map(action => `
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

    const renderAnalytics = analytics => {
        const overviewTitle = analytics?.overviewTitle || 'Performance overview';
        const overviewMetric = analytics?.overviewMetric || subsystem.stats[0]?.value || 'Overview';
        const overviewSubtitle = analytics?.overviewSubtitle || subsystem.description || `Track ${subsystem.title} performance.`;
        const overviewTrend = analytics?.overviewTrend || 'Updated just now';
        const overviewData = Array.isArray(analytics?.overviewData) && analytics.overviewData.length
            ? analytics.overviewData
            : subsystem.stats.map(stat => ({ label: stat.label, value: 50 + Math.random() * 40 }));
        const overviewHighlights = Array.isArray(analytics?.overviewHighlights) && analytics.overviewHighlights.length
            ? analytics.overviewHighlights
            : overviewData.slice(0, 2).map(item => ({ label: item.label, value: `${Math.round(item.value)}%` }));
        const breakdownTitle = analytics?.breakdownTitle || 'Detailed breakdown';
        const breakdownTotal = analytics?.breakdownTotal || 'Key metrics';
        const breakdownSegments = Array.isArray(analytics?.breakdownSegments) && analytics.breakdownSegments.length
            ? analytics.breakdownSegments
            : [
                { label: subsystem.stats[0]?.label || 'Item 1', value: '40%', color: '#4f46e5' },
                { label: subsystem.stats[1]?.label || 'Item 2', value: '25%', color: '#34d399' },
                { label: subsystem.stats[2]?.label || 'Item 3', value: '15%', color: '#facc15' },
                { label: subsystem.stats[3]?.label || 'Item 4', value: '20%', color: '#fb7185' }
            ];

        dashboardChartOverview.innerHTML = `
            <div class="premium-chart-card">
                <div class="premium-chart-header">
                    <div>
                        <p class="premium-chart-section-label">${overviewTitle}</p>
                        <h3 class="premium-chart-title">${overviewMetric}</h3>
                        <p class="premium-chart-subtitle">${overviewSubtitle}</p>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                        <button class="premium-chart-filter-btn">
                            <span class="material-symbols-outlined">tune</span>
                            Filter
                        </button>
                        <p class="premium-chart-updated">${overviewTrend}</p>
                    </div>
                </div>
                ${renderLineChart(overviewData)}
                <div class="premium-chart-highlights">
                    ${overviewHighlights.map(item => `
                        <div class="premium-chart-highlight-item">
                            <p class="premium-chart-highlight-label">${item.label}</p>
                            <p class="premium-chart-highlight-value">${item.value}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        dashboardChartBreakdown.innerHTML = `
            <div class="premium-chart-card">
                <div class="premium-chart-header">
                    <div>
                        <p class="premium-chart-section-label">${breakdownTitle}</p>
                        <h3 class="premium-chart-title">${breakdownTotal}</h3>
                    </div>
                </div>
                <div class="premium-donut-wrapper">
                    ${renderDonutChart(breakdownSegments)}
                    <div class="premium-donut-legend">
                        ${breakdownSegments.map(segment => `
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
    };

    renderAnalytics(subsystem.analytics);

    // Recent Activity as premium section
    const activityIconMap = {
        'Transaction completed': 'check_circle',
        'Invoice received': 'description',
        'Payment processed': 'payments',
        'Budget updated': 'account_balance_wallet',
        'Report generated': 'insert_chart',
        'Tax filed': 'calculate'
    };

    dashboardActivityBody.innerHTML = subsystem.activity.map(item => `
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
