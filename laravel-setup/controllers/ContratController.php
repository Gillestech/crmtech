<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contrat;
use Illuminate\Http\Request;

class ContratController extends Controller
{
    public function index() {
        return response()->json(
            Contrat::with('client')->orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request) {
        $data = $request->validate([
            'client_id'       => 'nullable|exists:clients,id',
            'type_contrat'    => 'required|string|max:100',
            'date_debut'      => 'nullable|date',
            'date_fin'        => 'nullable|date',
            'montant'         => 'nullable|string|max:30',
            'visites_par_an'  => 'nullable|integer|min:1',
            'statut'          => 'nullable|in:Actif,Expiré',
            'prochaine_visite'=> 'nullable|date',
        ]);
        $data['reference'] = 'CT-' . date('Y') . '-' . str_pad(Contrat::max('id') + 1, 3, '0', STR_PAD_LEFT);
        $contrat = Contrat::create($data);
        return response()->json($contrat->load('client'), 201);
    }

    public function update(Request $request, Contrat $contrat) {
        $data = $request->validate([
            'client_id'       => 'nullable|exists:clients,id',
            'type_contrat'    => 'sometimes|string|max:100',
            'date_debut'      => 'nullable|date',
            'date_fin'        => 'nullable|date',
            'montant'         => 'nullable|string|max:30',
            'visites_par_an'  => 'nullable|integer|min:1',
            'statut'          => 'nullable|in:Actif,Expiré',
            'prochaine_visite'=> 'nullable|date',
        ]);
        $contrat->update($data);
        return response()->json($contrat->load('client'));
    }

    public function destroy(Contrat $contrat) {
        $contrat->delete();
        return response()->json(['message' => 'Contrat supprimé']);
    }
}
