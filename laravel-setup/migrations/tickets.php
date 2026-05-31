<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('sujet');
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('technicien_id')->nullable()->constrained('techniciens')->nullOnDelete();
            $table->enum('priorite', ['Urgent','Haute','Normale','Basse'])->default('Normale');
            $table->enum('statut', ['Ouvert','En cours','Résolu','Annulé'])->default('Ouvert');
            $table->enum('categorie', ['Matériel','Logiciel','Réseau','Électrique'])->default('Matériel');
            $table->date('date_prevue')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('tickets'); }
};
