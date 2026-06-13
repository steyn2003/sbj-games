<?php

use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/', [GameController::class, 'index'])->name('home');
    Route::post('games', [GameController::class, 'store'])->name('games.store');
    Route::put('games/{game}', [GameController::class, 'update'])->name('games.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
