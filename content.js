                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            (function () {
  const storageKey = 'arizonaRpHelperEnabled';
  const panelId = 'arizona-rp-helper-panel';
  const customLinks = [
    {
      label: 'Discord',
      url: 'https://discord.gg/hUAs9cy9S',
    },
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
      <div class="arizona-rp-helper-panel__title">Arizona RP Helper</div>
      <div class="arizona-rp-helper-panel__body">
        <p>Форум открыт. Вы можете быстро перейти к основным разделам.</p>
        <a href="https://forum.arizona-rp.com/" target="_blank" rel="noopener noreferrer">Открыть форум</a>
      </div>
    `;

    document.body.appendChild(panel);
  }

  function render(enabled) {
    createPanel(enabled);
    if (enabled) {
      replaceForumLogo();
      replaceCustomLinks();
    }
  }

  function observePage() {
    const observer = new MutationObserver(() => {
      replaceForumLogo();
      replaceCustomLinks();
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
      }
    });

    observePage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
