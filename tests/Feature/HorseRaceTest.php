<?php

use App\Models\Race;

test('the horse race page is reachable without logging in', function () {
    $this->get('/horse-race')->assertOk();
});

test('the board creates a race and gets a join code', function () {
    $response = $this->postJson('/races');

    $response->assertOk()
        ->assertJsonPath('state.phase', 'lobby');

    $code = $response->json('code');

    expect($code)->toBeString();
    expect(Race::where('code', $code)->exists())->toBeTrue();
});

test('the dealer can read and write the shared state by code', function () {
    $code = $this->postJson('/races')->json('code');

    $state = ['phase' => 'racing', 'positions' => ['hearts' => 3]];

    $this->putJson("/races/{$code}", ['state' => $state])
        ->assertOk()
        ->assertJsonPath('state.phase', 'racing');

    $this->getJson("/races/{$code}")
        ->assertOk()
        ->assertJsonPath('state.positions.hearts', 3);
});

test('a started race shows up in the list for the board to join, finished ones do not', function () {
    $open = $this->postJson('/races')->json('code');

    $done = $this->postJson('/races')->json('code');
    $this->putJson("/races/{$done}", ['state' => ['phase' => 'finished']]);

    $codes = collect($this->getJson('/races')->json('races'))->pluck('code');

    expect($codes)->toContain($open);
    expect($codes)->not->toContain($done);
});

test('an unknown race code returns not found', function () {
    $this->getJson('/races/NOPE')->assertNotFound();
});

test('a state without a phase is rejected and not stored', function () {
    $code = $this->postJson('/races')->json('code');

    $this->put("/races/{$code}", ['state' => ['positions' => []]])
        ->assertInvalid('state.phase');

    expect(Race::where('code', $code)->first()->state['phase'])->toBe('lobby');
});
