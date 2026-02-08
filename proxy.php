<?php
// proxy.php - local proxy for Global API

declare(strict_types=1);

$targetBase = rtrim(getenv('PROXY_TARGET_BASE') ?: 'https://guvenfinans.az', '/');
$allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://guvenfinans.az',
    'https://www.guvenfinans.az',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
} elseif ($origin === '') {
    header('Access-Control-Allow-Origin: *');
} else {
    header('Access-Control-Allow-Origin: null');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept, X-Requested-With, X-CSRF-Token');
header('Access-Control-Expose-Headers: Content-Type, Authorization, Set-Cookie');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '/proxy.php';
$path = preg_replace('#^' . preg_quote($scriptName, '#') . '#', '', $uriPath);
$path = $path !== '' ? $path : '/';

$queryString = $_SERVER['QUERY_STRING'] ?? '';
$targetUrl = $targetBase . $path;
if ($queryString !== '') {
    $targetUrl .= '?' . $queryString;
}

$requestHeaders = function_exists('getallheaders') ? getallheaders() : [];
$blockedRequestHeaders = ['host', 'connection', 'content-length'];
$forwardHeaders = [];

foreach ($requestHeaders as $name => $value) {
    $lowerName = strtolower($name);
    if (in_array($lowerName, $blockedRequestHeaders, true)) {
        continue;
    }

    if ($lowerName === 'origin') {
        continue;
    }

    $forwardHeaders[] = $name . ': ' . $value;
}

$clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
if ($clientIp !== '') {
    $forwardHeaders[] = 'X-Forwarded-For: ' . $clientIp;
    $forwardHeaders[] = 'X-Real-IP: ' . $clientIp;
}

$rawBody = file_get_contents('php://input');

$ch = curl_init($targetUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $forwardHeaders,
]);

if ($rawBody !== false && $rawBody !== '' && in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $rawBody);
}

if (stripos($targetUrl, 'https://') === 0) {
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
}

$response = curl_exec($ch);
$curlError = curl_error($ch);
$statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

if ($response === false || $curlError) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Proxy connection failed',
        'detail' => $curlError ?: 'Unknown cURL error',
        'target' => $targetBase,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$responseHeadersRaw = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);
$responseHeaderLines = preg_split('/\r\n|\n|\r/', trim($responseHeadersRaw)) ?: [];

$blockedResponseHeaders = [
    'transfer-encoding',
    'content-length',
    'connection',
    'keep-alive',
    'content-encoding',
    'access-control-allow-origin',
    'access-control-allow-credentials',
    'access-control-allow-methods',
    'access-control-allow-headers',
];

http_response_code($statusCode);

foreach ($responseHeaderLines as $line) {
    if ($line === '' || str_starts_with($line, 'HTTP/')) {
        continue;
    }

    $parts = explode(':', $line, 2);
    if (count($parts) < 2) {
        continue;
    }

    $name = trim($parts[0]);
    $value = trim($parts[1]);

    if ($name === '') {
        continue;
    }

    if (in_array(strtolower($name), $blockedResponseHeaders, true)) {
        continue;
    }

    header($name . ': ' . $value, false);
}

echo $responseBody;
