export function playSound() {
}

/**
 * Create the specific path for the sound file with the provided track.
 * @param soundPath generic path of the sound file.
 * @param track number of the track.
 * @param maxTrack total number of tracks.
 * @returns path of the sound file.
 */
export function createSoundPath(
  soundPath: string,
  track: number,
  maxTrack = 1,
) {
  if (track === undefined) {
    return soundPath.replace(
      /{track}/g,
      Math.floor(Math.random() * maxTrack).toString(),
    );
  }
}
