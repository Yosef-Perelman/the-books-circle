const scenes = [
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

console.log(scenesWithStartFrames);
