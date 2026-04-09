const fs = require('fs');
const filePath = 'c:\\Users\\libra\\OneDrive\\Робочий стіл\\УФК\\uik-practice\\script.js';

let content = fs.readFileSync(filePath, 'utf8');

// 1. Зміна ініціалізації Firebase та стану
const iniFirebase = `
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
    // Миттєвий ререндер
    reRenderApp();
});

function reRenderApp() {
    if(currentUser) {
        renderGrid();
        renderLeaderboard();
        renderDailyWinner();
        if(activeModalCadetId) renderModalTasks();
        const calendarModal = document.getElementById('calendarModal');
        if(calendarModal && calendarModal.classList.contains('active')) renderCalendar();
    }
}

function saveMeta() {
    db.collection('uik_app').doc('meta').set({
        users: state.users,
        awardedDates: state.awardedDates,
        dailyWins: state.dailyWins
    });
}
`;

const replaceStateInit = /let state = JSON\.parse\(localStorage\.getItem\('uikState_v2'\)\) \|\| \{[\s\S]*?function saveState\(\) \{\s*localStorage\.setItem\('uikState_v2', JSON\.stringify\(state\)\);\s*\}/s;
content = content.replace(replaceStateInit, iniFirebase);

// 2. Зменшення ліміту file.size
content = content.replace('file.size > 1024 * 1024', 'file.size > 600 * 1024');
content = content.replace('до 1 Мб', 'до 600 Кб');

// 3. Точкове оновлення saveState для паролю (Meta)
content = content.replace(/state\.users\[userIndex\]\.password = newP;\s*currentUser\.password = newP;\s*saveState\(\);/g, "state.users[userIndex].password = newP;\n        currentUser.password = newP;\n        saveMeta();");

// 4. Точкове оновлення для checkDailyWinners (Meta)
content = content.replace(/if \(stateChanged\) \{\s*saveState\(\);/g, "if (stateChanged) {\n        saveMeta();");

// 5. Оновлення створення завдань (cadet task)
content = content.replace(/state\.tasks\.push\(newTask\);\s*saveState\(\);/g, "db.collection('uik_tasks').doc(newTask.id).set(newTask);");

// 6. Оновлення масового створення завдань (global task)
content = content.replace(/state\.tasks\.push\(\{\s*id: generateId\(\),\s*cadetId: cadet\.id,[\s\S]*?\}\);\s*\}\);\s*saveState\(\);/g, (match) => {
    return `cadets.forEach(cadet => {
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
        });`;
});

// 7. Оновлення toggleTask
content = content.replace(/task\.completed = !task\.completed;[\s\S]*?saveState\(\);/g, (match) => {
    return `task.completed = !task.completed;
        if (task.completed) {
            task.completedAt = new Date().toISOString();
        } else {
            delete task.completedAt;
        }
        db.collection('uik_tasks').doc(task.id).update({
            completed: task.completed,
            completedAt: task.completedAt || firebase.firestore.FieldValue.delete()
        });`;
});

// 8. Видалення завдання (deleteTask)
content = content.replace(/state\.tasks = state\.tasks\.filter\(t => t\.id !== taskId\);\s*saveState\(\);/g, "db.collection('uik_tasks').doc(taskId).delete();");

// 9. Відправка коментаря (postComment)
content = content.replace(/task\.comments\.push\(\{[\s\S]*?\}\);\s*saveState\(\);/g, "task.comments.push({ authorName: currentUser.name, text: input.value.trim(), time: Date.now() });\n        db.collection('uik_tasks').doc(taskId).update({ comments: task.comments });");

// 10. Завантаження звіту (uploadProof)
content = content.replace(/task\.proofs\.push\(fileObj\);\s*saveState\(\);/g, "task.proofs.push(fileObj);\n            db.collection('uik_tasks').doc(taskId).update({ proofs: task.proofs });");

// 11. Видалення звіту (deleteProof)
content = content.replace(/task\.proofs = task\.proofs\.filter\(p => p\.name !== proofName\);\s*saveState\(\);/g, "task.proofs = task.proofs.filter(p => p.name !== proofName);\n    db.collection('uik_tasks').doc(taskId).update({ proofs: task.proofs });");

// 12. Імпорт бекапу (Backup)
content = content.replace(/state = newState;\s*saveState\(\);/g, `state.users = newState.users || defaultUsersDB;
                    state.awardedDates = newState.awardedDates || [];
                    state.dailyWins = newState.dailyWins || {};
                    saveMeta();
                    if (newState.tasks) {
                        newState.tasks.forEach(t => db.collection('uik_tasks').doc(t.id).set(t));
                    }`);

// 13. Додавання нового курсанта (Admin)
content = content.replace(/state\.users\.push\(\{[\s\S]*?\}\);\s*saveState\(\);/g, `state.users.push({
            id: newId, role: 'cadet', name: name, password: btoa('1234'), photo: photoData || ''
        });
        saveMeta();`);

// 14. Архівування завдання (archiveTask)
content = content.replace(/task\.archived = true;\s*saveState\(\);/g, "task.archived = true;\n        db.collection('uik_tasks').doc(taskId).update({ archived: true });");

// 15. Редагування завдання (editTask)
content = content.replace(/task\.text = editTaskTextInput\.value;[\s\S]*?saveState\(\);/g, `task.text = editTaskTextInput.value;
        task.points = parseInt(editTaskPointsInput.value) || 10;
        task.deadline = editTaskDeadlineInput.value;
        db.collection('uik_tasks').doc(task.id).update({
            text: task.text,
            points: task.points,
            deadline: task.deadline
        });`);

// 16. Оновлення createdAt для старих завдань (addCadetTaskBtn, addGlobalTaskBtn, postComment fallback)
content = content.replace(/lastTask\.createdAt = Date\.now\(\);\s*saveState\(\);/g, "lastTask.createdAt = Date.now();\n         db.collection('uik_tasks').doc(lastTask.id).update({ createdAt: lastTask.createdAt });");
content = content.replace(/if \(changed\) saveState\(\);/g, "if (changed) {\n        state.tasks.forEach(t => {\n            if(t.authorId === currentUser.id && t.createdAt === now) {\n                db.collection('uik_tasks').doc(t.id).update({ createdAt: now });\n            }\n        });\n    }");
content = content.replace(/task\.comments\[task\.comments\.length - 1\]\.time = Date\.now\(\);\s*saveState\(\);/g, "task.comments[task.comments.length - 1].time = Date.now();\n        db.collection('uik_tasks').doc(taskId).update({ comments: task.comments });");


fs.writeFileSync(filePath, content);
console.log('Refactoring complete!');
