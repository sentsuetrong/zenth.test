<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\MouModel;
use App\Models\PartyModel;
use CodeIgniter\HTTP\ResponseInterface;

class MouController extends BaseController
{
    protected $mouModel;
    protected $partyModel;

    public function __construct()
    {
        $this->mouModel = new MouModel();
        $this->partyModel = new PartyModel();
    }

    public function index(): string
    {
        $data = $this->data;
        $data['title'] = 'จัดการ MOU';
        $data['mous'] = $this->mouModel->withGroups()->findAll();

        return view('admin/mou/index', $data);
    }

    public function new(): string
    {
        $data = $this->data;
        $data['title'] = 'เพิ่ม MOU ใหม่';
        $data['parties'] = $this->partyModel->findAll();

        return view('admin/mou/form', $data);
    }

    public function create()
    {
        $rules = [
            'title'          => 'required|min_length[3]|max_length[255]',
            'full_title'     => 'required',
            'effective_from' => 'required|valid_date',
            'effective_to'   => 'permit_empty|valid_date',
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $db = \Config\Database::connect();
        $db->transStart();

        $mouId = $this->mouModel->insert([
            'file_uuid'      => $this->request->getPost('file_uuid'),
            'title'          => $this->request->getPost('title'),
            'full_title'     => $this->request->getPost('full_title'),
            'entity_name'    => $this->request->getPost('entity_name') ?: 'กระทรวงสาธารณสุข',
            'objective'      => $this->request->getPost('objective'),
            'effective_from' => $this->request->getPost('effective_from'),
            'effective_to'   => $this->request->getPost('effective_to') ?: null,
            'keywords'       => $this->request->getPost('keywords'),
        ]);

        $parties = $this->request->getPost('parties');
        if ($parties && is_array($parties)) {
            $mouParties = [];
            foreach ($parties as $partyId) {
                $mouParties[] = [
                    'mou_id'   => $mouId,
                    'party_id' => $partyId
                ];
            }
            $db->table('mous_parties')->insertBatch($mouParties);
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            return redirect()->back()->withInput()->with('error', 'ไม่สามารถบันทึกข้อมูลได้');
        }

        return redirect()->to('/admin/mou')->with('message', 'บันทึก MOU เรียบร้อยแล้ว');
    }

    public function edit($id): string
    {
        $mou = $this->mouModel->find($id);
        if (!$mou) {
            throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound();
        }

        $data = $this->data;
        $data['title'] = 'แก้ไข MOU';
        $data['mou'] = $mou;
        $data['parties'] = $this->partyModel->findAll();
        
        // Get currently selected parties
        $db = \Config\Database::connect();
        $selectedParties = $db->table('mous_parties')
            ->where('mou_id', $id)
            ->get()
            ->getResultArray();
        
        $data['selectedParties'] = array_column($selectedParties, 'party_id');

        return view('admin/mou/form', $data);
    }

    public function update($id)
    {
        $rules = [
            'title'          => 'required|min_length[3]|max_length[255]',
            'full_title'     => 'required',
            'effective_from' => 'required|valid_date',
            'effective_to'   => 'permit_empty|valid_date',
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $db = \Config\Database::connect();
        $db->transStart();

        $this->mouModel->update($id, [
            'file_uuid'      => $this->request->getPost('file_uuid') ?: null,
            'title'          => $this->request->getPost('title'),
            'full_title'     => $this->request->getPost('full_title'),
            'entity_name'    => $this->request->getPost('entity_name'),
            'objective'      => $this->request->getPost('objective'),
            'effective_from' => $this->request->getPost('effective_from'),
            'effective_to'   => $this->request->getPost('effective_to') ?: null,
            'keywords'       => $this->request->getPost('keywords'),
        ]);

        // Update parties
        $db->table('mous_parties')->where('mou_id', $id)->delete();
        $parties = $this->request->getPost('parties');
        if ($parties && is_array($parties)) {
            $mouParties = [];
            foreach ($parties as $partyId) {
                $mouParties[] = [
                    'mou_id'   => $id,
                    'party_id' => $partyId
                ];
            }
            $db->table('mous_parties')->insertBatch($mouParties);
        }

        $db->transComplete();

        return redirect()->to('/admin/mou')->with('message', 'อัปเดต MOU เรียบร้อยแล้ว');
    }

    public function delete($id)
    {
        $this->mouModel->delete($id);
        return redirect()->to('/admin/mou')->with('message', 'ลบ MOU เรียบร้อยแล้ว');
    }
}
