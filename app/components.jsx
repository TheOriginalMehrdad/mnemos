/* ============================================================
   MNEMOS — Shared UI components
   ============================================================ */
(function () {
  const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;
  const Icon = window.Icon;

  /* ---------- Button ---------- */
  function Button({ children, variant = 'primary', size = 'md', icon, iconRight, full, as = 'button', ...rest }) {
    const cls = `btn btn-${variant} btn-${size}${full ? ' btn-full' : ''}`;
    const El = as;
    return React.createElement(El, { className: cls, ...rest },
      icon && React.createElement(Icon, { name: icon, size: size === 'sm' ? 15 : 17 }),
      children != null && React.createElement('span', null, children),
      iconRight && React.createElement(Icon, { name: iconRight, size: size === 'sm' ? 15 : 17 }),
    );
  }

  /* ---------- IconButton ---------- */
  function IconButton({ name, size = 18, label, active, ...rest }) {
    return React.createElement('button', {
      className: `icon-btn${active ? ' is-active' : ''}`, 'aria-label': label, title: label, ...rest,
    }, React.createElement(Icon, { name, size }));
  }

  /* ---------- Badge / Pill ---------- */
  function Badge({ children, tone = 'neutral', dot }) {
    return React.createElement('span', { className: `badge badge-${tone}` },
      dot && React.createElement('span', { className: 'badge-dot' }),
      children);
  }

  function Tag({ children, onClick }) {
    return React.createElement(onClick ? 'button' : 'span', { className: 'tag', onClick },
      React.createElement('span', { className: 'tag-hash' }, '#'),
      children);
  }

  /* ---------- Memory badge / dot ---------- */
  const memColors = {
    mastered: 'var(--mem-mastered)', strong: 'var(--mem-strong)', moderate: 'var(--mem-moderate)',
    fragile: 'var(--mem-fragile)', critical: 'var(--mem-critical)',
  };
  function memStateOf(score) {
    if (score >= 90) return { key: 'mastered', label: 'Mastered' };
    if (score >= 70) return { key: 'strong', label: 'Strong' };
    if (score >= 50) return { key: 'moderate', label: 'Moderate' };
    if (score >= 30) return { key: 'fragile', label: 'Fragile' };
    return { key: 'critical', label: 'Critical' };
  }
  function MemoryDot({ score, size = 8 }) {
    const s = memStateOf(score);
    return React.createElement('span', {
      title: `${s.label} · ${score}`,
      style: { width: size, height: size, borderRadius: '50%', background: memColors[s.key], display: 'inline-block', flexShrink: 0 },
    });
  }
  function MemoryBadge({ score, showLabel = true }) {
    const s = memStateOf(score);
    return React.createElement('span', { className: 'mem-badge', style: { '--mc': memColors[s.key] } },
      React.createElement('span', { className: 'mem-badge-dot' }),
      showLabel && React.createElement('span', null, s.label),
      React.createElement('span', { className: 'mem-badge-score' }, score));
  }

  /* ---------- Concept pill ---------- */
  function ConceptPill({ label, score, onClick }) {
    return React.createElement('button', { className: 'concept-pill', onClick },
      score != null && React.createElement(MemoryDot, { score, size: 7 }),
      label);
  }

  /* ---------- Progress bar ---------- */
  function ProgressBar({ value, max = 100, height = 6, color = 'var(--accent)', track = 'var(--bg-elevated)', animated = true }) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return React.createElement('div', { className: 'progress-track', style: { height, background: track } },
      React.createElement('div', { className: 'progress-fill', style: {
        width: pct + '%', background: color, transition: animated ? 'width 0.6s var(--ease-out)' : 'none',
      } }));
  }

  /* ---------- Section header ---------- */
  function SectionHeader({ eyebrow, title, action }) {
    return React.createElement('div', { className: 'section-header' },
      React.createElement('div', null,
        eyebrow && React.createElement('div', { className: 'eyebrow', style: { marginBottom: 6 } }, eyebrow),
        title && React.createElement('h2', { className: 'section-title serif' }, title)),
      action);
  }

  /* ---------- Card shell ---------- */
  function Panel({ children, className = '', pad = true, ...rest }) {
    return React.createElement('div', { className: `panel${pad ? ' panel-pad' : ''} ${className}`, ...rest }, children);
  }

  /* ---------- Breadcrumb ---------- */
  function Breadcrumb({ items }) {
    return React.createElement('nav', { className: 'breadcrumb' },
      items.map((it, i) => React.createElement(React.Fragment, { key: i },
        i > 0 && React.createElement('span', { className: 'breadcrumb-sep' }, '›'),
        React.createElement(it.onClick ? 'button' : 'span', {
          className: 'breadcrumb-item' + (i === items.length - 1 ? ' is-current' : ''),
          onClick: it.onClick,
        }, it.label))));
  }

  /* ---------- Avatar ---------- */
  function Avatar({ initials, size = 32 }) {
    return React.createElement('div', { className: 'avatar', style: { width: size, height: size, fontSize: size * 0.42 } }, initials);
  }

  /* ---------- Segmented control ---------- */
  function Segmented({ options, value, onChange, size = 'md' }) {
    return React.createElement('div', { className: `segmented segmented-${size}` },
      options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const lbl = typeof o === 'string' ? o : o.label;
        return React.createElement('button', {
          key: val, className: `segmented-opt${value === val ? ' is-active' : ''}`,
          onClick: () => onChange(val),
        }, typeof o === 'object' && o.icon && React.createElement(Icon, { name: o.icon, size: 15 }), lbl);
      }));
  }

  /* ---------- Switch ---------- */
  function Switch({ checked, onChange, label }) {
    return React.createElement('button', {
      className: `switch${checked ? ' is-on' : ''}`, role: 'switch', 'aria-checked': checked,
      'aria-label': label, onClick: () => onChange(!checked),
    }, React.createElement('span', { className: 'switch-thumb' }));
  }

  /* ---------- Empty state ---------- */
  function EmptyState({ icon = 'book', title, body, action }) {
    return React.createElement('div', { className: 'empty-state' },
      React.createElement('div', { className: 'empty-icon' }, React.createElement(Icon, { name: icon, size: 26 })),
      React.createElement('div', { className: 'serif empty-title' }, title),
      body && React.createElement('p', { className: 'empty-body' }, body),
      action);
  }

  /* ---------- Spinner ---------- */
  function Spinner({ size = 20 }) {
    return React.createElement('span', { className: 'spinner', style: { width: size, height: size } });
  }

  /* ---------- Skeleton ---------- */
  function Skeleton({ w = '100%', h = 14, r = 4, style = {} }) {
    return React.createElement('div', { className: 'skeleton', style: { width: w, height: h, borderRadius: r, ...style } });
  }

  /* ---------- Modal ---------- */
  function Modal({ open, onClose, children, title, width = 520 }) {
    useEffect(() => {
      if (!open) return;
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    return React.createElement('div', { className: 'modal-scrim', onClick: onClose },
      React.createElement('div', { className: 'modal', style: { maxWidth: width }, onClick: e => e.stopPropagation() },
        title && React.createElement('div', { className: 'modal-head' },
          React.createElement('h3', { className: 'serif t-heading-lg' }, title),
          React.createElement(IconButton, { name: 'x', label: 'Close', onClick: onClose })),
        React.createElement('div', { className: 'modal-body' }, children)));
  }

  /* ---------- Toast system ---------- */
  const ToastCtx = createContext(null);
  function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const push = useCallback((msg, opts = {}) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(t => [...t, { id, msg, ...opts }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), opts.duration || 3200);
    }, []);
    return React.createElement(ToastCtx.Provider, { value: push },
      children,
      React.createElement('div', { className: 'toast-stack' },
        toasts.map(t => React.createElement('div', { key: t.id, className: `toast toast-${t.tone || 'default'}` },
          t.icon && React.createElement(Icon, { name: t.icon, size: 17 }),
          React.createElement('span', null, t.msg),
          t.action && React.createElement('button', { className: 'toast-action', onClick: () => { t.action.onClick(); setToasts(x => x.filter(y => y.id !== t.id)); } }, t.action.label)))));
  }
  const useToast = () => useContext(ToastCtx) || (() => {});

  /* ---------- Tiny Markdown renderer ---------- */
  function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function inlineMd(s) {
    s = escapeHtml(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    s = s.replace(/\[\[([^\]]+)\]\]/g, '<a class="wikilink" data-wiki="$1">$1</a>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return s;
  }
  function renderMarkdown(md) {
    if (!md) return '';
    const lines = md.split('\n');
    let html = '', i = 0, inCode = false, codeLang = '', codeBuf = [];
    let listBuf = null, tableBuf = null;
    const flushList = () => { if (listBuf) { html += `<${listBuf.type}>` + listBuf.items.map(x => `<li>${inlineMd(x)}</li>`).join('') + `</${listBuf.type}>`; listBuf = null; } };
    const flushTable = () => {
      if (!tableBuf) return;
      const [head, , ...rows] = tableBuf;
      const th = head.split('|').filter(c => c.trim() !== '').map(c => `<th>${inlineMd(c.trim())}</th>`).join('');
      const trs = rows.map(r => '<tr>' + r.split('|').filter(c => c.trim() !== '').map(c => `<td>${inlineMd(c.trim())}</td>`).join('') + '</tr>').join('');
      html += `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
      tableBuf = null;
    };
    for (; i < lines.length; i++) {
      let line = lines[i];
      if (line.startsWith('```')) {
        if (inCode) { html += `<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`; inCode = false; codeBuf = []; }
        else { flushList(); flushTable(); inCode = true; codeLang = line.slice(3); }
        continue;
      }
      if (inCode) { codeBuf.push(line); continue; }
      if (line.trim().startsWith('|') && line.includes('|')) { if (!tableBuf) { flushList(); tableBuf = []; } tableBuf.push(line.trim()); continue; }
      else flushTable();
      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) { flushList(); html += `<h${h[1].length}>${inlineMd(h[2])}</h${h[1].length}>`; continue; }
      if (line.match(/^>\s?/)) { flushList(); html += `<blockquote>${inlineMd(line.replace(/^>\s?/, ''))}</blockquote>`; continue; }
      const ul = line.match(/^[-*]\s+(.*)$/);
      const ol = line.match(/^\d+\.\s+(.*)$/);
      if (ul) { if (!listBuf || listBuf.type !== 'ul') { flushList(); listBuf = { type: 'ul', items: [] }; } listBuf.items.push(ul[1]); continue; }
      if (ol) { if (!listBuf || listBuf.type !== 'ol') { flushList(); listBuf = { type: 'ol', items: [] }; } listBuf.items.push(ol[1]); continue; }
      flushList();
      if (line.trim() === '') continue;
      html += `<p>${inlineMd(line)}</p>`;
    }
    flushList(); flushTable();
    if (inCode) html += `<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`;
    return html;
  }
  function Markdown({ children, className = '', onWiki }) {
    const ref = useRef(null);
    useEffect(() => {
      if (!ref.current || !onWiki) return;
      const links = ref.current.querySelectorAll('.wikilink');
      const handlers = [];
      links.forEach(l => { const h = (e) => { e.preventDefault(); onWiki(l.dataset.wiki); }; l.addEventListener('click', h); handlers.push([l, h]); });
      return () => handlers.forEach(([l, h]) => l.removeEventListener('click', h));
    }, [children, onWiki]);
    return React.createElement('div', { ref, className: `markdown ${className}`, dangerouslySetInnerHTML: { __html: renderMarkdown(children) } });
  }

  /* ---------- Dropdown menu ---------- */
  function Menu({ trigger, items, align = 'right' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, []);
    return React.createElement('div', { className: 'menu-wrap', ref },
      React.createElement('div', { onClick: () => setOpen(o => !o) }, trigger),
      open && React.createElement('div', { className: `menu menu-${align}` },
        items.map((it, i) => it.divider
          ? React.createElement('div', { key: i, className: 'menu-divider' })
          : React.createElement('button', {
              key: i, className: `menu-item${it.danger ? ' is-danger' : ''}`,
              onClick: () => { setOpen(false); it.onClick && it.onClick(); },
            }, it.icon && React.createElement(Icon, { name: it.icon, size: 15 }), it.label))));
  }

  window.UI = {
    Button, IconButton, Badge, Tag, MemoryDot, MemoryBadge, ConceptPill, ProgressBar,
    SectionHeader, Panel, Breadcrumb, Avatar, Segmented, Switch, EmptyState, Spinner,
    Skeleton, Modal, ToastProvider, useToast, Markdown, renderMarkdown, Menu, memStateOf, memColors,
  };
})();
