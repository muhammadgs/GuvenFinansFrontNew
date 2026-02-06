const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = process.env.PORT || 3000;
const baseDir = path.join(__dirname);

const mimeTypes = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

// Auth yoxlama funksiyası
const checkAuth = (req) => {
    // Cookie-dən token yoxla
    const cookies = req.headers.cookie || '';
    const tokenMatch = cookies.match(/(?:^|;\s*)authToken=([^;]*)/);

    if (tokenMatch) {
        return { isAuthenticated: true, token: tokenMatch[1] };
    }

    // Əgər token yoxdursa, localStorage-dən yoxlamaq üçün xüsusi script əlavə edəcəyik
    return { isAuthenticated: false, token: null };
};

// HTML faylına auth state inject etmək
const injectAuthState = (htmlContent, authState) => {
    // JavaScript kodu inject et
    const authScript = `
        <script>
            window.__AUTH_STATE__ = ${JSON.stringify(authState)};
            window.__IS_AUTHENTICATED__ = ${authState.isAuthenticated};
        </script>
    `;

    return htmlContent.replace('</head>', `${authScript}\n</head>`);
};

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname;

    const normalizedPath = path.normalize(pathname).replace(/^\/+/, '');
    const filePath = path.join(baseDir, normalizedPath);

    if (!filePath.startsWith(baseDir)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // 404 error üçün index.html göndər
            const indexPath = path.join(baseDir, 'index.html');
            fs.readFile(indexPath, 'utf8', (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    res.end('Not Found');
                    return;
                }

                const authState = checkAuth(req);
                const htmlWithAuth = injectAuthState(data, authState);

                res.setHeader('Content-Type', 'text/html; charset=UTF-8');
                res.end(htmlWithAuth);
            });
            return;
        }

        const ext = path.extname(filePath).toLowerCase();

        // Əgər HTML faylıdırsa, auth state inject et
        if (ext === '.html') {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    res.statusCode = 500;
                    res.end('Server Error');
                    return;
                }

                const authState = checkAuth(req);
                const htmlWithAuth = injectAuthState(data, authState);

                res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
                res.end(htmlWithAuth);
            });
        } else {
            // Digər fayllar üçün normal stream
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            const stream = fs.createReadStream(filePath);
            stream.on('error', () => {
                res.statusCode = 500;
                res.end('Server Error');
            });
            stream.pipe(res);
        }
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});