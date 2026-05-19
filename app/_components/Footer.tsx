export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-footer">STREET</span>
            <p>London&apos;s same-day delivery marketplace. Built for the retailers shipping it.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="https://street.london/user-terms" target="_blank" rel="noopener noreferrer">Terms</a>
              <a href="https://street.london/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy</a>
            </div>
            <div className="footer-column">
              <h4>Need help?</h4>
              <a href="mailto:support@street.london">support@street.london</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 STREET. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
