export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

let activeDialog: HTMLDivElement | null = null;
let lastFocusedElement: Element | null = null;

export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (activeDialog) {
      activeDialog.remove();
      activeDialog = null;
    }

    lastFocusedElement = document.activeElement;

    const root = document.createElement('div');
    root.className = 'confirm-dialog-backdrop';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';

    const title = document.createElement('h3');
    title.className = 'confirm-dialog-title';
    title.textContent = options.title;

    const message = document.createElement('p');
    message.className = 'confirm-dialog-message';
    message.textContent = options.message;

    const actions = document.createElement('div');
    actions.className = 'confirm-dialog-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'confirm-dialog-cancel';
    cancelBtn.textContent = options.cancelText ?? 'Avbryt';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'confirm-dialog-confirm';
    if (options.destructive) {
      confirmBtn.classList.add('confirm-dialog-confirm--destructive');
    }
    confirmBtn.textContent = options.confirmText ?? 'OK';

    actions.append(cancelBtn, confirmBtn);
    dialog.append(title, message, actions);
    root.appendChild(dialog);
    document.body.appendChild(root);

    activeDialog = root;
    document.body.style.overflow = 'hidden';

    const cleanup = (result: boolean) => {
      root.remove();
      activeDialog = null;
      document.body.style.overflow = '';
      if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
      }
      resolve(result);
    };

    cancelBtn.addEventListener('click', () => cleanup(false));
    confirmBtn.addEventListener('click', () => cleanup(true));

    root.addEventListener('click', (e) => {
      if (e.target === root) cleanup(false);
    });

    document.addEventListener('keydown', function onKey(e) {
      if (!activeDialog) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(false);
        document.removeEventListener('keydown', onKey);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        cleanup(true);
        document.removeEventListener('keydown', onKey);
      }
    });

    // Focus management
    if (options.destructive) {
      cancelBtn.focus();
    } else {
      confirmBtn.focus();
    }
  });
}
