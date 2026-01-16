<?php
// Traffic API Proxy - Handles TomTom Traffic API requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load configuration
require_once 'config.php';

// Get API key
$apiKey = TOMTOM_API_KEY;

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'TomTom API key not configured']);
    exit;
}

// Get request data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request data']);
    exit;
}

$action = $data['action'] ?? '';

// Handle different traffic API actions
switch ($action) {
    case 'flow':
        handleTrafficFlow($data, $apiKey);
        break;
    
    case 'incidents':
        handleTrafficIncidents($data, $apiKey);
        break;
    
    case 'route':
        handleTrafficRoute($data, $apiKey);
        break;
    
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action. Use: flow, incidents, or route']);
        exit;
}

function handleTrafficFlow($data, $apiKey) {
    // Get traffic flow data for a specific point
    $lat = $data['lat'] ?? null;
    $lng = $data['lng'] ?? null;
    $zoom = $data['zoom'] ?? 10;
    
    if (!$lat || !$lng) {
        http_response_code(400);
        echo json_encode(['error' => 'Latitude and longitude required']);
        exit;
    }
    
    // TomTom Traffic Flow API
    $url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/{$zoom}/json";
    $url .= "?point={$lat},{$lng}";
    $url .= "&unit=KMPH";
    $url .= "&key={$apiKey}";
    
    makeApiRequest($url);
}

function handleTrafficIncidents($data, $apiKey) {
    // Get traffic incidents in a bounding box
    $bbox = $data['bbox'] ?? null;
    
    if (!$bbox || !isset($bbox['minLat'], $bbox['minLng'], $bbox['maxLat'], $bbox['maxLng'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Bounding box required (minLat, minLng, maxLat, maxLng)']);
        exit;
    }
    
    // TomTom Traffic Incidents API
    $url = "https://api.tomtom.com/traffic/services/5/incidentDetails";
    $url .= "?bbox={$bbox['minLng']},{$bbox['minLat']},{$bbox['maxLng']},{$bbox['maxLat']}";
    $url .= "&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime}}}";
    $url .= "&language=en-US";
    $url .= "&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11,14";
    $url .= "&timeValidityFilter=present";
    $url .= "&key={$apiKey}";
    
    makeApiRequest($url);
}

function handleTrafficRoute($data, $apiKey) {
    // Get traffic-aware route
    $start = $data['start'] ?? null;
    $end = $data['end'] ?? null;
    
    if (!$start || !$end || !isset($start['lat'], $start['lng'], $end['lat'], $end['lng'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Start and end coordinates required']);
        exit;
    }
    
    // TomTom Routing API with traffic
    $url = "https://api.tomtom.com/routing/1/calculateRoute/";
    $url .= "{$start['lat']},{$start['lng']}:{$end['lat']},{$end['lng']}/json";
    $url .= "?traffic=true";
    $url .= "&travelMode=car";
    $url .= "&key={$apiKey}";
    
    makeApiRequest($url);
}

function makeApiRequest($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        http_response_code(500);
        echo json_encode(['error' => 'Network error: ' . $curlError]);
        exit;
    }
    
    if ($httpCode !== 200) {
        http_response_code($httpCode);
        echo $response;
        exit;
    }
    
    // Return successful response
    echo $response;
}
?>
