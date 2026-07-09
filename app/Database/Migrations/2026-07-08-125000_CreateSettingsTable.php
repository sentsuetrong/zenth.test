<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSettingsTable extends Migration
{
    public function __construct()
    {
        $this->DBGroup = (ENVIRONMENT === 'testing' || (is_cli() && in_array('tests', $_SERVER['argv'] ?? []))) ? 'tests' : 'default';
        parent::__construct();
    }

    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'class' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'default'    => 'Config\Settings',
            ],
            'key' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'value' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'type' => [
                'type'       => 'VARCHAR',
                'constraint' => 31,
                'default'    => 'string',
            ],
            'context' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addKey('key');
        $this->forge->createTable('settings', true);

        // Insert initial configuration settings
        $now = date('Y-m-d H:i:s');
        $this->db->table('settings')->insertBatch([
            [
                'class'      => 'Config\Settings',
                'key'        => 'date_format',
                'value'      => 'be', // Buddhist Era (พ.ศ.)
                'type'       => 'string',
                'context'    => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'class'      => 'Config\Settings',
                'key'        => 'allowed_extensions',
                'value'      => 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg,gif,webp,mp4,webm,mp3,wav,ogg',
                'type'       => 'string',
                'context'    => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'class'      => 'Config\Settings',
                'key'        => 'max_file_size',
                'value'      => '10', // 10MB
                'type'       => 'string',
                'context'    => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'class'      => 'Config\Settings',
                'key'        => 'max_multiple_upload',
                'value'      => '10',
                'type'       => 'string',
                'context'    => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'class'      => 'Config\Settings',
                'key'        => 'default_storage_type',
                'value'      => 'database', // 'database' or 'physical'
                'type'       => 'string',
                'context'    => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'class'      => 'Config\Settings',
                'key'        => 'system_name',
                'value'      => 'ระบบคลังข้อมูลกฎหมายและบันทึกความร่วมมือ',
                'type'       => 'string',
                'context'    => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'class'      => 'Config\Settings',
                'key'        => 'agency_short_name',
                'value'      => 'กองกฎหมาย สป.มธ.',
                'type'       => 'string',
                'context'    => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);
    }

    public function down()
    {
        $this->forge->dropTable('settings');
    }
}
