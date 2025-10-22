class CustomFooter extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        footer {
          background: #2d3748;
          color: white;
          padding: 2rem;
          text-align: center;
          margin-top: 2rem;
        }
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }
        .footer-links a {
          color: #a0aec0;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: white;
        }
        .copyright {
          color: #a0aec0;
          font-size: 0.875rem;
        }
        @media (max-width: 640px) {
          .footer-links {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      </style>
      <footer>
        <div class="footer-content">
          <div class="footer-links">
            <a href="#">About</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
          </div>
          <div class="copyright">
            &copy; ${new Date().getFullYear()} TaskMaster Pro. All rights reserved.
          </div>
        </div>
      </footer>
    `;
  }
}
customElements.define('custom-footer', CustomFooter);