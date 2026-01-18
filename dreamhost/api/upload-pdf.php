<?php
/**
 * PDF Upload Handler for DreamHost
 * 
 * Receives PDF files and saves them to the server.
 * Returns the public URL of the uploaded file.
 * 
 * Upload this file to: your-domain.com/api/upload-pdf.php
 */

// CORS headers for cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Configuration - UPDATE THESE VALUES
define('UPLOAD_DIR', __DIR__ . '/../pdfs/');  // Where PDFs are stored
define('PUBLIC_URL_BASE', 'https://YOUR-DOMAIN.com/pdfs/');  // Public URL base
define('API_KEY', 'YOUR-SECRET-API-KEY-HERE');  // Simple API key for security
define('MAX_FILE_SIZE', 10 * 1024 * 1024);  // 10MB max

// Verify API key (simple security)
$headers = getallheaders();
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? '';

if ($providedKey !== API_KEY) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid API key']);
    exit();
}

// Ensure upload directory exists
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

// Get the request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit();
}

// Check for required fields
if (empty($data['fileData']) || empty($data['fileName'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fileData or fileName']);
    exit();
}

// Decode base64 PDF data
$pdfData = base64_decode($data['fileData']);

if ($pdfData === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid base64 data']);
    exit();
}

// Check file size
if (strlen($pdfData) > MAX_FILE_SIZE) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large (max 10MB)']);
    exit();
}

// Sanitize filename and add timestamp
$fileName = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $data['fileName']);
$timestamp = time();
$finalFileName = $timestamp . '_' . $fileName;

// Ensure it ends with .pdf
if (!preg_match('/\.pdf$/i', $finalFileName)) {
    $finalFileName .= '.pdf';
}

$filePath = UPLOAD_DIR . $finalFileName;

// Save the file
if (file_put_contents($filePath, $pdfData) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
    exit();
}

// Return success with public URL
$publicUrl = PUBLIC_URL_BASE . $finalFileName;

echo json_encode([
    'success' => true,
    'url' => $publicUrl,
    'fileName' => $finalFileName
]);
