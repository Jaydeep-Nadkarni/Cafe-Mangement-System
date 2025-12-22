// Dynamic Manifest Loader for Dashboard-Specific PWA
// This script detects which dashboard the user is on and loads the appropriate manifest

(function () {
    'use strict';

    function loadDashboardManifest() {
        const path = window.location.pathname;
        let manifestPath = '/manifest.json'; // default (customer menu)
        let themeColor = '#16a34a'; // default green

        // Detect dashboard type
        if (path.startsWith('/branch-dashboard')) {
            manifestPath = '/manifest-manager.json';
            themeColor = '#16a34a'; // green for manager
            console.log('[PWA] Loading Manager Dashboard manifest');
        } else if (path.startsWith('/admin-dashboard')) {
            manifestPath = '/manifest-admin.json';
            themeColor = '#7c3aed'; // purple for admin
            console.log('[PWA] Loading Admin Dashboard manifest');
        }

        // Update manifest link
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            manifestLink.href = manifestPath;
        }

        // Update theme color
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.content = themeColor;
        }

        // Update apple mobile web app capable for dashboards
        if (path.startsWith('/branch-dashboard') || path.startsWith('/admin-dashboard')) {
            let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
            if (!appleMeta) {
                appleMeta = document.createElement('meta');
                appleMeta.name = 'apple-mobile-web-app-capable';
                document.head.appendChild(appleMeta);
            }
            appleMeta.content = 'yes';
        }
    }

    // Load manifest on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDashboardManifest);
    } else {
        loadDashboardManifest();
    }

    // Re-load manifest on route changes (for SPA navigation)
    let lastPath = window.location.pathname;
    setInterval(() => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname;
            loadDashboardManifest();
        }
    }, 500);
})();
