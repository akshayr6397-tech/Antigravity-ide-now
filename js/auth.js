/**
 * ASTROCAL TRACKER — Cosmic Authentication & Session Management
 * Handles Sign In, Sign Up, 1-Click Demo Credentials, and Header Profile UI
 */

class AuthEngine {
  constructor() {
    this.storageKey = 'astrocal_session_user';
    this.currentUser = this.loadSession();

    // Default Demo Credentials
    this.demoAccount = {
      name: 'Alex Chen',
      email: 'stargazer@astrocal.space',
      password: 'cosmic2026',
      avatar: '🧑‍🚀',
      tier: 'PRO STARGAZER ✦',
      station: 'Pune, India',
      joinedDate: 'August 2026'
    };

    this.init();
  }

  init() {
    this.bindAuthModal();
    this.updateHeaderProfile();
  }

  loadSession() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveSession(user) {
    this.currentUser = user;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    } catch (e) {}
    this.updateHeaderProfile();
  }

  clearSession() {
    this.currentUser = null;
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {}
    this.updateHeaderProfile();
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  /* --- Login / Sign Up Logic --- */
  login(email, password) {
    email = email.trim().toLowerCase();

    // Check if demo credentials
    if (email === this.demoAccount.email && password === this.demoAccount.password) {
      this.saveSession(this.demoAccount);
      this.onAuthSuccess(`Welcome back, ${this.demoAccount.name}! Stargazer Pro session active.`);
      return { success: true };
    }

    // Generic test login fallback for any email/password
    if (email && password && password.length >= 4) {
      const user = {
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: email,
        avatar: '🔭',
        tier: 'STARGAZER MEMBER',
        station: window.app && window.app.skyMap ? window.app.skyMap.currentLocation.name : 'Pune, India',
        joinedDate: 'August 2026'
      };
      this.saveSession(user);
      this.onAuthSuccess(`Welcome back, ${user.name}!`);
      return { success: true };
    }

    return { success: false, message: 'Invalid credentials. Password must be at least 4 characters.' };
  }

  signup(name, email, password) {
    if (!name || !email || !password || password.length < 4) {
      return { success: false, message: 'Please enter valid name, email, and a password (min 4 chars).' };
    }

    const newUser = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatar: '🌟',
      tier: 'PRO STARGAZER ✦',
      station: window.app && window.app.skyMap ? window.app.skyMap.currentLocation.name : 'Pune, India',
      joinedDate: 'August 2026'
    };

    this.saveSession(newUser);
    this.onAuthSuccess(`Account created! Welcome to the cosmos, ${newUser.name}.`);
    return { success: true };
  }

  loginWithDemo() {
    this.saveSession(this.demoAccount);
    this.onAuthSuccess(`🚀 Logged in as Demo Stargazer Pro (${this.demoAccount.name})!`);
  }

  loginWithSocial(provider = 'Google') {
    const socialUser = {
      name: `${provider} Stargazer`,
      email: `stargazer@${provider.toLowerCase()}.com`,
      avatar: provider === 'Google' ? '🌐' : '🐙',
      tier: 'PRO STARGAZER ✦',
      station: 'Pune, India',
      joinedDate: 'August 2026'
    };
    this.saveSession(socialUser);
    this.onAuthSuccess(`Authenticated with ${provider}! Welcome, ${socialUser.name}.`);
  }

  logout() {
    const name = this.currentUser ? this.currentUser.name : 'Stargazer';
    this.clearSession();
    if (window.app) {
      window.app.showToast(`Signed out. Clear skies, ${name}!`);
    }
  }

  onAuthSuccess(message) {
    this.closeAuthModal();
    if (window.app) {
      window.app.showToast(`✦ ${message}`);
      if (window.app.audio) {
        window.app.audio.playCelestialChime(784.0); // G5 celebratory chime
      }
    }
  }

  /* --- UI Update for Site Header Profile --- */
  updateHeaderProfile() {
    const container = document.getElementById('header-user-container');
    if (!container) return;

    if (this.isLoggedIn()) {
      container.innerHTML = `
        <div class="user-profile-menu" id="user-profile-menu">
          <button class="user-profile-pill" id="btn-user-dropdown" title="Stargazer Profile">
            <span class="user-avatar">${this.currentUser.avatar || '🧑‍🚀'}</span>
            <span class="user-name">${this.currentUser.name}</span>
            <span class="user-tier-badge">${this.currentUser.tier.includes('PRO') ? 'PRO' : 'MEMBER'}</span>
            <span class="dropdown-chevron">▾</span>
          </button>

          <div class="user-dropdown-card" id="user-dropdown-card">
            <div class="dropdown-header">
              <div class="d-avatar-large">${this.currentUser.avatar || '🧑‍🚀'}</div>
              <div class="d-info">
                <div class="d-name">${this.currentUser.name}</div>
                <div class="d-email">${this.currentUser.email}</div>
                <span class="d-tier-tag">${this.currentUser.tier}</span>
              </div>
            </div>

            <div class="dropdown-stats-row">
              <div class="d-stat">
                <span class="ds-val">8</span>
                <span class="ds-lbl">Observed</span>
              </div>
              <div class="d-stat">
                <span class="ds-val" id="stat-saved-count">2</span>
                <span class="ds-lbl">Saved</span>
              </div>
              <div class="d-stat">
                <span class="ds-val">100%</span>
                <span class="ds-lbl">Clarity</span>
              </div>
            </div>

            <div class="dropdown-links-list">
              <div class="d-link-item" id="d-action-station">
                <span>📍</span> Sky Station: <strong>${this.currentUser.station || 'Pune, India'}</strong>
              </div>
              <div class="d-link-item" id="d-action-alerts">
                <span>🔔</span> Alert Frequency: <strong>Real-time</strong>
              </div>
              <button class="d-logout-btn" id="btn-user-logout">
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
        </div>
      `;

      // Bind Dropdown Toggle
      const pill = container.querySelector('#btn-user-dropdown');
      const card = container.querySelector('#user-dropdown-card');
      const logoutBtn = container.querySelector('#btn-user-logout');

      if (pill && card) {
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          card.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
          if (!card.contains(e.target) && !pill.contains(e.target)) {
            card.classList.remove('active');
          }
        });
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this.logout();
        });
      }

    } else {
      // Logged Out UI: Show Sign In / Join Button
      container.innerHTML = `
        <button class="btn-auth-trigger" id="btn-open-auth">
          <span class="auth-icon">✦</span> Sign In / Join
        </button>
      `;

      const trigger = container.querySelector('#btn-open-auth');
      if (trigger) {
        trigger.addEventListener('click', () => {
          this.openAuthModal('signin');
        });
      }
    }
  }

  /* --- Auth Modal Bindings --- */
  bindAuthModal() {
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('btn-close-auth');
    const tabSignIn = document.getElementById('tab-signin');
    const tabSignUp = document.getElementById('tab-signup');
    const formSignIn = document.getElementById('form-signin');
    const formSignUp = document.getElementById('form-signup');
    const demoQuickBtn = document.getElementById('btn-demo-quick-auth');
    const btnGoogleAuth = document.getElementById('btn-auth-google');
    const btnGithubAuth = document.getElementById('btn-auth-github');
    const togglePassBtn = document.getElementById('btn-toggle-pass-visibility');

    if (!modal) return;

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeAuthModal());
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeAuthModal();
    });

    // Tab switching
    if (tabSignIn && tabSignUp && formSignIn && formSignUp) {
      tabSignIn.addEventListener('click', () => {
        tabSignIn.classList.add('active');
        tabSignUp.classList.remove('active');
        formSignIn.style.display = 'block';
        formSignUp.style.display = 'none';
      });

      tabSignUp.addEventListener('click', () => {
        tabSignUp.classList.add('active');
        tabSignIn.classList.remove('active');
        formSignUp.style.display = 'block';
        formSignIn.style.display = 'none';
      });
    }

    // 1-Click Quick Demo Launcher
    if (demoQuickBtn) {
      demoQuickBtn.addEventListener('click', () => {
        this.loginWithDemo();
      });
    }

    // Social buttons
    if (btnGoogleAuth) {
      btnGoogleAuth.addEventListener('click', () => this.loginWithSocial('Google'));
    }
    if (btnGithubAuth) {
      btnGithubAuth.addEventListener('click', () => this.loginWithSocial('GitHub'));
    }

    // Password Reveal Eye Toggle
    if (togglePassBtn) {
      togglePassBtn.addEventListener('click', () => {
        const passInput = document.getElementById('signin-password');
        if (passInput) {
          const isPass = passInput.type === 'password';
          passInput.type = isPass ? 'text' : 'password';
          togglePassBtn.textContent = isPass ? '🔒' : '👁️';
        }
      });
    }

    // Form Submissions
    if (formSignIn) {
      formSignIn.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const pass = document.getElementById('signin-password').value;
        const errEl = document.getElementById('signin-error-msg');

        const res = this.login(email, pass);
        if (!res.success && errEl) {
          errEl.textContent = res.message;
          errEl.style.display = 'block';
        } else if (errEl) {
          errEl.style.display = 'none';
        }
      });
    }

    if (formSignUp) {
      formSignUp.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const pass = document.getElementById('signup-password').value;
        const errEl = document.getElementById('signup-error-msg');

        const res = this.signup(name, email, pass);
        if (!res.success && errEl) {
          errEl.textContent = res.message;
          errEl.style.display = 'block';
        } else if (errEl) {
          errEl.style.display = 'none';
        }
      });
    }
  }

  openAuthModal(mode = 'signin') {
    const modal = document.getElementById('auth-modal');
    const tabSignIn = document.getElementById('tab-signin');
    const tabSignUp = document.getElementById('tab-signup');
    const formSignIn = document.getElementById('form-signin');
    const formSignUp = document.getElementById('form-signup');

    if (!modal) return;

    if (mode === 'signup') {
      if (tabSignUp) tabSignUp.click();
    } else {
      if (tabSignIn) tabSignIn.click();
    }

    modal.showModal();
  }

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal && modal.open) {
      modal.close();
    }
  }
}

window.AuthEngine = AuthEngine;
