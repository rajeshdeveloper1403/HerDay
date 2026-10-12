/* ============================================================
   MODALS MANAGER — History state & mobile gesture navigation
   ============================================================ */
import { $ } from '../core/utils.js';

let activeModalName = null;
const modalCloseHandlers = {};

export function registerModalCloser(name, fn) {
  modalCloseHandlers[name] = fn;
}

export function pushModalHistory(name) {
  activeModalName = name;
  try {
    history.pushState({ modalOpen: name }, '');
  } catch (e) {}
}

export function popModalHistory(name) {
  if (activeModalName === name) {
    activeModalName = null;
    try {
      if (history.state && history.state.modalOpen === name) {
        history.back();
      }
    } catch (e) {}
  }
}

// Global popstate handler for hardware back buttons and swipe back
window.addEventListener('popstate', () => {
  const modalNames = ['letter', 'gallery', 'lantern', 'gift', 'constellation', 'promise'];
  for (const name of modalNames) {
    const closer = modalCloseHandlers[name];
    if (closer && closer()) {
      activeModalName = null;
      return;
    }
  }
});
