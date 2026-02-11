"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface TutorialVideoPlayerProps {
  src?: string;
  poster?: string;
}

export function TutorialVideoPlayer({
  src = "/videos/tutorial.mp4",
  poster,
}: TutorialVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Format time as mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // Volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  // Seek on progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progress = progressRef.current;
    if (!video || !progress) return;

    const rect = progress.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // iOS Safari: use webkit fullscreen on video element
    const videoEl = video as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
      webkitExitFullscreen?: () => void;
    };

    if (videoEl.webkitEnterFullscreen) {
      // iOS Safari path
      videoEl.webkitEnterFullscreen();
    } else if (!document.fullscreenElement) {
      // Standard path for other browsers
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Show controls on interaction
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const onTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(video.currentTime);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [isDragging]);

  // Fullscreen change listener
  useEffect(() => {
    const video = videoRef.current;

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // iOS Safari fullscreen events (on video element)
    const onWebkitFullscreenChange = () => {
      const videoEl = video as HTMLVideoElement & {
        webkitDisplayingFullscreen?: boolean;
      } | null;
      setIsFullscreen(videoEl?.webkitDisplayingFullscreen ?? false);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    video?.addEventListener("webkitbeginfullscreen", onWebkitFullscreenChange);
    video?.addEventListener("webkitendfullscreen", onWebkitFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      video?.removeEventListener("webkitbeginfullscreen", onWebkitFullscreenChange);
      video?.removeEventListener("webkitendfullscreen", onWebkitFullscreenChange);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "ArrowLeft":
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
          break;
        case "ArrowRight":
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, duration]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden border-2 border-gold/40 bg-black shadow-lg shadow-gold/20 group"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Decorative corner ornaments */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold/60 rounded-tl-xl z-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold/60 rounded-tr-xl z-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold/60 rounded-bl-xl z-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold/60 rounded-br-xl z-20 pointer-events-none" />

      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video bg-black cursor-pointer"
        onClick={togglePlay}
        playsInline
        preload="metadata"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gold/20 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Play Overlay (when paused) */}
      {!isPlaying && !isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-10 transition-opacity"
          onClick={togglePlay}
        >
          <button className="relative group/play">
            {/* Outer glow ring */}
            <div className="absolute inset-0 w-24 h-24 -m-2 rounded-full bg-gold/20 animate-pulse" />
            {/* Main play button */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/40 transition-transform group-hover/play:scale-110">
              <svg
                className="w-10 h-10 text-primary-foreground ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12 transition-opacity duration-300 z-20 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="relative h-2 bg-secondary/40 rounded-full cursor-pointer mb-4 overflow-hidden group/progress"
          onClick={handleProgressClick}
        >
          {/* Buffered indicator could go here */}
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light rounded-full transition-all"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-progress-shimmer" />
          </div>
          {/* Hover preview thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gold rounded-full shadow-lg shadow-gold/50 opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-gold/20 hover:bg-gold/40 flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gold ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Time Display */}
          <span className="text-sm font-medieval text-gold/80 min-w-[90px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Volume Controls */}
          <div className="flex items-center gap-2 group/volume">
            <button
              onClick={toggleMute}
              className="w-8 h-8 rounded-full hover:bg-gold/20 flex items-center justify-center transition-colors"
            >
              {isMuted || volume === 0 ? (
                <svg className="w-5 h-5 text-gold/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : volume < 0.5 ? (
                <svg className="w-5 h-5 text-gold/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gold/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
            {/* Volume slider - hidden on mobile, only show on sm+ screens */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="hidden sm:block w-0 group-hover/volume:w-20 transition-all duration-200 accent-gold h-1 cursor-pointer"
            />
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-full hover:bg-gold/20 flex items-center justify-center transition-colors"
          >
            {isFullscreen ? (
              <svg className="w-5 h-5 text-gold/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gold/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Ambient glow (optional, subtle) */}
      <div className="absolute -inset-1 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 rounded-xl -z-10 blur-xl opacity-50" />
    </div>
  );
}
