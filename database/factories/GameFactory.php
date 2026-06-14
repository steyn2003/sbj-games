<?php

namespace Database\Factories;

use App\Models\Game;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Game>
 */
class GameFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => Game::TYPE_UNDERCOVER,
            'status' => Game::STATUS_IN_PROGRESS,
            'finished_at' => null,
            'state' => [
                'localId' => fake()->numberBetween(1, 999999),
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
            ],
        ];
    }

    /**
     * Indicate that the game has finished.
     */
    public function finished(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => Game::STATUS_FINISHED,
            'finished_at' => now(),
            'state' => [...$attributes['state'], 'phase' => 'gameover', 'winner' => 'civilians'],
        ]);
    }

    /**
     * Indicate that the game is a Spy Location game.
     */
    public function spyLocation(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => Game::TYPE_SPY_LOCATION,
            'state' => [
                'localId' => fake()->numberBetween(1, 999999),
                'phase' => 'reveal',
                'players' => [],
                'location' => 'Vliegtuig',
                'revealIndex' => 0,
                'votedId' => null,
                'winner' => null,
                'spyGuessedRight' => false,
            ],
        ]);
    }

    /**
     * Indicate that the game is a Forbidden Word game.
     */
    public function forbiddenWord(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => Game::TYPE_FORBIDDEN_WORD,
            'state' => [
                'localId' => fake()->numberBetween(1, 999999),
                'phase' => 'play',
                'names' => ['Speler 1', 'Speler 2'],
                'scores' => [0, 0],
                'seconds' => 60,
                'totalRounds' => 2,
                'round' => 1,
                'currentPlayer' => 0,
                'turnScore' => 0,
            ],
        ]);
    }
}
