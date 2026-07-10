<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddChunkSizeToSettings extends Migration
{
    public function __construct()
    {
        $this->DBGroup = (ENVIRONMENT === 'testing' || (is_cli() && in_array('tests', $_SERVER['argv'] ?? []))) ? 'tests' : 'default';
        parent::__construct();
    }

    public function up()
    {
        $now = date('Y-m-d H:i:s');
        $this->db->table('settings')->insert([
            'class'      => 'Config\Settings',
            'key'        => 'chunk_size',
            'value'      => '512', // 512 KB
            'type'       => 'string',
            'context'    => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down()
    {
        $this->db->table('settings')->where('key', 'chunk_size')->delete();
    }
}
