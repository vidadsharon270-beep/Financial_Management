<?php
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

if (!empty($_SESSION['user_id'])) {
    jsonResponse(true, 'Authenticated.', [
        'user' => [
            'name'  => $_SESSION['user_name'],
            'email' => $_SESSION['user_email'],
            'role'  => $_SESSION['user_role'] ?? 'user',
        ]
    ]);
}

jsonResponse(false, 'Not authenticated.');
