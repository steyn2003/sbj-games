<?php

namespace App\Http\Controllers;

use App\Models\Race;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Horse Race needs two phones: a board that shows the track and a dealer that
 * flips cards. They share one {@see Race} row, looked up by a short code. The
 * dealer is the single writer; the board only polls {@see show()}.
 */
class RaceController extends Controller
{
    /**
     * Render the (public, login-free) game page so a second phone can join.
     */
    public function index(): Response
    {
        return Inertia::render('horse-race');
    }

    /**
     * Recent, unfinished races the board can join. The dealer (leading phone)
     * starts a race; it then shows up here for the board to pick.
     */
    public function list(): JsonResponse
    {
        $races = Race::where('created_at', '>=', now()->subHours(2))
            ->latest()
            ->take(30)
            ->get()
            ->filter(fn (Race $race): bool => ($race->state['phase'] ?? 'lobby') !== 'finished')
            ->take(12)
            ->map(fn (Race $race): array => [
                'code' => $race->code,
                'phase' => $race->state['phase'] ?? 'lobby',
                'players' => count($race->state['bets'] ?? []),
            ])
            ->values();

        return response()->json(['races' => $races]);
    }

    /**
     * Create a fresh race room and return its join code. The dealer calls this.
     */
    public function store(): JsonResponse
    {
        $race = Race::create([
            'code' => $this->freshCode(),
            'state' => ['phase' => 'lobby'],
        ]);

        return response()->json(['code' => $race->code, 'state' => $race->state]);
    }

    /**
     * Return the current state for polling. 404 lets the board show "race weg".
     */
    public function show(string $code): JsonResponse
    {
        $race = Race::where('code', $code)->firstOrFail();

        return response()->json(['state' => $race->state]);
    }

    /**
     * Persist the dealer's latest state snapshot.
     */
    public function update(Request $request, string $code): JsonResponse
    {
        $request->validate([
            'state' => ['required', 'array'],
            'state.phase' => ['required', 'string'],
        ]);

        $race = Race::where('code', $code)->firstOrFail();
        $race->update(['state' => $request->input('state')]);

        return response()->json(['state' => $race->state]);
    }

    /**
     * A short, unused join code. Random(4) keeps it easy to read aloud.
     */
    private function freshCode(): string
    {
        do {
            $code = Str::upper(Str::random(4));
        } while (Race::where('code', $code)->exists());

        return $code;
    }
}
