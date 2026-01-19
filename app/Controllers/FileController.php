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

        $dzuuid = $request->getPost('dzuuid');
        $chunkIndex = $request->getPost('dzchunkindex');
        $totalChunks = $request->getPost('dztotalchunkcount');
        $totalFileSize = $request->getPost('dztotalfilesize');
        $file = $request->getFile('file');

        if ($totalChunks === null) {
            $totalChunks = 1;
            $chunkIndex = 0;
        }

        if (!$file || !$file->isValid())
            return $this->fail('Invalid File');

        $fileModel = new FileModel();

        $existingFile = $fileModel
            ->where('upload_session_id', $dzuuid)
            ->first();

        $fileUuid = isset($existingFile['uuid']) ? $existingFile['uuid'] : $fileModel->insert([
            'uuid' => $uuid->uuid4()->toString(),
            'filename' => $file->getClientName(),
            'upload_session_id' => $dzuuid,
            'mime_type' => $file->getMimeType(),
            'file_size' => $totalFileSize,
            'is_public' => 1,
        ], true);

        log_message('debug', $fileUuid);

        $chunkModel = new FileChunkModel();
        $chunkData = file_get_contents($file->getTempName());

        $existingChunk = $chunkModel
            ->where('file_uuid', $fileUuid)
            ->where('chunk_order', $chunkIndex)
            ->countAllResults();

        if ($existingChunk === 0)
            $chunkModel->insert([
                'file_uuid' => $fileUuid,
                'chunk_order' => $chunkIndex,
                'chunk_data' => $chunkData
            ]);

        $uploadedCount = $chunkModel
            ->where('file_uuid', $fileUuid)
            ->countAllResults();

        if ($uploadedCount >= $totalChunks)
            return $this->respond(['status' => 'completed', 'file_uuid' => $fileUuid]);

        return $this->respond(['status' => 'chunk_received', 'chunk_index' => $chunkIndex]);
    }

    public function index()
    {
        return view('admin/upload');
    }
}
