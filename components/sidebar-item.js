class SidebarItem extends HTMLElement {
  connectedCallback() {
    const icon = this.getAttribute('icon') || 'folder';
    const text = this.getAttribute('text') || 'Item';
    const active = this.hasAttribute('active');

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          color: #444;
        }
        .item:hover {
          background: #f5f7fa;
        }
        .item.active {
          background: #e9e9ff;
          color: #6d27d9;
          font-weight: 500;
        }
        i {
          width: 18px;
          height: 18px;
        }
      </style>
      <div class="item ${active ? 'active' : ''}">
        <i data-feather="${icon}"></i>
        <span>${text}</span>
      </div>
    `;
  }
}
customElements.define('sidebar-item', SidebarItem);