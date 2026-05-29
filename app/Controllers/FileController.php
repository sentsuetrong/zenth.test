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

        $fileModel = new FileModel();
        
        // Find or create file metadata
        $existingFile = $fileModel->where('upload_session_id', $dzuuid)->first();

        if (!$existingFile) {
            $fileUuid = $fileModel->insert([
                'uuid' => $uuid->uuid4()->toString(),
                'filename' => $file->getClientName(),
                'upload_session_id' => $dzuuid,
                'mime_type' => $file->getMimeType(),
                'file_size' => $totalFileSize,
                'is_public' => 1,
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
            // All chunks received
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

    public function index()
    {
        return view('admin/upload');
    }
}
