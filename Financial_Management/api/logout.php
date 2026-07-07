<?php
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json');

$_SESSION = [];
session_destroy();

jsonResponse(true, 'Logged out.', ['redirect' => 'login.html']);
