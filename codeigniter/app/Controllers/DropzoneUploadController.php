<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\FileChunkModel;
use App\Models\FileModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\IncomingRequest;
use Michalsn\Uuid\Uuid;

class DropzoneUploadController extends BaseController
{
    use ResponseTrait;
    public function upload()
    {
        /**
         * @var IncomingRequest $request
         */
        $request = service('request');

        $dzuuid = $request->getPost('dzuuid');
        $chunkIndex = $request->getPost('dzchunkindex');
        $totalChunks = $request->getPost('dztotalchunkcount');
        $totalFileSize = $request->getPost('dztotalfilesize');
        $file = $request->getFile('file');

        if ($totalChunks === null) {
            $totalChunks = 1;
            $chunkIndex = 0;
        }

        if (!$file || !$file->isValid()) {
            return $this->fail('Invalid file');
        }

        $fileModel = new FileModel();

        $existingFile = $fileModel->where('upload_session_id', $dzuuid)->first();
        $fileId = null;

        if (!$existingFile) {
            /** @var Uuid $uuid */
            $uuid = service('uuid');

            $fileData = [
                'uuid' => $uuid->uuid4()->toString(),
                'upload_session_id' => $dzuuid,
                'filename' => $file->getClientName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $totalFileSize,
                'is_public' => 0,
            ];

            $fileId = $fileModel->insert($fileData, true);
        } else {
            $fileId = $existingFile['id'];
        }

        $chunkModel = new FileChunkModel();
        $binaryData = file_get_contents($file->getTempName());

        $exists = $chunkModel->where('file_id', $fileId)
            ->where('chunk_order', $chunkIndex)
            ->countAllResults();

        if ($exists === 0)
            $chunkModel->insert(['file_id' => $fileId, 'chunk_order' => $chunkIndex, 'chunk_data' => $binaryData]);

        $uploadedCount = $chunkModel->where('file_id', $fileId)->countAllResults();

        if ($uploadedCount >= $totalChunks)
            return $this->respond(['status' => 'completed', 'file_id' => $fileId]);

        return $this->respond(['status' => 'chunk_received', 'chunk_index' => $chunkIndex]);
    }

    public function index()
    {
        return view('upload_view');
    }
}
