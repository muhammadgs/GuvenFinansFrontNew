<?php
// proxy.php

$target_base = 'http://vps.guvenfinans.az:8008';

$frontend_origin = null;
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    $frontend_origin = $_SERVER['HTTP_ORIGIN'];
} elseif (!empty($_SERVER['HTTP_HOST'])) {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $frontend_origin = $scheme . '://' . $_SERVER['HTTP_HOST'];
}

if ($frontend_origin) {
    header('Access-Control-Allow-Origin: ' . $frontend_origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: POST, OPTIONS, GET, PUT, PATCH, DELETE');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$request_uri = $_SERVER['REQUEST_URI'] ?? '/';
$parsed_path = parse_url($request_uri, PHP_URL_PATH) ?? '/';
$script_name = $_SERVER['SCRIPT_NAME'] ?? '/proxy.php';

$proxy_path = $parsed_path;
if (str_starts_with($parsed_path, $script_name)) {
    $proxy_path = substr($parsed_path, strlen($script_name));
}

if ($proxy_path === '' || $proxy_path === false) {
    $proxy_path = $_GET['path'] ?? '/';
}

if (!str_starts_with($proxy_path, '/')) {
    $proxy_path = '/' . $proxy_path;
}

$query_string = $_SERVER['QUERY_STRING'] ?? '';
if (!empty($_GET['path'])) {
    parse_str($query_string, $query_params);
    unset($query_params['path']);
    $query_string = http_build_query($query_params);
}

$url = rtrim($target_base, '/') . $proxy_path;
if ($query_string) {
    $url .= '?' . $query_string;
}

$headers = [];
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $key => $value) {
        $lower = strtolower($key);
        if ($lower === 'host' || $lower === 'content-length' || $lower === 'origin') {
            continue;
        }
        $headers[] = $key . ': ' . $value;
    }
}

$client_ip = $_SERVER['REMOTE_ADDR'] ?? '';
if ($client_ip) {
    $headers[] = 'X-Forwarded-For: ' . $client_ip;
    $headers[] = 'X-Real-IP: ' . $client_ip;
}

if (!empty($_COOKIE)) {
    $pairs = [];
    foreach ($_COOKIE as $key => $value) {
        $pairs[] = $key . '=' . rawurlencode($value);
    }
    $headers[] = 'Cookie: ' . implode('; ', $pairs);
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);

$input = file_get_contents('php://input');
if ($input !== false && $input !== '' && in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

$response = curl_exec($ch);
$curl_error = curl_error($ch);
$curl_info = curl_getinfo($ch);
curl_close($ch);

if ($response === false || $curl_error) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Proxy error', 'details' => $curl_error]);
    exit;
}

$header_size = $curl_info['header_size'] ?? 0;
$response_headers = substr($response, 0, $header_size);
$response_body = substr($response, $header_size);
$header_lines = explode("\r\n", $response_headers);

http_response_code($curl_info['http_code'] ?? 200);

foreach ($header_lines as $header_line) {
    if ($header_line === '' || stripos($header_line, 'HTTP/') === 0) {
        continue;
    }

    if (stripos($header_line, 'Transfer-Encoding:') === 0) {
        continue;
    }

    header($header_line, false);
}

echo $response_body;
