<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\FileChunkModel;
use App\Models\FileModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;
use Michalsn\Uuid\Uuid;

class FileController extends BaseController
{
    use ResponseTrait;

    public function upload(): ResponseInterface
    {
        /** @var IncomingRequest $request */
        $request = service('request');
        /** @var Uuid $uuid */
        $uuid = service('uuid');

        $validationRule = [
            'file' => [
                'label' => 'Image File',
                'rules' => [
                    'uploaded[file]',
                    'max_size[file,10240]', // 10MB per chunk is huge, but let's set a limit
                ],
            ],
        ];

        if (!$this->validate($validationRule)) {
            return $this->fail($this->validator->getErrors());
        }

        $dzuuid = $request->getPost('dzuuid');
        $chunkIndex = (int) $request->getPost('dzchunkindex');
        $totalChunks = (int) ($request->getPost('dztotalchunkcount') ?? 1);
        $totalFileSize = $request->getPost('dztotalfilesize');
        $file = $request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->fail('ไฟล์ไม่ถูกต้องหรือเซสชันการอัปโหลดหมดอายุ');
        }

        // Dynamic Settings Validation
        $settingModel = new \App\Models\SettingModel();
        $allowedExtensionsStr = $settingModel->getSetting('allowed_extensions', 'pdf');
        $allowedExtensions = array_map('trim', explode(',', strtolower($allowedExtensionsStr)));
        $maxFileSizeMB = (int)$settingModel->getSetting('max_file_size', '10');
        
        $clientName = $request->getPost('dzfilename') ?: $file->getClientName();
        $ext = strtolower(pathinfo($clientName, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExtensions, true)) {
            return $this->fail('ประเภทไฟล์ .' . $ext . ' ไม่ได้รับอนุญาตให้อัปโหลด (รองรับเฉพาะ: ' . str_replace(',', ', ', $allowedExtensionsStr) . ')');
        }
        
        if ($totalFileSize > $maxFileSizeMB * 1024 * 1024) {
            return $this->fail('ขนาดไฟล์รวมเกินขีดจำกัดที่ตั้งค่าไว้สูงสุด ' . $maxFileSizeMB . 'MB');
        }

        $fileModel = new FileModel();
        
        // Find or create file metadata
        $existingFile = $fileModel->where('upload_session_id', $dzuuid)->first();

        if (!$existingFile) {
            $containerId = $request->getPost('parent_id') ?: null;
            $relativePath = $request->getPost('relative_path') ?: '';

            if (!empty($relativePath)) {
                $relativePath = str_replace('\\', '/', $relativePath);
                $parts = explode('/', $relativePath);
                $folderParts = array_slice($parts, 0, -1);

                if (!empty($folderParts)) {
                    $containerModel = new \App\Models\FileContainerModel();
                    $currentParentId = $containerId ? (int)$containerId : null;

                    foreach ($folderParts as $folderName) {
                        $folderName = trim($folderName);
                        if ($folderName === '') {
                            continue;
                        }

                        $existingFolder = $containerModel
                            ->where('name', $folderName)
                            ->where('parent_id', $currentParentId)
                            ->first();

                        if ($existingFolder) {
                            $currentParentId = (int)$existingFolder['id'];
                        } else {
                            $newFolderId = $containerModel->insert([
                                'uuid' => $uuid->uuid4()->toString(),
                                'name' => $folderName,
                                'parent_id' => $currentParentId
                            ], true);

                            $currentParentId = (int)$newFolderId;
                        }
                    }
                    $containerId = $currentParentId;
                }
            }

            $storageType = $request->getPost('storage_type') ?: 'physical';
            if (!in_array($storageType, ['database', 'physical'], true)) {
                $storageType = 'physical';
            }

            $fileUuid = $fileModel->insert([
                'uuid' => $uuid->uuid4()->toString(),
                'filename' => $clientName,
                'upload_session_id' => $dzuuid,
                'mime_type' => $file->getMimeType(),
                'file_size' => $totalFileSize,
                'is_public' => 1,
                'storage_type' => $storageType,
                'container_id' => $containerId ? (int)$containerId : null
            ], true);
        } else {
            $fileUuid = $existingFile['uuid'];
        }

        $chunkModel = new FileChunkModel();
        
        // Check if this chunk already exists to avoid duplication
        $existingChunk = $chunkModel
            ->where('file_uuid', $fileUuid)
            ->where('chunk_order', $chunkIndex)
            ->first();

        if (!$existingChunk) {
            $chunkData = file_get_contents($file->getTempName());
            $chunkModel->insert([
                'file_uuid' => $fileUuid,
                'chunk_order' => $chunkIndex,
                'chunk_data' => $chunkData
            ]);
        }

        $uploadedCount = $chunkModel->where('file_uuid', $fileUuid)->countAllResults();

        if ($uploadedCount >= $totalChunks) {
            // All chunks received, assemble the file
            $db = \Config\Database::connect();
            $db->transStart();
            
            // Get all chunks ordered by chunk_order
            $chunks = $chunkModel->where('file_uuid', $fileUuid)->orderBy('chunk_order', 'ASC')->findAll();
            
            // Ensure target folder exists
            $uploadDir = WRITEPATH . 'uploads';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
                file_put_contents($uploadDir . '/.htaccess', "Deny from all\n");
            }
            
            // We write chunks to a temp file first to calculate hash and store physically
            $tempPath = $uploadDir . '/temp_' . $fileUuid;
            
            $out = fopen($tempPath, 'wb');
            if ($out) {
                foreach ($chunks as $chunk) {
                    fwrite($out, $chunk['chunk_data']);
                }
                fclose($out);
            } else {
                return $this->fail('ไม่สามารถเขียนไฟล์ชั่วคราวบนเซิร์ฟเวอร์ได้');
            }
            
            // Calculate SHA-256 hash
            $fileHash = hash_file('sha256', $tempPath);
            
            // Retrieve inserted metadata to get chosen storage_type
            $fileData = $fileModel->find($fileUuid);
            $storageType = $fileData['storage_type'] ?? 'physical';
            $finalPath = $uploadDir . '/' . $fileUuid;

            if ($storageType === 'database') {
                // For database storage, chunks are left in the DB table, and we delete the temp file
                if (file_exists($tempPath)) {
                    unlink($tempPath);
                }
                
                $fileModel->update($fileUuid, [
                    'file_hash' => $fileHash
                ]);
            } else {
                // For physical storage, move temp file to secure path and delete chunks from DB
                if (!rename($tempPath, $finalPath)) {
                    if (file_exists($tempPath)) {
                        unlink($tempPath);
                    }
                    return $this->fail('ไม่สามารถย้ายไฟล์ไปยังที่จัดเก็บถาวรได้');
                }
                
                $chunkModel->where('file_uuid', $fileUuid)->delete();
                
                $fileModel->update($fileUuid, [
                    'file_hash' => $fileHash,
                    'storage_type' => 'physical'
                ]);
            }
            
            $db->transComplete();
            
            if ($db->transStatus() === false) {
                if ($storageType === 'physical' && file_exists($finalPath)) {
                    unlink($finalPath);
                }
                return $this->fail('ไม่สามารถประกอบชิ้นส่วนไฟล์และบันทึกข้อมูลได้');
            }
            
            // Log success to audit trail
            log_message('info', "File uploaded and assembled successfully. UUID: {$fileUuid}, Hash: {$fileHash}, IP: " . $request->getIPAddress());

            return $this->respond([
                'status' => 'completed', 
                'file_uuid' => $fileUuid,
                'message' => 'การอัปโหลดเสร็จสมบูรณ์'
            ]);
        }

        return $this->respond([
            'status' => 'chunk_received', 
            'chunk_index' => $chunkIndex,
            'progress' => round(($uploadedCount / $totalChunks) * 100, 2)
        ]);
    }

    public function download(string $encodedUuid)
    {
        $isPreview = $this->request->getGet('preview') ? true : false;
        $disposition = $isPreview ? 'inline' : 'attachment';

        // Decode URL-safe Base64 back to original UUIDv4
        $uuidStr = base64_decode(str_replace(['-', '_'], ['+', '/'], $encodedUuid));

        // Check if the UUID is in a valid UUIDv4 format (36 chars)
        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuidStr)) {
            throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound('ลิงก์ดาวน์โหลดไม่ถูกต้อง');
        }

        $fileModel = new FileModel();
        $fileData = $fileModel->find($uuidStr);

        if (!$fileData) {
            throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound('ไม่พบไฟล์ที่ต้องการดาวน์โหลด');
        }

        // Access Control based on is_public
        $auth = service('auth');
        if ((int)$fileData['is_public'] === 0 && !$auth->loggedIn()) {
            return redirect()->to('/login')->with('error', 'กรุณาเข้าสู่ระบบก่อนทำการดาวน์โหลดเอกสารนี้');
        }

        // Atomic increment of statistics
        if ($isPreview) {
            $fileModel->where('uuid', $uuidStr)->increment('view_count');
        } else {
            $fileModel->where('uuid', $uuidStr)->increment('download_count');
        }

        // Get user attribution details for Audit Log
        list($username, $userId) = $this->getUserAttribution($auth);
        $ip = $this->request->getIPAddress();
        $userAgent = $this->request->getUserAgent()->getBrowser() . ' (' . $this->request->getUserAgent()->getAgentString() . ')';

        $actionWord = $isPreview ? 'viewed (Preview)' : 'downloaded';
        log_message('info', "[AUDIT] File {$actionWord}. UUID: {$uuidStr}, Filename: {$fileData['filename']}, By User: {$username} (ID: {$userId}), IP: {$ip}, UA: {$userAgent}");

        // Serve Physical File
        if ($fileData['storage_type'] === 'physical') {
            $filePath = WRITEPATH . 'uploads/' . $uuidStr;
            if (!file_exists($filePath)) {
                throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound('ไม่พบไฟล์ทางกายภาพบนเซิร์ฟเวอร์');
            }

            // Data Integrity Check (SHA-256)
            if ($fileData['file_hash']) {
                $calculatedHash = hash_file('sha256', $filePath);
                if ($calculatedHash !== $fileData['file_hash']) {
                    log_message('critical', "File Tampering Alert! File UUID: {$uuidStr} has mismatched hash. DB: {$fileData['file_hash']}, Actual: {$calculatedHash}");
                    return redirect()->back()->with('error', 'ระบบตรวจพบความน่าเชื่อถือเอกสารเสียหาย (แฮชไม่ตรงกับข้อมูลในระบบ) ปฏิเสธการดาวน์โหลด');
                }
            }

            // Physical streaming preparation

            // Clear output buffering before streaming
            while (ob_get_level() > 0) {
                ob_end_clean();
            }

            header('Content-Description: File Transfer');
            header('Content-Type: ' . ($fileData['mime_type'] ?: 'application/octet-stream'));
            header('Content-Disposition: ' . $disposition . '; filename="' . basename($fileData['filename']) . '"');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . ($fileData['file_size'] ?: filesize($filePath)));

            // Chunked streaming (8KB buffer block)
            $fileHandle = fopen($filePath, 'rb');
            if ($fileHandle) {
                while (!feof($fileHandle)) {
                    echo fread($fileHandle, 8192);
                    if (ob_get_level() > 0) {
                        ob_flush();
                    }
                    flush();
                }
                fclose($fileHandle);
            }
            exit;
        } 
        // Fallback for Database Storage (Legacy / Backward Compatibility)
        else {
            $chunkModel = new FileChunkModel();
            $chunks = $chunkModel->where('file_uuid', $uuidStr)->orderBy('chunk_order', 'ASC')->findAll();

            if (empty($chunks)) {
                throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound('ไม่พบชิ้นส่วนไฟล์ในระบบฐานข้อมูล');
            }

            // Database streaming preparation

            while (ob_get_level() > 0) {
                ob_end_clean();
            }

            header('Content-Description: File Transfer');
            header('Content-Type: ' . ($fileData['mime_type'] ?: 'application/octet-stream'));
            header('Content-Disposition: ' . $disposition . '; filename="' . basename($fileData['filename']) . '"');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . $fileData['file_size']);

            foreach ($chunks as $chunk) {
                echo $chunk['chunk_data'];
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            }
            exit;
        }
    }

    public function listJson(): ResponseInterface
    {
        $containerModel = new \App\Models\FileContainerModel();
        $fileModel = new FileModel();
        $settingModel = new \App\Models\SettingModel();
        $db = \Config\Database::connect();

        $folderId = $this->request->getGet('folder') ?: null;
        $searchQuery = $this->request->getGet('q') ?: '';
        $fileType = $this->request->getGet('file_type') ?: 'all';
        $dateRange = $this->request->getGet('date_range') ?: 'all';

        // 1. Folders query
        $folders = [];
        if (!empty($searchQuery)) {
            $folders = $containerModel->like('name', $searchQuery)->findAll();
        } else {
            $folders = $containerModel->where('parent_id', $folderId)->findAll();
        }

        // 2. Files query
        if (!empty($searchQuery)) {
            $fileQuery = $fileModel->like('filename', $searchQuery);
        } else {
            $fileQuery = $fileModel->where('container_id', $folderId);
        }

        // Apply File Type filter
        if ($fileType !== 'all') {
            $extMap = [
                'pdf'         => ['pdf'],
                'document'    => ['doc', 'docx', 'odt', 'rtf', 'txt'],
                'spreadsheet' => ['xls', 'xlsx', 'ods', 'csv'],
                'image'       => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                'video'       => ['mp4', 'webm', 'mov', 'avi'],
                'audio'       => ['mp3', 'wav', 'ogg']
            ];
            if (isset($extMap[$fileType])) {
                $fileQuery->groupStart();
                foreach ($extMap[$fileType] as $ext) {
                    $fileQuery->orLike('filename', '.' . $ext, 'before');
                }
                $fileQuery->groupEnd();
            }
        }

        // Apply Date Range filter
        $startDate = null;
        $endDate = null;
        if ($dateRange !== 'all') {
            $now = date('Y-m-d H:i:s');
            if ($dateRange === 'today') {
                $startDate = date('Y-m-d 00:00:00');
                $endDate = date('Y-m-d 23:59:59');
            } elseif ($dateRange === 'week') {
                $startDate = date('Y-m-d 00:00:00', strtotime('monday this week'));
                $endDate = $now;
            } elseif ($dateRange === 'month') {
                $startDate = date('Y-m-01 00:00:00');
                $endDate = $now;
            } elseif ($dateRange === 'year') {
                $startDate = date('Y-01-01 00:00:00');
                $endDate = $now;
            } elseif ($dateRange === 'last_year') {
                $startDate = date('Y-01-01 00:00:00', strtotime('last year'));
                $endDate = date('Y-12-31 23:59:59', strtotime('last year'));
            } elseif ($dateRange === 'custom') {
                $start = $this->request->getGet('start_date');
                $end = $this->request->getGet('end_date');
                if ($start) $startDate = date('Y-m-d 00:00:00', strtotime($start));
                if ($end) $endDate = date('Y-m-d 23:59:59', strtotime($end));
            }
            
            if ($startDate) {
                $fileQuery->where('updated_at >=', $startDate);
            }
            if ($endDate) {
                $fileQuery->where('updated_at <=', $endDate);
            }
        }

        $sortField = $this->request->getGet('sort') ?: 'name';
        $sortOrder = $this->request->getGet('order') ?: 'asc';

        $dbField = 'filename';
        if ($sortField === 'size') {
            $dbField = 'file_size';
        } elseif ($sortField === 'updated') {
            $dbField = 'updated_at';
        }
        $sortOrder = in_array(strtolower($sortOrder), ['asc', 'desc'], true) ? strtolower($sortOrder) : 'asc';

        $files = $fileQuery->orderBy($dbField, $sortOrder)->paginate(20, 'default');
        $pager = $fileModel->pager;

        // Path (breadcrumbs)
        $path = [];
        $currentId = $folderId;
        while ($currentId !== null) {
            $folder = $containerModel->find($currentId);
            if ($folder) {
                array_unshift($path, [
                    'id' => $folder['id'],
                    'name' => $folder['name']
                ]);
                $currentId = $folder['parent_id'];
            } else {
                break;
            }
        }

        // Calculate size in readable format for UI
        foreach ($files as &$file) {
            $file['formatted_size'] = $this->formatBytes($file['file_size']);
            // Generate base64 url-safe UUID for download
            $file['encoded_uuid'] = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($file['uuid']));
        }

        // Fetch all folders for the move selection and nested tree with counts
        $allFolders = $db->query("
            SELECT c.*, 
                   (SELECT COUNT(*) FROM {$db->prefixTable('file_containers')} WHERE parent_id = c.id AND deleted_at IS NULL) as subfolder_count,
                   (SELECT COUNT(*) FROM {$db->prefixTable('files')} WHERE container_id = c.id AND deleted_at IS NULL) as file_count
            FROM {$db->prefixTable('file_containers')} c 
            WHERE c.deleted_at IS NULL
            ORDER BY c.name ASC
        ")->getResultArray();

        // Map counts to folders
        foreach ($folders as &$f) {
            $found = false;
            foreach ($allFolders as $af) {
                if ((int)$af['id'] === (int)$f['id']) {
                    $f['subfolder_count'] = (int)$af['subfolder_count'];
                    $f['file_count'] = (int)$af['file_count'];
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $f['subfolder_count'] = 0;
                $f['file_count'] = 0;
            }
        }

        // Fetch System Settings
        $systemSettings = $settingModel->getAllSettings();

        // Fetch Dashboard Statistics when at Level 0
        $dashboardStats = null;
        if ($folderId === null && empty($searchQuery)) {
            $totalFiles = $fileModel->countAllResults();
            $totalFolders = $containerModel->countAllResults();
            
            $sizeQuery = $db->query("SELECT SUM(file_size) as sz FROM {$db->prefixTable('files')} WHERE deleted_at IS NULL")->getRowArray();
            $totalSize = (int)($sizeQuery['sz'] ?? 0);

            // DB vs Physical Storage distribution
            $dbCount = $fileModel->where('storage_type', 'database')->countAllResults();
            $physCount = $fileModel->where('storage_type', 'physical')->countAllResults();

            $dbSizeQuery = $db->query("SELECT SUM(file_size) as sz FROM {$db->prefixTable('files')} WHERE storage_type = 'database' AND deleted_at IS NULL")->getRowArray();
            $physSizeQuery = $db->query("SELECT SUM(file_size) as sz FROM {$db->prefixTable('files')} WHERE storage_type = 'physical' AND deleted_at IS NULL")->getRowArray();
            
            $dbSize = (int)($dbSizeQuery['sz'] ?? 0);
            $physSize = (int)($physSizeQuery['sz'] ?? 0);

            // Top 5 Downloaded files
            $topDownloaded = $fileModel->orderBy('download_count', 'desc')->limit(5)->findAll();
            foreach ($topDownloaded as &$td) {
                $td['formatted_size'] = $this->formatBytes($td['file_size']);
                $td['encoded_uuid'] = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($td['uuid']));
            }

            // Recent 5 activity logs from file
            $recentLogs = [];
            $daysToCheck = [date('Y-m-d'), date('Y-m-d', strtotime('-1 day'))];
            foreach ($daysToCheck as $day) {
                $logFile = WRITEPATH . 'logs/log-' . $day . '.log';
                if (file_exists($logFile)) {
                    $lines = file($logFile);
                    $auditLines = [];
                    foreach ($lines as $line) {
                        if (strpos($line, '[AUDIT]') !== false) {
                            $auditLines[] = $line;
                        }
                    }
                    $auditLines = array_slice(array_reverse($auditLines), 0, 5);
                    foreach ($auditLines as $line) {
                        if (preg_match('/-->\s+\[AUDIT\]\s+(.+)$/', $line, $matches)) {
                            $recentLogs[] = trim($matches[1]);
                        }
                    }
                    if (count($recentLogs) >= 5) {
                        $recentLogs = array_slice($recentLogs, 0, 5);
                        break;
                    }
                }
            }

            $dashboardStats = [
                'total_files' => $totalFiles,
                'total_folders' => $totalFolders,
                'total_size' => $totalSize,
                'formatted_total_size' => $this->formatBytes($totalSize),
                'storage_distribution' => [
                    'database_count' => $dbCount,
                    'database_size' => $dbSize,
                    'formatted_database_size' => $this->formatBytes($dbSize),
                    'physical_count' => $physCount,
                    'physical_size' => $physSize,
                    'formatted_physical_size' => $this->formatBytes($physSize)
                ],
                'top_downloaded' => $topDownloaded,
                'recent_logs' => $recentLogs
            ];
        }

        return $this->respond([
            'status' => 'success',
            'current_folder_id' => $folderId,
            'path' => $path,
            'folders' => $folders,
            'all_folders' => $allFolders,
            'files' => $files,
            'dashboard_stats' => $dashboardStats,
            'settings' => $systemSettings,
            'pager' => [
                'currentPage' => $pager->getCurrentPage(),
                'pageCount' => $pager->getPageCount(),
                'hasNext' => $pager->hasMore(),
                'hasPrevious' => $pager->getCurrentPage() > 1,
                'total' => $pager->getTotal()
            ]
        ]);
    }

    public function createFolder(): ResponseInterface
    {
        // Require auth
        $auth = service('auth');
        if (!$auth->loggedIn()) {
            return $this->failUnauthorized('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        }

        $containerModel = new \App\Models\FileContainerModel();
        $name = $this->request->getPost('name');
        $parentId = $this->request->getPost('parent_id') ?: null;

        if (empty($name)) {
            return $this->fail('กรุณากรอกชื่อโฟลเดอร์');
        }

        /** @var Uuid $uuid */
        $uuid = service('uuid');

        $containerModel->insert([
            'uuid' => $uuid->uuid4()->toString(),
            'name' => $name,
            'parent_id' => $parentId ? (int)$parentId : null
        ]);

        return $this->respond([
            'status' => 'success',
            'message' => 'สร้างโฟลเดอร์เรียบร้อยแล้ว'
        ]);
    }

    public function deleteFile(): ResponseInterface
    {
        // Require auth
        $auth = service('auth');
        if (!$auth->loggedIn()) {
            return $this->failUnauthorized('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        }

        $fileModel = new FileModel();
        $uuidStr = $this->request->getPost('uuid');

        $file = $fileModel->find($uuidStr);
        if (!$file) {
            return $this->fail('ไม่พบไฟล์ที่ต้องการลบ');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // Delete chunks first to satisfy MySQL foreign key constraints
        $chunkModel = new FileChunkModel();
        $chunkModel->where('file_uuid', $uuidStr)->delete();

        if ($file['storage_type'] === 'physical') {
            $filePath = WRITEPATH . 'uploads/' . $uuidStr;
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        // Hard delete metadata file record
        $fileModel->delete($uuidStr, true);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->fail('ไม่สามารถลบไฟล์ได้');
        }

        log_message('info', "File deleted by admin. UUID: {$uuidStr}, Filename: {$file['filename']}");

        return $this->respond([
            'status' => 'success',
            'message' => 'ลบไฟล์เรียบร้อยแล้ว'
        ]);
    }

    private function formatBytes($bytes, $precision = 2) {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    public function batchMove(): ResponseInterface
    {
        $auth = service('auth');
        if (!$auth->loggedIn()) {
            return $this->failUnauthorized('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        }

        $fileModel = new FileModel();
        $containerModel = new \App\Models\FileContainerModel();

        $uuids = $this->request->getPost('uuids') ?: [];
        $folderIds = $this->request->getPost('folder_ids') ?: [];
        $targetFolderId = $this->request->getPost('target_folder_id') ?: null;

        if (empty($uuids) && empty($folderIds)) {
            return $this->fail('กรุณาเลือกไฟล์หรือโฟลเดอร์ที่ต้องการย้าย');
        }

        // 1. Loop Prevention Check
        if ($targetFolderId !== null) {
            // Find all ancestors of the target folder (including target folder itself)
            $ancestorIds = [];
            $currId = $targetFolderId;
            while ($currId !== null) {
                $ancestorIds[] = (int)$currId;
                $folder = $containerModel->find($currId);
                $currId = $folder ? $folder['parent_id'] : null;
            }

            // Check if any selected folder is in target folder's ancestor chain
            foreach ($folderIds as $fId) {
                if (in_array((int)$fId, $ancestorIds, true)) {
                    return $this->fail('ไม่สามารถย้ายโฟลเดอร์ลงไปในตัวเองหรือโฟลเดอร์ย่อยของตนเองได้');
                }
            }
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // Move files
        foreach ($uuids as $uuid) {
            $fileModel->update($uuid, [
                'container_id' => $targetFolderId ? (int)$targetFolderId : null
            ]);
        }

        // Move folders
        foreach ($folderIds as $fId) {
            $containerModel->update($fId, [
                'parent_id' => $targetFolderId ? (int)$targetFolderId : null
            ]);
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->fail('ไม่สามารถย้ายรายการได้');
        }

        return $this->respond([
            'status' => 'success',
            'message' => 'ย้ายรายการทั้งหมดเรียบร้อยแล้ว'
        ]);
    }

    public function batchDelete(): ResponseInterface
    {
        $auth = service('auth');
        if (!$auth->loggedIn()) {
            return $this->failUnauthorized('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        }

        $fileModel = new FileModel();
        $containerModel = new \App\Models\FileContainerModel();

        $uuids = $this->request->getPost('uuids') ?: [];
        $folderIds = $this->request->getPost('folder_ids') ?: [];

        if (empty($uuids) && empty($folderIds)) {
            return $this->fail('กรุณาเลือกไฟล์หรือโฟลเดอร์ที่ต้องการลบ');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // Delete files
        foreach ($uuids as $uuid) {
            $file = $fileModel->find($uuid);
            if ($file) {
                // Delete chunks first to satisfy MySQL foreign key constraints
                $chunkModel = new FileChunkModel();
                $chunkModel->where('file_uuid', $uuid)->delete();

                if ($file['storage_type'] === 'physical') {
                    $filePath = WRITEPATH . 'uploads/' . $uuid;
                    if (file_exists($filePath)) {
                        unlink($filePath);
                    }
                }

                // Hard delete metadata file record
                $fileModel->delete($uuid, true);
            }
        }

        // Delete folders recursively (Cascade)
        foreach ($folderIds as $fId) {
            $this->cascadeDeleteFolder((int)$fId);
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->fail('ไม่สามารถลบรายการได้');
        }

        return $this->respond([
            'status' => 'success',
            'message' => 'ลบรายการทั้งหมดเรียบร้อยแล้ว'
        ]);
    }

    public function batchDownload(): ResponseInterface
    {
        $auth = service('auth');
        if (!$auth->loggedIn()) {
            return $this->failUnauthorized('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        }

        $fileModel = new FileModel();
        $chunkModel = new FileChunkModel();

        $uuids = $this->request->getVar('uuids') ?: [];
        $folderIds = $this->request->getVar('folder_ids') ?: [];

        if (empty($uuids) && empty($folderIds)) {
            return $this->fail('กรุณาเลือกไฟล์หรือโฟลเดอร์ที่ต้องการดาวน์โหลด');
        }

        // 1. Collect all files recursively
        $filesCollector = [];

        // Add direct files
        foreach ($uuids as $uuid) {
            $file = $fileModel->find($uuid);
            if ($file) {
                $filesCollector[$file['uuid']] = $file;
            }
        }

        // Add files from folders recursively
        if (!empty($folderIds)) {
            $this->collectFilesRecursive($folderIds, $filesCollector);
        }

        if (empty($filesCollector)) {
            return $this->fail('ไม่พบไฟล์เอกสารสำหรับทำรายการดาวน์โหลด');
        }

        // 2. Check total size and count constraints
        $totalSize = 0;
        foreach ($filesCollector as $file) {
            $totalSize += (int)$file['file_size'];
        }

        // Limit size to 50MB
        if ($totalSize > 50 * 1024 * 1024) {
            return $this->fail('ขนาดรวมไฟล์ทั้งหมดเกินขีดจำกัด 50MB กรุณาแยกดาวน์โหลดเป็นรายไฟล์');
        }

        // Limit count to 15 files
        if (count($filesCollector) > 15) {
            return $this->fail('จำนวนไฟล์รวมทั้งหมดเกิน 15 ไฟล์ กรุณาแยกดาวน์โหลดเป็นรายครั้ง');
        }

        // 3. Create temporary ZIP file
        $cacheDir = WRITEPATH . 'cache';
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0777, true);
        }

        $zipPath = $cacheDir . '/temp_batch_' . uniqid() . '.zip';
        $zip = new \ZipArchive();

        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return $this->fail('ไม่สามารถสร้างไฟล์บีบอัดชั่วคราวบนเซิร์ฟเวอร์ได้');
        }

        $addedNames = [];
        $db = \Config\Database::connect();
        $db->transStart();

        foreach ($filesCollector as $file) {
            // Uniquify filename in ZIP
            $filename = $file['filename'];
            $info = pathinfo($filename);
            $basename = $info['filename'] ?? 'document';
            $ext = isset($info['extension']) ? '.' . $info['extension'] : '';
            $counter = 1;
            while (in_array($filename, $addedNames, true)) {
                $filename = $basename . " ({$counter})" . $ext;
                $counter++;
            }
            $addedNames[] = $filename;

            // Add file data to zip
            if ($file['storage_type'] === 'physical') {
                $filePath = WRITEPATH . 'uploads/' . $file['uuid'];
                if (file_exists($filePath)) {
                    $zip->addFile($filePath, $filename);
                }
            } else {
                $chunks = $chunkModel->where('file_uuid', $file['uuid'])->orderBy('chunk_order', 'ASC')->findAll();
                $content = '';
                foreach ($chunks as $chunk) {
                    $content .= $chunk['chunk_data'];
                }
                $zip->addFromString($filename, $content);
            }

            // Atomic Increment statistics for each file inside zip
            $fileModel->where('uuid', $file['uuid'])->increment('download_count');

            // Audit log for each file inside zip
            list($username, $userId) = $this->getUserAttribution($auth);
            $ip = $this->request->getIPAddress();
            $userAgent = $this->request->getUserAgent()->getBrowser() . ' (' . $this->request->getUserAgent()->getAgentString() . ')';
            log_message('info', "[AUDIT] File downloaded via Batch Zip. UUID: {$file['uuid']}, Filename: {$file['filename']}, By User: {$username} (ID: {$userId}), IP: {$ip}, UA: {$userAgent}");
        }

        $zip->close();
        $db->transComplete();

        // 4. Stream Zip file using buffered response
        if (!file_exists($zipPath)) {
            return $this->fail('ไฟล์บีบอัดจัดทำไม่สำเร็จ');
        }

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        header('Content-Description: File Transfer');
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="document_batch_' . date('Ymd_His') . '.zip"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($zipPath));

        try {
            $fileHandle = fopen($zipPath, 'rb');
            if ($fileHandle) {
                while (!feof($fileHandle)) {
                    echo fread($fileHandle, 8192);
                    if (ob_get_level() > 0) {
                        ob_flush();
                    }
                    flush();
                }
                fclose($fileHandle);
            }
            exit;
        } finally {
            if (file_exists($zipPath)) {
                unlink($zipPath);
            }
        }
    }

    private function collectFilesRecursive(array $folderIds, array &$filesCollector)
    {
        $fileModel = new FileModel();
        $containerModel = new \App\Models\FileContainerModel();

        foreach ($folderIds as $folderId) {
            // Find direct files
            $files = $fileModel->where('container_id', $folderId)->findAll();
            foreach ($files as $file) {
                $filesCollector[$file['uuid']] = $file;
            }

            // Find child folders
            $childFolders = $containerModel->where('parent_id', $folderId)->findAll();
            $childIds = array_column($childFolders, 'id');
            if (!empty($childIds)) {
                $this->collectFilesRecursive($childIds, $filesCollector);
            }
        }
    }

    public function renameFolder(): ResponseInterface
    {
        $auth = service('auth');
        if (!$auth->loggedIn()) {
            return $this->failUnauthorized('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        }

        $containerModel = new \App\Models\FileContainerModel();
        $folderId = $this->request->getPost('folder_id');
        $name = $this->request->getPost('name');

        if (empty($folderId) || empty($name)) {
            return $this->fail('ข้อมูลไม่ครบถ้วน');
        }

        $container = $containerModel->find($folderId);
        if (!$container) {
            return $this->fail('ไม่พบโฟลเดอร์ที่ต้องการแก้ไข');
        }

        $containerModel->update($folderId, [
            'name' => $name
        ]);

        return $this->respond([
            'status' => 'success',
            'message' => 'แก้ไขชื่อโฟลเดอร์เรียบร้อยแล้ว'
        ]);
    }

    public function renameFile(): ResponseInterface
    {
        $auth = service('auth');
        if (!$auth->loggedIn()) {
            return $this->failUnauthorized('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        }

        $fileModel = new FileModel();
        $uuid = $this->request->getPost('uuid');
        $name = $this->request->getPost('name');

        if (empty($uuid) || empty($name)) {
            return $this->fail('ข้อมูลไม่ครบถ้วน');
        }

        $file = $fileModel->find($uuid);
        if (!$file) {
            return $this->fail('ไม่พบไฟล์ที่ต้องการแก้ไข');
        }

        // Keep file extension intact
        $oldExt = pathinfo($file['filename'], PATHINFO_EXTENSION);
        $newExt = pathinfo($name, PATHINFO_EXTENSION);
        $newName = $name;
        if ($oldExt && strtolower($oldExt) !== strtolower($newExt)) {
            $newName = pathinfo($name, PATHINFO_FILENAME) . '.' . $oldExt;
        }

        $fileModel->update($uuid, [
            'filename' => $newName
        ]);

        return $this->respond([
            'status' => 'success',
            'message' => 'แก้ไขชื่อไฟล์เรียบร้อยแล้ว'
        ]);
    }

    public function deleteFolder(): ResponseInterface
    {
        $auth = service('auth');
        if (!$auth->loggedIn()) {
            return $this->failUnauthorized('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        }

        $folderId = $this->request->getPost('folder_id');

        if (empty($folderId)) {
            return $this->fail('ระบุโฟลเดอร์ที่ต้องการลบ');
        }

        $containerModel = new \App\Models\FileContainerModel();
        $container = $containerModel->find($folderId);
        if (!$container) {
            return $this->fail('ไม่พบโฟลเดอร์ที่ต้องการลบ');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        $this->cascadeDeleteFolder((int)$folderId);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->fail('ไม่สามารถลบโฟลเดอร์ได้');
        }

        return $this->respond([
            'status' => 'success',
            'message' => 'ลบโฟลเดอร์และข้อมูลภายในทั้งหมดเรียบร้อยแล้ว'
        ]);
    }

    private function cascadeDeleteFolder(int $folderId)
    {
        $containerModel = new \App\Models\FileContainerModel();
        $fileModel = new FileModel();
        $chunkModel = new FileChunkModel();

        // 1. Delete all files in this folder
        $files = $fileModel->where('container_id', $folderId)->findAll();
        foreach ($files as $file) {
            // Delete chunks first to satisfy MySQL foreign key constraints
            $chunkModel->where('file_uuid', $file['uuid'])->delete();

            if ($file['storage_type'] === 'physical') {
                $filePath = WRITEPATH . 'uploads/' . $file['uuid'];
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }

            // Hard delete metadata file record
            $fileModel->delete($file['uuid'], true);
        }

        // 2. Find child folders and cascade delete them
        $childFolders = $containerModel->where('parent_id', $folderId)->findAll();
        foreach ($childFolders as $child) {
            $this->cascadeDeleteFolder((int)$child['id']);
        }

        // 3. Delete this folder container record itself
        $containerModel->delete($folderId, true); // Hard delete
    }

    public function index()
    {
        $containerModel = new \App\Models\FileContainerModel();

        $this->data['root_folders'] = $containerModel->where('parent_id', null)->findAll();
        $this->data['title'] = 'จัดการคลังไฟล์';

        // Load allowed extensions dynamically based on preloaded config
        $allowedExtensionsStr = $this->data['allowed_extensions'] ?? 'pdf';
        $extensionsArray = array_map(function($ext) {
            $ext = trim($ext);
            return $ext ? '.' . ltrim($ext, '.') : '';
        }, explode(',', $allowedExtensionsStr));
        $this->data['allowed_extensions_list'] = implode(',', array_filter($extensionsArray));

        return view('admin/upload', $this->data);
    }

    private function getUserAttribution($auth): array
    {
        $username = 'Guest';
        $userId = 'N/A';

        if ($auth->loggedIn()) {
            $user = $auth->user();
            if (is_object($user)) {
                // Handle uninitialized Entity caster gracefully
                try {
                    $username = $user->username ?? 'Unknown';
                    $userId = $user->id ?? 'N/A';
                } catch (\Throwable $e) {
                    if (method_exists($user, 'toArray')) {
                        $arr = $user->toArray();
                        $username = $arr['username'] ?? 'Unknown';
                        $userId = $arr['id'] ?? 'N/A';
                    } else {
                        $username = 'MockUser';
                        $userId = $user->id ?? 'N/A';
                    }
                }
            }
        }

        return [$username, $userId];
    }

    public function getSettings(): ResponseInterface
    {
        $auth = service('auth');
        if (!$auth->loggedIn()) {
            return $this->failUnauthorized('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        }

        $settingModel = new \App\Models\SettingModel();
        $settings = $settingModel->getAllSettings();

        return $this->respond([
            'status'   => 'success',
            'settings' => $settings,
        ]);
    }

    public function saveSettings(): ResponseInterface
    {
        $auth = service('auth');
        if (!$auth->loggedIn()) {
            return $this->failUnauthorized('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        }

        $settingModel = new \App\Models\SettingModel();
        $postData = $this->request->getPost();

        // Ensure settings_mode is resolved to either 'system' or 'custom'
        $postData['settings_mode'] = $this->request->getPost('settings_mode') === 'system' ? 'system' : 'custom';

        // Whitelisted setting keys to save
        $allowedKeys = [
            'date_format',
            'allowed_extensions',
            'max_file_size',
            'max_multiple_upload',
            'default_storage_type',
            'system_name',
            'system_name_en',
            'agency_short_name',
            'chunk_size',
            'settings_mode'
        ];

        foreach ($allowedKeys as $key) {
            if (isset($postData[$key])) {
                $val = trim($postData[$key]);
                if ($key === 'max_file_size' || $key === 'max_multiple_upload' || $key === 'chunk_size') {
                    $val = (int)$val;
                    if ($val <= 0) {
                        return $this->fail("ค่าของ $key ต้องมีค่ามากกว่า 0");
                    }
                }
                if ($key === 'date_format' && !in_array($val, ['be', 'ce'], true)) {
                    return $this->fail("รูปแบบวันเวลาไม่ถูกต้อง");
                }
                if ($key === 'default_storage_type' && !in_array($val, ['database', 'physical'], true)) {
                    return $this->fail("ประเภทหน่วยจัดเก็บข้อมูลไม่ถูกต้อง");
                }
                
                $settingModel->saveSetting($key, (string)$val);
            }
        }

        return $this->respond([
            'status'  => 'success',
            'message' => 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว',
        ]);
    }
}
