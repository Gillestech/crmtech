<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index() {
        return response()->json(Client::orderBy('nom')->get());
    }

    public function store(Request $request) {
        $data = $request->validate([
            'nom'       => 'required|string|max:150',
            'secteur'   => 'nullable|string|max:80',
            'contact'   => 'nullable|string|max:100',
            'email'     => 'nullable|email|max:150',
            'telephone' => 'nullable|string|max:30',
            'ville'     => 'nullable|string|max:80',
            'adresse'   => 'nullable|string|max:200',
            'contrat'   => 'nullable|in:Actif,Expiré,Aucun',
        ]);
        $client = Client::create($data);
        return response()->json($client, 201);
    }

    public function update(Request $request, Client $client) {
        $data = $request->validate([
            'nom'       => 'sometimes|string|max:150',
            'secteur'   => 'nullable|string|max:80',
            'contact'   => 'nullable|string|max:100',
            'email'     => 'nullable|email|max:150',
            'telephone' => 'nullable|string|max:30',
            'ville'     => 'nullable|string|max:80',
            'adresse'   => 'nullable|string|max:200',
            'contrat'   => 'nullable|in:Actif,Expiré,Aucun',
        ]);
        $client->update($data);
        return response()->json($client);
    }

    public function destroy(Client $client) {
        $client->delete();
        return response()->json(['message' => 'Client supprimé']);
    }
}
