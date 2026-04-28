import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';
import {
  clearApiKey,
  getApiKey,
  maskKey,
  setApiKey,
} from './apiKeyStorage';
import { isFailure, verifyApiKey } from './verifyApiKey';

interface LastErrorRecord {
  message: string;
  timestamp: number;
}

const isLastErrorRecord = (value: unknown): value is LastErrorRecord =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { message?: unknown }).message === 'string' &&
  typeof (value as { timestamp?: unknown }).timestamp === 'number';

const Popup = () => {
  const [relayCount, setRelayCount] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [orgName, setOrgName] = useState<string | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [pushInterval, setPushInterval] = useState(60);
  const [failedCount, setFailedCount] = useState(0);
  const [lastError, setLastError] = useState<LastErrorRecord | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  const runVerification = async (key: string): Promise<void> => {
    setPingLoading(true);
    setPingError(null);
    const result = await verifyApiKey(key);
    if (isFailure(result)) {
      setOrgName(null);
      setPingError(result.error);
    } else {
      setOrgName(result.organizationName);
    }
    setPingLoading(false);
  };

  useEffect(() => {
    const initialise = async (): Promise<void> => {
      const result = await chrome.storage.local.get([
        'relayLoadCount',
        'relayLastUpdated',
        'pushIntervalSeconds',
        'failedCount',
        'lastError',
      ]);
      if (result.relayLoadCount !== undefined) {
        setRelayCount(result.relayLoadCount);
      }
      if (result.relayLastUpdated) {
        setLastUpdated(new Date(result.relayLastUpdated).toLocaleTimeString());
      }
      if (result.pushIntervalSeconds !== undefined) {
        setPushInterval(result.pushIntervalSeconds);
      }
      if (typeof result.failedCount === 'number') {
        setFailedCount(result.failedCount);
      }
      if (isLastErrorRecord(result.lastError)) {
        setLastError(result.lastError);
      }

      const existingKey = await getApiKey();
      if (existingKey !== null) {
        setStoredKey(existingKey);
        await runVerification(existingKey);
      }
    };

    initialise();

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
      if (changes.pushIntervalSeconds) {
        setPushInterval(changes.pushIntervalSeconds.newValue);
      }
      if (changes.apiKey) {
        const next = changes.apiKey.newValue;
        setStoredKey(typeof next === 'string' ? next : null);
        if (typeof next !== 'string') {
          setOrgName(null);
        }
      }
      if (changes.failedCount) {
        const next = changes.failedCount.newValue;
        setFailedCount(typeof next === 'number' ? next : 0);
      }
      if (changes.lastError) {
        const next = changes.lastError.newValue;
        setLastError(isLastErrorRecord(next) ? next : null);
      }
    };

    chrome.storage.onChanged.addListener(handleChanges);
    return () => chrome.storage.onChanged.removeListener(handleChanges);
  }, []);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (trimmed.length === 0) return;
    await setApiKey(trimmed);
    setStoredKey(trimmed);
    setKeyInput('');
    await runVerification(trimmed);
  };

  const handleDisconnect = async () => {
    await clearApiKey();
    setStoredKey(null);
    setOrgName(null);
    setPingError(null);
  };

  const handleRetry = async () => {
    setRetryLoading(true);
    try {
      await chrome.runtime.sendMessage({ type: 'RETRY_LAST_PAYLOAD' });
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <div className="dat-filter-config">
      <div className="dat-filter-config-header">
        <h1>Hustle Extension</h1>
      </div>

      <div className="auth-section">
        {storedKey !== null ? (
          <div className="auth-status connected">
            <span className="status-dot" />
            {pingLoading && <span>Verifying…</span>}
            {!pingLoading && orgName !== null && (
              <span>Connected to: {orgName}</span>
            )}
            {!pingLoading && pingError !== null && (
              <span className="ping-error">{pingError}</span>
            )}
            <div className="key-meta">{maskKey(storedKey)}</div>
            <button className="logout-btn" onClick={handleDisconnect} type="button">
              Disconnect
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSaveKey}>
            <h3>FleetCommand API Key</h3>
            {pingError !== null && <div className="login-error">{pingError}</div>}
            <div className="form-row">
              <label htmlFor="api-key">API Key</label>
              <input
                id="api-key"
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="fc_live_..."
                autoComplete="off"
                required
              />
            </div>
            <button className="login-btn" type="submit" disabled={pingLoading}>
              {pingLoading ? 'Verifying…' : 'Save'}
            </button>
          </form>
        )}
      </div>

      {failedCount > 0 && lastError !== null && (
        <div className="error-section">
          <div className="error-row">
            <span className="error-badge">{failedCount}</span>
            <div className="error-detail">
              <div className="error-time">
                Last error: {new Date(lastError.timestamp).toLocaleTimeString()}
              </div>
              <div className="error-message">{lastError.message}</div>
            </div>
            <button
              className="retry-btn"
              onClick={handleRetry}
              type="button"
              disabled={retryLoading}
            >
              {retryLoading ? 'Retrying…' : 'Retry now'}
            </button>
          </div>
        </div>
      )}

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
