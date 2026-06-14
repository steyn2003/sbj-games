<?php

use App\Models\Game;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected to login', function (string $route) {
    $this->get(route($route))->assertRedirect(route('login'));
})->with(['spy-location', 'forbidden-word']);

test('a user sees their game scoped to the right type', function (string $route, string $component, string $factory) {
    $user = User::factory()->create();

    Game::factory()->for($user)->{$factory}()->create();
    Game::factory()->for($user)->{$factory}()->finished()->create();
    // A game of a different type must not leak into this page.
    Game::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route($route))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component($component)
            ->has('currentGame')
            ->has('history', 1)
        );
})->with([
    ['spy-location', 'spy-location', 'spyLocation'],
    ['forbidden-word', 'forbidden-word', 'forbiddenWord'],
]);

test('a user can start a game of each type', function (string $type) {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('games.store'), ['type' => $type, 'state' => ['phase' => 'reveal']])
        ->assertOk()
        ->assertJsonStructure(['id']);

    expect($user->games()->where('type', $type)->count())->toBe(1);
})->with([Game::TYPE_SPY_LOCATION, Game::TYPE_FORBIDDEN_WORD]);

test('starting a game only replaces unfinished games of the same type', function () {
    $user = User::factory()->create();
    Game::factory()->for($user)->create();
    Game::factory()->for($user)->spyLocation()->create();

    $this->actingAs($user)
        ->postJson(route('games.store'), ['type' => Game::TYPE_SPY_LOCATION, 'state' => ['phase' => 'reveal']])
        ->assertOk();

    expect($user->games()->where('type', Game::TYPE_UNDERCOVER)->where('status', Game::STATUS_IN_PROGRESS)->count())->toBe(1)
        ->and($user->games()->where('type', Game::TYPE_SPY_LOCATION)->where('status', Game::STATUS_IN_PROGRESS)->count())->toBe(1);
});
