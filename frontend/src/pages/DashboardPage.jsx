import { useEffect, useMemo, useState } from 'react';
import { requestJson } from '../services/loggingApi';

const DEFAULT_LIMIT = 10;
const sortOptions = [
  { value: 'recent', label: 'Most recent' },
  { value: 'count', label: 'Highest count' },
];

const emptyAppForm = { name: '' };

export default function DashboardPage() {
  const [token, setToken] = useState(() => localStorage.getItem('authToken') ?? '');
  const [sessionDeveloper, setSessionDeveloper] = useState(() => {
    const raw = localStorage.getItem('sessionDeveloper');
    return raw ? JSON.parse(raw) : null;
  });
  const [accountApiKey, setAccountApiKey] = useState(() => localStorage.getItem('accountApiKey') ?? '');
  const [sessionSource, setSessionSource] = useState(() => localStorage.getItem('sessionSource') ?? '');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [apps, setApps] = useState([]);
  const [selectedAppName, setSelectedAppName] = useState('');
  const [currentApplication, setCurrentApplication] = useState(null);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [logRefreshToken, setLogRefreshToken] = useState(0);
  const [sort, setSort] = useState('recent');
  const [levelFilter, setLevelFilter] = useState('');
  const [messageQuery, setMessageQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appActionLoading, setAppActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('dashboard');
  const [appForm, setAppForm] = useState(emptyAppForm);

  const isSignedIn = Boolean(token);
  const sessionLabel = sessionDeveloper
    ? `${sessionDeveloper.username} · ${sessionDeveloper.email}`
    : isSignedIn
      ? 'Token loaded, developer profile unavailable'
      : 'Not signed in';

  const currentAppName = useMemo(() => selectedAppName || apps[0]?.name || '', [selectedAppName, apps]);
  const sortLabel = sortOptions.find((option) => option.value === sort)?.label ?? 'Most recent';

  useEffect(() => {
    localStorage.setItem('authToken', token);
  }, [token]);

  useEffect(() => {
    localStorage.setItem('sessionSource', sessionSource);
  }, [sessionSource]);

  useEffect(() => {
    if (sessionDeveloper) {
      localStorage.setItem('sessionDeveloper', JSON.stringify(sessionDeveloper));
    } else {
      localStorage.removeItem('sessionDeveloper');
    }
  }, [sessionDeveloper]);

  useEffect(() => {
    if (accountApiKey) {
      localStorage.setItem('accountApiKey', accountApiKey);
    } else {
      localStorage.removeItem('accountApiKey');
    }
  }, [accountApiKey]);

  useEffect(() => {
    if (!token) {
      setSessionDeveloper(null);
      setAccountApiKey('');
      setSessionSource('');
      setApps([]);
      setSelectedAppName('');
      setCurrentApplication(null);
      setLogs([]);
      setTotalPages(1);
      setPage(1);
      setView('dashboard');
      setError('');
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function loadApplications() {
      try {
        setAppsLoading(true);
        setError('');
        const data = await requestJson('/applications', token);
        if (cancelled) return;
        setApps(data);
        setSelectedAppName((previous) => previous || data[0]?.name || '');
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setAppsLoading(false);
      }
    }

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, [token, appActionLoading]);

  useEffect(() => {
    if (!token || view !== 'application' || !currentAppName) return;

    let cancelled = false;

    async function loadApplicationDetails() {
      try {
        setLoading(true);
        setError('');
        const [applicationData, logsData] = await Promise.all([
          requestJson(`/applications/${encodeURIComponent(currentAppName)}`, token),
          requestJson(
            `/applications/${encodeURIComponent(currentAppName)}/logs?page=${page}&limit=${DEFAULT_LIMIT}&sort=${sort}${levelFilter ? `&level=${encodeURIComponent(levelFilter)}` : ''}${messageQuery ? `&q=${encodeURIComponent(messageQuery)}` : ''}`,
            token
          ),
        ]);

        if (cancelled) return;
        setCurrentApplication(applicationData);
        setLogs(logsData.data ?? []);
        setTotalPages(logsData.pages ?? 1);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadApplicationDetails();

    return () => {
      cancelled = true;
    };
  }, [token, view, currentAppName, page, sort, levelFilter, messageQuery, logRefreshToken]);

  const persistSession = ({ token: nextToken, developer, apiKey, source }) => {
    setToken(nextToken);
    setSessionDeveloper(developer ?? null);
    setAccountApiKey(apiKey ?? '');
    setSessionSource(source);
    setView('dashboard');
    setPage(1);
  };

  const handleBackendLogin = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');
      const data = await requestJson('/users/login', null, {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      persistSession({ token: data.token ?? '', developer: data.developer, apiKey: data.apiKey, source: 'login' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackendRegister = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');
      const data = await requestJson('/users/register', null, {
        method: 'POST',
        body: JSON.stringify({
          username: registerUsername,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      persistSession({ token: data.token ?? '', developer: data.developer, apiKey: data.apiKey, source: 'registration' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await requestJson('/users/logout', token, { method: 'POST' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setToken('');
      setSessionDeveloper(null);
      setAccountApiKey('');
      setSessionSource('');
      setLoginEmail('');
      setLoginPassword('');
      setRegisterUsername('');
      setRegisterEmail('');
      setRegisterPassword('');
      setSelectedAppName('');
      setCurrentApplication(null);
      setApps([]);
      setLogs([]);
      setPage(1);
      setTotalPages(1);
      setView('dashboard');
      setAppForm(emptyAppForm);
    }
  };

  const handleCreateApplication = async (event) => {
    event.preventDefault();

    const trimmedName = appForm.name.trim().toLowerCase();
    if (!trimmedName) {
      setError('Application name is required');
      return;
    }

    try {
      setAppActionLoading(true);
      setError('');
      await requestJson('/applications', token, {
        method: 'POST',
        body: JSON.stringify({ name: trimmedName }),
      });
      setAppForm(emptyAppForm);
      const data = await requestJson('/applications', token);
      setApps(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAppActionLoading(false);
    }
  };

  const handleDeleteApplication = async (appName) => {
    const confirmDelete = window.confirm(`Delete application \"${appName}\" and all its logs?`);
    if (!confirmDelete) return;

    try {
      setAppActionLoading(true);
      setError('');
      await requestJson(`/applications/${encodeURIComponent(appName)}`, token, { method: 'DELETE' });
      const data = await requestJson('/applications', token);
      setApps(data);

      if (selectedAppName === appName) {
        setSelectedAppName(data[0]?.name || '');
        setCurrentApplication(null);
        setLogs([]);
        setView('dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAppActionLoading(false);
    }
  };

  const handleOpenApplication = (appName) => {
    setSelectedAppName(appName);
    setCurrentApplication(null);
    setPage(1);
    setView('application');
  };

  const handleBackToApplications = () => {
    setView('dashboard');
    setPage(1);
    setLevelFilter('');
    setMessageQuery('');
  };

  const handleRefreshApplicationLogs = () => {
    setLogRefreshToken((current) => current + 1);
  };

  const copyApiKey = async () => {
    if (!accountApiKey) return;
    await navigator.clipboard.writeText(accountApiKey);
  };

  return (
    <div className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Developer Dashboard</p>
          <h1>Log visibility built for operations teams.</h1>
          <p className="hero-copy">
            Manage applications, inspect logs, and keep every developer session visible in one console.
          </p>

          <div className={`session-banner ${isSignedIn ? 'session-banner-active' : ''}`} aria-live="polite">
            <div className="session-banner-row">
              <div>
                <span className="session-kicker">Current session</span>
                <strong>{isSignedIn ? 'Signed in' : 'Signed out'}</strong>
              </div>
              <button type="button" className="secondary session-logout" onClick={handleLogout} disabled={!isSignedIn}>
                Logout
              </button>
            </div>

            <div className="session-meta">
              <span>{sessionLabel}</span>
              {sessionSource ? <span className="session-source">Source: {sessionSource}</span> : null}
              <span className="session-api-key-label">Account API key</span>
              <div className="api-key-row">
                <code className="api-key-chip">{accountApiKey || 'Not available until login/register'}</code>
                <button type="button" className="secondary" onClick={copyApiKey} disabled={!accountApiKey}>
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-stack">
          <form className="token-card" onSubmit={handleBackendRegister}>
            <label htmlFor="registerUsername">Create developer account</label>
            <input id="registerUsername" name="registerUsername" type="text" placeholder="Username" value={registerUsername} onChange={(event) => setRegisterUsername(event.target.value)} />
            <input id="registerEmail" name="registerEmail" type="email" placeholder="Email address" value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} />
            <input id="registerPassword" name="registerPassword" type="password" placeholder="Password" value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} />
            <button type="submit" disabled={loading || appActionLoading}>Register and sign in</button>
            <small>Uses POST /api/users/register and stores the returned JWT and API key immediately.</small>
          </form>

          <form className="token-card" onSubmit={handleBackendLogin}>
            <label htmlFor="loginEmail">Login with backend</label>
            <input id="loginEmail" name="loginEmail" type="email" placeholder="Email address" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
            <input id="loginPassword" name="loginPassword" type="password" placeholder="Password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
            <button type="submit" disabled={loading || appActionLoading}>Sign in and load dashboard</button>
            <small>Uses POST /api/users/login and stores the JWT in this browser session.</small>
          </form>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      {view === 'application' && currentAppName ? (
        <section className="panel">
          <div className="panel-header panel-header-stack">
            <div>
              <button type="button" className="secondary back-button" onClick={handleBackToApplications}>
                Back to applications
              </button>
              <h2>{currentAppName}</h2>
              <p>Application details and log stream.</p>
            </div>

            <div className="controls">
              <button className="secondary" type="button" onClick={handleRefreshApplicationLogs} disabled={loading}>
                Refresh logs
              </button>
              <button className="secondary danger" type="button" onClick={() => handleDeleteApplication(currentAppName)} disabled={appActionLoading}>
                Delete application
              </button>
            </div>
          </div>

          <div className="details-grid">
            <div className="details-card">
              <span className="details-label">Name</span>
              <strong>{currentApplication?.name || currentAppName}</strong>
            </div>
            <div className="details-card">
              <span className="details-label">Created at</span>
              <strong>{currentApplication?.createdAt ? new Date(currentApplication.createdAt).toLocaleString() : 'Loading...'}</strong>
            </div>
            <div className="details-card">
              <span className="details-label">Total logs on page</span>
              <strong>{logs.length}</strong>
            </div>
          </div>

          <div className="filters-bar">
            <label>
              Level filter
              <select value={levelFilter} onChange={(event) => { setLevelFilter(event.target.value); setPage(1); }}>
                <option value="">All levels</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </label>

            <label>
              Message search
              <input
                type="search"
                placeholder="Search message text"
                value={messageQuery}
                onChange={(event) => {
                  setMessageQuery(event.target.value);
                  setPage(1);
                }}
              />
            </label>

            <button className="secondary" type="button" onClick={() => { setSort((current) => (current === 'recent' ? 'count' : 'recent')); setPage(1); }}>
              Sort: {sortLabel}
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Message</th>
                  <th>Level</th>
                  <th>Count</th>
                  <th>First occurrence</th>
                  <th>Last occurrence</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty-state">Loading logs...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">No logs found for this view.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td className="message-cell">{log.message}</td>
                      <td><span className={`pill pill-${log.level.toLowerCase()}`}>{log.level}</span></td>
                      <td>{log.count}</td>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{new Date(log.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button type="button" className="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>
              Previous
            </button>
            <span>
              Page <strong>{page}</strong> of <strong>{Math.max(1, totalPages)}</strong>
            </span>
            <button type="button" className="secondary" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || loading}>
              Next
            </button>
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="panel-header panel-header-stack">
            <div>
              <h2>Applications</h2>
              <p>View, create, open, and delete your applications.</p>
            </div>

            <form className="create-app-form" onSubmit={handleCreateApplication}>
              <input
                type="text"
                placeholder="Application name"
                value={appForm.name}
                onChange={(event) => setAppForm({ name: event.target.value })}
              />
              <button type="submit" disabled={!isSignedIn || appActionLoading}>Create application</button>
            </form>
          </div>

          <div className="app-grid">
            {appsLoading ? (
              <div className="empty-state app-empty">Loading applications...</div>
            ) : apps.length === 0 ? (
              <div className="empty-state app-empty">No applications yet. Create one to get started.</div>
            ) : (
              apps.map((app) => (
                <article key={app._id} className="app-card">
                  <button type="button" className="app-card-main" onClick={() => handleOpenApplication(app.name)}>
                    <span className="details-label">Application</span>
                    <strong>{app.name}</strong>
                    <span>Created {new Date(app.createdAt).toLocaleString()}</span>
                  </button>
                  <div className="app-card-actions">
                    <button type="button" className="secondary" onClick={() => handleOpenApplication(app.name)}>
                      Open
                    </button>
                    <button type="button" className="secondary danger" onClick={() => handleDeleteApplication(app.name)} disabled={appActionLoading}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
