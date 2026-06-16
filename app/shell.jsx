/* ============================================================
   MNEMOS — App shell: context, sidebar, topbar, mobile, ⌘K
   ============================================================ */
(function () {
  const { useState, useEffect, useRef, useMemo, createContext, useContext, useCallback } = React;
  const Icon = window.Icon;
  const { Avatar, IconButton } = window.UI;

  /* ---------- App context (router + global UI state) ---------- */
  const AppCtx = createContext(null);
  const useApp = () => useContext(AppCtx);

  const NAV = [
    { group: null, items: [
      { id: 'home', label: 'Home', icon: 'home', route: 'home' },
    ]},
    { group: 'Knowledge', items: [
      { id: 'library', label: 'Library', icon: 'library', route: 'library' },
      { id: 'graph', label: 'Graph', icon: 'graph', route: 'graph' },
    ]},
    { group: 'Practice', items: [
      { id: 'review', label: 'Review', icon: 'review', route: 'review', badgeKey: 'due' },
      { id: 'learn', label: 'Learning', icon: 'learning', route: 'learn-progress' },
    ]},
    { group: 'Intelligence', items: [
      { id: 'search', label: 'Semantic Search', icon: 'search', route: 'ai-search' },
      { id: 'chat', label: 'Ask MNEMOS', icon: 'ai', route: 'ai-chat' },
    ]},
    { group: null, items: [
      { id: 'settings', label: 'Settings', icon: 'settings', route: 'settings' },
    ]},
  ];

  // map a route to the active top-level nav id
  function activeNavId(route) {
    if (route.startsWith('learn')) return 'learn';
    if (route.startsWith('review')) return 'review';
    if (route === 'ai-search') return 'search';
    if (route === 'ai-chat') return 'chat';
    if (route === 'library') return 'library';
    if (route === 'graph') return 'graph';
    if (route === 'settings') return 'settings';
    return 'home';
  }

  /* ---------- Sidebar ---------- */
  function Sidebar() {
    const app = useApp();
    const D = window.MNEMOS_DATA;
    const active = activeNavId(app.route);
    return React.createElement('aside', { className: `sidebar${app.sidebarCollapsed ? ' collapsed' : ''}` },
      React.createElement('div', { className: 'sidebar-brand', role: 'button', onClick: () => app.navigate('home'), style: { cursor: 'pointer' } },
        React.createElement('div', { className: 'brand-mark' }, 'M'),
        React.createElement('div', { className: 'brand-word' }, 'Mnemos',
          React.createElement('span', { className: 'sub' }, 'Second Brain'))),
      React.createElement('nav', { className: 'sidebar-nav' },
        NAV.map((grp, gi) => React.createElement('div', { key: gi, className: 'nav-group' },
          grp.group && React.createElement('div', { className: 'nav-group-title eyebrow' }, grp.group),
          grp.items.map(it => {
            const badge = it.badgeKey === 'due' ? D.stats.cardsDue : null;
            return React.createElement('button', {
              key: it.id, className: `nav-item${active === it.id ? ' is-active' : ''}`,
              onClick: () => app.navigate(it.route), title: it.label,
            },
              React.createElement(Icon, { name: it.icon, size: 19 }),
              React.createElement('span', { className: 'nav-label' }, it.label),
              badge ? React.createElement('span', { className: 'nav-badge' }, badge) : null);
          })))),
      React.createElement('div', { className: 'sidebar-foot' },
        React.createElement('button', { className: 'sidebar-foot-user', onClick: () => app.navigate('settings') },
          React.createElement(Avatar, { initials: D.profile.initials, size: 34 }),
          React.createElement('div', { className: 'sidebar-foot-text' },
            React.createElement('div', { className: 'nm' }, D.profile.name),
            React.createElement('div', { className: 'em' }, '7-day streak · 🔥')))));
  }

  /* ---------- Theme toggle ---------- */
  function ThemeToggle() {
    const app = useApp();
    return React.createElement(IconButton, {
      name: app.theme === 'dark' ? 'sun' : 'moon',
      label: app.theme === 'dark' ? 'Light mode' : 'Dark mode',
      onClick: app.toggleTheme,
    });
  }

  /* ---------- Topbar ---------- */
  function Topbar() {
    const app = useApp();
    const D = window.MNEMOS_DATA;
    return React.createElement('header', { className: 'topbar' },
      React.createElement(IconButton, { name: 'menu', label: 'Toggle sidebar', onClick: app.toggleSidebar }),
      React.createElement('button', { className: 'topbar-search', onClick: app.openPalette },
        React.createElement(Icon, { name: 'search', size: 17 }),
        React.createElement('span', { className: 'grow', style: { textAlign: 'left' } }, 'Search notes, cards, actions…'),
        React.createElement('kbd', null, '⌘K')),
      React.createElement('div', { className: 'topbar-spacer' }),
      React.createElement('div', { className: 'topbar-actions' },
        React.createElement(IconButton, { name: 'sparkle', label: 'Ask MNEMOS', onClick: () => app.navigate('ai-chat') }),
        React.createElement(ThemeToggle, null),
        React.createElement('span', { className: 'notif-dot' },
          React.createElement(IconButton, { name: 'bell', label: 'Notifications', onClick: () => app.toast('You have 24 cards due today', { icon: 'cards' }) })),
        React.createElement(Avatar, { initials: D.profile.initials, size: 34 })));
  }

  /* ---------- Mobile chrome ---------- */
  function MobileTopbar() {
    const app = useApp();
    return React.createElement('header', { className: 'mobile-topbar' },
      React.createElement('div', { className: 'brand-mark', style: { width: 30, height: 30, fontSize: 18 } }, 'M'),
      React.createElement('div', { className: 'brand-word', style: { fontSize: 19 } }, 'Mnemos'),
      React.createElement('div', { className: 'grow' }),
      React.createElement(ThemeToggle, null),
      React.createElement(IconButton, { name: 'search', label: 'Search', onClick: app.openPalette }));
  }

  const MOBILE_NAV = [
    { id: 'home', label: 'Home', icon: 'home', route: 'home' },
    { id: 'review', label: 'Review', icon: 'review', route: 'review' },
    { id: 'search', label: 'Search', icon: 'search', route: 'ai-search' },
    { id: 'library', label: 'Library', icon: 'library', route: 'library' },
    { id: 'settings', label: 'You', icon: 'user', route: 'settings' },
  ];
  function MobileNav() {
    const app = useApp();
    const active = activeNavId(app.route);
    return React.createElement('nav', { className: 'mobile-nav' },
      MOBILE_NAV.map(it => React.createElement('button', {
        key: it.id, className: `mobile-nav-item${active === it.id ? ' is-active' : ''}`,
        onClick: () => app.navigate(it.route),
      },
        React.createElement('span', { className: 'mn-icon' }, React.createElement(Icon, { name: it.icon, size: 20 })),
        React.createElement('span', null, it.label))));
  }

  /* ---------- Command palette ---------- */
  function CommandPalette() {
    const app = useApp();
    const D = window.MNEMOS_DATA;
    const [q, setQ] = useState('');
    const [sel, setSel] = useState(0);
    const inputRef = useRef(null);

    const actions = useMemo(() => ([
      { icon: 'home', label: 'Go to Home', kind: 'Navigate', run: () => app.navigate('home') },
      { icon: 'library', label: 'Open Library', kind: 'Navigate', run: () => app.navigate('library') },
      { icon: 'review', label: 'Start Review Session', kind: 'Action', run: () => app.navigate('review-cards') },
      { icon: 'graph', label: 'Open Knowledge Graph', kind: 'Navigate', run: () => app.navigate('graph') },
      { icon: 'ai', label: 'Ask MNEMOS', kind: 'Navigate', run: () => app.navigate('ai-chat') },
      { icon: 'search', label: 'Semantic Search', kind: 'Navigate', run: () => app.navigate('ai-search') },
      { icon: 'learning', label: 'Progress Analytics', kind: 'Navigate', run: () => app.navigate('learn-progress') },
      { icon: 'gap', label: 'Knowledge Gaps', kind: 'Navigate', run: () => app.navigate('learn-gaps') },
      { icon: 'globe', label: 'Language Practice', kind: 'Navigate', run: () => app.navigate('learn-language') },
      { icon: 'settings', label: 'Settings', kind: 'Navigate', run: () => app.navigate('settings') },
      { icon: 'moon', label: 'Toggle dark mode', kind: 'Action', run: app.toggleTheme },
    ]), [app]);

    const results = useMemo(() => {
      const ql = q.trim().toLowerCase();
      const notes = D.notes.map(n => ({ icon: 'book', label: n.title, kind: 'Note', sub: D.domainById(n.domain)?.name, run: () => app.openNote(n.id) }));
      const all = [...actions, ...notes];
      if (!ql) return actions.concat(notes.slice(0, 4));
      return all.filter(a => a.label.toLowerCase().includes(ql) || (a.sub && a.sub.toLowerCase().includes(ql))).slice(0, 10);
    }, [q, actions, D, app]);

    useEffect(() => { if (app.paletteOpen) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [app.paletteOpen]);
    useEffect(() => { setSel(0); }, [q]);

    if (!app.paletteOpen) return null;
    const onKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(results.length - 1, s + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); results[sel]?.run(); app.closePalette(); }
    };
    return React.createElement('div', { className: 'modal-scrim', style: { alignItems: 'flex-start', paddingTop: '12vh' }, onClick: app.closePalette },
      React.createElement('div', { className: 'cmdk', onClick: e => e.stopPropagation() },
        React.createElement('div', { className: 'cmdk-input-row' },
          React.createElement(Icon, { name: 'search', size: 18, style: { color: 'var(--text-tertiary)' } }),
          React.createElement('input', {
            ref: inputRef, className: 'cmdk-input', placeholder: 'Search notes, run a command…',
            value: q, onChange: e => setQ(e.target.value), onKeyDown: onKey,
          }),
          React.createElement('kbd', { className: 'cmdk-esc' }, 'esc')),
        React.createElement('div', { className: 'cmdk-list' },
          results.length === 0 && React.createElement('div', { className: 'cmdk-empty' }, 'No results'),
          results.map((r, i) => React.createElement('button', {
            key: i, className: `cmdk-item${i === sel ? ' is-sel' : ''}`,
            onMouseEnter: () => setSel(i), onClick: () => { r.run(); app.closePalette(); },
          },
            React.createElement(Icon, { name: r.icon, size: 17 }),
            React.createElement('span', { className: 'cmdk-label' }, r.label),
            r.sub && React.createElement('span', { className: 'cmdk-sub' }, r.sub),
            React.createElement('span', { className: 'cmdk-kind' }, r.kind))))));
  }

  window.Shell = { AppCtx, useApp, Sidebar, Topbar, MobileTopbar, MobileNav, CommandPalette, activeNavId };
})();
