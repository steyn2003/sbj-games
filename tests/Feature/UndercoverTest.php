<?php

use App\Models\Game;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected to login', function () {
    $this->get(route('home'))->assertRedirect(route('login'));
});

test('an authenticated user sees the game with resume and history props', function () {
    $user = User::factory()->create();

    Game::factory()->for($user)->create();
    Game::factory()->for($user)->finished()->create();

    $this->actingAs($user)
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('undercover')
            ->has('currentGame')
            ->has('history', 1)
        );
});

test('a user can start a new game', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('games.store'), ['type' => Game::TYPE_UNDERCOVER, 'state' => sampleState()])
        ->assertOk()
        ->assertJsonStructure(['id']);

    expect($user->games()->where('status', Game::STATUS_IN_PROGRESS)->count())->toBe(1);
});

test('starting a new game requires a known type', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('games.store'), ['type' => 'bogus', 'state' => sampleState()])
        ->assertSessionHasErrors('type');

    expect($user->games()->count())->toBe(0);
});

test('starting a new game replaces any unfinished game of the same type', function () {
    $user = User::factory()->create();
    Game::factory()->for($user)->create();

    $this->actingAs($user)
        ->postJson(route('games.store'), ['type' => Game::TYPE_UNDERCOVER, 'state' => sampleState()])
        ->assertOk();

    expect($user->games()->where('status', Game::STATUS_IN_PROGRESS)->count())->toBe(1);
});

test('updating to a gameover state marks the game finished', function () {
    $user = User::factory()->create();
    $game = Game::factory()->for($user)->create();

    $this->actingAs($user)
        ->putJson(route('games.update', $game), ['state' => sampleState(['phase' => 'gameover'])])
        ->assertOk();

    $game->refresh();

    expect($game->status)->toBe(Game::STATUS_FINISHED)
        ->and($game->finished_at)->not->toBeNull();
});

test('a user cannot update another users game', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $game = Game::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->putJson(route('games.update', $game), ['state' => sampleState()])
        ->assertForbidden();
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function sampleState(array $overrides = []): array
{
    return [
        'localId' => 12345,
        'phase' => 'reveal',
        'round' => 1,
        'players' => [],
        'civilianWord' => 'Koffie',
        'pair' => ['civilian' => 'Koffie', 'undercover' => 'Thee'],
        'revealIndex' => 0,
        'starterId' => null,
        'lastEliminatedId' => null,
        'winner' => null,
        'mrWhiteWon' => false,
        ...$overrides,
    ];
}
