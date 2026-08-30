<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected to login from the home page', function () {
    $this->get(route('home'))->assertRedirect(route('login'));
});

test('the home page is the game menu', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('dashboard'));
});
