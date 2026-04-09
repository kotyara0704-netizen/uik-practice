// База даних користувачів за замовчуванням (паролі закодовані в Base64)
const defaultUsersDB = [
    // Керівники (admin -> YWRtaW4=)
    { id: 's2', role: 'supervisor', name: 'Дзюба Тарас', password: 'YWRtaW4=' },
    { id: 's3', role: 'supervisor', name: 'Малик Роман', password: 'YWRtaW4=' },
    { id: 's1', role: 'supervisor', name: 'Чуприна Юрій', password: 'YWRtaW4=' },
    // Курсанти (1234 -> MTIzNA==)
    { id: 'c1', role: 'cadet', name: 'Гашинська Вікторія Олександрівна', password: 'MTIzNA==', photo: 'images/Гашинська Вікторія Олександрівна.PNG' },
    { id: 'c2', role: 'cadet', name: 'Карпенко Анна Олександрівна', password: 'MTIzNA==', photo: 'images/Карпенко Анна Олександрівна.PNG' },
    { id: 'c3', role: 'cadet', name: 'Комендант Софія Юріївна', password: 'MTIzNA==', photo: 'images/Комендант Софія Юріївна.PNG' },
    { id: 'c4', role: 'cadet', name: 'Типило Іван Тарасович', password: 'MTIzNA==', photo: 'images/Типило Іван Тарасович.jpg' }
];

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbaHWcf5fBhPK0_pd9K_VcZkjlkIG2VxU",
  authDomain: "practic-25627.firebaseapp.com",
  projectId: "practic-25627",
  storageBucket: "practic-25627.firebasestorage.app",
  messagingSenderId: "443774023109",
  appId: "1:443774023109:web:f18cb19659ecf66ad287ac",
  measurementId: "G-P8N3Q57LR3"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Глобальний стан додатку (синхронізується з Firebase)
let state = {
    tasks: [], 
    users: defaultUsersDB,
    awardedDates: [],
    dailyWins: {}
};

let currentUser = null;
let activeModalCadetId = null;

// Підписка на Метадані
db.collection('uik_app').doc('meta').onSnapshot(doc => {
    if(doc.exists) {
        const data = doc.data();
        state.users = data.users || defaultUsersDB;
        state.awardedDates = data.awardedDates || [];
        state.dailyWins = data.dailyWins || {};
        
        if (currentUser) {
            const freshUser = state.users.find(u => u.id === currentUser.id);
            if(freshUser) currentUser = freshUser;
        }
        reRenderApp();
    } else {
        saveMeta();
    }
});

// Підписка на Завдання
db.collection('uik_tasks').onSnapshot(snap => {
    state.tasks = [];
    snap.forEach(doc => state.tasks.push(doc.data()));
    reRenderApp();
});

function reRenderApp() {
    if(currentUser) {
        // Уникаємо виклику renderGrid, якщо ще не готовий DOM, але ми в кінці файлу.
        if (typeof renderGrid === 'function') renderGrid();
        if (typeof renderLeaderboard === 'function') renderLeaderboard();
        if (typeof renderDailyWinner === 'function') renderDailyWinner();
        if (activeModalCadetId && typeof renderModalTasks === 'function') renderModalTasks();
        const calendarModal = document.getElementById('calendarModal');
        if (calendarModal && calendarModal.classList.contains('active') && typeof renderCalendar === 'function') renderCalendar();
    }
}

function saveMeta() {
    db.collection('uik_app').doc('meta').set({
        users: state.users,
        awardedDates: state.awardedDates,
        dailyWins: state.dailyWins
    }).catch(e => console.error("Firebase Error: ", e));
}

// Заглушка, щоб старий код міг працювати, якщо не оновили
function saveState() {
    saveMeta(); // На всяк випадок зберігаємо метадані
}

// ------ DOM ЕЛЕМЕНТИ ------
const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const loginUserSelect = document.getElementById('loginUserSelect');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

const currentUserLabel = document.getElementById('currentUserLabel');
const logoutBtn = document.getElementById('logoutBtn');
const changePwdBtn = document.getElementById('changePwdBtn');
const calendarBtn = document.getElementById('calendarBtn');

const leaderboardList = document.getElementById('leaderboardList');
const dailyWinnerDisplay = document.getElementById('dailyWinnerDisplay');
const clockDisplay = document.getElementById('clockDisplay');
const scheduleStatus = document.getElementById('scheduleStatus');

const globalTaskContainer = document.getElementById('globalTaskContainer');
const globalTaskInput = document.getElementById('globalTaskInput');
const globalTaskPoints = document.getElementById('globalTaskPoints');
const globalTaskDeadline = document.getElementById('globalTaskDeadline');
const globalTaskFile = document.getElementById('globalTaskFile');
const addGlobalTaskBtn = document.getElementById('addGlobalTaskBtn');

const cadetsGrid = document.getElementById('cadetsGrid');
const taskModal = document.getElementById('taskModal');
const closeBtn = document.querySelector('.close-btn');

const modalCadetName = document.getElementById('modalCadetName');
const modalCadetImage = document.getElementById('modalCadetImage');
const modalRating = document.getElementById('modalRating');
const modalTaskCount = document.getElementById('modalTaskCount');

const cadetTaskForm = document.getElementById('cadetTaskForm');
const cadetTaskInput = document.getElementById('cadetTaskInput');
const cadetTaskPoints = document.getElementById('cadetTaskPoints');
const cadetTaskDeadline = document.getElementById('cadetTaskDeadline');
const cadetTaskFile = document.getElementById('cadetTaskFile');
const addCadetTaskBtn = document.getElementById('addCadetTaskBtn');
const taskList = document.getElementById('taskList');

const passwordModal = document.getElementById('passwordModal');
const closePwdBtn = document.getElementById('closePwdBtn');
const oldPasswordInput = document.getElementById('oldPassword');
const newPasswordInput = document.getElementById('newPassword');
const savePwdBtn = document.getElementById('savePwdBtn');
const pwdError = document.getElementById('pwdError');

const calendarModal = document.getElementById('calendarModal');
const closeCalendarBtn = document.getElementById('closeCalendarBtn');
const calendarContainer = document.getElementById('calendarContainer');

const winnerModal = document.getElementById('winnerModal');
const closeWinnerBtn = document.getElementById('closeWinnerBtn');
const winnerPhoto = document.getElementById('winnerPhoto');
const winnerName = document.getElementById('winnerName');
const winnerPoints = document.getElementById('winnerPoints');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const adminBtn = document.getElementById('adminBtn');
const reportBtn = document.getElementById('reportBtn');
const exportDataBtn = document.getElementById('exportDataBtn');
const importDataBtn = document.getElementById('importDataBtn');
const importDataInput = document.getElementById('importDataInput');

const tabActiveTasks = document.getElementById('tabActiveTasks');
const tabArchivedTasks = document.getElementById('tabArchivedTasks');
const archivedCount = document.getElementById('archivedCount');

const adminModal = document.getElementById('adminModal');
const closeAdminBtn = document.getElementById('closeAdminBtn');
const newCadetName = document.getElementById('newCadetName');
const newCadetPhoto = document.getElementById('newCadetPhoto');
const addNewCadetBtn = document.getElementById('addNewCadetBtn');
const adminCadetList = document.getElementById('adminCadetList');

const reportModal = document.getElementById('reportModal');
const closeReportBtn = document.getElementById('closeReportBtn');
const reportContainer = document.getElementById('reportContainer');

const editTaskModal = document.getElementById('editTaskModal');
const closeEditTaskBtn = document.getElementById('closeEditTaskBtn');
const editTaskTextInput = document.getElementById('editTaskTextInput');
const editTaskPointsInput = document.getElementById('editTaskPointsInput');
const editTaskDeadlineInput = document.getElementById('editTaskDeadlineInput');
const saveEditTaskBtn = document.getElementById('saveEditTaskBtn');

// Змінні стану для модалок
let showingArchived = false;
let currentEditTaskId = null;
let lastCheckTime = parseInt(localStorage.getItem('uikLastCheckTime')) || Date.now();

// ------ АВТОРИЗАЦІЯ ТА ПРОФІЛЬ ------
loginBtn.onclick = () => {
    const userId = loginUserSelect.value;
    const pass = loginPassword.value;
    if (!userId) {
        loginError.textContent = 'Будь ласка, оберіть себе зі списку.';
        return;
    }
    
    // Шукаємо актуального юзера у state.users
    const user = state.users.find(u => u.id === userId);
    
    // Кодуємо введений пароль для порівняння з хешованим
    const encodedPass = btoa(pass);
    if ((user.password !== encodedPass) && (user.password !== pass)) { // Додано pass для сумісності з старими даними
        loginError.textContent = 'Неправильний пароль!';
        return;
    }
    
    // Якщо пароль співпав в чистому вигляді (старі дані), оновлюємо на Base64
    if (user.password === pass && pass !== encodedPass) {
        user.password = encodedPass;
        saveState();
    }
    
    // Успішний вхід
    loginError.textContent = '';
    loginPassword.value = '';
    currentUser = user;
    sessionStorage.setItem('uikActiveUser', JSON.stringify(currentUser));
    showApp();
};

logoutBtn.onclick = () => {
    currentUser = null;
    sessionStorage.removeItem('uikActiveUser');
    showLogin();
};

function checkSession() {
    const saved = sessionStorage.getItem('uikActiveUser');
    if (saved) {
        const parsed = JSON.parse(saved);
        // оновлюємо сесійні дані зі state.users, якщо пароль змінився
        currentUser = state.users.find(u => u.id === parsed.id) || parsed;
        showApp();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginView.classList.remove('hidden');
    appView.classList.add('hidden');
}

function showApp() {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    
    currentUserLabel.innerHTML = `<strong>${currentUser.role === 'supervisor' ? 'Керівник:' : 'Курсант:'}</strong> ${currentUser.name}`;
    
    // RBAC
    if (currentUser.role === 'supervisor') {
        globalTaskContainer.classList.remove('hidden');
        calendarBtn.classList.remove('hidden');
    } else {
        globalTaskContainer.classList.add('hidden');
        calendarBtn.classList.add('hidden');
    }
    
    renderGrid();
    renderLeaderboard();
    renderDailyWinner();
}

// ------ ЗМІНА ПАРОЛЮ ТА ДОДАТОК (УТІЛІТИ) ------

changePwdBtn.onclick = () => {
    passwordModal.classList.add('active');
    pwdError.textContent = '';
    oldPasswordInput.value = '';
    newPasswordInput.value = '';
}

function closePwdModal() {
    passwordModal.classList.remove('active');
}

closePwdBtn.onclick = closePwdModal;

savePwdBtn.onclick = () => {
    const oldP = oldPasswordInput.value;
    const newP = newPasswordInput.value;
    
    if (oldP !== currentUser.password) {
        pwdError.textContent = 'Старий пароль не співпадає!';
        return;
    }
    
    if (newP.length < 3) {
        pwdError.textContent = 'Новий пароль занадто короткий!';
        return;
    }
    
    // Знаходимо у state.users та оновлюємо
    const userIndex = state.users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        state.users[userIndex].password = newP;
        currentUser.password = newP;
        saveState();
        sessionStorage.setItem('uikActiveUser', JSON.stringify(currentUser));
        
        pwdError.style.color = '#22c55e';
        pwdError.textContent = 'Пароль успішно змінено!';
        setTimeout(() => {
            pwdError.style.color = '';
            closePwdModal();
        }, 1500);
    }
};

// ------ ГОДИННИК ТА РОЗКЛАД ------
function updateClock() {
    if (!clockDisplay) return;
    const now = new Date();
    clockDisplay.textContent = now.toLocaleTimeString('uk-UA');
    
    const day = now.getDay(); // 0=Нд, 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб
    const h = now.getHours();
    const m = now.getMinutes();
    
    // Вівторок = 2, Четвер = 4
    if (day === 2 || day === 4) {
        const timeVal = h + m / 60;
        
        if (timeVal >= 8.5 && timeVal < 12) {
            scheduleStatus.innerHTML = '<span class="status-active">🔴 Практика (До обіду)</span>';
        } else if (timeVal >= 12 && timeVal < 14) {
            scheduleStatus.innerHTML = '<span class="status-break">☕ Обідня перерва</span>';
        } else if (timeVal >= 14 && timeVal < 17) {
            scheduleStatus.innerHTML = '<span class="status-active">🔴 Практика (Після обіду)</span>';
        } else {
            scheduleStatus.innerHTML = '<span class="status-off">Не робочий час</span>';
        }
    } else {
        scheduleStatus.innerHTML = '<span class="status-off">Сьогодні немає практики</span>';
    }
    
    checkDailyWinners(now);
}
setInterval(updateClock, 1000);
updateClock();

function checkDailyWinners(now) {
    if (!state.awardedDates) state.awardedDates = [];
    if (!state.dailyWins) state.dailyWins = {};

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const h = now.getHours();
    
    const completedTasks = state.tasks.filter(t => t.completed && t.completedAt);
    const tasksByDate = {};
    completedTasks.forEach(t => {
        const d = t.completedAt.split('T')[0];
        if (!tasksByDate[d]) tasksByDate[d] = [];
        tasksByDate[d].push(t);
    });

    let stateChanged = false;

    Object.keys(tasksByDate).forEach(date => {
        if (state.awardedDates.includes(date)) return;
        
        let shouldAward = false;
        if (date < todayStr) {
            shouldAward = true;
        } else if (date === todayStr && h >= 17) {
            shouldAward = true;
        }

        if (shouldAward) {
            const pointsMap = {};
            tasksByDate[date].forEach(t => {
                if (!pointsMap[t.cadetId]) pointsMap[t.cadetId] = 0;
                pointsMap[t.cadetId] += (Number(t.points) || 10);
            });
            
            let topCadetId = null;
            let maxPoints = -1; // Must beat 0 to get a win, or if they have points, they win
            Object.keys(pointsMap).forEach(cid => {
                if (pointsMap[cid] > maxPoints) {
                    maxPoints = pointsMap[cid];
                    topCadetId = cid;
                }
            });
            
            if (topCadetId && maxPoints > 0) {
                if (!state.dailyWins[topCadetId]) state.dailyWins[topCadetId] = 0;
                state.dailyWins[topCadetId]++;
                
                if (date === todayStr) {
                    showWinnerModal(topCadetId, maxPoints);
                }
            }
            
            state.awardedDates.push(date);
            stateChanged = true;
        }
    });

    if (stateChanged) {
        saveState();
        renderGrid();
        renderLeaderboard();
        renderDailyWinner();
    }
}

function showWinnerModal(cadetId, points) {
    const cadet = state.users.find(u => u.id === cadetId);
    if (!cadet) return;
    
    winnerPhoto.src = cadet.photo;
    winnerName.textContent = cadet.name;
    winnerPoints.textContent = points;
    winnerModal.classList.add('active');
}

if (closeWinnerBtn) {
    closeWinnerBtn.onclick = () => {
        winnerModal.classList.remove('active');
    };
}

// ------ УТІЛІТИ ------

function formatDate(dateStr) {
    if (!dateStr) return 'Без терміну';
    const d = new Date(dateStr);
    return d.toLocaleDateString('uk-UA');
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadline = new Date(dateStr);
    return deadline < today;
}

// Бали курсанта за поточну дату (рейтинг обнуляється щодня)
function getCadetRating(cadetId, dateStr = null) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const completedTasks = state.tasks.filter(t => t.cadetId === cadetId && t.completed && t.completedAt && t.completedAt.startsWith(targetDate));
    return completedTasks.reduce((sum, t) => sum + (Number(t.points) || 10), 0);
}

function getBase64Safe(file, callback) {
    if (!file) return callback(null);
    if (file.size > 600 * 1024) { // Ліміт 600КБ для Firestore
        alert("Файл завеликий! Будь ласка, оберіть файл до 600 Кб.");
        return callback(null);
    }
    const ext = file.name.split('.').pop().toLowerCase();
    const validExt = ['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg', 'txt'];
    if (!validExt.includes(ext)) {
        alert("Недопустимий формат файлу. Дозволені: " + validExt.join(', '));
        return callback(null);
    }
    const reader = new FileReader();
    reader.onload = () => callback({ name: file.name, data: reader.result });
    reader.onerror = () => callback(null);
    reader.readAsDataURL(file);
}

function renderGrid() {
    cadetsGrid.innerHTML = '';
    const cadets = state.users.filter(u => u.role === 'cadet');
    
    // Перевірка на нові події з моменту останнього входу (для сповіщень)
    const storedCheck = parseInt(localStorage.getItem('uikLastCheckTime')) || 0;
    
    cadets.forEach(cadet => {
        const cadetTasks = state.tasks.filter(t => t.cadetId === cadet.id);
        const completedCount = cadetTasks.filter(t => t.completed).length;
        const totalCount = cadetTasks.length;
        const pendingCount = totalCount - completedCount;
        const rating = getCadetRating(cadet.id);
        const wins = (state.dailyWins && state.dailyWins[cadet.id]) ? state.dailyWins[cadet.id] : 0;
        const medalsHTML = wins > 0 ? `<div class="win-badges" style="margin-bottom:8px; font-weight:600; color:var(--gold);">🏆 ${wins} перемог</div>` : '';
        
        // Progress Bar
        const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
        const progressHTML = `
            <div class="progress-container" title="Прогрес: ${progressPct}%">
                <div class="progress-fill" style="width: ${progressPct}%"></div>
            </div>
        `;

        // Notification Indicator
        let hasNotification = false;
        // Якщо це сам курсант дивиться
        if (currentUser && currentUser.id === cadet.id) {
            hasNotification = cadetTasks.some(t => {
                const isNewTask = (!t.createdAt || t.createdAt > storedCheck);
                const hasNewComment = (t.comments && t.comments.some(c => c.time > storedCheck));
                return isNewTask || hasNewComment;
            });
        } else if (currentUser && currentUser.role === 'supervisor') {
            // Для керівника - чи є виконані після останньої перевірки
            hasNotification = cadetTasks.some(t => t.completed && t.completedAt > storedCheck);
        }

        const notificationHTML = hasNotification ? `<div class="notification-dot" title="Є оновлення!"></div>` : '';
        
        const card = document.createElement('div');
        card.classList.add('cadet-card');
        card.onclick = () => {
             // оновлюємо час перегляду
             if (currentUser.id === cadet.id || currentUser.role === 'supervisor') {
                 localStorage.setItem('uikLastCheckTime', Date.now());
             }
             openModal(cadet.id);
             renderGrid(); // прибираємо індикатор
        };
        
        card.innerHTML = `
            ${notificationHTML}
            <div class="rating-badge">Сьогодні: ${rating} XP</div>
            ${medalsHTML}
            <img src="${cadet.photo}" alt="${cadet.name}" class="cadet-photo">
            <h3 class="cadet-name">${cadet.name}</h3>
            <div class="task-stats">
                <span>В роботі: ${pendingCount}</span>
                <span class="completed">Готово: ${completedCount}</span>
            </div>
            ${progressHTML}
        `;
        cadetsGrid.appendChild(card);
    });
}
// ------ МОДАЛКА ЗАВДАНЬ ПО КУРСАНТУ ------
function openModal(cadetId) {
    const cadet = state.users.find(u => u.id === cadetId);
    if (!cadet) return;
    
    activeModalCadetId = cadetId;
    modalCadetName.textContent = cadet.name;
    modalCadetImage.src = cadet.photo;
    
    if (currentUser.role === 'supervisor') {
        cadetTaskForm.classList.remove('hidden');
    } else {
        cadetTaskForm.classList.add('hidden');
    }
    
    renderModalTasks();
    taskModal.classList.add('active');
}

function closeModal() {
    taskModal.classList.remove('active');
    activeModalCadetId = null;
    cadetTaskInput.value = '';
    cadetTaskDeadline.value = '';
    if(cadetTaskFile) cadetTaskFile.value = '';
}

closeBtn.onclick = closeModal;
window.onclick = (e) => {
    if (e.target === taskModal) closeModal();
    if (e.target === passwordModal) closePwdModal();
    if (e.target === calendarModal) closeCalendar();
}

function renderModalTasks() {
    let cadetTasks = state.tasks.filter(t => t.cadetId === activeModalCadetId);
    
    // Відображаємо кількість заархівованих
    const archivedTasks = cadetTasks.filter(t => t.archived);
    if(archivedCount) archivedCount.textContent = archivedTasks.length;
    
    // Фільтруємо за табою
    cadetTasks = cadetTasks.filter(t => (showingArchived ? t.archived : !t.archived));
    
    modalTaskCount.textContent = cadetTasks.length;
    modalRating.textContent = getCadetRating(activeModalCadetId);
    
    taskList.innerHTML = '';
    
    if (cadetTasks.length === 0) {
        taskList.innerHTML = `<p style="text-align:center; color:#94a3b8; padding: 20px;">${showingArchived ? 'Архів порожній' : 'Завдань ще немає'}</p>`;
        return;
    }
    
    // Сортування
    cadetTasks.sort((a,b) => {
        if(a.completed === b.completed) {
            if(!a.deadline) return 1;
            if(!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        }
        return a.completed ? 1 : -1;
    });

    cadetTasks.forEach(task => {
        const li = document.createElement('li');
        li.classList.add('task-item');
        if (task.completed) li.classList.add('is-completed');
        
        const overdueClass = (!task.completed && isOverdue(task.deadline)) ? 'overdue' : '';
        const deadlineText = formatDate(task.deadline);
        
        // Розрахунок таймера
        let timerText = '';
        if (!task.completed && task.deadline) {
            const now = new Date();
            const dl = new Date(task.deadline);
            dl.setHours(23, 59, 59); // дедлайн кінця дня
            const diffMs = dl - now;
            if (diffMs > 0) {
                const h = Math.floor(diffMs / (1000 * 60 * 60));
                const d = Math.floor(h / 24);
                timerText = (d > 0) ? `Залишилося: ${d} дн.` : `Залишилось: ${h} год.`;
                timerText = `<span style="margin-left: 10px; color: var(--gold); font-size: 0.8rem;">⏳ ${timerText}</span>`;
            }
        }
        
        let actionButtons = '';
        const isMyTask = (currentUser.role === 'cadet' && currentUser.id === activeModalCadetId);
        
        if (currentUser.role === 'supervisor') {
            actionButtons = `
                <button class="btn-sm" style="color:var(--gold); border-color:var(--gold);" title="Редагувати" onclick="editTask('${task.id}')">✏️</button>
                <button class="btn-sm btn-success" onclick="toggleTask('${task.id}')">${task.completed ? 'Відмінити' : 'Зроблено'}</button>
                <button class="btn-sm btn-danger" onclick="deleteTask('${task.id}')">Видалити</button>
            `;
            if(task.completed && !task.archived) {
                 actionButtons += `<button class="btn-sm" onclick="archiveTask('${task.id}')">📦 В архів</button>`;
            }
        } else if (isMyTask) {
            if (!task.archived) {
                actionButtons = `
                    <button class="btn-sm btn-success" onclick="toggleTask('${task.id}')">${task.completed ? 'Відмінити' : 'Позначити виконаним'}</button>
                `;
            }
        } else {
            actionButtons = `<span style="font-size:0.8rem; color:#94a3b8;">Лише перегляд</span>`;
        }

        // Документи від керівника
        const docsHTML = (task.documents && task.documents.length > 0) ? 
            task.documents.map(d => `<a href="${d.data}" download="${d.name}" class="doc-link">📄 ${d.name}</a>`).join('') : '';
        
        // Звіти від курсанта
        let proofsHTML = '';
        if (task.proofs && task.proofs.length > 0) {
            proofsHTML = task.proofs.map(p => `
                <div class="proof-item">
                    <a href="${p.data}" download="${p.name}" class="doc-link success-link">✅ Звіт: ${p.name}</a>
                    ${(isMyTask || currentUser.role === 'supervisor') && (!task.archived) ? `<button class="btn-clear" onclick="deleteProof('${task.id}','${p.name}')">❌</button>` : ''}
                </div>
            `).join('');
        }
        
        const addProofBtn = (!task.completed && !task.archived && isMyTask) ? `
            <div class="add-proof-form flex" style="align-items: center; gap: 5px;">
                <input type="file" id="proofFile_${task.id}" class="file-input-sm" style="flex:1" accept=".pdf,.doc,.docx,.jpg,.png">
                <button class="btn-sm" onclick="uploadProof('${task.id}')">Додати звіт</button>
            </div>
        ` : '';

        // Коментарі
        const commentsHTML = (task.comments && task.comments.length > 0) ? 
            task.comments.map(c => `
                <div class="comment-msg">
                    <strong>${c.authorName}:</strong> <span>${c.text}</span>
                </div>
            `).join('') : '';

        const commentInputHTML = ((isMyTask || currentUser.role === 'supervisor') && !task.archived) ? `
            <div class="comment-input-row">
                <input type="text" id="commentInput_${task.id}" class="comment-input" placeholder="Коментар...">
                <button class="btn-sm" onclick="postComment('${task.id}')">Відправити</button>
            </div>
        ` : '';

        li.innerHTML = `
            <div class="task-header">
                <span class="task-text">${task.text}</span>
                <div class="task-actions">${actionButtons}</div>
            </div>
            <div class="task-meta">
                <span class="task-author">👤 Від: <strong>${task.authorName}</strong></span>
                <span class="task-deadline ${overdueClass}">⏰ Дедлайн: ${deadlineText} ${timerText}</span>
                <span class="task-points badge-gold">+${task.points || 10} XP</span>
            </div>
            
            ${docsHTML ? `<div class="task-docs">${docsHTML}</div>` : ''}
            
            <div class="task-proofs-section">
                ${proofsHTML}
                ${addProofBtn}
            </div>
            
            <div class="task-comments">
                ${commentsHTML}
                ${commentInputHTML}
            </div>
        `;
        taskList.appendChild(li);
    });
}

// ------ ДОДАВАННЯ ЗАВДАНЬ ТА ДОКУМЕНТІВ ------
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

addCadetTaskBtn.onclick = () => {
    const text = cadetTaskInput.value.trim();
    if (!text || !activeModalCadetId) return;
    
    const rawPoints = parseInt(cadetTaskPoints.value) || 10;
    const points = Math.min(rawPoints, 10);
    const file = cadetTaskFile.files[0];

    const newTask = {
        id: generateId(),
        cadetId: activeModalCadetId,
        text: text,
        points: points,
        authorId: currentUser.id,
        authorName: currentUser.name,
        deadline: cadetTaskDeadline.value,
        completed: false,
        documents: [],
        proofs: [],
        comments: []
    };

    if (file) {
        getBase64Safe(file, (fileObj) => {
            if (fileObj) newTask.documents.push(fileObj);
            db.collection('uik_tasks').doc(newTask.id).set(newTask);
        });
    } else {
        db.collection('uik_tasks').doc(newTask.id).set(newTask);
    }

    cadetTaskInput.value = '';
    cadetTaskDeadline.value = '';
    cadetTaskFile.value = '';
};

addGlobalTaskBtn.onclick = () => {
    const text = globalTaskInput.value.trim();
    if (!text) return;

    const cadets = state.users.filter(u => u.role === 'cadet');
    const deadline = globalTaskDeadline.value;
    const rawPoints = parseInt(globalTaskPoints.value) || 10;
    const points = Math.min(rawPoints, 10);
    const file = globalTaskFile.files[0];

    const assignToAll = (fileObj) => {
        cadets.forEach(cadet => {
            const newTask = {
                id: generateId(),
                cadetId: cadet.id,
                text: text,
                points: points,
                authorId: currentUser.id,
                authorName: currentUser.name,
                deadline: deadline,
                completed: false,
                documents: fileObj ? [fileObj] : [],
                proofs: [],
                comments: []
            };
            db.collection('uik_tasks').doc(newTask.id).set(newTask);
        });
        
        globalTaskInput.value = '';
        globalTaskDeadline.value = '';
        globalTaskFile.value = '';
        
        addGlobalTaskBtn.textContent = 'Призначено всім!';
        addGlobalTaskBtn.classList.add('btn-success');
        setTimeout(() => {
            addGlobalTaskBtn.textContent = 'Призначити всім';
            addGlobalTaskBtn.classList.remove('btn-success');
        }, 2000);
    };

    if (file) {
        getBase64Safe(file, (f) => assignToAll(f));
    } else {
        assignToAll(null);
    }
};

// ------ ДІЇ З ЗАВДАННЯМИ (КОМЕНТАРІ, ЗВІТИ) ------
window.toggleTask = (taskId) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (currentUser.role === 'supervisor' || (currentUser.role === 'cadet' && currentUser.id === task.cadetId)) {
        task.completed = !task.completed;
        if (task.completed) {
            task.completedAt = new Date().toISOString();
        } else {
            delete task.completedAt;
        }
        db.collection('uik_tasks').doc(task.id).update({
            completed: task.completed,
            completedAt: task.completedAt || firebase.firestore.FieldValue.delete()
        });
    }
};

window.deleteTask = (taskId) => {
    if (currentUser.role !== 'supervisor') return;
    db.collection('uik_tasks').doc(taskId).delete();
};

window.postComment = (taskId) => {
    const input = document.getElementById(`commentInput_${taskId}`);
    if (!input || !input.value.trim()) return;
    
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        if (!task.comments) task.comments = [];
        task.comments.push({
            authorName: currentUser.name,
            text: input.value.trim(),
            time: new Date().toISOString()
        });
        db.collection('uik_tasks').doc(task.id).update({ comments: task.comments });
    }
};

window.uploadProof = (taskId) => {
    const fileInput = document.getElementById(`proofFile_${taskId}`);
    if (!fileInput || !fileInput.files[0]) {
        alert("Оберіть файл для звіту!");
        return;
    }
    
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    getBase64Safe(fileInput.files[0], (fileObj) => {
        if (fileObj) {
            if (!task.proofs) task.proofs = [];
            task.proofs.push(fileObj);
            db.collection('uik_tasks').doc(taskId).update({ proofs: task.proofs });
        }
    });
};

window.deleteProof = (taskId, proofName) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.proofs) return;
    task.proofs = task.proofs.filter(p => p.name !== proofName);
    db.collection('uik_tasks').doc(taskId).update({ proofs: task.proofs });
};

// ------ КАЛЕНДАР КЕРІВНИКА ------
calendarBtn.onclick = () => {
    if (currentUser.role !== 'supervisor') return;
    calendarModal.classList.add('active');
    renderCalendar();
};

function closeCalendar() {
    calendarModal.classList.remove('active');
}
closeCalendarBtn.onclick = closeCalendar;

let currentCalendarDate = new Date();

function renderCalendar() {
    calendarContainer.innerHTML = '';
    
    const allTasks = state.tasks;
    
    // Хедер календаря
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
    
    const headerDiv = document.createElement('div');
    headerDiv.classList.add('cal-header');
    headerDiv.innerHTML = `
        <button class="btn-secondary btn-sm" onclick="changeMonth(-1)">&lt;</button>
        <h3>${monthNames[month]} ${year}</h3>
        <button class="btn-secondary btn-sm" onclick="changeMonth(1)">&gt;</button>
    `;
    calendarContainer.appendChild(headerDiv);
    
    // Дні тижня
    const daysRow = document.createElement('div');
    daysRow.classList.add('cal-weekdays');
    const weekdays = ['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    weekdays.forEach(d => {
        daysRow.innerHTML += `<div>${d}</div>`;
    });
    calendarContainer.appendChild(daysRow);
    
    // Сітка днів
    const gridDiv = document.createElement('div');
    gridDiv.classList.add('cal-grid');
    
    let firstDay = new Date(year, month, 1).getDay();
    if (firstDay === 0) firstDay = 7; // Понеділок = 1
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Порожні клітинки на початку
    for (let i = 1; i < firstDay; i++) {
        gridDiv.innerHTML += `<div class="cal-cell empty"></div>`;
    }
    
    // Клітинки днів
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const dayTasks = allTasks.filter(t => t.deadline === dateStr);
        
        let isToday = (today.getDate() === i && today.getMonth() === month && today.getFullYear() === year);
        
        let cellHTML = `<div class="cal-cell ${isToday ? 'today' : ''}">
            <div class="cal-date">${i}</div>
            <div class="cal-tasks">`;
            
        dayTasks.forEach(t => {
            const cadet = state.users.find(u => u.id === t.cadetId);
            const cadetName = cadet ? cadet.name.split(' ')[0] : 'К.';
            const trClass = t.completed ? 'task-done' : 'task-pending';
            cellHTML += `<div class="cal-task-pill ${trClass}" title="${t.text}">[${cadetName}] ${t.completed ? '✅' : '⏳'}</div>`;
        });
        
        cellHTML += `</div></div>`;
        gridDiv.innerHTML += cellHTML;
    }
    
    calendarContainer.appendChild(gridDiv);
    
    // Завдання без дедлайну
    const noDeadlineTasks = allTasks.filter(t => !t.deadline);
    if(noDeadlineTasks.length > 0) {
        const noDeadlinediv = document.createElement('div');
        noDeadlinediv.style.marginTop = '20px';
        let htmlList = `<h4 style="margin-bottom:10px;">Завдання без дедлайну:</h4><ul style="padding-left: 20px; font-size: 0.9rem; color: #cbd5e1; list-style-type: disc;">`;
        noDeadlineTasks.forEach(t => {
            const cadet = state.users.find(u => u.id === t.cadetId);
            const cadetName = cadet ? cadet.name.split(' ')[0] : 'К.';
            htmlList += `<li>[${cadetName}] ${t.text} (${t.completed ? '✅' : '⏳'})</li>`;
        });
        htmlList += `</ul>`;
        noDeadlinediv.innerHTML = htmlList;
        calendarContainer.appendChild(noDeadlinediv);
    }
}

window.changeMonth = (delta) => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
};

// ------ ВІДЖЕТИ БОКОВОГО МЕНЮ ------
function renderLeaderboard() {
    if (!leaderboardList) return;
    leaderboardList.innerHTML = '';
    
    const cadets = state.users.filter(u => u.role === 'cadet');
    cadets.sort((a,b) => getCadetRating(b.id) - getCadetRating(a.id));
    
    cadets.forEach((cadet, index) => {
        let badge = '';
        if (index === 0) badge = '🥇';
        else if (index === 1) badge = '🥈';
        else if (index === 2) badge = '🥉';
        
        const shortName = cadet.name.split(' ').slice(0,2).join(' ');
        const wins = (state.dailyWins && state.dailyWins[cadet.id]) ? state.dailyWins[cadet.id] : 0;
        const medalsHTML = wins > 0 ? `<span class="win-medal" title="${wins} перемог">🏆x${wins}</span>` : '';
        
        leaderboardList.innerHTML += `
            <li>
                <span>${badge} ${index+1}. ${shortName} ${medalsHTML}</span>
                <strong>${getCadetRating(cadet.id)} XP</strong>
            </li>
        `;
    });
}

function renderDailyWinner() {
    if (!dailyWinnerDisplay) return;
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    
    const completedToday = state.tasks.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        return t.completedAt.startsWith(todayStr); // YYYY-MM-DD
    });
    
    if (completedToday.length === 0) {
        dailyWinnerDisplay.innerHTML = 'Ще немає балів сьогодні';
        return;
    }
    
    const pointsMap = {};
    completedToday.forEach(t => {
        if (!pointsMap[t.cadetId]) pointsMap[t.cadetId] = 0;
        pointsMap[t.cadetId] += (Number(t.points) || 10);
    });
    
    let topCadetId = null;
    let maxPoints = 0;
    
    Object.keys(pointsMap).forEach(cid => {
        if (pointsMap[cid] > maxPoints) {
            maxPoints = pointsMap[cid];
            topCadetId = cid;
        }
    });
    
    const topCadet = state.users.find(u => u.id === topCadetId);
    if (topCadet) {
        const shortName = topCadet.name.split(' ').slice(0,2).join(' ');
        dailyWinnerDisplay.innerHTML = `<span style="display:block; font-size:1.1rem; margin-bottom:5px;">${shortName}</span> <span class="badge-gold" style="font-size:0.9rem;">+${maxPoints} XP</span>`;
    }
}


// ====== НОВИЙ ФУНКЦІОНАЛ ======

// 1. Тема Світла/Темна
const currentTheme = localStorage.getItem('uikTheme') || 'dark';
if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
}

if(themeToggleBtn) {
    themeToggleBtn.onclick = () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('uikTheme', isLight ? 'light' : 'dark');
    };
}

// 2. Імпорт / Експорт (Backup)
if (exportDataBtn) {
    exportDataBtn.onclick = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "uikBaseBackup.json");
        dlAnchorElem.click();
    };
}

if (importDataBtn && importDataInput) {
    importDataBtn.onclick = () => importDataInput.click();
    importDataInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const newState = JSON.parse(event.target.result);
                if(newState && newState.users && newState.tasks) {
                    state.users = newState.users;
                    state.awardedDates = newState.awardedDates || [];
                    state.dailyWins = newState.dailyWins || {};
                    saveMeta();
                    newState.tasks.forEach(t => db.collection('uik_tasks').doc(t.id).set(t));
                    alert('Дані успішно відновлено. Сторінка буде перезавантажена.');
                    location.reload();
                } else {
                    alert('Некоректний файл бекапу.');
                }
            } catch(err) {
                alert('Помилка читання файлу JSON.');
            }
        };
        reader.readAsText(file);
    };
}

// 3. Адмінка (додавання курсантів)
if(adminBtn) adminBtn.onclick = () => {
    if(currentUser.role !== 'supervisor') return;
    adminModal.classList.add('active');
    renderAdminCadets();
};

if(closeAdminBtn) closeAdminBtn.onclick = () => adminModal.classList.remove('active');

function renderAdminCadets() {
    if (!adminCadetList) return;
    adminCadetList.innerHTML = '';
    const cadets = state.users.filter(u => u.role === 'cadet');
    cadets.forEach(c => {
        adminCadetList.innerHTML += `
            <li class="admin-cadet-card">
                <div class="admin-cadet-info">
                    <img src="${c.photo || 'images/default.png'}" class="admin-cadet-photo">
                    <span>${c.name}</span>
                </div>
            </li>
        `;
    });
}

if(addNewCadetBtn) addNewCadetBtn.onclick = () => {
    const name = newCadetName.value.trim();
    if(!name) return alert('Введіть ПІБ курсанта');
    const file = newCadetPhoto.files[0];
    
    const finishAdd = (photoData) => {
        const newId = 'c' + (state.users.filter(u => u.role === 'cadet').length + 1) + '_' + Date.now();
        state.users.push({
            id: newId, role: 'cadet', name: name, password: btoa('1234'), photo: photoData || ''
        });
        saveMeta();
        newCadetName.value = '';
        newCadetPhoto.value = '';
        if (document.getElementById('newCadetPhotoDropZone')) {
            document.getElementById('newCadetPhotoDropZone').querySelector('.drop-zone-text').innerText = 'Перетягніть фото (до 1 Мб)';
        }
        renderAdminCadets();
        renderGrid();
    };

    if(file) {
        if(file.size > 1024 * 1024) return alert('Фото занадто велике. До 1 МБ.');
        const reader = new FileReader();
        reader.onload = () => finishAdd(reader.result);
        reader.readAsDataURL(file);
    } else {
        finishAdd(''); // або дефолтне фото
    }
};

// 4. Звітність
if(reportBtn) reportBtn.onclick = () => {
    if(currentUser.role !== 'supervisor') return;
    reportModal.classList.add('active');
    generateReport();
};
if(closeReportBtn) closeReportBtn.onclick = () => reportModal.classList.remove('active');

function generateReport() {
    let reportHTML = `<table>
        <thead>
            <tr>
                <th>ПІБ Курсанта</th>
                <th>Виконано завдань</th>
                <th>Загальний XP</th>
                <th>Перемог дня</th>
            </tr>
        </thead>
        <tbody>
    `;
    const cadets = state.users.filter(u => u.role === 'cadet');
    cadets.forEach(c => {
        const cadetTasks = state.tasks.filter(t => t.cadetId === c.id);
        const completed = cadetTasks.filter(t => t.completed).length;
        const totalXP = cadetTasks.filter(t => t.completed).reduce((sum, t) => sum + (Number(t.points) || 10), 0);
        const wins = (state.dailyWins && state.dailyWins[c.id]) ? state.dailyWins[c.id] : 0;
        reportHTML += `
            <tr>
                <td>${c.name}</td>
                <td>${completed} / ${cadetTasks.length}</td>
                <td>${totalXP}</td>
                <td>${wins}</td>
            </tr>
        `;
    });
    reportHTML += `</tbody></table>`;
    reportContainer.innerHTML = reportHTML;
}

// 5. Вкладки Архів / Активні
if(tabActiveTasks && tabArchivedTasks) {
    tabActiveTasks.onclick = () => {
        showingArchived = false;
        tabActiveTasks.classList.add('active');
        tabArchivedTasks.classList.remove('active');
        renderModalTasks();
    };
    tabArchivedTasks.onclick = () => {
        showingArchived = true;
        tabArchivedTasks.classList.add('active');
        tabActiveTasks.classList.remove('active');
        renderModalTasks();
    };
}

window.archiveTask = (taskId) => {
    const task = state.tasks.find(t => t.id === taskId);
    if(task && task.completed) {
        db.collection('uik_tasks').doc(taskId).update({ archived: true });
    }
};

// 6. Редагування завдання
window.editTask = (taskId) => {
    if(currentUser.role !== 'supervisor') return;
    const task = state.tasks.find(t => t.id === taskId);
    if(!task) return;
    currentEditTaskId = taskId;
    editTaskTextInput.value = task.text;
    editTaskPointsInput.value = task.points || 10;
    editTaskDeadlineInput.value = task.deadline || '';
    editTaskModal.classList.add('active');
};
if(closeEditTaskBtn) closeEditTaskBtn.onclick = () => editTaskModal.classList.remove('active');
if(saveEditTaskBtn) saveEditTaskBtn.onclick = () => {
    const task = state.tasks.find(t => t.id === currentEditTaskId);
    if(task) {
        db.collection('uik_tasks').doc(task.id).update({
            text: editTaskTextInput.value,
            points: parseInt(editTaskPointsInput.value) || 10,
            deadline: editTaskDeadlineInput.value
        });
    }
    editTaskModal.classList.remove('active');
};

// Drag and Drop Helper
function setupDropZone(dropZoneId, inputId) {
    const dropZone = document.getElementById(dropZoneId);
    const input = document.getElementById(inputId);
    if(!dropZone || !input) return;
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if(e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            dropZone.querySelector('.drop-zone-text').innerText = e.dataTransfer.files[0].name;
        }
    });
    input.addEventListener('change', () => {
        if(input.files.length && input.files[0]) {
            dropZone.querySelector('.drop-zone-text').innerText = input.files[0].name;
        } else {
            dropZone.querySelector('.drop-zone-text').innerText = 'Перетягніть файл або натисніть';
        }
    });
}
setupDropZone('globalDropZone', 'globalTaskFile');
setupDropZone('cadetDropZone', 'cadetTaskFile');
setupDropZone('newCadetPhotoDropZone', 'newCadetPhoto');

// Оновлення логіки додання (PATCHES для старих даних не патчимо напряму, а через DB)
const originalAddCadetTaskBtnClick = addCadetTaskBtn.onclick;
addCadetTaskBtn.onclick = () => {
    if(originalAddCadetTaskBtnClick) originalAddCadetTaskBtnClick();
    // createdAt додано в новій версії одразу при збереженні
};
const originalAddGlobalTaskBtnClick = addGlobalTaskBtn.onclick;
addGlobalTaskBtn.onclick = () => {
    if(originalAddGlobalTaskBtnClick) originalAddGlobalTaskBtnClick();
};
const originalPostComment = window.postComment;
window.postComment = (taskId) => {
    if(originalPostComment) originalPostComment(taskId);
};

// Запуск
// checkSession() викликається автоматично при підвантаженні даних з Firebase (reRenderApp)
function checkSession() {
    const saved = sessionStorage.getItem('uikActiveUser');
    if (saved) {
        const parsed = JSON.parse(saved);
        currentUser = state.users.find(u => u.id === parsed.id) || parsed;
        showApp();
    } else {
        showLogin();
    }
}
checkSession();
