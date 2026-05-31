<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TechnicienController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\DepannageController;
use App\Http\Controllers\Api\InstallationController;
use App\Http\Controllers\Api\ContratController;

Route::apiResource('techniciens',  TechnicienController::class);
Route::apiResource('clients',      ClientController::class);
Route::apiResource('tickets',      TicketController::class);
Route::apiResource('depannages',   DepannageController::class);
Route::apiResource('installations',InstallationController::class);
Route::apiResource('contrats',     ContratController::class);
