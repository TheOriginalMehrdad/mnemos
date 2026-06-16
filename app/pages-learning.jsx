/* ============================================================
   MNEMOS — Learning: Progress, Plans, Gaps, Language, Skills
   ============================================================ */
(function () {
  const { useState } = React;
  const Icon = window.Icon;
  const { Button, IconButton, Panel, MemoryDot, MemoryBadge, Badge, Segmented, ProgressBar,
          Tag, EmptyState, useToast } = window.UI;
  const { RetentionGauge, LineChart, BarChart, HBars, SkillRadar, StreakCalendar } = window.Charts;
  const { useApp } = window.Shell;

  const TABS = [
    { id: 'learn-progress', label: 'Progress', icon: 'gauge' },
    { id: 'learn-plans', label: 'Learning Plans', icon: 'target' },
    { id: 'learn-gaps', label: 'Knowledge Gaps', icon: 'gap' },
    { id: 'learn-language', label: 'Language', icon: 'globe' },
    { id: 'learn-skills', label: 'Skill Tracker', icon: 'layers' },
  ];

  function LearnShell({ route, children }) {
    const app = useApp();
    return React.createElement('div', { className: 'page page-wide rise' },
      React.createElement('div', { className: 'mb-6' },
        React.createElement('div', { className: 'eyebrow mb-2' }, 'Learning'),
        React.createElement('h1', { className: 'serif', style: { fontSize: 36, margin: 0 } }, TABS.find(t => t.id === route)?.label || 'Learning')),
      React.createElement('div', { className: 'learn-tabs hide-scrollbar' },
        TABS.map(t => React.createElement('button', { key: t.id, className: `learn-tab${route === t.id ? ' is-active' : ''}`, onClick: () => app.navigate(t.id) },
          React.createElement(Icon, { name: t.icon, size: 16 }), t.label))),
      children);
  }

  /* ---------------- Progress Analytics ---------------- */
  function ProgressPage() {
    const D = window.MNEMOS_DATA; const s = D.stats;
    return React.createElement(React.Fragment, null,
      /* Retention overview */
      React.createElement('div', { className: 'prog-overview' },
        React.createElement(Panel, { className: 'prog-gauge-card' },
          React.createElement('div', { className: 'eyebrow mb-3' }, 'Overall Memory Health'),
          React.createElement(RetentionGauge, { value: s.memoryHealth, size: 168 }),
          React.createElement('div', { className: 'row gap-4 center mt-4' },
            React.createElement('div', { className: 'col center' }, React.createElement('span', { className: 'serif', style: { fontSize: 22, fontWeight: 700 } }, s.accuracyRate, '%'), React.createElement('span', { className: 'stat-cap mt-1' }, 'Accuracy')),
            React.createElement('span', { className: 'vdivider', style: { height: 36 } }),
            React.createElement('div', { className: 'col center' }, React.createElement('span', { className: 'serif', style: { fontSize: 22, fontWeight: 700 } }, '74%'), React.createElement('span', { className: 'stat-cap mt-1' }, '7-day retention')))),
        React.createElement(Panel, { className: 'grow' },
          React.createElement('div', { className: 'row between items-center mb-4' },
            React.createElement('div', { className: 'eyebrow' }, 'Retention rate · last 90 days'),
            React.createElement(Badge, { tone: 'success', dot: true }, '+8% this quarter')),
          React.createElement(LineChart, { data: s.retentionTrend, width: 640, height: 200, yKey: 'value', suffix: '%' }))),

      /* Cards + study time */
      React.createElement('div', { className: 'prog-two mt-5' },
        React.createElement(Panel, null,
          React.createElement('div', { className: 'eyebrow mb-4' }, 'Cards reviewed · last 30 days'),
          React.createElement(BarChart, { data: s.reviewsPerDay, width: 480, height: 170, yKey: 'count' }),
          React.createElement('div', { className: 'row between mt-3' },
            React.createElement('span', { className: 'text-tertiary', style: { fontSize: 12 } }, '30 days ago'),
            React.createElement('span', { className: 'text-tertiary', style: { fontSize: 12 } }, 'Today'))),
        React.createElement(Panel, null,
          React.createElement('div', { className: 'eyebrow mb-4' }, 'Study time · last 30 days'),
          React.createElement(LineChart, { data: s.studyMinutes, width: 480, height: 170, yKey: 'minutes', color: 'var(--mem-strong)', suffix: 'm' }))),

      /* Domain breakdown */
      React.createElement('div', { className: 'prog-two mt-5' },
        React.createElement(Panel, null,
          React.createElement('div', { className: 'eyebrow mb-4' }, 'Memory health by domain'),
          React.createElement(HBars, { data: s.domainHealth })),
        React.createElement(Panel, null,
          React.createElement('div', { className: 'eyebrow mb-4' }, 'Knowledge coverage'),
          React.createElement('div', { className: 'col gap-4' },
            [['Mastered', s.mastered, s.masteredPct, 'var(--mem-mastered)'], ['Review-ready', s.reviewReady, s.reviewReadyPct, 'var(--mem-strong)'], ['Draft', s.draft, s.draftPct, 'var(--text-tertiary)']].map(([l, n, p, c], i) =>
              React.createElement('div', { key: i },
                React.createElement('div', { className: 'row between mb-2' }, React.createElement('span', { style: { fontSize: 14, fontWeight: 600 } }, l), React.createElement('span', { className: 'text-tertiary tnum', style: { fontSize: 13 } }, n, ' · ', p, '%')),
                React.createElement(ProgressBar, { value: p, height: 8, color: c })))),
          React.createElement('div', { className: 'prog-rankings mt-5' },
            React.createElement('div', { className: 'col gap-1' }, React.createElement('span', { className: 'stat-cap' }, 'Strongest'), React.createElement('span', { className: 'serif', style: { fontSize: 16 } }, 'Mathematics · 82')),
            React.createElement('div', { className: 'col gap-1' }, React.createElement('span', { className: 'stat-cap' }, 'Needs work'), React.createElement('span', { className: 'serif', style: { fontSize: 16 } }, 'German · 58'))))),

      /* Streak + milestones */
      React.createElement(Panel, { className: 'mt-5' },
        React.createElement('div', { className: 'row between items-end mb-4 wrap gap-3' },
          React.createElement('div', { className: 'eyebrow' }, 'Review activity'),
          React.createElement('div', { className: 'row gap-5' },
            React.createElement('div', { className: 'col' }, React.createElement('span', { className: 'serif', style: { fontSize: 24, fontWeight: 700 } }, s.streak, ' \uD83D\uDD25'), React.createElement('span', { className: 'stat-cap' }, 'Current streak')),
            React.createElement('div', { className: 'col' }, React.createElement('span', { className: 'serif', style: { fontSize: 24, fontWeight: 700 } }, s.longestStreak), React.createElement('span', { className: 'stat-cap' }, 'Longest')))),
        React.createElement(StreakCalendarWrap, null)),

      /* Records */
      React.createElement('div', { className: 'prog-records mt-5' },
        s.records.map((r, i) => React.createElement(Panel, { key: i, className: 'prog-record' },
          React.createElement('div', { className: 'stat-fig stat-md' }, r.value),
          React.createElement('div', { className: 'stat-cap mt-2' }, r.label)))));
  }
  function StreakCalendarWrap() {
    const D = window.MNEMOS_DATA;
    return React.createElement(StreakCalendar, { data: D.stats.reviewsPerDay.length ? buildStreak(D) : [], weeks: 30 });
  }
  function buildStreak(D) {
    // reuse the dataset's streakDays via stats? we stored it in data? It's not exported; rebuild quick:
    return D._streak || (D._streak = Array.from({ length: 210 }, (_, i) => {
      const seed = Math.sin((i + 3) * 12.9898) * 43758.5453; const r = seed - Math.floor(seed);
      const day = new Date(D.today); day.setDate(day.getDate() - (209 - i));
      let count = i > 203 ? [20, 24, 31, 12, 27, 22, 24][i - 204] || 18 : (r > 0.78 ? 0 : Math.floor(r * 42) + 3);
      return { date: day.toISOString(), count };
    }));
  }

  /* ---------------- Learning Plans ---------------- */
  function PlansPage() {
    const app = useApp(); const toast = useToast(); const D = window.MNEMOS_DATA;
    return React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'row between items-center mb-5' },
        React.createElement('p', { className: 'text-secondary', style: { fontSize: 15, maxWidth: 560, margin: 0 } }, 'AI-generated curricula built from your goals and your existing notes — sequenced, with prerequisites and milestones.'),
        React.createElement(Button, { variant: 'primary', icon: 'sparkle', onClick: () => toast('Describe a goal to generate a new plan', { icon: 'sparkle' }) }, 'New plan')),
      React.createElement('div', { className: 'plans-grid' },
        D.plans.map(p => React.createElement(Panel, { key: p.id, className: 'plan-card' },
          React.createElement('div', { className: 'row between items-start mb-3' },
            React.createElement('span', { className: 'notecard-domain', style: { '--dc': D.domainById(p.domain).color } }, D.domainById(p.domain).name),
            React.createElement(Badge, { tone: p.status === 'active' ? 'success' : 'neutral', dot: true }, p.status === 'active' ? 'Active' : 'Paused')),
          React.createElement('h3', { className: 'serif', style: { fontSize: 22, margin: '0 0 6px' } }, p.title),
          React.createElement('p', { className: 'text-secondary', style: { fontSize: 14, lineHeight: 1.6, margin: '0 0 var(--space-4)' } }, p.goal),
          React.createElement('div', { className: 'row between mb-2' },
            React.createElement('span', { className: 'stat-cap' }, p.doneSteps, ' / ', p.totalSteps, ' steps'),
            React.createElement('span', { className: 'text-accent', style: { fontSize: 13, fontWeight: 700 } }, p.progress, '%')),
          React.createElement(ProgressBar, { value: p.progress, height: 8 }),
          React.createElement('div', { className: 'plan-milestones' },
            p.milestones.map((m, i) => React.createElement('div', { key: i, className: `plan-milestone${m.done ? ' is-done' : m.current ? ' is-current' : ''}` },
              React.createElement('span', { className: 'plan-milestone-node' }, m.done ? React.createElement(Icon, { name: 'check', size: 11 }) : m.current ? React.createElement('span', { className: 'plan-pulse' }) : null),
              React.createElement('span', { className: 'plan-milestone-label' }, m.name)))),
          React.createElement('div', { className: 'row between items-center mt-4' },
            React.createElement('span', { className: 'text-tertiary', style: { fontSize: 13 } }, React.createElement(Icon, { name: 'clock', size: 13, style: { verticalAlign: '-2px' } }), ' ~', p.daysPerDay, ' min/day'),
            React.createElement(Button, { variant: 'soft', size: 'sm', iconRight: 'arrowRight', onClick: () => { const n = D.noteById(p.sequence[Math.min(p.doneSteps, p.sequence.length - 1)]); if (n) app.openNote(n.id); } }, 'Continue'))))));
  }

  /* ---------------- Knowledge Gaps ---------------- */
  function GapsPage() {
    const app = useApp(); const toast = useToast(); const D = window.MNEMOS_DATA; const g = D.gaps;
    const [cat, setCat] = useState('dangling');
    const cats = [
      { id: 'dangling', label: 'Dangling concepts', count: g.dangling.length, desc: 'Terms used across notes with no dedicated note' },
      { id: 'shallow', label: 'Shallow notes', count: g.shallow.length, desc: 'Frequently referenced but thin on content' },
      { id: 'unlinked', label: 'Unlinked mentions', count: g.unlinked.length, desc: 'Note titles mentioned as plain text' },
      { id: 'stale', label: 'Stale important notes', count: g.stale.length, desc: 'Important notes not reviewed recently' },
    ];
    const resolve = (label) => toast(label, { icon: 'check', tone: 'success' });
    return React.createElement('div', { className: 'gaps-layout' },
      React.createElement('aside', { className: 'gaps-side' },
        cats.map(c => React.createElement('button', { key: c.id, className: `gaps-cat${cat === c.id ? ' is-active' : ''}`, onClick: () => setCat(c.id) },
          React.createElement('div', { className: 'row between items-center' },
            React.createElement('span', { className: 'gaps-cat-label' }, c.label),
            React.createElement('span', { className: 'gaps-cat-count' }, c.count)),
          React.createElement('p', { className: 'gaps-cat-desc' }, c.desc)))),
      React.createElement('div', { className: 'gaps-main' },
        cat === 'dangling' && g.dangling.map(item => React.createElement(Panel, { key: item.id, className: 'gap-item' },
          React.createElement('div', { className: 'grow' },
            React.createElement('div', { className: 'row gap-2 items-center mb-2' }, React.createElement(Icon, { name: 'gap', size: 16, style: { color: 'var(--accent)' } }), React.createElement('h3', { className: 'serif', style: { fontSize: 19, margin: 0 } }, item.term)),
            React.createElement('p', { className: 'gap-desc' }, 'Appears in ', React.createElement('b', null, item.mentions, ' notes'), ' but has no dedicated note: ', item.notes.join(', ')),
            React.createElement('div', { className: 'row gap-2 mt-3' },
              React.createElement(Button, { variant: 'primary', size: 'sm', icon: 'plus', onClick: () => resolve(`Note stub for "${item.term}" created & linked to ${item.mentions} notes`) }, 'Create note'),
              React.createElement(Button, { variant: 'ghost', size: 'sm', icon: 'search', onClick: () => app.navigate('ai-search') }, 'Find in vault'),
              React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => resolve('Snoozed for 30 days') }, 'Ignore'))))),
        cat === 'shallow' && g.shallow.map(item => React.createElement(Panel, { key: item.id, className: 'gap-item' },
          React.createElement('div', { className: 'grow' },
            React.createElement('h3', { className: 'serif', style: { fontSize: 19, margin: '0 0 6px' } }, item.title),
            React.createElement('p', { className: 'gap-desc' }, React.createElement('b', null, item.refs, ' notes'), ' link here, but it contains only ', React.createElement('b', null, item.words, ' words'), '.'),
            React.createElement('div', { className: 'row gap-2 mt-3' }, React.createElement(Button, { variant: 'primary', size: 'sm', icon: 'edit', onClick: () => resolve('Opened for expansion') }, 'Expand note'), React.createElement(Button, { variant: 'ghost', size: 'sm', icon: 'sparkle', onClick: () => resolve('AI draft generated') }, 'AI expand')))),),
        cat === 'unlinked' && g.unlinked.map(item => React.createElement(Panel, { key: item.id, className: 'gap-item' },
          React.createElement('div', { className: 'grow' },
            React.createElement('p', { className: 'gap-desc' }, React.createElement('b', null, '"', item.term, '"'), ' appears as plain text ', React.createElement('b', null, item.count, ' times'), ' in ', React.createElement('b', null, item.inNote), ' without a wikilink.'),
            React.createElement('div', { className: 'row gap-2 mt-3' }, React.createElement(Button, { variant: 'primary', size: 'sm', icon: 'link', onClick: () => resolve(`Linked ${item.count} mentions`) }, 'Link mentions'), React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => resolve('Ignored') }, 'Ignore')))),),
        cat === 'stale' && g.stale.map(item => React.createElement(Panel, { key: item.id, className: 'gap-item' },
          React.createElement('div', { className: 'grow' },
            React.createElement('div', { className: 'row between items-start' },
              React.createElement('div', null,
                React.createElement('h3', { className: 'serif', style: { fontSize: 19, margin: '0 0 6px' } }, item.title),
                React.createElement('p', { className: 'gap-desc' }, 'Not reviewed in ', React.createElement('b', null, item.days, ' days'), ' · marked ', item.importance, ' importance')),
              React.createElement(MemoryBadge, { score: item.memory })),
            React.createElement('div', { className: 'row gap-2 mt-3' }, React.createElement(Button, { variant: 'primary', size: 'sm', icon: 'review', onClick: () => app.navigate('review-cards') }, 'Review now'), React.createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => resolve('Snoozed') }, 'Snooze'))))) ));
  }

  /* ---------------- Language Practice ---------------- */
  function LanguagePage() {
    const app = useApp(); const toast = useToast(); const D = window.MNEMOS_DATA;
    const [active, setActive] = useState(D.languages[0].code);
    const lang = D.languages.find(l => l.code === active);
    return React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'row gap-3 mb-5 wrap' },
        D.languages.map(l => React.createElement('button', { key: l.code, className: `lang-pill${active === l.code ? ' is-active' : ''}`, onClick: () => setActive(l.code) },
          React.createElement('span', { style: { fontSize: 22 } }, l.flag),
          React.createElement('div', { style: { textAlign: 'left' } }, React.createElement('div', { style: { fontWeight: 700 } }, l.name), React.createElement('div', { className: 'text-tertiary', style: { fontSize: 12 } }, l.cefr, ' → ', l.target))))),

      React.createElement('div', { className: 'lang-grid' },
        React.createElement(Panel, { className: 'lang-progress-card' },
          React.createElement('div', { className: 'eyebrow mb-4' }, 'Progress ladder'),
          React.createElement('div', { className: 'lang-ladder' },
            ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => { const cur = lvl === lang.cefr; const passed = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(lvl) < ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(lang.cefr);
              return React.createElement('div', { key: lvl, className: `lang-rung${cur ? ' is-current' : passed ? ' is-passed' : ''}` }, lvl); })),
          React.createElement('div', { className: 'lang-metrics mt-5' },
            React.createElement('div', { className: 'lang-metric' },
              React.createElement('div', { className: 'row between mb-2' }, React.createElement('span', { className: 'stat-cap' }, 'Vocabulary'), React.createElement('span', { className: 'tnum', style: { fontSize: 13, fontWeight: 600 } }, lang.vocab, ' / ', lang.vocabTarget)),
              React.createElement(ProgressBar, { value: lang.vocab, max: lang.vocabTarget, height: 7, color: 'var(--mem-mastered)' })),
            React.createElement('div', { className: 'lang-metric' },
              React.createElement('div', { className: 'row between mb-2' }, React.createElement('span', { className: 'stat-cap' }, 'Grammar mastery'), React.createElement('span', { className: 'tnum', style: { fontSize: 13, fontWeight: 600 } }, lang.grammar, '%')),
              React.createElement(ProgressBar, { value: lang.grammar, height: 7, color: 'var(--mem-strong)' })),
            React.createElement('div', { className: 'lang-metric' },
              React.createElement('div', { className: 'row between mb-2' }, React.createElement('span', { className: 'stat-cap' }, 'Reading comprehension'), React.createElement('span', { className: 'tnum', style: { fontSize: 13, fontWeight: 600 } }, lang.reading, '%')),
              React.createElement(ProgressBar, { value: lang.reading, height: 7, color: 'var(--mem-moderate)' }))),
          React.createElement('div', { className: 'lang-today mt-5' },
            React.createElement('span', null, React.createElement('b', null, '+', lang.newWordsToday), ' new words today'),
            React.createElement('span', null, React.createElement(Icon, { name: 'flame', size: 14, fill: true, style: { verticalAlign: '-2px', color: 'var(--accent)' } }), ' ', lang.streak, '-day streak'))),

        React.createElement(Panel, null,
          React.createElement('div', { className: 'eyebrow mb-3' }, 'Grammar pattern mastery'),
          React.createElement('div', { className: 'center', style: { display: 'flex' } }, React.createElement(SkillRadar, { data: lang.grammarRadar, size: 260 })))),

      React.createElement('div', { className: 'eyebrow mt-6 mb-4' }, 'Practice exercises'),
      React.createElement('div', { className: 'lang-exercises' },
        [{ t: 'Vocabulary drill', d: 'Cards extracted from your ' + lang.name + ' notes', ic: 'cards', n: '24 cards' },
         { t: 'Grammar fill-in-the-blank', d: 'Calibrated to ' + lang.cefr + ' level', ic: 'spell', n: '10 exercises' },
         { t: 'Reading passage', d: 'Short text using your vault vocabulary', ic: 'book', n: '~3 min' },
         { t: 'Translation recall', d: 'From bilingual notes', ic: 'globe', n: '12 pairs' }].map((ex, i) =>
          React.createElement('button', { key: i, className: 'lang-exercise panel-hover', onClick: () => app.navigate('review-cards') },
            React.createElement('div', { className: 'lang-exercise-icon' }, React.createElement(Icon, { name: ex.ic, size: 18 })),
            React.createElement('div', { className: 'grow', style: { textAlign: 'left' } },
              React.createElement('div', { style: { fontWeight: 600, fontSize: 15 } }, ex.t),
              React.createElement('div', { className: 'text-tertiary', style: { fontSize: 13 } }, ex.d)),
            React.createElement(Badge, { tone: 'gold' }, ex.n)))));
  }

  /* ---------------- Skill Tracker ---------------- */
  function SkillsPage() {
    const D = window.MNEMOS_DATA;
    const radar = D.domains.map(d => ({ axis: d.name.split(' ')[0], score: d.memory }));
    return React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'skills-layout' },
        React.createElement(Panel, null,
          React.createElement('div', { className: 'eyebrow mb-4' }, 'Skill coverage across domains'),
          React.createElement('div', { className: 'center', style: { display: 'flex' } }, React.createElement(SkillRadar, { data: radar, size: 300 }))),
        React.createElement('div', { className: 'col gap-4' },
          D.domains.map(d => React.createElement(Panel, { key: d.id, className: 'skill-row' },
            React.createElement('span', { className: 'skill-dot', style: { background: d.color } }),
            React.createElement('div', { className: 'grow' },
              React.createElement('div', { className: 'row between mb-1' },
                React.createElement('span', { style: { fontWeight: 600, fontSize: 15 } }, d.name),
                React.createElement(MemoryBadge, { score: d.memory, showLabel: false })),
              React.createElement('div', { className: 'row between mb-2' }, React.createElement('span', { className: 'text-tertiary', style: { fontSize: 12 } }, d.noteCount, ' notes'), React.createElement('span', { className: 'text-tertiary tnum', style: { fontSize: 12 } }, d.memory, '/100')),
              React.createElement(ProgressBar, { value: d.memory, height: 6, color: d.color })))))));
  }

  function LearningRouter({ route }) {
    let body;
    if (route === 'learn-plans') body = React.createElement(PlansPage, null);
    else if (route === 'learn-gaps') body = React.createElement(GapsPage, null);
    else if (route === 'learn-language') body = React.createElement(LanguagePage, null);
    else if (route === 'learn-skills') body = React.createElement(SkillsPage, null);
    else body = React.createElement(ProgressPage, null);
    return React.createElement(LearnShell, { route }, body);
  }

  window.Pages = window.Pages || {};
  window.Pages.Learning = LearningRouter;
})();
