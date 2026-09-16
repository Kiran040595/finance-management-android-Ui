import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_USER_KEY = '@vf_auth_user_session_v1';
const AUTH_SETTINGS_KEY = '@vf_auth_settings_v1';

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
};

// Default system accounts
const DEFAULT_ACCOUNTS = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    role: USER_ROLES.ADMIN,
    pin: '1234',
  },
  {
    username: 'manager',
    password: 'manager123',
    name: 'Operations Manager',
    role: USER_ROLES.MANAGER,
    pin: '5678',
  },
];

class AuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
  }

  async init() {
    try {
      const stored = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error loading auth session:', e);
    }
    return this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  isAdmin() {
    return this.currentUser?.role === USER_ROLES.ADMIN;
  }

  async login(username, password) {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const account = DEFAULT_ACCOUNTS.find(
      (a) => a.username.toLowerCase() === cleanUser && a.password === cleanPass
    );

    if (!account) {
      throw new Error('Invalid username or password. Please try admin/admin123 or manager/manager123');
    }

    // Check custom PIN if saved
    const settings = await this.getSettings();
    const activePin = settings[account.username]?.pin || account.pin;

    this.currentUser = {
      username: account.username,
      name: account.name,
      role: account.role,
      pin: activePin,
      lastLogin: new Date().toISOString(),
    };

    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
    this.notifyListeners();
    return this.currentUser;
  }

  async loginWithPin(pin) {
    const cleanPin = String(pin || '').trim();
    const settings = await this.getSettings();

    // Check Admin PIN first, then Manager PIN
    for (const account of DEFAULT_ACCOUNTS) {
      const activePin = settings[account.username]?.pin || account.pin;
      if (activePin === cleanPin) {
        this.currentUser = {
          username: account.username,
          name: account.name,
          role: account.role,
          pin: activePin,
          lastLogin: new Date().toISOString(),
        };
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
        this.notifyListeners();
        return this.currentUser;
      }
    }

    throw new Error('Incorrect 4-digit PIN');
  }

  async logout() {
    this.currentUser = null;
    try {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
    } catch (e) {}
    this.notifyListeners();
  }

  async updatePin(newPin) {
    if (!this.currentUser) throw new Error('Not authenticated');
    if (!newPin || String(newPin).length !== 4) throw new Error('PIN must be exactly 4 digits');

    const settings = await this.getSettings();
    settings[this.currentUser.username] = {
      ...(settings[this.currentUser.username] || {}),
      pin: String(newPin),
    };

    await AsyncStorage.setItem(AUTH_SETTINGS_KEY, JSON.stringify(settings));
    this.currentUser.pin = String(newPin);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
    this.notifyListeners();
  }

  async getSettings() {
    try {
      const stored = await AsyncStorage.getItem(AUTH_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentUser);
      } catch (e) {}
    });
  }
}

export const authService = new AuthService();
export default authService;
