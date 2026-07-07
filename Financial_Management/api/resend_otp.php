<?php
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Invalid request method.');
}

$email   = trim($_POST['email'] ?? '');
$purpose = trim($_POST['purpose'] ?? '');

if ($email === '' || !in_array($purpose, ['register', 'reset'], true)) {
    jsonResponse(false, 'Missing required fields.');
}

$conn = getDbConnection();
$stmt = $conn->prepare("SELECT full_name FROM users WHERE email = ?");
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    // Don't reveal whether the account exists
    jsonResponse(true, 'If an account exists for this email, a new code has been sent.');
}

$otp = createOtp($email, $purpose);
sendOtpEmail($email, $user['full_name'], $otp, $purpose);

jsonResponse(true, 'A new verification code has been sent to your email.');
