/* ============================================================
   MNEMOS — Review Hub + Flashcard Session + Quiz Session
   ============================================================ */
(function () {
  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  const Icon = window.Icon;
  const { Button, IconButton, Panel, MemoryDot, MemoryBadge, Badge, Segmented, Markdown,
          ProgressBar, EmptyState, useToast } = window.UI;
  const { useApp } = window.Shell;

  /* ---------------- Review Hub ---------------- */
  function ReviewHub() {
    const app = useApp();
    const D = window.MNEMOS_DATA;
    const [mode, setMode] = useState('all');
    const [length, setLength] = useState(20);
    const [interleave, setInterleave] = useState(true);

    const overdue = D.cards.filter(c => new Date(c.due) < D.today);
    const dueTodayCards = D.cards.filter(c => { const d = new Date(c.due); return d.toDateString() === D.today.toDateString(); });

    const queues = [
      { key: 'overdue', label: 'Overdue', tone: 'danger', cards: overdue, color: 'var(--mem-fragile)' },
      { key: 'today', label: 'Due today', tone: 'gold', cards: dueTodayCards, color: 'var(--accent)' },
      { key: 'new', label: 'New cards', tone: 'accent', cards: [], color: 'var(--mem-strong)', count: D.stats.newConcepts, badge: '✦' },
    ];

    return React.createElement('div', { className: 'page rise' },
      React.createElement('div', { className: 'row between items-end mb-5 wrap gap-4' },
        React.createElement('div', null,
          React.createElement('div', { className: 'eyebrow mb-2' }, 'Review Hub'),
          React.createElement('h1', { className: 'serif', style: { fontSize: 36, margin: 0 } }, 'Today\u2019s Queue')),
        React.createElement('div', { className: 'review-hub-stat' },
          React.createElement('span', { className: 'stat-fig stat-lg' }, overdue.length + dueTodayCards.length),
          React.createElement('span', { className: 'stat-cap' }, 'cards waiting'))),

      React.createElement('div', { className: 'review-hub-grid' },
        /* Left: queue breakdown */
        React.createElement('div', { className: 'col gap-4' },
          queues.map(q => React.createElement(Panel, { key: q.key, className: 'review-queue-row' },
            React.createElement('span', { className: 'review-queue-bar', style: { background: q.color } }),
            React.createElement('div', { className: 'grow' },
              React.createElement('div', { className: 'row gap-2 items-center mb-1' },
                React.createElement('span', { className: 'review-queue-label' }, q.badge ? q.badge + ' ' : '', q.label),
                q.key === 'overdue' && q.cards.length > 0 && React.createElement(Badge, { tone: 'danger' }, 'Review now')),
              React.createElement('div', { className: 'review-queue-sub' },
                (q.count != null ? q.count : q.cards.length), ' ', (q.count != null ? q.count : q.cards.length) === 1 ? 'card' : 'cards',
                q.cards.length > 0 ? ' · ' + Array.from(new Set(q.cards.map(c => D.domainById(c.domain).name))).slice(0, 2).join(', ') : '')),
            React.createElement('span', { className: 'review-queue-num serif' }, q.count != null ? q.count : q.cards.length))),

          React.createElement(Panel, { className: 'mt-2' },
            React.createElement('div', { className: 'eyebrow mb-4' }, 'Spaced Repetition · Next 7 days'),
            React.createElement('div', { className: 'srs-week' },
              Array.from({ length: 7 }).map((_, i) => {
                const d = D.daysAhead(i);
                const heights = [24, 12, 31, 8, 18, 22, 14];
                const isToday = i === 0;
                return React.createElement('div', { key: i, className: 'srs-day' },
                  React.createElement('div', { className: 'srs-bar-wrap' },
                    React.createElement('div', { className: `srs-bar${isToday ? ' is-today' : ''}`, style: { height: (heights[i] / 31) * 100 + '%' } },
                      React.createElement('span', { className: 'srs-bar-num' }, heights[i]))),
                  React.createElement('span', { className: `srs-day-lbl${isToday ? ' is-today' : ''}` }, isToday ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' })));
              })))),

        /* Right: session config */
        React.createElement('div', null,
          React.createElement(Panel, { className: 'review-config' },
            React.createElement('div', { className: 'eyebrow mb-4' }, 'Configure Session'),
            React.createElement('label', { className: 'review-config-label' }, 'Focus'),
            React.createElement('div', { className: 'review-config-options mb-4' },
              [['all', 'All due', 'review'], ['cards', 'Flashcards', 'cards'], ['quiz', 'Quizzes', 'list'], ['lang', 'Language', 'globe']].map(([v, l, ic]) =>
                React.createElement('button', { key: v, className: `review-opt${mode === v ? ' is-active' : ''}`, onClick: () => setMode(v) },
                  React.createElement(Icon, { name: ic, size: 16 }), l))),
            React.createElement('label', { className: 'review-config-label' }, 'Session length'),
            React.createElement('div', { className: 'review-config-options mb-4' },
              [10, 20, 30, 50].map(n => React.createElement('button', { key: n, className: `review-opt${length === n ? ' is-active' : ''}`, onClick: () => setLength(n) }, n, ' cards'))),
            React.createElement('button', { className: 'review-toggle-row', onClick: () => setInterleave(v => !v) },
              React.createElement('div', null,
                React.createElement('div', { className: 'review-toggle-title' }, 'Interleaving'),
                React.createElement('div', { className: 'review-toggle-sub' }, 'Mix topics for stronger retention')),
              React.createElement('span', { className: `switch${interleave ? ' is-on' : ''}` }, React.createElement('span', { className: 'switch-thumb' }))),
            React.createElement(Button, { variant: 'primary', size: 'lg', full: true, iconRight: 'arrowRight', onClick: () => mode === 'quiz' ? app.navigate('review-quiz', { id: 'q-patterns' }) : app.navigate('review-cards'), style: { marginTop: 'var(--space-5)' } }, 'Start Review'),
            React.createElement('p', { className: 'review-config-foot' }, 'Estimated ~', Math.round(length * 0.4), ' minutes'))) ),

      /* Quizzes available */
      React.createElement('div', { className: 'mt-8' },
        React.createElement('div', { className: 'eyebrow mb-4' }, 'Quizzes'),
        React.createElement('div', { className: 'review-quiz-grid' },
          D.quizzes.map(qz => React.createElement('button', { key: qz.id, className: 'review-quiz-card panel-hover', onClick: () => app.navigate('review-quiz', { id: qz.id }) },
            React.createElement('div', { className: 'row between items-start mb-3' },
              React.createElement('span', { className: 'notecard-domain', style: { '--dc': D.domainById(qz.domain).color } }, D.domainById(qz.domain).name),
              React.createElement(Badge, { tone: 'neutral' }, qz.difficulty)),
            React.createElement('h3', { className: 'serif', style: { fontSize: 19, margin: '0 0 4px' } }, qz.title),
            React.createElement('p', { className: 'text-tertiary', style: { fontSize: 13, margin: 0 } }, qz.questionCount, ' questions · ', qz.attempts, ' attempts'),
            React.createElement('div', { className: 'row between items-center mt-4' },
              React.createElement('span', { className: 'text-tertiary', style: { fontSize: 12 } }, 'Last score'),
              React.createElement('span', { className: 'serif', style: { fontSize: 22, fontWeight: 700, color: qz.lastScore >= 70 ? 'var(--mem-mastered)' : 'var(--mem-moderate)' } }, qz.lastScore, '%')))))));
  }

  /* ---------------- Flashcard Session ---------------- */
  const RATINGS = [
    { v: 1, label: 'Blackout', sub: 'No recall', color: 'var(--mem-critical)', key: '1' },
    { v: 2, label: 'Fail', sub: 'Familiar', color: 'var(--mem-fragile)', key: '2' },
    { v: 3, label: 'Hard', sub: 'With effort', color: 'var(--mem-moderate)', key: '3' },
    { v: 4, label: 'Good', sub: 'Some effort', color: 'var(--mem-strong)', key: '4' },
    { v: 5, label: 'Easy', sub: 'Instant', color: 'var(--mem-mastered)', key: '5' },
  ];

  function FlashcardSession() {
    const app = useApp();
    const toast = useToast();
    const D = window.MNEMOS_DATA;
    const deck = useMemo(() => D.cards.filter(c => new Date(c.due) <= D.today), [D]);
    const [idx, setIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [results, setResults] = useState([]);
    const [done, setDone] = useState(false);
    const [startTime] = useState(Date.now());
    const cardStartRef = useRef(Date.now());

    const card = deck[idx];

    useEffect(() => { cardStartRef.current = Date.now(); }, [idx]);

    const rate = useCallback((v) => {
      if (!flipped || !card) return;
      // Persist the rating to the backend (FSRS reschedule + adaptive signals)
      if (window.API && window.API.rateCard) {
        const dur = Date.now() - cardStartRef.current;
        window.API.rateCard(card.id, v, dur).catch(() => toast('Could not save review', { tone: 'danger' }));
      }
      setResults(r => [...r, { id: card.id, rating: v }]);
      if (idx + 1 >= deck.length) { setDone(true); if (window.refreshAppData) window.refreshAppData(); }
      else { setIdx(i => i + 1); setFlipped(false); }
    }, [flipped, card, idx, deck.length, toast]);

    useEffect(() => {
      const onKey = (e) => {
        if (done) return;
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f => !f); }
        else if (['1', '2', '3', '4', '5'].includes(e.key) && flipped) { rate(parseInt(e.key)); }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [flipped, done, rate]);

    if (deck.length === 0) return React.createElement('div', { className: 'page' }, React.createElement(EmptyState, { icon: 'check', title: 'All caught up', body: 'No cards are due right now. Come back later or study ahead.', action: React.createElement(Button, { variant: 'primary', onClick: () => app.navigate('home') }, 'Back to dashboard') }));

    if (done) {
      const correct = results.filter(r => r.rating >= 3).length;
      const acc = Math.round((correct / results.length) * 100);
      const mins = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      return React.createElement('div', { className: 'session-stage' },
        React.createElement('div', { className: 'session-summary rise' },
          React.createElement('div', { className: 'session-summary-mark' }, React.createElement(Icon, { name: 'trophy', size: 30 })),
          React.createElement('div', { className: 'eyebrow mb-2', style: { textAlign: 'center' } }, 'Session complete'),
          React.createElement('h1', { className: 'serif', style: { fontSize: 34, textAlign: 'center', margin: '0 0 var(--space-6)' } }, 'Well done, ', D.profile.name, '.'),
          React.createElement('div', { className: 'session-summary-stats' },
            [['Cards reviewed', results.length], ['Accuracy', acc + '%'], ['Time', mins + ' min'], ['Streak', (D.stats.streak) + ' \uD83D\uDD25']].map(([l, v], i) =>
              React.createElement('div', { key: i, className: 'session-stat' },
                React.createElement('div', { className: 'stat-fig stat-md' }, v),
                React.createElement('div', { className: 'stat-cap mt-2' }, l)))),
          React.createElement('div', { className: 'session-insight' },
            React.createElement(Icon, { name: 'sparkle', size: 18, fill: true, style: { color: 'var(--accent)', flexShrink: 0 } }),
            React.createElement('p', { className: 'serif', style: { margin: 0, fontSize: 16 } }, D.insights[2].text)),
          React.createElement('div', { className: 'row gap-3 center mt-6' },
            React.createElement(Button, { variant: 'secondary', onClick: () => { setIdx(0); setFlipped(false); setResults([]); setDone(false); } }, 'Review again'),
            React.createElement(Button, { variant: 'primary', iconRight: 'arrowRight', onClick: () => app.navigate('home') }, 'Back to dashboard'))));
    }

    const dom = D.domainById(card.domain);
    return React.createElement('div', { className: 'session-stage' },
      React.createElement('div', { className: 'session-top' },
        React.createElement(IconButton, { name: 'x', label: 'Exit session', onClick: () => app.navigate('review') }),
        React.createElement('div', { className: 'session-progress' },
          React.createElement(ProgressBar, { value: idx, max: deck.length, height: 5 })),
        React.createElement('span', { className: 'session-counter tnum' }, idx + 1, ' / ', deck.length)),

      React.createElement('div', { className: 'session-body' },
        React.createElement('div', { className: `flashcard${flipped ? ' is-flipped' : ''}`, onClick: () => setFlipped(f => !f) },
          React.createElement('div', { className: 'flashcard-inner' },
            React.createElement('div', { className: 'flashcard-face flashcard-front' },
              React.createElement('div', { className: 'flashcard-tags' },
                React.createElement('span', { className: 'notecard-domain', style: { '--dc': dom.color } }, dom.name),
                React.createElement(Badge, { tone: 'neutral' }, card.type)),
              React.createElement('div', { className: 'flashcard-content serif' }, card.front),
              React.createElement('div', { className: 'flashcard-hint' }, React.createElement('span', null, 'Tap or press '), React.createElement('kbd', null, 'Space'), React.createElement('span', null, ' to reveal'))),
            React.createElement('div', { className: 'flashcard-face flashcard-back' },
              React.createElement('div', { className: 'flashcard-tags' },
                React.createElement('span', { className: 'eyebrow' }, 'Answer'),
                React.createElement('button', { className: 'flashcard-src', onClick: (e) => { e.stopPropagation(); app.openNote(card.noteId); } }, React.createElement(Icon, { name: 'book', size: 13 }), D.noteById(card.noteId).title)),
              React.createElement(Markdown, { className: 'flashcard-content' }, card.back))))),

      React.createElement('div', { className: 'session-foot' },
        !flipped
          ? React.createElement('div', { className: 'session-foot-pre' },
              React.createElement(Button, { variant: 'ghost', size: 'sm', icon: 'skip', onClick: () => rate(3) }, 'Skip'),
              React.createElement(Button, { variant: 'primary', size: 'lg', onClick: () => setFlipped(true) }, 'Show Answer'),
              React.createElement(Button, { variant: 'ghost', size: 'sm', icon: 'flag', onClick: () => toast('Card flagged for review', { icon: 'flag' }) }, 'Flag'))
          : React.createElement('div', { className: 'rating-row rise' },
              RATINGS.map(r => React.createElement('button', { key: r.v, className: 'rating-btn', style: { '--rc': r.color }, onClick: () => rate(r.v) },
                React.createElement('span', { className: 'rating-key' }, r.key),
                React.createElement('span', { className: 'rating-label' }, r.label),
                React.createElement('span', { className: 'rating-sub' }, r.sub))))));
  }

  /* ---------------- Quiz Session ---------------- */
  function QuizSession({ quizId }) {
    const app = useApp();
    const toast = useToast();
    const D = window.MNEMOS_DATA;
    const quiz = D.quizzes.find(q => q.id === quizId) || D.quizzes[0];
    const [idx, setIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [done, setDone] = useState(false);
    const [text, setText] = useState('');

    const q = quiz.questions[idx];
    const isLast = idx === quiz.questions.length - 1;

    const submit = () => setSubmitted(true);
    const next = () => {
      if (isLast) { setDone(true); }
      else { setIdx(i => i + 1); setSubmitted(false); setText(''); }
    };
    const choose = (val) => { if (!submitted) setAnswers(a => ({ ...a, [q.id]: val })); };

    const isCorrect = (question, ans) => {
      if (question.type === 'fill' || question.type === 'short') return (ans || '').trim().toLowerCase().includes(String(question.answer).toLowerCase().slice(0, 6));
      return ans === question.answer;
    };

    if (done) {
      const correct = quiz.questions.filter(qq => isCorrect(qq, answers[qq.id])).length;
      const score = Math.round((correct / quiz.questions.length) * 100);
      return React.createElement('div', { className: 'session-stage' },
        React.createElement('div', { className: 'page page-narrow rise', style: { width: '100%' } },
          React.createElement('div', { className: 'quiz-result-head' },
            React.createElement('div', { className: 'eyebrow mb-2' }, quiz.title, ' · Results'),
            React.createElement('div', { className: 'quiz-score-ring' },
              React.createElement('span', { className: 'serif', style: { fontSize: 46, fontWeight: 700 } }, score, '%'),
              React.createElement('span', { className: 'stat-cap' }, correct, ' of ', quiz.questions.length, ' correct'))),
          React.createElement('div', { className: 'quiz-retention' },
            React.createElement(Icon, { name: 'gauge', size: 18, style: { color: 'var(--accent)' } }),
            React.createElement('span', null, 'Estimated retention of this topic in 7 days: ', React.createElement('b', null, Math.round(score * 0.8), '%'))),
          React.createElement('div', { className: 'eyebrow mt-6 mb-4' }, 'Review answers'),
          React.createElement('div', { className: 'col gap-3' },
            quiz.questions.map((qq, i) => { const ok = isCorrect(qq, answers[qq.id]); return React.createElement('div', { key: qq.id, className: `quiz-review-item ${ok ? 'is-ok' : 'is-bad'}` },
              React.createElement('div', { className: 'row gap-3 items-start' },
                React.createElement('span', { className: `quiz-review-mark ${ok ? 'ok' : 'bad'}` }, React.createElement(Icon, { name: ok ? 'check' : 'x', size: 14 })),
                React.createElement('div', { className: 'grow' },
                  React.createElement('p', { className: 'quiz-review-q serif' }, i + 1, '. ', qq.prompt),
                  React.createElement('p', { className: 'quiz-review-exp' }, qq.explanation),
                  React.createElement('button', { className: 'quiz-review-src', onClick: () => app.navigate('library') }, 'Review source note →')))); })),
          React.createElement('div', { className: 'row gap-3 mt-6' },
            React.createElement(Button, { variant: 'secondary', icon: 'plus', onClick: () => toast('Missed concepts added to flashcard queue', { icon: 'check', tone: 'success' }) }, 'Add missed to flashcards'),
            React.createElement(Button, { variant: 'primary', onClick: () => app.navigate('review') }, 'Back to review hub'))));
    }

    return React.createElement('div', { className: 'session-stage' },
      React.createElement('div', { className: 'session-top' },
        React.createElement(IconButton, { name: 'x', label: 'Exit quiz', onClick: () => app.navigate('review') }),
        React.createElement('div', { className: 'session-progress' }, React.createElement(ProgressBar, { value: idx + (submitted ? 1 : 0), max: quiz.questions.length, height: 5 })),
        React.createElement('span', { className: 'session-counter tnum' }, 'Q', idx + 1, ' / ', quiz.questions.length)),
      React.createElement('div', { className: 'session-body' },
        React.createElement('div', { className: 'quiz-card rise', key: q.id },
          React.createElement('div', { className: 'row gap-2 mb-4' },
            React.createElement(Badge, { tone: 'accent' }, ({ mc: 'Multiple Choice', tf: 'True / False', fill: 'Fill in the Blank', short: 'Short Answer' })[q.type]),
            React.createElement(Badge, { tone: 'neutral' }, quiz.title)),
          React.createElement('h2', { className: 'quiz-prompt serif' }, q.prompt),
          (q.type === 'mc' || q.type === 'tf')
            ? React.createElement('div', { className: 'quiz-options' },
                q.options.map((opt, i) => {
                  const chosen = answers[q.id] === i;
                  let cls = 'quiz-option';
                  if (submitted) { if (i === q.answer) cls += ' is-correct'; else if (chosen) cls += ' is-wrong'; }
                  else if (chosen) cls += ' is-chosen';
                  return React.createElement('button', { key: i, className: cls, onClick: () => choose(i), disabled: submitted },
                    React.createElement('span', { className: 'quiz-option-key' }, String.fromCharCode(65 + i)),
                    React.createElement('span', { className: 'grow', style: { textAlign: 'left' } }, opt),
                    submitted && i === q.answer && React.createElement(Icon, { name: 'check', size: 17 }),
                    submitted && chosen && i !== q.answer && React.createElement(Icon, { name: 'x', size: 17 }));
                }))
            : React.createElement('div', null,
                React.createElement('input', { className: 'quiz-text-input', placeholder: 'Type your answer…', value: text, onChange: e => { setText(e.target.value); choose(e.target.value); }, disabled: submitted, autoFocus: true }),
                submitted && React.createElement('div', { className: 'quiz-answer-reveal' }, React.createElement('span', { className: 'eyebrow' }, 'Answer'), ' ', q.answer)),
          submitted && React.createElement('div', { className: 'quiz-explanation' },
            React.createElement(Icon, { name: 'info', size: 16, style: { flexShrink: 0, color: 'var(--accent)' } }),
            React.createElement('p', null, q.explanation)))),
      React.createElement('div', { className: 'session-foot' },
        React.createElement('div', { className: 'session-foot-pre' },
          React.createElement('span', { className: 'text-tertiary', style: { fontSize: 13 } }, 'Trust mode · no looking up answers'),
          !submitted
            ? React.createElement(Button, { variant: 'primary', size: 'lg', disabled: answers[q.id] == null || answers[q.id] === '', onClick: submit }, 'Submit')
            : React.createElement(Button, { variant: 'primary', size: 'lg', iconRight: 'arrowRight', onClick: next }, isLast ? 'See results' : 'Next question'))));
  }

  window.Pages = window.Pages || {};
  window.Pages.ReviewHub = ReviewHub;
  window.Pages.Flashcards = FlashcardSession;
  window.Pages.Quiz = QuizSession;
})();
