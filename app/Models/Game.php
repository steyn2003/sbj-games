<?php

namespace App\Models;

use Database\Factories\GameFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $type
 * @property string $status
 * @property array<string, mixed> $state
 * @property Carbon|null $finished_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['type', 'status', 'state', 'finished_at'])]
class Game extends Model
{
    /** @use HasFactory<GameFactory> */
    use HasFactory;

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_FINISHED = 'finished';

    public const TYPE_UNDERCOVER = 'undercover';

    public const TYPE_SPY_LOCATION = 'spy-location';

    public const TYPE_FORBIDDEN_WORD = 'forbidden-word';

    /**
     * The game types that can be persisted.
     *
     * @var list<string>
     */
    public const TYPES = [
        self::TYPE_UNDERCOVER,
        self::TYPE_SPY_LOCATION,
        self::TYPE_FORBIDDEN_WORD,
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'state' => 'array',
            'finished_at' => 'datetime',
        ];
    }
}
