/* ============================================================
   MNEMOS — Library + Note Reader / Editor
   ============================================================ */
(function () {
  const { useState, useMemo, useEffect, useRef } = React;
  const Icon = window.Icon;
  const { Button, IconButton, Panel, MemoryDot, MemoryBadge, Tag, Badge, Segmented, Markdown,
          Breadcrumb, EmptyState, Menu, Spinner, ProgressBar, useToast } = window.UI;
  const { ForgettingCurve } = window.Charts;
  const { useApp } = window.Shell;

  const STATUS = { draft: { label: 'Draft', tone: 'neutral' }, 'review-ready': { label: 'Review-ready', tone: 'gold' }, mastered: { label: 'Mastered', tone: 'success' } };

  /* ---------------- Note card ---------------- */
  function NoteCard({ note, onOpen, view }) {
    const D = window.MNEMOS_DATA;
    const dom = D.domainById(note.domain);
    if (view === 'list') {
      return React.createElement('button', { className: 'notecard-list', onClick: onOpen },
        React.createElement(MemoryDot, { score: note.memory, size: 10 }),
        React.createElement('div', { className: 'notecard-list-main' },
          React.createElement('div', { className: 'notecard-list-title serif' }, note.title),
          React.createElement('div', { className: 'notecard-list-excerpt' }, note.excerpt)),
        React.createElement('div', { className: 'notecard-list-meta' },
          React.createElement('span', { className: 'notecard-domain', style: { '--dc': dom.color } }, dom.name),
          React.createElement('span', { className: 'notecard-list-time' }, note.readMinutes, ' min')));
    }
    return React.createElement('button', { className: 'notecard panel-hover', onClick: onOpen },
      React.createElement('div', { className: 'row between items-start mb-3' },
        React.createElement('span', { className: 'notecard-domain', style: { '--dc': dom.color } }, dom.name),
        React.createElement(MemoryDot, { score: note.memory, size: 9 })),
      React.createElement('h3', { className: 'notecard-title serif' }, note.title),
      React.createElement('p', { className: 'notecard-excerpt' }, note.excerpt),
      React.createElement('div', { className: 'notecard-foot' },
        React.createElement('div', { className: 'row gap-1', style: { flexWrap: 'wrap' } },
          note.tags.slice(0, 2).map(t => React.createElement(Tag, { key: t }, t))),
        React.createElement('span', { className: 'notecard-time' }, note.readMinutes, ' min')));
  }

  /* ---------------- Library ---------------- */
  function LibraryPage() {
    const app = useApp();
    const D = window.MNEMOS_DATA;
    const [view, setView] = useState('grid');
    const [domain, setDomain] = useState('all');
    const [status, setStatus] = useState('all');
    const [q, setQ] = useState('');
    const [sort, setSort] = useState('updated');

    const filtered = useMemo(() => {
      let list = D.notes.slice();
      if (domain !== 'all') list = list.filter(n => n.domain === domain);
      if (status !== 'all') list = list.filter(n => n.status === status);
      if (q.trim()) { const ql = q.toLowerCase(); list = list.filter(n => n.title.toLowerCase().includes(ql) || n.excerpt.toLowerCase().includes(ql) || n.tags.some(t => t.includes(ql))); }
      list.sort((a, b) => sort === 'memory' ? b.memory - a.memory : sort === 'title' ? a.title.localeCompare(b.title) : new Date(b.updated) - new Date(a.updated));
      return list;
    }, [domain, status, q, sort, D]);

    return React.createElement('div', { className: 'page rise' },
      React.createElement('div', { className: 'row between items-end mb-5 wrap gap-4' },
        React.createElement('div', null,
          React.createElement('div', { className: 'eyebrow mb-2' }, D.notes.length, ' notes · ', D.domains.length, ' domains'),
          React.createElement('h1', { className: 'serif', style: { fontSize: 36, margin: 0 } }, 'Library')),
        React.createElement('div', { className: 'row gap-2' },
          React.createElement(Button, { variant: 'secondary', icon: 'upload', onClick: () => app.toast('Import flow — drop a vault folder or .md files', { icon: 'folder' }) }, 'Import'),
          React.createElement(Button, { variant: 'primary', icon: 'plus', onClick: () => app.toast('New note created', { icon: 'check', tone: 'success' }) }, 'New note'))),

      /* Search + controls */
      React.createElement('div', { className: 'lib-toolbar' },
        React.createElement('div', { className: 'lib-search' },
          React.createElement(Icon, { name: 'search', size: 17, style: { color: 'var(--text-tertiary)' } }),
          React.createElement('input', { value: q, onChange: e => setQ(e.target.value), placeholder: 'Filter notes…' }),
          q && React.createElement(IconButton, { name: 'x', size: 15, label: 'Clear', onClick: () => setQ('') })),
        React.createElement('div', { className: 'row gap-2', style: { marginLeft: 'auto' } },
          React.createElement(Menu, {
            trigger: React.createElement(Button, { variant: 'ghost', size: 'sm', icon: 'filter', iconRight: 'chevronDown' }, sort === 'updated' ? 'Recently updated' : sort === 'memory' ? 'Memory strength' : 'Title A–Z'),
            items: [
              { icon: 'clock', label: 'Recently updated', onClick: () => setSort('updated') },
              { icon: 'gauge', label: 'Memory strength', onClick: () => setSort('memory') },
              { icon: 'list', label: 'Title A–Z', onClick: () => setSort('title') },
            ] }),
          React.createElement(Segmented, { size: 'sm', value: view, onChange: setView, options: [{ value: 'grid', icon: 'grid', label: '' }, { value: 'list', icon: 'list', label: '' }] }))),

      /* Domain chips */
      React.createElement('div', { className: 'lib-chips' },
        React.createElement('button', { className: `lib-chip${domain === 'all' ? ' is-active' : ''}`, onClick: () => setDomain('all') }, 'All domains'),
        D.domains.map(d => React.createElement('button', { key: d.id, className: `lib-chip${domain === d.id ? ' is-active' : ''}`, onClick: () => setDomain(d.id) },
          React.createElement('span', { className: 'lib-chip-dot', style: { background: d.color } }), d.name, React.createElement('span', { className: 'lib-chip-count' }, d.noteCount)))),

      React.createElement('div', { className: 'row gap-3 mb-5', style: { flexWrap: 'wrap' } },
        React.createElement(Segmented, { size: 'sm', value: status, onChange: setStatus, options: [
          { value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' },
          { value: 'review-ready', label: 'Review-ready' }, { value: 'mastered', label: 'Mastered' }] })),

      filtered.length === 0
        ? React.createElement(Panel, null, React.createElement(EmptyState, { icon: 'search', title: 'No notes match', body: 'Try a different domain, status, or search term.', action: React.createElement(Button, { variant: 'soft', size: 'sm', onClick: () => { setQ(''); setDomain('all'); setStatus('all'); } }, 'Clear filters') }))
        : view === 'grid'
          ? React.createElement('div', { className: 'lib-grid' }, filtered.map(n => React.createElement(NoteCard, { key: n.id, note: n, view: 'grid', onOpen: () => app.openNote(n.id) })))
          : React.createElement(Panel, { pad: false, className: 'lib-listwrap' }, filtered.map(n => React.createElement(NoteCard, { key: n.id, note: n, view: 'list', onOpen: () => app.openNote(n.id) }))));
  }

  /* ---------------- AI Card generation panel ---------------- */
  function GenerateCardsPanel({ note, onClose }) {
    const app = useApp();
    const toast = useToast();
    const D = window.MNEMOS_DATA;
    const [phase, setPhase] = useState('loading'); // loading | review
    const [cards, setCards] = useState([]);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
      const t = setTimeout(() => {
        const seed = (D.cards.filter(c => c.noteId === note.id));
        const proposed = [
          ...seed.map(c => ({ id: c.id, type: c.type, front: c.front, back: c.back.replace(/\*\*/g, ''), status: 'pending' })),
          { id: 'gen-' + note.id + '-a', type: 'basic', front: `What is the core idea of "${note.title}"?`, back: note.excerpt, status: 'pending' },
          { id: 'gen-' + note.id + '-b', type: 'cloze', front: note.excerpt.replace(/\b(\w{6,})\b/, '[___]'), back: note.excerpt, status: 'pending' },
        ].slice(0, 6);
        setCards(proposed); setPhase('review');
      }, 1600);
      return () => clearTimeout(t);
    }, [note]);

    const set = (id, status) => setCards(cs => cs.map(c => c.id === id ? { ...c, status } : c));
    const approved = cards.filter(c => c.status === 'approved').length;

    return React.createElement('div', { className: 'sidepanel-scrim', onClick: onClose },
      React.createElement('aside', { className: 'sidepanel', onClick: e => e.stopPropagation() },
        React.createElement('div', { className: 'sidepanel-head' },
          React.createElement('div', null,
            React.createElement('div', { className: 'eyebrow' }, 'AI Card Generator'),
            React.createElement('h3', { className: 'serif t-heading-lg' }, note.title)),
          React.createElement(IconButton, { name: 'x', label: 'Close', onClick: onClose })),
        phase === 'loading'
          ? React.createElement('div', { className: 'sidepanel-loading' },
              React.createElement('div', { className: 'genloader' }, React.createElement(Icon, { name: 'sparkle', size: 26, fill: true })),
              React.createElement('p', { className: 'serif', style: { fontSize: 18 } }, 'Analyzing your note…'),
              React.createElement('p', { className: 'text-tertiary', style: { fontSize: 13 } }, 'Extracting concepts and drafting cards'))
          : React.createElement(React.Fragment, null,
              React.createElement('div', { className: 'sidepanel-body' },
                React.createElement('p', { className: 'text-secondary mb-4', style: { fontSize: 14 } }, 'MNEMOS proposed ', React.createElement('b', null, cards.length), ' cards from this note. Approve, edit, or reject each.'),
                cards.map(c => React.createElement('div', { key: c.id, className: `gencard${c.status !== 'pending' ? ' is-' + c.status : ''}` },
                  React.createElement('div', { className: 'row between items-start mb-2' },
                    React.createElement(Badge, { tone: 'accent' }, c.type),
                    c.status === 'approved' ? React.createElement(Badge, { tone: 'success', dot: true }, 'Approved') :
                    c.status === 'rejected' ? React.createElement(Badge, { tone: 'neutral' }, 'Rejected') : null),
                  editing === c.id
                    ? React.createElement('div', { className: 'col gap-2' },
                        React.createElement('textarea', { className: 'gencard-edit', value: c.front, onChange: e => setCards(cs => cs.map(x => x.id === c.id ? { ...x, front: e.target.value } : x)) }),
                        React.createElement('textarea', { className: 'gencard-edit', value: c.back, onChange: e => setCards(cs => cs.map(x => x.id === c.id ? { ...x, back: e.target.value } : x)) }),
                        React.createElement(Button, { size: 'sm', variant: 'soft', onClick: () => setEditing(null) }, 'Done editing'))
                    : React.createElement('div', null,
                        React.createElement('p', { className: 'gencard-front serif' }, c.front),
                        React.createElement('p', { className: 'gencard-back' }, c.back)),
                  React.createElement('div', { className: 'gencard-actions' },
                    React.createElement('button', { className: 'gencard-act approve', onClick: () => set(c.id, 'approved'), title: 'Approve' }, React.createElement(Icon, { name: 'check', size: 16 })),
                    React.createElement('button', { className: 'gencard-act', onClick: () => setEditing(c.id), title: 'Edit' }, React.createElement(Icon, { name: 'edit', size: 15 })),
                    React.createElement('button', { className: 'gencard-act reject', onClick: () => set(c.id, 'rejected'), title: 'Reject' }, React.createElement(Icon, { name: 'x', size: 16 }))))) ),
              React.createElement('div', { className: 'sidepanel-foot' },
                React.createElement('span', { className: 'text-tertiary', style: { fontSize: 13 } }, approved, ' selected'),
                React.createElement(Button, { variant: 'primary', icon: 'plus', disabled: approved === 0, onClick: () => { toast(`${approved} cards added to review queue`, { icon: 'check', tone: 'success', action: { label: 'Review now', onClick: () => app.navigate('review-cards') } }); onClose(); } }, 'Add to queue')))));
  }

  /* ---------------- Note reader ---------------- */
  function NotePage({ noteId }) {
    const app = useApp();
    const toast = useToast();
    const D = window.MNEMOS_DATA;
    const note = D.noteById(noteId);
    const [showBacklinks, setShowBacklinks] = useState(true);
    const [genOpen, setGenOpen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
      const el = scrollRef.current; if (!el) return;
      const onScroll = () => { const max = el.scrollHeight - el.clientHeight; setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0); };
      el.addEventListener('scroll', onScroll); onScroll();
      return () => el.removeEventListener('scroll', onScroll);
    }, [noteId]);

    if (!note) return React.createElement('div', { className: 'page' }, React.createElement(EmptyState, { title: 'Note not found' }));
    const dom = D.domainById(note.domain);
    const backlinks = D.notes.filter(n => n.links.includes(note.id));
    const outlinks = note.links.map(id => D.noteById(id)).filter(Boolean);
    const concepts = [
      { label: note.topic, score: note.memory },
      ...note.tags.map(t => ({ label: t, score: Math.round(note.memory + (Math.random() * 20 - 10)) })),
    ];
    const reviewEvents = [{ day: 0, r: 100 }, { day: 4, r: 100 }, { day: 11, r: 100 }];
    const onWiki = (title) => { const t = D.notes.find(n => n.title === title || n.title.includes(title)); if (t) app.openNote(t.id); else toast(`"${title}" — dangling concept. Create note?`, { icon: 'gap' }); };

    return React.createElement('div', { className: 'note-layout' },
      React.createElement('div', { className: 'note-progress-bar', style: { width: progress + '%' } }),
      /* Reader column */
      React.createElement('div', { className: 'note-reader hide-scrollbar', ref: scrollRef },
        React.createElement('div', { className: 'note-reader-inner' },
          React.createElement('div', { className: 'row between items-center mb-5 wrap gap-3' },
            React.createElement(Breadcrumb, { items: [
              { label: 'Library', onClick: () => app.navigate('library') },
              { label: dom.name, onClick: () => app.navigate('library') },
              { label: note.topic }, { label: note.title }] }),
            React.createElement('div', { className: 'row gap-1' },
              React.createElement(IconButton, { name: 'bookmark', label: 'Bookmark', onClick: () => toast('Bookmarked', { icon: 'bookmark' }) }),
              React.createElement(IconButton, { name: editMode ? 'eye' : 'edit', label: editMode ? 'Read' : 'Edit', active: editMode, onClick: () => setEditMode(e => !e) }),
              React.createElement(Menu, { trigger: React.createElement(IconButton, { name: 'dots', label: 'More' }), items: [
                { icon: 'cards', label: 'Generate cards', onClick: () => setGenOpen(true) },
                { icon: 'review', label: 'Add to review queue', onClick: () => toast('Note concepts added to queue', { icon: 'check', tone: 'success' }) },
                { icon: 'graph', label: 'Show in graph', onClick: () => app.navigate('graph') },
                { divider: true },
                { icon: 'download', label: 'Export Markdown', onClick: () => toast('Exported .md', { icon: 'download' }) },
              ] }))),

          React.createElement('div', { className: 'row gap-2 mb-4 wrap' },
            React.createElement(Badge, { tone: STATUS[note.status].tone, dot: true }, STATUS[note.status].label),
            React.createElement(MemoryBadge, { score: note.memory }),
            React.createElement('span', { className: 'note-meta-item' }, React.createElement(Icon, { name: 'clock', size: 14 }), note.readMinutes, ' min read'),
            React.createElement('span', { className: 'note-meta-item' }, React.createElement(Icon, { name: 'link', size: 14 }), backlinks.length + outlinks.length, ' connections')),

          editMode
            ? React.createElement('div', { className: 'note-editor' },
                React.createElement('div', { className: 'note-editor-frontmatter' },
                  React.createElement('div', { className: 'eyebrow mb-2' }, 'Frontmatter'),
                  React.createElement('pre', { className: 'mono' }, `---\ntitle: ${note.title}\ntags: [${note.tags.join(', ')}]\nstatus: ${note.status}\ndifficulty: ${note.difficulty}\nlanguage: ${note.language}\nsource: "${note.source}"\n---`)),
                React.createElement('textarea', { className: 'note-editor-area mono', defaultValue: note.content }),
                React.createElement('div', { className: 'row gap-2 mt-4' },
                  React.createElement(Button, { variant: 'primary', icon: 'check', onClick: () => { setEditMode(false); toast('Note saved', { icon: 'check', tone: 'success' }); } }, 'Save'),
                  React.createElement(Button, { variant: 'ghost', onClick: () => setEditMode(false) }, 'Cancel')))
            : React.createElement(Markdown, { className: 'reading', onWiki }, note.content),

          !editMode && React.createElement('div', { className: 'note-cta-row' },
            React.createElement(Button, { variant: 'primary', icon: 'sparkle', onClick: () => setGenOpen(true) }, 'Generate Cards'),
            React.createElement(Button, { variant: 'secondary', icon: 'review', onClick: () => app.navigate('review-cards') }, 'Review concepts'),
            React.createElement(Button, { variant: 'ghost', icon: 'ai', onClick: () => app.navigate('ai-chat') }, 'Ask about this note')),
          React.createElement('div', { className: 'note-source' },
            React.createElement(Icon, { name: 'quote', size: 15 }),
            React.createElement('span', null, 'Source: ', note.source)))),

      /* Right sidebar */
      React.createElement('aside', { className: 'note-aside hide-scrollbar' },
        React.createElement('div', { className: 'note-aside-card' },
          React.createElement('div', { className: 'eyebrow mb-3' }, 'Memory Health'),
          React.createElement('div', { className: 'row between items-center mb-3' },
            React.createElement('span', { className: 'serif', style: { fontSize: 30, fontWeight: 700 } }, note.memory),
            React.createElement(MemoryBadge, { score: note.memory, showLabel: true })),
          React.createElement(ForgettingCurve, { reviews: reviewEvents, width: 264, height: 110 }),
          React.createElement('p', { className: 'note-curve-note' }, 'Next review in ', React.createElement('b', null, '6 days'), ' — projected retrievability ', React.createElement('b', null, '90%'))),

        React.createElement('div', { className: 'note-aside-card' },
          React.createElement('div', { className: 'eyebrow mb-3' }, 'Concepts in this note'),
          React.createElement('div', { className: 'row gap-2 wrap' },
            concepts.map((c, i) => React.createElement('span', { key: i, className: 'concept-pill', style: { cursor: 'default' } },
              React.createElement(MemoryDot, { score: c.score, size: 7 }), c.label)))),

        React.createElement('div', { className: 'note-aside-card' },
          React.createElement('button', { className: 'note-aside-toggle', onClick: () => setShowBacklinks(s => !s) },
            React.createElement('span', { className: 'eyebrow' }, 'Linked notes · ', backlinks.length + outlinks.length),
            React.createElement(Icon, { name: showBacklinks ? 'chevronDown' : 'chevronRight', size: 16 })),
          showBacklinks && React.createElement('div', { className: 'mt-3 col gap-3' },
            outlinks.length > 0 && React.createElement('div', null,
              React.createElement('div', { className: 'note-link-group' }, '→ Links to'),
              outlinks.map(n => React.createElement('button', { key: n.id, className: 'note-link-item', onClick: () => app.openNote(n.id) },
                React.createElement(MemoryDot, { score: n.memory, size: 7 }), n.title))),
            backlinks.length > 0 && React.createElement('div', null,
              React.createElement('div', { className: 'note-link-group' }, '← Linked from'),
              backlinks.map(n => React.createElement('button', { key: n.id, className: 'note-link-item', onClick: () => app.openNote(n.id) },
                React.createElement(MemoryDot, { score: n.memory, size: 7 }), n.title))),
            backlinks.length === 0 && outlinks.length === 0 && React.createElement('p', { className: 'text-tertiary', style: { fontSize: 13 } }, 'No links yet.')))),

      genOpen && React.createElement(GenerateCardsPanel, { note, onClose: () => setGenOpen(false) }));
  }

  window.Pages = window.Pages || {};
  window.Pages.Library = LibraryPage;
  window.Pages.Note = NotePage;
})();
