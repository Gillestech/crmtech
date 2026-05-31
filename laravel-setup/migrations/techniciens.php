<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('techniciens', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('specialite')->nullable();
            $table->integer('actifs')->default(0);
            $table->integer('resolus')->default(0);
            $table->integer('disponibilite')->default(100); // pourcentage
            $table->enum('statut', ['Disponible','Occupé','En intervention'])->default('Disponible');
            $table->string('telephone')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('techniciens'); }
};
