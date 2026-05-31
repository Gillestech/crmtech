<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function index() {
        return response()->json(
            Ticket::with(['client','technicien'])->orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request) {
        $data = $request->validate([
            'sujet'         => 'required|string|max:200',
            'client_id'     => 'nullable|exists:clients,id',
            'technicien_id' => 'nullable|exists:techniciens,id',
            'priorite'      => 'nullable|in:Urgent,Haute,Normale,Basse',
            'statut'        => 'nullable|in:Ouvert,En cours,Résolu,Annulé',
            'categorie'     => 'nullable|in:Matériel,Logiciel,Réseau,Électrique',
            'date_prevue'   => 'nullable|date',
        ]);
        $data['reference'] = 'TK-' . str_pad(Ticket::max('id') + 1, 3, '0', STR_PAD_LEFT);
        $ticket = Ticket::create($data);
        return response()->json($ticket->load(['client','technicien']), 201);
    }

    public function update(Request $request, Ticket $ticket) {
        $data = $request->validate([
            'sujet'         => 'sometimes|string|max:200',
            'client_id'     => 'nullable|exists:clients,id',
            'technicien_id' => 'nullable|exists:techniciens,id',
            'priorite'      => 'nullable|in:Urgent,Haute,Normale,Basse',
            'statut'        => 'nullable|in:Ouvert,En cours,Résolu,Annulé',
            'categorie'     => 'nullable|in:Matériel,Logiciel,Réseau,Électrique',
            'date_prevue'   => 'nullable|date',
        ]);
        $ticket->update($data);
        return response()->json($ticket->load(['client','technicien']));
    }

    public function destroy(Ticket $ticket) {
        $ticket->delete();
        return response()->json(['message' => 'Ticket supprimé']);
    }
}
