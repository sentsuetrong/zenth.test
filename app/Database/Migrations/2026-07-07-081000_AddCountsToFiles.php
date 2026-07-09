<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCountsToFiles extends Migration
{
    public function __construct()
    {
        $this->DBGroup = (ENVIRONMENT === 'testing' || (is_cli() && in_array('tests', $_SERVER['argv'] ?? []))) ? 'tests' : 'default';
        parent::__construct();
    }

    public function up()
    {
        $fields = [
            'view_count' => [
                'type'       => 'INT',
                'unsigned'   => true,
                'default'    => 0,
                'null'       => false,
                'after'      => 'is_public'
            ],
            'download_count' => [
                'type'       => 'INT',
                'unsigned'   => true,
                'default'    => 0,
                'null'       => false,
                'after'      => 'view_count'
            ]
        ];

        $this->forge->addColumn('files', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('files', 'view_count');
        $this->forge->dropColumn('files', 'download_count');
    }
}
