<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    /**
     * Show the game, resuming any unfinished game and listing recent history.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $currentGame = $user->games()
            ->where('status', Game::STATUS_IN_PROGRESS)
            ->latest()
            ->first();

        $history = $user->games()
            ->where('status', Game::STATUS_FINISHED)
            ->latest('finished_at')
            ->take(10)
            ->get();

        return Inertia::render('undercover', [
            'currentGame' => $currentGame
                ? ['id' => $currentGame->id, 'state' => $currentGame->state]
                : null,
            'history' => $history->map(fn (Game $game): array => [
                'id' => $game->id,
                'state' => $game->state,
                'finished_at' => $game->finished_at?->toIso8601String(),
            ])->all(),
        ]);
    }

    /**
     * Start (persist) a new game for the user. Any unfinished game is dropped
     * so each player keeps a single resumable game at a time.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateGame($request);

        $request->user()->games()
            ->where('status', Game::STATUS_IN_PROGRESS)
            ->delete();

        $game = $request->user()->games()->create($this->attributesFor($data['state']));

        return response()->json(['id' => $game->id]);
    }

    /**
     * Persist the latest state of an in-progress or just-finished game.
     */
    public function update(Request $request, Game $game): JsonResponse
    {
        abort_unless($game->user_id === $request->user()->id, 403);

        $data = $this->validateGame($request);

        $game->update($this->attributesFor($data['state']));

        return response()->json(['id' => $game->id]);
    }

    /**
     * Validate an incoming game state payload.
     *
     * @return array{state: array<string, mixed>}
     */
    private function validateGame(Request $request): array
    {
        return $request->validate([
            'state' => ['required', 'array'],
            'state.phase' => ['required', 'string'],
        ]);
    }

    /**
     * Build the persisted attributes from a game state payload.
     *
     * @param  array<string, mixed>  $state
     * @return array<string, mixed>
     */
    private function attributesFor(array $state): array
    {
        $finished = ($state['phase'] ?? null) === 'gameover';

        return [
            'state' => $state,
            'status' => $finished ? Game::STATUS_FINISHED : Game::STATUS_IN_PROGRESS,
            'finished_at' => $finished ? now() : null,
        ];
    }
}
