import { Composition, staticFile, Sequence, Audio, Video, Freeze } from "remotion";
import { useEffect, useState } from "react";
import { getVideoMetadata } from "@remotion/media-utils";

// Fixed durations for the 4 scenes. The fallback lengths (in frames at 30fps)
// will be used initially, but we can just use static durations if we know them.
// Let's assume lengths that fit the audio for now. (1 frame = 1/30 second)

export const MyComposition = () => {
  return (
    <Composition
      id="Trailer"
      component={Trailer}
      durationInFrames={6394} // Total sum of frames
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

const scenes = [
  // videoFrames are derived from exact durations. 
  // scene1 duration is unknown (N/A), estimated at 6 seconds based on file size (180 frames)
  { id: 'scene1', videoFrames: 1362, audioFrames: 1299 },
  { id: 'scene2', videoFrames: 1725, audioFrames: 1199 },
  { id: 'scene3', videoFrames: 2187, audioFrames: 1512 },
  { id: 'scene4', videoFrames: 1120, audioFrames: 818 },
];

const scenesWithStartFrames = scenes.map((scene, index) => {
  const duration = Math.max(scene.videoFrames, scene.audioFrames);
  const startFrame = scenes.slice(0, index).reduce((acc, s) => acc + Math.max(s.videoFrames, s.audioFrames), 0);
  return { ...scene, duration, startFrame };
});

export const Trailer: React.FC = () => {
  return (
    <div style={{ flex: 1, backgroundColor: "black" }}>
      {scenesWithStartFrames.map((scene) => {
        const isVideoShorter = scene.videoFrames < scene.duration;

        return (
          <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.duration}>
            {/* The active video part */}
            <Sequence from={0} durationInFrames={isVideoShorter ? scene.videoFrames : scene.duration}>
              <Video 
                src={staticFile(`${scene.id}.webm`)} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                volume={0}
              />
            </Sequence>
            
            {/* The frozen frame for the remainder of the audio */}
            {isVideoShorter && (
              <Sequence from={scene.videoFrames} durationInFrames={scene.duration - scene.videoFrames}>
                <Freeze frame={scene.videoFrames - 1}>
                  <Video 
                    src={staticFile(`${scene.id}.webm`)} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    volume={0}
                  />
                </Freeze>
              </Sequence>
            )}
            
            <Audio src={staticFile(`${scene.id}.mp3`)} />
          </Sequence>
        );
      })}
    </div>
  );
};
