<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Client extends Model {
    protected $fillable = ['nom','secteur','contact','email','telephone','ville','adresse','nb_tickets','contrat'];
    public function tickets()      { return $this->hasMany(Ticket::class); }
    public function depannages()   { return $this->hasMany(Depannage::class); }
    public function installations(){ return $this->hasMany(Installation::class); }
    public function contrats()     { return $this->hasMany(Contrat::class); }
}
