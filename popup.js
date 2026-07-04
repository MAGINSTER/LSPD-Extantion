const storageKey = 'arizonaRpHelperEnabled';
const forumUrl = 'https://forum.arizona-rp.com/';

const statusEl = document.getElementById('status');
const toggleButton = document.getElementById('toggleHelper');

function updateStatus(enabled) {
  statusEl.textContent = enabled ? 'Статус: активен' : 'Статус: отключён';
  toggleButton.textContent = enabled ? 'Отключить помощник' : 'Включить помощник';
}

async function loadState() {
  const result = await chrome.storage.local.get(storageKey);
  const enabled = result[storageKey] !== false;
  updateStatus(enabled);
  return enabled;
}

async function saveState(enabled) {
  await chrome.storage.local.set({ [storageKey]: enabled });
  updateStatus(enabled);

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.id && activeTab.url?.includes('forum.arizona-rp.com')) {
    chrome.tabs.sendMessage(activeTab.id, { type: 'toggle-helper', enabled });
  }
}

document.getElementById('openForum').addEventListener('click', () => {
  chrome.tabs.create({ url: forumUrl });
});

toggleButton.addEventListener('click', async () => {
  const enabled = await loadState();
  await saveState(!enabled);
});

loadState().catch(() => updateStatus(true));
