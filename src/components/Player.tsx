import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';

interface PlayerProps {
  file: any | null;
}

const Player: React.FC<PlayerProps> = ({ file }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [progress, setProgress] = useState(0);
  const soundRef = useRef<Howl | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.unload();
    }

    if (file) {
      const sound = new Howl({
        src: [file.path],
        html5: true,
        loop: isLooping,
        onplay: () => {
          setIsPlaying(true);
          intervalRef.current = window.setInterval(() => {
            setProgress(sound.seek() / sound.duration());
          }, 100);
        },
        onpause: () => {
          setIsPlaying(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        },
        onend: () => {
          setIsPlaying(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        },
      });
      soundRef.current = sound;
      sound.play();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [file]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.loop(isLooping);
    }
  }, [isLooping]);

  const togglePlay = () => {
    if (soundRef.current) {
      if (isPlaying) {
        soundRef.current.pause();
      } else {
        soundRef.current.play();
      }
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (soundRef.current) {
      const seekTime = parseFloat(event.target.value) * soundRef.current.duration();
      soundRef.current.seek(seekTime);
      setProgress(parseFloat(event.target.value));
    }
  };

  if (!file) {
    return <div className="w-96 bg-gray-100 p-4">Select a file to play</div>;
  }

  return (
    <div className="w-96 bg-gray-100 p-4">
      <h3 className="font-bold">{file.filename}</h3>
      <div className="flex items-center space-x-4 mt-4">
        <button onClick={togglePlay} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <input type="range" min="0" max="1" step="0.01" value={progress} onChange={handleSeek} className="w-full" />
        <button onClick={() => setIsLooping(!isLooping)} className={`font-bold py-2 px-4 rounded ${isLooping ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
          Loop
        </button>
      </div>
    </div>
  );
};

export default Player;
