<?php

namespace App\Models;

use CodeIgniter\Model;

class LawModel extends Model
{
    protected $table            = 'laws';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'file_uuid',
        'title',
        'law_no',
        'content',
        'status'
    ];

    protected bool $allowEmptyInserts = false;
    protected bool $updateOnlyChanged = true;

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Validation
    protected $validationRules      = [
        'title'   => 'required|min_length[3]|max_length[255]',
        'law_no'  => 'permit_empty|max_length[255]',
        'content' => 'required',
        'status'  => 'required|in_list[active,cancel]'
    ];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    /**
     * Search laws using fulltext index
     */
    public function search(string $term)
    {
        return $this->where("MATCH(title, content) AGAINST(? IN BOOLEAN MODE)", [$term]);
    }
}
