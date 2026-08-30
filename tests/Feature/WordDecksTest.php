<?php

/**
 * The card decks live in TypeScript; these tests read the source so a
 * duplicated or malformed card is caught before it reaches a game night.
 */
const DECK_STRING = "(?:'((?:[^'\\\\]|\\\\.)*)'|\"((?:[^\"\\\\]|\\\\.)*)\")";

/**
 * @param  list<string>  $match
 */
function deckString(array $match, int $offset): string
{
    return $match[$offset] !== '' ? $match[$offset] : ($match[$offset + 1] ?? '');
}

/**
 * @return list<string>
 */
function deckWords(string $file): array
{
    $source = file_get_contents(resource_path("js/lib/{$file}"));

    preg_match_all('/\bword: '.DECK_STRING.'/', $source, $matches, PREG_SET_ORDER);

    return array_map(fn (array $match): string => deckString($match, 1), $matches);
}

test('every card in a deck is unique', function (string $file) {
    $words = deckWords($file);
    $lowercased = array_map(fn (string $word): string => mb_strtolower($word), $words);
    $duplicates = array_keys(array_filter(array_count_values($lowercased), fn (int $count): bool => $count > 1));

    expect($duplicates)->toBe([])
        ->and($words)->not->toBeEmpty();
})->with(['forbidden-word.ts', 'charades.ts']);

test('the decks are large enough for a full game without repeats', function (string $file, int $minimum) {
    // Four players, two turns each, ~20 cards a turn — the deck must cover more than that.
    expect(count(deckWords($file)))->toBeGreaterThanOrEqual($minimum);
})->with([
    ['forbidden-word.ts', 500],
    ['charades.ts', 300],
]);

test('forbidden word cards never forbid their own word', function () {
    $source = file_get_contents(resource_path('js/lib/forbidden-word.ts'));

    preg_match_all('/\bword: '.DECK_STRING.',\s*forbidden: \[([^\]]*)\]/', $source, $matches, PREG_SET_ORDER);

    expect($matches)->toHaveCount(count(deckWords('forbidden-word.ts')));

    foreach ($matches as $match) {
        $word = deckString($match, 1);

        preg_match_all('/'.DECK_STRING.'/', $match[3], $forbiddenMatches, PREG_SET_ORDER);
        $forbidden = array_map(fn (array $forbiddenMatch): string => deckString($forbiddenMatch, 1), $forbiddenMatches);

        expect($forbidden)->toHaveCount(4, "{$word} must have exactly four forbidden words")
            ->and(array_map('mb_strtolower', $forbidden))->not->toContain(mb_strtolower($word));
    }
});
