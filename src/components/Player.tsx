import { useEffect, useRef, useState, useCallback } from 'react';
import { Howl } from 'howler';
import { FileRecord } from './FileCard';

interface PlayerProps {
    file: FileRecord | null;
    onClose?: () => void;
}

// Format seconds to mm:ss
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function Player({ file, onClose }: PlayerProps) {
    const howlRef = useRef<Howl | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isLooping, setIsLooping] = useState(false);

    // Cleanup howl on unmount or file change
    const destroyHowl = useCallback(() => {
        if (howlRef.current) {
            howlRef.current.unload();
            howlRef.current = null;
        }
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
    }, []);

    // Load new audio when file changes
    useEffect(() => {
        destroyHowl();

        if (!file) return;

        // Create new Howl instance
        const howl = new Howl({
            src: [`file://${file.path}`],
            html5: true,
            volume: volume,
            loop: isLooping,
            onload: () => {
                setDuration(howl.duration());
            },
            onplay: () => {
                setIsPlaying(true);
            },
            onpause: () => {
                setIsPlaying(false);
            },
            onstop: () => {
                setIsPlaying(false);
                setCurrentTime(0);
            },
            onend: () => {
                if (!isLooping) {
                    setIsPlaying(false);
                    setCurrentTime(0);
                }
            },
        });

        howlRef.current = howl;
        howl.play();

        return () => {
            destroyHowl();
        };
    }, [file?.id]);

    // Update volume when changed
    useEffect(() => {
        if (howlRef.current) {
            howlRef.current.volume(volume);
        }
    }, [volume]);

    // Update loop when changed
    useEffect(() => {
        if (howlRef.current) {
            howlRef.current.loop(isLooping);
        }
    }, [isLooping]);

    // Update current time periodically
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            if (howlRef.current) {
                setCurrentTime(howlRef.current.seek() as number);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!file) return;
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    seek(Math.max(0, currentTime - 5));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    seek(Math.min(duration, currentTime + 5));
                    break;
                case 'l':
                case 'L':
                    setIsLooping(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [file, currentTime, duration]);

    const togglePlay = () => {
        if (!howlRef.current) return;

        if (isPlaying) {
            howlRef.current.pause();
        } else {
            howlRef.current.play();
        }
    };

    const stop = () => {
        if (howlRef.current) {
            howlRef.current.stop();
        }
    };

    const seek = (time: number) => {
        if (howlRef.current) {
            howlRef.current.seek(time);
            setCurrentTime(time);
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent * duration);
    };

    if (!file) return null;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-sonexa-surface/95 backdrop-blur-xl border-t border-sonexa-border z-40">
            {/* Progress bar at top of player */}
            <div
                className="h-1 bg-sonexa-border cursor-pointer group"
                onClick={handleProgressClick}
            >
                <div
                    className="h-full bg-gradient-to-r from-sonexa-primary to-sonexa-secondary transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="px-6 py-3 flex items-center gap-6">
                {/* Track info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Icon */}
                    <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                        ${file.type === 'music'
                            ? 'bg-gradient-to-br from-sonexa-primary/30 to-sonexa-primary/10'
                            : 'bg-gradient-to-br from-sonexa-secondary/30 to-sonexa-secondary/10'
                        }
                    `}>
                        {file.type === 'music' ? (
                            <svg className="w-6 h-6 text-sonexa-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-sonexa-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728" />
                            </svg>
                        )}
                    </div>

                    {/* Title and time */}
                    <div className="min-w-0">
                        <h3 className="font-medium text-white truncate">{file.filename}</h3>
                        <p className="text-xs text-gray-500">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Stop */}
                    <button
                        onClick={stop}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-sonexa-border transition-colors"
                        title="Stop"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" rx="1" />
                        </svg>
                    </button>

                    {/* Play/Pause */}
                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-sonexa-primary hover:bg-sonexa-primary/90 flex items-center justify-center transition-colors"
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    {/* Loop */}
                    <button
                        onClick={() => setIsLooping(!isLooping)}
                        className={`p-2 rounded-lg transition-colors ${isLooping
                                ? 'text-sonexa-primary bg-sonexa-primary/20'
                                : 'text-gray-400 hover:text-white hover:bg-sonexa-border'
                            }`}
                        title={isLooping ? 'Loop On' : 'Loop Off'}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2 w-32">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6l-4 4H4v4h4l4 4V6z" />
                    </svg>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-sonexa-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                </div>

                {/* Close */}
                <button
                    onClick={() => {
                        stop();
                        onClose?.();
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-sonexa-border transition-colors"
                    title="Close"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
