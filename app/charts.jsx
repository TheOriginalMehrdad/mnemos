/* ============================================================
   MNEMOS — Data visualization components (SVG)
   ============================================================ */
(function () {
  const { useState } = React;

  /* ---------- Retention gauge (circular) ---------- */
  function RetentionGauge({ value, size = 160, label = 'Memory Health', sub }) {
    const stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r;
    const cx = size / 2, cy = size / 2;
    const start = -210, sweep = 240; // open-bottom arc
    const pct = Math.max(0, Math.min(100, value)) / 100;
    const polar = (deg) => {
      const rad = (deg * Math.PI) / 180;
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    };
    const arcPath = (a0, a1) => {
      const [x0, y0] = polar(a0), [x1, y1] = polar(a1);
      const large = (a1 - a0) > 180 ? 1 : 0;
      return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
    };
    return React.createElement('div', { className: 'gauge', style: { width: size } },
      React.createElement('svg', { width: size, height: size * 0.82, viewBox: `0 0 ${size} ${size * 0.82}` },
        React.createElement('path', { d: arcPath(start, start + sweep), fill: 'none', stroke: 'var(--bg-elevated)', strokeWidth: stroke, strokeLinecap: 'round' }),
        React.createElement('path', { d: arcPath(start, start + sweep * pct), fill: 'none', stroke: 'var(--accent)', strokeWidth: stroke, strokeLinecap: 'round', style: { transition: 'all 0.8s var(--ease-out)' } })),
      React.createElement('div', { className: 'gauge-center' },
        React.createElement('div', { className: 'gauge-value serif' }, value, React.createElement('span', { className: 'gauge-pct' }, '%')),
        React.createElement('div', { className: 'gauge-label' }, sub || label)));
  }

  /* ---------- Forgetting curve sparkline ---------- */
  function ForgettingCurve({ reviews = [], width = 320, height = 120, projected = true }) {
    const pad = { l: 8, r: 8, t: 10, b: 18 };
    const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
    const days = 30;
    const x = (d) => pad.l + (d / days) * W;
    const y = (r) => pad.t + (1 - r / 100) * H;
    // build decaying curve with review bumps
    const evts = reviews.length ? reviews : [{ day: 0, r: 100 }, { day: 6, r: 100 }, { day: 14, r: 100 }];
    const pts = [];
    let lastR = 100, lastDay = 0;
    evts.forEach((e, idx) => {
      for (let d = lastDay; d <= e.day; d += 1) {
        const stab = 4 + idx * 5;
        const rr = lastR * Math.pow(1 + (d - lastDay) / (9 * stab), -1);
        pts.push([d, rr]);
      }
      lastDay = e.day; lastR = 100;
    });
    // projection
    const projPts = [];
    if (projected) {
      const stab = 4 + evts.length * 5;
      for (let d = lastDay; d <= days; d += 1) {
        const rr = 100 * Math.pow(1 + (d - lastDay) / (9 * stab), -1);
        projPts.push([d, rr]);
      }
    }
    const line = (arr) => arr.map((p, i) => `${i ? 'L' : 'M'} ${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(' ');
    const nextReview = lastDay + Math.round(4 + evts.length * 5);
    return React.createElement('svg', { width, height, viewBox: `0 0 ${width} ${height}`, className: 'forgetting-curve' },
      [25, 50, 75].map(g => React.createElement('line', { key: g, x1: pad.l, x2: width - pad.r, y1: y(g), y2: y(g), stroke: 'var(--border-faint)', strokeWidth: 1, strokeDasharray: '2 4' })),
      React.createElement('path', { d: line(pts), fill: 'none', stroke: 'var(--accent)', strokeWidth: 2 }),
      projected && React.createElement('path', { d: line(projPts), fill: 'none', stroke: 'var(--text-tertiary)', strokeWidth: 1.5, strokeDasharray: '4 4' }),
      evts.map((e, i) => React.createElement('circle', { key: i, cx: x(e.day), cy: y(100), r: 3.5, fill: 'var(--accent)', stroke: 'var(--bg-surface)', strokeWidth: 1.5 })),
      nextReview <= days && React.createElement('g', null,
        React.createElement('line', { x1: x(nextReview), x2: x(nextReview), y1: pad.t, y2: pad.t + H, stroke: 'var(--mem-strong)', strokeWidth: 1.5, strokeDasharray: '3 3' }),
        React.createElement('circle', { cx: x(nextReview), cy: y(90), r: 4, fill: 'var(--mem-strong)' })),
      React.createElement('text', { x: pad.l, y: height - 4, className: 'chart-axis-label', fill: 'var(--text-tertiary)' }, 'today'),
      React.createElement('text', { x: width - pad.r, y: height - 4, textAnchor: 'end', className: 'chart-axis-label', fill: 'var(--text-tertiary)' }, `+${days}d`));
  }

  /* ---------- Streak calendar (GitHub-style) ---------- */
  function StreakCalendar({ data = [], weeks = 26, onHover }) {
    const recent = data.slice(-weeks * 7);
    const cols = [];
    for (let w = 0; w < weeks; w++) cols.push(recent.slice(w * 7, w * 7 + 7));
    const max = Math.max(...recent.map(d => d.count), 1);
    const level = (c) => c === 0 ? 0 : Math.min(4, Math.ceil((c / max) * 4));
    const cell = 13, gap = 3;
    const [hover, setHover] = useState(null);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return React.createElement('div', { className: 'streak-cal' },
      React.createElement('svg', { width: weeks * (cell + gap), height: 7 * (cell + gap) + 16, className: 'streak-svg' },
        cols.map((col, wi) => col.map((d, di) => {
          const lv = level(d.count);
          return React.createElement('rect', {
            key: wi + '-' + di, x: wi * (cell + gap), y: di * (cell + gap) + 14, width: cell, height: cell, rx: 2.5,
            fill: lv === 0 ? 'var(--bg-elevated)' : `color-mix(in oklab, var(--accent) ${lv * 24 + 12}%, var(--bg-elevated))`,
            stroke: 'var(--border-faint)', strokeWidth: 0.5,
            onMouseEnter: () => { setHover({ wi, di, d }); onHover && onHover(d); },
            onMouseLeave: () => setHover(null),
            style: { cursor: 'pointer' },
          });
        }))),
      hover && React.createElement('div', { className: 'streak-tip' },
        `${hover.d.count} ${hover.d.count === 1 ? 'card' : 'cards'} · ${new Date(hover.d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`),
      React.createElement('div', { className: 'streak-legend' },
        React.createElement('span', null, 'Less'),
        [0, 1, 2, 3, 4].map(l => React.createElement('span', { key: l, className: 'streak-legend-cell', style: { background: l === 0 ? 'var(--bg-elevated)' : `color-mix(in oklab, var(--accent) ${l * 24 + 12}%, var(--bg-elevated))` } })),
        React.createElement('span', null, 'More')));
  }

  /* ---------- Skill radar ---------- */
  function SkillRadar({ data = [], size = 240, color = 'var(--accent)' }) {
    const cx = size / 2, cy = size / 2, r = size / 2 - 34;
    const n = data.length;
    const pt = (i, val) => {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
      const rr = (val / 100) * r;
      return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
    };
    const axisPt = (i, mul = 1) => {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [cx + r * mul * Math.cos(ang), cy + r * mul * Math.sin(ang)];
    };
    const poly = data.map((d, i) => pt(i, d.score).join(',')).join(' ');
    return React.createElement('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, className: 'skill-radar' },
      [0.25, 0.5, 0.75, 1].map((g, gi) => React.createElement('polygon', {
        key: gi, points: data.map((d, i) => axisPt(i, g).join(',')).join(' '),
        fill: 'none', stroke: 'var(--border-faint)', strokeWidth: 1,
      })),
      data.map((d, i) => { const [x, y] = axisPt(i); return React.createElement('line', { key: i, x1: cx, y1: cy, x2: x, y2: y, stroke: 'var(--border-faint)', strokeWidth: 1 }); }),
      React.createElement('polygon', { points: poly, fill: color, fillOpacity: 0.18, stroke: color, strokeWidth: 2, style: { transition: 'all 0.6s var(--ease-out)' } }),
      data.map((d, i) => { const [x, y] = pt(i, d.score); return React.createElement('circle', { key: i, cx: x, cy: y, r: 3, fill: color }); }),
      data.map((d, i) => {
        const [x, y] = axisPt(i, 1.16);
        return React.createElement('text', { key: 'l' + i, x, y, textAnchor: 'middle', dominantBaseline: 'middle', className: 'radar-label', fill: 'var(--text-tertiary)' }, d.axis);
      }));
  }

  /* ---------- Line chart ---------- */
  function LineChart({ data = [], width = 520, height = 180, yKey = 'value', color = 'var(--accent)', fill = true, suffix = '' }) {
    const pad = { l: 28, r: 12, t: 14, b: 22 };
    const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
    const vals = data.map(d => d[yKey]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const x = (i) => pad.l + (i / (data.length - 1)) * W;
    const y = (v) => pad.t + (1 - (v - min) / range) * H;
    const line = data.map((d, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(d[yKey]).toFixed(1)}`).join(' ');
    const area = `${line} L ${x(data.length - 1)} ${pad.t + H} L ${pad.l} ${pad.t + H} Z`;
    const gid = 'lg' + Math.round(min + max);
    return React.createElement('svg', { width: '100%', height, viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'none', className: 'line-chart' },
      React.createElement('defs', null, React.createElement('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 },
        React.createElement('stop', { offset: '0%', stopColor: color, stopOpacity: 0.22 }),
        React.createElement('stop', { offset: '100%', stopColor: color, stopOpacity: 0 }))),
      [0, 0.5, 1].map(g => React.createElement('line', { key: g, x1: pad.l, x2: width - pad.r, y1: pad.t + g * H, y2: pad.t + g * H, stroke: 'var(--border-faint)', strokeWidth: 1 })),
      [max, min].map((v, i) => React.createElement('text', { key: i, x: 4, y: i === 0 ? pad.t + 4 : pad.t + H, className: 'chart-axis-label', fill: 'var(--text-tertiary)' }, v + suffix)),
      fill && React.createElement('path', { d: area, fill: `url(#${gid})` }),
      React.createElement('path', { d: line, fill: 'none', stroke: color, strokeWidth: 2, strokeLinejoin: 'round' }));
  }

  /* ---------- Bar chart ---------- */
  function BarChart({ data = [], width = 520, height = 160, yKey = 'count', color = 'var(--accent)' }) {
    const pad = { l: 24, r: 8, t: 12, b: 18 };
    const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
    const max = Math.max(...data.map(d => d[yKey]), 1);
    const bw = W / data.length;
    return React.createElement('svg', { width: '100%', height, viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'none', className: 'bar-chart' },
      data.map((d, i) => {
        const h = (d[yKey] / max) * H;
        return React.createElement('rect', {
          key: i, x: pad.l + i * bw + bw * 0.18, y: pad.t + H - h, width: bw * 0.64, height: Math.max(1, h), rx: 2,
          fill: color, opacity: 0.55 + (d[yKey] / max) * 0.45,
        });
      }));
  }

  /* ---------- Horizontal bar (domain health) ---------- */
  function HBars({ data = [] }) {
    return React.createElement('div', { className: 'hbars' },
      data.map((d, i) => React.createElement('div', { key: i, className: 'hbar-row' },
        React.createElement('div', { className: 'hbar-label' }, d.name),
        React.createElement('div', { className: 'hbar-track' },
          React.createElement('div', { className: 'hbar-fill', style: { width: d.score + '%', background: d.color || 'var(--accent)' } })),
        React.createElement('div', { className: 'hbar-val' }, d.score))));
  }

  window.Charts = { RetentionGauge, ForgettingCurve, StreakCalendar, SkillRadar, LineChart, BarChart, HBars };
})();
