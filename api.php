<?php
// Enable error logging for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output
ini_set('log_errors', 1);
ini_set('error_log', 'php_errors.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get the request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['message']) || empty($data['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit;
}

$message = $data['message'];

// Load API key from config file
require_once 'config.php';

if (!defined('OPENROUTER_API_KEY') || empty(OPENROUTER_API_KEY)) {
    http_response_code(500);
    echo json_encode(['error' => 'API key not configured on server']);
    exit;
}

// Prepare the request to OpenRouter API
$apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
$apiKey = OPENROUTER_API_KEY;

$requestData = [
    'model' => 'deepseek/deepseek-r1',
    'messages' => [
        [
            'role' => 'system',
            'content' => 'You are a helpful assistant for a map application. Help users with location-based queries, provide information about places, and suggest interesting locations. When mentioning specific places, try to include the city and country for better location searches.'
        ],
        [
            'role' => 'user',
            'content' => $message
        ]
    ],
    'max_tokens' => 500,
    'temperature' => 0.7
];

// Initialize cURL
$ch = curl_init($apiUrl);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
    'HTTP-Referer: ' . (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'http://localhost'),
    'X-Title: AI Map Application'
]);

// Execute the request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Check for cURL errors
if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'Network error: ' . $curlError]);
    exit;
}

// Handle API response
if ($httpCode !== 200) {
    $errorData = json_decode($response, true);
    $errorMessage = 'API request failed';
    
    switch ($httpCode) {
        case 401:
            $errorMessage = 'Invalid API key';
            break;
        case 402:
            $errorMessage = 'Insufficient credits';
            break;
        case 429:
            $errorMessage = 'Rate limit exceeded';
            break;
        case 400:
            $errorMessage = 'Bad request';
            break;
    }
    
    http_response_code($httpCode);
    echo json_encode([
        'error' => $errorMessage,
        'details' => $errorData
    ]);
    exit;
}

// Parse and validate response
$responseData = json_decode($response, true);

// Debug logging
error_log("OpenRouter API Response Code: " . $httpCode);
error_log("OpenRouter API Response: " . substr($response, 0, 500));

if (!isset($responseData['choices'][0]['message']['content'])) {
    error_log("ERROR: Missing content in response structure");
    error_log("Response structure: " . print_r($responseData, true));
    http_response_code(500);
    echo json_encode([
        'error' => 'Unexpected API response format',
        'debug' => [
            'hasChoices' => isset($responseData['choices']),
            'choicesCount' => isset($responseData['choices']) ? count($responseData['choices']) : 0,
            'structure' => array_keys($responseData)
        ]
    ]);
    exit;
}

// Return successful response
$finalResponse = [
    'success' => true,
    'response' => $responseData['choices'][0]['message']
];

error_log("Sending success response: " . json_encode($finalResponse));
echo json_encode($finalResponse);
?>