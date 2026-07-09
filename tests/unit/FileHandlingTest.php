<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

class FileHandlingTest extends CIUnitTestCase
{
    public function testBase64UrlSafeEncoding()
    {
        $uuid = '6d3a8d81-8b2b-4fa8-b2bc-6de808a3d5e2';
        
        // Encode URL-safe base64 (removes padding for cleaner URLs)
        $encoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($uuid));
        
        // Decode URL-safe base64
        $decoded = base64_decode(str_replace(['-', '_'], ['+', '/'], $encoded));
        
        $this->assertSame($uuid, $decoded);
    }

    public function testSha256Hashing()
    {
        $data = "Hello MOPH Legal Affairs Division! This is a test for file integrity.";
        $tempFile = tempnam(sys_get_temp_dir(), 'test');
        file_put_contents($tempFile, $data);
        
        $expectedHash = hash('sha256', $data);
        $actualHash = hash_file('sha256', $tempFile);
        
        unlink($tempFile);
        
        $this->assertSame($expectedHash, $actualHash);
    }

    public function testFileChunkModelInsert()
    {
        $db = \Config\Database::connect('default');
        $fileModel = new \App\Models\FileModel($db);
        $chunkModel = new \App\Models\FileChunkModel($db);
        
        $fileUuid = '00000000-0000-0000-0000-000000000000';
        
        // Clean up any old test data just in case
        $chunkModel->where('file_uuid', $fileUuid)->delete();
        $fileModel->delete($fileUuid, true); // true for purge (hard delete)
        
        // 1. Insert dummy file metadata
        $fileModel->insert([
            'uuid' => $fileUuid,
            'filename' => 'test_chunk_integrity.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'is_public' => 1,
            'storage_type' => 'physical'
        ]);
        
        // 2. Insert chunk
        $chunkData = 'Test chunk binary data';
        $insertedId = $chunkModel->insert([
            'file_uuid' => $fileUuid,
            'chunk_order' => 0,
            'chunk_data' => $chunkData
        ]);
        
        $this->assertNotEmpty($insertedId);
        
        // 3. Query back and verify
        $chunk = $chunkModel->where('file_uuid', $fileUuid)->where('chunk_order', 0)->first();
        $this->assertNotNull($chunk);
        $this->assertSame($chunkData, $chunk['chunk_data']);
        
        // 4. Clean up
        $chunkModel->where('file_uuid', $fileUuid)->delete();
        $fileModel->delete($fileUuid, true);
    }
}
