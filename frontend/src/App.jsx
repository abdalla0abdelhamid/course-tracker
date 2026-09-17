import { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api';

const ChecklistIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5"/>
    <path d="M7 8.5l1.5 1.5L11 7.5"/>
    <path d="M13 8.5h4"/>
    <path d="M7 15.5l1.5 1.5L11 14.5"/>
    <path d="M13 15.5h4"/>
  </svg>
);
const BulbIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6"/>
    <path d="M10 21h4"/>
    <path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3z"/>
    <path d="M12 8v3"/><path d="M12 13h.01"/>
  </svg>
);
const Chevron = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform .2s' }}>
    <path d="M18 15l-6-6-6 6"/>
  </svg>
);

function Ring({ pct, size = 52, stroke = 5 }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ring-bg)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct/100)*c}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">{pct}%</text>
    </svg>
  );
}

function ModuleCard({ m, onAddTopic, onToggle, onDeleteTopic, onDeleteModule }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(true);
  const total = m.topics.length;
  const done = m.topics.filter(t => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    onAddTopic(m.id, v);
    setText('');
  };

  return (
    <div className="module">
      <div className="m-head">
        <button className="icon-btn" onClick={() => setOpen(o => !o)} title={open ? 'طي' : 'فرد'}>
          <Chevron open={open} />
        </button>
        <Ring pct={pct} />
        <div className="m-title">
          <div className="m-name">{m.name}</div>
          <div className="m-meta">{done} من {total} توبيك</div>
        </div>
        <button className="icon-btn" onClick={() => onDeleteModule(m.id)} title="حذف الموديول">✕</button>
      </div>
      {open && <>
        <div className="topics">
          {m.topics.map(t => (
            <div key={t.id} className={`topic ${t.done ? 'done' : ''}`}>
              <input type="checkbox" checked={t.done} onChange={e => onToggle(m.id, t.id, e.target.checked)} />
              <label onClick={() => onToggle(m.id, t.id, !t.done)}>{t.name}</label>
              <span className="del" onClick={() => onDeleteTopic(m.id, t.id)}>✕</span>
            </div>
          ))}
        </div>
        <div className="add-row">
          <input type="text" placeholder="اسم التوبيك أو الفيديو..." value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          <button className="add" onClick={submit}>إضافة</button>
        </div>
      </>}
    </div>
  );
}

function SideList({ title, icon, items, placeholder, hasCheck, onAdd, onToggle, onDelete }) {
  const [text, setText] = useState('');
  const submit = () => { const v = text.trim(); if (!v) return; onAdd(v); setText(''); };
  return (
    <div className="side-box">
      <div className="side-head">{icon}<span>{title}</span></div>
      <div className="topics">
        {items.map(it => (
          <div key={it.id} className={`topic ${hasCheck && it.done ? 'done' : ''}`}>
            {hasCheck && <input type="checkbox" checked={it.done} onChange={e => onToggle(it.id, e.target.checked)} />}
            <label onClick={() => hasCheck && onToggle(it.id, !it.done)}>{it.text}</label>
            <span className="del" onClick={() => onDelete(it.id)}>✕</span>
          </div>
        ))}
      </div>
      <div className="add-row">
        <input type="text" placeholder={placeholder} value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        <button className="add" onClick={submit}>إضافة</button>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState({ modules: [], priorities: [], ideas: [] });
  const [newModule, setNewModule] = useState('');
  const [error, setError] = useState(null);

  const load = () => {
    fetch(`${API}/data`).then(r => r.json()).then(d => { setData(d); setError(null); })
      .catch(() => setError('تعذر الاتصال بالسيرفر - تأكد إن الـ backend شغال على http://localhost:5000'));
  };
  useEffect(() => { load(); }, []);

  const post = (url, body) => fetch(`${API}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(load);
  const patch = (url, body) => fetch(`${API}${url}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(load);
  const del = (url) => fetch(`${API}${url}`, { method: 'DELETE' }).then(load);

  const addModule = () => {
    const name = newModule.trim();
    if (!name) return;
    post('/modules', { text: name });
    setNewModule('');
  };

  return (
    <div className="wrap">
      <header>
        <h1>متتبع تقدم الكورس</h1>
        <div className="sub">ضيف الموديولات وتحت كل واحد التوبيكس، وأشّر عليهم أول ما تخلصهم</div>
      </header>

      {error && <div className="error">{error}</div>}

      <SideList title="أولويات المهام" icon={<ChecklistIcon />} items={data.priorities}
        placeholder="مهمة جديدة..." hasCheck
        onAdd={(t) => post('/priorities', { text: t })}
        onToggle={(id, doneVal) => patch(`/priorities/${id}`, { done: doneVal })}
        onDelete={(id) => del(`/priorities/${id}`)} />

      <SideList title="أفكار طارئة" icon={<BulbIcon />} items={data.ideas}
        placeholder="فكرة جت في بالك..." hasCheck={false}
        onAdd={(t) => post('/ideas', { text: t })}
        onToggle={() => {}}
        onDelete={(id) => del(`/ideas/${id}`)} />

      {data.modules.map(m => (
        <ModuleCard key={m.id} m={m}
          onAddTopic={(mid, t) => post(`/modules/${mid}/topics`, { text: t })}
          onToggle={(mid, tid, doneVal) => patch(`/modules/${mid}/topics/${tid}`, { done: doneVal })}
          onDeleteTopic={(mid, tid) => del(`/modules/${mid}/topics/${tid}`)}
          onDeleteModule={(mid) => { if (confirm('تحذف الموديول ده وكل التوبيكس اللي جواه؟')) del(`/modules/${mid}`); }} />
      ))}

      <div className="add-row module-add">
        <input type="text" placeholder="اسم الموديول الجديد..." value={newModule}
          onChange={e => setNewModule(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addModule()} />
        <button className="add" onClick={addModule}>+ إضافة موديول</button>
      </div>
    </div>
  );
}
