<?php
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Invalid request method.');
}

$email   = trim($_POST['email'] ?? '');
$purpose = trim($_POST['purpose'] ?? '');
$code    = trim($_POST['otp'] ?? '');

if ($email === '' || $code === '' || !in_array($purpose, ['register', 'reset'], true)) {
    jsonResponse(false, 'Missing required fields.');
}

$check = verifyOtp($email, $purpose, $code);

if (!$check['success']) {
    jsonResponse(false, $check['message']);
}

$conn = getDbConnection();

if ($purpose === 'register') {
    $stmt = $conn->prepare("UPDATE users SET is_verified = 1 WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->close();

    unset($_SESSION['pending_email'], $_SESSION['pending_purpose']);

    jsonResponse(true, 'Email verified! You can now sign in.', [
        'redirect' => 'login.html'
    ]);
} else {
    // purpose === 'reset' - allow the user to set a new password
    $_SESSION['reset_email'] = $email;
    $_SESSION['reset_verified'] = true;

    jsonResponse(true, 'Code verified. Please set your new password.', [
        'redirect' => 'reset_password.html?email=' . urlencode($email)
    ]);
}
