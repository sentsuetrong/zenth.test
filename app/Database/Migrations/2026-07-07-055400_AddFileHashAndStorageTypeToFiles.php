<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddFileHashAndStorageTypeToFiles extends Migration
{
    public function __construct()
    {
        $this->DBGroup = (ENVIRONMENT === 'testing' || (is_cli() && in_array('tests', $_SERVER['argv'] ?? []))) ? 'tests' : 'default';
        parent::__construct();
    }

    public function up()
    {
        $fields = [
            'file_hash' => [
                'type'       => 'VARCHAR',
                'constraint' => 64,
                'null'       => true,
                'after'      => 'filename'
            ],
            'storage_type' => [
                'type'       => 'ENUM',
                'constraint' => ['database', 'physical'],
                'default'    => 'physical',
                'after'      => 'file_hash'
            ]
        ];

        $this->forge->addColumn('files', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('files', 'file_hash');
        $this->forge->dropColumn('files', 'storage_type');
    }
}
