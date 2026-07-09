<?php

namespace App\Models;

use CodeIgniter\Model;

class SettingModel extends Model
{
    protected $table            = 'settings';
    protected $primaryKey       = 'key';
    protected $useAutoIncrement = false;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['key', 'value', 'updated_at'];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    private static array $cache = [];

    /**
     * Get a setting value by key, with caching for the request lifecycle
     */
    public function getSetting(string $key, ?string $default = null): ?string
    {
        if (array_key_exists($key, self::$cache)) {
            return self::$cache[$key];
        }

        $setting = $this->find($key);
        $value = $setting ? $setting['value'] : $default;
        self::$cache[$key] = $value;

        return $value;
    }

    /**
     * Save a setting value by key, updating cache
     */
    public function saveSetting(string $key, ?string $value): bool
    {
        $now = date('Y-m-d H:i:s');
        $data = [
            'key'        => $key,
            'value'      => $value,
            'updated_at' => $now,
        ];

        // Use insert or update
        if ($this->find($key)) {
            $result = $this->update($key, $data);
        } else {
            $data['created_at'] = $now;
            $result = $this->insert($data) !== false;
        }

        if ($result) {
            self::$cache[$key] = $value;
        }

        return $result;
    }

    /**
     * Get all settings as a key-value pair array
     */
    public function getAllSettings(): array
    {
        $settings = $this->findAll();
        $list = [];
        foreach ($settings as $setting) {
            $list[$setting['key']] = $setting['value'];
            self::$cache[$setting['key']] = $setting['value'];
        }
        return $list;
    }
}
