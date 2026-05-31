<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Technicien;
use Illuminate\Http\Request;

class TechnicienController extends Controller
{
    public function index() {
        return response()->json(Technicien::orderBy('nom')->get());
    }

    public function store(Request $request) {
        $data = $request->validate([
            'nom'          => 'required|string|max:100',
            'specialite'   => 'nullable|string|max:150',
            'statut'       => 'nullable|in:Disponible,Occupé,En intervention',
            'telephone'    => 'nullable|string|max:30',
            'disponibilite'=> 'nullable|integer|min:0|max:100',
        ]);
        $tech = Technicien::create($data);
        return response()->json($tech, 201);
    }

    public function update(Request $request, Technicien $technicien) {
        $data = $request->validate([
            'nom'          => 'sometimes|string|max:100',
            'specialite'   => 'nullable|string|max:150',
            'statut'       => 'nullable|in:Disponible,Occupé,En intervention',
            'telephone'    => 'nullable|string|max:30',
            'disponibilite'=> 'nullable|integer|min:0|max:100',
            'actifs'       => 'nullable|integer|min:0',
            'resolus'      => 'nullable|integer|min:0',
        ]);
        $technicien->update($data);
        return response()->json($technicien);
    }

    public function destroy(Technicien $technicien) {
        $technicien->delete();
        return response()->json(['message' => 'Technicien supprimé']);
    }
}
