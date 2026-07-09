<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddFileLinkToMousAndLaws extends Migration
{
    public function __construct()
    {
        $this->DBGroup = (ENVIRONMENT === 'testing' || (is_cli() && in_array('tests', $_SERVER['argv'] ?? []))) ? 'tests' : 'default';
        parent::__construct();
    }

    public function up()
    {
        $fields = [
            'file_uuid' => [
                'type'       => 'VARCHAR',
                'constraint' => 36,
                'null'       => true,
                'after'      => 'id'
            ],
        ];
        $this->forge->addColumn('mous', $fields);
        $this->forge->addColumn('laws', $fields);

        $this->forge->addForeignKey('file_uuid', 'files', 'uuid', 'SET NULL', 'CASCADE');
    }

    public function down()
    {
        $this->forge->dropForeignKey('mous', 'mous_file_uuid_foreign');
        $this->forge->dropForeignKey('laws', 'laws_file_uuid_foreign');
        $this->forge->dropColumn('mous', 'file_uuid');
        $this->forge->dropColumn('laws', 'file_uuid');
    }
}
