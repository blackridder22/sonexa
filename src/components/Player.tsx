import { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { FileRecord } from './FileCard';

interface PlayerProps {
    file: FileRecord | null;
    onClose?: () => void;
}

export default function Player({ file, onClose }: PlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const howlRef = useRef<Howl | null>(null);
    const animationRef = useRef<number | null>(null);

    // Format time in mm:ss
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Update seek position during playback
    const updateSeek = useCallback(() => {
        if (howlRef.current && isPlaying) {
            const seek = howlRef.current.seek() as number;
            setCurrentTime(seek);
            animationRef.current = requestAnimationFrame(updateSeek);
        }
    }, [isPlaying]);

    // Initialize or update Howl when file changes
    useEffect(() => {
        if (!file) return;

        // Cleanup previous instance
        if (howlRef.current) {
            howlRef.current.unload();
        }

        // Create new Howl instance
        howlRef.current = new Howl({
            src: [`file://${file.path}`],
            html5: true, // Enables streaming for large files
            volume: volume,
            loop: isLooping,
            onload: () => {
                setDuration(howlRef.current?.duration() || 0);
            },
            onplay: () => {
                setIsPlaying(true);
                animationRef.current = requestAnimationFrame(updateSeek);
            },
            onpause: () => {
                setIsPlaying(false);
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            },
            onstop: () => {
                setIsPlaying(false);
                setCurrentTime(0);
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            },
            onend: () => {
                if (!isLooping) {
                    setIsPlaying(false);
                    setCurrentTime(0);
                }
            },
            onloaderror: (id, error) => {
                console.error('Failed to load audio:', error);
            },
        });

        // Auto-play when file changes
        howlRef.current.play();

        return () => {
            if (howlRef.current) {
                howlRef.current.unload();
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [file?.id]); // Only re-initialize when file ID changes

    // Update loop setting
    useEffect(() => {
        if (howlRef.current) {
            howlRef.current.loop(isLooping);
        }
    }, [isLooping]);

    // Update volume
    useEffect(() => {
        if (howlRef.current) {
            howlRef.current.volume(volume);
        }
    }, [volume]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'KeyL':
                    setIsLooping(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const togglePlay = () => {
        if (!howlRef.current) return;

        if (isPlaying) {
            howlRef.current.pause();
        } else {
            howlRef.current.play();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (howlRef.current) {
            howlRef.current.seek(newTime);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(parseFloat(e.target.value));
    };

    if (!file) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-sonexa-darker border-t border-sonexa-border px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center gap-6">
                {/* File info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
            ${file.type === 'music'
                            ? 'bg-gradient-to-br from-sonexa-primary/30 to-sonexa-primary/10'
                            : 'bg-gradient-to-br from-sonexa-secondary/30 to-sonexa-secondary/10'
                        }
          `}>
                        {file.type === 'music' ? (
                            <svg className="w-7 h-7 text-sonexa-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        ) : (
                            <svg className="w-7 h-7 text-sonexa-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
                            </svg>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-medium truncate text-white">{file.filename}</h4>
                        <p className="text-sm text-gray-500">{file.type.toUpperCase()}</p>
                    </div>
                </div>

                {/* Playback controls */}
                <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="flex items-center gap-4">
                        {/* Loop button */}
                        <button
                            onClick={() => setIsLooping(!isLooping)}
                            className={`p-2 rounded-lg transition-colors ${isLooping
                                    ? 'text-sonexa-primary bg-sonexa-primary/20'
                                    : 'text-gray-500 hover:text-white hover:bg-sonexa-surface'
                                }`}
                            title="Loop (L)"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>

                        {/* Play/Pause button */}
                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 rounded-full bg-sonexa-primary hover:bg-sonexa-primary/90 flex items-center justify-center transition-transform hover:scale-105"
                            title="Play/Pause (Space)"
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

                        {/* Stop button */}
                        <button
                            onClick={() => {
                                if (howlRef.current) {
                                    howlRef.current.stop();
                                }
                            }}
                            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-sonexa-surface transition-colors"
                            title="Stop"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6h12v12H6z" />
                            </svg>
                        </button>
                    </div>

                    {/* Seek bar */}
                    <div className="flex items-center gap-3 w-full max-w-md">
                        <span className="text-xs text-gray-500 w-10 text-right">
                            {formatTime(currentTime)}
                        </span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-1 bg-sonexa-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-sonexa-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #6366f1 ${(currentTime / (duration || 1)) * 100}%, #1a1a2e ${(currentTime / (duration || 1)) * 100}%)`
                            }}
                        />
                        <span className="text-xs text-gray-500 w-10">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Volume control */}
                <div className="flex items-center gap-2 w-32">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414" />
                    </svg>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="flex-1 h-1 bg-sonexa-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        style={{
                            background: `linear-gradient(to right, white ${volume * 100}%, #1a1a2e ${volume * 100}%)`
                        }}
                    />
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-sonexa-surface transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
