class CustomNavbar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        nav {
          background: white;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-bottom: 1px solid #eaeaea;
        }
.logo { 
          color: white; 
          font-weight: 700;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        ul { 
          display: flex; 
          gap: 1.5rem; 
          list-style: none; 
          margin: 0; 
          padding: 0; 
        }
        a { 
          color: white; 
          text-decoration: none; 
          font-weight: 500;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        a:hover { 
          opacity: 0.9; 
        }
        @media (max-width: 640px) {
          nav {
            padding: 1rem;
            flex-direction: column;
            gap: 1rem;
          }
          ul {
            gap: 1rem;
          }
        }
      </style>
      <nav>
        <div class="logo">
          <i data-feather="check-circle"></i>
          TaskMaster Pro
        </div>
        <ul>
          <li><a href="#"><i data-feather="home"></i> Home</a></li>
          <li><a href="#"><i data-feather="settings"></i> Settings</a></li>
          <li><a href="#"><i data-feather="user"></i> Profile</a></li>
        </ul>
      </nav>
    `;
  }
}
customElements.define('custom-navbar', CustomNavbar);