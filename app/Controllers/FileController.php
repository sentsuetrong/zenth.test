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

        $fileId = isset($existingFile['id']) ? $existingFile['id'] : $fileModel->insert([
            'uuid' => $uuid->uuid4()->toString(),
            'upload_session_id' => $dzuuid,
            'filename' => $file->getClientName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $totalFileSize,
            'is_public' => 1,
        ], true);

        $chunkModel = new FileChunkModel();
        $chunkData = file_get_contents($file->getTempName());

        $existingChunk = $chunkModel
            ->where('file_id', $fileId)
            ->where('chunk_order', $chunkIndex)
            ->countAllResults();

        if ($existingChunk === 0)
            $chunkModel->insert([
                'file_id' => $fileId,
                'chunk_order' => $chunkIndex,
                'chunk_data' => $chunkData
            ]);

        $uploadedCount = $chunkModel
            ->where('file_id', $fileId)
            ->countAllResults();

        if ($uploadedCount >= $totalChunks)
            return $this->respond(['status' => 'completed', 'file_id' => $fileId]);

        return $this->respond(['status' => 'chunk_received', 'chunk_index' => $chunkIndex]);
    }

    public function index()
    {
        return view('admin/upload');
    }
}
