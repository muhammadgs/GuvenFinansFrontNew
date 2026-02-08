<?php

declare(strict_types=1);

ob_start();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$baseTarget = rtrim(getenv('PROXY_TARGET_BASE') ?: 'https://guvenfinans.az', '/');
$targetFromQuery = trim((string) ($_GET['url'] ?? ''));

if ($targetFromQuery !== '') {
    $targetUrl = filter_var($targetFromQuery, FILTER_VALIDATE_URL) ? $targetFromQuery : '';
} else {
    $requestUriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '/proxy.php';
    $forwardPath = preg_replace('#^' . preg_quote($scriptName, '#') . '#', '', $requestUriPath) ?: '';
    $forwardPath = '/' . ltrim($forwardPath, '/');

    $queryParams = $_GET;
    unset($queryParams['url']);

    $queryString = http_build_query($queryParams);
    $targetUrl = $baseTarget . $forwardPath . ($queryString !== '' ? ('?' . $queryString) : '');
}

if ($targetUrl === '') {
    ob_clean();
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Invalid or missing target URL.',
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$incomingHeaders = function_exists('getallheaders') ? getallheaders() : [];
$forwardHeaders = [];

foreach ($incomingHeaders as $name => $value) {
    $normalized = strtolower((string) $name);

    if ($normalized === 'authorization' || $normalized === 'content-type') {
        $forwardHeaders[] = $name . ': ' . $value;
    }
}

$rawBody = file_get_contents('php://input');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$curl = curl_init($targetUrl);
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $forwardHeaders,
    CURLOPT_POSTFIELDS => $rawBody === false ? '' : $rawBody,
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
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$body = substr($response, $headerSize);

if ($statusCode <= 0) {
    $statusCode = 502;
}

http_response_code($statusCode);
echo $body;
