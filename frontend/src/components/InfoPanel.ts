export function renderInfoPanel(isOpen: boolean): string {
  return `
    <aside class="info-panel ${isOpen ? 'open' : 'closed'}" id="info-panel">
      <div class="sidebar-header">
        <h2>Info</h2>
        <button class="sidebar-close-btn" id="info-panel-close-btn" aria-label="Lukk">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="info-panel-content">
        <section class="info-section">
          <h3>Kommandoer</h3>
          <ul class="command-list">
            <li class="command-item">
              <span class="command-name">/idea &lt;tekst&gt;</span>
              <span class="command-desc">Send inn en idé</span>
            </li>
            <li class="command-item">
              <span class="command-name">/ideas</span>
              <span class="command-desc">Vis alle innsendte ideer</span>
            </li>
          </ul>
        </section>
      </div>
    </aside>
  `;
}

export function initInfoPanel(onClose: () => void): void {
  const panel = document.getElementById('info-panel');
  if (!panel) return;

  panel.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button');
    if (button && button.id === 'info-panel-close-btn') {
      onClose();
    }
  });
}
