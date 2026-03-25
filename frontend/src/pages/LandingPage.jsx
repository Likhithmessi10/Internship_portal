import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './LandingPage.css';
import { downloadNocPdf } from '../utils/nocGenerator';
import { FileDown } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const response = await api.get('/internships');
        setInternships(response.data.data.slice(0, 3)); // Show first 3 active ones
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
        Government of Andhra Pradesh &nbsp;|&nbsp; APTRANSCO – Andhra Pradesh Transmission Corporation Limited &nbsp;|&nbsp;
        <a href="mailto:internship@aptransco.in">internship@aptransco.in</a> &nbsp;|&nbsp; 040-23435272
      </div>

      <header className="landing-header">
        <div className="header-inner">
          <img src="/logo.png" alt="APTRANSCO Logo" style={{ height: '80px', objectFit: 'contain', marginRight: '15px' }} />
          <div className="header-text">
            <div className="dept" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#546e7a' }}>Government of Andhra Pradesh — Energy Department</div>
            <h1>Andhra Pradesh Transmission Corporation Limited</h1>
            <div className="sub" style={{ fontSize: '12.5px', color: '#546e7a' }}>APTRANSCO &nbsp;·&nbsp; Student Internship Management Portal &nbsp;·&nbsp; 2024–25</div>
          </div>
          <div className="header-right">
            <strong>Helpdesk</strong>
            internship@aptransco.in<br />
            040-23435272<br />
            Mon – Fri: 10:00 AM – 5:00 PM
          </div>
        </div>
        <div className="flag-bar"></div>
      </header>

      <nav className="landing-nav">
        <div className="nav-inner">
          <div style={{ flex: 1 }}></div>
          <div style={{ color: '#D4A017', fontSize: '12px', padding: '14px 20px', fontWeight: 600 }}>Academic Year 2024–25</div>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-inner" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ background: '#D4A017', color: '#003087', display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '4px 16px', borderRadius: '20px', marginBottom: '18px' }}>⚡ APTRANSCO Student Internship Programme 2024–25</div>
          <h2>Power Your Future with<br /><em>APTRANSCO Internship</em></h2>
          <p style={{ color: '#aac4e8', fontSize: '16px', margin: '20px auto 30px', maxWidth: '680px' }}>Gain hands-on experience in India's leading power transmission utility. Work alongside expert engineers in substations, control rooms, and planning divisions across Andhra Pradesh.</p>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item">
            <div className="num">36,748</div>
            <div className="lbl" style={{ fontSize: '11.5px', fontWeight: 600 }}>Circuit Kilometres</div>
          </div>
          <div className="stat-item">
            <div className="num">700+</div>
            <div className="lbl" style={{ fontSize: '11.5px', fontWeight: 600 }}>Substations</div>
          </div>
          <div className="stat-item">
            <div className="num">26</div>
            <div className="lbl" style={{ fontSize: '11.5px', fontWeight: 600 }}>Districts Served</div>
          </div>
          <div className="stat-item">
            <div className="num">1,200+</div>
            <div className="lbl" style={{ fontSize: '11.5px', fontWeight: 600 }}>Interns Trained Annually</div>
          </div>
        </div>
      </div>

      {/* RECENT INTERNSHIPS SECTION */}
      <div style={{ padding: '60px 28px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-title">Available Internships</div>
        <div className="section-title-line"></div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid #003087', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
            <p style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>Loading latest opportunities...</p>
          </div>
        ) : internships.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '30px' }}>
            {internships.map(internship => (
              <div key={internship.id} style={{ background: '#fff', borderRadius: '20px', padding: '30px', border: '1px solid #eef2f6', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#003087', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', tracking: '1px', marginBottom: '8px' }}>{internship.department}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1a202c', marginBottom: '12px' }}>{internship.title}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.6, flex: 1 }}>{internship.description.substring(0, 120)}...</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#64748b', fontSize: '12px', marginBottom: '25px' }}>
                  <span>📍 {internship.location}</span>
                  <span>⏱️ {internship.duration}</span>
                </div>
                <button onClick={() => navigate('/student/register')} style={{ background: '#003087', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>View & Apply →</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '20px' }}>
            <p style={{ color: '#64748b' }}>No active internships at the moment. Please check back later.</p>
          </div>
        )}
      </div>

      <div className="about-section">
        <div className="section-title">About APTRANSCO</div>
        <div className="section-title-line"></div>
        <div className="about-grid">
          <div className="about-text">
            <p><strong>Andhra Pradesh Transmission Corporation Limited (APTRANSCO)</strong> is a government undertaking responsible for the bulk transmission of electricity across the state.</p>
            <p>The corporation plays a vital role in ensuring reliable power supply to industries, agriculture, and households across all 26 districts of Andhra Pradesh.</p>
          </div>
          <div className="info-panels" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="highlight-card" style={{ borderLeft: '4px solid #003087' }}>
              <div className="hc-title">Learning Environment</div>
              <p style={{ fontSize: '12.5px', color: '#555' }}>Structured training under experienced engineers with real project assignments.</p>
            </div>
            <div className="highlight-card" style={{ borderLeft: '4px solid #003087' }}>
              <div className="hc-title">Field Exposure</div>
              <p style={{ fontSize: '12.5px', color: '#555' }}>Visits to substations, control rooms, and live transmission infrastructure.</p>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: '#f7f9ff', padding: '50px 28px' }}>
        <div className="about-section" style={{ padding: 0 }}>
          <div className="section-title">Internship Domains</div>
          <div className="section-title-line"></div>
          <div className="areas-grid">
            {['Electrical Engineering', 'IT & SCADA', 'Renewable Integration', 'Civil & Construction'].map(domain => (
              <div key={domain} className="area-card">
                <div className="title">{domain}</div>
                <p style={{ fontSize: '12.5px', color: '#666' }}>Professional exposure and hands-on training in {domain.toLowerCase()} departments.</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="eligibility-section">
        <div className="section-title">Eligibility Criteria</div>
        <div className="section-title-line"></div>
        <div className="elig-grid">
          <div className="elig-card">
            <div className="hc-title">Academic Qualification</div>
            <p style={{ fontSize: '12.5px', color: '#555' }}>Students pursuing B.Tech / B.E. / M.Tech / MBA / MCA with minimum 60% aggregate.</p>
          </div>
          <div className="elig-card">
            <div className="hc-title">College Approval</div>
            <p style={{ fontSize: '12.5px', color: '#555' }}>A valid Acknowledgement Letter / NOC from the institution is mandatory.</p>
          </div>
          <div className="elig-card">
            <div className="hc-title">Identity Verification</div>
            <p style={{ fontSize: '12.5px', color: '#555' }}>Valid Aadhaar Card is mandatory for identity verification.</p>
          </div>
        </div>

        {/* NOC Download Component */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <div style={{ background: '#f0f4f8', padding: '30px', borderRadius: '24px', border: '2px dashed #003087', display: 'inline-block' }}>
            <h4 style={{ color: '#003087', fontWeight: 800, marginBottom: '10px' }}>Need the NOC Template?</h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Download the official APTRANSCO No Objection Certificate format required from your college.</p>
            <button
              onClick={downloadNocPdf}
              className="btn-noc-download"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
            >
              <FileDown size={18} /> Download NOC Format (PDF)
            </button>
          </div>
        </div>
      </div>

      <div className="cta-bar">
        <h3>Ready to Begin Your Internship Journey?</h3>
        <p style={{ marginBottom: '24px' }}>Applications are open for the Academic Year 2024–25.</p>
        <button className="btn-cta" onClick={() => navigate('/student/register')}>⚡ Apply for Internship Now</button>
      </div>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} <strong>APTRANSCO</strong>. All Rights Reserved.</p>
        <p style={{ fontSize: '11px', marginTop: '10px' }}>This is an official portal of Andhra Pradesh Transmission Corporation Limited.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
