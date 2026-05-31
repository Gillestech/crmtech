<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Installation extends Model {
    protected $fillable = ['reference','titre','client_id','technicien_id','equipement','statut','date_debut','date_fin','avancement'];
    public function client()     { return $this->belongsTo(Client::class); }
    public function technicien() { return $this->belongsTo(Technicien::class); }
}
