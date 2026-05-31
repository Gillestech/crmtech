<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('installations', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('titre');
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('technicien_id')->nullable()->constrained('techniciens')->nullOnDelete();
            $table->string('equipement')->nullable();
            $table->enum('statut', ['Planifié','En cours','Résolu','Annulé'])->default('Planifié');
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->integer('avancement')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('installations'); }
};
