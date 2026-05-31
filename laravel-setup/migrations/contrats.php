<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('contrats', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('type_contrat');
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->string('montant')->nullable();
            $table->integer('visites_par_an')->default(1);
            $table->enum('statut', ['Actif','Expiré'])->default('Actif');
            $table->date('prochaine_visite')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('contrats'); }
};
