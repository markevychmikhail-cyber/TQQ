// ===== П’ять наречених — система акаунтів (localStorage) =====

const STORAGE_KEY = 'qq_user';
const LOGGED_KEY = 'qq_logged_in';

function getUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function isLoggedIn() {
  return localStorage.getItem(LOGGED_KEY) === 'true' && getUser() !== null;
}

function loginUser() {
  localStorage.setItem(LOGGED_KEY, 'true');
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

// Оновлює пункт меню: "Увійти" → "Профіль"
function updateNavAuthLink() {
  const navLinks = document.querySelectorAll('nav ul li a');
  navLinks.forEach(link => {
    const text = link.textContent.trim().toLowerCase();
    if (text === 'увійти' || text === 'профіль') {
      if (isLoggedIn()) {
        link.textContent = 'Профіль';
        link.href = 'profile.html';
      } else {
        link.textContent = 'Увійти';
        link.href = 'login.html';
      }
    }
  });
}

function initPage() {
  const isLoginPage = window.location.pathname.endsWith('login.html') ||
                      window.location.href.includes('login.html');

  if (!isLoginPage) {
    if (!requireAuth()) return;
  }
  updateNavAuthLink();
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

  const existing = getUser();
  if (existing && existing.name === name) {
    showMessage('Користувач з таким ім’ям вже існує. Увійдіть.', true);
    return;
  }

  function finishRegister(photoData) {
    const user = {
      name: name,
      password: password,
      photo: photoData,
      createdAt: new Date().toISOString()
    };
    saveUser(user);
    loginUser();
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
  const user = getUser();

  if (!user) {
    showMessage('Акаунтів ще немає. Спочатку зареєструйтеся.', true);
    showTab('register');
    return;
  }

  if (user.name === name && user.password === password) {
    loginUser();
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

  const user = getUser();
  if (!user) {
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
    document.getElementById('profile-photo').src = user.photo;
  };
  reader.readAsDataURL(file);
}

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
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'];
  if (!allowedImageTypes.includes(file.type)) {
    showGalleryMessage('Обери зображення у форматі JPEG, PNG, WebP, GIF, AVIF або BMP.', true);
    return;
  }
  if (file.size > 1.5 * 1024 * 1024) {
    showGalleryMessage('Зображення завелике. Максимальний розмір — 1,5 МБ.', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    const user = getUser();
    if (!user || typeof reader.result !== 'string') {
      showGalleryMessage('Не вдалося прочитати обліковий запис або зображення.', true);
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
        showGalleryMessage('У сховищі браузера недостатньо місця. Видали кілька зображень і спробуй ще раз.', true);
      } else {
        showGalleryMessage('Не вдалося зберегти зображення. Спробуй ще раз.', true);
      }
    }
  };
  reader.onerror = function () {
    showGalleryMessage('Не вдалося прочитати файл зображення.', true);
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
    showGalleryMessage('Не вдалося оновити галерею. Спробуй ще раз.', true);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const path = window.location.pathname || '';
  if (path.endsWith('login.html') || window.location.href.includes('login.html')) {
    initLoginPage();
  } else if (path.endsWith('profile.html') || window.location.href.includes('profile.html')) {
    initProfilePage();
  } else if (path.endsWith('mine_gallery.html') || window.location.href.includes('mine_gallery.html')) {
    if (requireAuth()) {
      updateNavAuthLink();
      renderUserGallery();
      document.getElementById('add-image-form').addEventListener('submit', handleAddGalleryImage);
      document.getElementById('user-gallery').addEventListener('click', function (event) {
        const button = event.target.closest('.gallery-remove-button');
        if (button) removeGalleryImage(button.dataset.imageId);
      });
    }
  } else {
    initPage();
  }
});
