                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            (function () {
  const storageKey = 'arizonaRpHelperEnabled';
  const panelId = 'arizona-rp-helper-panel';
  const customLinks = [
    {
      label: 'Discord',
      url: 'https://discord.gg/hUAs9cy9S',
    },
  ];
  const hideMenuStyleId = 'arizona-rp-helper-hide-menu-style';
  const hideMenuSelectors = [
    '.offCanvasMenu',
    '.offCanvasMenu--nav',
    '.p-sideNav',
    '.p-sideNav.is-active',
    '.p-nav',
    'nav.p-nav',
    '.p-sectionLinks',
    '.p-sideNav .p-navEl',
  ];

  function replaceForumLogo() {
    const logoImg = document.querySelector('img[alt^="Форум"]');
    if (!logoImg) {
      return;
    }

    const logoUrl = chrome.runtime.getURL('images/lspd-logo.svg');
    logoImg.src = logoUrl;
    logoImg.alt = 'Los Santos Police Department';
    logoImg.width = 40;
    logoImg.height = 36;
  }

  function hideForumMenu() {
    if (document.getElementById(hideMenuStyleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = hideMenuStyleId;
    style.textContent = `${hideMenuSelectors.join(',')} { display: none !important; visibility: hidden !important; }`;
    const head = document.head || document.documentElement;
    head.appendChild(style);
  }

  function replaceCustomLinks() {
    const anchors = Array.from(document.querySelectorAll('a'));
    customLinks.forEach(({ label, url }) => {
      const target = anchors.find((anchor) => anchor.textContent.trim().toLowerCase() === label.toLowerCase());
      if (target) {
        target.href = url;
        target.target = '_blank';
        target.rel = 'noopener noreferrer';
      }
    });
  }

  function removeCollaborationLink() {
    const anchors = Array.from(document.querySelectorAll('a'));
    const target = anchors.find((anchor) => anchor.textContent.trim().toLowerCase() === 'сотрудничество');
    if (target) {
      const parent = target.closest('li') || target.closest('.p-navEl') || target.parentElement;
      if (parent) {
        parent.remove();
        return;
      }
      target.remove();
    }
  }

  function keepOnlyAllowedComplaints() {
    const anchors = Array.from(document.querySelectorAll('a'));
    anchors.forEach((anchor) => {
      const text = anchor.textContent.trim().toLowerCase();
      if (!text) {
        return;
      }

      if (text.startsWith('жалобы') && !text.includes('tucson')) {
        const parent = anchor.closest('li') || anchor.closest('.p-navEl') || anchor.parentElement;
        if (parent) {
          parent.remove();
        } else {
          anchor.remove();
        }
      }
    });
  }

  function createPanel(enabled) {
    const existing = document.getElementById(panelId);
    if (existing) {
      existing.remove();
    }

    if (!enabled) {
      return;
    }

    const panel = document.createElement('div');
    panel.id = panelId;
    panel.innerHTML = `
      <div class="arizona-rp-helper-panel__title">LSPD Forum Helper</div>
      <div class="arizona-rp-helper-panel__body">
        <p>Форум открыт. Вы можете быстро перейти к основным разделам.</p>
        <a href="https://forum.arizona-rp.com/" target="_blank" rel="noopener noreferrer">Открыть форум</a>
        <a href="https://discord.gg/hUAs9cy9S" target="_blank" rel="noopener noreferrer">Discord</a>
      </div>
    `;

    document.body.appendChild(panel);
  }

  function render(enabled) {
    createPanel(enabled);
    if (enabled) {
      hideForumMenu();
      replaceForumLogo();
      replaceCustomLinks();
      removeCollaborationLink();
      keepOnlyAllowedComplaints();
    }
  }

  function observePage() {
    const observer = new MutationObserver(() => {
      hideForumMenu();
      replaceForumLogo();
      replaceCustomLinks();
      removeCollaborationLink();
      keepOnlyAllowedComplaints();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function init() {
    chrome.storage.local.get(storageKey, (result) => {
      const enabled = result[storageKey] !== false;
      render(enabled);
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === 'toggle-helper') {
        render(Boolean(message.enabled));
      } else if (message?.type === 'insert-quick-answer') {
        insertQuickAnswer(message.answer);
      }
    });

    observePage();
  }

  function insertQuickAnswer(answer) {
    // Ищем текстовое поле для ответа
    const textareas = document.querySelectorAll('textarea');
    let targetTextarea = null;

    // Пытаемся найти активное текстовое поле или поле ответа на форуме
    for (let textarea of textareas) {
      const style = window.getComputedStyle(textarea);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        targetTextarea = textarea;
        break;
      }
    }

    if (targetTextarea) {
      const currentValue = targetTextarea.value;
      targetTextarea.value = currentValue ? currentValue + '\n' + answer : answer;
      
      // Триггер события change для обновления UI
      targetTextarea.dispatchEvent(new Event('change', { bubbles: true }));
      targetTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      targetTextarea.focus();
    } else {
      alert('Текстовое поле для ответа не найдено. Откройте форму ответа.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
