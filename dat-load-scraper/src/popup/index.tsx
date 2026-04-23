import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';

const Popup = () => {
  const [relayCount, setRelayCount] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [pushInterval, setPushInterval] = useState(60);

  useEffect(() => {
    chrome.storage.local.get(
      ['relayLoadCount', 'relayLastUpdated', 'authToken', 'pushIntervalSeconds'],
      (result) => {
        if (result.relayLoadCount !== undefined) {
          setRelayCount(result.relayLoadCount);
        }
        if (result.relayLastUpdated) {
          setLastUpdated(new Date(result.relayLastUpdated).toLocaleTimeString());
        }
        if (result.authToken) {
          setAuthToken(result.authToken);
        }
        if (result.pushIntervalSeconds !== undefined) {
          setPushInterval(result.pushIntervalSeconds);
        }
      },
    );

    const handleChanges = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== 'local') return;
      if (changes.relayLoadCount) {
        setRelayCount(changes.relayLoadCount.newValue);
      }
      if (changes.relayLastUpdated) {
        setLastUpdated(new Date(changes.relayLastUpdated.newValue).toLocaleTimeString());
      }
      if (changes.authToken) {
        setAuthToken(changes.authToken.newValue ?? null);
      }
      if (changes.pushIntervalSeconds) {
        setPushInterval(changes.pushIntervalSeconds.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleChanges);
    return () => chrome.storage.onChanged.removeListener(handleChanges);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (!response.ok) {
        const body = (await response.json()) as Record<string, unknown>;
        const errors = body.errors;
        const message =
          Array.isArray(errors) && errors.length > 0
            ? String((errors[0] as Record<string, unknown>).message ?? 'Login failed')
            : 'Login failed';
        setLoginError(message);
        return;
      }

      const body = (await response.json()) as Record<string, unknown>;

      // The API sets httpOnly cookies and returns user data in the body.
      // Extract the access token from the response if the API includes it,
      // otherwise fall back to reading it via chrome.cookies.
      const token =
        typeof body.accessToken === 'string'
          ? body.accessToken
          : null;

      if (token) {
        chrome.storage.local.set({ authToken: token });
        setAuthToken(token);
      } else {
        // Try reading the cookie the API set (requires "cookies" permission + host_permissions)
        chrome.cookies?.get(
          { url: 'http://localhost:3001', name: 'accessToken' },
          (cookie) => {
            if (cookie?.value) {
              chrome.storage.local.set({ authToken: cookie.value });
              setAuthToken(cookie.value);
            } else {
              setLoginError(
                'Login succeeded but token could not be retrieved. The API may need to return the token in the response body.',
              );
            }
          },
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Network error — is the API running?';
      setLoginError(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    chrome.storage.local.remove('authToken');
    setAuthToken(null);
  };

  return (
    <div className="dat-filter-config">
      <div className="dat-filter-config-header">
        <h1>Hustle Extension</h1>
      </div>

      <div className="auth-section">
        {authToken ? (
          <div className="auth-status connected">
            <span className="status-dot" />
            <span>Connected</span>
            <button className="logout-btn" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleLogin}>
            <h3>Sign In</h3>
            {loginError && <div className="login-error">{loginError}</div>}
            <div className="form-row">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="login-btn" type="submit" disabled={loginLoading}>
              {loginLoading ? 'Signing in…' : 'Login'}
            </button>
          </form>
        )}
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <h3>Amazon Relay Loads</h3>
          <div className="stat-count">{relayCount !== null ? relayCount : '—'}</div>
          {lastUpdated && <div className="stat-updated">Last updated: {lastUpdated}</div>}
        </div>
      </div>

      <div className="settings-section">
        <h3>Settings</h3>
        <div className="setting-row">
          <label htmlFor="push-interval">Push interval (seconds)</label>
          <input
            id="push-interval"
            type="number"
            min={10}
            max={300}
            value={pushInterval}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val >= 10 && val <= 300) {
                setPushInterval(val);
                chrome.storage.local.set({ pushIntervalSeconds: val });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

const container = document.createElement('div');
document.body.appendChild(container);

const root = createRoot(container);
root.render(<Popup />);

export default Popup;
