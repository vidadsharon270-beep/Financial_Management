<?php
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Invalid request method.');
}

$fullName = trim($_POST['full_name'] ?? '');
$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$confirm  = $_POST['confirm_password'] ?? '';

if ($fullName === '' || $email === '' || $password === '' || $confirm === '') {
    jsonResponse(false, 'Please fill in all fields.');
}

if (!isValidEmail($email)) {
    jsonResponse(false, 'Please enter a valid email address.');
}

if (!isValidPassword($password)) {
    jsonResponse(false, 'Password must be at least 8 characters long.');
}

if ($password !== $confirm) {
    jsonResponse(false, 'Passwords do not match.');
}

$conn = getDbConnection();

// Check if email already exists and is verified
$stmt = $conn->prepare("SELECT id, is_verified FROM users WHERE email = ?");
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$existing = $result->fetch_assoc();
$stmt->close();

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

if ($existing) {
    if ($existing['is_verified']) {
        jsonResponse(false, 'An account with this email already exists. Please sign in.');
    }
    // Unverified account exists - update details and resend OTP
    $stmt = $conn->prepare("UPDATE users SET full_name = ?, password_hash = ? WHERE email = ?");
    $stmt->bind_param('sss', $fullName, $passwordHash, $email);
    $stmt->execute();
    $stmt->close();
} else {
    $stmt = $conn->prepare("INSERT INTO users (full_name, email, password_hash, role, is_verified) VALUES (?, ?, ?, 'user', 0)");
    $stmt->bind_param('sss', $fullName, $email, $passwordHash);
    $stmt->execute();
    $stmt->close();
}

// Generate and send OTP
$otp = createOtp($email, 'register');
$sent = sendOtpEmail($email, $fullName, $otp, 'register');

if (!$sent) {
    jsonResponse(false, 'Account created, but we could not send the verification email. Please try resending the code.');
}

// Stash in session for the OTP page flow
$_SESSION['pending_email'] = $email;
$_SESSION['pending_purpose'] = 'register';

jsonResponse(true, 'Account created! A verification code has been sent to your email.', [
    'redirect' => 'otp.html?email=' . urlencode($email) . '&purpose=register'
]);
