<?php

declare(strict_types=1);

ob_start();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$baseTarget = rtrim((string) (getenv('PROXY_TARGET_BASE') ?: 'https://guvenfinans.az'), '/');

$requestedUrl = trim((string) ($_GET['url'] ?? ''));
$requestedPath = trim((string) ($_GET['path'] ?? ''));

if ($requestedUrl !== '') {
    $targetUrl = filter_var($requestedUrl, FILTER_VALIDATE_URL) ? $requestedUrl : '';
} else {
    $pathInfo = (string) ($_SERVER['PATH_INFO'] ?? '');

    if ($pathInfo === '') {
        $requestPath = parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?: '';
        $scriptName = (string) ($_SERVER['SCRIPT_NAME'] ?? '/proxy.php');
        $pathInfo = (string) preg_replace('#^' . preg_quote($scriptName, '#') . '#', '', $requestPath);
    }

    if ($requestedPath !== '') {
        $pathInfo = $requestedPath;
    }

    $pathInfo = '/' . ltrim($pathInfo, '/');

    $queryParams = $_GET;
    unset($queryParams['url'], $queryParams['path']);
    $queryString = http_build_query($queryParams);

    $targetUrl = $baseTarget . $pathInfo . ($queryString !== '' ? ('?' . $queryString) : '');
}

if ($targetUrl === '') {
    ob_clean();
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Invalid or missing target URL. Use ?url=https://remote/api or /proxy.php/<endpoint>.',
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$incomingHeaders = [];
if (function_exists('getallheaders')) {
    $incomingHeaders = getallheaders();
} else {
    foreach ($_SERVER as $key => $value) {
        if (str_starts_with($key, 'HTTP_')) {
            $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
            $incomingHeaders[$headerName] = (string) $value;
        }
    }
    if (isset($_SERVER['CONTENT_TYPE'])) {
        $incomingHeaders['Content-Type'] = (string) $_SERVER['CONTENT_TYPE'];
    }
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $incomingHeaders['Authorization'] = (string) $_SERVER['HTTP_AUTHORIZATION'];
    }
}

$forwardHeaders = [];
foreach ($incomingHeaders as $name => $value) {
    $normalized = strtolower((string) $name);
    if ($normalized === 'authorization' || $normalized === 'content-type') {
        $forwardHeaders[] = $name . ': ' . $value;
    }
}

$rawBody = file_get_contents('php://input');
$bodyToSend = $rawBody === false ? '' : $rawBody;

$curl = curl_init($targetUrl);
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $forwardHeaders,
    CURLOPT_POSTFIELDS => $bodyToSend,
    CURLOPT_SSL_VERIFYHOST => 0,
    CURLOPT_SSL_VERIFYPEER => 0,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_FOLLOWLOCATION => true,
]);

$response = curl_exec($curl);
$curlError = curl_error($curl);
$statusCode = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
$headerSize = (int) curl_getinfo($curl, CURLINFO_HEADER_SIZE);
curl_close($curl);

ob_clean();
header('Content-Type: application/json; charset=utf-8');

if ($response === false) {
    http_response_code(502);
    echo json_encode([
        'error' => 'Proxy request failed.',
        'detail' => $curlError !== '' ? $curlError : 'Unknown cURL error',
        'target' => $targetUrl,
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$upstreamBody = substr($response, $headerSize);
if ($statusCode <= 0) {
    $statusCode = 502;
}

http_response_code($statusCode);
echo $upstreamBody;
