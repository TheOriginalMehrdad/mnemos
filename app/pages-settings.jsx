/* ============================================================
   MNEMOS — Settings + Onboarding
   ============================================================ */
(function () {
  const { useState } = React;
  const Icon = window.Icon;
  const { Button, IconButton, Panel, Badge, Segmented, Switch, ProgressBar, useToast } = window.UI;
  const { useApp } = window.Shell;

  const SETTINGS_TABS = [
    { id: 'profile', label: 'Profile & Languages', icon: 'user' },
    { id: 'schedule', label: 'Review Schedule', icon: 'calendar' },
    { id: 'vault', label: 'Vault Connection', icon: 'folder' },
    { id: 'ai', label: 'AI Preferences', icon: 'ai' },
    { id: 'appearance', label: 'Appearance', icon: 'sun' },
  ];

  function Field({ label, hint, children }) {
    return React.createElement('div', { className: 'field' },
      React.createElement('div', { className: 'field-label' }, label),
      hint && React.createElement('div', { className: 'field-hint' }, hint),
      React.createElement('div', { className: 'field-control' }, children));
  }
  function Row({ title, sub, children }) {
    return React.createElement('div', { className: 'settings-row' },
      React.createElement('div', null,
        React.createElement('div', { className: 'settings-row-title' }, title),
        sub && React.createElement('div', { className: 'settings-row-sub' }, sub)),
      React.createElement('div', null, children));
  }

  function SettingsPage() {
    const app = useApp(); const toast = useToast(); const D = window.MNEMOS_DATA;
    const [tab, setTab] = useState('profile');
    const [goal, setGoal] = useState(D.profile.dailyGoalMin);
    const [newCards, setNewCards] = useState(D.profile.dailyNewCards);
    const [interleave, setInterleave] = useState(true);
    const [notif, setNotif] = useState(true);
    const [vim, setVim] = useState(false);

    return React.createElement('div', { className: 'page page-wide rise' },
      React.createElement('div', { className: 'mb-6' },
        React.createElement('div', { className: 'eyebrow mb-2' }, 'Settings'),
        React.createElement('h1', { className: 'serif', style: { fontSize: 36, margin: 0 } }, 'Settings')),
      React.createElement('div', { className: 'settings-layout' },
        React.createElement('aside', { className: 'settings-nav' },
          SETTINGS_TABS.map(t => React.createElement('button', { key: t.id, className: `settings-nav-item${tab === t.id ? ' is-active' : ''}`, onClick: () => setTab(t.id) },
            React.createElement(Icon, { name: t.icon, size: 17 }), t.label))),

        React.createElement('div', { className: 'settings-content' },
          tab === 'profile' && React.createElement(Panel, null,
            React.createElement('div', { className: 'row gap-4 items-center mb-5' },
              React.createElement('div', { className: 'avatar', style: { width: 64, height: 64, fontSize: 28 } }, D.profile.initials),
              React.createElement('div', null, React.createElement('div', { className: 'serif', style: { fontSize: 24, fontWeight: 600 } }, D.profile.name), React.createElement('div', { className: 'text-tertiary', style: { fontSize: 14 } }, D.profile.email))),
            React.createElement(Field, { label: 'Display name' }, React.createElement('input', { className: 'text-input', defaultValue: D.profile.name })),
            React.createElement('hr', { className: 'divider', style: { margin: 'var(--space-5) 0' } }),
            React.createElement('div', { className: 'eyebrow mb-4' }, 'Languages & levels'),
            React.createElement('div', { className: 'col gap-3' },
              D.languages.map(l => React.createElement('div', { key: l.code, className: 'settings-lang-row' },
                React.createElement('span', { style: { fontSize: 24 } }, l.flag),
                React.createElement('span', { style: { fontWeight: 600, flex: 1 } }, l.name),
                React.createElement(Segmented, { size: 'sm', value: l.cefr, onChange: () => {}, options: ['A1', 'A2', 'B1', 'B2', 'C1'].map(x => ({ value: x, label: x })) })))),
            React.createElement(Button, { variant: 'ghost', size: 'sm', icon: 'plus', style: { marginTop: 'var(--space-3)' } }, 'Add language')),

          tab === 'schedule' && React.createElement(Panel, null,
            React.createElement(Field, { label: 'Daily review goal', hint: 'How long you aim to study each day' },
              React.createElement(Segmented, { value: goal, onChange: setGoal, options: [5, 15, 30, 60].map(n => ({ value: n, label: n + ' min' })) })),
            React.createElement('hr', { className: 'divider', style: { margin: 'var(--space-5) 0' } }),
            React.createElement(Field, { label: 'New cards per day', hint: `Currently introducing ${newCards} new concepts daily` },
              React.createElement('div', { className: 'row gap-4 items-center', style: { maxWidth: 360 } },
                React.createElement('input', { type: 'range', className: 'slider', min: 0, max: 40, value: newCards, onChange: e => setNewCards(+e.target.value) }),
                React.createElement('span', { className: 'serif', style: { fontSize: 22, fontWeight: 700, minWidth: 32 } }, newCards))),
            React.createElement('hr', { className: 'divider', style: { margin: 'var(--space-5) 0' } }),
            React.createElement(Row, { title: 'Interleaving', sub: 'Mix topics within a session for stronger retention' }, React.createElement(Switch, { checked: interleave, onChange: setInterleave })),
            React.createElement(Row, { title: 'Review reminders', sub: 'Daily notification when cards are due' }, React.createElement(Switch, { checked: notif, onChange: setNotif })),
            React.createElement('div', { className: 'mt-5' }, React.createElement(Button, { variant: 'primary', onClick: () => {
              if (window.API && window.API.updateProfile) {
                window.API.updateProfile({ dailyGoalMin: goal, dailyNewCards: Math.max(1, newCards), interleaving: interleave })
                  .then(() => { toast('Schedule saved', { icon: 'check', tone: 'success' }); if (window.refreshAppData) window.refreshAppData(); })
                  .catch(() => toast('Could not save schedule', { tone: 'danger' }));
              } else { toast('Schedule saved', { icon: 'check', tone: 'success' }); }
            } }, 'Save changes'))),

          tab === 'vault' && React.createElement(Panel, null,
            React.createElement('div', { className: 'vault-status' },
              React.createElement('span', { className: 'vault-dot' }),
              React.createElement('div', { className: 'grow' },
                React.createElement('div', { style: { fontWeight: 600 } }, 'Vault connected'),
                React.createElement('div', { className: 'mono', style: { fontSize: 13, color: 'var(--text-tertiary)' } }, D.profile.vaultPath)),
              React.createElement(Badge, { tone: 'success', dot: true }, 'Synced')),
            React.createElement('div', { className: 'vault-stats mt-4' },
              [['Notes indexed', D.stats.totalNotes], ['Domains', D.stats.domainsCount], ['Topics', D.stats.topicsCount], ['Last sync', 'just now']].map(([l, v], i) =>
                React.createElement('div', { key: i, className: 'vault-stat' }, React.createElement('div', { className: 'serif', style: { fontSize: 22, fontWeight: 700 } }, v), React.createElement('div', { className: 'stat-cap mt-1' }, l)))),
            React.createElement('hr', { className: 'divider', style: { margin: 'var(--space-5) 0' } }),
            React.createElement('div', { className: 'eyebrow mb-3' }, 'Import sources'),
            React.createElement('div', { className: 'col gap-2' },
              [['Local Obsidian vault', 'folder', true], ['Claude conversation export', 'ai', false], ['Notion (Markdown)', 'book', false], ['Readwise highlights', 'bookmark', false], ['GitHub repository', 'link', false]].map(([l, ic, on], i) =>
                React.createElement('div', { key: i, className: 'import-source' }, React.createElement(Icon, { name: ic, size: 17, style: { color: 'var(--text-secondary)' } }), React.createElement('span', { className: 'grow' }, l), on ? React.createElement(Badge, { tone: 'success' }, 'Connected') : React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => toast('Connect flow opened', { icon: ic }) }, 'Connect'))) ),
            React.createElement('div', { className: 'row gap-2 mt-5' }, React.createElement(Button, { variant: 'secondary', icon: 'refresh', onClick: () => {
              if (window.API && window.API.vaultSync) { window.API.vaultSync().then(() => toast('Re-indexing vault…', { icon: 'refresh' })).catch(() => toast('Could not start re-index', { tone: 'danger' })); }
              else { toast('Re-indexing vault…', { icon: 'refresh' }); }
            } }, 'Re-index'))),

          tab === 'ai' && React.createElement(Panel, null,
            React.createElement(Field, { label: 'Embedding & inference provider', hint: 'Local keeps everything private; cloud is faster' },
              React.createElement(Segmented, { value: 'local', onChange: () => {}, options: [{ value: 'local', label: 'Ollama (local)' }, { value: 'cloud', label: 'OpenAI (cloud)' }] })),
            React.createElement(Field, { label: 'Embedding model' }, React.createElement('input', { className: 'text-input mono', defaultValue: D.profile.embeddingModel })),
            React.createElement('hr', { className: 'divider', style: { margin: 'var(--space-5) 0' } }),
            React.createElement(Row, { title: 'Auto-generate card suggestions', sub: 'Propose cards after you finish reading a note' }, React.createElement(Switch, { checked: true, onChange: () => {} })),
            React.createElement(Row, { title: 'Daily cross-topic insights', sub: 'Surface surprising connections between domains' }, React.createElement(Switch, { checked: true, onChange: () => {} })),
            React.createElement(Row, { title: 'Inline AI suggestions in editor', sub: 'Trigger with Alt+Space while writing' }, React.createElement(Switch, { checked: false, onChange: () => {} })),
            React.createElement('div', { className: 'ai-transparency mt-5' },
              React.createElement(Icon, { name: 'info', size: 16, style: { color: 'var(--accent)', flexShrink: 0 } }),
              React.createElement('p', null, 'MNEMOS explains every AI decision. Schedule choices, card sources, and search ranking are always inspectable — no black boxes.'))),

          tab === 'appearance' && React.createElement(Panel, null,
            React.createElement(Field, { label: 'Theme', hint: 'The warm palette adapts to light and dark' },
              React.createElement(Segmented, { value: app.theme, onChange: (v) => app.setTheme(v), options: [{ value: 'light', label: 'Day', icon: 'sun' }, { value: 'dark', label: 'Night', icon: 'moon' }] })),
            React.createElement('div', { className: 'theme-preview mt-4' },
              ['light', 'dark'].map(th => React.createElement('button', { key: th, className: `theme-card${app.theme === th ? ' is-active' : ''}`, 'data-theme': th, onClick: () => app.setTheme(th) },
                React.createElement('div', { className: 'theme-card-bar' }), React.createElement('div', { className: 'theme-card-body' }, React.createElement('div', { className: 'theme-card-line' }), React.createElement('div', { className: 'theme-card-line short' }), React.createElement('div', { className: 'theme-card-accent' })), React.createElement('span', { className: 'theme-card-name' }, th === 'light' ? 'Day' : 'Night')))),
            React.createElement('hr', { className: 'divider', style: { margin: 'var(--space-5) 0' } }),
            React.createElement(Row, { title: 'Vim keybindings in editor', sub: 'For terminal-first workflows' }, React.createElement(Switch, { checked: vim, onChange: setVim })),
            React.createElement(Row, { title: 'Reduce motion', sub: 'Minimize animations and transitions' }, React.createElement(Switch, { checked: false, onChange: () => {} })),
            React.createElement('div', { className: 'mt-5' }, React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => app.startOnboarding() }, 'Replay onboarding tour')))) ));
  }

  /* ---------------- Onboarding ---------------- */
  function Onboarding() {
    const app = useApp(); const D = window.MNEMOS_DATA;
    const [step, setStep] = useState(0);
    const [vault, setVault] = useState(null);
    const [name, setName] = useState('');
    const [goal, setGoal] = useState(30);
    const [indexed, setIndexed] = useState(0);

    React.useEffect(() => {
      if (step !== 3) return;
      setIndexed(0);
      const iv = setInterval(() => setIndexed(p => { if (p >= 847) { clearInterval(iv); setTimeout(() => setStep(4), 500); return 847; } return p + 31; }), 40);
      return () => clearInterval(iv);
    }, [step]);

    const steps = [
      /* 0 — welcome */
      React.createElement('div', { className: 'onb-welcome', key: 0 },
        React.createElement('div', { className: 'onb-mark' }, 'M'),
        React.createElement('div', { className: 'eyebrow mb-3' }, 'Welcome to Mnemos'),
        React.createElement('h1', { className: 'serif onb-title' }, 'A second brain that teaches itself back to you.'),
        React.createElement('p', { className: 'onb-lede serif' }, 'Capture deeply, retain for life, and surface the connections you didn\u2019t know were there. Built on the science of memory.'),
        React.createElement(Button, { variant: 'primary', size: 'lg', iconRight: 'arrowRight', onClick: () => setStep(1) }, 'Begin')),

      /* 1 — vault */
      React.createElement('div', { className: 'onb-step', key: 1 },
        React.createElement('div', { className: 'eyebrow mb-2' }, 'Step 1 of 4'),
        React.createElement('h2', { className: 'serif onb-h' }, 'Connect your knowledge'),
        React.createElement('p', { className: 'onb-sub' }, 'MNEMOS reads and writes plain Markdown. Your notes are never locked in.'),
        React.createElement('div', { className: 'onb-options' },
          [['Connect Obsidian vault', 'Point to a local folder of .md files', 'folder', 'obsidian'],
           ['Import Markdown files', 'Drag & drop notes to get started', 'upload', 'import'],
           ['Start from scratch', 'An empty vault — build as you go', 'plus', 'empty']].map(([t, d, ic, v]) =>
            React.createElement('button', { key: v, className: `onb-option${vault === v ? ' is-active' : ''}`, onClick: () => setVault(v) },
              React.createElement('div', { className: 'onb-option-icon' }, React.createElement(Icon, { name: ic, size: 20 })),
              React.createElement('div', { style: { textAlign: 'left' } }, React.createElement('div', { style: { fontWeight: 600, fontSize: 15 } }, t), React.createElement('div', { className: 'text-tertiary', style: { fontSize: 13 } }, d)),
              vault === v && React.createElement(Icon, { name: 'check', size: 18, style: { marginLeft: 'auto', color: 'var(--accent)' } }))),
        ),
        React.createElement('div', { className: 'onb-nav' }, React.createElement(Button, { variant: 'ghost', onClick: () => setStep(0) }, 'Back'), React.createElement(Button, { variant: 'primary', iconRight: 'arrowRight', disabled: !vault, onClick: () => setStep(2) }, 'Continue'))),

      /* 2 — profile */
      React.createElement('div', { className: 'onb-step', key: 2 },
        React.createElement('div', { className: 'eyebrow mb-2' }, 'Step 2 of 4'),
        React.createElement('h2', { className: 'serif onb-h' }, 'Tell us about you'),
        React.createElement(Field, { label: 'Your name' }, React.createElement('input', { className: 'text-input', placeholder: 'e.g. Mehrdad', value: name, onChange: e => setName(e.target.value), autoFocus: true })),
        React.createElement('div', { className: 'field' }, React.createElement('div', { className: 'field-label' }, 'Languages you\u2019re learning'),
          React.createElement('div', { className: 'row gap-2 wrap mt-2' }, ['🇩🇪 German A1', '🇬🇧 English B2', '🇪🇸 Spanish A2', '+ Add'].map((l, i) => React.createElement('span', { key: i, className: `concept-pill${i < 2 ? '' : ''}`, style: i < 2 ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : {} }, l)))),
        React.createElement(Field, { label: 'Daily review goal' }, React.createElement(Segmented, { value: goal, onChange: setGoal, options: [5, 15, 30, 60].map(n => ({ value: n, label: n + ' min' })) })),
        React.createElement('div', { className: 'onb-nav' }, React.createElement(Button, { variant: 'ghost', onClick: () => setStep(1) }, 'Back'), React.createElement(Button, { variant: 'primary', iconRight: 'arrowRight', onClick: () => setStep(3) }, 'Continue'))),

      /* 3 — indexing */
      React.createElement('div', { className: 'onb-step onb-center', key: 3 },
        React.createElement('div', { className: 'onb-indexer' }, React.createElement('div', { className: 'genloader' }, React.createElement(Icon, { name: 'layers', size: 26 }))),
        React.createElement('h2', { className: 'serif onb-h', style: { textAlign: 'center' } }, 'Indexing your vault'),
        React.createElement('p', { className: 'onb-sub', style: { textAlign: 'center' } }, 'Indexing ', React.createElement('b', null, indexed), ' notes… found ', React.createElement('b', null, '12'), ' domains, ', React.createElement('b', null, '94'), ' topics'),
        React.createElement('div', { style: { maxWidth: 420, margin: '0 auto', width: '100%' } }, React.createElement(ProgressBar, { value: indexed, max: 847, height: 8 }))),

      /* 4 — first cards */
      React.createElement('div', { className: 'onb-step', key: 4 },
        React.createElement('div', { className: 'eyebrow mb-2' }, 'Step 4 of 4 · You\u2019re ready'),
        React.createElement('h2', { className: 'serif onb-h' }, 'Your first review queue'),
        React.createElement('p', { className: 'onb-sub' }, 'MNEMOS drafted 5 starter cards from your content. Here\u2019s a taste of how review works.'),
        React.createElement('div', { className: 'col gap-2 mt-2' },
          D.cards.slice(0, 4).map(c => React.createElement('div', { key: c.id, className: 'onb-card-preview' },
            React.createElement('span', { className: 'notecard-domain', style: { '--dc': D.domainById(c.domain).color } }, D.domainById(c.domain).name),
            React.createElement('span', { className: 'grow serif', style: { fontSize: 15 } }, c.front.slice(0, 60), c.front.length > 60 ? '…' : ''))),
        ),
        React.createElement('div', { className: 'onb-nav' }, React.createElement(Button, { variant: 'ghost', onClick: () => app.finishOnboarding() }, 'Skip to dashboard'), React.createElement(Button, { variant: 'primary', iconRight: 'arrowRight', onClick: () => { app.finishOnboarding(); app.navigate('review-cards'); } }, 'Start first review'))),
    ];

    return React.createElement('div', { className: 'onb-stage' },
      step > 0 && React.createElement('div', { className: 'onb-progress' }, [1, 2, 3, 4].map(i => React.createElement('span', { key: i, className: `onb-dot${step >= i ? ' on' : ''}` }))),
      React.createElement('div', { className: 'onb-card rise', key: step }, steps[step]));
  }

  window.Pages = window.Pages || {};
  window.Pages.Settings = SettingsPage;
  window.Pages.Onboarding = Onboarding;
})();
