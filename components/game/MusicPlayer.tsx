"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [volume, setVolume] = useState(0.7);
  const [showVolume, setShowVolume] = useState(false);

  // Format time as m:ss
  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Update progress bar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const percent = (audio.currentTime / audio.duration) * 100;
      setProgress(isNaN(percent) ? 0 : percent);
      setCurrentTime(formatTime(audio.currentTime));
    };

    const setAudioDuration = () => {
      setDuration(formatTime(audio.duration));
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, [formatTime]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Outer frame with parchment/gold aesthetic */}
      <div className="relative rounded-xl border-2 border-gold/40 bg-gradient-to-b from-card to-background p-4 shadow-lg shadow-gold/20 overflow-hidden">
        {/* Corner flourishes */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold/60 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold/60 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold/60 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold/60 rounded-br-lg" />

        {/* Animated background glow when playing */}
        {isPlaying && (
          <div className="absolute inset-0 bg-gold/5 animate-music-pulse pointer-events-none" />
        )}

        {/* Title with rune decoration */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span
            className={`text-gold/60 text-sm ${isPlaying ? "animate-rune-spin" : ""}`}
          >
            ✦
          </span>
          <span className="font-display text-sm text-gold tracking-wider">
            Tutorial Soundtrack
          </span>
          <span
            className={`text-gold/60 text-sm ${isPlaying ? "animate-rune-spin" : ""}`}
          >
            ✦
          </span>
        </div>

        {/* Main controls row */}
        <div className="flex items-center gap-3">
          {/* Play/Pause orb button */}
          <button
            onClick={togglePlay}
            className={`
              relative flex-shrink-0 w-12 h-12 rounded-full
              bg-gradient-to-b from-gold to-gold-dark
              border-2 border-gold-light/60
              shadow-lg shadow-gold/30
              flex items-center justify-center
              transition-all duration-200
              hover:scale-105 hover:shadow-gold/50
              active:scale-95
              ${isPlaying ? "animate-orb-glow" : ""}
            `}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {/* Inner glow */}
            <div className="absolute inset-1 rounded-full bg-gradient-to-b from-gold-light/30 to-transparent" />

            {/* Icon */}
            <span className="relative text-primary-foreground text-lg">
              {isPlaying ? "❚❚" : "▶"}
            </span>
          </button>

          {/* Progress section */}
          <div className="flex-1 min-w-0">
            {/* Progress bar */}
            <div
              className="relative h-3 bg-secondary/50 rounded-full cursor-pointer overflow-hidden border border-gold/20"
              onClick={handleSeek}
            >
              {/* Progress fill with shimmer */}
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer effect */}
                {isPlaying && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-progress-shimmer" />
                )}
              </div>

              {/* Playhead knob */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gold-light rounded-full shadow-md border border-gold/60 transition-all duration-100"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            {/* Time display */}
            <div className="flex justify-between mt-1 text-xs font-medieval text-muted-foreground">
              <span>{currentTime}</span>
              <span>{duration}</span>
            </div>
          </div>

          {/* Volume control */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowVolume(!showVolume)}
              className="w-8 h-8 flex items-center justify-center text-gold/70 hover:text-gold transition-colors"
              aria-label="Volume"
            >
              {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </button>

            {/* Volume slider popup */}
            {showVolume && (
              <div className="absolute bottom-full right-0 mb-2 p-3 bg-card rounded-lg border border-gold/30 shadow-lg shadow-gold/10">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-2 appearance-none bg-secondary/50 rounded-full cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:bg-gold
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:border
                    [&::-webkit-slider-thumb]:border-gold-light/60
                  "
                />
              </div>
            )}
          </div>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} src="/audio/soundtrack_song.mp3" loop preload="metadata" />
      </div>
    </div>
  );
}
