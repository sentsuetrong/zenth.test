<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\MouModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Debug\Timer;
use CodeIgniter\HTTP\IncomingRequest;

class MouController extends BaseController
{
    use ResponseTrait;

    public function index()
    {
        /**
         * @var Timer $benchmark
         */
        $benchmark = service('timer');

        $benchmark->start('mous_groups');
        $mouModel = new MouModel();

        // Handle search
        $searchTerm = $this->request->getVar('q');
        $builder = $mouModel->withGroups();

        if ($searchTerm) {
            $builder->groupStart()
                ->like('mous.title', $searchTerm)
                ->orLike('mous.full_title', $searchTerm)
                ->orLike('mous.keywords', $searchTerm)
                ->groupEnd();
        }

        $query = $builder->get();
        $mous = $query->getResultArray();

        $this->data['mous_groups'] = $this->buildGroup($mous);
        $this->data['search_term'] = $searchTerm;
        
        $benchmark->stop('mous_groups');

        $this->data['execution_times'] = $benchmark->getTimers();

        return view('moph-db/mou/index', $this->data);
    }

    /**
     * @param array $mous
     * @return array
     */
    protected function buildGroup(&$mous)
    {
        $groups = [];

        foreach ($mous as $mou) {
            $year = $mou['buddhistyear_effective_from'] ?? 'ไม่ระบุ';
            $mou_id = $mou['id'];

            if (!isset($groups[$year])) {
                $groups[$year] = [];
            }

            if (!isset($groups[$year][$mou_id])) {
                $groups[$year][$mou_id] = $mou;
            }
        }

        return $groups;
    }

    public function show(int $id)
    {
        $mouModel = new MouModel();
        $mou = $mouModel->findWithParties($id);

        if (!$mou) {
            return redirect()->to(site_url('moph-db/mou'))->with('error', 'ไม่พบข้อมูล MOU');
        }

        $this->data['mou'] = $mou;
        $this->data['title'] = $mou['title'] ?: 'รายละเอียด MOU';

        return view('moph-db/mou/view', $this->data);
    }
}
