/* ============================================================
   MNEMOS — Home / Today's Dashboard
   ============================================================ */
(function () {
  const { useState } = React;
  const Icon = window.Icon;
  const { Button, Panel, MemoryDot, MemoryBadge, ProgressBar, Tag, Badge } = window.UI;
  const { RetentionGauge } = window.Charts;
  const { useApp } = window.Shell;

  function DotMeter({ value, total }) {
    return React.createElement('div', { className: 'dot-meter' },
      Array.from({ length: total }).map((_, i) =>
        React.createElement('span', { key: i, className: `dot${i < value ? ' on' : ''}` })));
  }

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  function HomePage() {
    const app = useApp();
    const D = window.MNEMOS_DATA;
    const s = D.stats;
    const insight = D.insights[1];
    const dateStr = D.today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return React.createElement('div', { className: 'page rise' },
      /* Masthead */
      React.createElement('div', { className: 'home-masthead' },
        React.createElement('div', null,
          React.createElement('div', { className: 'eyebrow mb-2' }, dateStr),
          React.createElement('h1', { className: 'home-hello serif' }, greeting(), ', ', D.profile.name, '.'),
          React.createElement('p', { className: 'home-sub serif' }, 'Your review session awaits.')),
        React.createElement('div', { className: 'home-masthead-streak' },
          React.createElement(Icon, { name: 'flame', size: 18, fill: true, style: { color: 'var(--accent)' } }),
          React.createElement('span', null, React.createElement('b', null, s.streak), '-day streak'))),

      React.createElement('hr', { className: 'divider mb-6', style: { marginTop: 'var(--space-5)' } }),

      /* Three-column top grid */
      React.createElement('div', { className: 'home-grid-top' },
        /* TODAY */
        React.createElement(Panel, { className: 'home-col' },
          React.createElement('div', { className: 'eyebrow mb-4' }, 'Today'),
          React.createElement('div', { className: 'home-today-list' },
            React.createElement('button', { className: 'home-today-row', onClick: () => app.navigate('review') },
              React.createElement('span', { className: 'home-today-num serif' }, s.cardsDue),
              React.createElement('span', { className: 'home-today-lbl' }, 'cards due'),
              React.createElement(Icon, { name: 'chevronRight', size: 16, style: { color: 'var(--text-tertiary)' } })),
            React.createElement('button', { className: 'home-today-row', onClick: () => app.navigate('review') },
              React.createElement('span', { className: 'home-today-num serif' }, s.newConcepts),
              React.createElement('span', { className: 'home-today-lbl' }, 'new concepts'),
              React.createElement(Icon, { name: 'chevronRight', size: 16, style: { color: 'var(--text-tertiary)' } })),
            React.createElement('div', { className: 'home-today-row no-hover' },
              React.createElement('span', { className: 'home-today-num serif' }, s.studiedYesterday),
              React.createElement('span', { className: 'home-today-lbl' }, 'min studied yesterday'))),
          React.createElement('div', { className: 'home-streak-chip mt-4' },
            React.createElement(Icon, { name: 'flame', size: 16, fill: true }),
            React.createElement('span', null, s.streak, '-day streak · keep it alive'))),

        /* DAILY REVIEW */
        React.createElement(Panel, { className: 'home-col home-col-accent' },
          React.createElement('div', { className: 'eyebrow mb-4' }, 'Daily Review'),
          React.createElement('div', { className: 'row between items-end mb-3' },
            React.createElement(DotMeter, { value: Math.round((s.reviewedToday / s.sessionTarget) * 10), total: 10 }),
            React.createElement('span', { className: 'home-review-pct serif' }, Math.round((s.reviewedToday / s.sessionTarget) * 100), '%')),
          React.createElement('p', { className: 'home-review-meta' }, s.reviewedToday, ' of ', s.sessionTarget, ' cards reviewed'),
          React.createElement(ProgressBar, { value: s.reviewedToday, max: s.sessionTarget, height: 8 }),
          React.createElement(Button, { variant: 'primary', full: true, iconRight: 'arrowRight', onClick: () => app.navigate('review-cards'), style: { marginTop: 'var(--space-5)' } }, 'Continue Session'),
          React.createElement('div', { className: 'home-review-foot mt-4' },
            React.createElement('span', null, '~8 min left'),
            React.createElement('span', { className: 'vdivider', style: { height: 12 } }),
            React.createElement('span', null, 'Interleaved'))),

        /* KNOWLEDGE PULSE */
        React.createElement(Panel, { className: 'home-col' },
          React.createElement('div', { className: 'eyebrow mb-3' }, 'Knowledge Pulse'),
          React.createElement('div', { className: 'home-pulse-gauge' },
            React.createElement(RetentionGauge, { value: s.memoryHealth, size: 132, sub: 'Memory Health' })),
          React.createElement('div', { className: 'home-pulse-stats' },
            React.createElement('div', { className: 'home-pulse-total' },
              React.createElement('span', { className: 'stat-fig stat-md' }, s.totalNotes),
              React.createElement('span', { className: 'stat-cap' }, 'Notes')),
            React.createElement('div', { className: 'home-pulse-breakdown' },
              [['Mastered', s.mastered, s.masteredPct, 'var(--mem-mastered)'],
               ['Review-ready', s.reviewReady, s.reviewReadyPct, 'var(--mem-strong)'],
               ['Draft', s.draft, s.draftPct, 'var(--text-tertiary)']].map(([lbl, n, pct, c], i) =>
                React.createElement('div', { key: i, className: 'home-pulse-row' },
                  React.createElement('span', { className: 'home-pulse-dot', style: { background: c } }),
                  React.createElement('span', { className: 'home-pulse-lbl' }, lbl),
                  React.createElement('span', { className: 'home-pulse-num tnum' }, n),
                  React.createElement('span', { className: 'home-pulse-pct tnum' }, pct, '%')))))),
      ),

      /* DAILY INSIGHT */
      React.createElement('div', { className: 'home-insight rise', style: { animationDelay: '0.05s' } },
        React.createElement('div', { className: 'home-insight-mark' }, React.createElement(Icon, { name: 'sparkle', size: 20, fill: true })),
        React.createElement('div', { className: 'grow' },
          React.createElement('div', { className: 'eyebrow mb-2' }, 'Daily Insight · Cross-domain connection'),
          React.createElement('p', { className: 'home-insight-text serif' },
            React.createElement('b', null, insight.aLabel), ' ', React.createElement('span', { className: 'text-tertiary' }, '(', insight.aDomain, ')'),
            ' and ', React.createElement('b', null, insight.bLabel), ' ', React.createElement('span', { className: 'text-tertiary' }, '(', insight.bDomain, ')'),
            ' share a structural parallel — both describe how systems strengthen the pathways that fire together.'),
          React.createElement(Button, { variant: 'soft', size: 'sm', iconRight: 'arrowRight', onClick: () => app.navigate('graph'), style: { marginTop: 'var(--space-3)' } }, 'Explore connection'))),

      /* Bottom three columns */
      React.createElement('div', { className: 'home-grid-bottom mt-6' },
        React.createElement(Panel, { className: '', style: { padding: 'var(--space-5)' } },
          React.createElement('div', { className: 'eyebrow mb-4' }, 'Recently Studied'),
          React.createElement('div', { className: 'home-list' },
            D.recentlyStudied.map(id => { const n = D.noteById(id); return React.createElement('button', {
              key: id, className: 'home-list-item', onClick: () => app.openNote(id) },
              React.createElement(MemoryDot, { score: n.memory, size: 9 }),
              React.createElement('span', { className: 'home-list-title' }, n.title),
              React.createElement('span', { className: 'home-list-meta' }, D.domainById(n.domain).name)); }))),
        React.createElement(Panel, { style: { padding: 'var(--space-5)' } },
          React.createElement('div', { className: 'eyebrow mb-4' }, 'Coming Up For Review'),
          React.createElement('div', { className: 'home-list' },
            D.comingUp.map(c => { const n = D.noteById(c.id); return React.createElement('button', {
              key: c.id, className: 'home-list-item', onClick: () => app.openNote(c.id) },
              React.createElement(Icon, { name: 'clock', size: 15, style: { color: 'var(--text-tertiary)' } }),
              React.createElement('span', { className: 'home-list-title' }, n ? n.title : c.id),
              React.createElement('span', { className: `home-list-meta${c.when === 'today' ? ' is-today' : ''}` }, c.when)); }))),
        React.createElement(Panel, { style: { padding: 'var(--space-5)' } },
          React.createElement('div', { className: 'eyebrow mb-4' }, 'Reading Now'),
          (() => { const n = D.readingNow && D.noteById(D.readingNow.id);
            if (!n) return React.createElement('p', { className: 'text-tertiary', style: { fontSize: 13, margin: 0 } }, 'Nothing in progress yet.');
            return React.createElement('div', null,
            React.createElement('button', { className: 'home-reading-title serif', onClick: () => app.openNote(n.id) }, n.title),
            React.createElement('p', { className: 'home-reading-ch' }, D.readingNow.chapter),
            React.createElement('div', { className: 'mt-4' },
              React.createElement('div', { className: 'row between mb-2' },
                React.createElement('span', { className: 'stat-cap' }, 'Progress'),
                React.createElement('span', { className: 'home-list-meta tnum' }, D.readingNow.progress, '%')),
              React.createElement(ProgressBar, { value: D.readingNow.progress, height: 6 })),
            React.createElement(Button, { variant: 'ghost', size: 'sm', iconRight: 'arrowRight', onClick: () => app.openNote(n.id), style: { marginTop: 'var(--space-4)', paddingLeft: 0 } }, 'Resume reading')); })())),

      /* Secondary suggestions row */
      React.createElement('div', { className: 'home-grid-suggest mt-6' },
        React.createElement('button', { className: 'home-suggest', onClick: () => app.navigate('learn-language') },
          React.createElement('div', { className: 'home-suggest-icon' }, React.createElement(Icon, { name: 'globe', size: 18 })),
          React.createElement('div', { className: 'grow', style: { textAlign: 'left' } },
            React.createElement('div', { className: 'eyebrow' }, 'Language Moment'),
            React.createElement('div', { className: 'home-suggest-title' }, 'German A1 · Modal verbs drill'),
            React.createElement('div', { className: 'home-suggest-sub' }, '5 fill-in-the-blank exercises ready')),
          React.createElement(Icon, { name: 'chevronRight', size: 18, style: { color: 'var(--text-tertiary)' } })),
        React.createElement('button', { className: 'home-suggest', onClick: () => app.openNote('n-attention') },
          React.createElement('div', { className: 'home-suggest-icon' }, React.createElement(Icon, { name: 'book', size: 18 })),
          React.createElement('div', { className: 'grow', style: { textAlign: 'left' } },
            React.createElement('div', { className: 'eyebrow' }, 'Going Cold'),
            React.createElement('div', { className: 'home-suggest-title' }, 'Attention Mechanisms'),
            React.createElement('div', { className: 'home-suggest-sub' }, 'Not reviewed in 4 days · memory fading')),
          React.createElement(Icon, { name: 'chevronRight', size: 18, style: { color: 'var(--text-tertiary)' } }))));
  }

  window.Pages = window.Pages || {};
  window.Pages.Home = HomePage;
})();
