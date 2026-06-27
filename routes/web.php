<?php

use App\Http\Controllers\GameController;
use App\Http\Controllers\RaceController;
use Illuminate\Support\Facades\Route;

// Public: Horse Race uses two phones and the second one need not be logged in.
Route::get('horse-race', [RaceController::class, 'index'])->name('horse-race');
Route::get('races', [RaceController::class, 'list'])->name('races.list');
Route::post('races', [RaceController::class, 'store'])->name('races.store');
Route::get('races/{code}', [RaceController::class, 'show'])->name('races.show');
Route::put('races/{code}', [RaceController::class, 'update'])->name('races.update');

Route::middleware('auth')->group(function () {
    Route::get('/', [GameController::class, 'index'])->name('home');
    Route::post('games', [GameController::class, 'store'])->name('games.store');
    Route::put('games/{game}', [GameController::class, 'update'])->name('games.update');

    Route::get('spy-location', [GameController::class, 'spyLocation'])->name('spy-location');
    Route::get('forbidden-word', [GameController::class, 'forbiddenWord'])->name('forbidden-word');

    Route::inertia('pim-pam-pet', 'pim-pam-pet')->name('pim-pam-pet');
    Route::inertia('wie-in-de-groep', 'wie-in-de-groep')->name('wie-in-de-groep');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
