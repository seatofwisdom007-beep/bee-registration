'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChildEntry {
  id: number
  name: string
  category: string
  photo: string | null
}

interface Registration {
  type: 'student' | 'parent' | 'staff'
  name: string
  phone: string
  photo: string | null
  category: string
  children: ChildEntry[]
  regNumber: string
  timestamp: number
  attendanceMode?: 'physical' | 'facebook'
}

// ─── Data ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 1, name: 'Little Word Sprouts',   ages: 'Ages 3 – 4', classes: 'Sprout 2 & 3',   stage: 'Grand Final', color: '#10b981', emoji: '🌱', cls: 'c1' },
  { id: 2, name: 'Rising Word Explorers', ages: 'Ages 5 – 6', classes: 'Stepping Stone and Grade 1',   stage: 'Grand Final', color: '#3b82f6', emoji: '🔵', cls: 'c2' },
  { id: 3, name: 'Word Builders League',  ages: 'Ages 7 – 8', classes: 'Grade 2 - 3',   stage: 'Grand Final',    color: '#f5c518', emoji: '⭐', cls: 'c3' },
  { id: 4, name: 'Word Champions Circle', ages: 'Ages 9 – 10',classes: 'Grade 4 & 5',  stage: 'Grand Final',       color: '#a855f7', emoji: '💜', cls: 'c4' },
  { id: 5, name: 'Elite Word Masters',    ages: 'Ages 11 – 13',classes: 'JSS 1, 2 & 3',  stage: 'Grand Final',       color: '#ef4444', emoji: '🔴', cls: 'c5' },
  { id: 6, name: 'Grand Spelling Legends',ages: 'Ages 14 – 15',classes: 'SSS 1 & 2',     stage: 'Grand Final',       color: '#f97316', emoji: '🏆', cls: 'c6' },
]



let globalRegCounter = 0

// ─── Helpers ─────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function newRegNum() {
  globalRegCounter++
  return '#SOW-' + String(globalRegCounter).padStart(4, '0')
}

// ─── Countdown ───────────────────────────────────────────────────────────────
function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now())
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    }
  }
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    setTime(calc())
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [])
  
  return mounted ? time : { d: 0, h: 0, m: 0, s: 0 }
}

function pad(n: number) { return String(n).padStart(2, '0') }

// ─── Image Upload ─────────────────────────────────────────────────────────────
function ImageUpload({ value, onChange, label }: { value: string | null; onChange: (v: string | null) => void; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target?.result as string)
    reader.readAsDataURL(file)
  }
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div
        className="img-upload-box"
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{display:'none'}} />
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className="img-preview" />
            <div className="img-upload-text">Tap to change photo</div>
          </>
        ) : (
          <>
            <div className="img-placeholder">📸</div>
            <div className="img-upload-text">
              <strong>Tap to upload photo</strong>
              JPG, PNG or WEBP (for your pass)
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Category Selector ────────────────────────────────────────────────────────
function CatSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="form-group">
      <label className="form-label">Competition Category</label>
      <div className="cat-grid">
        {CATEGORIES.map(c => (
          <div
            key={c.id}
            className={`cat-opt${value === c.name ? ' sel' : ''}`}
            onClick={() => onChange(c.name)}
            style={value === c.name ? {
              borderColor: c.color,
              background: `${c.color}15`,
              color: c.color
            } : undefined}
          >
            {c.emoji} {c.name}<br />
            <small style={{ opacity: 0.7 }}>{c.ages}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Registration Modal ───────────────────────────────────────────────────────
function RegModal({
  defaultCat,
  onClose,
  onSuccess,
}: {
  defaultCat: string
  onClose: () => void
  onSuccess: (r: Registration) => void
}) {
  const [regType, setRegType] = useState<'student' | 'parent' | 'staff'>('student')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [category, setCategory] = useState(defaultCat)
  const [attendanceMode, setAttendanceMode] = useState<'physical' | 'facebook'>('physical')
  const [children, setChildren] = useState<ChildEntry[]>([{ id: 1, name: '', category: defaultCat, photo: null }])
  const nextChildId = useRef(2)

  // Get the color of the current category
  const currentCat = CATEGORIES.find(c => c.name === category)
  const themeColor = currentCat?.color || 'var(--gold)'

  const addChild = () => {
    setChildren(prev => [...prev, { id: nextChildId.current++, name: '', category: '', photo: null }])
  }
  const removeChild = (id: number) => setChildren(prev => prev.filter(c => c.id !== id))
  const updateChild = (id: number, field: keyof ChildEntry, val: string | null) =>
    setChildren(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c))

  const submit = () => {
    if (!name.trim()) { alert('Please enter your name'); return }
    if (!phone.trim()) { alert('Please enter a phone number'); return }
    if (regType === 'student' && !category) { alert('Please select a category'); return }
    if (regType === 'parent' || regType === 'staff') {
      if (!category) { alert('Please select a category'); return }
      if (!attendanceMode) { alert('Please select how you will attend'); return }
    }
    onSuccess({
      type: regType, name, phone, photo,
      category: category,
      children: [],
      regNumber: newRegNum(),
      timestamp: Date.now(),
      attendanceMode: (regType === 'parent' || regType === 'staff') ? attendanceMode : undefined,
    })
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div 
        className="modal"
        style={{
          borderColor: themeColor,
          boxShadow: `0 0 40px ${themeColor}20`
        }}
      >
        <div 
          className="modal-head"
          style={{
            borderBottomColor: themeColor,
            background: `linear-gradient(135deg, rgba(${parseInt(themeColor.slice(1,3), 16)}, ${parseInt(themeColor.slice(3,5), 16)}, ${parseInt(themeColor.slice(5,7), 16)}, 0.05), rgba(${parseInt(themeColor.slice(1,3), 16)}, ${parseInt(themeColor.slice(3,5), 16)}, ${parseInt(themeColor.slice(5,7), 16)}, 0.02))`
          }}
        >
          <h2 style={{ color: themeColor }}>🐝 Register for Championship</h2>
          <p>Fill in the details below to secure your spot</p>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Type toggle */}
          <div className="form-group">
            <label className="form-label">I am registering as</label>
            <div className="type-tabs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button className={`type-tab${regType === 'student' ? ' active' : ''}`} onClick={() => setRegType('student')}>🎓 Student</button>
              <button className={`type-tab${regType === 'parent' ? ' active' : ''}`} onClick={() => setRegType('parent')}>👨‍👩‍👧 Parent</button>
              <button className={`type-tab${regType === 'staff' ? ' active' : ''}`} onClick={() => setRegType('staff')}>👔 Staff</button>
            </div>
          </div>

          {/* Photo */}
          <ImageUpload
            value={photo}
            onChange={setPhoto}
            label={regType === 'student' ? 'Your Photo (for your pass)' : 'Your Photo (optional)'}
          />

          {/* Name */}
          <div className="form-group">
            <label className="form-label">
              {regType === 'student' ? "Contestant's Full Name" : regType === 'parent' ? 'Your Full Name (Parent / Guardian)' : 'Your Full Name (Staff Member)'}
            </label>
            <input className="form-input" type="text" placeholder="Enter full name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone / WhatsApp Number</label>
            <input className="form-input" type="tel" placeholder="+234 800 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          {/* Student-only: category */}
          {regType === 'student' && (
            <CatSelector value={category} onChange={setCategory} />
          )}

          {/* Parent & Staff: category they're supporting and attendance mode */}
          {(regType === 'parent' || regType === 'staff') && (
            <>
              <div className="form-label" style={{ marginBottom: 14 }}>
                {regType === 'parent' ? 'Which Category Are You Supporting?' : 'Which Category Are You Supporting?'}
              </div>
              <CatSelector value={category} onChange={setCategory} />

              <div className="form-group" style={{ marginTop: 20 }}>
                <label className="form-label">How Will You Attend?</label>
                <div className="type-tabs">
                  <button 
                    className={`type-tab${attendanceMode === 'physical' ? ' active' : ''}`} 
                    onClick={() => setAttendanceMode('physical')}
                  >
                    🏫 Physical (In-Person)
                  </button>
                  <button 
                    className={`type-tab${attendanceMode === 'facebook' ? ' active' : ''}`} 
                    onClick={() => setAttendanceMode('facebook')}
                  >
                    📱 Facebook Live
                  </button>
                </div>
              </div>
            </>
          )}

          <button className="btn-submit" onClick={submit}>🐝 Complete Registration</button>
          <p className="form-note">Your digital pass will be generated instantly</p>
        </div>
      </div>
    </div>
  )
}

// ─── Pass Modal ───────────────────────────────────────────────────────────────
function PassModal({ reg, onClose }: { reg: Registration; onClose: () => void }) {
  const passRefs = useRef<(HTMLDivElement | null)[]>([])

  const passes: Array<{ name: string; category: string; photo: string | null; regNum: string; type: string; attendanceMode?: 'physical' | 'facebook' }> = reg.type === 'student'
    ? [{ name: reg.name, category: reg.category, photo: reg.photo, regNum: reg.regNumber, type: 'Contestant' }]
    : [{ name: reg.name, category: reg.category, photo: reg.photo, regNum: reg.regNumber, type: 'Supporter', attendanceMode: reg.attendanceMode }]

  const catOf = (name: string) => CATEGORIES.find(c => c.name === name)

  const downloadPass = async (idx: number) => {
    const el = passRefs.current[idx]
    if (!el) return
    try {
      // @ts-ignore
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(el, { backgroundColor: '#07112e', scale: 2 })
      const a = document.createElement('a')
      a.download = `SOW_SpellingBee_Pass_${passes[idx].name.replace(/\s+/g,'_')}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    } catch {
      window.print()
    }
  }

  const shareWA = (idx: number) => {
    const p = passes[idx]
    const cat = catOf(p.category)
    const isSupporter = p.type === 'Supporter'
    
    const msg = encodeURIComponent(
      isSupporter 
        ? `🐝✨ I'M A SUPPORTER OF THE SPELLING BEE CHAMPIONSHIP 2026!\n\n` +
          `👤 Name: ${p.name}\n` +
          `📚 Supporting: ${cat?.emoji ?? ''} ${p.category}\n` +
          `🎫 Registration: ${p.regNum}\n` +
          `${p.attendanceMode === 'physical' ? '🏫 Attending: Physical - In-Person' : '📱 Attending: Facebook Live'}\n` +
          `📅 Date: Tuesday, 8th July 2026\n` +
          `⏰ Time: 8:00 AM\n` +
          `📍 School Hall, Tulip Campus, Gbopa\n\n` +
          `🏫 Seat of Wisdom Group of Schools, Ibadan\n` +
          `"Building Champions. Spelling the Future."\n\n` +
          `#SOWSpellingBee2026 #EducationTheBestLegacy #SpellLearnLead`
        : `🐝✨ I'M COMPETING IN THE SPELLING BEE CHAMPIONSHIP 2026!\n\n` +
          `👤 Name: ${p.name}\n` +
          `📚 Category: ${cat?.emoji ?? ''} ${p.category}\n` +
          `🎫 Registration: ${p.regNum}\n` +
          `📅 Date: Tuesday, 8th July 2026\n` +
          `⏰ Time: 8:00 AM\n` +
          `📍 School Hall, Tulip Campus, Gbopa\n\n` +
          `🏫 Seat of Wisdom Group of Schools, Ibadan\n` +
          `"Building Champions. Spelling the Future."\n\n` +
          `#SOWSpellingBee2026 #EducationTheBestLegacy #SpellLearnLead`
    )
    window.open('https://wa.me/?text=' + msg, '_blank')
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal pass-modal">
        <div className="modal-head">
          <h2>🎉 Registration Successful!</h2>
          <p>Your official competition pass is ready below</p>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {passes.map((p, idx) => {
            const cat = catOf(p.category)
            const init = initials(p.name)
            return (
              <div key={idx} style={{ marginBottom: idx < passes.length - 1 ? 28 : 0 }}>
                <div
                  className="pass-wrap"
                  ref={el => { passRefs.current[idx] = el }}
                  style={{ 
                    borderColor: cat?.color || 'var(--gold)',
                  }}
                >
                  <div className="pass-head" style={{ borderBottomColor: cat?.color || 'var(--gold)' }}>
                    <div className="pass-logo" style={{ borderColor: cat?.color || 'var(--gold)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.jpg" alt="SOW Logo" />
                    </div>
                    <div className="pass-head-center">
                      <div className="pass-school-name">Seat of Wisdom Group of Schools · Ibadan</div>
                      <div className="pass-event">
                        <div className="sp">SPELLING</div>
                        <div className="bee" style={{ color: cat?.color || 'var(--gold)' }}>Bee 🐝</div>
                      </div>
                      <div className="pass-year" style={{ color: cat?.color || 'var(--gold)' }}>Championship 2026</div>
                    </div>
                    <div className="pass-head-spacer" />
                  </div>
                  <div className="pass-body">
                    <div className="pass-left">
                      <div className="pass-photo" style={{ 
                        background: cat ? `linear-gradient(135deg,${cat.color},${cat.color}88)` : 'linear-gradient(135deg, var(--gold), var(--gold2))',
                        borderColor: cat?.color || 'var(--gold)'
                      }}>
                        {p.photo
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.photo} alt={p.name} />
                          : init}
                      </div>
                      <div className="pass-reg">
                        <div className="pass-reg-lbl">Registration Number</div>
                        <div className="pass-reg-num" style={{ color: cat?.color || 'var(--gold)' }}>{p.regNum}</div>
                      </div>
                    </div>
                    <div className="pass-right">
                      <div className="pass-name">{p.name}</div>
                      <div className="pass-cat-badge">
                        <span style={{ background: cat ? cat.color + '22' : undefined, color: cat?.color }}>
                          {cat?.emoji} {p.category}
                        </span>
                      </div>
                      <div className="pass-grid">
                        <div className="pass-cell">
                          <div className="pass-cell-label">Date</div>
                          <div className="pass-cell-val">8th July 2026</div>
                        </div>
                        <div className="pass-cell">
                          <div className="pass-cell-label">Time</div>
                          <div className="pass-cell-val">8:00 AM</div>
                        </div>
                        <div className="pass-cell">
                          <div className="pass-cell-label">Stage</div>
                          <div className="pass-cell-val" style={{ fontSize: 11 }}>{cat?.stage ?? '—'}</div>
                        </div>
                        <div className="pass-cell">
                          <div className="pass-cell-label">Type</div>
                          <div className="pass-cell-val">{p.type}</div>
                        </div>
                        {p.type === 'Supporter' && (
                          <div className="pass-cell">
                            <div className="pass-cell-label">Attendance</div>
                            <div className="pass-cell-val" style={{ fontSize: 12 }}>
                              {p.attendanceMode === 'physical' ? '🏫 Physical' : '📱 Facebook Live'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pass-foot" style={{ 
                    borderTopColor: cat?.color || 'var(--gold)',
                    background: cat ? `${cat.color}0F` : 'rgba(245,197,24,0.06)'
                  }}>
                    <div className="pass-foot-left">Venue: School Hall, Tulip Campus, Gbopa</div>
                    <div className="pass-foot-center" style={{ color: cat?.color || 'var(--gold)' }}>Arrive by 7:30 AM for accreditation & seating</div>
                    <div className="pass-foot-right" style={{ color: cat ? `${cat.color}66` : 'rgba(245,197,24,0.4)' }}>#SOWSpellingBee2026 · #EducationTheBestLegacy · #SpellLearnLead</div>
                  </div>
                </div>
                <div className="pass-actions">
                  <button className="btn-dl" onClick={() => downloadPass(idx)}>⬇️ Download Pass</button>
                  <button className="btn-wa" onClick={() => shareWA(idx)}>📲 Share on WhatsApp</button>
                </div>
              </div>
            )
          })}
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 14 }}>
            Share your pass as a WhatsApp status and tag <strong style={{ color: 'var(--gold)' }}>@SeatofWisdomSchools</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Leaderboard Component ───────────────────────────────────────────────────
function LeaderboardComponent({ totalCounts }: { totalCounts: Record<number, number> }) {
  // Create ranked list sorted by count descending
  const ranked = CATEGORIES.map(cat => ({
    ...cat,
    count: totalCounts[cat.id] ?? 0
  })).sort((a, b) => b.count - a.count)

  const maxCount = Math.max(...Object.values(totalCounts), 1)

  return (
    <div className="leaderboard">
      {ranked.map((cat, idx) => {
        const fillPct = Math.round((cat.count / maxCount) * 100)
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`
        
        return (
          <div key={cat.id} className="leaderboard-item">
            <div className="lb-rank" style={{ color: cat.color }}>{medal}</div>
            <div className="lb-info">
              <div className="lb-name">
                <span style={{ marginRight: 8 }}>{cat.emoji}</span>
                {cat.name}
              </div>
              <div className="lb-classes" style={{ fontSize: 11, opacity: 0.6 }}>{cat.classes}</div>
            </div>
            <div className="lb-bar-container">
              <div 
                className="lb-bar-fill" 
                style={{ 
                  width: fillPct + '%', 
                  background: cat.color,
                  transition: 'width 0.6s ease-out'
                }} 
              />
            </div>
            <div className="lb-count" style={{ color: cat.color, fontWeight: 600, minWidth: 50, textAlign: 'right' }}>
              {cat.count}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { d, h, m, s } = useCountdown(new Date('2026-07-06T23:59:59'))
  const [regCounts, setRegCounts] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 })
  const [totalCounts, setTotalCounts] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 })
  const [showReg, setShowReg] = useState(false)
  const [defaultCat, setDefaultCat] = useState('')
  const [completedReg, setCompletedReg] = useState<Registration | null>(null)
  const [toast, setToast] = useState('')
  const [showToast, setShowToast] = useState(false)

  const fireToast = useCallback((msg: string) => {
    setToast(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3200)
  }, [])

  // Fetch real-time registration counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch('/api/registrations')
        const data = await response.json()
        
        const studentCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
        const allCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
        
        data.forEach((reg: any) => {
          const cat = CATEGORIES.find(c => c.name === reg.category)
          if (cat) {
            // Count all registrations for total
            allCounts[cat.id] = (allCounts[cat.id] || 0) + 1
            
            // Only count students for student-specific count
            if (reg.regType === 'student') {
              studentCounts[cat.id] = (studentCounts[cat.id] || 0) + 1
            }
          }
        })
        setRegCounts(studentCounts)
        setTotalCounts(allCounts)
      } catch (error) {
        console.error('Failed to fetch registration counts:', error)
      }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const openReg = (cat = '') => { setDefaultCat(cat); setShowReg(true) }

  const handleSuccess = async (reg: Registration) => {
    setShowReg(false)
    
    try {
      // Save to Supabase
      const dataToSave = {
        name: reg.name,
        category: reg.type === 'student' ? reg.category : reg.category,
        photoData: reg.photo,
        regNumber: reg.regNumber,
        regType: reg.type,
        isParent: reg.type === 'parent',
        children: reg.type === 'parent' ? [] : [],
        attendanceMode: reg.attendanceMode,
      }

      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      })

      if (!response.ok) {
        console.warn('Failed to save to database, but registration completed locally')
      }
    } catch (error) {
      console.warn('Database error:', error)
    }

    // update counts - only count students, not parents/staff
    if (reg.type === 'student') {
      const cat = CATEGORIES.find(c => c.name === reg.category)
      if (cat) setRegCounts(prev => ({ ...prev, [cat.id]: (prev[cat.id] ?? 0) + 1 }))
    }
    setCompletedReg(reg)
    fireToast('🎉 Registration successful! Your pass is ready.')
  }

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="nav-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="SOW" />
            </div>
            <div className="nav-title">
              <strong>Seat of Wisdom</strong>
              <span>Group of Schools · Ibadan</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="/admin" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }} title="Admin Dashboard">
              🔑 Admin
            </a>
            <button className="nav-cta" onClick={() => openReg()}>Register Now →</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">🐝 Championship 2026</div>
        <div className="hero-bee-icon">🐝</div>
        <div className="hero-spelling">SPELLING</div>
        <div className="hero-bee-word">Bee</div>
        <div className="hero-champ">Championship 2026</div>
        <p className="hero-tagline">&ldquo;Building Champions. Spelling the Future.&rdquo;</p>
        <div className="hero-ctas">
          <button className="btn-primary" onClick={() => openReg()}>✍️ Register Now →</button>
          <button className="btn-outline" onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}>
            View Categories
          </button>
        </div>

        {/* Countdown */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="countdown-wrap">
            <div className="cd-block"><span className="cd-num">{pad(d)}</span><div className="cd-label">Days</div></div>
            <div className="cd-sep">:</div>
            <div className="cd-block"><span className="cd-num">{pad(h)}</span><div className="cd-label">Hours</div></div>
            <div className="cd-sep">:</div>
            <div className="cd-block"><span className="cd-num">{pad(m)}</span><div className="cd-label">Mins</div></div>
            <div className="cd-sep">:</div>
            <div className="cd-block"><span className="cd-num">{pad(s)}</span><div className="cd-label">Secs</div></div>
          </div>
        </div>
      </section>

      {/* INFO STRIP */}
      <div className="info-strip">
        {[
          { icon: '📅', label: 'Date',      value: 'Tuesday, 8th July 2026' },
          { icon: '⏰', label: 'Time',      value: '8:00 AM Prompt' },
          { icon: '📍', label: 'Venue',     value: 'School Hall, Tulip Campus, Gbopa' },
          { icon: '⚠️', label: 'Important', value: 'Arrive by 7:30 AM for accreditation' },
        ].map(({ icon, label, value }) => (
          <div key={label} className="info-card">
            <div className="info-icon">{icon}</div>
            <div>
              <div className="info-label">{label}</div>
              <div className="info-value">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CATEGORIES */}
      <div id="categories" className="section">
        <div className="section-header">
          <div className="section-eye">Competition Divisions</div>
          <h2 className="section-title">Choose Your Category</h2>
        </div>
        <div className="notice">
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔔</span>
          <span>
            <strong>Registration is OPEN!</strong>
            <br />
            Secure your child&apos;s spot today. All contestants must arrive before 7:30 AM for accreditation and seating on the day of the competition.
          </span>
        </div>
        <div className="cats-grid">
          {CATEGORIES.map(cat => {
            const count = regCounts[cat.id] ?? 0
            const pct = Math.min(100, Math.round(count / 1.5))
            return (
              <div key={cat.id} className={`cat-card ${cat.cls}`} onClick={() => openReg(cat.name)}>
                <div className="cat-card-top">
                  <div className="cat-pill">{cat.emoji} {cat.ages}</div>
                  <div className="cat-trophy">🏆</div>
                </div>
                <div className="cat-name">{cat.name}</div>
                <div className="cat-ages">{cat.classes}</div>
                <div className="cat-meta">
                  <span>👥 {count} Contestants</span>
                  <span>📋 {cat.stage}</span>
                </div>
                <div className="cat-stage" style={{ background: cat.color + '18', color: cat.color }}>{cat.stage}</div>
                <div className="cat-bar">
                  <div className="cat-bar-fill" style={{ width: pct + '%', background: cat.color }} />
                </div>
                <div className="cat-cta">Register for this category →</div>
              </div>
            )
          })}
        </div>
      </div>


      {/* LEADERBOARD */}
      <div className="section leaderboard-section">
        <div className="section-header">
          <div className="section-eye">Live Engagement</div>
          <h2 className="section-title">Registration Leaderboard</h2>
        </div>
        <div className="notice">
          <span style={{ fontSize: 18, flexShrink: 0 }}>📊</span>
          <span>
            <strong>Total registrations across all categories</strong>
            <br />
            Including students, parents, and staff members. Updated live every 30 seconds.
          </span>
        </div>
        <LeaderboardComponent totalCounts={totalCounts} />
      </div>


      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo-row">
          <div className="footer-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="SOW" />
          </div>
          <div>
            <div className="footer-school">Seat of Wisdom Group of Schools, Ibadan</div>
          </div>
        </div>
        <div className="footer-tag">Education The Best Legacy</div>
        <div className="footer-values">
          {['🏆 Excellence','📐 Discipline','✅ Integrity','📚 Knowledge','👑 Leadership'].map(v => (
            <span key={v}>{v}</span>
          ))}
        </div>
        <div className="footer-copy">© 2026 Seat of Wisdom Group of Schools · All Rights Reserved</div>
      </footer>

      {/* MODALS */}
      {showReg && (
        <RegModal
          defaultCat={defaultCat}
          onClose={() => setShowReg(false)}
          onSuccess={handleSuccess}
        />
      )}
      {completedReg && (
        <PassModal
          reg={completedReg}
          onClose={() => setCompletedReg(null)}
        />
      )}

      {/* TOAST */}
      <div className={`toast${showToast ? ' show' : ''}`}>{toast}</div>
    </>
  )
}
