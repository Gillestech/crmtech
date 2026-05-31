<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installation;
use Illuminate\Http\Request;

class InstallationController extends Controller
{
    public function index() {
        return response()->json(
            Installation::with(['client','technicien'])->orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request) {
        $data = $request->validate([
            'titre'         => 'required|string|max:200',
            'client_id'     => 'nullable|exists:clients,id',
            'technicien_id' => 'nullable|exists:techniciens,id',
            'equipement'    => 'nullable|string|max:200',
            'statut'        => 'nullable|in:Planifié,En cours,Résolu,Annulé',
            'date_debut'    => 'nullable|date',
            'date_fin'      => 'nullable|date',
            'avancement'    => 'nullable|integer|min:0|max:100',
        ]);
        $data['reference'] = 'IN-' . str_pad(Installation::max('id') + 1, 3, '0', STR_PAD_LEFT);
        $inst = Installation::create($data);
        return response()->json($inst->load(['client','technicien']), 201);
    }

    public function update(Request $request, Installation $installation) {
        $data = $request->validate([
            'titre'         => 'sometimes|string|max:200',
            'client_id'     => 'nullable|exists:clients,id',
            'technicien_id' => 'nullable|exists:techniciens,id',
            'equipement'    => 'nullable|string|max:200',
            'statut'        => 'nullable|in:Planifié,En cours,Résolu,Annulé',
            'date_debut'    => 'nullable|date',
            'date_fin'      => 'nullable|date',
            'avancement'    => 'nullable|integer|min:0|max:100',
        ]);
        $installation->update($data);
        return response()->json($installation->load(['client','technicien']));
    }

    public function destroy(Installation $installation) {
        $installation->delete();
        return response()->json(['message' => 'Installation supprimée']);
    }
}
