/* ============================================================
   MNEMOS — AI Tools: Semantic Search + Ask MNEMOS
   ============================================================ */
(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const Icon = window.Icon;
  const { Button, IconButton, Panel, MemoryDot, MemoryBadge, Badge, Segmented, Markdown,
          Spinner, EmptyState } = window.UI;
  const { useApp } = window.Shell;

  const MODES = [
    { id: 'semantic', label: 'Semantic', hint: 'Conceptually related notes' },
    { id: 'keyword', label: 'Keyword', hint: 'Exact phrase match' },
    { id: 'question', label: 'Question', hint: 'Notes that answer it' },
    { id: 'graph', label: 'Graph', hint: 'Most-connected notes' },
  ];

  /* ---------------- Semantic Search ---------------- */
  function SearchPage() {
    const app = useApp(); const D = window.MNEMOS_DATA;
    const [q, setQ] = useState('');
    const [mode, setMode] = useState('semantic');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const clientScore = (text) => {
      const ql = text.toLowerCase().replace(/^\?/, '');
      let scored = D.notes.map(n => {
        let s = 0;
        if (n.title.toLowerCase().includes(ql)) s += 5;
        if (n.excerpt.toLowerCase().includes(ql)) s += 3;
        n.tags.forEach(t => { if (ql.includes(t) || t.includes(ql)) s += 2; });
        s += n.links.length * 0.4; // semantic relatedness proxy
        if (mode === 'graph') s = n.links.length * 3 + s * 0.2;
        return { n, s: s + Math.random() };
      }).filter(x => x.s > 0.6).sort((a, b) => b.s - a.s).slice(0, 6);
      if (scored.length === 0) scored = D.notes.slice(0, 4).map(n => ({ n, s: 1 }));
      return scored;
    };

    const run = (query) => {
      const text = (query ?? q).trim();
      if (!text) { setResults(null); return; }
      setLoading(true);
      // Live keyword search via the API; fall back to local scoring on error.
      if (window.API && window.API.search) {
        window.API.search(text, mode).then((res) => {
          const ids = (res && res.results) || [];
          let scored = ids.map((r, i) => ({ n: D.noteById(r.id), s: ids.length - i })).filter(x => x.n);
          if (scored.length === 0) scored = clientScore(text);
          setResults(scored); setLoading(false);
        }).catch(() => { setResults(clientScore(text)); setLoading(false); });
      } else {
        setTimeout(() => { setResults(clientScore(text)); setLoading(false); }, 300);
      }
    };

    return React.createElement('div', { className: 'page page-narrow rise' },
      React.createElement('div', { className: 'mb-5' },
        React.createElement('div', { className: 'eyebrow mb-2' }, 'AI Tools'),
        React.createElement('h1', { className: 'serif', style: { fontSize: 36, margin: 0 } }, 'Semantic Search')),

      React.createElement('div', { className: 'search-box' },
        React.createElement(Icon, { name: 'search', size: 20, style: { color: 'var(--text-tertiary)' } }),
        React.createElement('input', { ref: inputRef, className: 'search-input', placeholder: 'Search your vault by meaning, not just keywords…',
          value: q, onChange: e => setQ(e.target.value), onKeyDown: e => { if (e.key === 'Enter') run(); } }),
        q && React.createElement(IconButton, { name: 'x', size: 16, label: 'Clear', onClick: () => { setQ(''); setResults(null); } }),
        React.createElement(Button, { variant: 'primary', onClick: () => run() }, 'Search')),

      React.createElement('div', { className: 'row between items-center mt-4 mb-2 wrap gap-3' },
        React.createElement(Segmented, { size: 'sm', value: mode, onChange: setMode, options: MODES.map(m => ({ value: m.id, label: m.label })) }),
        React.createElement('span', { className: 'text-tertiary', style: { fontSize: 13 } }, MODES.find(m => m.id === mode).hint)),

      !results && !loading && React.createElement('div', { className: 'search-suggest mt-6' },
        React.createElement('div', { className: 'eyebrow mb-3' }, 'Try searching'),
        React.createElement('div', { className: 'row gap-2 wrap' },
          ['attention and memory', 'how does FSRS schedule reviews', 'design patterns', 'German grammar', 'optimization algorithms'].map(s =>
            React.createElement('button', { key: s, className: 'concept-pill', onClick: () => { setQ(s); run(s); } }, s)))),

      loading && React.createElement('div', { className: 'mt-6 col gap-3' },
        [0, 1, 2].map(i => React.createElement(Panel, { key: i, className: 'search-result' },
          React.createElement('div', { className: 'col gap-2', style: { width: '100%' } },
            React.createElement('div', { className: 'skeleton', style: { width: '40%', height: 12 } }),
            React.createElement('div', { className: 'skeleton', style: { width: '70%', height: 20 } }),
            React.createElement('div', { className: 'skeleton', style: { width: '100%', height: 14 } }))))),

      results && !loading && React.createElement('div', { className: 'mt-5' },
        React.createElement('div', { className: 'eyebrow mb-3' }, results.length, ' results · ranked by ', mode === 'graph' ? 'connectivity' : 'relevance'),
        React.createElement('div', { className: 'col gap-3' },
          results.map(({ n }) => { const dom = D.domainById(n.domain);
            return React.createElement('button', { key: n.id, className: 'search-result panel-hover', onClick: () => app.openNote(n.id) },
              React.createElement('div', { className: 'grow', style: { textAlign: 'left' } },
                React.createElement('div', { className: 'breadcrumb mb-1' },
                  React.createElement('span', { className: 'breadcrumb-item' }, dom.name), React.createElement('span', { className: 'breadcrumb-sep' }, '›'), React.createElement('span', { className: 'breadcrumb-item' }, n.topic)),
                React.createElement('h3', { className: 'serif', style: { fontSize: 20, margin: '0 0 6px' } }, n.title),
                React.createElement('p', { className: 'search-summary' }, n.excerpt),
                React.createElement('div', { className: 'row gap-4 mt-3 items-center' },
                  React.createElement('span', { className: 'search-meta' }, React.createElement(Icon, { name: 'link', size: 13 }), ' ', n.links.length, ' connections'),
                  React.createElement('span', { className: 'search-meta' }, React.createElement(Icon, { name: 'clock', size: 13 }), ' reviewed ', Math.round((D.today - new Date(n.lastReviewed)) / 86400000), 'd ago'),
                  React.createElement(MemoryBadge, { score: n.memory, showLabel: false }))),
              React.createElement(Icon, { name: 'arrowRight', size: 18, style: { color: 'var(--text-tertiary)', alignSelf: 'center' } })); }))));
  }

  /* ---------------- Ask MNEMOS (chat) ---------------- */
  function buildResponse(text, D) {
    const ql = text.toLowerCase();
    const findNote = (kw) => D.notes.find(n => n.title.toLowerCase().includes(kw));
    if (ql.includes('fsrs') || ql.includes('spaced')) {
      const n = findNote('fsrs');
      return { refs: n ? [n.id] : [], body: `From your notes, **FSRS** (Free Spaced Repetition Scheduler) models each memory with three variables:\n\n- **Stability (S)** — days until retention drops to 90%\n- **Difficulty (D)** — inherent hardness, 1–10\n- **Retrievability (R)** — current recall probability\n\nUnlike SM-2, it fits a curve to *your* review history and accounts for decay during the interval, not only at review time.` };
    }
    if (ql.includes('gradient')) { const n = findNote('gradient'); return { refs: n ? [n.id] : [], body: `Your note on **Gradient Descent** describes it as a first-order iterative optimizer with the update rule \`θ ← θ − η ∇L(θ)\`, where η is the learning rate.\n\nInterestingly, it shares a structural parallel with **Hebbian Learning** — both strengthen pathways incrementally toward a stable configuration.` }; }
    if (ql.includes('observer') && ql.includes('depend')) { return { refs: ['n-observer', 'n-di'], body: `Both patterns invert control, but differently:\n\n- **Observer Pattern** inverts *notification* — the subject doesn't know its observers' concrete types, it just broadcasts.\n- **Dependency Injection** inverts *construction* — an object receives its dependencies rather than creating them.\n\nThey're conceptually adjacent: both reduce coupling by removing hard-coded knowledge of collaborators.` }; }
    if (ql.includes('observer') || ql.includes('flashcard') && ql.includes('observer')) { const n = findNote('observer'); return { refs: n ? [n.id] : [], body: `Here are 5 flashcards drafted from **Observer Pattern**:\n\n1. *What problem does it solve?* → Notifying many dependents without tight coupling.\n2. *Name the two key participants.* → Subject and Observer.\n3. *Cloze:* The Subject maintains a list of [observers].\n4. *Code:* Sketch \`subscribe()\` and \`notifyAll()\`.\n5. *When prefer it?* → When dependents are dynamic or unknown at compile time.\n\nWant me to add these to your review queue?` }; }
    if (ql.includes('german') || ql.includes('a1')) { return { refs: ['n-modal'], body: `Here are A1 fill-in-the-blank exercises drawn from your **German Modal Verbs** note:\n\n1. Ich ____ heute Deutsch lernen. *(müssen)*\n2. ____ du Klavier spielen? *(können)*\n3. Wir ____ ins Kino gehen. *(wollen)*\n4. Man ____ hier nicht rauchen. *(dürfen)*\n5. Du ____ mehr üben. *(sollen)*\n\nRemember: the modal is conjugated in position 2, the main verb goes to the end as an infinitive.` }; }
    if (ql.includes('transformer') || ql.includes('missing') || ql.includes('gap')) { return { refs: ['n-transformer', 'n-attention'], body: `Looking at your Transformer notes, here are the gaps I see:\n\n- **Positional Encoding** is referenced 7× but only has 58 words.\n- **Layer Normalization** is a dangling concept — mentioned but undefined.\n- No note yet on **multi-head** mechanics specifically.\n\nYour vault doesn't contain notes on these in depth yet. Would you like me to draft stubs?` }; }
    return { refs: [], body: `Your vault doesn't contain notes directly answering that yet. I can give a general explanation, or help you create a note to capture it.\n\nTry asking about FSRS, Gradient Descent, the Observer Pattern, or German modal verbs — those are well-covered in your vault.` };
  }

  function ChatPage() {
    const app = useApp(); const D = window.MNEMOS_DATA;
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState(false);
    const scrollRef = useRef(null);
    const taRef = useRef(null);

    useEffect(() => { scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight); }, [messages, thinking]);

    const send = (text) => {
      const t = (text ?? input).trim(); if (!t || thinking) return;
      setMessages(m => [...m, { role: 'user', text: t }]);
      setInput(''); if (taRef.current) taRef.current.style.height = 'auto';
      setThinking(true);
      setTimeout(() => {
        const resp = buildResponse(t, D);
        setMessages(m => [...m, { role: 'assistant', text: resp.body, refs: resp.refs }]);
        setThinking(false);
      }, 900 + Math.random() * 600);
    };

    const empty = messages.length === 0;
    return React.createElement('div', { className: 'chat-page' },
      React.createElement('div', { className: 'chat-head' },
        React.createElement('div', { className: 'row gap-3 items-center' },
          React.createElement('div', { className: 'chat-mark' }, React.createElement(Icon, { name: 'ai', size: 18 })),
          React.createElement('div', null,
            React.createElement('div', { style: { fontWeight: 700, fontSize: 15 } }, 'Ask MNEMOS'),
            React.createElement('div', { className: 'text-tertiary', style: { fontSize: 12 } }, 'Context-aware · grounded in your vault'))),
        messages.length > 0 && React.createElement(Button, { variant: 'ghost', size: 'sm', icon: 'plus', onClick: () => setMessages([]) }, 'New chat')),

      React.createElement('div', { className: 'chat-scroll hide-scrollbar', ref: scrollRef },
        empty
          ? React.createElement('div', { className: 'chat-welcome' },
              React.createElement('div', { className: 'chat-welcome-mark' }, React.createElement(Icon, { name: 'sparkle', size: 28, fill: true })),
              React.createElement('h2', { className: 'serif', style: { fontSize: 28, margin: '0 0 8px' } }, 'Ask anything about your knowledge'),
              React.createElement('p', { className: 'text-secondary', style: { maxWidth: 460, margin: '0 auto var(--space-6)' } }, 'I read your vault. Every answer grounded in your notes is cited so you can verify it.'),
              React.createElement('div', { className: 'chat-suggestions' },
                D.chatSuggestions.map((s, i) => React.createElement('button', { key: i, className: 'chat-suggestion', onClick: () => send(s) },
                  React.createElement(Icon, { name: 'arrowRight', size: 15, style: { color: 'var(--accent)' } }), s))))
          : React.createElement('div', { className: 'chat-thread' },
              messages.map((m, i) => React.createElement('div', { key: i, className: `chat-msg chat-${m.role}` },
                m.role === 'assistant' && React.createElement('div', { className: 'chat-avatar' }, React.createElement(Icon, { name: 'ai', size: 15 })),
                React.createElement('div', { className: 'chat-bubble' },
                  m.role === 'assistant' ? React.createElement(Markdown, null, m.text) : React.createElement('p', { style: { margin: 0 } }, m.text),
                  m.refs && m.refs.length > 0 && React.createElement('div', { className: 'chat-refs' },
                    m.refs.map(id => { const n = D.noteById(id); return n && React.createElement('button', { key: id, className: 'chat-ref', onClick: () => app.openNote(id) },
                      React.createElement(Icon, { name: 'book', size: 13 }), 'From your notes: ', n.title); }))))),
              thinking && React.createElement('div', { className: 'chat-msg chat-assistant' },
                React.createElement('div', { className: 'chat-avatar' }, React.createElement(Icon, { name: 'ai', size: 15 })),
                React.createElement('div', { className: 'chat-bubble' },
                  React.createElement('div', { className: 'chat-typing' }, React.createElement('span', null), React.createElement('span', null), React.createElement('span', null)))))),

      React.createElement('div', { className: 'chat-input-wrap' },
        React.createElement('div', { className: 'chat-input-box' },
          React.createElement('textarea', { ref: taRef, className: 'chat-input', placeholder: 'Ask about your notes…', rows: 1,
            value: input, onChange: e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(140, e.target.scrollHeight) + 'px'; },
            onKeyDown: e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } } }),
          React.createElement('button', { className: 'chat-send', disabled: !input.trim() || thinking, onClick: () => send() }, React.createElement(Icon, { name: 'send', size: 17 }))),
        React.createElement('p', { className: 'chat-disclaimer' }, 'Answers are grounded in your vault and cited. MNEMOS won\u2019t invent sources.')));
  }

  window.Pages = window.Pages || {};
  window.Pages.Search = SearchPage;
  window.Pages.Chat = ChatPage;
})();
