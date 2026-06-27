<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A shared horse-race room joined by code. The board phone polls it; the dealer
 * phone owns the game logic and pushes the full state on every action.
 *
 * @property int $id
 * @property string $code
 * @property array<string, mixed> $state
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['code', 'state'])]
class Race extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'state' => 'array',
        ];
    }
}
