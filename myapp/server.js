const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const sqlite3 = require('sqlite3').verbose();

// Создаем и подключаем базу данных
// изменение из vsc
const db = new sqlite3.Database('./greetings.db');

// Инициализация базы данных
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS greetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        language TEXT DEFAULT 'ru',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Добавляем начальные данные, если таблица пуста
    db.get("SELECT COUNT(*) as count FROM greetings", (err, row) => {
        if (row.count === 0) {
            const initialGreetings = [
                "Привет", "Добро пожаловать", "Здравствуй", 
                "Приветствую", "Рад тебя видеть", "Салют"
            ];
            
            const stmt = db.prepare("INSERT INTO greetings (text) VALUES (?)");
            initialGreetings.forEach(greeting => {
                stmt.run(greeting);
            });
            stmt.finalize();
            console.log('Initial greetings added to database');
        }
    });
});

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (req.url === '/' || req.url === '/index.html') {
        serveStaticFile(res, '/index.html', 'text/html');
    }
    else if (parsedUrl.pathname === '/api/greet' && req.method === 'GET') {
        const userName = parsedUrl.query.name || 'Гость';
        
        // Получаем случайное приветствие из базы данных
        db.get("SELECT text FROM greetings ORDER BY RANDOM() LIMIT 1", (err, row) => {
            if (err) {
                console.error('Database error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Database error' }));
                return;
            }
            
            const greeting = row ? row.text : 'Привет';
            const fullMessage = `${greeting}, ${userName}!`;
            
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            });
            res.end(JSON.stringify({
                greeting: fullMessage,
                fullMessage: fullMessage
            }));
        });
    }
    // Новый endpoint для добавления приветствий
    else if (parsedUrl.pathname === '/api/greetings' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { greeting } = JSON.parse(body);
                if (!greeting) {
                    throw new Error('Greeting text required');
                }
                
                db.run("INSERT INTO greetings (text) VALUES (?)", [greeting], function(err) {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to add greeting' }));
                        return;
                    }
                    
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        id: this.lastID,
                        message: 'Greeting added successfully'
                    }));
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Not Found');
    }
});

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

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Закрываем соединение с БД при завершении
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});