<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Depannage extends Model {
    protected $fillable = ['reference','description','client_id','technicien_id','equipement','priorite','statut','date_intervention'];
    public function client()     { return $this->belongsTo(Client::class); }
    public function technicien() { return $this->belongsTo(Technicien::class); }
}
