// Authentication Handler for DOMAIN FREE VIN NESIA
// Supabase Configuration - Replace with your actual values
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabase;

// Initialize Supabase
function initializeSupabase() {
    try {
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.error('Supabase library not loaded');
            showAlert('Authentication service unavailable', 'error');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showAlert('Failed to initialize authentication service', 'error');
        return false;
    }
}

// Check authentication state
async function checkAuthState() {
    if (!supabase) {
        if (!initializeSupabase()) return null;
    }

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            return null;
        }
        
        return session;
    } catch (error) {
        console.error('Error checking auth state:', error);
        return null;
    }
}

// Update UI based on authentication state
async function updateAuthUI() {
    const session = await checkAuthState();
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const dashboardLink = document.getElementById('dashboard-link');
    const userInfo = document.getElementById('user-info');
    const formSection = document.getElementById('form-section');
    const authRequired = document.getElementById('auth-required');

    if (session && session.user) {
        // User is logged in
        if (loginBtn) loginBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (dashboardLink) dashboardLink.classList.remove('hidden');
        if (userInfo) {
            userInfo.textContent = `Welcome, ${session.user.email}`;
            userInfo.classList.remove('hidden');
        }
        if (formSection) formSection.classList.remove('hidden');
        if (authRequired) authRequired.classList.add('hidden');

        // Pre-fill email if form exists
        const emailInput = document.getElementById('email');
        if (emailInput && session.user.email) {
            emailInput.value = session.user.email;
        }
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (dashboardLink) dashboardLink.classList.add('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        if (formSection) formSection.classList.add('hidden');
        if (authRequired) authRequired.classList.remove('hidden');
    }
}

// Login with provider
async function loginWithProvider(provider) {
    if (!supabase) {
        if (!initializeSupabase()) return;
    }

    try {
        showAlert('Redirecting to login...', 'info');
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            console.error(`Error logging in with ${provider}:`, error);
            showAlert(`Failed to login with ${provider}: ${error.message}`, 'error');
        }
    } catch (error) {
        console.error(`Login error with ${provider}:`, error);
        showAlert(`Login failed: ${error.message}`, 'error');
    }
}

// Logout
async function logout() {
    if (!supabase) {
        if (!initializeSupabase()) return;
    }

    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Error logging out:', error);
            showAlert(`Logout failed: ${error.message}`, 'error');
        } else {
            showAlert('Successfully logged out', 'success');
            updateAuthUI();
            
            // Redirect to home if on dashboard
            if (window.location.pathname.includes('dashboard')) {
                window.location.href = '/';
            }
        }
    } catch (error) {
        console.error('Logout error:', error);
        showAlert(`Logout failed: ${error.message}`, 'error');
    }
}

// Get current user
async function getCurrentUser() {
    const session = await checkAuthState();
    return session ? session.user : null;
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        console.log(`Alert: ${message}`);
        return;
    }

    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} flex items-center space-x-2 mb-4`;
    
    let icon;
    switch (type) {
        case 'success':
            icon = 'fas fa-check-circle';
            break;
        case 'error':
            icon = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            icon = 'fas fa-exclamation-triangle';
            break;
        default:
            icon = 'fas fa-info-circle';
    }

    alertElement.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-auto">
            <i class="fas fa-times"></i>
        </button>
    `;

    alertContainer.appendChild(alertElement);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.remove();
        }
    }, 5000);
}

// Modal management
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    }
}

function hideLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize authentication
    if (!initializeSupabase()) return;
    
    // Update UI based on current auth state
    await updateAuthUI();

    // Listen for auth state changes
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            updateAuthUI();
            
            if (event === 'SIGNED_IN') {
                hideLoginModal();
                showAlert('Successfully logged in!', 'success');
            } else if (event === 'SIGNED_OUT') {
                showAlert('Successfully logged out', 'success');
            }
        });
    }

    // Login button event listeners
    const loginBtn = document.getElementById('login-btn');
    const authLoginBtn = document.getElementById('auth-login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const closeModal = document.getElementById('close-modal');

    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }

    if (authLoginBtn) {
        authLoginBtn.addEventListener('click', showLoginModal);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    if (closeModal) {
        closeModal.addEventListener('click', hideLoginModal);
    }

    // Social login buttons
    const googleLogin = document.getElementById('google-login');
    const githubLogin = document.getElementById('github-login');
    const facebookLogin = document.getElementById('facebook-login');

    if (googleLogin) {
        googleLogin.addEventListener('click', () => loginWithProvider('google'));
    }

    if (githubLogin) {
        githubLogin.addEventListener('click', () => loginWithProvider('github'));
    }

    if (facebookLogin) {
        facebookLogin.addEventListener('click', () => loginWithProvider('facebook'));
    }

    // Close modal when clicking outside
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.addEventListener('click', function(e) {
            if (e.target === loginModal) {
                hideLoginModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !document.getElementById('login-modal').classList.contains('hidden')) {
            hideLoginModal();
        }
    });
});

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.authModule = {
        getCurrentUser,
        checkAuthState,
        updateAuthUI,
        loginWithProvider,
        logout,
        showAlert,
        showLoginModal,
        hideLoginModal
    };
}
