class DarkModeToggle extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        button {
          background: none;
          border: none;
          cursor: pointer;
          color: currentColor;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s;
        }
        button:hover {
          background: rgba(0,0,0,0.1);
        }
        .dark button:hover {
          background: rgba(255,255,255,0.1);
        }
        i {
          width: 20px;
          height: 20px;
        }
      </style>
      <button id="toggle">
        <i data-feather="moon"></i>
      </button>
    `;
    
    const toggleBtn = this.shadowRoot.getElementById('toggle');
    
    toggleBtn.addEventListener('click', () => {
      const isDark = !document.documentElement.classList.contains('dark');
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('darkMode', isDark);
      
      const icon = toggleBtn.querySelector('i');
      icon.setAttribute('data-feather', isDark ? 'sun' : 'moon');
      feather.replace();
    });
    
    // Initialize icon based on current mode
    const isDark = localStorage.getItem('darkMode') === 'true';
    const icon = toggleBtn.querySelector('i');
    icon.setAttribute('data-feather', isDark ? 'sun' : 'moon');
    feather.replace();
  }
}

customElements.define('dark-mode-toggle', DarkModeToggle);