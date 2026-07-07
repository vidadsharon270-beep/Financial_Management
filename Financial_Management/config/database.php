<?php
// ============================================
// Database connection (XAMPP / MySQL)
// Edit these if your XAMPP MySQL setup differs.
// Default XAMPP: host=localhost, user=root, pass=""
// ============================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'financial_management');
define('DB_USER', 'root');
define('DB_PASS', '');

function dbErrorResponse($message, $debug = null) {
    if (ob_get_length()) {
        ob_clean();
    }
    header('Content-Type: application/json');
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => $message,
        'debug'   => $debug
    ]));
}

function getDbConnection() {
    static $conn = null;
    if ($conn === null) {

        if (!class_exists('mysqli')) {
            dbErrorResponse(
                'The PHP mysqli extension is not enabled.',
                'Open php.ini (the one Apache uses - check phpinfo() > "Loaded Configuration File"), ' .
                'find the line ";extension=mysqli", remove the leading semicolon, then restart Apache.'
            );
        }

        // As of PHP 8.1, mysqli throws an exception on connection failure
        // instead of just setting connect_error - catch every possible
        // throwable here so we always return clean JSON instead of a raw
        // PHP fatal error page.
        mysqli_report(MYSQLI_REPORT_OFF);
        try {
            $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        } catch (\Throwable $e) {
            dbErrorResponse('Database connection failed.', $e->getMessage());
        }

        if ($conn->connect_error) {
            dbErrorResponse('Database connection failed.', $conn->connect_error);
        }

        $conn->set_charset('utf8mb4');
    }
    return $conn;
}

