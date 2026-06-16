/* ============================================================
   MNEMOS — Sample Data
   Realistic stand-in content powering every screen.
   Exposed as window.MNEMOS_DATA
   ============================================================ */
(function () {
  const today = new Date(2026, 5, 8); // Mon 8 June 2026
  const iso = (d) => d.toISOString();
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };
  const daysAhead = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

  /* ---------- Domains ---------- */
  const domains = [
    { id: 'se',  name: 'Software Engineering', hue: 38,  noteCount: 214, memory: 78, color: '#9A6E3A' },
    { id: 'ai',  name: 'Artificial Intelligence', hue: 18, noteCount: 186, memory: 71, color: '#A85C44' },
    { id: 'cog', name: 'Cognitive Science', hue: 168, noteCount: 92, memory: 66, color: '#3A7A78' },
    { id: 'de',  name: 'German Language', hue: 95, noteCount: 134, memory: 58, color: '#4A7C59' },
    { id: 'math', name: 'Mathematics', hue: 268, noteCount: 121, memory: 82, color: '#6B5B8A' },
    { id: 'sys', name: 'Systems & Networks', hue: 210, noteCount: 100, memory: 69, color: '#3A6A8A' },
  ];

  const memoryState = (score) => {
    if (score >= 90) return { key: 'mastered', label: 'Mastered' };
    if (score >= 70) return { key: 'strong',   label: 'Strong' };
    if (score >= 50) return { key: 'moderate', label: 'Moderate' };
    if (score >= 30) return { key: 'fragile',  label: 'Fragile' };
    return { key: 'critical', label: 'Critical' };
  };

  /* ---------- Notes ---------- */
  const notes = [
    {
      id: 'n-fsrs', slug: 'fsrs-algorithm', title: 'The FSRS Algorithm',
      domain: 'ai', topic: 'Spaced Repetition', status: 'review-ready', language: 'en',
      difficulty: 4, memory: 81, wordCount: 1240, readMinutes: 6,
      tags: ['spaced-repetition', 'memory', 'algorithms'],
      source: 'Jarrett Ye, "A Stochastic Shortest Path Algorithm for Spaced Repetition" (2022)',
      created: iso(daysAgo(120)), updated: iso(daysAgo(3)), lastReviewed: iso(daysAgo(1)),
      links: ['n-observer', 'n-gradient', 'n-hebbian', 'n-forgetting'],
      excerpt: 'FSRS models memory with three variables — stability, difficulty, and retrievability — to predict the optimal moment to review each card.',
      content: `# The FSRS Algorithm

The **Free Spaced Repetition Scheduler** (FSRS) is a modern alternative to the classic SM-2 algorithm used in Anki. Developed by Jarrett Ye in 2022, it learns your personal forgetting curve over time.

## The three core variables

FSRS models each memory with three quantities:

- **Stability (S)** — how long the memory will persist before forgetting, measured in days. Higher stability means longer intervals between reviews.
- **Difficulty (D)** — how inherently hard a concept is to remember, on a scale of 1.0 to 10.0. Higher difficulty leads to shorter future intervals.
- **Retrievability (R)** — the current probability that you can recall the item right now.

> The genius of FSRS is treating memory as a probabilistic system rather than a fixed schedule. Each review is a measurement that updates the model.

## Why it outperforms SM-2

SM-2 uses a single *ease factor* and a fixed set of multipliers. FSRS instead fits a curve to **your** review history, accounting for memory decay during the interval rather than only at review time.

\`\`\`python
def retrievability(t, stability):
    # probability of recall after t days
    return (1 + t / (9 * stability)) ** -1
\`\`\`

## Connection to learning science

This formalizes the [[Forgetting Curve]] first described by Ebbinghaus, and shares a deep structural parallel with [[Hebbian Learning]] — both describe how repeated activation strengthens a pathway.`
    },
    {
      id: 'n-observer', slug: 'observer-pattern', title: 'Observer Pattern',
      domain: 'se', topic: 'Design Patterns', status: 'mastered', language: 'en',
      difficulty: 3, memory: 93, wordCount: 880, readMinutes: 4,
      tags: ['design-patterns', 'oop', 'software-engineering'],
      source: 'Head First Design Patterns, Chapter 2',
      created: iso(daysAgo(200)), updated: iso(daysAgo(40)), lastReviewed: iso(daysAgo(8)),
      links: ['n-fsrs', 'n-di'],
      excerpt: 'Defines a one-to-many dependency so that when one object changes state, all its dependents are notified automatically.',
      content: `# Observer Pattern

The **Observer Pattern** defines a one-to-many dependency between objects so that when one object changes state, all of its dependents are notified and updated automatically.

## Problem it solves

It solves the problem of notifying multiple dependents when one object changes state **without tight coupling** between the subject and its observers.

## Structure

- **Subject** — maintains a list of observers and notifies them of changes.
- **Observer** — defines an updating interface for objects that should be notified.

\`\`\`kotlin
interface Observer { fun update(state: Int) }

class Subject {
    private val observers = mutableListOf<Observer>()
    fun subscribe(o: Observer) { observers.add(o) }
    fun notifyAll(state: Int) { observers.forEach { it.update(state) } }
}
\`\`\`

Closely related to [[Dependency Injection]] in how it inverts control.`
    },
    {
      id: 'n-gradient', slug: 'gradient-descent', title: 'Gradient Descent',
      domain: 'ai', topic: 'Optimization', status: 'review-ready', language: 'en',
      difficulty: 4, memory: 74, wordCount: 1020, readMinutes: 5,
      tags: ['optimization', 'machine-learning', 'calculus'],
      source: 'Deep Learning, Goodfellow et al., Chapter 4',
      created: iso(daysAgo(90)), updated: iso(daysAgo(10)), lastReviewed: iso(daysAgo(2)),
      links: ['n-fsrs', 'n-hebbian', 'n-attention'],
      excerpt: 'An iterative optimization algorithm that moves parameters in the direction of steepest descent of a loss function.',
      content: `# Gradient Descent

**Gradient descent** is a first-order iterative optimization algorithm for finding a local minimum of a differentiable function.

## The update rule

At each step, parameters move opposite the gradient of the loss:

\`\`\`
θ ← θ − η ∇L(θ)
\`\`\`

where η is the **learning rate**. Too large and you overshoot; too small and convergence crawls.

## Structural parallel

There is a surprising parallel with [[Hebbian Learning]]: both describe systems that **strengthen the pathways that fire together**, adjusting weights incrementally toward a more stable configuration.`
    },
    {
      id: 'n-hebbian', slug: 'hebbian-learning', title: 'Hebbian Learning',
      domain: 'cog', topic: 'Neural Plasticity', status: 'review-ready', language: 'en',
      difficulty: 3, memory: 62, wordCount: 640, readMinutes: 3,
      tags: ['neuroscience', 'learning', 'plasticity'],
      source: 'Hebb, "The Organization of Behavior" (1949)',
      created: iso(daysAgo(70)), updated: iso(daysAgo(20)), lastReviewed: iso(daysAgo(14)),
      links: ['n-gradient', 'n-fsrs', 'n-attention'],
      excerpt: '"Neurons that fire together, wire together" — repeated co-activation strengthens the synaptic connection.',
      content: `# Hebbian Learning

> *"Neurons that fire together, wire together."*

Hebbian theory proposes that the simultaneous activation of two neurons strengthens the synaptic connection between them. It is one of the conceptual precursors to modern [[Gradient Descent]]-based neural network training.`
    },
    {
      id: 'n-attention', slug: 'attention-mechanisms', title: 'Attention Mechanisms',
      domain: 'ai', topic: 'Transformers', status: 'review-ready', language: 'en',
      difficulty: 5, memory: 68, wordCount: 1480, readMinutes: 7,
      tags: ['transformers', 'deep-learning', 'nlp'],
      source: 'Vaswani et al., "Attention Is All You Need" (2017)',
      created: iso(daysAgo(60)), updated: iso(daysAgo(5)), lastReviewed: iso(daysAgo(4)),
      links: ['n-gradient', 'n-transformer', 'n-selective'],
      excerpt: 'A mechanism that lets a model weigh the relevance of every input token when producing each output token.',
      content: `# Attention Mechanisms

**Attention** lets a model dynamically weigh the relevance of every input element when producing each output element.

## Scaled dot-product attention

\`\`\`
Attention(Q, K, V) = softmax(QKᵀ / √dₖ) V
\`\`\`

The query–key dot products produce weights; the weighted sum of values is the output.

This has a structural parallel with [[Selective Attention]] from cognitive psychology — both describe selectively amplifying relevant signals and suppressing the rest. See also [[Transformer Architecture]].`
    },
    {
      id: 'n-transformer', slug: 'transformer-architecture', title: 'Transformer Architecture',
      domain: 'ai', topic: 'Transformers', status: 'draft', language: 'en',
      difficulty: 5, memory: 41, wordCount: 1860, readMinutes: 9,
      tags: ['transformers', 'deep-learning', 'architecture'],
      source: 'Vaswani et al., "Attention Is All You Need" (2017)',
      created: iso(daysAgo(30)), updated: iso(daysAgo(1)), lastReviewed: iso(daysAgo(22)),
      links: ['n-attention'],
      excerpt: 'A sequence-to-sequence architecture built entirely on attention, dispensing with recurrence and convolution.',
      content: `# Transformer Architecture

Currently reading — Chapter 3.

The **Transformer** is a sequence transduction architecture built entirely on [[Attention Mechanisms]], dispensing with recurrence and convolution entirely.

## Components

- Multi-head self-attention
- Position-wise feed-forward networks
- Positional encodings
- Residual connections + layer normalization`
    },
    {
      id: 'n-selective', slug: 'selective-attention', title: 'Selective Attention',
      domain: 'cog', topic: 'Perception', status: 'review-ready', language: 'en',
      difficulty: 2, memory: 71, wordCount: 720, readMinutes: 4,
      tags: ['psychology', 'perception', 'attention'],
      source: 'Broadbent, "Perception and Communication" (1958)',
      created: iso(daysAgo(50)), updated: iso(daysAgo(25)), lastReviewed: iso(daysAgo(9)),
      links: ['n-attention'],
      excerpt: 'The cognitive process of selectively concentrating on one aspect of the environment while ignoring others.',
      content: `# Selective Attention

The cognitive process of selectively concentrating on one stimulus while filtering out others — the "cocktail party effect." A precursor metaphor for [[Attention Mechanisms]] in machine learning.`
    },
    {
      id: 'n-di', slug: 'dependency-injection', title: 'Dependency Injection',
      domain: 'se', topic: 'Design Patterns', status: 'mastered', language: 'en',
      difficulty: 3, memory: 88, wordCount: 760, readMinutes: 4,
      tags: ['design-patterns', 'architecture', 'ioc'],
      source: 'Martin Fowler, "Inversion of Control Containers" (2004)',
      created: iso(daysAgo(180)), updated: iso(daysAgo(60)), lastReviewed: iso(daysAgo(11)),
      links: ['n-observer'],
      excerpt: 'A technique where an object receives its dependencies from outside rather than constructing them itself.',
      content: `# Dependency Injection

A technique in which an object receives the other objects it depends on (its *dependencies*) from an external source rather than creating them internally. A specific form of Inversion of Control, conceptually adjacent to the [[Observer Pattern]].`
    },
    {
      id: 'n-dijkstra', slug: 'dijkstra-algorithm', title: "Dijkstra's Algorithm",
      domain: 'se', topic: 'Algorithms', status: 'review-ready', language: 'en',
      difficulty: 4, memory: 76, wordCount: 940, readMinutes: 5,
      tags: ['algorithms', 'graphs', 'shortest-path'],
      source: 'Introduction to Algorithms (CLRS), Chapter 24',
      created: iso(daysAgo(110)), updated: iso(daysAgo(15)), lastReviewed: iso(daysAgo(6)),
      links: [],
      excerpt: 'Finds the shortest paths from a source node to all others in a weighted graph with non-negative edges.',
      content: `# Dijkstra's Algorithm

Finds shortest paths from a single source to all other vertices in a graph with non-negative edge weights, using a priority queue to greedily expand the closest unvisited node.`
    },
    {
      id: 'n-modal', slug: 'german-modal-verbs', title: 'German Modal Verbs',
      domain: 'de', topic: 'Grammar', status: 'review-ready', language: 'de',
      difficulty: 2, memory: 54, wordCount: 540, readMinutes: 3,
      tags: ['german', 'grammar', 'verbs', 'a1'],
      source: 'Menschen A1, Lektion 7',
      created: iso(daysAgo(45)), updated: iso(daysAgo(7)), lastReviewed: iso(daysAgo(1)),
      links: ['n-a1vocab'],
      excerpt: 'The six modal verbs (können, müssen, wollen, sollen, dürfen, mögen) express ability, necessity, and desire.',
      content: `# German Modal Verbs (Modalverben)

The six German modal verbs modify the meaning of a main verb. The main verb goes to the **end** of the clause in its infinitive form.

| Verb | Meaning | ich-form |
|------|---------|----------|
| können | can / be able to | kann |
| müssen | must / have to | muss |
| wollen | want to | will |
| sollen | should | soll |
| dürfen | may / be allowed | darf |
| mögen | to like | mag |

> *Ich **muss** heute Deutsch **lernen**.* — I have to study German today.`
    },
    {
      id: 'n-a1vocab', slug: 'german-a1-vocabulary', title: 'German A1 Core Vocabulary',
      domain: 'de', topic: 'Vocabulary', status: 'draft', language: 'de',
      difficulty: 1, memory: 47, wordCount: 410, readMinutes: 2,
      tags: ['german', 'vocabulary', 'a1'],
      source: 'Goethe-Institut A1 word list',
      created: iso(daysAgo(40)), updated: iso(daysAgo(2)), lastReviewed: iso(daysAgo(1)),
      links: ['n-modal'],
      excerpt: 'The foundational 650-word vocabulary set for CEFR A1 certification.',
      content: `# German A1 Core Vocabulary

A running list of the foundational A1 vocabulary, grouped by theme: greetings, family, food, numbers, time, and everyday verbs.`
    },
    {
      id: 'n-forgetting', slug: 'forgetting-curve', title: 'The Forgetting Curve',
      domain: 'cog', topic: 'Memory', status: 'mastered', language: 'en',
      difficulty: 2, memory: 91, wordCount: 580, readMinutes: 3,
      tags: ['memory', 'learning', 'ebbinghaus'],
      source: 'Ebbinghaus, "Über das Gedächtnis" (1885)',
      created: iso(daysAgo(140)), updated: iso(daysAgo(70)), lastReviewed: iso(daysAgo(5)),
      links: ['n-fsrs'],
      excerpt: 'Memory retention declines exponentially over time unless reinforced, as first measured by Ebbinghaus.',
      content: `# The Forgetting Curve

Hermann Ebbinghaus demonstrated that memory retention declines exponentially over time. Each successful review **flattens** the curve, extending the interval before the next review is needed — the foundational insight behind [[The FSRS Algorithm]].`
    },
  ];

  notes.forEach(n => { n.memState = memoryState(n.memory); });

  /* ---------- Flashcards ---------- */
  const cards = [
    { id: 'c1', noteId: 'n-fsrs', type: 'basic', domain: 'ai', topic: 'Spaced Repetition',
      front: 'What is the difference between Stability and Difficulty in the FSRS algorithm?',
      back: '**Stability (S)** is how long a memory will persist before forgetting (in days) — higher S means longer intervals.\n\n**Difficulty (D)** is how inherently hard a concept is to remember — higher D means shorter future intervals.',
      due: iso(today), interval: 12, ease: 2.6, reviews: 5, memory: 81 },
    { id: 'c2', noteId: 'n-fsrs', type: 'cloze', domain: 'ai', topic: 'Spaced Repetition',
      front: 'In FSRS, the parameter [___] represents how quickly a memory decays between reviews.',
      back: 'In FSRS, the parameter **stability (S)** represents how quickly a memory decays between reviews.',
      due: iso(today), interval: 8, ease: 2.5, reviews: 3, memory: 74 },
    { id: 'c3', noteId: 'n-observer', type: 'basic', domain: 'se', topic: 'Design Patterns',
      front: 'What problem does the Observer Pattern solve?',
      back: 'It solves the problem of notifying multiple dependents when one object changes state, **without tight coupling** between subject and observers.',
      due: iso(today), interval: 30, ease: 2.9, reviews: 8, memory: 93 },
    { id: 'c4', noteId: 'n-observer', type: 'code', domain: 'se', topic: 'Design Patterns',
      front: 'Implement a function that reverses a singly linked list in Kotlin.',
      back: '```kotlin\nfun reverseList(head: ListNode?): ListNode? {\n    var prev: ListNode? = null\n    var current = head\n    while (current != null) {\n        val next = current.next\n        current.next = prev\n        prev = current\n        current = next\n    }\n    return prev\n}\n```',
      due: iso(daysAgo(1)), interval: 5, ease: 2.4, reviews: 4, memory: 67 },
    { id: 'c5', noteId: 'n-gradient', type: 'cloze', domain: 'ai', topic: 'Optimization',
      front: 'The gradient descent update rule is θ ← θ − [___] ∇L(θ), where the bracketed term is the ____.',
      back: 'The update rule is θ ← θ − **η** ∇L(θ), where **η** is the **learning rate**.',
      due: iso(today), interval: 6, ease: 2.5, reviews: 3, memory: 71 },
    { id: 'c6', noteId: 'n-hebbian', type: 'basic', domain: 'cog', topic: 'Neural Plasticity',
      front: 'State Hebb\'s rule in one sentence.',
      back: '"Neurons that fire together, wire together" — simultaneous activation of two neurons strengthens the synaptic connection between them.',
      due: iso(today), interval: 4, ease: 2.3, reviews: 2, memory: 62 },
    { id: 'c7', noteId: 'n-attention', type: 'formula', domain: 'ai', topic: 'Transformers',
      front: 'Write the scaled dot-product attention formula.',
      back: 'Attention(Q, K, V) = softmax(QKᵀ / √dₖ) V',
      due: iso(today), interval: 7, ease: 2.5, reviews: 3, memory: 68 },
    { id: 'c8', noteId: 'n-modal', type: 'translation', domain: 'de', topic: 'Grammar', language: 'de',
      front: 'I have to study German today.',
      back: 'Ich **muss** heute Deutsch **lernen**.',
      due: iso(today), interval: 3, ease: 2.2, reviews: 2, memory: 54 },
    { id: 'c9', noteId: 'n-modal', type: 'definition', domain: 'de', topic: 'Grammar', language: 'de',
      front: 'können', back: 'can / to be able to — *ich kann*',
      due: iso(today), interval: 2, ease: 2.1, reviews: 1, memory: 49 },
    { id: 'c10', noteId: 'n-dijkstra', type: 'basic', domain: 'se', topic: 'Algorithms',
      front: 'What is the time complexity of Dijkstra\'s algorithm with a binary heap?',
      back: 'O((V + E) log V), where V is the number of vertices and E the number of edges.',
      due: iso(daysAgo(2)), interval: 9, ease: 2.6, reviews: 4, memory: 76 },
    { id: 'c11', noteId: 'n-forgetting', type: 'basic', domain: 'cog', topic: 'Memory',
      front: 'According to Ebbinghaus, how does memory retention change over time without review?',
      back: 'It declines **exponentially** — most forgetting happens shortly after learning, then levels off. Each review flattens the curve.',
      due: iso(today), interval: 21, ease: 2.8, reviews: 7, memory: 91 },
    { id: 'c12', noteId: 'n-di', type: 'basic', domain: 'se', topic: 'Design Patterns',
      front: 'Dependency Injection is a specific form of which broader principle?',
      back: '**Inversion of Control (IoC)** — dependencies are supplied from outside rather than created internally.',
      due: iso(today), interval: 14, ease: 2.7, reviews: 6, memory: 88 },
  ];

  /* Build a "due today" queue with interleaving */
  const dueToday = cards.filter(c => new Date(c.due) <= today);

  /* ---------- Quizzes ---------- */
  const quizzes = [
    {
      id: 'q-patterns', title: 'Design Patterns', domain: 'se', topic: 'Design Patterns',
      questionCount: 5, lastScore: 80, attempts: 3, difficulty: 'Mixed',
      questions: [
        { id: 'qq1', type: 'mc', prompt: 'What is the primary intent of the Observer Pattern?',
          options: [
            'To create objects without specifying their concrete classes',
            'To define a one-to-many dependency so dependents are notified of state changes',
            'To provide a simplified interface to a complex subsystem',
            'To ensure a class has only one instance' ],
          answer: 1, explanation: 'Observer defines a one-to-many dependency so that when the subject changes state, all observers are notified automatically.' },
        { id: 'qq2', type: 'tf', prompt: 'The Observer Pattern tightly couples the subject to its concrete observers.',
          options: ['True', 'False'], answer: 1,
          explanation: 'False — the whole point is loose coupling. The subject only knows observers implement a common interface.' },
        { id: 'qq3', type: 'fill', prompt: 'Dependency Injection is a specific form of ______ of Control.',
          answer: 'Inversion', explanation: 'Dependency Injection is a form of Inversion of Control (IoC).' },
        { id: 'qq4', type: 'mc', prompt: 'Which participant maintains the list of subscribers in the Observer Pattern?',
          options: ['Observer', 'Subject', 'Mediator', 'Adapter'], answer: 1,
          explanation: 'The Subject maintains the observer list and issues notifications.' },
        { id: 'qq5', type: 'short', prompt: 'In one sentence, when would you prefer the Observer Pattern over direct method calls?',
          answer: 'When multiple objects must react to a change without the source knowing their concrete types.',
          explanation: 'Observer shines when the set of dependents is dynamic or unknown at compile time.' },
      ]
    },
    {
      id: 'q-fsrs', title: 'Spaced Repetition Science', domain: 'ai', topic: 'Spaced Repetition',
      questionCount: 4, lastScore: 75, attempts: 2, difficulty: 'Hard',
      questions: [
        { id: 'fq1', type: 'mc', prompt: 'Which variable in FSRS represents the probability of recall right now?',
          options: ['Stability', 'Difficulty', 'Retrievability', 'Ease factor'], answer: 2,
          explanation: 'Retrievability (R) is the current probability of successful recall.' },
        { id: 'fq2', type: 'tf', prompt: 'FSRS accounts for memory decay during the interval, not only at review time.',
          options: ['True', 'False'], answer: 0,
          explanation: 'True — modeling decay throughout the interval is a key advantage over SM-2.' },
        { id: 'fq3', type: 'fill', prompt: 'Higher card ______ leads to shorter future review intervals.',
          answer: 'difficulty', explanation: 'Difficulty (D) shortens intervals; stability (S) lengthens them.' },
        { id: 'fq4', type: 'mc', prompt: 'Interleaving improves long-term retention versus blocked practice by roughly:',
          options: ['5%', '20%', '43%', 'No measurable difference'], answer: 2,
          explanation: 'Kornell & Bjork (2008) found ~43% improvement from interleaving.' },
      ]
    },
    {
      id: 'q-german', title: 'German A1 Modal Verbs', domain: 'de', topic: 'Grammar',
      questionCount: 4, lastScore: 50, attempts: 1, difficulty: 'A1',
      questions: [
        { id: 'gq1', type: 'mc', prompt: 'Choose the correct sentence:',
          options: ['Ich kann Deutsch sprechen.', 'Ich kann sprechen Deutsch.', 'Ich Deutsch sprechen kann.', 'Sprechen ich kann Deutsch.'],
          answer: 0, explanation: 'The modal verb is conjugated in position 2; the main verb (infinitive) goes to the end.' },
        { id: 'gq2', type: 'fill', prompt: 'Fill the blank: Wir ____ heute arbeiten. (must)',
          answer: 'müssen', explanation: '"müssen" = must. With "wir" it is "müssen".' },
        { id: 'gq3', type: 'mc', prompt: 'What does "dürfen" express?',
          options: ['Ability', 'Permission', 'Obligation', 'Desire'], answer: 1,
          explanation: '"dürfen" expresses permission (may / be allowed to).' },
        { id: 'gq4', type: 'tf', prompt: 'In a modal-verb sentence, the main verb stays in its infinitive form.',
          options: ['True', 'False'], answer: 0,
          explanation: 'True — the main verb appears as an infinitive at the end of the clause.' },
      ]
    },
  ];

  /* ---------- Insights (cross-topic connections) ---------- */
  const insights = [
    { id: 'i1', surprise: 0.91, a: 'n-attention', b: 'n-selective',
      aLabel: 'Attention Mechanisms', aDomain: 'AI', bLabel: 'Selective Attention', bDomain: 'Cognitive Science',
      text: 'Your note on Attention Mechanisms and your note on Selective Attention share a structural parallel: both describe selectively amplifying relevant signals while suppressing the rest. The ML mechanism was, in part, inspired by the cognitive one.' },
    { id: 'i2', surprise: 0.88, a: 'n-hebbian', b: 'n-gradient',
      aLabel: 'Hebbian Learning', aDomain: 'Cognitive Science', bLabel: 'Gradient Descent', bDomain: 'AI',
      text: 'Hebbian Learning and Gradient Descent share a surprisingly deep structural parallel — both describe how systems strengthen the pathways that fire together. Hebbian learning was one of the conceptual precursors to modern neural network training.' },
    { id: 'i3', surprise: 0.79, a: 'n-fsrs', b: 'n-forgetting',
      aLabel: 'The FSRS Algorithm', aDomain: 'AI', bLabel: 'The Forgetting Curve', bDomain: 'Cognitive Science',
      text: 'FSRS is a direct computational descendant of Ebbinghaus\'s Forgetting Curve — it fits a personalized decay function to the very phenomenon Ebbinghaus first measured by hand in 1885.' },
  ];

  /* ---------- Knowledge gaps ---------- */
  const gaps = {
    dangling: [
      { id: 'g1', term: 'RAFT Consensus', mentions: 4, notes: ['Systems Design', 'Distributed Logs', 'etcd Internals', 'Leader Election'] },
      { id: 'g2', term: 'Catastrophic Forgetting', mentions: 3, notes: ['Continual Learning', 'Hebbian Learning', 'Fine-tuning'] },
      { id: 'g3', term: 'CAP Theorem', mentions: 5, notes: ['Distributed Systems', 'Databases', 'Consistency Models', 'NoSQL', 'Replication'] },
    ],
    shallow: [
      { id: 'g4', title: 'Layer Normalization', refs: 9, words: 42 },
      { id: 'g5', title: 'Positional Encoding', refs: 7, words: 58 },
      { id: 'g6', title: 'B-Trees', refs: 6, words: 31 },
    ],
    unlinked: [
      { id: 'g7', term: 'Gradient Descent', inNote: 'Backpropagation', count: 3 },
      { id: 'g8', term: 'Observer Pattern', inNote: 'Event Systems', count: 2 },
    ],
    stale: [
      { id: 'g9', title: 'Transformer Architecture', days: 22, importance: 'high', memory: 41 },
      { id: 'g10', title: 'Kubernetes Networking', days: 74, importance: 'high', memory: 38 },
      { id: 'g11', title: 'German A1 Vocabulary', days: 1, importance: 'medium', memory: 47 },
    ],
  };

  /* ---------- Learning plans ---------- */
  const plans = [
    { id: 'p1', title: 'Master Transformer Architecture', goal: 'Understand transformer internals deeply enough to implement one from scratch',
      status: 'active', progress: 45, totalSteps: 11, doneSteps: 5, daysPerDay: 25, domain: 'ai',
      milestones: [
        { name: 'Foundations of attention', done: true },
        { name: 'Multi-head & self-attention', done: true },
        { name: 'Positional encodings', done: false, current: true },
        { name: 'Full encoder–decoder stack', done: false },
        { name: 'Implement & train a mini-transformer', done: false },
      ],
      sequence: ['n-gradient', 'n-attention', 'n-selective', 'n-transformer'] },
    { id: 'p2', title: 'Reach German B1', goal: 'Progress from A1 to B1 conversational German over 6 months',
      status: 'active', progress: 22, totalSteps: 24, doneSteps: 5, daysPerDay: 15, domain: 'de',
      milestones: [
        { name: 'A1 core vocabulary (650 words)', done: true },
        { name: 'Present tense & modal verbs', done: false, current: true },
        { name: 'Perfekt past tense', done: false },
        { name: 'A2 vocabulary expansion', done: false },
      ],
      sequence: ['n-a1vocab', 'n-modal'] },
    { id: 'p3', title: 'Distributed Systems Fundamentals', goal: 'Build a solid mental model of consensus, replication, and consistency',
      status: 'paused', progress: 60, totalSteps: 9, doneSteps: 5, daysPerDay: 30, domain: 'sys',
      milestones: [
        { name: 'Consistency models', done: true },
        { name: 'Replication strategies', done: true },
        { name: 'Consensus (Paxos / Raft)', done: false, current: true },
      ],
      sequence: ['n-dijkstra'] },
  ];

  /* ---------- Language profiles ---------- */
  const languages = [
    { code: 'de', name: 'German', flag: '🇩🇪', cefr: 'A1', target: 'B1', vocab: 412, vocabTarget: 1300,
      grammar: 38, reading: 52, newWordsToday: 8, streak: 7,
      grammarRadar: [
        { axis: 'Verbs', score: 55 }, { axis: 'Cases', score: 30 }, { axis: 'Articles', score: 42 },
        { axis: 'Word Order', score: 48 }, { axis: 'Prepositions', score: 28 }, { axis: 'Adjectives', score: 35 },
      ] },
    { code: 'en', name: 'English', flag: '🇬🇧', cefr: 'B2', target: 'C1', vocab: 6800, vocabTarget: 8000,
      grammar: 82, reading: 88, newWordsToday: 3, streak: 7,
      grammarRadar: [
        { axis: 'Tenses', score: 88 }, { axis: 'Conditionals', score: 76 }, { axis: 'Phrasals', score: 70 },
        { axis: 'Articles', score: 90 }, { axis: 'Idioms', score: 64 }, { axis: 'Register', score: 80 },
      ] },
  ];

  /* ---------- Stats / analytics ---------- */
  const streakDays = (() => {
    const arr = [];
    for (let i = 363; i >= 0; i--) {
      const d = daysAgo(i);
      const seed = Math.sin(i * 12.9898) * 43758.5453;
      const r = seed - Math.floor(seed);
      let count = 0;
      if (i <= 6) count = [18, 24, 31, 12, 27, 22, 24][6 - i] || 20; // recent week solid
      else if (r > 0.78) count = 0;
      else count = Math.floor(r * 45) + 3;
      arr.push({ date: iso(d), count });
    }
    return arr;
  })();

  const retentionTrend = Array.from({ length: 90 }, (_, i) => {
    const base = 68 + Math.sin(i / 9) * 6 + (i / 90) * 8;
    return { day: i, value: Math.round(Math.min(95, Math.max(55, base + (Math.sin(i * 3.1) * 2)))) };
  });

  const reviewsPerDay = Array.from({ length: 30 }, (_, i) => {
    const seed = Math.sin((i + 1) * 7.13) * 1000;
    const r = seed - Math.floor(seed);
    return { day: i, count: Math.floor(r * 40) + 8 };
  });

  const studyMinutes = Array.from({ length: 30 }, (_, i) => {
    const seed = Math.sin((i + 1) * 4.77) * 1000;
    const r = seed - Math.floor(seed);
    return { day: i, minutes: Math.floor(r * 35) + 5 };
  });

  const stats = {
    cardsDue: dueToday.length,
    newConcepts: 3,
    streak: 7,
    longestStreak: 41,
    studiedYesterday: 22,
    reviewedToday: 12,
    sessionTarget: 24,
    memoryHealth: 74,
    totalNotes: 847,
    mastered: 412, masteredPct: 49,
    reviewReady: 287, reviewReadyPct: 34,
    draft: 148, draftPct: 17,
    totalCardsEver: 18420,
    masteredThisMonth: 96,
    accuracyRate: 84,
    domainsCount: 12,
    topicsCount: 94,
    records: [
      { label: 'Most cards in a day', value: '147' },
      { label: 'Longest streak', value: '41 days' },
      { label: 'Best week accuracy', value: '94%' },
      { label: 'Fastest review', value: '1.8s avg' },
    ],
    retentionTrend, reviewsPerDay, studyMinutes,
    domainHealth: domains.map(d => ({ name: d.name, score: d.memory, color: d.color })),
  };

  /* ---------- Graph ---------- */
  const graph = {
    nodes: notes.map(n => ({
      id: n.id, label: n.title, domain: n.domain, level: 'note',
      connections: n.links.length, memory: n.memory, language: n.language,
    })),
    edges: (() => {
      const e = [];
      const seen = new Set();
      notes.forEach(n => n.links.forEach(t => {
        const key = [n.id, t].sort().join('|');
        if (!seen.has(key)) { seen.add(key); e.push({ source: n.id, target: t, type: 'wikilink' }); }
      }));
      // a couple semantic edges
      e.push({ source: 'n-attention', target: 'n-hebbian', type: 'semantic' });
      e.push({ source: 'n-dijkstra', target: 'n-observer', type: 'tag' });
      return e;
    })(),
  };

  /* ---------- AI chat seed ---------- */
  const chatSuggestions = [
    'What do my notes say about FSRS?',
    'Summarize my notes on Gradient Descent',
    'Create 5 flashcards from the Observer Pattern note',
    'How is Dependency Injection related to the Observer Pattern?',
    'Give me 10 German A1 fill-in-the-blank exercises',
    'What am I missing from my notes on Transformers?',
  ];

  /* ---------- Recent activity ---------- */
  const recentlyStudied = ['n-fsrs', 'n-modal', 'n-gradient'];
  const comingUp = [
    { id: 'n-observer', when: 'in 2 days' },
    { id: 'n-dijkstra', when: 'in 3 days' },
    { id: 'n-a1vocab', when: 'today' },
  ];
  const readingNow = { id: 'n-transformer', chapter: 'Chapter 3', progress: 34 };

  /* ---------- Profile ---------- */
  const profile = {
    name: 'Mehrdad', initials: 'M', email: 'mehrdad@vault.local',
    vaultPath: '~/Documents/ObsidianVault', dailyGoalMin: 30, dailyNewCards: 15,
    interleaving: true, theme: 'system', aiProvider: 'Ollama (local)', embeddingModel: 'nomic-embed-text',
  };

  window.MNEMOS_DATA = {
    today, iso, daysAgo, daysAhead, memoryState,
    domains, notes, cards, dueToday, quizzes, insights, gaps, plans, languages,
    stats, graph, chatSuggestions, recentlyStudied, comingUp, readingNow, profile,
    noteById: (id) => notes.find(n => n.id === id),
    domainById: (id) => domains.find(d => d.id === id),
  };
})();
