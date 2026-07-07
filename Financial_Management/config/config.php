<?php
// ============================================
// App / Email configuration
// ============================================

// Buffer all output so stray warnings/notices can never corrupt the JSON
// response below, and never show raw PHP errors to the browser.
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// If something fatal happens anywhere in the script, still return valid JSON
// instead of a blank page or an HTML error page (which is what causes the
// frontend's generic "Something went wrong" message).
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        if (ob_get_length()) {
            ob_clean();
        }
        if (!headers_sent()) {
            header('Content-Type: application/json');
            http_response_code(500);
        }
        echo json_encode([
            'success' => false,
            'message' => 'A server error occurred. Please try again.',
            'debug'   => $error['message'] . ' in ' . $error['file'] . ' on line ' . $error['line']
        ]);
    }
});

// Gmail SMTP credentials (use a Gmail "App Password", not your normal password)
define('EMAIL_HOST', 'smtp.gmail.com');
define('EMAIL_PORT', 587);
define('EMAIL_USER', 'shashagrey321@gmail.com');
define('EMAIL_PASS', 'yzqgpouvotyzjguc');
define('EMAIL_FROM_NAME', 'Financial Management');

// OTP settings
define('OTP_LENGTH', 6);
define('OTP_EXPIRY_MINUTES', 10);

// Session cookie name
define('SESSION_NAME', 'auth_system_session');

// Start session everywhere it's needed
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
}

// Send a JSON response and stop execution
function jsonResponse($success, $message, $data = []) {
    if (ob_get_length()) {
        ob_clean();
    }
    header('Content-Type: application/json');
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message
    ], $data));
    exit;
}

