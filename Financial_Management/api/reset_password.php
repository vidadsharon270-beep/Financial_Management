<?php
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Invalid request method.');
}

$email           = trim($_POST['email'] ?? '');
$newPassword     = $_POST['new_password'] ?? '';
$confirmPassword = $_POST['confirm_password'] ?? '';

if ($email === '' || $newPassword === '' || $confirmPassword === '') {
    jsonResponse(false, 'Please fill in all fields.');
}

if (!isValidPassword($newPassword)) {
    jsonResponse(false, 'Password must be at least 8 characters long.');
}

if ($newPassword !== $confirmPassword) {
    jsonResponse(false, 'Passwords do not match.');
}

// Require that this email successfully passed OTP verification in this session
if (empty($_SESSION['reset_verified']) || ($_SESSION['reset_email'] ?? '') !== $email) {
    jsonResponse(false, 'Please verify your identity with the emailed code before resetting your password.');
}

$conn = getDbConnection();
$passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

$stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
$stmt->bind_param('ss', $passwordHash, $email);
$stmt->execute();
$stmt->close();

unset($_SESSION['reset_verified'], $_SESSION['reset_email']);

jsonResponse(true, 'Your password has been updated. You can now sign in.', [
    'redirect' => 'login.html'
]);
