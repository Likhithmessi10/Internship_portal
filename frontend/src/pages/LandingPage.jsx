import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './LandingPage.css';
import {
  Sun, Moon, Zap, MapPin, Clock, ArrowRight, Cpu, Bolt,
  Building2, GraduationCap, ShieldCheck, Award, Calendar,
  Mail, Phone, ChevronRight, Sparkles, TrendingUp, Network,
  Activity, Briefcase, FileCheck, BadgeCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Animated counter that ticks from 0 → target when visible
const AnimatedNumber = ({ value, suffix = '', duration = 1600 }) => {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setN(Math.floor(eased * value));
            if (t < 1) requestAnimationFrame(tick);
            else setN(value);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{n.toLocaleString('en-IN')}{suffix}</span>;
};

// Reveal-on-scroll wrapper
const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(true); });
    }, { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();
  const year = new Date().getFullYear();
  const yearShort = (year + 1).toString().slice(2);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const response = await api.get('/public/internships');
        setBatches(response.data.data || []);
      } catch (err) {
        console.error('Error fetching internships:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, []);

  // Flatten marquee items
  const marqueeItems = batches.flatMap(batch =>
    (batch.internships || []).flatMap(internship => {
      let roles = [];
      if (internship.internshipType === 'NON_STIPEND') {
        roles = (internship.fields || []).map(f => ({ name: f.fieldName }));
        if (roles.length === 0) roles = [{ name: internship.title }];
      } else {
        roles = internship.rolesData || (internship.roles ? internship.roles.split(',').map(r => ({ name: r.trim() })) : [{ name: internship.title }]);
      }
      return roles.map(role => ({ ...internship, displayRole: role.name }));
    })
  );
  const marqueeRepeated = marqueeItems.length > 0 ? [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems] : [];

  // Count totals
  const totalRoles = marqueeItems.length;
  const totalInternships = batches.reduce((s, b) => s + (b.internships?.length || 0), 0);

  return (
    <div className="landing-v2">
      {/* ───── Top utility strip ───── */}
      <div className="lv2-strip">
        <div className="lv2-strip-inner">
          <span className="lv2-strip-gov">
            <span className="lv2-flag-dot" /> Government of Andhra Pradesh · Energy Department
          </span>
          <div className="lv2-strip-right">
            <a href="mailto:internship@aptransco.in"><Mail size={11} /> internship@aptransco.in</a>
            <span className="lv2-strip-sep">|</span>
            <a href="tel:04023435272"><Phone size={11} /> 040-23435272</a>
            <button className="lv2-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {isDarkMode ? <Sun size={12} /> : <Moon size={12} />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───── Header ───── */}
      <header className="lv2-header">
        <div className="lv2-header-inner">
          <div className="lv2-header-left">
            <div className="lv2-logo-wrap">
              <img src="/logo.png" alt="APTRANSCO" />
            </div>
            <div>
              <p className="lv2-header-dept">Andhra Pradesh Transmission Corporation Limited</p>
              <p className="lv2-header-sub">
                <span className="lv2-pill">APTRANSCO</span>
                <span>Student Internship Programme</span>
                <span className="lv2-dot" />
                <span>{year}–{yearShort}</span>
              </p>
            </div>
          </div>
          <div className="lv2-header-right">
            <div className="lv2-helpdesk">
              <p className="lv2-helpdesk-label">Helpdesk</p>
              <p>Mon – Fri · 10:00 AM – 5:00 PM</p>
            </div>
          </div>
        </div>
        <div className="lv2-flag-bar" />
      </header>

      {/* ───── Active Internships Marquee ───── */}
      {!loading && marqueeRepeated.length > 0 && (
        <div className="lv2-marquee">
          <div className="lv2-marquee-label">
            <Bolt size={14} /> <span>LIVE OPENINGS</span>
          </div>
          <div className="lv2-marquee-track-wrap">
            <div className="lv2-marquee-track">
              {marqueeRepeated.map((item, idx) => (
                <div key={idx} className="lv2-marquee-item">
                  <span className="lv2-marquee-dept">{item.department}</span>
                  <span className="lv2-marquee-title">{item.displayRole}</span>
                  <span className="lv2-marquee-openings">
                    <Sparkles size={10} /> {item.openingsCount} seats
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───── HERO ───── */}
      <section className="lv2-hero">
        {/* Animated grid + glow background */}
        <div className="lv2-hero-bg">
          <div className="lv2-grid" />
          <div className="lv2-glow lv2-glow-1" />
          <div className="lv2-glow lv2-glow-2" />
          <div className="lv2-glow lv2-glow-3" />
          <div className="lv2-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="lv2-particle" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${10 + Math.random() * 12}s`
              }} />
            ))}
          </div>
        </div>

        <div className="lv2-hero-inner">
          <Reveal>
            <div className="lv2-hero-badge">
              <span className="lv2-hero-badge-dot" />
              <Zap size={12} />
              <span>Applications open · Batch {year}–{yearShort}</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="lv2-hero-title">
              Power Your Future
              <span className="lv2-hero-title-accent">
                at India's Leading Grid
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="lv2-hero-sub">
              Step into substations, control rooms and the planning divisions that move{' '}
              <strong>36,000+ kilometres</strong> of high-voltage transmission across Andhra Pradesh.
              Hands-on learning. Real engineers. Live infrastructure.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="lv2-hero-ctas">
              <button className="lv2-btn-primary" onClick={() => navigate('/student/register')}>
                <Zap size={16} />
                <span>Apply for Internship</span>
                <ArrowRight size={16} className="lv2-btn-arrow" />
              </button>
              <button className="lv2-btn-ghost" onClick={() => navigate('/login')}>
                Already registered? <strong>Login</strong>
              </button>
              <button className="lv2-btn-staff" onClick={() => window.location.href = '/admin'}>
                <ShieldCheck size={14} />
                Staff / Admin
              </button>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="lv2-hero-stats">
              <div className="lv2-hero-stat">
                <p className="lv2-hero-stat-num"><AnimatedNumber value={36748} /></p>
                <p className="lv2-hero-stat-lbl">Circuit km</p>
              </div>
              <div className="lv2-hero-stat-sep" />
              <div className="lv2-hero-stat">
                <p className="lv2-hero-stat-num"><AnimatedNumber value={700} suffix="+" /></p>
                <p className="lv2-hero-stat-lbl">Substations</p>
              </div>
              <div className="lv2-hero-stat-sep" />
              <div className="lv2-hero-stat">
                <p className="lv2-hero-stat-num"><AnimatedNumber value={26} /></p>
                <p className="lv2-hero-stat-lbl">Districts</p>
              </div>
              <div className="lv2-hero-stat-sep" />
              <div className="lv2-hero-stat">
                <p className="lv2-hero-stat-num"><AnimatedNumber value={1200} suffix="+" /></p>
                <p className="lv2-hero-stat-lbl">Interns / year</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Bottom wave */}
        <svg className="lv2-hero-wave" viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,30 C320,60 720,0 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* ───── Why APTRANSCO ───── */}
      <section className="lv2-why">
        <div className="lv2-container">
          <Reveal>
            <div className="lv2-section-head">
              <p className="lv2-section-tag">Why APTRANSCO</p>
              <h2 className="lv2-section-title">Built for engineers who want the <span>real grid</span></h2>
            </div>
          </Reveal>
          <div className="lv2-why-grid">
            {[
              { icon: Network,     title: 'Live Infrastructure',  desc: 'Work inside operating substations and control rooms — not simulators.' },
              { icon: Cpu,         title: 'SCADA & IT Systems',   desc: 'Hands-on with grid automation, monitoring and energy management tools.' },
              { icon: Briefcase,   title: 'Multi-Discipline',     desc: 'Electrical, Mechanical, Civil, IT, Finance, HR, Legal & Administration tracks.' },
              { icon: GraduationCap, title: 'Expert Mentorship',  desc: 'One-on-one guidance from senior engineers and division heads.' },
              { icon: BadgeCheck,  title: 'Government Certified', desc: 'Official internship certificate recognised across the energy sector.' },
              { icon: Activity,    title: 'Statewide Reach',      desc: 'Postings across 26 districts — choose a location that suits you.' },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 70}>
                <div className="lv2-why-card">
                  <div className="lv2-why-icon">
                    <f.icon size={20} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Available Internships ───── */}
      <section className="lv2-internships">
        <div className="lv2-container">
          <Reveal>
            <div className="lv2-section-head">
              <p className="lv2-section-tag">
                <span className="lv2-pulse-dot" /> {totalRoles} live openings · {totalInternships} programmes
              </p>
              <h2 className="lv2-section-title">Available <span>Internships</span></h2>
              <p className="lv2-section-sub">Browse open roles by department. Click any card to apply.</p>
            </div>
          </Reveal>

          {loading ? (
            <div className="lv2-loading">
              <div className="lv2-loading-bolt"><Zap size={28} /></div>
              <p>Loading latest opportunities…</p>
            </div>
          ) : batches.length > 0 ? (
            <div className="lv2-batches">
              {batches.map(batch => (
                <div key={batch.id} className="lv2-batch">
                  <Reveal>
                    <div className="lv2-batch-head">
                      <div className="lv2-batch-icon">
                        <Zap size={18} />
                      </div>
                      <div>
                        <h3>{batch.title}</h3>
                        {batch.description && <p>{batch.description}</p>}
                      </div>
                    </div>
                  </Reveal>
                  <div className="lv2-cards">
                    {(batch.internships || []).map((internship, idx) => {
                      if (!internship) return null;
                      let roles = [];
                      if (internship.internshipType === 'NON_STIPEND') {
                        roles = (internship.fields || []).map(f => ({ name: f.fieldName, fieldId: f.id, description: f.description }));
                        if (roles.length === 0) roles = [{ name: internship.title }];
                      } else {
                        roles = internship.rolesData || (internship.roles ? internship.roles.split(',').map(r => ({ name: r.trim() })) : [{ name: internship.title }]);
                      }
                      return roles.map((role, rIdx) => {
                        const applyPath = `/student/register?internshipId=${internship.id}` + (role.fieldId ? `&fieldId=${role.fieldId}` : '');
                        return (
                          <Reveal key={`${internship.id}-${idx}-${rIdx}`} delay={(idx + rIdx) * 50}>
                            <div className="lv2-card" onClick={() => navigate(applyPath)}>
                              <div className="lv2-card-glow" />
                              <div className="lv2-card-top">
                                <span className="lv2-card-dept">{internship.department}</span>
                                {internship.internshipType === 'NON_STIPEND'
                                  ? <span className="lv2-card-type lv2-card-type-learning">Learning</span>
                                  : <span className="lv2-card-type lv2-card-type-paid">Stipend</span>}
                              </div>
                              <h4 className="lv2-card-title">{role.name}</h4>
                              <p className="lv2-card-sub">{internship.title}</p>
                              <p className="lv2-card-desc">
                                {(role.description || internship.description || '').substring(0, 90)}…
                              </p>
                              <div className="lv2-card-meta">
                                <span><MapPin size={12} />{internship.location || 'Multiple Locations'}</span>
                                {internship.duration && <span><Clock size={12} />{internship.duration}</span>}
                                <span className="lv2-card-seats"><Sparkles size={12} />{internship.openingsCount || 0} seats</span>
                              </div>
                              <div className="lv2-card-cta">
                                <span>View &amp; Apply</span>
                                <ArrowRight size={14} />
                              </div>
                            </div>
                          </Reveal>
                        );
                      });
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lv2-empty">
              <Calendar size={36} />
              <p>No active internships at the moment.</p>
              <p className="lv2-empty-sub">Check back soon — new batches open every quarter.</p>
            </div>
          )}
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section className="lv2-how">
        <div className="lv2-container">
          <Reveal>
            <div className="lv2-section-head">
              <p className="lv2-section-tag">Process</p>
              <h2 className="lv2-section-title">How it <span>works</span></h2>
              <p className="lv2-section-sub">From application to first day on the job — what to expect.</p>
            </div>
          </Reveal>
          <div className="lv2-how-steps">
            {[
              { n: '01', icon: FileCheck,    title: 'Apply Online',          desc: 'Create your profile and submit your CV for a role and location.' },
              { n: '02', icon: ShieldCheck,  title: 'Department Review',     desc: 'The HOD shortlists candidates from preferred colleges and merit.' },
              { n: '03', icon: BadgeCheck,   title: 'PRTI Approval',         desc: 'Final approval from PRTI — joining documents are then requested.' },
              { n: '04', icon: Award,        title: 'Onboard & Start',       desc: 'Upload joining documents, get your roll number, and begin work.' },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="lv2-how-step">
                  <div className="lv2-how-step-number">{s.n}</div>
                  <div className="lv2-how-step-icon"><s.icon size={20} /></div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  {i < 3 && <div className="lv2-how-arrow"><ChevronRight size={18} /></div>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Eligibility ───── */}
      <section className="lv2-eligibility">
        <div className="lv2-container">
          <Reveal>
            <div className="lv2-section-head">
              <p className="lv2-section-tag">Requirements</p>
              <h2 className="lv2-section-title">Are you <span>eligible</span>?</h2>
            </div>
          </Reveal>
          <div className="lv2-elig-grid">
            {[
              { icon: GraduationCap, title: 'Academic',  desc: 'B.Tech / M.Tech / MBA / MCA with minimum 60% aggregate marks.' },
              { icon: ShieldCheck,   title: 'NOC',       desc: 'A valid No Objection Certificate from your institution is mandatory.' },
              { icon: Building2,     title: 'Identity',  desc: 'Valid Aadhaar Card required for verification and onboarding.' },
            ].map((e, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="lv2-elig-card">
                  <div className="lv2-elig-icon"><e.icon size={22} /></div>
                  <h4>{e.title}</h4>
                  <p>{e.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="lv2-cta">
        <div className="lv2-cta-bg">
          <div className="lv2-grid" />
        </div>
        <div className="lv2-container lv2-cta-inner">
          <Reveal>
            <div className="lv2-cta-badge">
              <Zap size={12} /> Batch {year}–{yearShort} now accepting applications
            </div>
            <h2>Ready to step into the <span>grid</span>?</h2>
            <p>Join the next batch of engineering interns shaping Andhra Pradesh's power infrastructure.</p>
            <div className="lv2-cta-buttons">
              <button className="lv2-btn-primary lv2-btn-primary-lg" onClick={() => navigate('/student/register')}>
                <Zap size={16} />
                Apply Now
                <ArrowRight size={16} className="lv2-btn-arrow" />
              </button>
              <button className="lv2-btn-outline-light" onClick={() => navigate('/login')}>
                Login to your account
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="lv2-footer">
        <div className="lv2-container">
          <div className="lv2-footer-grid">
            <div className="lv2-footer-brand">
              <img src="/logo.png" alt="APTRANSCO" />
              <div>
                <p className="lv2-footer-brand-name">APTRANSCO</p>
                <p className="lv2-footer-brand-tag">Powering Andhra Pradesh since 1999</p>
              </div>
            </div>
            <div className="lv2-footer-col">
              <p className="lv2-footer-head">Quick Links</p>
              <a onClick={() => navigate('/student/register')}>Apply for Internship</a>
              <a onClick={() => navigate('/login')}>Student Login</a>
              <a onClick={() => window.location.href = '/admin'}>Staff / Admin Login</a>
            </div>
            <div className="lv2-footer-col">
              <p className="lv2-footer-head">Contact</p>
              <p><Mail size={11} /> internship@aptransco.in</p>
              <p><Phone size={11} /> 040-23435272</p>
              <p><Clock size={11} /> Mon–Fri · 10 AM – 5 PM</p>
            </div>
            <div className="lv2-footer-col">
              <p className="lv2-footer-head">About</p>
              <p>Andhra Pradesh Transmission Corporation Limited is the state transmission utility for Andhra Pradesh, operating under the Energy Department, Government of Andhra Pradesh.</p>
            </div>
          </div>
          <div className="lv2-footer-bottom">
            <p>© {year} APTRANSCO. All Rights Reserved.</p>
            <p>An official portal of the Government of Andhra Pradesh.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
