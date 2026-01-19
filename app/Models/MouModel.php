<?php

namespace App\Models;

use CodeIgniter\Model;

class MouModel extends Model
{
    protected $table            = 'mous';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'full_title',
        'title',
        'entity_name',
        'subjective',
        'effective_from',
        'effective_to',
        'keywords'
    ];

    protected bool $allowEmptyInserts = false;
    protected bool $updateOnlyChanged = true;

    protected array $casts = [];
    protected array $castHandlers = [];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Validation
    protected $validationRules      = [];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    // Callbacks
    protected $allowCallbacks = true;
    protected $beforeInsert   = [];
    protected $afterInsert    = [];
    protected $beforeUpdate   = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    public function withGroups()
    {
        /* return $this->select('mous.*')
            ->select("GROUP_CONCAT(p.id SEPARATOR ',') parties_ids")
            ->select("GROUP_CONCAT(p.name SEPARATOR ' และ ') parties_names")
            ->select("COUNT(p.id) parties_count")
            ->select("YEAR(mous.effective_from) + 543 buddhistyear_effective_from")
            ->select("YEAR(mous.effective_to) + 543 buddhistyear_effective_to")
            ->join('mous_parties mp', 'mous.id = mp.mou_id', 'left')
            ->join('parties p', 'p.id = mp.party_id', 'left')
            ->groupBy('mous.id')
            ->orderBy('buddhistyear_effective_from DESC'); */

        $builder = $this->builder();
        $builder->select('mous.*')
            ->select("GROUP_CONCAT(p.id SEPARATOR ',') parties_ids")
            ->select("GROUP_CONCAT(p.name SEPARATOR ' และ ') parties_names")
            ->select("COUNT(p.id) parties_count")
            ->select("YEAR(effective_from) + 543 buddhistyear_effective_from")
            ->select("YEAR(effective_to) + 543 buddhistyear_effective_to")
            ->join('mous_parties mp', 'mous.id = mp.mou_id', 'left')
            ->join('parties p', 'p.id = mp.party_id', 'left')
            ->orderBy('mous.effective_from DESC');

        return $builder;
    }
}
