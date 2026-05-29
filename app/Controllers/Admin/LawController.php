<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\LawModel;
use CodeIgniter\HTTP\ResponseInterface;

class LawController extends BaseController
{
    protected $lawModel;

    public function __construct()
    {
        $this->lawModel = new LawModel();
    }

    public function index(): string
    {
        $data = $this->data;
        $data['title'] = 'จัดการกฎหมาย';
        $data['laws'] = $this->lawModel->orderBy('created_at', 'DESC')->findAll();

        return view('admin/laws/index', $data);
    }

    public function new(): string
    {
        $data = $this->data;
        $data['title'] = 'เพิ่มกฎหมายใหม่';

        return view('admin/laws/form', $data);
    }

    public function create()
    {
        if (!$this->validate($this->lawModel->getValidationRules())) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $this->lawModel->insert([
            'file_uuid' => $this->request->getPost('file_uuid'),
            'title'     => $this->request->getPost('title'),
            'law_no'    => $this->request->getPost('law_no'),
            'content'   => $this->request->getPost('content'),
            'status'    => $this->request->getPost('status'),
        ]);

        return redirect()->to('/admin/laws')->with('message', 'บันทึกกฎหมายเรียบร้อยแล้ว');
    }

    public function edit($id): string
    {
        $law = $this->lawModel->find($id);
        if (!$law) {
            throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound();
        }

        $data = $this->data;
        $data['title'] = 'แก้ไขกฎหมาย';
        $data['law'] = $law;

        return view('admin/laws/form', $data);
    }

    public function update($id)
    {
        if (!$this->validate($this->lawModel->getValidationRules())) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $this->lawModel->update($id, [
            'file_uuid' => $this->request->getPost('file_uuid') ?: null,
            'title'     => $this->request->getPost('title'),
            'law_no'    => $this->request->getPost('law_no'),
            'content'   => $this->request->getPost('content'),
            'status'    => $this->request->getPost('status'),
        ]);

        return redirect()->to('/admin/laws')->with('message', 'อัปเดตกฎหมายเรียบร้อยแล้ว');
    }

    public function delete($id)
    {
        $this->lawModel->delete($id);
        return redirect()->to('/admin/laws')->with('message', 'ลบกฎหมายเรียบร้อยแล้ว');
    }
}
