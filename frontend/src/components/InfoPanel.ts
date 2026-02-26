export function renderInfoPanel(isOpen: boolean): string {
  return `
    <aside class="info-panel ${isOpen ? 'open' : 'closed'}" id="info-panel">
      <div class="sidebar-header">
        <h2>Hjelp</h2>
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
            <li class="command-item command-item--clickable"
                role="button"
                tabindex="0"
                data-tool-name="idea"
                data-requires-input="true">
              <span class="command-name">/idea &lt;tekst&gt;</span>
              <span class="command-desc">Send inn en idé</span>
            </li>
            <li class="command-item command-item--clickable"
                role="button"
                tabindex="0"
                data-tool-name="ideas"
                data-requires-input="false">
              <span class="command-name">/ideas</span>
              <span class="command-desc">Vis alle innsendte ideer</span>
            </li>
          </ul>
        </section>
      </div>
    </aside>
  `;
}

export function initInfoPanel(
  onClose: () => void,
  onToolClick: (toolName: string, requiresInput: boolean) => void
): void {
  const panel = document.getElementById('info-panel');
  if (!panel) return;

  panel.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const closeBtn = target.closest('button');
    if (closeBtn && closeBtn.id === 'info-panel-close-btn') {
      onClose();
      return;
    }

    const toolItem = target.closest('[data-tool-name]') as HTMLElement | null;
    if (toolItem) {
      const toolName = toolItem.dataset.toolName!;
      const requiresInput = toolItem.dataset.requiresInput === 'true';
      onToolClick(toolName, requiresInput);
    }
  });

  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as HTMLElement;
    const toolItem = target.closest('[data-tool-name]') as HTMLElement | null;
    if (toolItem) {
      e.preventDefault();
      const toolName = toolItem.dataset.toolName!;
      const requiresInput = toolItem.dataset.requiresInput === 'true';
      onToolClick(toolName, requiresInput);
    }
  });
}
