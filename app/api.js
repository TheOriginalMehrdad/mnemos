/* ============================================================
   ERUDITIO — API client + adapters
   Bridges the live REST API to the window.MNEMOS_DATA shape the
   pages consume. Keeps data/sampleData.js as the fallback scaffold.
   ============================================================ */
(function () {
  const BASE = window.ERUDITIO_API_BASE || 'http://localhost:3000';

  /* ---------------- low-level request ----------------
     Local single-user app: no auth, no tokens — just plain fetch. */
  async function request(path, opts) {
    opts = opts || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});

    const res = await fetch(BASE + path, Object.assign({}, opts, { headers }));

    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (_) { /* non-json */ }

    if (!res.ok) {
      const msg = (json && json.error && json.error.message) || ('HTTP ' + res.status);
      const e = new Error(msg); e.status = res.status; throw e;
    }
    if (!json) return null;
    return json.data !== undefined ? json.data : json;
  }

  const get = (p) => request(p, { method: 'GET' });
  const post = (p, body) => request(p, { method: 'POST', body: JSON.stringify(body || {}) });
  const put = (p, body) => request(p, { method: 'PUT', body: JSON.stringify(body || {}) });
  const patch = (p, body) => request(p, { method: 'PATCH', body: JSON.stringify(body || {}) });

  /* ---------------- helpers ---------------- */
  const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const round = (n) => Math.round(n || 0);
  const pct = (x, total) => (total > 0 ? Math.round((x / total) * 100) : 0);
  function relWhen(dueIso, now) {
    const days = Math.round((new Date(dueIso) - now) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'tomorrow';
    return 'in ' + days + ' days';
  }
  const memStateFn = () => (window.MNEMOS_DATA && window.MNEMOS_DATA.memoryState)
    ? window.MNEMOS_DATA.memoryState
    : (s) => ({ key: 'moderate', label: 'Moderate' });

  /* ---------------- transformers (API -> MNEMOS shape) ---------------- */
  function toDomain(d) {
    return { id: d.key, name: d.name, hue: d.hue, noteCount: d.noteCount, memory: round(d.memory), color: d.color };
  }
  function toNote(n) {
    return {
      id: n.id, slug: n.slug, title: n.title, domain: n.domain, topic: n.topic || '',
      status: (n.status || 'draft').replace(/_/g, '-'), language: n.language || 'en',
      difficulty: n.difficulty || 3, memory: round(n.memory), wordCount: n.wordCount || 0,
      readMinutes: n.readMinutes || 1, tags: n.tags || [], source: n.source || '',
      created: n.created, updated: n.updated, lastReviewed: n.lastReviewed || n.updated,
      links: n.links || [], excerpt: n.excerpt || '', content: n.content || '',
      memState: memStateFn()(round(n.memory)),
    };
  }
  function toCard(c, keyById) {
    return {
      id: c.id, noteId: c.noteId, type: c.type,
      domain: keyById[c.domainId] || (c.domain ? slugify(c.domain) : 'general'),
      topic: c.topic || '', front: c.front, back: c.back, due: c.due,
      interval: c.interval || 1, ease: c.ease || 2.5, reviews: c.reviews || 0,
      memory: round(c.memory), language: c.language || 'en',
    };
  }
  function toGraph(g) {
    return {
      nodes: (g.nodes || []).map((nd) => ({
        id: nd.id, label: nd.label, domain: nd.domain, level: 'note',
        connections: nd.connections || 0, memory: round(nd.memory != null ? nd.memory : nd.memoryScore),
        language: nd.language || 'en',
      })),
      edges: (g.edges || []).map((e) => ({ source: e.source, target: e.target, type: e.type || 'wikilink' })),
    };
  }
  function toLanguage(l) {
    return Object.assign({}, l, { grammarRadar: (l.grammarAxes || []).map((a) => ({ axis: a.axis, score: a.score })) });
  }
  function toProfile(me, fallback) {
    return Object.assign({}, fallback, {
      name: me.name, initials: me.initials, email: me.email, vaultPath: me.vaultPath || fallback.vaultPath,
      dailyGoalMin: me.dailyGoalMin, dailyNewCards: me.dailyNewCards, interleaving: me.interleaving,
      aiProvider: me.aiProvider || fallback.aiProvider, embeddingModel: me.embeddingModel || fallback.embeddingModel,
    });
  }
  function buildStats(sample, ov, today, domainsApi, cardsDue, topicsCount) {
    const reviewReady = (ov.strongCount || 0) + (ov.moderateCount || 0);
    const draft = (ov.fragileCount || 0) + (ov.criticalCount || 0);
    return Object.assign({}, sample, {
      cardsDue: cardsDue,
      newConcepts: today.newCards,
      streak: ov.currentStreak,
      longestStreak: ov.longestStreak,
      reviewedToday: today.reviewed,
      sessionTarget: Math.max(20, cardsDue),
      memoryHealth: ov.overallHealthScore,
      totalNotes: ov.totalNotes,
      mastered: ov.masteredCount, masteredPct: pct(ov.masteredCount, ov.totalNotes),
      reviewReady: reviewReady, reviewReadyPct: pct(reviewReady, ov.totalNotes),
      draft: draft, draftPct: pct(draft, ov.totalNotes),
      totalCardsEver: ov.totalCardsReviewed,
      accuracyRate: round((today.accuracy || 0) * 100),
      domainsCount: domainsApi.length || sample.domainsCount,
      topicsCount: topicsCount || sample.topicsCount,
      domainHealth: domainsApi.length
        ? domainsApi.map((d) => ({ name: d.name, score: round(d.memory), color: d.color }))
        : sample.domainHealth,
    });
  }

  /* ---------------- load + assemble window.MNEMOS_DATA ---------------- */
  async function loadAppData() {
    const D = window.MNEMOS_DATA;
    const safe = (p) => p.catch(() => null);
    const [notesRes, domainsApi, cardsApi, overview, today, langs, graphApi, me] = await Promise.all([
      safe(get('/notes?limit=500')),
      safe(get('/notes/domains')),
      safe(get('/cards')),
      safe(get('/progress/overview')),
      safe(get('/review/stats/today')),
      safe(get('/languages')),
      safe(get('/graph')),
      safe(get('/auth/me')),
    ]);

    const now = new Date();
    D.today = now;

    const notesArr = Array.isArray(notesRes) ? notesRes : (notesRes && notesRes.items) || [];
    const domainKeyById = {};
    (domainsApi || []).forEach((d) => { domainKeyById[d.id] = d.key; });

    const domains = (domainsApi || []).map(toDomain);
    if (domains.length) D.domains = domains;

    D.notes = notesArr.map(toNote);
    D.cards = (cardsApi || []).map((c) => toCard(c, domainKeyById));
    D.dueToday = D.cards.filter((c) => new Date(c.due) <= now);

    if (langs && langs.length) D.languages = langs.map(toLanguage);
    if (graphApi) D.graph = toGraph(graphApi);
    if (me) D.profile = toProfile(me, D.profile);

    const topicsCount = new Set(D.notes.map((n) => n.topic).filter(Boolean)).size;
    if (overview && today) D.stats = buildStats(D.stats, overview, today, domainsApi || [], D.dueToday.length, topicsCount);

    const noteIds = new Set(D.notes.map((n) => n.id));
    D.recentlyStudied = D.notes.slice()
      .sort((a, b) => new Date(b.lastReviewed || 0) - new Date(a.lastReviewed || 0))
      .slice(0, 3).map((n) => n.id);
    const seenUp = new Set();
    D.comingUp = D.cards.slice()
      .filter((c) => noteIds.has(c.noteId))
      .sort((a, b) => new Date(a.due) - new Date(b.due))
      .filter((c) => { if (seenUp.has(c.noteId)) return false; seenUp.add(c.noteId); return true; })
      .slice(0, 3).map((c) => ({ id: c.noteId, when: relWhen(c.due, now) }));
    const firstNote = D.notes[0];
    D.readingNow = firstNote
      ? { id: firstNote.id, chapter: firstNote.topic || firstNote.domain || 'Note', progress: firstNote.memory }
      : null;

    // Rebind helpers to the new arrays (with safe domain fallback)
    D.noteById = (id) => D.notes.find((n) => n.id === id);
    D.domainById = (id) => D.domains.find((d) => d.id === id)
      || { id: id, name: id || 'General', color: '#888888', hue: 0, memory: 50, noteCount: 0 };

    return D;
  }

  /* ---------------- public API ---------------- */
  window.API = {
    BASE: BASE,
    me: () => get('/auth/me'),
    // reads
    getNotes: () => get('/notes?limit=500'),
    getNote: (id) => get('/notes/' + id),
    getNoteLinks: (id) => get('/notes/' + id + '/links'),
    getNoteCards: (id) => get('/notes/' + id + '/cards'),
    getDomains: () => get('/notes/domains'),
    getCards: () => get('/cards'),
    getReviewQueue: () => get('/review/queue'),
    getGraph: () => get('/graph'),
    getProgressOverview: () => get('/progress/overview'),
    getStatsToday: () => get('/review/stats/today'),
    getLanguages: () => get('/languages'),
    vaultStatus: () => get('/vault/status'),
    // writes / actions
    rateCard: (id, rating, durationMs) => post('/review/' + id + '/rate', { rating: rating, durationMs: durationMs || 0 }),
    updateProfile: (body) => put('/user/profile', body),
    vaultConnect: (path) => post('/vault/connect', { path: path }),
    vaultSync: () => post('/vault/sync', {}),
    search: (query, mode) => post('/ai/search', { query: query, mode: mode }),
    dailyInsight: () => get('/ai/daily-insight'),
  };
  window.loadAppData = loadAppData;
})();
