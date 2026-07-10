<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSettingsModeToSettings extends Migration
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
            'key'        => 'settings_mode',
            'value'      => 'system', // 'system' or 'custom'
            'type'       => 'string',
            'context'    => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down()
    {
        $this->db->table('settings')->where('key', 'settings_mode')->delete();
    }
}
