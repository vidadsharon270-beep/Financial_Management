<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../vendor/phpmailer/src/Exception.php';
require_once __DIR__ . '/../vendor/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/../vendor/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

/**
 * Generate a random numeric OTP code.
 */
function generateOtpCode($length = OTP_LENGTH) {
    $min = (int) str_pad('1', $length, '0');
    $max = (int) str_pad('', $length, '9');
    return (string) random_int($min, $max);
}

/**
 * Store a new OTP in the database for a given email + purpose.
 * Invalidates any previous unused OTPs for the same email/purpose.
 */
function createOtp($email, $purpose) {
    $conn = getDbConnection();

    // Invalidate previous unused OTPs for this email/purpose
    $stmt = $conn->prepare("UPDATE otp_codes SET is_used = 1 WHERE email = ? AND purpose = ? AND is_used = 0");
    $stmt->bind_param('ss', $email, $purpose);
    $stmt->execute();
    $stmt->close();

    $otp = generateOtpCode();
    $expiresAt = date('Y-m-d H:i:s', strtotime('+' . OTP_EXPIRY_MINUTES . ' minutes'));

    $stmt = $conn->prepare("INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('ssss', $email, $otp, $purpose, $expiresAt);
    $stmt->execute();
    $stmt->close();

    return $otp;
}

/**
 * Verify an OTP code for a given email + purpose.
 * Returns ['success' => bool, 'message' => string]
 */
function verifyOtp($email, $purpose, $submittedCode) {
    $conn = getDbConnection();

    $stmt = $conn->prepare("SELECT id, otp_code, expires_at, attempts FROM otp_codes 
                             WHERE email = ? AND purpose = ? AND is_used = 0 
                             ORDER BY id DESC LIMIT 1");
    $stmt->bind_param('ss', $email, $purpose);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    if (!$row) {
        return ['success' => false, 'message' => 'No verification code found. Please request a new one.'];
    }

    if (strtotime($row['expires_at']) < time()) {
        return ['success' => false, 'message' => 'This code has expired. Please request a new one.'];
    }

    if ($row['attempts'] >= 5) {
        return ['success' => false, 'message' => 'Too many attempts. Please request a new code.'];
    }

    if (!hash_equals($row['otp_code'], $submittedCode)) {
        $upd = $conn->prepare("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?");
        $upd->bind_param('i', $row['id']);
        $upd->execute();
        $upd->close();
        return ['success' => false, 'message' => 'Incorrect code. Please try again.'];
    }

    // Mark as used
    $upd = $conn->prepare("UPDATE otp_codes SET is_used = 1 WHERE id = ?");
    $upd->bind_param('i', $row['id']);
    $upd->execute();
    $upd->close();

    return ['success' => true, 'message' => 'Code verified.'];
}

/**
 * Send an OTP email via Gmail SMTP using PHPMailer.
 * Returns true on success, throws/returns false with error logged on failure.
 */
function sendOtpEmail($toEmail, $toName, $otp, $purpose) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = EMAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = EMAIL_USER;
        $mail->Password   = EMAIL_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = EMAIL_PORT;

        $mail->setFrom(EMAIL_USER, EMAIL_FROM_NAME);
        $mail->addAddress($toEmail, $toName);

        $subject = $purpose === 'register'
            ? 'Verify your email address'
            : 'Your password reset code';

        $heading = $purpose === 'register'
            ? 'Verify your email'
            : 'Reset your password';

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = "
            <div style='font-family:Arial,sans-serif;max-width:480px;margin:auto;'>
                <h2 style='color:#333;'>{$heading}</h2>
                <p>Hi " . htmlspecialchars($toName) . ",</p>
                <p>Your verification code is:</p>
                <div style='font-size:32px;font-weight:bold;letter-spacing:8px;background:#f4f4f4;padding:16px;text-align:center;border-radius:8px;'>{$otp}</div>
                <p style='margin-top:16px;color:#666;font-size:13px;'>This code will expire in " . OTP_EXPIRY_MINUTES . " minutes. If you did not request this, you can safely ignore this email.</p>
            </div>
        ";
        $mail->AltBody = "Your verification code is: {$otp} (expires in " . OTP_EXPIRY_MINUTES . " minutes)";

        $mail->send();
        return true;
    } catch (PHPMailerException $e) {
        error_log('OTP email failed: ' . $mail->ErrorInfo);
        return false;
    } catch (\Throwable $e) {
        // Catches things PHPMailerException wouldn't, e.g. a missing
        // openssl extension throwing a plain Error.
        error_log('OTP email failed (unexpected): ' . $e->getMessage());
        return false;
    }
}

/**
 * Basic validators
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function isValidPassword($password) {
    return strlen($password) >= 8;
}
