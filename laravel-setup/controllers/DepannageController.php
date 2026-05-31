<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Depannage;
use Illuminate\Http\Request;

class DepannageController extends Controller
{
    public function index() {
        return response()->json(
            Depannage::with(['client','technicien'])->orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request) {
        $data = $request->validate([
            'description'      => 'required|string|max:200',
            'client_id'        => 'nullable|exists:clients,id',
            'technicien_id'    => 'nullable|exists:techniciens,id',
            'equipement'       => 'nullable|string|max:150',
            'priorite'         => 'nullable|in:Urgent,Haute,Normale,Basse',
            'statut'           => 'nullable|in:En cours,Résolu,Annulé',
            'date_intervention'=> 'nullable|date',
        ]);
        $data['reference'] = 'DP-' . str_pad(Depannage::max('id') + 1, 3, '0', STR_PAD_LEFT);
        $dep = Depannage::create($data);
        return response()->json($dep->load(['client','technicien']), 201);
    }

    public function update(Request $request, Depannage $depannage) {
        $data = $request->validate([
            'description'      => 'sometimes|string|max:200',
            'client_id'        => 'nullable|exists:clients,id',
            'technicien_id'    => 'nullable|exists:techniciens,id',
            'equipement'       => 'nullable|string|max:150',
            'priorite'         => 'nullable|in:Urgent,Haute,Normale,Basse',
            'statut'           => 'nullable|in:En cours,Résolu,Annulé',
            'date_intervention'=> 'nullable|date',
        ]);
        $depannage->update($data);
        return response()->json($depannage->load(['client','technicien']));
    }

    public function destroy(Depannage $depannage) {
        $depannage->delete();
        return response()->json(['message' => 'Dépannage supprimé']);
    }
}
