(function (window) {
  if (window.NexusAuth) {
    return;
  }

  var AUTH_USERS_KEY = 'nexus-auth-users-v2';
  var AUTH_SESSION_KEY = 'nexus-auth-session-v2';
  var ADMIN_OWNER_KEY = 'nexus-admin-owner-login-v1';
  var ADMIN_CODE_KEY = 'nexus-admin-access-code-v1';
  var MATERIALS_ACCESS_KEY = 'nexus-materials-access-v1';
  var DEFAULT_ADMIN_ACCESS_CODE = 'MudGPT-9301';
  var DEDICATED_ADMIN_LOGIN = 'admin';
  var DEDICATED_ADMIN_PASSWORD = '12345';
  var DEDICATED_ADMIN_NAME = 'Andrey Admin';
  var DEDICATED_ADMIN_COMPANY = 'MudGPT Control';
  var DEDICATED_ADMIN_EMAIL = 'admin@mudgpt.local';

  function safeJsonParse(value, fallbackValue) {
    try {
      var parsed = JSON.parse(value);
      return parsed == null ? fallbackValue : parsed;
    } catch (error) {
      return fallbackValue;
    }
  }

  function normalizeLogin(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getDedicatedAdminLogin() {
    return DEDICATED_ADMIN_LOGIN;
  }

  function isReservedLogin(login) {
    return normalizeLogin(login) === DEDICATED_ADMIN_LOGIN;
  }

  function loadUsers() {
    var users = safeJsonParse(localStorage.getItem(AUTH_USERS_KEY) || '[]', []);
    return Array.isArray(users) ? users : [];
  }

  function saveUsers(users) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(Array.isArray(users) ? users : []));
  }

  function getSession() {
    var session = safeJsonParse(localStorage.getItem(AUTH_SESSION_KEY) || 'null', null);
    return session && session.login ? session : null;
  }

  function dispatchSessionChange(session) {
    window.dispatchEvent(
      new CustomEvent('nexus:session-change', {
        detail: { session: session || null }
      })
    );
  }

  function hasAdminOwnerLogin() {
    return true;
  }

  function getAdminOwnerLogin() {
    return DEDICATED_ADMIN_LOGIN;
  }

  function setAdminOwnerLogin(login) {
    return DEDICATED_ADMIN_LOGIN;
  }

  function getAdminAccessCode() {
    return String(localStorage.getItem(ADMIN_CODE_KEY) || DEFAULT_ADMIN_ACCESS_CODE);
  }

  function dispatchPermissionsChange() {
    window.dispatchEvent(
      new CustomEvent('nexus:permissions-change', {
        detail: {
          materialsEditors: listMaterialsEditors()
        }
      })
    );
  }

  function loadMaterialsAccess() {
    var access = safeJsonParse(localStorage.getItem(MATERIALS_ACCESS_KEY) || '{}', {});
    if (!access || typeof access !== 'object') {
      return { editors: [] };
    }

    if (!Array.isArray(access.editors)) {
      access.editors = [];
    }

    access.editors = access.editors
      .map(normalizeLogin)
      .filter(function (login, index, source) {
        return !!login && source.indexOf(login) === index;
      });

    return access;
  }

  function saveMaterialsAccess(access) {
    var normalized = access && typeof access === 'object' ? access : { editors: [] };
    if (!Array.isArray(normalized.editors)) {
      normalized.editors = [];
    }

    normalized.editors = normalized.editors
      .map(normalizeLogin)
      .filter(function (login, index, source) {
        return !!login && source.indexOf(login) === index;
      });

    localStorage.setItem(MATERIALS_ACCESS_KEY, JSON.stringify(normalized));
    dispatchPermissionsChange();
    return normalized;
  }

  function listMaterialsEditors() {
    return loadMaterialsAccess().editors.slice();
  }

  function grantMaterialsEditor(login) {
    var normalized = normalizeLogin(login);
    var access;

    if (!normalized || normalized === getAdminOwnerLogin()) {
      return listMaterialsEditors();
    }

    access = loadMaterialsAccess();
    if (access.editors.indexOf(normalized) === -1) {
      access.editors.push(normalized);
      saveMaterialsAccess(access);
    }

    return access.editors.slice();
  }

  function revokeMaterialsEditor(login) {
    var normalized = normalizeLogin(login);
    var access = loadMaterialsAccess();
    access.editors = access.editors.filter(function (item) {
      return item !== normalized;
    });
    saveMaterialsAccess(access);
    return access.editors.slice();
  }

  function isMaterialsEditor(loginOrSession) {
    var login = typeof loginOrSession === 'string'
      ? normalizeLogin(loginOrSession)
      : normalizeLogin(loginOrSession && loginOrSession.login);

    if (!login) {
      return false;
    }

    return listMaterialsEditors().indexOf(login) !== -1;
  }

  function getMaterialsRole(session) {
    if (isAdminSession(session)) {
      return 'admin';
    }
    if (isMaterialsEditor(session)) {
      return 'editor';
    }
    return 'viewer';
  }

  function canEditMaterials(session) {
    var role = getMaterialsRole(session);
    return role === 'admin' || role === 'editor';
  }

  function canManageMaterialsAccess(session) {
    return getMaterialsRole(session) === 'admin';
  }

  function canEditMaterialsField(session, fieldName) {
    var role = getMaterialsRole(session);
    var field = String(fieldName || '').trim().toLowerCase();

    if (role === 'admin') {
      return true;
    }

    if (role !== 'editor') {
      return false;
    }

    return field === 'stock' || field === 'price';
  }

  function saveSession(user, options) {
    var settings = options || {};
    var session = {
      login: normalizeLogin(user && user.login),
      name: user && user.name ? String(user.name) : '',
      email: user && user.email ? String(user.email) : '',
      company: user && user.company ? String(user.company) : '',
      role: settings.isAdmin ? 'admin' : 'user',
      isAdmin: settings.isAdmin === true
    };

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    dispatchSessionChange(session);
    return session;
  }

  function clearSession() {
    localStorage.removeItem(AUTH_SESSION_KEY);
    dispatchSessionChange(null);
  }

  function isAdminSession(session) {
    return !!(session && (session.isAdmin === true || session.role === 'admin'));
  }

  function getDedicatedAdminUser() {
    return {
      login: DEDICATED_ADMIN_LOGIN,
      name: DEDICATED_ADMIN_NAME,
      email: DEDICATED_ADMIN_EMAIL,
      company: DEDICATED_ADMIN_COMPANY
    };
  }

  function canUserBecomeAdmin(user) {
    return !!(user && normalizeLogin(user.login) === DEDICATED_ADMIN_LOGIN);
  }

  function authenticate(login, password) {
    var normalizedLogin = normalizeLogin(login);
    var users = loadUsers();
    return users.find(function (user) {
      return normalizeLogin(user.login) === normalizedLogin && user.password === password;
    }) || null;
  }

  function authenticateWithAdmin(login, password, accessCode) {
    if (normalizeLogin(login) !== DEDICATED_ADMIN_LOGIN || password !== DEDICATED_ADMIN_PASSWORD) {
      return { ok: false, reason: 'invalid-admin-credentials' };
    }

    return { ok: true, user: getDedicatedAdminUser() };
  }

  function authenticateDedicatedAdmin(login, password) {
    return authenticateWithAdmin(login, password, '');
  }

  function storageListener(event) {
    if (event.key === AUTH_SESSION_KEY) {
      dispatchSessionChange(getSession());
      return;
    }

    if (event.key === MATERIALS_ACCESS_KEY) {
      dispatchPermissionsChange();
    }
  }

  window.addEventListener('storage', storageListener);

  window.NexusAuth = {
    AUTH_USERS_KEY: AUTH_USERS_KEY,
    AUTH_SESSION_KEY: AUTH_SESSION_KEY,
    loadUsers: loadUsers,
    saveUsers: saveUsers,
    getSession: getSession,
    saveSession: saveSession,
    clearSession: clearSession,
    isAdminSession: isAdminSession,
    canUserBecomeAdmin: canUserBecomeAdmin,
    authenticate: authenticate,
    authenticateWithAdmin: authenticateWithAdmin,
    authenticateDedicatedAdmin: authenticateDedicatedAdmin,
    hasAdminOwnerLogin: hasAdminOwnerLogin,
    getAdminOwnerLogin: getAdminOwnerLogin,
    setAdminOwnerLogin: setAdminOwnerLogin,
    getAdminAccessCode: getAdminAccessCode,
    getDedicatedAdminLogin: getDedicatedAdminLogin,
    isReservedLogin: isReservedLogin,
    loadMaterialsAccess: loadMaterialsAccess,
    saveMaterialsAccess: saveMaterialsAccess,
    listMaterialsEditors: listMaterialsEditors,
    grantMaterialsEditor: grantMaterialsEditor,
    revokeMaterialsEditor: revokeMaterialsEditor,
    isMaterialsEditor: isMaterialsEditor,
    getMaterialsRole: getMaterialsRole,
    canEditMaterials: canEditMaterials,
    canManageMaterialsAccess: canManageMaterialsAccess,
    canEditMaterialsField: canEditMaterialsField,
    normalizeLogin: normalizeLogin
  };
}(window));