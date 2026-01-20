<?php

namespace App\Database\Seeds;

use App\Models\FileChunkModel;
use App\Models\FileModel;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Database\Seeder;
use CodeIgniter\Shield\Entities\User;
use CodeIgniter\Shield\Models\UserModel;
use Config\Database;
use Michalsn\Uuid\Uuid;

class TestSystemSeeder extends Seeder
{
    protected Uuid $uuid;
    protected BaseConnection $db;

    public function __construct(Database $config, ?BaseConnection $db = null)
    {
        $this->uuid = service('uuid');
        $this->db = Database::connect();

        return parent::__construct($config, $db);
    }
    public function run()
    {
        $this->createAdminUser();
        $folders = $this->createFolderStructure();
        $this->createDummyFiles($folders);
    }

    // 1. สร้าง User Admin (Password: password123)
    private function createAdminUser()
    {
        $userModel = new UserModel();
        $userData = [
            'username' => 'admin',
            'email'    => 'admin@lawsystem.com',
            'password' => 'password123',
            'active'   => 1,
        ];

        $existingUser = $userModel
            ->where('username', $userData['username'])
            ->orWhere('email', $userData['email'])
            ->first();

        if ($existingUser) {
            echo "❌ User is already exists\n";
            return;
        }

        $user = new User($userData);
        $userModel->save($user);

        // กำหนด Group (ถ้าใช้ Group Model ของ Shield)
        $user = $userModel->findById($userModel->getInsertID());
        $user->addGroup('admin');
        $user->addGroup('superadmin'); // ถ้ามี

        echo "✅ Admin User Created: admin@lawsystem.com / password123\n";
    }

    // 2. สร้างโครงสร้าง Folder (Parent -> Child)
    private function createFolderStructure()
    {
        $builder = $this->db->table('file_containers');

        // Root 1: กฎหมาย
        $root1Uuid = $this->uuid->uuid4()->toString();

        $builder->insert([
            'uuid' => $root1Uuid,
            'parent_id' => null,
            'name' => 'เอกสารกฎหมาย',
            'created_at' => date('Y-m-d H:i:s')
        ]);
        $root1Id = $this->db->insertID();

        // Sub-Folder: ปี 2567
        $sub1Uuid = $this->uuid->uuid4()->toString();
        $builder->insert([
            'uuid' => $sub1Uuid,
            'parent_id' => $root1Id,
            'name' => 'ปี 2567',
            'created_at' => date('Y-m-d H:i:s')
        ]);
        $sub1Id = $this->db->insertID();

        // Root 2: ข่าวประชาสัมพันธ์
        $root2Uuid = $this->uuid->uuid4()->toString();
        $builder->insert([
            'uuid' => $root2Uuid,
            'parent_id' => null,
            'name' => 'ข่าวประชาสัมพันธ์ (PR)',
            'created_at' => date('Y-m-d H:i:s')
        ]);

        echo "✅ Folder Structure Created.\n";

        return ['legal_2567' => $sub1Id]; // ส่ง ID กลับไปใช้สร้างไฟล์
    }

    // 3. จำลองไฟล์และแบ่ง Chunk ลง DB
    private function createDummyFiles($folders)
    {
        $fileModel = new FileModel();
        $chunkModel = new FileChunkModel();

        // สร้างข้อมูลจำลอง (Dummy Content) ขนาด 2.5 MB
        // เราจะจำลองว่า Dropzone ส่งมาทีละ 1MB (Chunk Size)
        $dummyContent = str_repeat("Hello World This is Binary Data for Testing... ", 50000); // ~2MB Text

        // Split เป็นชิ้นละ 1MB (1,000,000 bytes)
        $chunks = str_split($dummyContent, 1 * 1000 * 1000);
        $totalSize = strlen($dummyContent);

        // --- Insert Metadata (File) ---
        $fileUuid = $this->uuid->uuid4()->toString();
        $uploadSession = $this->uuid->uuid4()->toString(); // จำลอง Session ID จาก Dropzone

        $fileId = $fileModel->insert([
            'container_id' => $folders['legal_2567'], // ใส่ในโฟลเดอร์ "ปี 2567"
            'uuid' => $fileUuid,
            'upload_session_id' => $uploadSession,
            'filename' => 'test_contract_2024.pdf', // ไฟล์หลอก
            'mime_type' => 'application/pdf',
            'file_size' => $totalSize,
            'is_public' => 0,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        // --- Insert Chunks (Binary) ---
        foreach ($chunks as $index => $chunkData) {
            $chunkModel->insert([
                'file_id' => $fileId,
                'chunk_order' => $index, // 0, 1, 2...
                'chunk_data' => $chunkData
            ]);
        }

        echo "✅ Dummy File Created: test_contract_2024.pdf (Size: $totalSize bytes, Chunks: " . count($chunks) . ")\n";
    }
}
