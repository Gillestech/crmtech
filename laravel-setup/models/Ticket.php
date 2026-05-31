<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model {
    protected $fillable = ['reference','sujet','client_id','technicien_id','priorite','statut','categorie','date_prevue'];
    public function client()     { return $this->belongsTo(Client::class); }
    public function technicien() { return $this->belongsTo(Technicien::class); }
}
