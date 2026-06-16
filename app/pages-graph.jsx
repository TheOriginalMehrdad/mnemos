/* ============================================================
   MNEMOS — Knowledge Graph (force-directed)
   ============================================================ */
(function () {
  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  const Icon = window.Icon;
  const { Button, IconButton, Panel, MemoryDot, MemoryBadge, Badge, Segmented, Switch } = window.UI;
  const { useApp } = window.Shell;
  const { memColors, memStateOf } = window.UI;

  function GraphPage() {
    const app = useApp();
    const D = window.MNEMOS_DATA;
    const wrapRef = useRef(null);
    const canvasRef = useRef(null);
    const simRef = useRef(null);
    const [size, setSize] = useState({ w: 800, h: 600 });
    const [color, setColor] = useState('domain'); // domain | memory | recency
    const [layout, setLayout] = useState('force');
    const [selected, setSelected] = useState(null);
    const [hover, setHover] = useState(null);
    const [filters, setFilters] = useState({ domains: new Set(D.domains.map(d => d.id)) });
    const [showFilters, setShowFilters] = useState(true);
    const dragRef = useRef(null);
    const viewRef = useRef({ zoom: 1, ox: 0, oy: 0 });
    const [, force] = useState(0);

    // build node/edge model
    const model = useMemo(() => {
      const nodes = D.graph.nodes.map((n, i) => ({
        ...n, x: 400 + Math.cos(i) * 180 + (Math.random() - 0.5) * 60,
        y: 300 + Math.sin(i) * 150 + (Math.random() - 0.5) * 60, vx: 0, vy: 0, fx: null, fy: null,
      }));
      const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
      const edges = D.graph.edges.map(e => ({ ...e, s: byId[e.source], t: byId[e.target] })).filter(e => e.s && e.t);
      return { nodes, edges, byId };
    }, [D]);

    const visibleNodes = useMemo(() => model.nodes.filter(n => filters.domains.has(n.domain)), [model, filters]);

    // resize observer
    useEffect(() => {
      const el = wrapRef.current; if (!el) return;
      const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); setSize({ w: r.width, h: r.height }); });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const nodeColor = useCallback((n) => {
      if (color === 'memory') return memColors[memStateOf(n.memory).key];
      if (color === 'recency') return `color-mix(in oklab, var(--accent) ${30 + (n.memory / 100) * 60}%, var(--bg-elevated))`;
      return D.domainById(n.domain).color;
    }, [color, D]);

    const nodeRadius = (n) => 7 + n.connections * 2.5;

    // force simulation + render loop
    useEffect(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      let raf;
      const cssVar = (v) => getComputedStyle(document.body).getPropertyValue(v).trim();

      // apply layout positioning
      if (layout === 'radial' && selected) {
        const center = model.byId[selected];
        if (center) { center.fx = size.w / 2; center.fy = size.h / 2; }
      } else if (layout !== 'radial') {
        model.nodes.forEach(n => { if (!dragRef.current || dragRef.current.id !== n.id) { /* keep */ } });
      }

      const tick = () => {
        canvas.width = size.w * dpr; canvas.height = size.h * dpr;
        canvas.style.width = size.w + 'px'; canvas.style.height = size.h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const v = viewRef.current;

        // physics
        const nodes = visibleNodes;
        const cx = size.w / 2, cy = size.h / 2;
        for (const n of nodes) {
          if (n.fx != null) { n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0; continue; }
          // center gravity
          n.vx += (cx - n.x) * 0.0009;
          n.vy += (cy - n.y) * 0.0009;
        }
        // repulsion
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy || 1; let d = Math.sqrt(d2);
          const f = 2600 / d2; const ux = dx / d, uy = dy / d;
          a.vx += ux * f; a.vy += uy * f; b.vx -= ux * f; b.vy -= uy * f;
        }
        // springs
        for (const e of model.edges) {
          if (!filters.domains.has(e.s.domain) || !filters.domains.has(e.t.domain)) continue;
          let dx = e.t.x - e.s.x, dy = e.t.y - e.s.y; let d = Math.sqrt(dx * dx + dy * dy) || 1;
          const target = 120; const f = (d - target) * 0.012; const ux = dx / d, uy = dy / d;
          if (e.s.fx == null) { e.s.vx += ux * f; e.s.vy += uy * f; }
          if (e.t.fx == null) { e.t.vx -= ux * f; e.t.vy -= uy * f; }
        }
        for (const n of nodes) { if (n.fx == null) { n.vx *= 0.86; n.vy *= 0.86; n.x += n.vx; n.y += n.vy; } }

        // draw
        ctx.clearRect(0, 0, size.w, size.h);
        ctx.save();
        ctx.translate(v.ox, v.oy); ctx.scale(v.zoom, v.zoom);

        // edges
        for (const e of model.edges) {
          if (!filters.domains.has(e.s.domain) || !filters.domains.has(e.t.domain)) continue;
          const isSel = selected && (e.source === selected || e.target === selected);
          ctx.beginPath(); ctx.moveTo(e.s.x, e.s.y); ctx.lineTo(e.t.x, e.t.y);
          ctx.strokeStyle = isSel ? cssVar('--accent') : cssVar('--border-default');
          ctx.globalAlpha = selected ? (isSel ? 0.9 : 0.18) : (e.type === 'semantic' ? 0.5 : 0.7);
          ctx.lineWidth = (isSel ? 2 : 1) / 1;
          if (e.type === 'semantic') ctx.setLineDash([2, 4]); else if (e.type === 'tag') ctx.setLineDash([6, 4]); else ctx.setLineDash([]);
          ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.globalAlpha = 1;

        // nodes
        for (const n of nodes) {
          const r = nodeRadius(n);
          const isSel = selected === n.id; const isHov = hover === n.id;
          const dim = selected && !isSel && !model.edges.some(e => (e.source === selected && e.target === n.id) || (e.target === selected && e.source === n.id));
          ctx.globalAlpha = dim ? 0.28 : 1;
          ctx.beginPath(); ctx.arc(n.x, n.y, r + (isHov || isSel ? 3 : 0), 0, Math.PI * 2);
          ctx.fillStyle = nodeColor(n); ctx.fill();
          if (isSel || isHov) { ctx.lineWidth = 2.5; ctx.strokeStyle = cssVar('--text-primary'); ctx.stroke(); }
          ctx.globalAlpha = dim ? 0.28 : 1;
          // labels for larger/selected
          if (r > 11 || isSel || isHov || v.zoom > 1.3) {
            ctx.fillStyle = cssVar('--text-secondary'); ctx.font = `500 ${12}px DM Sans, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(n.label, n.x, n.y + r + 14);
          }
        }
        ctx.restore();
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(tick);
      };
      tick();
      return () => cancelAnimationFrame(raf);
    }, [size, visibleNodes, model, color, layout, selected, hover, filters, nodeColor]);

    // pointer interactions
    const toWorld = (e) => {
      const r = canvasRef.current.getBoundingClientRect(); const v = viewRef.current;
      return { x: (e.clientX - r.left - v.ox) / v.zoom, y: (e.clientY - r.top - v.oy) / v.zoom };
    };
    const hitTest = (p) => {
      for (let i = visibleNodes.length - 1; i >= 0; i--) { const n = visibleNodes[i]; const r = nodeRadius(n) + 4;
        if ((n.x - p.x) ** 2 + (n.y - p.y) ** 2 <= r * r) return n; }
      return null;
    };
    const onDown = (e) => {
      const p = toWorld(e); const n = hitTest(p);
      if (n) { dragRef.current = { id: n.id, node: n, moved: false }; n.fx = n.x; n.fy = n.y; }
      else { dragRef.current = { pan: true, sx: e.clientX, sy: e.clientY, ox: viewRef.current.ox, oy: viewRef.current.oy }; }
    };
    const onMove = (e) => {
      const d = dragRef.current;
      if (d && d.pan) { viewRef.current.ox = d.ox + (e.clientX - d.sx); viewRef.current.oy = d.oy + (e.clientY - d.sy); return; }
      if (d && d.node) { const p = toWorld(e); d.node.fx = p.x; d.node.fy = p.y; d.moved = true; return; }
      const p = toWorld(e); const n = hitTest(p); setHover(n ? n.id : null);
      canvasRef.current.style.cursor = n ? 'pointer' : (d && d.pan ? 'grabbing' : 'grab');
    };
    const onUp = (e) => {
      const d = dragRef.current;
      if (d && d.node) { if (!d.moved) { setSelected(s => s === d.id ? null : d.id); } setTimeout(() => { if (d.node) { d.node.fx = null; d.node.fy = null; } }, 50); }
      dragRef.current = null;
    };
    const onWheel = (e) => { e.preventDefault(); const v = viewRef.current; const r = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top; const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const nz = Math.max(0.4, Math.min(3, v.zoom * factor));
      v.ox = mx - (mx - v.ox) * (nz / v.zoom); v.oy = my - (my - v.oy) * (nz / v.zoom); v.zoom = nz; };

    const toggleDomain = (id) => setFilters(f => { const s = new Set(f.domains); s.has(id) ? s.delete(id) : s.add(id); return { domains: s }; });

    const selNode = selected ? model.byId[selected] : null;
    const selNote = selNode ? D.noteById(selNode.id) : null;

    return React.createElement('div', { className: 'graph-page' },
      React.createElement('div', { className: 'graph-toolbar' },
        React.createElement('div', { className: 'row gap-3 items-center' },
          React.createElement('h1', { className: 'serif', style: { fontSize: 22, margin: 0 } }, 'Knowledge Graph'),
          React.createElement('span', { className: 'text-tertiary', style: { fontSize: 13 } }, visibleNodes.length, ' notes · ', model.edges.length, ' links')),
        React.createElement('div', { className: 'row gap-3 items-center wrap' },
          React.createElement('div', { className: 'row gap-2 items-center' },
            React.createElement('span', { className: 'eyebrow' }, 'Color'),
            React.createElement(Segmented, { size: 'sm', value: color, onChange: setColor, options: [{ value: 'domain', label: 'Domain' }, { value: 'memory', label: 'Memory' }, { value: 'recency', label: 'Recency' }] })),
          React.createElement('div', { className: 'row gap-2 items-center' },
            React.createElement('span', { className: 'eyebrow' }, 'Layout'),
            React.createElement(Segmented, { size: 'sm', value: layout, onChange: setLayout, options: [{ value: 'force', label: 'Force' }, { value: 'radial', label: 'Radial' }] })),
          React.createElement(IconButton, { name: 'filter', label: 'Filters', active: showFilters, onClick: () => setShowFilters(s => !s) }))),

      React.createElement('div', { className: 'graph-stage' },
        React.createElement('div', { className: 'graph-canvas-wrap', ref: wrapRef },
          React.createElement('canvas', { ref: canvasRef, className: 'graph-canvas',
            onMouseDown: onDown, onMouseMove: onMove, onMouseUp: onUp, onMouseLeave: onUp, onWheel }),
          React.createElement('div', { className: 'graph-zoom-controls' },
            React.createElement(IconButton, { name: 'plus', label: 'Zoom in', onClick: () => { viewRef.current.zoom = Math.min(3, viewRef.current.zoom * 1.2); } }),
            React.createElement(IconButton, { name: 'x', label: 'Reset', size: 14, onClick: () => { viewRef.current = { zoom: 1, ox: 0, oy: 0 }; setSelected(null); } }),
            React.createElement('button', { className: 'icon-btn', 'aria-label': 'Zoom out', onClick: () => { viewRef.current.zoom = Math.max(0.4, viewRef.current.zoom * 0.83); } }, React.createElement('span', { style: { fontSize: 20, lineHeight: 1 } }, '\u2212'))),
          React.createElement('div', { className: 'graph-legend' },
            color === 'domain'
              ? D.domains.filter(d => filters.domains.has(d.id)).map(d => React.createElement('span', { key: d.id, className: 'graph-legend-item' }, React.createElement('span', { className: 'graph-legend-dot', style: { background: d.color } }), d.name))
              : ['mastered', 'strong', 'moderate', 'fragile', 'critical'].map(k => React.createElement('span', { key: k, className: 'graph-legend-item' }, React.createElement('span', { className: 'graph-legend-dot', style: { background: memColors[k] } }), k)))),

        showFilters && React.createElement('aside', { className: 'graph-side' },
          React.createElement('div', { className: 'eyebrow mb-3' }, 'Filter by domain'),
          React.createElement('div', { className: 'col gap-1 mb-5' },
            D.domains.map(d => React.createElement('button', { key: d.id, className: 'graph-filter-row', onClick: () => toggleDomain(d.id) },
              React.createElement('span', { className: `graph-check${filters.domains.has(d.id) ? ' on' : ''}`, style: { '--cc': d.color } }, filters.domains.has(d.id) && React.createElement(Icon, { name: 'check', size: 12 })),
              React.createElement('span', { className: 'grow', style: { textAlign: 'left' } }, d.name),
              React.createElement('span', { className: 'text-tertiary', style: { fontSize: 12 } }, d.noteCount)))),

          selNode
            ? React.createElement('div', { className: 'graph-node-detail rise' },
                React.createElement('div', { className: 'eyebrow mb-2' }, 'Selected note'),
                React.createElement('h3', { className: 'serif', style: { fontSize: 20, margin: '0 0 8px' } }, selNode.label),
                React.createElement('div', { className: 'row gap-2 wrap mb-3' },
                  React.createElement('span', { className: 'notecard-domain', style: { '--dc': D.domainById(selNode.domain).color } }, D.domainById(selNode.domain).name),
                  React.createElement(MemoryBadge, { score: selNode.memory })),
                selNote && React.createElement('p', { className: 'text-secondary', style: { fontSize: 14, lineHeight: 1.6 } }, selNote.excerpt),
                React.createElement('div', { className: 'row between mt-3 mb-4' },
                  React.createElement('span', { className: 'text-tertiary', style: { fontSize: 13 } }, React.createElement(Icon, { name: 'link', size: 13, style: { verticalAlign: '-2px' } }), ' ', selNode.connections, ' connections')),
                React.createElement('div', { className: 'col gap-2' },
                  React.createElement(Button, { variant: 'primary', size: 'sm', full: true, iconRight: 'arrowRight', onClick: () => app.openNote(selNode.id) }, 'Open note'),
                  React.createElement(Button, { variant: 'secondary', size: 'sm', full: true, icon: 'review', onClick: () => app.navigate('review-cards') }, 'Add to review')))
            : React.createElement('div', { className: 'graph-hint' },
                React.createElement(Icon, { name: 'graph', size: 22, style: { color: 'var(--text-tertiary)' } }),
                React.createElement('p', null, 'Click a node to preview. Drag to reposition, scroll to zoom.')))));
  }

  window.Pages = window.Pages || {};
  window.Pages.Graph = GraphPage;
})();
