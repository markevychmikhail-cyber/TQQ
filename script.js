// ===== П’ять наречених — система акаунтів (localStorage) =====

const USERS_KEY = 'qq_users';
const LOGGED_KEY = 'qq_logged_in';
const SHARED_GALLERY_KEY = 'qq_shared_gallery';

function getAllUsers() {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getUser() {
  const name = localStorage.getItem(LOGGED_KEY);
  if (!name) return null;
  const users = getAllUsers();
  return users[name] || null;
}

function saveUser(user) {
  if (!user || !user.name) return;
  const users = getAllUsers();
  users[user.name] = user;
  saveAllUsers(users);
}

function isLoggedIn() {
  const name = localStorage.getItem(LOGGED_KEY);
  return !!name && getUser() !== null;
}

function loginUser(name) {
  localStorage.setItem(LOGGED_KEY, name);
}

function logoutUser() {
  localStorage.removeItem(LOGGED_KEY);
  window.location.href = 'login.html';
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function createDefaultAvatar(name) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const colors = ['#e8a0b0', '#c45c6a', '#8b3a4a', '#d4849a', '#f8c1cc'];
  const color = colors[initial.charCodeAt(0) % colors.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${color}"/>
      <text x="100" y="120" font-size="90" fill="white" text-anchor="middle" font-family="Segoe UI, Arial" font-weight="bold">${initial}</text>
    </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// ===== Меню: аватар + ім'я =====
function updateNavAuthLink() {
  const navUl = document.querySelector('nav ul');
  if (!navUl) return;

  let authLi = null;
  navUl.querySelectorAll('li').forEach(li => {
    const a = li.querySelector('a');
    if (!a) return;
    const text = a.textContent.trim().toLowerCase();
    if (text === 'увійти' || text === 'профіль' || a.classList.contains('nav-user')) {
      authLi = li;
    }
  });

  if (!authLi) {
    authLi = document.createElement('li');
    navUl.appendChild(authLi);
  }

  if (isLoggedIn()) {
    const user = getUser();
    const name = user ? user.name : 'Профіль';
    const photo = (user && user.photo) ? user.photo : createDefaultAvatar(name);

    authLi.innerHTML = `
      <a href="profile.html" class="nav-user" title="Мій профіль">
        <img src="${photo}" alt="${name}" class="nav-user-avatar">
        <span class="nav-user-name">${name}</span>
      </a>
    `;
  } else {
    authLi.innerHTML = `<a href="login.html">Увійти</a>`;
  }
}

// ===== Спільна галерея =====
function getSharedGallery() {
  try {
    const data = localStorage.getItem(SHARED_GALLERY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSharedGallery(images) {
  localStorage.setItem(SHARED_GALLERY_KEY, JSON.stringify(images));
}

function showSharedMessage(text, isError = false) {
  const message = document.getElementById('shared-message');
  if (!message) return;
  message.textContent = text;
  message.className = 'gallery-message' + (isError ? ' error' : ' success');
}

function renderSharedGallery() {
  const gallery = document.getElementById('shared-gallery');
  const emptyMessage = document.getElementById('shared-empty');
  if (!gallery) return;

  const images = getSharedGallery();
  gallery.replaceChildren();

  if (emptyMessage) {
    emptyMessage.style.display = images.length === 0 ? 'block' : 'none';
  }

  const currentUser = getUser();
  const currentName = currentUser ? currentUser.name : null;

  images.forEach(image => {
    const card = document.createElement('figure');
    card.className = 'user-gallery-card';

    const link = document.createElement('a');
    link.href = image.src;
    link.target = '_blank';
    link.rel = 'noopener';

    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.title || 'Фото від користувача';
    link.appendChild(img);
    card.appendChild(link);

    const caption = document.createElement('figcaption');
    caption.textContent = image.title || 'Без назви';
    card.appendChild(caption);

    const owner = document.createElement('p');
    owner.style.fontSize = '13px';
    owner.style.color = '#8b3a4a';
    owner.style.margin = '4px 0 8px';
    owner.textContent = 'Додав: ' + (image.ownerName || 'Невідомо');
    card.appendChild(owner);

    if (currentName && image.ownerName === currentName) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'gallery-remove-button';
      removeButton.textContent = 'Видалити';
      removeButton.dataset.imageId = image.id;
      card.appendChild(removeButton);
    }

    gallery.appendChild(card);
  });
}

function handleAddSharedImage(event) {
  event.preventDefault();

  if (!isLoggedIn()) {
    showSharedMessage('Спочатку увійди в акаунт.', true);
    return;
  }

  const input = document.getElementById('shared-image');
  const titleInput = document.getElementById('shared-image-title');
  const file = input.files && input.files[0];

  if (!file) {
    showSharedMessage('Спочатку обери зображення.', true);
    return;
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'];
  if (!allowed.includes(file.type)) {
    showSharedMessage('Обери зображення у форматі JPEG, PNG, WebP, GIF, AVIF або BMP.', true);
    return;
  }
  if (file.size > 1.5 * 1024 * 1024) {
    showSharedMessage('Зображення завелике. Максимум 1,5 МБ.', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    const user = getUser();
    if (!user || typeof reader.result !== 'string') {
      showSharedMessage('Не вдалося прочитати дані.', true);
      return;
    }

    const images = getSharedGallery();
    images.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      src: reader.result,
      title: titleInput.value.trim() || file.name,
      ownerName: user.name,
      createdAt: new Date().toISOString()
    });

    try {
      saveSharedGallery(images);
      renderSharedGallery();
      document.getElementById('shared-add-form').reset();
      showSharedMessage('Фото додано! Його бачать усі.');
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        showSharedMessage('Недостатньо місця в браузері. Видали кілька фото.', true);
      } else {
        showSharedMessage('Не вдалося зберегти. Спробуй ще раз.', true);
      }
    }
  };
  reader.onerror = function () {
    showSharedMessage('Не вдалося прочитати файл.', true);
  };
  reader.readAsDataURL(file);
}

function removeSharedImage(imageId) {
  if (!isLoggedIn()) return;
  const user = getUser();
  if (!user) return;

  let images = getSharedGallery();
  const photo = images.find(img => img.id === imageId);

  if (!photo || photo.ownerName !== user.name) {
    showSharedMessage('Ти можеш видаляти тільки свої фото.', true);
    return;
  }

  images = images.filter(img => img.id !== imageId);
  try {
    saveSharedGallery(images);
    renderSharedGallery();
    showSharedMessage('Фото видалено.');
  } catch (error) {
    showSharedMessage('Не вдалося оновити галерею.', true);
  }
}

function initSharedGalleryPage() {
  updateNavAuthLink();
  renderSharedGallery();

  const uploadBox = document.getElementById('shared-upload-box');
  const loginPrompt = document.getElementById('shared-login-prompt');

  if (isLoggedIn()) {
    if (uploadBox) uploadBox.style.display = 'block';
    if (loginPrompt) loginPrompt.style.display = 'none';

    const form = document.getElementById('shared-add-form');
    if (form) form.addEventListener('submit', handleAddSharedImage);

    const gallery = document.getElementById('shared-gallery');
    if (gallery) {
      gallery.addEventListener('click', function (event) {
        const button = event.target.closest('.gallery-remove-button');
        if (button) removeSharedImage(button.dataset.imageId);
      });
    }
  } else {
    if (uploadBox) uploadBox.style.display = 'none';
    if (loginPrompt) loginPrompt.style.display = 'block';
  }
}

// ===== Збережені акаунти =====
function renderSavedAccounts() {
  const box = document.getElementById('saved-accounts');
  const list = document.getElementById('saved-accounts-list');
  if (!box || !list) return;

  const users = getAllUsers();
  const names = Object.keys(users);

  if (names.length === 0) {
    box.style.display = 'none';
    return;
  }

  box.style.display = 'block';
  list.replaceChildren();

  names.forEach(name => {
    const user = users[name];
    const item = document.createElement('div');
    item.className = 'saved-account-item';

    const avatar = document.createElement('img');
    avatar.className = 'saved-account-avatar';
    avatar.src = user.photo || createDefaultAvatar(name);
    avatar.alt = name;

    const info = document.createElement('div');
    info.className = 'saved-account-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'saved-account-name';
    nameEl.textContent = name;

    const dateEl = document.createElement('div');
    dateEl.className = 'saved-account-date';
    if (user.createdAt) {
      dateEl.textContent = 'Створено: ' + new Date(user.createdAt).toLocaleDateString('uk-UA');
    }

    info.appendChild(nameEl);
    info.appendChild(dateEl);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'saved-account-remove';
    removeBtn.title = 'Видалити акаунт з цього браузера';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (confirm('Видалити акаунт «' + name + '» з цього браузера?')) {
        deleteSavedAccount(name);
      }
    });

    item.appendChild(avatar);
    item.appendChild(info);
    item.appendChild(removeBtn);

    item.addEventListener('click', function () {
      selectSavedAccount(name);
    });

    list.appendChild(item);
  });
}

function selectSavedAccount(name) {
  showTab('login');
  const nameInput = document.getElementById('login-name');
  const passInput = document.getElementById('login-password');
  if (nameInput) nameInput.value = name;
  if (passInput) {
    passInput.value = '';
    passInput.focus();
  }
  showMessage('Введи пароль для «' + name + '»');
}

function deleteSavedAccount(name) {
  const users = getAllUsers();
  delete users[name];
  saveAllUsers(users);

  if (localStorage.getItem(LOGGED_KEY) === name) {
    localStorage.removeItem(LOGGED_KEY);
  }

  renderSavedAccounts();
  showMessage('Акаунт «' + name + '» видалено з цього браузера');
}

// ===== Логін / Реєстрація =====
function showTab(tab) {
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';

  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');

  const msg = document.getElementById('auth-message');
  if (msg) {
    msg.textContent = '';
    msg.className = 'auth-message';
  }
}

function showMessage(text, isError = false) {
  const msg = document.getElementById('auth-message');
  if (!msg) return;
  msg.textContent = text;
  msg.className = 'auth-message ' + (isError ? 'error' : 'success');
}

function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('reg-name').value.trim();
  const password = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;
  const photoInput = document.getElementById('reg-photo');

  if (!name || !password) {
    showMessage('Заповніть ім’я та пароль', true);
    return;
  }
  if (password.length < 4) {
    showMessage('Пароль має бути мінімум 4 символи', true);
    return;
  }
  if (password !== password2) {
    showMessage('Паролі не збігаються', true);
    return;
  }

  const users = getAllUsers();
  if (users[name]) {
    showMessage('Користувач з таким ім’ям вже існує. Увійдіть.', true);
    return;
  }

  function finishRegister(photoData) {
    const user = {
      name: name,
      password: password,
      photo: photoData,
      createdAt: new Date().toISOString(),
      gallery: []
    };
    saveUser(user);
    loginUser(name);
    showMessage('Акаунт створено! Переходимо...');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);
  }

  if (photoInput.files && photoInput.files[0]) {
    const file = photoInput.files[0];
    if (file.size > 1.5 * 1024 * 1024) {
      showMessage('Фото занадто велике (макс. 1.5 МБ)', true);
      return;
    }
    const reader = new FileReader();
    reader.onload = function (event) {
      finishRegister(event.target.result);
    };
    reader.onerror = function () {
      showMessage('Помилка читання фото', true);
    };
    reader.readAsDataURL(file);
  } else {
    finishRegister(createDefaultAvatar(name));
  }
}

function handleLogin(e) {
  e.preventDefault();

  const name = document.getElementById('login-name').value.trim();
  const password = document.getElementById('login-password').value;
  const users = getAllUsers();
  const user = users[name];

  if (!user) {
    showMessage('Користувача з таким ім’ям не знайдено. Спочатку зареєструйтеся.', true);
    showTab('register');
    return;
  }

  if (user.password === password) {
    loginUser(name);
    showMessage('Успішний вхід! Переходимо...');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 700);
  } else {
    showMessage('Невірне ім’я або пароль', true);
  }
}

function initLoginPage() {
  if (isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const users = getAllUsers();
  const hasUsers = Object.keys(users).length > 0;

  renderSavedAccounts();

  if (!hasUsers) {
    showTab('register');
  } else {
    showTab('login');
  }

  const regForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  if (regForm) regForm.addEventListener('submit', handleRegister);
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const photoInput = document.getElementById('reg-photo');
  if (photoInput) {
    photoInput.addEventListener('change', function () {
      const preview = document.getElementById('photo-preview');
      if (this.files && this.files[0] && preview) {
        const reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  updateNavAuthLink();
}

function initProfilePage() {
  if (!requireAuth()) return;

  const user = getUser();
  if (!user) return;

  const nameEl = document.getElementById('profile-name');
  const photoEl = document.getElementById('profile-photo');
  const dateEl = document.getElementById('profile-date');

  if (nameEl) nameEl.textContent = user.name;
  if (photoEl) {
    photoEl.src = user.photo || createDefaultAvatar(user.name);
    photoEl.alt = user.name;
  }
  if (dateEl && user.createdAt) {
    const d = new Date(user.createdAt);
    dateEl.textContent = 'Акаунт створено: ' + d.toLocaleDateString('uk-UA');
  }

  const sharedCount = getSharedGallery().filter(img => img.ownerName === user.name).length;
  const privateCount = Array.isArray(user.gallery) ? user.gallery.length : 0;

  const statShared = document.getElementById('stat-shared');
  const statPrivate = document.getElementById('stat-private');
  if (statShared) statShared.textContent = sharedCount;
  if (statPrivate) statPrivate.textContent = privateCount;

  updateNavAuthLink();
}

function changeProfilePhoto(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 1.5 * 1024 * 1024) {
    alert('Фото занадто велике (макс. 1.5 МБ)');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const user = getUser();
    if (!user) return;
    user.photo = e.target.result;
    saveUser(user);
    const photoEl = document.getElementById('profile-photo');
    if (photoEl) photoEl.src = user.photo;
    updateNavAuthLink();
  };
  reader.readAsDataURL(file);
}

// ===== Особиста галерея =====
function showGalleryMessage(text, isError = false) {
  const message = document.getElementById('gallery-message');
  if (!message) return;
  message.textContent = text;
  message.className = 'gallery-message' + (isError ? ' error' : ' success');
}

function renderUserGallery() {
  const user = getUser();
  const gallery = document.getElementById('user-gallery');
  const emptyMessage = document.getElementById('gallery-empty');
  if (!user || !gallery || !emptyMessage) return;

  const images = Array.isArray(user.gallery) ? user.gallery : [];
  gallery.replaceChildren();
  emptyMessage.hidden = images.length > 0;

  images.forEach(image => {
    const card = document.createElement('figure');
    card.className = 'user-gallery-card';

    const link = document.createElement('a');
    link.href = image.src;
    link.target = '_blank';
    link.rel = 'noopener';

    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.title || 'Зображення з моєї галереї';
    link.appendChild(img);
    card.appendChild(link);

    const caption = document.createElement('figcaption');
    caption.textContent = image.title || 'Без назви';
    card.appendChild(caption);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'gallery-remove-button';
    removeButton.textContent = 'Видалити';
    removeButton.dataset.imageId = image.id;
    card.appendChild(removeButton);

    gallery.appendChild(card);
  });
}

function handleAddGalleryImage(event) {
  event.preventDefault();

  const input = document.getElementById('gallery-image');
  const titleInput = document.getElementById('gallery-image-title');
  const file = input.files && input.files[0];

  if (!file) {
    showGalleryMessage('Спочатку обери зображення.', true);
    return;
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'];
  if (!allowed.includes(file.type)) {
    showGalleryMessage('Обери зображення у форматі JPEG, PNG, WebP, GIF, AVIF або BMP.', true);
    return;
  }
  if (file.size > 1.5 * 1024 * 1024) {
    showGalleryMessage('Зображення завелике. Максимум 1,5 МБ.', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    const user = getUser();
    if (!user || typeof reader.result !== 'string') {
      showGalleryMessage('Не вдалося прочитати дані.', true);
      return;
    }

    const images = Array.isArray(user.gallery) ? user.gallery : [];
    images.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      src: reader.result,
      title: titleInput.value.trim() || file.name
    });
    user.gallery = images;

    try {
      saveUser(user);
      renderUserGallery();
      document.getElementById('add-image-form').reset();
      showGalleryMessage('Зображення додано до твоєї галереї.');
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        showGalleryMessage('Недостатньо місця. Видали кілька зображень.', true);
      } else {
        showGalleryMessage('Не вдалося зберегти.', true);
      }
    }
  };
  reader.onerror = function () {
    showGalleryMessage('Не вдалося прочитати файл.', true);
  };
  reader.readAsDataURL(file);
}

function removeGalleryImage(imageId) {
  const user = getUser();
  if (!user || !Array.isArray(user.gallery)) return;

  user.gallery = user.gallery.filter(image => image.id !== imageId);
  try {
    saveUser(user);
    renderUserGallery();
    showGalleryMessage('Зображення видалено.');
  } catch (error) {
    showGalleryMessage('Не вдалося оновити галерею.', true);
  }
}

// ===== Ініціалізація =====
document.addEventListener('DOMContentLoaded', function () {
  const path = window.location.pathname || '';
  const href = window.location.href || '';

  if (path.endsWith('login.html') || href.includes('login.html')) {
    initLoginPage();
  } else if (path.endsWith('profile.html') || href.includes('profile.html')) {
    initProfilePage();
  } else if (path.endsWith('mine_gallery.html') || href.includes('mine_gallery.html')) {
    if (requireAuth()) {
      updateNavAuthLink();
      renderUserGallery();
      const form = document.getElementById('add-image-form');
      if (form) form.addEventListener('submit', handleAddGalleryImage);
      const gallery = document.getElementById('user-gallery');
      if (gallery) {
        gallery.addEventListener('click', function (event) {
          const button = event.target.closest('.gallery-remove-button');
          if (button) removeGalleryImage(button.dataset.imageId);
        });
      }
    }
  } else if (path.endsWith('gallery.html') || href.includes('gallery.html')) {
    initSharedGalleryPage();
  } else {
    updateNavAuthLink();
  }
});