<?php

namespace App\Controllers\MophDB;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

use App\Models\LawModel;

class LawsController extends BaseController
{
    use ResponseTrait;

    public function index()
    {
        // Update metadata for this specific module
        if (empty($this->data['system_name'])) {
            $this->data['system_name'] = 'คลังข้อมูลกฎหมายและระเบียบกระทรวงสาธารณสุข';
        }
        $this->data['system_name_en'] = 'Public Health Laws Database';

        $lawModel = new LawModel();
        
        // Basic pagination
        $this->data['laws'] = $lawModel->where('status', 'active')->orderBy('created_at', 'DESC')->paginate(20);
        $this->data['pager'] = $lawModel->pager;

        return view('moph-db/laws/index', $this->data);
    }

    public function search()
    {
        $term = $this->request->getGet('q');
        if (!$term) {
            return redirect()->to(site_url('moph-db/laws'));
        }

        $lawModel = new LawModel();
        $this->data['laws'] = $lawModel->search($term)->paginate(20);
        $this->data['pager'] = $lawModel->pager;
        $this->data['search_term'] = $term;

        return view('moph-db/laws/index', $this->data);
    }

    public function show(int $id)
    {
        $lawModel = new LawModel();
        $law = $lawModel->find($id);

        if (!$law) {
            return redirect()->to(site_url('moph-db/laws'))->with('error', 'ไม่พบข้อมูลกฎหมาย');
        }

        $this->data['law'] = $law;
        $this->data['title'] = $law['title'] ?: 'รายละเอียดกฎหมาย';

        return view('moph-db/laws/view', $this->data);
    }
}
