<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    /**
     * Show the Undercover game, resuming any unfinished game and listing history.
     */
    public function index(Request $request): Response
    {
        return $this->renderGame($request, Game::TYPE_UNDERCOVER, 'undercover');
    }

    /**
     * Show the Spy Location game.
     */
    public function spyLocation(Request $request): Response
    {
        return $this->renderGame($request, Game::TYPE_SPY_LOCATION, 'spy-location');
    }

    /**
     * Show the Forbidden Word game.
     */
    public function forbiddenWord(Request $request): Response
    {
        return $this->renderGame($request, Game::TYPE_FORBIDDEN_WORD, 'forbidden-word');
    }

    /**
     * Start (persist) a new game for the user. Any unfinished game of the same
     * type is dropped so each player keeps a single resumable game per game.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateGame($request, withType: true);

        $request->user()->games()
            ->where('type', $data['type'])
            ->where('status', Game::STATUS_IN_PROGRESS)
            ->delete();

        $game = $request->user()->games()->create([
            'type' => $data['type'],
            ...$this->attributesFor($data['state']),
        ]);

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
     * Render a game page with its resumable game and recent history, scoped to
     * the given game type.
     */
    private function renderGame(Request $request, string $type, string $page): Response
    {
        $user = $request->user();

        $currentGame = $user->games()
            ->where('type', $type)
            ->where('status', Game::STATUS_IN_PROGRESS)
            ->latest()
            ->first();

        $history = $user->games()
            ->where('type', $type)
            ->where('status', Game::STATUS_FINISHED)
            ->latest('finished_at')
            ->take(10)
            ->get();

        return Inertia::render($page, [
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
     * Validate an incoming game state payload.
     *
     * @return array{type: string, state: array<string, mixed>}
     */
    private function validateGame(Request $request, bool $withType = false): array
    {
        $rules = [
            'state' => ['required', 'array'],
            'state.phase' => ['required', 'string'],
        ];

        if ($withType) {
            $rules['type'] = ['required', Rule::in(Game::TYPES)];
        }

        return $request->validate($rules);
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
