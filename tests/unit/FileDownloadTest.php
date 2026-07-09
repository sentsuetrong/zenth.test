<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
class FileDownloadTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    protected function setUp(): void
    {
        parent::setUp();
        \Config\Services::reset();
    }

    public function testDatabaseDownload6MBFile(): void
    {
        $db = \Config\Database::connect();
        $fileModel = new \App\Models\FileModel($db);
        $chunkModel = new \App\Models\FileChunkModel($db);

        // Generate a 6MB file (12 chunks of 512KB each)
        $fileUuid = '11111111-2222-3333-4444-555555555555';
        $chunkSize = 512 * 1024; // 512KB
        $totalChunks = 12;
        $fileSize = $chunkSize * $totalChunks;

        // Clean up any old test records first
        $chunkModel->where('file_uuid', $fileUuid)->delete();
        $fileModel->delete($fileUuid, true);

        // Insert metadata
        $fileModel->insert([
            'uuid' => $fileUuid,
            'filename' => 'test_6mb_db_file.pdf',
            'file_hash' => hash('sha256', str_repeat('A', $fileSize)),
            'storage_type' => 'database',
            'file_size' => $fileSize,
            'mime_type' => 'application/pdf',
            'is_public' => 1
        ]);

        // Insert chunks
        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkModel->insert([
                'file_uuid' => $fileUuid,
                'chunk_order' => $i,
                'chunk_data' => str_repeat(chr(65 + ($i % 26)), $chunkSize) // AAA..., BBB..., CCC...
            ]);
        }

        // Encode UUID to base64 url-safe
        $encodedUuid = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($fileUuid));

        // Act: Request the download
        // We catch the output buffer because the download method calls echo and exit
        ob_start();
        try {
            $result = $this->get("moph-db/file/download/{$encodedUuid}");
        } catch (\CodeIgniter\Router\Exceptions\RedirectException $e) {
            // Catch redirects if any
        }
        $output = ob_get_clean();

        // Clean up
        $chunkModel->where('file_uuid', $fileUuid)->delete();
        $fileModel->delete($fileUuid, true);

        // Assert: Check download status or output length
        $this->assertEquals($fileSize, strlen($output), "Downloaded file size must be exactly 6MB ({$fileSize} bytes)");
    }

    public function testPhysicalDownload6MBFile(): void
    {
        $db = \Config\Database::connect();
        $fileModel = new \App\Models\FileModel($db);

        $fileUuid = '22222222-3333-4444-5555-666666666666';
        $fileSize = 6 * 1024 * 1024; // 6MB

        // Clean up any old test records
        $fileModel->delete($fileUuid, true);

        // Create the physical file on disk
        $filePath = WRITEPATH . 'uploads/' . $fileUuid;
        $content = str_repeat('B', $fileSize);
        file_put_contents($filePath, $content);

        // Insert metadata
        $fileModel->insert([
            'uuid' => $fileUuid,
            'filename' => 'test_6mb_physical_file.pdf',
            'file_hash' => hash_file('sha256', $filePath),
            'storage_type' => 'physical',
            'file_size' => $fileSize,
            'mime_type' => 'application/pdf',
            'is_public' => 1
        ]);

        // Encode UUID to base64 url-safe
        $encodedUuid = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($fileUuid));

        // Act: Request the download
        ob_start();
        try {
            $result = $this->get("moph-db/file/download/{$encodedUuid}");
        } catch (\CodeIgniter\Router\Exceptions\RedirectException $e) {
            // Catch redirects
        }
        $output = ob_get_clean();

        // Clean up
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        $fileModel->delete($fileUuid, true);

        // Assert
        $this->assertEquals($fileSize, strlen($output), "Downloaded file size must be exactly 6MB ({$fileSize} bytes)");
    }
}
