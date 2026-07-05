const storageKey = 'arizonaRpHelperEnabled';
const quickAnswersKey = 'quickAnswers';
const quickAnswersInitKey = 'quickAnswersInitialized';
const forumUrl = 'https://forum.arizona-rp.com/';

// Предустановленные быстрые ответы
const defaultQuickAnswers = [
  'Спасибо за обращение! Ваша жалоба принята в работу.',
  'Просим вас предоставить дополнительные доказательства для рассмотрения.',
  'Благодарим за информацию. Дело закрыто.',
  'Требуется дополнительная информация от заявителя.',
  'Ваше обращение отклонено по причине недостатка доказательств.',
  'Сотрудник наказан в соответствии с внутренними правилами.',
];

const statusEl = document.getElementById('status');
const toggleButton = document.getElementById('toggleHelper');
const quickAnswersListEl = document.getElementById('quickAnswersList');
const newAnswerInput = document.getElementById('newAnswer');
const addAnswerButton = document.getElementById('addAnswer');

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

async function initializeDefaultQuickAnswers() {
  const result = await chrome.storage.local.get(quickAnswersInitKey);
  if (!result[quickAnswersInitKey]) {
    await chrome.storage.local.set({ 
      [quickAnswersKey]: defaultQuickAnswers,
      [quickAnswersInitKey]: true
    });
  }
}

async function loadQuickAnswers() {
  const result = await chrome.storage.local.get(quickAnswersKey);
  return result[quickAnswersKey] || [];
}

async function saveQuickAnswers(answers) {
  await chrome.storage.local.set({ [quickAnswersKey]: answers });
  renderQuickAnswers();
}

async function renderQuickAnswers() {
  const answers = await loadQuickAnswers();
  quickAnswersListEl.innerHTML = '';
  
  answers.forEach((answer, index) => {
    const item = document.createElement('div');
    item.className = 'quick-answer-item';
    item.innerHTML = `
      <button class="quick-answer-btn" data-index="${index}">${answer}</button>
      <button class="delete-btn" data-index="${index}">✕</button>
    `;
    quickAnswersListEl.appendChild(item);
  });

  // Добавляем обработчики
  document.querySelectorAll('.quick-answer-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id && activeTab.url?.includes('forum.arizona-rp.com')) {
        chrome.tabs.sendMessage(activeTab.id, { 
          type: 'insert-quick-answer', 
          answer: answers[e.target.dataset.index]
        });
      }
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = parseInt(e.target.dataset.index);
      answers.splice(index, 1);
      await saveQuickAnswers(answers);
    });
  });
}

addAnswerButton.addEventListener('click', async () => {
  const answer = newAnswerInput.value.trim();
  if (answer) {
    const answers = await loadQuickAnswers();
    answers.push(answer);
    await saveQuickAnswers(answers);
    newAnswerInput.value = '';
  }
});

newAnswerInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    addAnswerButton.click();
  }
});

document.getElementById('openForum').addEventListener('click', () => {
  chrome.tabs.create({ url: forumUrl });
});

toggleButton.addEventListener('click', async () => {
  const enabled = await loadState();
  await saveState(!enabled);
});

loadState().catch(() => updateStatus(true));
initializeDefaultQuickAnswers();
renderQuickAnswers();
