const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// База данных приветствий в виде массива
//Изменение для отслеживания 1
//Изменение для отслеживания 2
const greetings = [
    "Привет",
    "Добро пожаловать",
    "Здравствуй",
    "Приветствую",
    "Рад тебя видеть",
    "Салют",
    "Хеллоу",
    "Доброго времени суток",
    "Мир, вам"
];

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // Обслуживаем статические файлы из папки public
    if (req.url === '/' || req.url === '/index.html') {
        serveStaticFile(res, '/index.html', 'text/html');
    }
    // API endpoint для получения случайного приветствия
    else if (parsedUrl.pathname === '/api/greet' && req.method === 'GET') {
        const userName = parsedUrl.query.name || 'Гость';
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            greeting: `${randomGreeting}, ${userName}!`,
            fullMessage: `${randomGreeting}, ${userName}!`
        }));
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Not Found');
    }
});

// Функция для обслуживания статических файлов
function serveStaticFile(res, filePath, contentType) {
    const fullPath = path.join(__dirname, 'public', filePath);
    
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Запуск сервера
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Available greetings:', greetings);
});