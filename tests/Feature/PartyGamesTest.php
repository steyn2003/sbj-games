<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests cannot reach the party games', function (string $route) {
    $this->get(route($route))->assertRedirect(route('login'));
})->with(['pim-pam-pet', 'wie-in-de-groep']);

test('an authenticated user can open the party games', function (string $route, string $component) {
    $this->actingAs(User::factory()->create())
        ->get(route($route))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component($component));
})->with([
    ['pim-pam-pet', 'pim-pam-pet'],
    ['wie-in-de-groep', 'wie-in-de-groep'],
]);
