// ===== П’ять наречених — система акаунтів (localStorage) =====

// Імена ключів, за якими різні типи даних зберігаються в localStorage.
const USERS_KEY = 'qq_users';
const LOGGED_KEY = 'qq_logged_in';
const SHARED_GALLERY_KEY = 'qq_shared_gallery';

// Читає список акаунтів із localStorage. Якщо дані відсутні або пошкоджені,
// повертає порожній об'єкт, щоб сторінка могла продовжити роботу.
function getAllUsers() {
  try {
    // getItem повертає рядок або null; JSON.parse відновлює об'єкт із рядка.
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    // Наприклад, JSON пошкоджений — починаємо з порожнього списку акаунтів.
    return {};
  }
}

// Перетворює список акаунтів на текст JSON і зберігає його в браузері.
function saveAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Знаходить дані користувача, який зараз увійшов у систему.
function getUser() {
  const name = localStorage.getItem(LOGGED_KEY);
  if (!name) return null;
  const users = getAllUsers();
  return users[name] || null;
}

// Додає або оновлює акаунт у загальному списку користувачів.
function saveUser(user) {
  // Не зберігаємо порожнє значення або об'єкт без імені.
  if (!user || !user.name) return;
  const users = getAllUsers();
  // Ім'я користувача використовується як ключ у загальному об'єкті акаунтів.
  users[user.name] = user;
  saveAllUsers(users);
}

// Перевіряє, чи збережено вхід і чи існує відповідний акаунт.
function isLoggedIn() {
  const name = localStorage.getItem(LOGGED_KEY);
  // !! перетворює ім'я на true/false; getUser перевіряє наявність самого акаунта.
  return !!name && getUser() !== null;
}

// Запам'ятовує ім'я користувача як активний вхід.
function loginUser(name) {
  localStorage.setItem(LOGGED_KEY, name);
}

// Завершує вхід і повертає користувача на сторінку входу.
function logoutUser() {
  localStorage.removeItem(LOGGED_KEY);
  window.location.href = 'login.html';
}

// Перевіряє доступ до сторінки та перенаправляє гостя на вхід.
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    // false повідомляє ініціалізації сторінки, що продовжувати не треба.
    return false;
  }
  return true;
}

// Створює SVG-аватар із першою літерою імені, якщо фото не задано.
function createDefaultAvatar(name) {
  // Якщо ім'я порожнє, використовуємо знак питання; інакше беремо першу літеру.
  const initial = (name || '?').charAt(0).toUpperCase();
  // Код літери визначає один із кольорів, щоб аватар мав сталий колір для імені.
  const colors = ['#e8a0b0', '#c45c6a', '#8b3a4a', '#d4849a', '#f8c1cc'];
  const color = colors[initial.charCodeAt(0) % colors.length];
  // SVG — текстовий опис картинки; у шаблон вставляються літера та колір.
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${color}"/>
      <text x="100" y="120" font-size="90" fill="white" text-anchor="middle" font-family="Segoe UI, Arial" font-weight="bold">${initial}</text>
    </svg>`;
  // Кодуємо SVG у формат data URL, який браузер може використати як адресу картинки.
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// ===== Меню: аватар + ім'я =====
// Показує в меню посилання на профіль або кнопку входу.
function updateNavAuthLink() {
  // Шукаємо список посилань у меню; якщо його немає на цій сторінці, виходимо.
  const navUl = document.querySelector('nav ul');
  if (!navUl) return;

  // Перевіряємо наявні пункти меню, щоб знайти місце для входу чи профілю.
  let authLi = null;
  navUl.querySelectorAll('li').forEach(li => {
    const a = li.querySelector('a');
    if (!a) return;
    const text = a.textContent.trim().toLowerCase();
    if (text === 'увійти' || text === 'профіль' || a.classList.contains('nav-user')) {
      authLi = li;
    }
  });

  // Якщо такого пункту ще немає, створюємо новий елемент списку.
  if (!authLi) {
    authLi = document.createElement('li');
    navUl.appendChild(authLi);
  }

  if (isLoggedIn()) {
    // Для увійшлого показуємо профіль та фото або автоматично створений аватар.
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
    // Гостю показуємо посилання на сторінку входу.
    authLi.innerHTML = `<a href="login.html">Увійти</a>`;
  }
}

// ===== Спільна галерея =====
// Читає фотографії спільної галереї з браузера.
function getSharedGallery() {
  try {
    const data = localStorage.getItem(SHARED_GALLERY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    // Якщо галерею не вдалося прочитати, повертаємо порожній список фото.
    return [];
  }
}

// Зберігає фотографії спільної галереї в браузері.
function saveSharedGallery(images) {
  localStorage.setItem(SHARED_GALLERY_KEY, JSON.stringify(images));
}

// Виводить повідомлення біля форми додавання спільного фото.
function showSharedMessage(text, isError = false) {
  const message = document.getElementById('shared-message');
  // На сторінках без галереї такого елемента немає — повідомлення показати ніде.
  if (!message) return;
  message.textContent = text;
  // CSS-клас error або success визначає оформлення повідомлення.
  message.className = 'gallery-message' + (isError ? ' error' : ' success');
}

// Створює картки всіх фото та кнопку видалення лише для їхнього автора.
function renderSharedGallery() {
  const gallery = document.getElementById('shared-gallery');
  const emptyMessage = document.getElementById('shared-empty');
  if (!gallery) return;

  const images = getSharedGallery();
  // Видаляємо старі картки перед побудовою актуального списку.
  gallery.replaceChildren();

  if (emptyMessage) {
    // Повідомлення про порожню галерею видно лише тоді, коли фото немає.
    emptyMessage.style.display = images.length === 0 ? 'block' : 'none';
  }

  // Ім'я потрібне, щоб показати кнопку видалення лише автору фото.
  const currentUser = getUser();
  const currentName = currentUser ? currentUser.name : null;

  images.forEach(image => {
    // Для кожного об'єкта збереженого фото створюємо окрему картку <figure>.
    const card = document.createElement('figure');
    card.className = 'user-gallery-card';

    const link = document.createElement('a');
    // Натискання відкриває фото в новій вкладці; noopener не дає їй керувати цією.
    link.href = image.src;
    link.target = '_blank';
    link.rel = 'noopener';

    const img = document.createElement('img');
    // Значення після || використовується, якщо назви фото немає.
    img.src = image.src;
    img.alt = image.title || 'Фото від користувача';
    link.appendChild(img);
    card.appendChild(link);

    const caption = document.createElement('figcaption');
    caption.textContent = image.title || 'Без назви';
    card.appendChild(caption);

    const owner = document.createElement('p');
    // Підписуємо фото ім'ям автора; стилі задаються тут для цього елемента.
    owner.style.fontSize = '13px';
    owner.style.color = '#8b3a4a';
    owner.style.margin = '4px 0 8px';
    owner.textContent = 'Додав: ' + (image.ownerName || 'Невідомо');
    card.appendChild(owner);

    if (currentName && image.ownerName === currentName) {
      // Кнопка додається тільки до картки фото поточного автора.
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'gallery-remove-button';
      removeButton.textContent = 'Видалити';
      // ID зберігається в data-атрибуті, щоб знайти фото при натисканні.
      removeButton.dataset.imageId = image.id;
      card.appendChild(removeButton);
    }

    gallery.appendChild(card);
  });
}

// Перевіряє і додає вибране користувачем фото до спільної галереї.
function handleAddSharedImage(event) {
  // Скасовуємо стандартне надсилання форми, яке перезавантажило б сторінку.
  event.preventDefault();

  if (!isLoggedIn()) {
    showSharedMessage('Спочатку увійди в акаунт.', true);
    return;
  }

  const input = document.getElementById('shared-image');
  const titleInput = document.getElementById('shared-image-title');
  // files містить вибрані файли; беремо перший або отримуємо порожнє значення.
  const file = input.files && input.files[0];

  if (!file) {
    showSharedMessage('Спочатку обери зображення.', true);
    return;
  }

  // Браузер визначає MIME-тип файлу; дозволяємо лише перелічені типи зображень.
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'];
  if (!allowed.includes(file.type)) {
    showSharedMessage('Обери зображення у форматі JPEG, PNG, WebP, GIF, AVIF або BMP.', true);
    return;
  }
  // Розмір задається в байтах: 1,5 × 1024 × 1024 — це приблизно 1,5 МБ.
  if (file.size > 1.5 * 1024 * 1024) {
    showSharedMessage('Зображення завелике. Максимум 1,5 МБ.', true);
    return;
  }

  // FileReader перетворює файл на рядок, який можна зберегти в localStorage.
  const reader = new FileReader();
  // Ця функція виконається пізніше, коли читання файлу завершиться.
  reader.onload = function () {
    const user = getUser();
    if (!user || typeof reader.result !== 'string') {
      showSharedMessage('Не вдалося прочитати дані.', true);
      return;
    }

    const images = getSharedGallery();
    // Додаємо новий об'єкт фото до масиву; Data URL містить саме зображення.
    images.push({
      // Час і випадкова частина разом утворюють ідентифікатор фото.
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      src: reader.result,
      title: titleInput.value.trim() || file.name,
      ownerName: user.name,
      createdAt: new Date().toISOString()
    });

    try {
      // localStorage може бути заповнений, тому збереження виконується з обробкою помилки.
      saveSharedGallery(images);
      renderSharedGallery();
      document.getElementById('shared-add-form').reset();
      showSharedMessage('Фото додано! Його бачать усі.');
    } catch (error) {
      // Різні браузери називають помилку переповнення сховища по-різному.
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        showSharedMessage('Недостатньо місця в браузері. Видали кілька фото.', true);
      } else {
        showSharedMessage('Не вдалося зберегти. Спробуй ще раз.', true);
      }
    }
  };
  reader.onerror = function () {
    // Повідомляємо, якщо браузер не зміг прочитати вибраний файл.
    showSharedMessage('Не вдалося прочитати файл.', true);
  };
  // Починаємо асинхронно читати файл як текстовий Data URL.
  reader.readAsDataURL(file);
}

// Видаляє фото зі спільної галереї, лише якщо воно належить поточному користувачу.
function removeSharedImage(imageId) {
  // Видалення доступне лише користувачеві, який увійшов.
  if (!isLoggedIn()) return;
  const user = getUser();
  if (!user) return;

  let images = getSharedGallery();
  // find шукає перше фото з відповідним ID.
  const photo = images.find(img => img.id === imageId);

  if (!photo || photo.ownerName !== user.name) {
    showSharedMessage('Ти можеш видаляти тільки свої фото.', true);
    return;
  }

  // filter створює новий список без фото, яке потрібно видалити.
  images = images.filter(img => img.id !== imageId);
  try {
    saveSharedGallery(images);
    renderSharedGallery();
    showSharedMessage('Фото видалено.');
  } catch (error) {
    showSharedMessage('Не вдалося оновити галерею.', true);
  }
}

// Налаштовує спільну галерею та її обробники подій на сторінці.
function initSharedGalleryPage() {
  // Оновлюємо меню та одразу малюємо вміст галереї.
  updateNavAuthLink();
  renderSharedGallery();

  const uploadBox = document.getElementById('shared-upload-box');
  const loginPrompt = document.getElementById('shared-login-prompt');

  if (isLoggedIn()) {
    // Увійшлий бачить форму завантаження, а гість — запрошення увійти.
    if (uploadBox) uploadBox.style.display = 'block';
    if (loginPrompt) loginPrompt.style.display = 'none';

    const form = document.getElementById('shared-add-form');
    if (form) form.addEventListener('submit', handleAddSharedImage);

    const gallery = document.getElementById('shared-gallery');
    if (gallery) {
      // Один обробник на всю галерею ловить натискання на її кнопки видалення.
      gallery.addEventListener('click', function (event) {
        // closest знаходить кнопку навіть якщо натиснули на її внутрішній елемент.
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
// Показує збережені акаунти, дозволяє вибрати їх або видалити.
function renderSavedAccounts() {
  const box = document.getElementById('saved-accounts');
  const list = document.getElementById('saved-accounts-list');
  if (!box || !list) return;

  const users = getAllUsers();
  // Object.keys отримує всі імена акаунтів зі списку.
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
    // Використовуємо фото акаунта або створюємо стандартний аватар.
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
      // Перетворюємо збережений час на дату у форматі української локалі.
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
      // Не даємо кліку на кнопку одночасно вибрати весь рядок акаунта.
      e.stopPropagation();
      // Видаляємо акаунт тільки після підтвердження у вікні браузера.
      if (confirm('Видалити акаунт «' + name + '» з цього браузера?')) {
        deleteSavedAccount(name);
      }
    });

    item.appendChild(avatar);
    item.appendChild(info);
    item.appendChild(removeBtn);

    // Клік по решті картки вибирає акаунт для введення пароля.
    item.addEventListener('click', function () {
      selectSavedAccount(name);
    });

    list.appendChild(item);
  });
}

// Підставляє ім'я вибраного акаунта у форму входу.
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

// Видаляє акаунт із цього браузера та за потреби завершує його вхід.
function deleteSavedAccount(name) {
  const users = getAllUsers();
  // delete прибирає властивість із об'єкта користувачів.
  delete users[name];
  saveAllUsers(users);

  if (localStorage.getItem(LOGGED_KEY) === name) {
    localStorage.removeItem(LOGGED_KEY);
  }

  renderSavedAccounts();
  showMessage('Акаунт «' + name + '» видалено з цього браузера');
}

// ===== Логін / Реєстрація =====
// Перемикає форму між входом і створенням нового акаунта.
function showTab(tab) {
  // Тернарний оператор вибирає display залежно від активної вкладки.
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';

  // toggle додає клас active, якщо умова істинна, і знімає, якщо ні.
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');

  const msg = document.getElementById('auth-message');
  if (msg) {
    msg.textContent = '';
    msg.className = 'auth-message';
  }
}

// Показує повідомлення про результат входу чи реєстрації.
function showMessage(text, isError = false) {
  const msg = document.getElementById('auth-message');
  if (!msg) return;
  msg.textContent = text;
  // Другий аргумент визначає, чи застосувати стиль помилки, чи успіху.
  msg.className = 'auth-message ' + (isError ? 'error' : 'success');
}

// Перевіряє реєстраційні дані, створює акаунт і виконує вхід.
function handleRegister(e) {
  e.preventDefault();

  // trim прибирає пробіли на початку й у кінці імені, але не змінює пароль.
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
  // Перевіряємо, чи не зайняте таке ім'я.
  if (users[name]) {
    showMessage('Користувач з таким ім’ям вже існує. Увійдіть.', true);
    return;
  }

  // Зберігає акаунт після того, як фото прочитане або створений аватар.
  function finishRegister(photoData) {
    // Формуємо об'єкт акаунта з паролем, фото, датою створення та порожньою галереєю.
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
    // Даємо час побачити повідомлення, після чого переходимо на головну сторінку.
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
    // Після завершення читання передаємо картинку в збереження нового акаунта.
    reader.onload = function (event) {
      finishRegister(event.target.result);
    };
    reader.onerror = function () {
      showMessage('Помилка читання фото', true);
    };
    reader.readAsDataURL(file);
  } else {
    // Якщо фото не вибрали, створюємо аватар на основі імені.
    finishRegister(createDefaultAvatar(name));
  }
}

// Знаходить акаунт і перевіряє, чи збігається введений пароль.
function handleLogin(e) {
  e.preventDefault();

  const name = document.getElementById('login-name').value.trim();
  const password = document.getElementById('login-password').value;
  const users = getAllUsers();
  // Дістаємо акаунт за введеним ім'ям.
  const user = users[name];

  if (!user) {
    showMessage('Користувача з таким ім’ям не знайдено. Спочатку зареєструйтеся.', true);
    showTab('register');
    return;
  }

  if (user.password === password) {
    // При збігу пароля зберігаємо активний вхід і переходимо на головну.
    loginUser(name);
    showMessage('Успішний вхід! Переходимо...');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 700);
  } else {
    // Якщо пароль відрізняється, показуємо помилку і лишаємо форму відкритою.
    showMessage('Невірне ім’я або пароль', true);
  }
}

// Підключає форми, попередній перегляд фото та початкову вкладку сторінки входу.
function initLoginPage() {
  // Уже увійшлому користувачеві немає потреби залишатися на сторінці входу.
  if (isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const users = getAllUsers();
  // Кількість ключів показує, чи є вже акаунти в цьому браузері.
  const hasUsers = Object.keys(users).length > 0;

  renderSavedAccounts();

  if (!hasUsers) {
    showTab('register');
  } else {
    showTab('login');
  }

  const regForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  // Підключаємо функції до надсилання відповідних форм.
  if (regForm) regForm.addEventListener('submit', handleRegister);
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const photoInput = document.getElementById('reg-photo');
  if (photoInput) {
    // При зміні вибраного файлу показуємо його попередній перегляд.
    photoInput.addEventListener('change', function () {
      const preview = document.getElementById('photo-preview');
      if (this.files && this.files[0] && preview) {
        const reader = new FileReader();
        // Після читання вставляємо зображення у src елемента попереднього перегляду.
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

// Заповнює сторінку профілю даними поточного користувача та статистикою галерей.
function initProfilePage() {
  // Спочатку переконуємося, що сторінку відкрив користувач із активним входом.
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
    // ISO-дата з акаунта перетворюється на зручний для читання формат.
    const d = new Date(user.createdAt);
    dateEl.textContent = 'Акаунт створено: ' + d.toLocaleDateString('uk-UA');
  }

  // filter залишає лише спільні фото користувача, length рахує їх.
  const sharedCount = getSharedGallery().filter(img => img.ownerName === user.name).length;
  // Перевіряємо, що особиста галерея справді є масивом, перш ніж рахувати її.
  const privateCount = Array.isArray(user.gallery) ? user.gallery.length : 0;

  const statShared = document.getElementById('stat-shared');
  const statPrivate = document.getElementById('stat-private');
  if (statShared) statShared.textContent = sharedCount;
  if (statPrivate) statPrivate.textContent = privateCount;

  updateNavAuthLink();
}

// Зчитує нове фото профілю, зберігає його та оновлює зображення на сторінці.
function changeProfilePhoto(input) {
  // Нічого не робимо, якщо файл не вибрано.
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 1.5 * 1024 * 1024) {
    alert('Фото занадто велике (макс. 1.5 МБ)');
    return;
  }
  const reader = new FileReader();
  // Після читання записуємо нове фото в профіль і перемальовуємо меню.
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
// Показує повідомлення біля форми особистої галереї.
function showGalleryMessage(text, isError = false) {
  const message = document.getElementById('gallery-message');
  if (!message) return;
  message.textContent = text;
  // Додаємо клас оформлення помилки або успішної дії.
  message.className = 'gallery-message' + (isError ? ' error' : ' success');
}

// Відображає фото, збережені в особистій галереї поточного користувача.
function renderUserGallery() {
  const user = getUser();
  const gallery = document.getElementById('user-gallery');
  const emptyMessage = document.getElementById('gallery-empty');
  if (!user || !gallery || !emptyMessage) return;

  // Якщо поле gallery відсутнє або має неправильний тип, показуємо порожній список.
  const images = Array.isArray(user.gallery) ? user.gallery : [];
  gallery.replaceChildren();
  // hidden ховає повідомлення, якщо в особистій галереї є фото.
  emptyMessage.hidden = images.length > 0;

  images.forEach(image => {
    // Для кожного фото створюємо картку, посилання, зображення та підпис.
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
    // Записуємо ID фото в кнопку для подальшого видалення.
    removeButton.dataset.imageId = image.id;
    card.appendChild(removeButton);

    gallery.appendChild(card);
  });
}

// Перевіряє вибране фото та додає його до особистої галереї.
function handleAddGalleryImage(event) {
  // Не дозволяємо надсиланню форми перезавантажити сторінку.
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
  // Зчитування асинхронне: цей обробник спрацює після завершення.
  reader.onload = function () {
    const user = getUser();
    if (!user || typeof reader.result !== 'string') {
      showGalleryMessage('Не вдалося прочитати дані.', true);
      return;
    }

    const images = Array.isArray(user.gallery) ? user.gallery : [];
    // Додаємо фото з унікальним ID, його Data URL та назвою.
    images.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      src: reader.result,
      title: titleInput.value.trim() || file.name
    });
    user.gallery = images;

    try {
      // Оновлюємо акаунт у сховищі, перемальовуємо галерею та очищаємо форму.
      saveUser(user);
      renderUserGallery();
      document.getElementById('add-image-form').reset();
      showGalleryMessage('Зображення додано до твоєї галереї.');
    } catch (error) {
      // Окремо пояснюємо переповнення localStorage та інші помилки збереження.
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        showGalleryMessage('Недостатньо місця. Видали кілька зображень.', true);
      } else {
        showGalleryMessage('Не вдалося зберегти.', true);
      }
    }
  };
  reader.onerror = function () {
    // Повідомляємо, коли браузер не може прочитати фото з диска.
    showGalleryMessage('Не вдалося прочитати файл.', true);
  };
  // Запускаємо читання вибраного файлу у форматі Data URL.
  reader.readAsDataURL(file);
}

// Видаляє фото з особистої галереї поточного користувача.
function removeGalleryImage(imageId) {
  const user = getUser();
  // Без користувача або масиву фото видаляти нічого.
  if (!user || !Array.isArray(user.gallery)) return;

  // Залишаємо всі фото, крім того, ID якого передали у функцію.
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
// Після завантаження HTML визначає сторінку й запускає потрібні функції.
document.addEventListener('DOMContentLoaded', function () {
  // Беремо шлях та повну адресу поточної сторінки для визначення її типу.
  const path = window.location.pathname || '';
  const href = window.location.href || '';

  if (path.endsWith('login.html') || href.includes('login.html')) {
    // Запускаємо потрібну ініціалізацію залежно від HTML-сторінки.
    initLoginPage();
  } else if (path.endsWith('profile.html') || href.includes('profile.html')) {
    initProfilePage();
  } else if (path.endsWith('mine_gallery.html') || href.includes('mine_gallery.html')) {
    // Особиста галерея доступна лише після входу.
    if (requireAuth()) {
      updateNavAuthLink();
      renderUserGallery();
      const form = document.getElementById('add-image-form');
      if (form) form.addEventListener('submit', handleAddGalleryImage);
      const gallery = document.getElementById('user-gallery');
      if (gallery) {
        // Делегування події: один обробник на галерею працює і для її кнопок.
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