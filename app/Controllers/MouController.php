<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\MouModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Debug\Timer;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Database;

class MouController extends BaseController
{
    use ResponseTrait;
    public $data;
    public function __construct()
    {
        $this->data = [
            'agency_name' => 'กองกฎหมาย - สำนักงานปลัดกระทรวงสาธารณสุข กระทรวงสาธารณสุข',
            'agency_name_en' => 'Legal Affairs Division - Office of the Permanent Secretary for Ministry Of Public Health',

            'agency_short_name' => 'กองกฎหมาย สป.สธ.',
            'agency_short_name_en' => 'Legal Affairs Division - OPS MOPH',

            'system_name' => 'คลังข้อมูลเกี่ยวกับบันทึกความร่วมมือหรือบันทึกความเข้าใจ (MoU)',
            'system_name_en' => 'MoU - MOPH Database'
        ];
    }

    /**
     * @param array $mous
     * @return array
     */
    protected function buildGroup(&$mous)
    {
        $groups = [];

        foreach ($mous as $mou) {
            $year = $mou['buddhistyear_effective_from'];
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

    public function index()
    {
        /**
         * @var Timer $benchmark
         */
        $benchmark = service('timer');

        $benchmark->start('mous_groups');
        $mouModel = new MouModel();

        // $db = Database::connect();
        // $data['query'] = $mouModel->withGroups()->getCompiledSelect();
        // $data['result'] = $db->query($data['query'])->getResult();
        $query = $mouModel->withGroups()->get();
        $mous = $query->getResultArray();

        $this->data['mous_groups'] = $this->buildGroup($mous);
        $benchmark->stop('mous_groups');

        $this->data['execution_times'] = $benchmark->getTimers();

        return view('moph-db/mou/index', $this->data);
    }

    public function create()
    {
        /** @var IncomingRequest $request */
        $request = service('request');

        return $this->respond([]);
    }
}
