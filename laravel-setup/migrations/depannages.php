<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('depannages', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('description');
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('technicien_id')->nullable()->constrained('techniciens')->nullOnDelete();
            $table->string('equipement')->nullable();
            $table->enum('priorite', ['Urgent','Haute','Normale','Basse'])->default('Normale');
            $table->enum('statut', ['En cours','Résolu','Annulé'])->default('En cours');
            $table->date('date_intervention')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('depannages'); }
};
