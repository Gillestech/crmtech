<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('secteur')->nullable();
            $table->string('contact')->nullable();
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->string('ville')->nullable();
            $table->string('adresse')->nullable();
            $table->integer('nb_tickets')->default(0);
            $table->enum('contrat', ['Actif','Expiré','Aucun'])->default('Aucun');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('clients'); }
};
