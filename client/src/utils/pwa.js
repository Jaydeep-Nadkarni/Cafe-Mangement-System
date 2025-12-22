// PWA Service Worker Registration and Update Handler
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('[PWA] Service Worker registered:', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('[PWA] New service worker found, installing...');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            console.log('[PWA] New version available!');
                            showUpdateNotification(registration);
                        }
                    });
                });

                // Check for updates periodically (every hour)
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);

            } catch (error) {
                console.error('[PWA] Service Worker registration failed:', error);
            }
        });
    }
}

// Show update notification to user
function showUpdateNotification(registration) {
    const updateBanner = document.createElement('div');
    updateBanner.id = 'pwa-update-banner';
    updateBanner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="font-weight: 600; margin-bottom: 8px;">
        🎉 New version available!
      </div>
      <div style="font-size: 14px; color: #d1d5db; margin-bottom: 12px;">
        A new version of Smart Cafe POS is ready. Refresh to update.
      </div>
      <button id="pwa-update-btn" style="
        background: #16a34a;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        margin-right: 8px;
      ">
        Update Now
      </button>
      <button id="pwa-dismiss-btn" style="
        background: transparent;
        color: #9ca3af;
        border: 1px solid #4b5563;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
      ">
        Later
      </button>
    </div>
  `;

    document.body.appendChild(updateBanner);

    // Update button click
    document.getElementById('pwa-update-btn').addEventListener('click', () => {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    });

    // Dismiss button click
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        updateBanner.remove();
    });
}

// Install prompt handler
let deferredPrompt;

export function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent default install prompt
        e.preventDefault();
        deferredPrompt = e;

        console.log('[PWA] Install prompt available');

        // Show custom install button (if you want to add one)
        showInstallButton();
    });

    // Detect when app was installed
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed successfully!');
        deferredPrompt = null;
        hideInstallButton();
    });
}

function showInstallButton() {
    // Check if install button already exists
    if (document.getElementById('pwa-install-btn')) return;

    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.innerHTML = '📥 Install App';
    installBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #16a34a;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
    z-index: 9999;
    font-size: 14px;
    transition: all 0.3s ease;
  `;

    installBtn.addEventListener('mouseenter', () => {
        installBtn.style.transform = 'translateY(-2px)';
        installBtn.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.5)';
    });

    installBtn.addEventListener('mouseleave', () => {
        installBtn.style.transform = 'translateY(0)';
        installBtn.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.4)';
    });

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        // Show install prompt
        deferredPrompt.prompt();

        // Wait for user choice
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] Install prompt outcome:', outcome);

        deferredPrompt = null;
        hideInstallButton();
    });

    document.body.appendChild(installBtn);
}

function hideInstallButton() {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.remove();
}

// Online/Offline status handler
export function setupOnlineStatus() {
    let isOnline = navigator.onLine;

    const updateOnlineStatus = () => {
        const wasOffline = !isOnline;
        isOnline = navigator.onLine;

        if (isOnline && wasOffline) {
            showNotification('✅ Back Online', 'Connection restored', 'success');
        } else if (!isOnline) {
            showNotification('📡 Offline', 'No internet connection', 'warning');
        }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    if (!isOnline) {
        showNotification('📡 Offline', 'No internet connection', 'warning');
    }
}

function showNotification(title, message, type = 'info') {
    const colors = {
        success: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
        warning: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
        error: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
        info: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' }
    };

    const color = colors[type] || colors.info;

    const notification = document.createElement('div');
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color.bg};
    color: ${color.text};
    padding: 16px 20px;
    border-radius: 10px;
    border-left: 4px solid ${color.border};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10001;
    max-width: 350px;
    font-family: system-ui, -apple-system, sans-serif;
    animation: slideIn 0.3s ease;
  `;

    notification.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
    <div style="font-size: 14px;">${message}</div>
  `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
