<?php
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Invalid request method.');
}

$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if ($email === '' || $password === '') {
    jsonResponse(false, 'Please enter your email and password.');
}

$conn = getDbConnection();
$stmt = $conn->prepare("SELECT id, full_name, email, password_hash, role, is_verified FROM users WHERE email = ?");
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonResponse(false, 'Invalid email or password.');
}

if (!$user['is_verified']) {
    // Resend an OTP so they can verify before logging in
    $otp = createOtp($email, 'register');
    sendOtpEmail($email, $user['full_name'], $otp, 'register');

    jsonResponse(false, 'Please verify your email first. A new code has been sent.', [
        'redirect' => 'otp.html?email=' . urlencode($email) . '&purpose=register'
    ]);
}

// Successful login
session_regenerate_id(true);
$_SESSION['user_id']    = $user['id'];
$_SESSION['user_name']  = $user['full_name'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['user_role']  = $user['role'];

// Role-based redirect. Adjust these paths to match where your dashboards
// actually live if your project folder isn't at the web root.
$roleRedirects = [
    'admin' => '/financial_management/admin/dashboard.html',
    'staff' => '/financial_management/staff/dashboard.html',
    'user'  => '/financial_management/user/dashboard.html',
];
$redirect = $roleRedirects[$user['role']] ?? $roleRedirects['user'];

jsonResponse(true, 'Welcome back, ' . $user['full_name'] . '!', [
    'redirect' => $redirect,
    'role'     => $user['role']
]);
