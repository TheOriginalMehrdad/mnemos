/* ============================================================
   MNEMOS — App root: router + context + mount
   ============================================================ */
(function () {
  const { useState, useEffect, useCallback, useMemo } = React;
  const { AppCtx, Sidebar, Topbar, MobileTopbar, MobileNav, CommandPalette } = window.Shell;
  const { ToastProvider, useToast } = window.UI;
  const P = window.Pages;

  // routes that render as a full-bleed "session"/standalone stage (no app chrome)
  const FULLBLEED = new Set(['review-cards', 'onboarding']);
  const FULLBLEED_QUIZ = (r) => r === 'review-quiz';

  function parseHash() {
    const h = (location.hash || '#/').replace(/^#/, '');
    const parts = h.split('/').filter(Boolean);
    if (parts.length === 0) return { route: 'home', params: {} };
    const [a, b, c] = parts;
    const map = {
      'home': () => ({ route: 'home' }),
      'library': () => b ? { route: 'note', params: { id: b } } : { route: 'library' },
      'note': () => ({ route: 'note', params: { id: b } }),
      'review': () => b === 'cards' ? { route: 'review-cards' } : b === 'quiz' ? { route: 'review-quiz', params: { id: c } } : { route: 'review' },
      'graph': () => ({ route: 'graph' }),
      'learn': () => ({ route: 'learn-' + (b || 'progress') }),
      'ai': () => ({ route: 'ai-' + (b || 'search') }),
      'settings': () => ({ route: 'settings' }),
      'onboarding': () => ({ route: 'onboarding' }),
    };
    const r = map[a] ? map[a]() : { route: 'home' };
    return { route: r.route, params: r.params || {} };
  }

  function routeToHash(route, params = {}) {
    switch (route) {
      case 'home': return '#/home';
      case 'library': return '#/library';
      case 'note': return '#/note/' + params.id;
      case 'review': return '#/review';
      case 'review-cards': return '#/review/cards';
      case 'review-quiz': return '#/review/quiz/' + (params.id || 'q-patterns');
      case 'graph': return '#/graph';
      case 'learn-progress': return '#/learn/progress';
      case 'learn-plans': return '#/learn/plans';
      case 'learn-gaps': return '#/learn/gaps';
      case 'learn-language': return '#/learn/language';
      case 'learn-skills': return '#/learn/skills';
      case 'ai-search': return '#/ai/search';
      case 'ai-chat': return '#/ai/chat';
      case 'settings': return '#/settings';
      case 'onboarding': return '#/onboarding';
      default: return '#/home';
    }
  }

  function AppInner() {
    const toast = useToast();
    const [nav, setNav] = useState(parseHash());
    const [dataVersion, setDataVersion] = useState(0);
    const [theme, setThemeState] = useState(() => {
      const saved = localStorage.getItem('mnemos-theme');
      if (saved) return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('mnemos-sidebar') === '1');
    const [paletteOpen, setPaletteOpen] = useState(false);

    // apply theme
    useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('mnemos-theme', theme); }, [theme]);
    useEffect(() => { localStorage.setItem('mnemos-sidebar', sidebarCollapsed ? '1' : '0'); }, [sidebarCollapsed]);

    // hash routing
    useEffect(() => {
      const onHash = () => { setNav(parseHash()); document.querySelector('.page-scroll')?.scrollTo(0, 0); };
      window.addEventListener('hashchange', onHash);
      if (!location.hash) location.hash = '#/home';
      return () => window.removeEventListener('hashchange', onHash);
    }, []);

    // ⌘K
    useEffect(() => {
      const onKey = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
        if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); setPaletteOpen(o => !o); }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    // live data refresh (exposed for action handlers) + realtime socket
    useEffect(() => {
      const refresh = async () => {
        if (!window.loadAppData) return;
        try { await window.loadAppData(); } catch (_) { /* keep current data */ }
        setDataVersion((v) => v + 1);
      };
      window.refreshAppData = refresh;

      let socket = null;
      if (window.io && window.API) {
        try {
          socket = window.io(window.API.BASE + '/eruditio', { transports: ['websocket', 'polling'] });
          socket.on('cards:generated', (p) => { toast(((p && p.cardCount) || 0) + ' flashcards generated', { icon: 'sparkle', tone: 'success' }); refresh(); });
          socket.on('vault:changed', () => { refresh(); });
          socket.on('review:resurfaced', (p) => { if (p && p.count) toast(p.count + ' cards resurfaced for review', { icon: 'refresh' }); });
        } catch (_) { /* socket optional */ }
      }
      return () => { window.refreshAppData = null; if (socket) { try { socket.close(); } catch (_) {} } };
    }, [toast]);

    const navigate = useCallback((route, params = {}) => { location.hash = routeToHash(route, params); }, []);
    const openNote = useCallback((id) => { location.hash = routeToHash('note', { id }); }, []);

    const ctx = useMemo(() => ({
      route: nav.route, params: nav.params, navigate, openNote, toast,
      theme, setTheme: setThemeState, toggleTheme: () => setThemeState(t => t === 'dark' ? 'light' : 'dark'),
      sidebarCollapsed, toggleSidebar: () => setSidebarCollapsed(c => !c),
      paletteOpen, openPalette: () => setPaletteOpen(true), closePalette: () => setPaletteOpen(false),
      startOnboarding: () => navigate('onboarding'),
      finishOnboarding: () => navigate('home'),
    }), [nav, navigate, openNote, toast, theme, sidebarCollapsed, paletteOpen]);

    const renderPage = () => {
      const { route, params } = nav;
      switch (route) {
        case 'home': return React.createElement(P.Home);
        case 'library': return React.createElement(P.Library);
        case 'note': return React.createElement(P.Note, { noteId: params.id });
        case 'review': return React.createElement(P.ReviewHub);
        case 'review-cards': return React.createElement(P.Flashcards);
        case 'review-quiz': return React.createElement(P.Quiz, { quizId: params.id });
        case 'graph': return React.createElement(P.Graph);
        case 'learn-progress': case 'learn-plans': case 'learn-gaps': case 'learn-language': case 'learn-skills':
          return React.createElement(P.Learning, { route });
        case 'ai-search': return React.createElement(P.Search);
        case 'ai-chat': return React.createElement(P.Chat);
        case 'settings': return React.createElement(P.Settings);
        case 'onboarding': return React.createElement(P.Onboarding);
        default: return React.createElement(P.Home);
      }
    };

    const isFull = FULLBLEED.has(nav.route) || FULLBLEED_QUIZ(nav.route);
    const isGraph = nav.route === 'graph';
    const isChat = nav.route === 'ai-chat';

    return React.createElement(AppCtx.Provider, { value: ctx },
      window.__ERUDITIO_OFFLINE && React.createElement('div', {
        style: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, padding: '7px 14px', textAlign: 'center', fontSize: 13, background: '#5a3a2a', color: '#f0d9c8' },
      }, 'Offline — showing sample data. Start the API and reload.'),
      React.createElement('span', { 'data-v': dataVersion, style: { display: 'none' } }),
      isFull
        ? React.createElement('div', { className: 'fullbleed-stage' }, renderPage())
        : React.createElement('div', { className: 'app-shell' },
            React.createElement(Sidebar),
            React.createElement('div', { className: 'main-col' },
              React.createElement(Topbar),
              React.createElement(MobileTopbar),
              React.createElement('div', { className: `page-scroll${isGraph || isChat ? ' page-scroll-flush' : ''}` }, renderPage()),
              React.createElement(MobileNav))),
      React.createElement(CommandPalette));
  }

  function App() { return React.createElement(ToastProvider, null, React.createElement(AppInner)); }

  function loadingEl(msg) {
    return React.createElement('div', {
      style: { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#1A1612', color: '#9a8f80', fontFamily: 'Georgia, serif' },
    },
      React.createElement('div', { style: { textAlign: 'center' } },
        React.createElement('div', { style: { fontSize: 34, color: '#C8924E', letterSpacing: '.05em' } }, 'ERUDITIO'),
        React.createElement('div', { style: { marginTop: 10, fontSize: 14 } }, msg || 'Loading…')));
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));

  async function boot() {
    // No API client present → render straight from sample data (static demo mode).
    if (!window.API || !window.loadAppData) { root.render(React.createElement(App)); return; }

    root.render(loadingEl('Loading your vault…'));
    try {
      await window.loadAppData();
      window.__ERUDITIO_OFFLINE = false;
    } catch (e) {
      window.__ERUDITIO_OFFLINE = true; // API unreachable → fall back to sample data
    }
    root.render(React.createElement(App));
  }

  boot();
})();
