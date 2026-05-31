<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Technicien extends Model {
    protected $fillable = ['nom','specialite','actifs','resolus','disponibilite','statut','telephone'];
    public function tickets()      { return $this->hasMany(Ticket::class); }
    public function depannages()   { return $this->hasMany(Depannage::class); }
    public function installations(){ return $this->hasMany(Installation::class); }
}
