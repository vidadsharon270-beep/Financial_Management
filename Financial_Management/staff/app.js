/* ==========================================================================
   app.js — shared dashboard shell behavior (Admin)
   Handles: session guard, profile info, sidebar toggle, profile dropdown,
   and logout. Loaded before dashboard.js on every dashboard.html.
   ========================================================================== */
(function () {
    const ROLE = 'staff';
    const ROLE_LABELS = { admin: 'Administrator', staff: 'Staff', user: 'User' };
    const ROLE_DASHBOARDS = {
        admin: '../admin/dashboard.html',
        staff: '../staff/dashboard.html',
        user: '../user/dashboard.html'
    };

    // ---------------------------------------------------------------------
    // Session guard — every dashboard page calls check_session.php on load.
    // If not logged in -> back to login. If logged in under a different
    // role -> bounce to that role's own dashboard instead of this one.
    // ---------------------------------------------------------------------
    async function checkSession() {
        try {
            const res = await fetch('../api/check_session.php', { credentials: 'include' });
            const data = await res.json();

            if (!data.success) {
                window.location.href = '../login.html';
                return null;
            }
            if (data.user.role !== ROLE) {
                window.location.href = ROLE_DASHBOARDS[data.user.role] || '../login.html';
                return null;
            }
            return data.user;
        } catch (err) {
            console.error('Session check failed:', err);
            // Fail closed: if we can't confirm the session (e.g. API not
            // running yet during local dev), don't strand the user on a
            // blank page — send them to login where they can retry.
            return null;
        }
    }

    function populateProfile(user) {
        if (!user) return;
        const initials = (user.name || '?')
            .split(' ')
            .filter(Boolean)
            .map(part => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

        document.querySelectorAll('[data-profile-name]').forEach(el => { el.textContent = user.name; });
        document.querySelectorAll('[data-profile-email]').forEach(el => { el.textContent = user.email; });
        document.querySelectorAll('[data-profile-initials]').forEach(el => { el.textContent = initials || '?'; });
        document.querySelectorAll('[data-profile-role]').forEach(el => { el.textContent = ROLE_LABELS[ROLE]; });
    }

    // ---------------------------------------------------------------------
    // Logout — called by the "Sign Out" button in the confirmation modal.
    // ---------------------------------------------------------------------
    async function performLogout() {
        try {
            await fetch('../api/logout.php', { credentials: 'include' });
        } catch (err) {
            console.error('Logout request failed:', err);
        } finally {
            window.location.href = '../login.html';
        }
    }
    window.performLogout = performLogout;

    // ---------------------------------------------------------------------
    // Sidebar toggle — mobile: slide in/out with backdrop. Desktop:
    // collapse to width 0 so the content area reclaims the space.
    // ---------------------------------------------------------------------
    function setupSidebarToggle() {
        const sidebar = document.getElementById('app-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        const toggleBtn = document.getElementById('desktop-sidebar-toggle');
        const toggleIcon = document.getElementById('sidebar-toggle-icon');
        if (!sidebar || !toggleBtn) return;

        const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
        let desktopCollapsed = false;

        function openMobileSidebar() {
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            if (backdrop) {
                backdrop.classList.remove('hidden');
                requestAnimationFrame(() => backdrop.classList.remove('opacity-0'));
            }
        }

        function closeMobileSidebar() {
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('translate-x-0');
            if (backdrop) {
                backdrop.classList.add('opacity-0');
                setTimeout(() => backdrop.classList.add('hidden'), 300);
            }
        }

        function toggleDesktopSidebar() {
            desktopCollapsed = !desktopCollapsed;
            if (desktopCollapsed) {
                sidebar.style.width = '0px';
                sidebar.style.opacity = '0';
                sidebar.style.borderWidth = '0';
                sidebar.style.overflow = 'hidden';
                if (toggleIcon) toggleIcon.textContent = 'menu';
            } else {
                sidebar.style.width = '';
                sidebar.style.opacity = '';
                sidebar.style.borderWidth = '';
                sidebar.style.overflow = '';
                if (toggleIcon) toggleIcon.textContent = 'menu_open';
            }
        }

        toggleBtn.addEventListener('click', () => {
            if (isMobile()) {
                const isHidden = sidebar.classList.contains('-translate-x-full');
                isHidden ? openMobileSidebar() : closeMobileSidebar();
            } else {
                toggleDesktopSidebar();
            }
        });

        if (backdrop) {
            backdrop.addEventListener('click', closeMobileSidebar);
        }
    }

    // ---------------------------------------------------------------------
    // Profile dropdown menu (top-right avatar button)
    // ---------------------------------------------------------------------
    function setupProfileDropdown() {
        const toggle = document.getElementById('profile-dropdown-toggle');
        const menu = document.getElementById('profile-dropdown-menu');
        if (!toggle || !menu) return;

        function open() {
            menu.classList.remove('hidden');
            requestAnimationFrame(() => {
                menu.classList.remove('opacity-0', 'scale-95');
                menu.classList.add('opacity-100', 'scale-100');
            });
            toggle.setAttribute('aria-expanded', 'true');
        }

        function close() {
            menu.classList.add('opacity-0', 'scale-95');
            menu.classList.remove('opacity-100', 'scale-100');
            toggle.setAttribute('aria-expanded', 'false');
            setTimeout(() => menu.classList.add('hidden'), 200);
        }

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            isOpen ? close() : open();
        });

        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !toggle.contains(e.target)) close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        setupSidebarToggle();
        setupProfileDropdown();
        const user = await checkSession();
        populateProfile(user);
    });
})();
