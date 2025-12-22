// Dashboard-Specific PWA Install Prompt
// Shows install button only on manager/admin dashboards

let deferredPrompt = null;
let installButton = null;

export function setupDashboardInstallPrompt() {
    // Only show on dashboards
    const path = window.location.pathname;
    const isDashboard = path.startsWith('/branch-dashboard') || path.startsWith('/admin-dashboard');

    if (!isDashboard) {
        console.log('[PWA] Not on dashboard, skipping install prompt');
        return;
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        console.log('[PWA] Install prompt available for dashboard');
        showDashboardInstallButton();
    });

    // Detect when app was installed
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] Dashboard app installed successfully!');
        deferredPrompt = null;
        hideDashboardInstallButton();

        // Show success message
        showInstallSuccessMessage();
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] App is running in standalone mode');
    }
}

function showDashboardInstallButton() {
    // Check if button already exists
    if (document.getElementById('dashboard-install-btn')) return;

    const path = window.location.pathname;
    const isManager = path.startsWith('/branch-dashboard');
    const isAdmin = path.startsWith('/admin-dashboard');

    const appName = isManager ? 'Manager POS' : isAdmin ? 'Admin Panel' : 'Dashboard';
    const themeColor = isManager ? '#16a34a' : '#7c3aed';

    installButton = document.createElement('div');
    installButton.id = 'dashboard-install-btn';
    installButton.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 2px solid ${themeColor};
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 320px;
      font-family: system-ui, -apple-system, sans-serif;
      animation: slideInRight 0.3s ease;
    ">
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="
          width: 48px;
          height: 48px;
          background: ${themeColor};
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
          flex-shrink: 0;
        ">
          ${isManager ? 'M' : 'A'}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
            Install ${appName}
          </div>
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">
            Add to your Windows taskbar for quick access
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="install-now-btn" style="
              flex: 1;
              background: ${themeColor};
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
            ">
              Install
            </button>
            <button id="install-dismiss-btn" style="
              background: transparent;
              color: #6b7280;
              border: 1px solid #d1d5db;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            ">
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

    document.body.appendChild(installButton);

    // Install button click
    document.getElementById('install-now-btn').addEventListener('click', async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        console.log('[PWA] Install prompt outcome:', outcome);

        if (outcome === 'accepted') {
            console.log('[PWA] User accepted install');
        } else {
            console.log('[PWA] User dismissed install');
        }

        deferredPrompt = null;
        hideDashboardInstallButton();
    });

    // Dismiss button click
    document.getElementById('install-dismiss-btn').addEventListener('click', () => {
        hideDashboardInstallButton();

        // Show again in 24 hours
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    });

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
    document.head.appendChild(style);
}

function hideDashboardInstallButton() {
    if (installButton) {
        installButton.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            installButton?.remove();
            installButton = null;
        }, 300);
    }
}

function showInstallSuccessMessage() {
    const path = window.location.pathname;
    const isManager = path.startsWith('/branch-dashboard');
    const appName = isManager ? 'Manager POS' : 'Admin Panel';

    const message = document.createElement('div');
    message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 16px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    z-index: 10001;
    font-family: system-ui, -apple-system, sans-serif;
    animation: slideInRight 0.3s ease;
  `;

    message.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">
      ✅ ${appName} Installed!
    </div>
    <div style="font-size: 14px; opacity: 0.9;">
      Find it in your Start Menu and taskbar
    </div>
  `;

    document.body.appendChild(message);

    setTimeout(() => {
        message.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => message.remove(), 300);
    }, 5000);
}

// Check if user dismissed install recently
export function shouldShowInstallPrompt() {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) return true;

    const dismissedTime = parseInt(dismissed);
    const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);

    return hoursSinceDismissed > 24; // Show again after 24 hours
}
