<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Forge;
use CodeIgniter\Database\Migration;

class AddUserDetailToUsersTable extends Migration
{
    protected array $tables;
    protected $fields = [
        'full_name' => [
            'type' => 'VARCHAR',
            'constraint' => 100,
            'null' => true,
        ],
        'job_position_id' => [
            'type' => 'TINYINT',
            'constraint' => 2,
            'unsigned' => true,
            'null' => true,
        ],
        'job_position_level_id' => [
            'type' => 'TINYINT',
            'constraint' => 2,
            'unsigned' => true,
            'null' => true,
        ],
        'job_position_name' => [
            'type' => 'VARCHAR',
            'constraint' => 100,
            'comment' => 'สำหรับกรอกชื่อตำแหน่งอื่น สำหรับตำแหน่งประเภทลูกจ้างชั่วคราว/ประจำ/เหมาบริการ',
            'null' => true,
        ],
        'subdivision_id' => [
            'type' => 'TINYINT',
            'constraint' => 2,
            'unsigned' => true,
            'null' => true,
        ],
    ];
    public function __construct(?Forge $forge = null)
    {
        parent::__construct($forge);

        $this->tables = config('Auth')->tables;
    }
    public function up()
    {
        /**
         *  Create subdivisions Table
         */
        $this->forge->addField([
            'id' => [
                'type' => 'TINYINT',
                'constraint' => 2,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'subdivision_name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'subdivision_en_name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'sequence' => [
                'type' => 'INT',
                'constraint' => 11,
                'default' => 0,
            ],
            'is_publish' => [
                'type' => 'ENUM',
                'constraint' => ['0', '1'],
                'default' => '1',
            ],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->createTable('subdivisions');
        $this->db->table('subdivisions')->insertBatch([
            ['subdivision_name' => 'ภารกิจอำนวยการ'],
            ['subdivision_name' => 'กฎหมายและคดี'],
            ['subdivision_name' => 'นิติกรรมและสัญญา'],
            ['subdivision_name' => 'พัฒนาและปรับปรุงกฎหมาย'],
            ['subdivision_name' => 'ระงับข้อพิพาททางการแพทย์'],
            ['subdivision_name' => 'พัฒนาวิชาการและแผนงาน'],
        ]);

        /**
         *  Create job_positions_types Table
         */
        $this->forge->addField([
            'id' => [
                'type' => 'TINYINT',
                'constraint' => 2,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'job_position_type_name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'job_position_type_en_name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'sequence' => [
                'type' => 'INT',
                'constraint' => 11,
                'default' => 0,
            ],
            'is_publish' => [
                'type' => 'ENUM',
                'constraint' => ['0', '1'],
                'default' => '1',
            ],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->createTable('job_positions_types');
        $this->db->table('job_positions_types')->insertBatch([
            ['job_position_type_name' => 'บริหาร', 'job_position_type_en_name' => 'Executive Positions (S)'],
            ['job_position_type_name' => 'อำนวยการ', 'job_position_type_en_name' => 'Managerial Positions (M)'],
            ['job_position_type_name' => 'วิชาการ', 'job_position_type_en_name' => 'Knowledge Worker Positions (K)'],
            ['job_position_type_name' => 'ทั่วไป', 'job_position_type_en_name' => 'General Positions (O)'],
        ]);

        /**
         *  Create job_positions_levels Table
         */
        $this->forge->addField([
            'id' => [
                'type' => 'TINYINT',
                'constraint' => 2,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'job_position_type_id' => [
                'type' => 'TINYINT',
                'constraint' => 2,
                'unsigned' => true,
            ],
            'job_position_level_name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'job_position_level_en_name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'sequence' => [
                'type' => 'INT',
                'constraint' => 11,
                'default' => 0,
            ],
            'is_publish' => [
                'type' => 'ENUM',
                'constraint' => ['0', '1'],
                'default' => '1',
            ],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addForeignKey('job_position_type_id', 'job_positions_types', 'id');
        $this->forge->createTable('job_positions_levels');
        $this->db->table('job_positions_levels')->insertBatch([
            ['job_position_level_name' => 'ระดับปฏิบัติงาน', 'job_position_level_en_name' => 'Operational Level (O1)', 'job_position_type_id' => 4],
            ['job_position_level_name' => 'ระดับชำนาญงาน', 'job_position_level_en_name' => 'Experienced Level (O2)', 'job_position_type_id' => 4],
            ['job_position_level_name' => 'ระดับอาวุโส', 'job_position_level_en_name' => 'Senior Level (O3)', 'job_position_type_id' => 4],
            ['job_position_level_name' => 'ระดับทักษะพิเศษ', 'job_position_level_en_name' => 'Highly Skilled Level (O4)', 'job_position_type_id' => 4],
            ['job_position_level_name' => 'ระดับปฏิบัติการ', 'job_position_level_en_name' => 'Practitioner Level (K1)', 'job_position_type_id' => 3],
            ['job_position_level_name' => 'ระดับชำนาญการ', 'job_position_level_en_name' => 'Professional Level (K2)', 'job_position_type_id' => 3],
            ['job_position_level_name' => 'ระดับชำนาญการพิเศษ', 'job_position_level_en_name' => 'Senior Professional Level (K3)', 'job_position_type_id' => 3],
            ['job_position_level_name' => 'ระดับเชี่ยวชาญ', 'job_position_level_en_name' => 'Expert Level (K4)', 'job_position_type_id' => 3],
            ['job_position_level_name' => 'ระดับทรงคุณวุฒิ', 'job_position_level_en_name' => 'Advisory Level (K5)', 'job_position_type_id' => 3],
            ['job_position_level_name' => 'ระดับต้น', 'job_position_level_en_name' => 'Primary Level (M1)', 'job_position_type_id' => 2],
            ['job_position_level_name' => 'ระดับสูง', 'job_position_level_en_name' => 'Higher Level (M2)', 'job_position_type_id' => 2],
            ['job_position_level_name' => 'ระดับต้น', 'job_position_level_en_name' => 'Primary Level (S1)', 'job_position_type_id' => 1],
            ['job_position_level_name' => 'ระดับสูง', 'job_position_level_en_name' => 'Higher Level (S2)', 'job_position_type_id' => 1],
        ]);

        /**
         *  Create job_positions Table
         */
        $this->forge->addField([
            'id' => [
                'type' => 'TINYINT',
                'constraint' => 2,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'job_position_type_id' => [
                'type' => 'TINYINT',
                'constraint' => 2,
                'unsigned' => true,
            ],
            'job_position_name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'job_position_en_name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'sequence' => [
                'type' => 'INT',
                'constraint' => 11,
                'default' => 0,
            ],
            'is_publish' => [
                'type' => 'ENUM',
                'constraint' => ['0', '1'],
                'default' => '1',
            ],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addForeignKey('job_position_type_id', 'job_positions_types', 'id');
        $this->forge->createTable('job_positions');
        $this->db->table('job_positions')->insertBatch([
            ['job_position_name' => 'เจ้าพนักงานธุรการ', 'job_position_type_id' => 4],
            ['job_position_name' => 'นักจัดการงานทั่วไป', 'job_position_type_id' => 4],
            ['job_position_name' => 'นักทรัพยากรบุคคล', 'job_position_type_id' => 4],
            ['job_position_name' => 'นักวิเคราะห์นโยบายและแผน', 'job_position_type_id' => 3],
            ['job_position_name' => 'นักวิชาการคอมพิวเตอร์', 'job_position_type_id' => 3],
            ['job_position_name' => 'นักวิชาการเงินและบัญชี', 'job_position_type_id' => 3],
            ['job_position_name' => 'นักวิชาการพัสดุ', 'job_position_type_id' => 3],
            ['job_position_name' => 'นิติกร', 'job_position_type_id' => 3],
            ['job_position_name' => 'ผู้อำนวยการ', 'job_position_type_id' => 2],
        ]);

        /**
         *  Add user's detail fields into users Table
         */
        $this->forge->addColumn($this->tables['users'], $this->fields);
        $this->forge->addForeignKey(array_keys($this->fields)[1], 'job_positions', 'id');
        $this->forge->addForeignKey(array_keys($this->fields)[2], 'job_positions_levels', 'id');
        $this->forge->addForeignKey(array_keys($this->fields)[4], 'subdivisions', 'id');
    }

    public function down()
    {
        $this->forge->dropColumn($this->tables['users'], array_keys($this->fields));
        $this->forge->dropTable('job_positions_levels');
        $this->forge->dropTable('job_positions_types');
        $this->forge->dropTable('job_positions');
        $this->forge->dropTable('subdivisions');
    }
}
