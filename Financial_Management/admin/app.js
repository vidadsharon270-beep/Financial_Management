/* ==========================================================================
   app.js — shared dashboard shell behavior (Admin)
   Handles: session guard, profile info, sidebar toggle, profile dropdown,
   and logout. Loaded before dashboard.js on every dashboard.html.
   ========================================================================== */
(function () {
    const ROLE = 'admin';
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
        let mobileOpen = false;

        // Clears any inline styles the desktop "collapse" mode may have set,
        // so they can never linger and block the mobile slide-in/out
        // transform (this was the root cause of the toggle sometimes
        // failing to close the sidebar on mobile).
        function clearDesktopCollapseStyles() {
            sidebar.style.removeProperty('width');
            sidebar.style.removeProperty('opacity');
            sidebar.style.removeProperty('border-width');
            sidebar.style.removeProperty('overflow');
        }

        function setIcon(name) {
            if (toggleIcon) toggleIcon.textContent = name;
        }

        function openMobileSidebar() {
            clearDesktopCollapseStyles();
            mobileOpen = true;
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            setIcon('menu_open');
            if (backdrop) {
                backdrop.classList.remove('hidden');
                requestAnimationFrame(() => backdrop.classList.remove('opacity-0'));
            }
        }

        function closeMobileSidebar() {
            mobileOpen = false;
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('translate-x-0');
            setIcon('menu');
            if (backdrop) {
                backdrop.classList.add('opacity-0');
                setTimeout(() => backdrop.classList.add('hidden'), 300);
            }
        }

        function toggleDesktopSidebar() {
            desktopCollapsed = !desktopCollapsed;
            if (desktopCollapsed) {
                // Note: these MUST be set with "important" priority — the
                // stylesheet's own .w-72 / .opacity-100 utility classes are
                // declared with !important, which otherwise permanently
                // beats a plain inline style and makes the collapse a no-op.
                sidebar.style.setProperty('width', '0px', 'important');
                sidebar.style.setProperty('opacity', '0', 'important');
                sidebar.style.setProperty('border-width', '0px', 'important');
                sidebar.style.setProperty('overflow', 'hidden', 'important');
                setIcon('menu');
            } else {
                clearDesktopCollapseStyles();
                setIcon('menu_open');
            }
        }

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMobile()) {
                mobileOpen ? closeMobileSidebar() : openMobileSidebar();
            } else {
                toggleDesktopSidebar();
            }
        });

        if (backdrop) {
            backdrop.addEventListener('click', closeMobileSidebar);
        }

        // Keep state sane when crossing the mobile/desktop breakpoint
        // (device rotation, resizing a browser window, devtools, etc.)
        // so leftover state from one mode never breaks the other.
        window.addEventListener('resize', () => {
            if (isMobile()) {
                // Entering mobile: desktop collapse styles must not linger.
                if (desktopCollapsed) {
                    desktopCollapsed = false;
                    clearDesktopCollapseStyles();
                }
                if (!mobileOpen) {
                    sidebar.classList.add('-translate-x-full');
                    sidebar.classList.remove('translate-x-0');
                }
            } else {
                // Entering desktop: mobile slide classes/backdrop must not linger.
                if (mobileOpen) {
                    mobileOpen = false;
                    sidebar.classList.remove('translate-x-0');
                    if (backdrop) {
                        backdrop.classList.add('hidden', 'opacity-0');
                    }
                }
                sidebar.classList.remove('-translate-x-full');
                setIcon(desktopCollapsed ? 'menu' : 'menu_open');
            }
        });
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
