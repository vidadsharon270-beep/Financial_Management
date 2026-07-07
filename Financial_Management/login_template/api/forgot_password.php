<?php
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Invalid request method.');
}

$email = trim($_POST['email'] ?? '');

if ($email === '' || !isValidEmail($email)) {
    jsonResponse(false, 'Please enter a valid email address.');
}

$conn = getDbConnection();
$stmt = $conn->prepare("SELECT full_name FROM users WHERE email = ? AND is_verified = 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if ($user) {
    $otp = createOtp($email, 'reset');
    sendOtpEmail($email, $user['full_name'], $otp, 'reset');
}

// Always respond the same way so we don't reveal which emails are registered
jsonResponse(true, 'If an account exists for this email, a password reset code has been sent.', [
    'redirect' => 'otp.html?email=' . urlencode($email) . '&purpose=reset'
]);
