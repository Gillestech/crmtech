<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Contrat extends Model {
    protected $fillable = ['reference','client_id','type_contrat','date_debut','date_fin','montant','visites_par_an','statut','prochaine_visite'];
    public function client() { return $this->belongsTo(Client::class); }
}
