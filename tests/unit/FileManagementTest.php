<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;
use App\Models\FileModel;
use App\Models\FileChunkModel;
use App\Models\FileContainerModel;

/**
 * @internal
 */
class FileManagementTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    protected function setUp(): void
    {
        parent::setUp();
        \Config\Services::reset();
    }

    private function mockAuth(): void
    {
        // Mock Settings service to bypass Database settings lookup
        $settingsMock = $this->getMockBuilder(\CodeIgniter\Settings\Settings::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['get'])
            ->getMock();
        $settingsMock->method('get')->willReturnCallback(function($key) {
            $defaults = [
                'Auth.sessionConfig' => [
                    'field' => 'active_at',
                ],
                'Auth.recordActiveInterval' => 300,
                'date_format' => 'be',
                'allowed_extensions' => 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg,gif,webp,mp4,webm,mp3,wav,ogg',
                'max_file_size' => '10',
                'max_multiple_upload' => '10',
                'default_storage_type' => 'database',
                'system_name' => 'ระบบคลังไฟล์',
                'agency_short_name' => 'กองกฎหมาย',
            ];
            return $defaults[$key] ?? null;
        });
        \Config\Services::injectMock('settings', $settingsMock);

        // Mock User Entity to be active/not banned
        $userMock = $this->getMockBuilder(\CodeIgniter\Shield\Entities\User::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['isBanned', 'isActivated'])
            ->getMock();
        $userMock->method('isBanned')->willReturn(false);
        $userMock->method('isActivated')->willReturn(true);

        // Mock Shield session authenticator
        $sessionMock = $this->getMockBuilder(\CodeIgniter\Shield\Authentication\Authenticators\Session::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['loggedIn', 'getUser', 'recordActiveDate'])
            ->getMock();
        $sessionMock->method('loggedIn')->willReturn(true);
        $sessionMock->method('getUser')->willReturn($userMock);
        $sessionMock->method('recordActiveDate');

        // Mock Auth service
        $authMock = $this->getMockBuilder(\CodeIgniter\Shield\Auth::class)
            ->setConstructorArgs([config('Auth')])
            ->onlyMethods(['getAuthenticator'])
            ->addMethods(['loggedIn'])
            ->getMock();
        $authMock->method('getAuthenticator')->willReturn($sessionMock);
        $authMock->method('loggedIn')->willReturn(true);

        \Config\Services::injectMock('auth', $authMock);
    }

    private function generateUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    public function testRenameFolder(): void
    {
        $this->mockAuth();

        $containerModel = new FileContainerModel();
        $folderId = $containerModel->insert([
            'uuid' => $this->generateUuid(),
            'name' => 'Original Name',
            'parent_id' => null
        ], true);

        $result = $this->post('admin/upload/rename-folder', [
            'folder_id' => $folderId,
            'name' => 'New Awesome Name'
        ]);

        $result->assertStatus(200);
        $result->assertJSONFragment(['message' => 'แก้ไขชื่อโฟลเดอร์เรียบร้อยแล้ว']);

        // Assert database updated
        $updatedFolder = $containerModel->find($folderId);
        $this->assertEquals('New Awesome Name', $updatedFolder['name']);

        // Clean up
        $containerModel->delete($folderId, true);
    }

    public function testBatchMove(): void
    {
        $this->mockAuth();

        $containerModel = new FileContainerModel();
        $fileModel = new FileModel();

        // 1. Create a target folder
        $folderId = $containerModel->insert([
            'uuid' => $this->generateUuid(),
            'name' => 'Target Folder',
            'parent_id' => null
        ], true);

        // 2. Create 2 mock files at root (container_id = null)
        $uuid1 = $this->generateUuid();
        $uuid2 = $this->generateUuid();

        $fileModel->insert([
            'uuid' => $uuid1,
            'filename' => 'file1.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'storage_type' => 'physical',
            'container_id' => null
        ]);

        $fileModel->insert([
            'uuid' => $uuid2,
            'filename' => 'file2.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 2048,
            'storage_type' => 'physical',
            'container_id' => null
        ]);

        // 3. Request batch move
        $result = $this->post('admin/upload/batch-move', [
            'uuids' => [$uuid1, $uuid2],
            'target_folder_id' => $folderId
        ]);

        $result->assertStatus(200);
        $result->assertJSONFragment(['message' => 'ย้ายรายการทั้งหมดเรียบร้อยแล้ว']);

        // Assert database updated
        $f1 = $fileModel->find($uuid1);
        $f2 = $fileModel->find($uuid2);
        $this->assertEquals($folderId, $f1['container_id']);
        $this->assertEquals($folderId, $f2['container_id']);

        // Clean up
        $fileModel->delete($uuid1, true);
        $fileModel->delete($uuid2, true);
        $containerModel->delete($folderId, true);
    }

    public function testBatchDelete(): void
    {
        $this->mockAuth();

        $fileModel = new FileModel();
        $chunkModel = new FileChunkModel();

        // 1. Create 2 files (one database, one physical)
        $uuidDb = $this->generateUuid();
        $uuidPhys = $this->generateUuid();

        $fileModel->insert([
            'uuid' => $uuidDb,
            'filename' => 'db_file.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1234,
            'storage_type' => 'database'
        ]);
        $chunkModel->insert([
            'file_uuid' => $uuidDb,
            'chunk_order' => 0,
            'chunk_data' => 'dummy chunk data'
        ]);

        $fileModel->insert([
            'uuid' => $uuidPhys,
            'filename' => 'phys_file.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 5678,
            'storage_type' => 'physical'
        ]);
        $filePath = WRITEPATH . 'uploads/' . $uuidPhys;
        if (!is_dir(dirname($filePath))) {
            mkdir(dirname($filePath), 0777, true);
        }
        file_put_contents($filePath, 'dummy physical data');

        // 2. Request batch delete
        $result = $this->post('admin/upload/batch-delete', [
            'uuids' => [$uuidDb, $uuidPhys]
        ]);

        $result->assertStatus(200);
        $result->assertJSONFragment(['message' => 'ลบรายการทั้งหมดเรียบร้อยแล้ว']);

        // Assert database and disk cleared
        $this->assertNull($fileModel->find($uuidDb));
        $this->assertNull($fileModel->find($uuidPhys));
        $this->assertEquals(0, $chunkModel->where('file_uuid', $uuidDb)->countAllResults());
        $this->assertFileDoesNotExist($filePath);
    }

    public function testDeleteFolderCascade(): void
    {
        $this->mockAuth();

        $containerModel = new FileContainerModel();
        $fileModel = new FileModel();
        $chunkModel = new FileChunkModel();

        // 1. Create Folder structure: Parent -> Child
        $parentFolderId = $containerModel->insert([
            'uuid' => $this->generateUuid(),
            'name' => 'Parent Folder',
            'parent_id' => null
        ], true);

        $childFolderId = $containerModel->insert([
            'uuid' => $this->generateUuid(),
            'name' => 'Child Folder',
            'parent_id' => $parentFolderId
        ], true);

        // 2. Create files inside Parent and Child
        $uuidParentFile = $this->generateUuid();
        $uuidChildFile = $this->generateUuid();

        $fileModel->insert([
            'uuid' => $uuidParentFile,
            'filename' => 'parent_file.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 10,
            'storage_type' => 'database',
            'container_id' => $parentFolderId
        ]);
        $chunkModel->insert([
            'file_uuid' => $uuidParentFile,
            'chunk_order' => 0,
            'chunk_data' => 'parent'
        ]);

        $fileModel->insert([
            'uuid' => $uuidChildFile,
            'filename' => 'child_file.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 20,
            'storage_type' => 'physical',
            'container_id' => $childFolderId
        ]);
        $childFilePath = WRITEPATH . 'uploads/' . $uuidChildFile;
        file_put_contents($childFilePath, 'child');

        // 3. Request delete parent folder
        $result = $this->post('admin/upload/delete-folder', [
            'folder_id' => $parentFolderId
        ]);

        $result->assertStatus(200);
        $result->assertJSONFragment(['message' => 'ลบโฟลเดอร์และข้อมูลภายในทั้งหมดเรียบร้อยแล้ว']);

        // Assert folders, files, chunks, and physical files are all deleted
        $this->assertNull($containerModel->find($parentFolderId));
        $this->assertNull($containerModel->find($childFolderId));
        $this->assertNull($fileModel->find($uuidParentFile));
        $this->assertNull($fileModel->find($uuidChildFile));
        $this->assertEquals(0, $chunkModel->where('file_uuid', $uuidParentFile)->countAllResults());
        $this->assertFileDoesNotExist($childFilePath);
    }

    public function testMoveLoopPrevention()
    {
        $this->mockAuth();
        $containerModel = new \App\Models\FileContainerModel();

        // 1. Create P1 and C1 (under P1)
        $parentFolderId = $containerModel->insert([
            'uuid' => $this->generateUUID(),
            'name' => 'Parent Folder P1',
            'parent_id' => null
        ]);
        $childFolderId = $containerModel->insert([
            'uuid' => $this->generateUUID(),
            'name' => 'Child Folder C1',
            'parent_id' => $parentFolderId
        ]);

        // 2. Request move P1 into C1
        $result = $this->post('admin/upload/batch-move', [
            'folder_ids' => [$parentFolderId],
            'target_folder_id' => $childFolderId
        ]);

        // Assert failure (status code 400 or non-200)
        $result->assertStatus(400);
        $result->assertJSONFragment(['messages' => ['error' => 'ไม่สามารถย้ายโฟลเดอร์ลงไปในตัวเองหรือโฟลเดอร์ย่อยของตนเองได้']]);

        // Clean up
        $containerModel->delete($childFolderId, true);
        $containerModel->delete($parentFolderId, true);
    }

    public function testBatchDownloadZip()
    {
        $this->mockAuth();
        $fileModel = new FileModel();
        $chunkModel = new FileChunkModel();

        $uuidPhys = $this->generateUUID();
        $uuidDb = $this->generateUUID();

        // 1. Create a physical file
        $fileModel->insert([
            'uuid' => $uuidPhys,
            'filename' => 'phys.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 10,
            'storage_type' => 'physical',
            'container_id' => null
        ]);
        $filePath = WRITEPATH . 'uploads/' . $uuidPhys;
        file_put_contents($filePath, 'physical');

        // 2. Create a db file
        $fileModel->insert([
            'uuid' => $uuidDb,
            'filename' => 'db.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'storage_type' => 'database',
            'container_id' => null
        ]);
        $chunkModel->insert([
            'file_uuid' => $uuidDb,
            'chunk_index' => 0,
            'chunk_data' => 'db_chunk',
            'chunk_order' => 1
        ]);

        // 3. Request batch download ZIP
        ob_start();
        $result = $this->post('admin/upload/batch-download', [
            'uuids' => [$uuidPhys, $uuidDb]
        ]);
        $output = ob_get_clean();

        $result->assertStatus(200);
        $result->assertHeader('Content-Type', 'application/zip');

        // 4. Assert download_count statistics incremented
        $fPhys = $fileModel->find($uuidPhys);
        $fDb = $fileModel->find($uuidDb);
        $this->assertEquals(1, (int)$fPhys['download_count']);
        $this->assertEquals(1, (int)$fDb['download_count']);

        // Clean up
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        $chunkModel->where('file_uuid', $uuidDb)->delete();
        $fileModel->delete($uuidPhys, true);
        $fileModel->delete($uuidDb, true);
    }

    public function testChunkUploadWordExcelAllowedExtensions(): void
    {
        $this->mockAuth();

        $tempPath = tempnam(sys_get_temp_dir(), 'tst');
        file_put_contents($tempPath, 'fake docx content');

        $_FILES['file'] = [
            'name'     => 'blob',
            'type'     => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'tmp_name' => $tempPath,
            'error'    => UPLOAD_ERR_OK,
            'size'     => filesize($tempPath),
        ];

        $dzuuid = $this->generateUuid();
        
        $result = $this->post('admin/upload/chunk', [
            'dzfilename' => 'agenda.docx',
            'dzuuid' => $dzuuid,
            'dzchunkindex' => 0,
            'dztotalchunkcount' => 1,
            'dztotalfilesize' => filesize($tempPath),
            'storage_type' => 'physical'
        ]);

        $result->assertStatus(200);
        $respData = json_decode($result->getJSON(), true);
        $this->assertSame('completed', $respData['status']);
        $fileUuid = $respData['file_uuid'];
        $this->assertNotEmpty($fileUuid);

        // Verify it was saved with the correct filename and extension in DB
        $fileModel = new FileModel();
        $fileRecord = $fileModel->find($fileUuid);
        $this->assertNotNull($fileRecord);
        $this->assertSame('agenda.docx', $fileRecord['filename']);
        $this->assertSame('physical', $fileRecord['storage_type']);

        // Clean up
        $filePath = WRITEPATH . 'uploads/' . $fileUuid;
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        $fileModel->delete($fileUuid, true);
    }

    public function testChunkUploadInvalidExtensionRejection(): void
    {
        $this->mockAuth();

        $tempPath = tempnam(sys_get_temp_dir(), 'tst');
        file_put_contents($tempPath, 'fake exe content');

        $_FILES['file'] = [
            'name'     => 'blob',
            'type'     => 'application/octet-stream',
            'tmp_name' => $tempPath,
            'error'    => UPLOAD_ERR_OK,
            'size'     => filesize($tempPath),
        ];

        $dzuuid = $this->generateUuid();
        
        $result = $this->post('admin/upload/chunk', [
            'dzfilename' => 'malicious.exe',
            'dzuuid' => $dzuuid,
            'dzchunkindex' => 0,
            'dztotalchunkcount' => 1,
            'dztotalfilesize' => filesize($tempPath),
            'storage_type' => 'physical'
        ]);

        $result->assertStatus(400); // Fail
        $respData = json_decode($result->getJSON(), true);
        $errorMsg = $respData['messages']['error'] ?? $respData['error'] ?? '';
        $this->assertStringContainsString('ไม่ได้รับอนุญาตให้อัปโหลด', $errorMsg);

        if (file_exists($tempPath)) {
            unlink($tempPath);
        }
    }

    public function testChunkUploadFolderAndSubfolders(): void
    {
        $this->mockAuth();

        $tempPath = tempnam(sys_get_temp_dir(), 'tst');
        file_put_contents($tempPath, 'fake folder pdf content');

        $_FILES['file'] = [
            'name'     => 'blob',
            'type'     => 'application/pdf',
            'tmp_name' => $tempPath,
            'error'    => UPLOAD_ERR_OK,
            'size'     => filesize($tempPath),
        ];

        $dzuuid = $this->generateUuid();
        
        $result = $this->post('admin/upload/chunk', [
            'dzfilename' => 'manual.pdf',
            'dzuuid' => $dzuuid,
            'dzchunkindex' => 0,
            'dztotalchunkcount' => 1,
            'dztotalfilesize' => filesize($tempPath),
            'storage_type' => 'physical',
            'relative_path' => 'Project/Docs/manual.pdf'
        ]);

        $result->assertStatus(200);
        $respData = json_decode($result->getJSON(), true);
        $this->assertSame('completed', $respData['status']);
        $fileUuid = $respData['file_uuid'];
        $this->assertNotEmpty($fileUuid);

        // Verify folder structure in DB
        $fileModel = new FileModel();
        $containerModel = new FileContainerModel();

        $fileRecord = $fileModel->find($fileUuid);
        $this->assertNotNull($fileRecord);
        $this->assertSame('manual.pdf', $fileRecord['filename']);
        
        $docsFolderId = $fileRecord['container_id'];
        $this->assertNotNull($docsFolderId);
        
        $docsFolder = $containerModel->find($docsFolderId);
        $this->assertNotNull($docsFolder);
        $this->assertSame('Docs', $docsFolder['name']);
        
        $projectFolderId = $docsFolder['parent_id'];
        $this->assertNotNull($projectFolderId);
        
        $projectFolder = $containerModel->find($projectFolderId);
        $this->assertNotNull($projectFolder);
        $this->assertSame('Project', $projectFolder['name']);
        $this->assertNull($projectFolder['parent_id']);

        // Clean up
        $filePath = WRITEPATH . 'uploads/' . $fileUuid;
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        $fileModel->delete($fileUuid, true);
        $containerModel->delete($docsFolderId, true);
        $containerModel->delete($projectFolderId, true);
    }
}
