import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../api/proxy';

const STORE_KEY_AUTH   = 'auth_verified';
const STORE_KEY_TOKEN  = 'bearer_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bearerToken, setBearerToken] = useState(null);
  const [loading, setLoading] = useState(true);   // true while reading SecureStore on launch

  // On mount: restore session from SecureStore if it exists.
  useEffect(() => {
    (async () => {
      try {
        const auth   = await SecureStore.getItemAsync(STORE_KEY_AUTH);
        const token  = await SecureStore.getItemAsync(STORE_KEY_TOKEN);
        if (auth === 'true' && token) {
          setBearerToken(token);
          setIsAuthenticated(true);
        }
      } catch (_) {
        // SecureStore read failure — treat as unauthenticated.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Submit password to /check-password.
  // On success server returns { ok: true, bearer_token: "..." } — Option B approved by Matt.
  async function login(password) {
    const res = await fetch(`${BASE_URL}/check-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (data.ok && data.bearer_token) {
      await SecureStore.setItemAsync(STORE_KEY_AUTH,  'true');
      await SecureStore.setItemAsync(STORE_KEY_TOKEN, data.bearer_token);
      setBearerToken(data.bearer_token);
      setIsAuthenticated(true);
      return { success: true };
    }

    // Fallback: ok but no bearer_token (backend not yet updated).
    if (data.ok) {
      await SecureStore.setItemAsync(STORE_KEY_AUTH, 'true');
      setIsAuthenticated(true);
      return { success: true };
    }

    return { success: false };
  }

  async function logout() {
    await SecureStore.deleteItemAsync(STORE_KEY_AUTH);
    await SecureStore.deleteItemAsync(STORE_KEY_TOKEN);
    setBearerToken(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, bearerToken, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
