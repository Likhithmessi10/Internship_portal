import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './LandingPage.css';
import { downloadNocPdf } from '../utils/nocGenerator';
import { FileDown, Sun, Moon, Zap, MapPin, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const response = await api.get('/internships');
        setInternships(response.data.data.slice(0, 3));
      } catch (err) {
        console.error('Error fetching internships:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, []);

  return (
    <div className="landing-container">
      <div className="top-strip">
        <div className="top-strip-inner">
          <span className="strip-text">Government of Andhra Pradesh &nbsp;|&nbsp; APTRANSCO</span>
          <div className="strip-right">
            <a href="mailto:internship@aptransco.in">internship@aptransco.in</a> &nbsp;|&nbsp; 040-23435272
            <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Dark Theme">
              {isDarkMode ? <Sun size={12} /> : <Moon size={12} />}
              <span style={{ marginLeft: '4px' }}>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>

      <header className="landing-header">
        <div className="header-inner">
          <img src="/logo.png" alt="APTRANSCO Logo" className="header-logo" />
          <div className="header-text">
            <div className="dept">Government of Andhra Pradesh — Energy Department</div>
            <h1>Andhra Pradesh Transmission Corporation Limited</h1>
            <div className="sub">APTRANSCO &nbsp;·&nbsp; Student Internship Management Portal &nbsp;·&nbsp; 2024–25</div>
          </div>
          <div className="header-contact">
            <strong>Helpdesk</strong>
            internship@aptransco.in<br />
            040-23435272<br />
            Mon – Fri: 10:00 AM – 5:00 PM
          </div>
        </div>
        <div className="flag-bar"></div>
      </header>

      {/* Scrolling Active Internships Bar - Placed between header and hero */}
      {!loading && internships.length > 0 && (
        <div className="scrolling-internships-bar">
          <div className="scrolling-header">
            <Zap size={16} className="scroll-icon" />
            <span>Active Internships</span>
          </div>
          <div className="scrolling-content">
            <div className="scroll-track">
              {[...internships, ...internships].map((internship, idx) => (
                <div key={`${internship.id}-${idx}`} className="scroll-item">
                  <span className="scroll-dept">{internship.department}</span>
                  <span className="scroll-title">{internship.title}</span>
                  <span className="scroll-openings">{internship.openingsCount} Openings</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge"><Zap size={14} style={{ marginRight: '6px' }} /> APTRANSCO Student Internship Programme 2024–25</div>
          <h2>Power Your Future with<br /><span>APTRANSCO Internship</span></h2>
          <p>Gain hands-on experience in India's leading power transmission utility. Work alongside expert engineers in substations, control rooms, and planning divisions across Andhra Pradesh.</p>
          <button className="btn-hero-primary" onClick={() => navigate('/student/register')}>
            <Zap size={18} style={{ marginRight: '8px' }} /> Apply for Internship Now
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item"><div className="num">36,748</div><div className="lbl">Circuit Kilometres</div></div>
          <div className="stat-item"><div className="num">700+</div><div className="lbl">Substations</div></div>
          <div className="stat-item"><div className="num">26</div><div className="lbl">Districts Served</div></div>
          <div className="stat-item"><div className="num">1,200+</div><div className="lbl">Interns Annually</div></div>
        </div>
      </div>

      <section className="internships-section">
        <div className="section-header">
          <h2 className="section-title">Available Internships</h2>
          <div className="section-title-line"></div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading latest opportunities...</p>
          </div>
        ) : internships.length > 0 ? (
          <div className="internships-grid">
            {internships.flatMap(internship => {
              const roles = internship.rolesData || (internship.roles ? internship.roles.split(',').map(r => ({ name: r.trim() })) : [{ name: internship.title }]);
              return roles.map((role, idx) => (
                <div key={`${internship.id}-${idx}`} className="internship-card">
                  <div className="card-dept">{internship.department}</div>
                  <h3 className="card-title">{role.name}</h3>
                  <div className="card-subtitle">Part of: {internship.title}</div>
                  <p className="card-desc">{internship.description.substring(0, 100)}...</p>
                  <div className="card-meta">
                    <span className="card-meta-item"><MapPin size={14} /> {internship.location || 'Multiple Locations'}</span>
                    <span className="card-meta-item"><Clock size={14} /> {internship.duration}</span>
                  </div>
                  <button className="btn-outline" onClick={() => navigate('/student/register')}>View & Apply →</button>
                </div>
              ));
            })}
          </div>
        ) : (
          <div className="empty-state">No active internships at the moment. Please check back later.</div>
        )}
      </section>

      <section className="info-split-section">
        <div className="info-split-inner">

          <div className="info-column">
            <div className="section-header center">
              <h2 className="section-title">Internship Domains</h2>
              <div className="section-title-line center"></div>
            </div>
            <div className="domain-grid">
              <div className="info-box">
                <h4>Electrical Engineering</h4>
                <p>Professional exposure and hands-on training.</p>
              </div>
              <div className="info-box">
                <h4>IT & SCADA</h4>
                <p>Professional exposure and hands-on training.</p>
              </div>
            </div>
          </div>

          <div className="info-column">
            <div className="section-header center">
              <h2 className="section-title">Eligibility Criteria</h2>
              <div className="section-title-line center"></div>
            </div>
            <div className="eligibility-grid">
              <div className="info-box lg">
                <h4>Academic</h4>
                <p>B.Tech/M.Tech/MBA/MCA with a minimum of 60% aggregate.</p>
              </div>
              <div className="info-box lg">
                <h4>NOC</h4>
                <p>Valid Institution No Objection Certificate is mandatory.</p>
              </div>
              <div className="info-box lg">
                <h4>Identity</h4>
                <p>Valid Aadhaar Card is required for verification.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} <strong>APTRANSCO</strong>. All Rights Reserved.</p>
          <p className="footer-sub">This is an official portal of Andhra Pradesh Transmission Corporation Limited.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
