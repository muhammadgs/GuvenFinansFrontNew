<?php
// proxy.php - FULLY FIXED VERSION

$target_base = "http://vps.guvenfinans.az:8008";

// Gələn request-i al
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? $_SERVER['REQUEST_URI'];
$query_string = $_SERVER['QUERY_STRING'] ?? '';

// Full URL yarat
$url = $target_base . $path;
if ($query_string) {
    $url .= '?' . $query_string;
}

// Headers hazırla
$headers = [];
foreach (getallheaders() as $key => $value) {
    if (strtolower($key) === 'host') continue;
    if (strtolower($key) === 'content-length') continue;
    $headers[] = "$key: $value";
}

// Əlavə headers
$headers[] = "X-Forwarded-For: " . $_SERVER['REMOTE_ADDR'];
$headers[] = "X-Real-IP: " . $_SERVER['REMOTE_ADDR'];

// Cookie-ləri göndər
$cookies = '';
foreach ($_COOKIE as $key => $value) {
    $cookies .= $key . '=' . rawurlencode($value) . '; ';
}
if ($cookies) {
    $headers[] = "Cookie: " . rtrim($cookies, '; ');
}

// cURL session
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true); // Headers al
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Request body (POST, PUT, PATCH üçün)
$input = file_get_contents('php://input');
if ($input && in_array($method, ['POST', 'PUT', 'PATCH'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    $headers[] = "Content-Type: application/json";
    $headers[] = "Content-Length: " . strlen($input);
}

// Headers təyin et
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// SSL problemi olarsa
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

// Follow redirects
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Execute
$response = curl_exec($ch);
$curl_info = curl_getinfo($ch);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Proxy error: ' . $curl_error]);
    exit;
}

// Header və body hissələrini ayır
$header_size = $curl_info['header_size'];
$response_headers = substr($response, 0, $header_size);
$response_body = substr($response, $header_size);

// Backend headers-larını parse et
$header_lines = explode("\r\n", $response_headers);

// Set-Cookie headers-larını tap və frontend-ə göndər
foreach ($header_lines as $header_line) {
    if (stripos($header_line, 'Set-Cookie:') === 0) {
        $cookie_header = substr($header_line, strlen('Set-Cookie:'));
        $cookie_parts = explode(';', $cookie_header, 2);
        $cookie_pair = trim($cookie_parts[0]);

        // Cookie key-value ayır
        $equals_pos = strpos($cookie_pair, '=');
        if ($equals_pos !== false) {
            $cookie_name = substr($cookie_pair, 0, $equals_pos);
            $cookie_value = substr($cookie_pair, $equals_pos + 1);

            // Cookie set et
            setcookie(
                $cookie_name,
                $cookie_value,
                [
                    'expires' => time() + 86400 * 7, // 7 gün
                    'path' => '/',
                    'domain' => '.guvenfinans.az',
                    'secure' => true,
                    'httponly' => true,
                    'samesite' => 'Lax'
                ]
            );
        }
    }
}

// Status code göndər
http_response_code($curl_info['http_code']);

// Response headers-larını göndər (Set-Cookie xaric)
foreach ($header_lines as $header_line) {
    if (empty(trim($header_line))) continue;
    if (stripos($header_line, 'Set-Cookie:') === 0) continue;

    header($header_line);
}

// Body göndər
echo $response_body;
?>